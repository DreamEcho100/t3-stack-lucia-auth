import { z } from "zod";
import { verifyPasswordHash } from "~/libs/auth/server/utils/passwords";
import { generateSessionToken } from "~/libs/auth/server/utils/sessions";
import { createSession } from "~/libs/auth/server/utils/sessions";
import { setSessionTokenCookie } from "~/libs/auth/server/utils/sessions";
import {
  LOGIN_MESSAGES_ERRORS,
  LOGIN_MESSAGES_SUCCESS,
} from "~/libs/auth/server/utils/constants";
import {
  getUserByEmailRepository,
  getUserPasswordHashRepository,
} from "../repositories/users";

/**
 * @typedef {{ type: 'error'; statusCode: number; message: string; messageCode: typeof LOGIN_MESSAGES_ERRORS[keyof typeof LOGIN_MESSAGES_ERRORS]["code"] }} ActionResultError
 * @typedef {{ type: 'success'; statusCode: number; message: string; messageCode: typeof LOGIN_MESSAGES_SUCCESS[keyof typeof LOGIN_MESSAGES_SUCCESS]["code"] }} ActionResultSuccess
 *
 * @typedef {ActionResultError | ActionResultSuccess} ActionResult
 */

/**
 * Verifies the user’s credentials and creates a session if valid.
 *
 * @param {unknown} data
 * @param {{ setCookie: (key: string, value: string, options: object) => void }} options
 * @returns {Promise<ActionResult>}
 */
export async function loginUserService(data, options) {
  const input = z
    .object({
      email: z.string().email(),
      password: z.string().min(6),
    })
    .safeParse(data);

  if (!input.success) {
    return {
      type: "error",
      statusCode:
        LOGIN_MESSAGES_ERRORS.INVALID_CREDENTIALS_OR_MISSING_FIELDS.statusCode,
      message: "Invalid credentials or missing fields",
      messageCode:
        LOGIN_MESSAGES_ERRORS.INVALID_CREDENTIALS_OR_MISSING_FIELDS.code,
    };
  }

  const user = await getUserByEmailRepository(input.data.email);
  if (user === null) {
    return {
      type: "error",
      statusCode: LOGIN_MESSAGES_ERRORS.ACCOUNT_DOES_NOT_EXIST.statusCode,
      message: "Account does not exist",
      messageCode: LOGIN_MESSAGES_ERRORS.ACCOUNT_DOES_NOT_EXIST.code,
    };
  }

  const passwordHash = await getUserPasswordHashRepository(user.id);
  if (!passwordHash) {
    return {
      type: "error",
      statusCode:
        LOGIN_MESSAGES_ERRORS.USER_DOES_NOT_EXIST_OR_PASSWORD_NOT_SET
          .statusCode,
      message: "User does not exist or password not set",
      messageCode:
        LOGIN_MESSAGES_ERRORS.USER_DOES_NOT_EXIST_OR_PASSWORD_NOT_SET.code,
    };
  }

  const validPassword = await verifyPasswordHash(
    passwordHash,
    input.data.password,
  );
  if (!validPassword) {
    return {
      type: "error",
      statusCode:
        LOGIN_MESSAGES_ERRORS.INVALID_CREDENTIALS_OR_MISSING_FIELDS.statusCode,
      message: "Invalid credentials or missing fields",
      messageCode:
        LOGIN_MESSAGES_ERRORS.INVALID_CREDENTIALS_OR_MISSING_FIELDS.code,
    };
  }

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.id, {
    isTwoFactorVerified: false,
  });
  setSessionTokenCookie({
    setCookie: options.setCookie,
    expiresAt: session.expiresAt,
    token: sessionToken,
  });

  if (!user.isEmailVerified) {
    // return redirect("/auth/verify-email");
    return {
      type: "error",
      statusCode: LOGIN_MESSAGES_ERRORS.EMAIL_NOT_VERIFIED.statusCode,
      message: "Email not verified",
      messageCode: LOGIN_MESSAGES_ERRORS.EMAIL_NOT_VERIFIED.code,
    };
  }

  if (user.isTwoFactorEnabled && !user.is2FARegistered) {
    return {
      type: "error",
      statusCode: LOGIN_MESSAGES_ERRORS.TWO_FA_NOT_SETUP.statusCode,
      message: "2FA not setup",
      messageCode: LOGIN_MESSAGES_ERRORS.TWO_FA_NOT_SETUP.code,
    };
  }

  if (user.isTwoFactorEnabled) {
    return {
      type: "error",
      statusCode:
        LOGIN_MESSAGES_ERRORS.TWO_FA_NOT_NEEDS_VERIFICATION.statusCode,
      message: "2FA not verified",
      messageCode: LOGIN_MESSAGES_ERRORS.TWO_FA_NOT_NEEDS_VERIFICATION.code,
    };
  }

  return {
    type: "success",
    statusCode: LOGIN_MESSAGES_SUCCESS.LOGGED_IN_SUCCESSFULLY.statusCode,
    message: "Logged in successfully",
    messageCode: LOGIN_MESSAGES_SUCCESS.LOGGED_IN_SUCCESSFULLY.code,
  };
}
