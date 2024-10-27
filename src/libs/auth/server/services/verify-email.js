"use server";

/**
 * @import { SessionValidationResult, SetCookie, GetCookie } from "~/libs/auth/types";
 */

import { z } from "zod";
// import { getCurrentSession } from "~/libs/auth/next-js/server/get-current-session";
import {
  createEmailVerificationRequest,
  deleteEmailVerificationRequestCookie,
  deleteUserEmailVerificationRequest,
  getUserEmailVerificationRequestFromRequest,
  sendVerificationEmail,
} from "~/libs/auth/server/utils/email-verification";
import {
  VERIFY_EMAIL_MESSAGES_ERRORS,
  VERIFY_EMAIL_MESSAGES_SUCCESS,
} from "~/libs/auth/server/utils/constants";
import { updateUserEmailAndSetEmailAsVerifiedRepository } from "~/libs/auth/server/repositories/users";
import { getCurrentSession } from "~/libs/auth/next-js/utils/get-current-session";
import { dateLikeToNumber } from "../utils/dates";
import { deleteAllPasswordResetSessionsForUserRepository } from "../repositories/password-reset";

/**
 * @typedef {{ type: 'error'; statusCode: typeof VERIFY_EMAIL_MESSAGES_ERRORS[keyof typeof VERIFY_EMAIL_MESSAGES_ERRORS]["statusCode"]; message: string; messageCode: typeof VERIFY_EMAIL_MESSAGES_ERRORS[keyof typeof VERIFY_EMAIL_MESSAGES_ERRORS]["code"] }} ActionResultError
 * @typedef {{ type: 'success'; statusCode: typeof VERIFY_EMAIL_MESSAGES_SUCCESS[keyof typeof VERIFY_EMAIL_MESSAGES_SUCCESS]["statusCode"]; message: string; messageCode: typeof VERIFY_EMAIL_MESSAGES_SUCCESS[keyof typeof VERIFY_EMAIL_MESSAGES_SUCCESS]["code"] }} ActionResultSuccess
 *
 * @typedef {ActionResultError | ActionResultSuccess} ActionResult
 */

/**
 *
 * @param {unknown} data
 * @param {{
 *  getCurrentSession: () => Promise<SessionValidationResult>;
 *  getCookie: GetCookie;
 *  setCookie: SetCookie;
 * }} options
 * @returns {Promise<ActionResult>}
 */
export async function verifyEmailUserService(data, options) {
  const input = z
    .object({
      code: z.string().min(6),
    })
    .safeParse(data);

  if (!input.success) {
    return {
      message: "Invalid credentials or missing fields",
      messageCode:
        VERIFY_EMAIL_MESSAGES_ERRORS.INVALID_CREDENTIALS_OR_MISSING_FIELDS.code,
      type: "error",
      statusCode:
        VERIFY_EMAIL_MESSAGES_ERRORS.INVALID_CREDENTIALS_OR_MISSING_FIELDS
          .statusCode,
    };
  }

  const { session, user } = await getCurrentSession();
  if (session === null) {
    return {
      message: "Not authenticated",
      messageCode: VERIFY_EMAIL_MESSAGES_ERRORS.NOT_AUTHENTICATED.code,
      type: "error",
      statusCode: VERIFY_EMAIL_MESSAGES_ERRORS.NOT_AUTHENTICATED.statusCode,
    };
  }
  if (user.registered2FA && !session.twoFactorVerified) {
    return {
      message: "Forbidden",
      messageCode: VERIFY_EMAIL_MESSAGES_ERRORS.FORBIDDEN.code,
      type: "error",
      statusCode: VERIFY_EMAIL_MESSAGES_ERRORS.FORBIDDEN.statusCode,
    };
  }

  let verificationRequest = await getUserEmailVerificationRequestFromRequest(
    options.getCurrentSession,
    options.getCookie,
    options.setCookie,
  );
  if (verificationRequest === null) {
    return {
      message: "Not authenticated",
      messageCode: VERIFY_EMAIL_MESSAGES_ERRORS.NOT_AUTHENTICATED.code,
      type: "error",
      statusCode: VERIFY_EMAIL_MESSAGES_ERRORS.NOT_AUTHENTICATED.statusCode,
    };
  }
  if (typeof input.data.code !== "string") {
    return {
      message: "Invalid or missing fields",
      messageCode: VERIFY_EMAIL_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS.code,
      type: "error",
      statusCode:
        VERIFY_EMAIL_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS.statusCode,
    };
  }
  if (input.data.code === "") {
    return {
      message: "Enter your code",
      messageCode: VERIFY_EMAIL_MESSAGES_ERRORS.ENTER_YOUR_CODE.code,
      type: "error",
      statusCode: VERIFY_EMAIL_MESSAGES_ERRORS.ENTER_YOUR_CODE.statusCode,
    };
  }

  if (Date.now() >= dateLikeToNumber(verificationRequest.expiresAt)) {
    verificationRequest = await createEmailVerificationRequest(
      verificationRequest.userId,
      verificationRequest.email,
    );
    await sendVerificationEmail(
      verificationRequest.email,
      verificationRequest.code,
    );
    return {
      message:
        "The verification code was expired. We sent another code to your inbox.",
      messageCode: VERIFY_EMAIL_MESSAGES_ERRORS.VERIFICATION_CODE_EXPIRED.code,
      type: "error",
      statusCode:
        VERIFY_EMAIL_MESSAGES_ERRORS.VERIFICATION_CODE_EXPIRED.statusCode,
    };
  }
  if (verificationRequest.code !== input.data.code) {
    return {
      message: "Incorrect code.",
      messageCode: VERIFY_EMAIL_MESSAGES_ERRORS.INCORRECT_CODE.code,
      type: "error",
      statusCode: VERIFY_EMAIL_MESSAGES_ERRORS.INCORRECT_CODE.statusCode,
    };
  }

  await Promise.all([
    deleteUserEmailVerificationRequest(user.id),
    deleteAllPasswordResetSessionsForUserRepository(user.id),
    updateUserEmailAndSetEmailAsVerifiedRepository(
      user.id,
      verificationRequest.email,
    ),
  ]);

  deleteEmailVerificationRequestCookie(options.setCookie);

  if (!user.registered2FA) {
    // return redirect("/2fa/setup");
    return {
      message: "Redirecting to 2FA setup",
      messageCode: VERIFY_EMAIL_MESSAGES_ERRORS.TWO_FA_NOT_SETUP.code,
      type: "error",
      statusCode: VERIFY_EMAIL_MESSAGES_ERRORS.TWO_FA_NOT_SETUP.statusCode,
    };
  }
  return {
    type: "success",
    statusCode: VERIFY_EMAIL_MESSAGES_SUCCESS.EMAIL_VERIFIED.statusCode,
    message: "Email verified",
    messageCode: VERIFY_EMAIL_MESSAGES_SUCCESS.EMAIL_VERIFIED.code,
  };
  // return redirect("/");
}
