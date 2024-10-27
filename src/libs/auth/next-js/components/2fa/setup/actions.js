"use server";

// import { RefillingTokenBucket } from "@/lib/server/rate-limit";
// import { globalPOSTRateLimit } from "@/lib/server/request";
// import { getCurrentSession, setSessionAs2FAVerified } from "@/lib/server/session";
// import { updateUserTOTPKey } from "@/lib/server/user";
import { decodeBase64 } from "@oslojs/encoding";
import { verifyTOTP } from "@oslojs/otp";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentSession } from "~/libs/auth/next-js/utils/get-current-session";
import { setSessionAs2FAVerifiedRepository } from "~/libs/auth/server/repositories/sessions";
import { updateUserTOTPKey } from "~/libs/auth/server/utils/users";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'sucess' ; statusCode: number; message: string; }} ActionResult
 *
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function setup2FAAction(_prev, formData) {
  const data = {
    code: formData.get("code"),
    encodedKey: formData.get("key"),
  };

  const input = z
    .object({
      code: z.string().min(6),
      encodedKey: z.string().min(28),
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
  if (!user.emailVerified) {
    return {
      message: "Forbidden",
      // messageCode: "FORBIDDEN",
      statusCode: 403,
      type: "error",
    };
  }
  if (user.registered2FA && !session.twoFactorVerified) {
    return {
      message: "Forbidden",
      // messageCode: "FORBIDDEN",
      statusCode: 403,
      type: "error",
    };
  }

  const encodedKey = input.data.encodedKey;
  const code = input.data.code;

  /** @type {Uint8Array} */
  let key;
  try {
    key = decodeBase64(encodedKey);
  } catch {
    return {
      message: "Invalid key",
      // messageCode: "INVALID_KEY",
      type: "error",
      statusCode: 400,
    };
  }
  if (key.byteLength !== 20) {
    return {
      message: "Invalid key",
      // messageCode: "INVALID_KEY",
      type: "error",
      statusCode: 400,
    };
  }

  if (!verifyTOTP(key, 30, 6, code)) {
    return {
      message: "Invalid code",
      // messageCode: "INVALID_CODE",
      type: "error",
      statusCode: 400,
    };
  }
  await Promise.all([
    updateUserTOTPKey(session.userId, key),
    setSessionAs2FAVerifiedRepository(session.id),
  ]);

  return redirect("/auth/recovery-code");
}
