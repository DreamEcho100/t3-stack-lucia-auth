"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentSession } from "~/libs/auth/next-js/utils/get-current-session";
import { invalidateUserSessionsRepository } from "~/libs/auth/server/repositories/sessions";
import {
  getUserByEmailRepository,
  getUserPasswordHashRepository,
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
  updateUserTwoFactorEnabledService,
} from "~/libs/auth/server/utils/users";

// import type { SessionFlags } from "@/lib/server/session";

// const passwordUpdateBucket = new ExpiringTokenBucket<string>(5, 60 * 30);

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; }} ActionIdleResult
 * @typedef {{ type: 'error', statusCode: number; message: string; }} ActionErrorResult
 * @typedef {{ type: 'success', statusCode: number; message: string; }} ActionSuccessResult
 * @typedef {ActionIdleResult | ActionErrorResult | ActionSuccessResult} ActionResult
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
  if (
    user.isTwoFactorEnabled &&
    user.is2FARegistered &&
    !session.isTwoFactorVerified
  ) {
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
    isTwoFactorVerified: session.isTwoFactorVerified,
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
  if (
    user.isTwoFactorEnabled &&
    user.is2FARegistered &&
    !session.isTwoFactorVerified
  ) {
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
 * @returns {Promise<ActionIdleResult | ActionErrorResult | (ActionSuccessResult & { data: { recoveryCode: string; } })>}
 */
export async function regenerateRecoveryCodeAction() {
  const { session, user } = await getCurrentSession();
  if (session === null || user === null) {
    return {
      // error: "Not authenticated",
      // recoveryCode: null,
      type: "error",
      message: "Not authenticated",
      // messageCode: "NOT_AUTHENTICATED",
      statusCode: 401,
    };
  }

  if (!user.isEmailVerified) {
    return {
      // error: "Forbidden",
      // recoveryCode: null,
      type: "error",
      message: "Forbidden",
      // messageCode: "FORBIDDEN",
      statusCode: 403,
    };
  }

  if (!user.isTwoFactorEnabled) {
    return {
      // error: "Forbidden",
      // recoveryCode: null,
      type: "error",
      message: "Forbidden",
      // messageCode: "FORBIDDEN",
      statusCode: 403,
    };
  }

  if (!session.isTwoFactorVerified) {
    return {
      // error: "Forbidden",
      // recoveryCode: null,
      type: "error",
      message: "Forbidden",
      // messageCode: "FORBIDDEN",
      statusCode: 403,
    };
  }

  const recoveryCode = await resetUserRecoveryCode(session.userId);

  return {
    type: "success",
    message: "Regenerated recovery code",
    // messageCode: "REGENERATED_RECOVERY_CODE",
    statusCode: 200,
    data: { recoveryCode },
  };
}

/**
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function updateToggleIsTwoFactorEnabledAction(_prev, formData) {
  const input = z
    .object({
      isTwoFactorEnabled: z.preprocess((value) => {
        if (typeof value === "boolean") {
          return value;
        }

        return value === "on";
      }, z.boolean().optional().default(false)),
    })
    .safeParse({
      isTwoFactorEnabled: formData.get("is_two_factor_enabled") === "on",
    });

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

  await updateUserTwoFactorEnabledService(
    user.id,
    input.data.isTwoFactorEnabled,
  );

  // return {
  //   message: "Updated two-factor authentication",
  //   // messageCode: "UPDATED_TWO_FACTOR_AUTHENTICATION",
  //   type: "success",
  //   statusCode: 200,
  // };

  return redirect("/auth/2fa");
}
