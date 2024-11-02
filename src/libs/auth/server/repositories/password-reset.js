/** @import { PasswordResetSession, PasswordResetSessionValidationResult } from "~/libs/auth/types"; */

import { db } from "~/server/db";
import { dateLikeToDate, dateLikeToNumber } from "../utils/dates";
import {
  transformDbPasswordResetSessionToPasswordResetSession,
  transformDbUserToUser,
} from "../utils/transform";

/**
 * @param {PasswordResetSession} data
 * @returns {Promise<PasswordResetSession>}
 */
export async function createOnePasswordResetSessionRepository(data) {
  return await db.passwordResetSession
    .create({
      data: {
        ...data,
        isEmailVerified: data.isEmailVerified ? 1 : 0,
        isTwoFactorVerified: data.isTwoFactorVerified ? 1 : 0,
        expiresAt: Math.floor(dateLikeToNumber(data.expiresAt) / 1000),
      },
    })
    .then(transformDbPasswordResetSessionToPasswordResetSession);
}

/**
 * @param {string} sessionId - The ID of the password reset session.
 * @returns {Promise<PasswordResetSessionValidationResult>}
 */
export async function findOnePasswordResetSessionWithUserRepository(sessionId) {
  return await db.passwordResetSession
    .findUnique({
      where: { id: sessionId },
      include: { user: true },
    })
    .then((result) => {
      if (!result?.user) {
        return { session: null, user: null };
      }

      const { user, ...session } = result;
      return {
        session: transformDbPasswordResetSessionToPasswordResetSession(session),
        user: transformDbUserToUser(user),
      };
    });
}

/**
 * @param {string} sessionId - The ID of the password reset session.
 */
export async function deleteOnePasswordResetSessionRepository(sessionId) {
  await db.passwordResetSession.delete({ where: { id: sessionId } });
}

/**
 * @param {string} sessionId - The ID of the password reset session.
 * @returns {Promise<void>}
 */
export async function updateOnePasswordResetSessionAsEmailVerifiedRepository(
  sessionId,
) {
  await db.passwordResetSession.update({
    where: { id: sessionId },
    data: { isEmailVerified: 1 },
  });
}

/**
 * @param {string} sessionId - The ID of the password reset session.
 * @returns {Promise<void>}
 */
export async function updateOnePasswordResetSessionAs2FAVerifiedRepository(
  sessionId,
) {
  await db.passwordResetSession.update({
    where: { id: sessionId },
    data: { isTwoFactorVerified: 1 },
  });
}

/**
 * @param {string} userId - The ID of the user.
 * @returns {Promise<void>}
 */
export async function deleteAllPasswordResetSessionsForUserRepository(userId) {
  await db.passwordResetSession.deleteMany({ where: { userId } });
}
