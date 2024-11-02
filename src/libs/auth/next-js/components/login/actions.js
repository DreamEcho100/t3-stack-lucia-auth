"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { loginUserService } from "~/libs/auth/server/services/login";
import {
  AUTH_URLS,
  LOGIN_MESSAGES_ERRORS,
} from "~/libs/auth/server/utils/constants";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 *
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function loginAction(_prev, formData) {
  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
  };
  const result = await loginUserService(data, { setCookie: cookies().set });

  if (result.type === "success") {
    return redirect(AUTH_URLS.SUCCESS_LOGIN);
  }

  switch (result.messageCode) {
    case LOGIN_MESSAGES_ERRORS.INVALID_CREDENTIALS_OR_MISSING_FIELDS.code:
      return {
        type: "error",
        statusCode: result.statusCode,
        message: result.message,
      };
    case LOGIN_MESSAGES_ERRORS.ACCOUNT_DOES_NOT_EXIST.code:
      return redirect(AUTH_URLS.REGISTER);
    case LOGIN_MESSAGES_ERRORS.EMAIL_NOT_VERIFIED.code:
      return redirect(AUTH_URLS.VERIFY_EMAIL);
    case LOGIN_MESSAGES_ERRORS.TWO_FA_NOT_SETUP.code:
      return redirect(AUTH_URLS.SETUP_2FA);
    case LOGIN_MESSAGES_ERRORS.TWO_FA_NOT_NEEDS_VERIFICATION.code:
      return redirect(AUTH_URLS.TWO_FA);
    default:
      return { type: "error", statusCode: 500, message: "Unexpected error" };
  }
}
