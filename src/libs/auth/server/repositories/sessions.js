/** @import { Session, DBUser, User } from "~/libs/auth/types"; */
import { db } from "~/server/db";
import { dateLikeToNumber } from "~/libs/auth/server/utils/dates";
import {
  transformDbSessionToSession,
  transformDbUserToUser,
} from "../utils/transform";

/**
 * Creates a new session in the database.
 *
 * @param {Session} session - The session data to be stored.
 * @returns {Promise<Session>} A promise that resolves to the stored session.
 */
export async function createOneSessionRepository(session) {
  return db.session
    .create({
      data: {
        ...session,
        expiresAt: dateLikeToNumber(session.expiresAt) / 1000,
        isTwoFactorVerified: session.isTwoFactorVerified ? 1 : 0,
      },
    })
    .then(transformDbSessionToSession);
}

/**
 * Finds a session by its ID, including the associated user.
 *
 * @param {string} sessionId - The ID of the session to be retrieved.
 * @returns {Promise<{ session: Session, user: User } | null>}
 * A promise that resolves to the session and user data, or null if not found.
 */
export async function findOneSessionByIdRepository(sessionId) {
  return db.session
    .findUnique({
      where: { id: sessionId },
      include: { user: true },
    })
    .then((result) => {
      if (result === null) {
        return null;
      }
      const { user, ...session } = result;
      return {
        session: transformDbSessionToSession(session),
        user: transformDbUserToUser(user),
      };
    });
}

/**
 * Updates the expiration date of a session in the database.
 *
 * @param {string} sessionId - The ID of the session to update.
 * @param {Date} expiresAt - The new expiration date.
 * @returns {Promise<Session>} A promise that resolves to the updated session.
 */
export async function updateSessionExpirationByIdRepository(
  sessionId,
  expiresAt,
) {
  return db.session
    .update({
      where: { id: sessionId },
      data: { expiresAt: expiresAt.getTime() },
    })
    .then(transformDbSessionToSession);
}

/**
 * Deletes a session from the database by its ID.
 *
 * Can be used to invalidates (deletes) a session by its session ID.
 *
 * Once invalidated, the session will no longer be valid for authentication.
 *
 * @param {string} sessionId - The ID of the session to be deleted.
 * @returns {Promise<void>} A promise that resolves when the session is deleted.
 */
export async function deleteSessionByIdRepository(sessionId) {
  await db.session.delete({
    where: { id: sessionId },
  });
}

/**
 * Deletes all sessions associated with a user from the database.
 *
 * @param {string} userId - The ID of the user whose sessions should be deleted.
 * @returns {Promise<void>}
 */
export async function invalidateUserSessionsRepository(userId) {
  await db.session.deleteMany({
    where: { userId },
  });
}

/**
 * Marks a session as having successfully verified two-factor authentication.
 *
 * @param {string} sessionId - The ID of the session to be updated.
 * @returns {Promise<void>}
 */
export async function setSessionAs2FAVerifiedRepository(sessionId) {
  await db.session.update({
    where: { id: sessionId },
    data: { isTwoFactorVerified: 1 },
  });
}

/**
 * Marks all sessions as having a not successfully verified two-factor authentication.
 * @param {string} userId - The ID of the user whose sessions should be updated.
 * @param {import("@prisma/client").Prisma.TransactionClient} [tx] - Transaction client
 * @returns {Promise<void>}
 */
export async function setAllSessionsAsNot2FAVerifiedRepository(userId, tx) {
  await (tx ?? db).session.updateMany({
    where: { userId },
    data: { isTwoFactorVerified: 0 },
  });
}
