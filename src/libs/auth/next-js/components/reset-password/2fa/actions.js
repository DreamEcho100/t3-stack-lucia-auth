"use server";

import { verifyTOTP } from "@oslojs/otp";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { updateOnePasswordResetSessionAs2FAVerifiedRepository } from "~/libs/auth/server/repositories/password-reset";
import { getUserTOTPKeyRepository } from "~/libs/auth/server/repositories/users";
import { resetUser2FAWithRecoveryCode } from "~/libs/auth/server/utils/2fa";
import { validatePasswordResetSessionRequest } from "~/libs/auth/server/utils/password-reset";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 */

/**
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function verifyPasswordReset2FAWithTOTPAction(_prev, formData) {
  const cookiesManager = cookies();
  const { session, user } = await validatePasswordResetSessionRequest(
    (name) => cookiesManager.get(name)?.value,
    cookiesManager.set,
  );
  if (session === null) {
    return {
      message: "Not authenticated",
      // messageCode: "NOT_AUTHENTICATED",
      type: "error",
      statusCode: 401,
    };
  }

  if (!user.isTwoFactorEnabled) {
    return {
      message: "Forbidden, 2FA is not enabled",
      // messageCode: "FORBIDDEN",
      statusCode: 403,
      type: "error",
    };
  }

  if (
    !session.isEmailVerified ||
    !user.is2FARegistered ||
    session.isTwoFactorVerified
  ) {
    return {
      message: "Forbidden",
      // messageCode: "FORBIDDEN",
      statusCode: 403,
      type: "error",
    };
  }

  const code = formData.get("code");
  if (typeof code !== "string") {
    return {
      message: "Invalid or missing fields",
      // messageCode: "INVALID_FIELDS_OR_MISSING_FIELDS",
      statusCode: 400,
      type: "error",
    };
  }
  if (code === "") {
    return {
      message: "Please enter your code",
      // messageCode: "INVALID_FIELDS_OR_MISSING_FIELDS",
      statusCode: 400,
      type: "error",
    };
  }

  const totpKey = await getUserTOTPKeyRepository(session.userId);

  if (totpKey === null) {
    return {
      message: "Forbidden",
      // messageCode: "FORBIDDEN",
      statusCode: 403,
      type: "error",
    };
  }

  if (!verifyTOTP(totpKey, 30, 6, code)) {
    return {
      message: "Invalid code",
      // messageCode: "INVALID_CODE",
      statusCode: 400,
      type: "error",
    };
  }

  await updateOnePasswordResetSessionAs2FAVerifiedRepository(session.id);

  return redirect("/auth/reset-password");
}

/**
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function verifyPasswordReset2FAWithRecoveryCodeAction(
  _prev,
  formData,
) {
  const data = {
    code: formData.get("code"),
  };

  const input = z
    .object({
      code: z.string().min(6),
    })
    .safeParse(data);

  if (!input.success) {
    return {
      message: "Invalid or missing fields",
      // messageCode: "INVALID_OR_MISSING_FIELDS",
      type: "error",
      statusCode: 400,
    };
  }

  const cookiesManager = cookies();
  const { session, user } = await validatePasswordResetSessionRequest(
    (name) => cookiesManager.get(name)?.value,
    cookiesManager.set,
  );
  if (session === null) {
    return {
      message: "Not authenticated",
      // messageCode: "NOT_AUTHENTICATED",
      type: "error",
      statusCode: 401,
    };
  }

  if (!user.isTwoFactorEnabled) {
    return {
      message: "Forbidden, 2FA is not enabled",
      // messageCode: "FORBIDDEN",
      statusCode: 403,
      type: "error",
    };
  }

  if (
    !session.isEmailVerified ||
    !user.is2FARegistered ||
    session.isTwoFactorVerified
  ) {
    return {
      message: "Forbidden",
      // messageCode: "FORBIDDEN",
      statusCode: 403,
      type: "error",
    };
  }

  const code = input.data.code;

  const valid = await resetUser2FAWithRecoveryCode(session.userId, code);

  if (!valid) {
    return {
      message: "Invalid code",
      // messageCode: "INVALID_CODE",
      statusCode: 400,
      type: "error",
    };
  }

  return redirect("/auth/reset-password");
}
