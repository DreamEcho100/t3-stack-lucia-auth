"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { deleteAllPasswordResetSessionsForUserRepository } from "~/libs/auth/server/repositories/password-reset";
import { invalidateUserSessionsRepository } from "~/libs/auth/server/repositories/sessions";
import {
  deletePasswordResetSessionTokenCookie,
  validatePasswordResetSessionRequest,
} from "~/libs/auth/server/utils/password-reset";
import { verifyPasswordStrength } from "~/libs/auth/server/utils/passwords";
import {
  createSession,
  generateSessionToken,
  setSessionTokenCookie,
} from "~/libs/auth/server/utils/sessions";
import { updateUserPassword } from "~/libs/auth/server/utils/users";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 *
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function resetPasswordAction(_prev, formData) {
  const cookiesManager = cookies();
  const { session: passwordResetSession, user } =
    await validatePasswordResetSessionRequest(
      (name) => cookiesManager.get(name)?.value,
      cookiesManager.set,
    );
  if (passwordResetSession === null) {
    return {
      message: "Not authenticated",
      // messageCode: "NOT_AUTHENTICATED",
      type: "error",
      statusCode: 401,
    };
  }
  if (!passwordResetSession.emailVerified) {
    return {
      message: "Forbidden",
      // messageCode: "FORBIDDEN",
      statusCode: 403,
      type: "error",
    };
  }
  if (user.registered2FA && !passwordResetSession.twoFactorVerified) {
    return {
      message: "Forbidden",
      // messageCode: "FORBIDDEN",
      statusCode: 403,
      type: "error",
    };
  }

  const password = formData.get("password");
  if (typeof password !== "string") {
    return {
      message: "Invalid or missing fields",
      // messageCode: "INVALID_OR_MISSING_FIELDS",
      type: "error",
      statusCode: 400,
    };
  }

  const strongPassword = await verifyPasswordStrength(password);

  if (!strongPassword) {
    return {
      message: "Weak password",
      // messageCode: "WEAK_PASSWORD",
      type: "error",
      statusCode: 400,
    };
  }

  await Promise.all([
    deleteAllPasswordResetSessionsForUserRepository(
      passwordResetSession.userId,
    ),
    invalidateUserSessionsRepository(passwordResetSession.userId),
    updateUserPassword(passwordResetSession.userId, password),
  ]);

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.id, {
    twoFactorVerified: passwordResetSession.twoFactorVerified,
  });

  setSessionTokenCookie({
    token: sessionToken,
    expiresAt: session.expiresAt,
    setCookie: cookiesManager.set,
  });

  deletePasswordResetSessionTokenCookie(cookiesManager.set);

  return redirect("/");
}
