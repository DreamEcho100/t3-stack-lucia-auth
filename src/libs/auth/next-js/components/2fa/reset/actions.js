"use server";

import { getCurrentSession } from "~/libs/auth/next-js/utils/get-current-session";

import { redirect } from "next/navigation";
import { resetUser2FAWithRecoveryCode } from "~/libs/auth/server/utils/2fa";
import { z } from "zod";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 *
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function reset2FAAction(_prev, formData) {
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

  const valid = await resetUser2FAWithRecoveryCode(user.id, code);
  if (!valid) {
    return {
      message: "Invalid recovery code",
      // messageCode: "INVALID_RECOVERY_CODE",
      type: "error",
      statusCode: 400,
    };
  }

  return redirect("/auth/2fa/setup");
}
