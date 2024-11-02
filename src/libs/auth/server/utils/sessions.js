/** @import { DateLike, GetCookie, SessionValidationResult, Session } from "~/libs/auth/types" */

import { encodeHexLowerCase } from "@oslojs/encoding";
import {
  COOKIE_TOKEN_SESSION_EXPIRES_DURATION,
  COOKIE_TOKEN_SESSION_KEY,
} from "~/libs/auth/server/utils/constants";
import { dateLikeToDate } from "~/libs/auth/server/utils/dates";
import { createOneSessionRepository } from "~/libs/auth/server/repositories/sessions";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase32LowerCaseNoPadding } from "@oslojs/encoding";
import {
  deleteSessionByIdRepository,
  findOneSessionByIdRepository,
  updateSessionExpirationByIdRepository,
} from "~/libs/auth/server/repositories/sessions";

import { dateLikeToNumber } from "~/libs/auth/server/utils/dates";

/**
 * Set the session token cookie with required attributes.
 *
 * @param {object} param
 * @param {(key: string, value: string, options: object) => void} param.setCookie - Function to set the cookie, passed by the framework.
 * @param {string} param.token - The session token to be set in the cookie.
 * @param {DateLike} param.expiresAt - Expiration date for the session token.
 * @returns {void}
 */
export function setSessionTokenCookie(param) {
  param.setCookie(COOKIE_TOKEN_SESSION_KEY, param.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: dateLikeToDate(param.expiresAt),
    path: "/",
  });
}

/**
 * Delete the session token cookie.
 *
 * @param {(key: string, value: string, options: object) => void} setCookie - Function to set the cookie, passed by the framework.
 * @returns {void}
 */
export function deleteSessionTokenCookie(setCookie) {
  setCookie(COOKIE_TOKEN_SESSION_KEY, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}

/**
 * Creates a new session for the given user.
 *
 * The session ID is the SHA-256 hash of the session token, and the session is set to expire in 30 days.
 *
 * @param {string} token - The session token, which is a random string.
 * @param {string} userId - The ID of the user for whom the session is created.
 * @param {{ isTwoFactorVerified: boolean; }} flags - Flags to set for the session.
 * @returns {Promise<Session>} A promise that resolves to the created session object.
 */
export async function createSession(token, userId, flags) {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  /** @type {Session} */
  const session = {
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + COOKIE_TOKEN_SESSION_EXPIRES_DURATION),
    // isTwoFactorVerified: 0,
    isTwoFactorVerified: flags.isTwoFactorVerified,
    createdAt: new Date(),
  };

  await createOneSessionRepository(session);

  return session;
}

/**
 * Generates a random session token.
 *
 * The session token is generated using 20 random bytes encoded in base32.
 * Base32 is used because it's case-insensitive and more compact than hex encoding.
 *
 * @returns {string} A random session token encoded as a base32 string.
 */
export function generateSessionToken() {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const token = encodeBase32LowerCaseNoPadding(bytes);
  return token;
}

/**
 * Retrieves the current session by validating the session token.
 *
 * @param {GetCookie} getCookie - Function to get the session token from cookies, provided by the framework.
 * @returns {Promise<SessionValidationResult>} A promise that resolves to the session and user data.
 */
export async function getCurrentSession(getCookie) {
  const token = getCookie(COOKIE_TOKEN_SESSION_KEY);
  if (!token) {
    return { session: null, user: null };
  }

  return await validateSessionToken(token);
}

/**
 * Middleware to handle session token validation and cookie expiration extension.
 *
 * @param {object} param
 * @param {string | null} param.token - The session token extracted from cookies.
 * @param {(key: string, value: string, options: object) => void} param.setCookie - Framework-provided function to set cookies.
 * @returns {Promise<SessionValidationResult>} The result of session validation.
 */
export async function handleSessionMiddleware(param) {
  if (!param.token) {
    return { session: null, user: null };
  }

  const result = await validateSessionToken(param.token);

  if (result.session) {
    // Extend cookie expiration by 30 days
    setSessionTokenCookie({
      setCookie: param.setCookie,
      token: param.token,
      expiresAt: new Date(Date.now() + COOKIE_TOKEN_SESSION_EXPIRES_DURATION),
    });
  }

  return result;
}

/**
 * Validates a session token by checking if it exists and if it is still within the expiration date.
 *
 * If the session is nearing expiration (within 15 days), the expiration will be extended by another 30 days.
 * If the session has expired, it will be deleted from the database.
 *
 * @param {string} token - The session token to be validated.
 * @returns {Promise<SessionValidationResult>} A promise that resolves to the session and user data, or null if the session is invalid or expired.
 */
export async function validateSessionToken(token) {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const result = await findOneSessionByIdRepository(sessionId);

  if (result === null) {
    return { session: null, user: null };
  }

  const expiresAt = dateLikeToNumber(result.session.expiresAt);

  if (Date.now() >= expiresAt) {
    await deleteSessionByIdRepository(sessionId);
    return { session: null, user: null };
  }

  if (Date.now() >= expiresAt - 1000 * 60 * 60 * 24 * 15) {
    result.session.expiresAt = new Date(
      Date.now() + COOKIE_TOKEN_SESSION_EXPIRES_DURATION,
    );
    await updateSessionExpirationByIdRepository(
      sessionId,
      new Date(result.session.expiresAt),
    );
  }

  return result;
}
