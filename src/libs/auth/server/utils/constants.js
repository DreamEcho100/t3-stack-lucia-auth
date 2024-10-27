export const COOKIE_TOKEN_SESSION_KEY = "session";
export const COOKIE_TOKEN_SESSION_EXPIRES_DURATION = 1000 * 60 * 60 * 24 * 30; // 30 days

export const COOKIE_TOKEN_EMAIL_VERIFICATION_KEY = "email_verification";
export const COOKIE_TOKEN_EMAIL_VERIFICATION_EXPIRES_DURATION = 1000 * 60 * 10; // 10 minutes

export const COOKIE_TOKEN_PASSWORD_RESET_KEY = "password_reset_session";
export const COOKIE_TOKEN_PASSWORD_RESET_EXPIRES_DURATION = 1000 * 60 * 10; // 10 minutes

export const LOGIN_MESSAGES_ERRORS = /** @type {const} */ ({
  INVALID_CREDENTIALS_OR_MISSING_FIELDS: {
    code: "INVALID_CREDENTIALS_OR_MISSING_FIELDS",
    statusCode: 400, // Bad Request: Invalid input provided or missing fields
  },
  ACCOUNT_DOES_NOT_EXIST: {
    code: "ACCOUNT_DOES_NOT_EXIST",
    statusCode: 404, // Not Found: Account does not exist
  },
  EMAIL_NOT_VERIFIED: {
    code: "EMAIL_NOT_VERIFIED",
    statusCode: 403, // Forbidden: Email not verified, action prohibited
  },
  TWO_FA_NOT_SETUP: {
    code: "TWO_FA_NOT_SETUP",
    statusCode: 403, // Forbidden: Two-factor authentication not set up
  },
  // TWO_FA_NOT_VERIFIED: {
  //   code: "TWO_FA_NOT_VERIFIED",
  //   statusCode: 401, // Unauthorized: Two-factor authentication not completed
  // },
  USER_DOES_NOT_EXIST_OR_PASSWORD_NOT_SET: {
    code: "USER_DOES_NOT_EXIST_OR_PASSWORD_NOT_SET",
    statusCode: 404, // Not Found: User does not exist or password not set
  },
});
export const LOGIN_MESSAGES_SUCCESS = /** @type {const} */ ({
  LOGGED_IN_SUCCESSFULLY: {
    code: "LOGGED_IN_SUCCESSFULLY",
    statusCode: 200, // OK: Successful login
  },
});

export const RESEND_EMAIL_MESSAGES_ERRORS = /** @type {const} */ ({
  NOT_AUTHENTICATED: {
    code: "NOT_AUTHENTICATED",
    statusCode: 401, // Unauthorized: The user is not authenticated.
  },
  FORBIDDEN: {
    code: "FORBIDDEN",
    statusCode: 403, // Forbidden: The user does not have permission to resend the email.
  },
});

export const RESEND_EMAIL_MESSAGES_SUCCESS = /** @type {const} */ ({
  EMAIL_SENT: {
    code: "EMAIL_SENT",
    statusCode: 200, // OK: Email sent successfully.
  },
});

export const VERIFY_EMAIL_MESSAGES_ERRORS = /** @type {const} */ ({
  INVALID_CREDENTIALS_OR_MISSING_FIELDS: {
    code: "INVALID_CREDENTIALS_OR_MISSING_FIELDS",
    statusCode: 400, // Bad Request: Indicates missing or invalid input.
  },
  NOT_AUTHENTICATED: {
    code: "NOT_AUTHENTICATED",
    statusCode: 401, // Unauthorized: User is not authenticated.
  },
  FORBIDDEN: {
    code: "FORBIDDEN",
    statusCode: 403, // Forbidden: User does not have permission.
  },
  INVALID_OR_MISSING_FIELDS: {
    code: "INVALID_OR_MISSING_FIELDS",
    statusCode: 400, // Bad Request: Missing required fields or invalid data.
  },
  ENTER_YOUR_CODE: {
    code: "ENTER_YOUR_CODE",
    statusCode: 400, // Bad Request: Prompts user to enter their code.
  },
  VERIFICATION_CODE_EXPIRED: {
    code: "VERIFICATION_CODE_EXPIRED",
    statusCode: 410, // Gone: Indicates the code has expired and is no longer valid.
  },
  INCORRECT_CODE: {
    code: "INCORRECT_CODE",
    statusCode: 400, // Bad Request: The code entered is incorrect.
  },
  TWO_FA_NOT_SETUP: {
    code: "TWO_FA_NOT_SETUP",
    statusCode: 303, // See Other: Redirect to the 2FA setup page.
  },
});
export const VERIFY_EMAIL_MESSAGES_SUCCESS = /** @type {const} */ ({
  EMAIL_VERIFIED: {
    code: "EMAIL_VERIFIED",
    statusCode: 200, // OK: Email has been verified.
  },
});

// /** @constant */
// export const LOGIN_MESSAGES = /** @type {const} */ ({
//   ...LOGIN_MESSAGES_ERRORS,
//   ...LOGIN_MESSAGES_SUCCESS,
// });

/** @constant */
export const AUTH_URLS = /** @type {const} */ ({
  VERIFY_EMAIL: "/auth/verify-email",
  SETUP_2FA: "/auth/2fa/setup",
  // TWO_FA: "/auth/2fa",
  SUCCESS_LOGIN: "/auth/2fa",
  SUCCESS_VERIFY_EMAIL: "/",
  REGISTER: "/auth/signup",
  LOGIN: "/auth/login",
});
