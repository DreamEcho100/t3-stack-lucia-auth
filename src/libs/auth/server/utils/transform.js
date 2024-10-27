/**
 * @import { DBSession, DBUser, User, Session, DBEmailVerificationRequest, EmailVerificationRequest, DBPasswordResetSession, PasswordResetSession } from "~/libs/auth/types";
 */

import { dateLikeToDate } from "./dates";

/**
 * Transform a database user to a session user.
 * @param {Omit<DBUser, 'emailVerified'|'passwordHash'|'recoveryCode'> & Partial<Pick<DBUser, 'passwordHash'|'recoveryCode'>> & { registered2FA?: boolean; emailVerified: DBUser['emailVerified'] | boolean }} dbUser
 * @returns {User}
 */
export function transformDbUserToUser(dbUser) {
  return {
    id: dbUser.id,
    username: dbUser.username,
    email: dbUser.email,
    emailVerified:
      typeof dbUser.emailVerified === "number"
        ? dbUser.emailVerified === 1
        : !!dbUser.emailVerified,
    registered2FA: dbUser.registered2FA ?? !!dbUser.totpKey,
  };
}

/**
 * Transform a db session to a session.
 * @param {DBSession} dbSession
 * @returns {Session}
 */
export function transformDbSessionToSession(dbSession) {
  return {
    id: dbSession.id,
    userId: dbSession.userId,
    twoFactorVerified: dbSession.twoFactorVerified === 1,
    expiresAt: dateLikeToDate(dbSession.expiresAt * 1000),
  };
}

/**
 * Transform a db email verification request to an email verification request.
 * @param {DBEmailVerificationRequest} dbEmailVerificationRequest
 * @returns {EmailVerificationRequest}
 */
export function transformDbEmailVerificationRequestToEmailVerificationRequest(
  dbEmailVerificationRequest,
) {
  return {
    id: dbEmailVerificationRequest.id,
    email: dbEmailVerificationRequest.email,
    code: dbEmailVerificationRequest.code,
    userId: dbEmailVerificationRequest.userId,
    expiresAt: dateLikeToDate(dbEmailVerificationRequest.expiresAt * 1000),
  };
}

/**
 * Transform a db password reset session to a password reset session.
 * @param {DBPasswordResetSession} dbPasswordResetSession
 * @returns {PasswordResetSession}
 */
export function transformDbPasswordResetSessionToPasswordResetSession(
  dbPasswordResetSession,
) {
  return {
    id: dbPasswordResetSession.id,
    userId: dbPasswordResetSession.userId,
    emailVerified: dbPasswordResetSession.emailVerified === 1,
    twoFactorVerified: dbPasswordResetSession.twoFactorVerified === 1,
    expiresAt: dateLikeToDate(dbPasswordResetSession.expiresAt * 1000),
    code: dbPasswordResetSession.code,
    email: dbPasswordResetSession.email,
  };
}
