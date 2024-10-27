"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentSession } from "~/libs/auth/next-js/utils/get-current-session";
import { invalidateUserSessionsRepository } from "~/libs/auth/server/repositories/sessions";
import {
  getUserByEmailRepository,
  getUserPasswordHashRepository,
  updateUserTwoFactorEnabledRepository,
} from "~/libs/auth/server/repositories/users";
import {
  createEmailVerificationRequest,
  sendVerificationEmail,
  setEmailVerificationRequestCookie,
} from "~/libs/auth/server/utils/email-verification";
import {
  verifyPasswordHash,
  verifyPasswordStrength,
} from "~/libs/auth/server/utils/passwords";
import {
  createSession,
  generateSessionToken,
  setSessionTokenCookie,
} from "~/libs/auth/server/utils/sessions";
import {
  resetUserRecoveryCode,
  updateUserPassword,
} from "~/libs/auth/server/utils/users";

// import type { SessionFlags } from "@/lib/server/session";

// const passwordUpdateBucket = new ExpiringTokenBucket<string>(5, 60 * 30);

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 */

/**
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function updatePasswordAction(_prev, formData) {
  const { session, user } = await getCurrentSession();
  if (session === null) {
    return {
      message: "Not authenticated",
      // messageCode: "NOT_AUTHENTICATED",
      type: "error",
      statusCode: 401,
    };
  }
  if (user.registered2FA && !session.twoFactorVerified) {
    return {
      message: "Forbidden",
      // messageCode: "FORBIDDEN",
      type: "error",
      statusCode: 403,
    };
  }

  const password = formData.get("password");
  const newPassword = formData.get("new_password");
  if (typeof password !== "string" || typeof newPassword !== "string") {
    return {
      message: "Invalid or missing fields",
      // messageCode: "INVALID_OR_MISSING_FIELDS",
      type: "error",
      statusCode: 400,
    };
  }
  const strongPassword = await verifyPasswordStrength(newPassword);
  if (!strongPassword) {
    return {
      message: "Weak password",
      // messageCode: "WEAK_PASSWORD",
      type: "error",
      statusCode: 400,
    };
  }

  const passwordHash = await getUserPasswordHashRepository(user.id);

  if (!passwordHash) {
    return {
      message: "User not found",
      // messageCode: "USER_NOT_FOUND",
      type: "error",
      statusCode: 404,
    };
  }

  const validPassword = await verifyPasswordHash(passwordHash, password);
  if (!validPassword) {
    return {
      message: "Incorrect password",
      // messageCode: "INCORRECT_PASSWORD",
      type: "error",
      statusCode: 400,
    };
  }

  await Promise.all([
    invalidateUserSessionsRepository(user.id),
    updateUserPassword(user.id, newPassword),
  ]);

  const sessionToken = generateSessionToken();
  const newSession = await createSession(sessionToken, user.id, {
    twoFactorVerified: session.twoFactorVerified,
  });
  const cookiesManager = cookies();
  setSessionTokenCookie({
    token: sessionToken,
    expiresAt: newSession.expiresAt,
    setCookie: cookiesManager.set,
  });

  return {
    message: "Updated password",
    // messageCode: "UPDATED_PASSWORD",
    type: "success",
    statusCode: 200,
  };
}

/**
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function updateEmailAction(_prev, formData) {
  const input = z
    .object({
      email: z.string().email(),
    })
    .safeParse(formData);

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
  if (user.registered2FA && !session.twoFactorVerified) {
    return {
      message: "Forbidden",
      // messageCode: "FORBIDDEN",
      type: "error",
      statusCode: 403,
    };
  }

  const email = input.data.email;

  const emailAvailable = await getUserByEmailRepository(email);
  if (!emailAvailable) {
    return {
      message: "This email is already used",
      // messageCode: "EMAIL_ALREADY_USED",
      type: "error",
      statusCode: 400,
    };
  }

  const cookiesManager = cookies();
  const verificationRequest = await createEmailVerificationRequest(
    user.id,
    email,
  );
  await sendVerificationEmail(
    verificationRequest.email,
    verificationRequest.code,
  );
  setEmailVerificationRequestCookie(verificationRequest, cookiesManager.set);

  return redirect("/auth/verify-email");
}

/**
 * @typedef {{ error: string; recoveryCode: null; } | { error: null; recoveryCode: string; }} RegenerateRecoveryCodeActionResult
 *
 * @returns {Promise<RegenerateRecoveryCodeActionResult>}
 */
export async function regenerateRecoveryCodeAction() {
  const { session, user } = await getCurrentSession();
  if (session === null || user === null) {
    return {
      error: "Not authenticated",
      recoveryCode: null,
    };
  }

  if (!user.emailVerified) {
    return {
      error: "Forbidden",
      recoveryCode: null,
    };
  }

  if (!session.twoFactorVerified) {
    return {
      error: "Forbidden",
      recoveryCode: null,
    };
  }

  const recoveryCode = await resetUserRecoveryCode(session.userId);

  return { error: null, recoveryCode };
}

/**
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function updateToggleIsTwoFactorEnabledAction(_prev, formData) {
  const input = z
    .object({
      isTwoFactorEnabled: z.boolean(),
    })
    .safeParse(formData);

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

  if (user.registered2FA && !session.twoFactorVerified) {
    return {
      message: "Forbidden",
      // messageCode: "FORBIDDEN",
      type: "error",
      statusCode: 403,
    };
  }

  await updateUserTwoFactorEnabledRepository(
    user.id,
    input.data.isTwoFactorEnabled,
  );

  return {
    message: "Updated two-factor authentication",
    // messageCode: "UPDATED_TWO_FACTOR_AUTHENTICATION",
    type: "success",
    statusCode: 200,
  };
}
