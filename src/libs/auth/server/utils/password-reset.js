/** @import { DateLike, GetCookie, PasswordResetSession, PasswordResetSessionValidationResult, SetCookie } from "~/libs/auth/types"; */

import { encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
// import { cookies } from "next/headers";

import { generateRandomOTP } from "./generate-randomotp";
// import { db } from "~/server/db";
import { dateLikeToDate, dateLikeToNumber } from "./dates";
import {
  COOKIE_TOKEN_PASSWORD_RESET_EXPIRES_DURATION,
  COOKIE_TOKEN_PASSWORD_RESET_KEY,
} from "./constants";
import {
  createOnePasswordResetSessionRepository,
  deleteAllPasswordResetSessionsForUserRepository,
  deleteOnePasswordResetSessionRepository,
  findOnePasswordResetSessionWithUserRepository,
} from "../repositories/password-reset";
import { transformDbUserToUser } from "./transform";

/**
 * @param {string} token - The token to be used to create the password reset session.
 * @param {string} userId - The user ID associated with the password reset session.
 * @param {string} email - The email associated with the password reset session.
 * @returns {Promise<PasswordResetSession>} A promise that resolves to the created password reset session.
 */
export async function createPasswordResetSession(token, userId, email) {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

  /** @type {PasswordResetSession} */
  const session = {
    id: sessionId,
    userId,
    email,
    expiresAt: new Date(
      Date.now() + COOKIE_TOKEN_PASSWORD_RESET_EXPIRES_DURATION,
    ),
    code: generateRandomOTP(),
    emailVerified: false,
    twoFactorVerified: false,
  };

  await createOnePasswordResetSessionRepository(session).then(
    /** @returns {PasswordResetSession} session */
    (result) => ({
      id: result.id,
      userId: result.userId,
      email: result.email,
      code: result.code,
      expiresAt: dateLikeToDate(result.expiresAt),
      emailVerified: !!result.emailVerified,
      twoFactorVerified: !!result.twoFactorVerified,
    }),
  );

  return session;
}

/**
 * @param {string} token - The token to be validated.
 * @returns {Promise<PasswordResetSessionValidationResult>} A promise that resolves to the validation result.
 */
export async function validatePasswordResetSessionToken(token) {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const result = await findOnePasswordResetSessionWithUserRepository(sessionId);

  if (
    !result?.session ||
    Date.now() >= dateLikeToNumber(result.session.expiresAt)
  ) {
    await deleteOnePasswordResetSessionRepository(sessionId);
    return { session: null, user: null };
  }

  return result;
}

// /**
//  * @param {string} userId - The ID of the user.
//  * @returns {Promise<void>}
//  */
// export async function invalidateUserPasswordResetSessions(userId) {
//   await deleteAllPasswordResetSessionsForUserRepository(userId);
// }

/**
 * @param {GetCookie} getCookie - The function to get a cookie.
 * @param {SetCookie} setCookie - The function to set a cookie.
 * @returns {Promise<PasswordResetSessionValidationResult>}
 */
export async function validatePasswordResetSessionRequest(
  getCookie,
  setCookie,
) {
  const token = getCookie(COOKIE_TOKEN_PASSWORD_RESET_KEY) ?? null;
  if (token === null) {
    return { session: null, user: null };
  }
  const result = await validatePasswordResetSessionToken(token);
  if (result.session === null) {
    deletePasswordResetSessionTokenCookie(setCookie);
  }
  return result;
}

/**
 * @param {string} token - The token to be used to create the password reset session.
 * @param {DateLike} expiresAt - The date at which the password reset session expires.
 * @param {SetCookie} setCookie - The function to set a cookie.
 * @returns {void}
 */
export function setPasswordResetSessionTokenCookie(
  token,
  expiresAt,
  setCookie,
) {
  setCookie(COOKIE_TOKEN_PASSWORD_RESET_KEY, token, {
    expires: dateLikeToDate(expiresAt),
    sameSite: "lax",
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export function deletePasswordResetSessionTokenCookie(setCookie) {
  setCookie(COOKIE_TOKEN_PASSWORD_RESET_KEY, "", {
    maxAge: 0,
    sameSite: "lax",
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

/**
 * @param {string} email - The email to send the password reset email to.
 * @param {string} code - The code to be sent in the password reset email.
 * @returns {Promise<void>}
 */
export async function sendPasswordResetEmail(email, code) {
  console.log(`To ${email}: Your reset code is ${code}`);
  console.warn("Email sending is not implemented.");
}
