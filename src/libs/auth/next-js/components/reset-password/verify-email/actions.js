"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { updateOnePasswordResetSessionAsEmailVerifiedRepository } from "~/libs/auth/server/repositories/password-reset";
import { setUserAsEmailVerifiedIfEmailMatchesRepository } from "~/libs/auth/server/repositories/users";
import { validatePasswordResetSessionRequest } from "~/libs/auth/server/utils/password-reset";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 *
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function verifyPasswordResetEmailAction(_prev, formData) {
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
  if (session.isEmailVerified) {
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
      // messageCode: "INVALID_OR_MISSING_FIELDS",
      type: "error",
      statusCode: 400,
    };
  }
  if (code === "") {
    return {
      message: "Please enter your code",
      // messageCode: "EMPTY_CODE",
      type: "error",
      statusCode: 400,
    };
  }

  if (code !== session.code) {
    return {
      message: "Incorrect code",
      // messageCode: "INCORRECT_CODE",
      type: "error",
      statusCode: 400,
    };
  }
  const [emailMatches] = await Promise.all([
    setUserAsEmailVerifiedIfEmailMatchesRepository(
      session.userId,
      session.email,
    ),
    updateOnePasswordResetSessionAsEmailVerifiedRepository(session.id),
  ]);

  if (!emailMatches) {
    return {
      message: "Please restart the process",
      // messageCode: "RESTART_PROCESS",
      type: "error",
      statusCode: 400,
    };
  }

  if (user.isTwoFactorEnabled) {
    return redirect("/auth/reset-password/2fa");
  }

  return redirect("/auth/reset-password");
}
