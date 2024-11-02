/**
 * @import { DBSession, DBUser, User, Session, DBEmailVerificationRequest, EmailVerificationRequest, DBPasswordResetSession, PasswordResetSession } from "~/libs/auth/types";
 */

import { dateLikeToDate } from "./dates";

/**
 * Transform a database user to a session user.
 * @param {Omit<DBUser, 'isEmailVerified'|'passwordHash'|'recoveryCode'> & Partial<Pick<DBUser, 'passwordHash'|'recoveryCode'>> & { is2FARegistered?: boolean; isEmailVerified: DBUser['isEmailVerified'] | boolean }} dbUser
 * @returns {User}
 */
export function transformDbUserToUser(dbUser) {
  return {
    id: dbUser.id,
    username: dbUser.username,
    email: dbUser.email,
    isEmailVerified:
      typeof dbUser.isEmailVerified === "number"
        ? dbUser.isEmailVerified === 1
        : !!dbUser.isEmailVerified,
    is2FARegistered: dbUser.is2FARegistered ?? !!dbUser.totpKey,
    isTwoFactorEnabled: !!dbUser.isTwoFactorEnabled,
    createdAt: dateLikeToDate(dbUser.createdAt),
    updatedAt: dbUser.updatedAt,
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
    isTwoFactorVerified: dbSession.isTwoFactorVerified === 1,
    expiresAt: dateLikeToDate(dbSession.expiresAt * 1000),
    createdAt: dateLikeToDate(dbSession.createdAt),
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
    createdAt: dateLikeToDate(dbEmailVerificationRequest.createdAt),
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
    isEmailVerified: dbPasswordResetSession.isEmailVerified === 1,
    isTwoFactorVerified: dbPasswordResetSession.isTwoFactorVerified === 1,
    expiresAt: dateLikeToDate(dbPasswordResetSession.expiresAt * 1000),
    code: dbPasswordResetSession.code,
    email: dbPasswordResetSession.email,
    createdAt: dateLikeToDate(dbPasswordResetSession.createdAt),
  };
}
