"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { deleteAllPasswordResetSessionsForUserRepository } from "~/libs/auth/server/repositories/password-reset";
import { getUserByEmailRepository } from "~/libs/auth/server/repositories/users";
import {
  createPasswordResetSession,
  sendPasswordResetEmail,
  setPasswordResetSessionTokenCookie,
} from "~/libs/auth/server/utils/password-reset";
import { generateSessionToken } from "~/libs/auth/server/utils/sessions";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 *
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function forgotPasswordAction(_prev, formData) {
  const data = {
    email: formData.get("email"),
  };

  const input = z
    .object({
      email: z.string().email(),
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

  const email = input.data.email;

  const user = await getUserByEmailRepository(email);
  if (user === null) {
    return {
      message: "Account does not exist",
      // messageCode: "ACCOUNT_DOES_NOT_EXIST",
      type: "error",
      statusCode: 404,
    };
  }

  const [[sessionToken, session]] = await Promise.all([
    (async () => {
      const sessionToken = generateSessionToken();
      const session = await createPasswordResetSession(
        sessionToken,
        user.id,
        user.email,
      );
      return [sessionToken, session];
    })(),
    deleteAllPasswordResetSessionsForUserRepository(user.id),
  ]);

  await sendPasswordResetEmail(session.email, session.code);
  setPasswordResetSessionTokenCookie(
    sessionToken,
    session.expiresAt,
    cookies().set,
  );

  return redirect("/auth/reset-password/verify-email");
}
