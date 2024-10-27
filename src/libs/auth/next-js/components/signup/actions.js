"use server";

// import { checkEmailAvailability, verifyEmailInput } from "@/lib/server/email";
// import {
//   createEmailVerificationRequest,
//   sendVerificationEmail,
//   setEmailVerificationRequestCookie,
// } from "@/lib/server/email-verification";
// import { verifyPasswordStrength } from "@/lib/server/password";
// import { RefillingTokenBucket } from "@/lib/server/rate-limit";
// import {
//   createSession,
//   generateSessionToken,
//   setSessionTokenCookie,
// } from "@/lib/server/session";
// import { createUser, verifyUsernameInput } from "@/lib/server/user";
// import { globalPOSTRateLimit } from "@/lib/server/request";
// import type { SessionFlags } from "@/lib/server/session";
import { cookies, headers } from "next/headers";
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

// const ipBucket = new RefillingTokenBucket<string>(3, 10);

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
  };

  const input = z
    .object({
      email: z.string().email(),
      username: z.string().min(3).max(32),
      password: z.string().min(8),
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

  console.log("Email available", emailAvailable);
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

  console.log("Creating user");
  const user = await createUser(
    input.data.email,
    input.data.username,
    input.data.password,
  );

  console.log("Creating email verification request");
  const emailVerificationRequest = await createEmailVerificationRequest(
    user.id,
    user.email,
  );

  console.log("Sending verification email");
  await sendVerificationEmail(
    emailVerificationRequest.email,
    emailVerificationRequest.code,
  );

  const cookiesManager = cookies();
  console.log("Setting email verification request cookie");
  setEmailVerificationRequestCookie(
    emailVerificationRequest,
    cookiesManager.set,
  );

  const sessionToken = generateSessionToken();
  console.log("Creating session");
  const session = await createSession(sessionToken, user.id, {
    twoFactorVerified: false,
  });

  console.log("Setting session token cookie");
  setSessionTokenCookie({
    token: sessionToken,
    expiresAt: session.expiresAt,
    setCookie: cookiesManager.set,
  });

  console.log("Redirecting to 2FA setup");
  return redirect("/auth/2fa/setup");
}
