"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getUserByEmailRepository } from "~/libs/auth/server/repositories/users";
import {
  createEmailVerificationRequest,
  sendVerificationEmail,
  setEmailVerificationRequestCookie,
} from "~/libs/auth/server/utils/email-verification";
import { verifyPasswordStrength } from "~/libs/auth/server/utils/passwords";
import {
  createSession,
  generateSessionToken,
  setSessionTokenCookie,
} from "~/libs/auth/server/utils/sessions";
import { createUser } from "~/libs/auth/server/utils/users";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 *
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function signupAction(_prev, formData) {
  const data = {
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password"),
    enable2FA: formData.get("enable_2fa") === "on",
  };

  const input = z
    .object({
      email: z.string().email(),
      username: z.string().min(3).max(32),
      password: z.string().min(8),
      enable2FA: z.preprocess((value) => {
        if (typeof value === "boolean") {
          return value;
        }
        return value === "on";
      }, z.boolean().optional().default(false)),
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

  const emailAvailable = await getUserByEmailRepository(input.data.email);

  if (emailAvailable) {
    return {
      message: "Email is already used",
      // messageCode: "EMAIL_ALREADY_USED",
      type: "error",
      statusCode: 400,
    };
  }

  const strongPassword = await verifyPasswordStrength(input.data.password);

  if (!strongPassword) {
    return {
      message: "Weak password",
      // messageCode: "WEAK_PASSWORD",
      type: "error",
      statusCode: 400,
    };
  }

  const user = await createUser(
    input.data.email,
    input.data.username,
    input.data.password,
  );

  const emailVerificationRequest = await createEmailVerificationRequest(
    user.id,
    user.email,
  );

  await sendVerificationEmail(
    emailVerificationRequest.email,
    emailVerificationRequest.code,
  );

  const cookiesManager = cookies();
  setEmailVerificationRequestCookie(
    emailVerificationRequest,
    cookiesManager.set,
  );

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.id, {
    isTwoFactorVerified: false,
  });

  setSessionTokenCookie({
    token: sessionToken,
    expiresAt: session.expiresAt,
    setCookie: cookiesManager.set,
  });

  if (user.isTwoFactorEnabled) {
    return redirect("/auth/2fa/setup");
  }

  return redirect("/auth/login");
}
