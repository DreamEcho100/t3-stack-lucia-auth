"use server";

import { verifyTOTP } from "@oslojs/otp";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentSession } from "~/libs/auth/next-js/utils/get-current-session";
import { setSessionAs2FAVerifiedRepository } from "~/libs/auth/server/repositories/sessions";
import { getUserTOTPKeyRepository } from "~/libs/auth/server/repositories/users";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 *
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function verify2FAAction(_prev, formData) {
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

  const { session, user } = await getCurrentSession();
  if (session === null) {
    return {
      message: "Not authenticated",
      // messageCode: "NOT_AUTHENTICATED",
      type: "error",
      statusCode: 401,
    };
  }
  if (!user.emailVerified || !user.registered2FA || session.twoFactorVerified) {
    return {
      message: "Forbidden",
      // messageCode: "FORBIDDEN",
      statusCode: 403,
      type: "error",
    };
  }

  const code = input.data.code;

  const totpKey = await getUserTOTPKeyRepository(user.id);
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
      type: "error",
      statusCode: 400,
    };
  }

  await setSessionAs2FAVerifiedRepository(session.id);
  return redirect("/");
}
