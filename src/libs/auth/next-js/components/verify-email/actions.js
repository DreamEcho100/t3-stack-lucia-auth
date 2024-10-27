"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { verifyEmailUserService } from "~/libs/auth/server/services/verify-email";
import {
  AUTH_URLS,
  RESEND_EMAIL_MESSAGES_ERRORS,
  VERIFY_EMAIL_MESSAGES_ERRORS,
} from "~/libs/auth/server/utils/constants";
import { getCurrentSession } from "~/libs/auth/next-js/utils/get-current-session";
import { resendEmailVerificationCodeService } from "~/libs/auth/server/services/resend-email-verification-code";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 */

/**
 *
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function verifyEmailAction(_prev, formData) {
  const result = await verifyEmailUserService(
    { code: formData.get("code") },
    {
      setCookie: cookies().set,
      getCookie: (nam) => cookies().get(nam)?.value,
      getCurrentSession: getCurrentSession,
    },
  );

  if (result.type === "success") {
    return redirect(AUTH_URLS.SUCCESS_VERIFY_EMAIL);
  }

  switch (result.messageCode) {
    case VERIFY_EMAIL_MESSAGES_ERRORS.INVALID_CREDENTIALS_OR_MISSING_FIELDS
      .code:
      return {
        type: "error",
        statusCode: result.statusCode,
        message: result.message,
      };
    case VERIFY_EMAIL_MESSAGES_ERRORS.NOT_AUTHENTICATED.code:
      return redirect(AUTH_URLS.LOGIN);
    case VERIFY_EMAIL_MESSAGES_ERRORS.FORBIDDEN.code:
      return redirect(AUTH_URLS.LOGIN);
    case VERIFY_EMAIL_MESSAGES_ERRORS.ENTER_YOUR_CODE.code:
      return redirect(AUTH_URLS.VERIFY_EMAIL);
    case VERIFY_EMAIL_MESSAGES_ERRORS.VERIFICATION_CODE_EXPIRED.code:
      return redirect(AUTH_URLS.VERIFY_EMAIL);
    case VERIFY_EMAIL_MESSAGES_ERRORS.INCORRECT_CODE.code:
      return redirect(AUTH_URLS.VERIFY_EMAIL);
    case VERIFY_EMAIL_MESSAGES_ERRORS.TWO_FA_NOT_SETUP.code:
      return redirect(AUTH_URLS.SETUP_2FA);
    default:
      return { type: "error", statusCode: 500, message: "Unexpected error" };
  }
}

/**
 * @param {ActionResult} _prev
 * @returns {Promise<ActionResult>}
 */
export async function resendEmailVerificationCodeAction(_prev) {
  const result = await resendEmailVerificationCodeService({
    getCookie: (nam) => cookies().get(nam)?.value,
    getCurrentSession: getCurrentSession,
    setCookie: cookies().set,
  });

  if (result.type === "success") {
    return redirect(AUTH_URLS.SUCCESS_VERIFY_EMAIL);
  }

  switch (result.messageCode) {
    case RESEND_EMAIL_MESSAGES_ERRORS.NOT_AUTHENTICATED.code:
      return redirect(AUTH_URLS.LOGIN);
    case RESEND_EMAIL_MESSAGES_ERRORS.FORBIDDEN.code:
      return redirect(AUTH_URLS.LOGIN);
    default:
      return { type: "error", statusCode: 500, message: "Unexpected error" };
  }
}
