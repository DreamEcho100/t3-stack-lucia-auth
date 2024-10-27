/**
 * @import { SessionValidationResult, SetCookie, GetCookie } from "~/libs/auth/types";
 */

import {
  RESEND_EMAIL_MESSAGES_ERRORS,
  RESEND_EMAIL_MESSAGES_SUCCESS,
} from "../utils/constants";
import {
  createEmailVerificationRequest,
  getUserEmailVerificationRequestFromRequest,
  sendVerificationEmail,
  setEmailVerificationRequestCookie,
} from "../utils/email-verification";

/**
 * @typedef {{ type: 'error'; statusCode: typeof RESEND_EMAIL_MESSAGES_ERRORS[keyof typeof RESEND_EMAIL_MESSAGES_ERRORS]["statusCode"]; message: string; messageCode: typeof RESEND_EMAIL_MESSAGES_ERRORS[keyof typeof RESEND_EMAIL_MESSAGES_ERRORS]["code"] }} ActionResultError
 * @typedef {{ type: 'success'; statusCode: typeof RESEND_EMAIL_MESSAGES_SUCCESS[keyof typeof RESEND_EMAIL_MESSAGES_SUCCESS]["statusCode"]; message: string; messageCode: typeof RESEND_EMAIL_MESSAGES_SUCCESS[keyof typeof RESEND_EMAIL_MESSAGES_SUCCESS]["code"] }} ActionResultSuccess
 *
 * @typedef {ActionResultError | ActionResultSuccess} ActionResult
 */

/**
 *
 * @param {{
 *  getCurrentSession: () => Promise<SessionValidationResult>;
 *  getCookie: GetCookie;
 *  setCookie: SetCookie;
 * }} options
 * @returns {Promise<ActionResult>}
 */
export async function resendEmailVerificationCodeService(options) {
  const { session, user } = await options.getCurrentSession();
  if (session === null) {
    return {
      message: "Not authenticated",
      messageCode: RESEND_EMAIL_MESSAGES_ERRORS.NOT_AUTHENTICATED.code,
      type: "error",
      statusCode: RESEND_EMAIL_MESSAGES_ERRORS.NOT_AUTHENTICATED.statusCode,
    };
  }
  if (user.registered2FA && !session.twoFactorVerified) {
    return {
      message: "Forbidden",
      messageCode: RESEND_EMAIL_MESSAGES_ERRORS.FORBIDDEN.code,
      type: "error",
      statusCode: RESEND_EMAIL_MESSAGES_ERRORS.FORBIDDEN.statusCode,
    };
  }

  let verificationRequest = await getUserEmailVerificationRequestFromRequest(
    options.getCurrentSession,
    options.getCookie,
    options.setCookie,
  );

  if (verificationRequest === null) {
    if (user.emailVerified) {
      return {
        message: "Forbidden",
        messageCode: RESEND_EMAIL_MESSAGES_ERRORS.FORBIDDEN.code,
        type: "error",
        statusCode: RESEND_EMAIL_MESSAGES_ERRORS.FORBIDDEN.statusCode,
      };
    }

    verificationRequest = await createEmailVerificationRequest(
      user.id,
      user.email,
    );
  } else {
    verificationRequest = await createEmailVerificationRequest(
      user.id,
      verificationRequest.email,
    );
  }
  await sendVerificationEmail(
    verificationRequest.email,
    verificationRequest.code,
  );
  setEmailVerificationRequestCookie(verificationRequest, options.setCookie);

  return {
    message: "A new code was sent to your inbox.",
    messageCode: RESEND_EMAIL_MESSAGES_SUCCESS.EMAIL_SENT.code,
    type: "success",
    statusCode: RESEND_EMAIL_MESSAGES_SUCCESS.EMAIL_SENT.statusCode,
  };
}
