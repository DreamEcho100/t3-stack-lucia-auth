/** @import { EmailVerificationRequest, SessionValidationResult, DateLike } from "~/libs/auth/types"; */
import { db } from "~/server/db";
import {
  dateLikeToDate,
  dateLikeToNumber,
} from "~/libs/auth/server/utils/dates";
import { transformDbEmailVerificationRequestToEmailVerificationRequest } from "../utils/transform";

/**
 * Get the email verification request for a user.
 * @param {string} userId - The user ID.
 * @returns {Promise<void>} A promise that resolves when the requests have been deleted.
 */
export async function deleteOneUserEmailVerificationRequestRepository(userId) {
  await db.emailVerificationRequest.deleteMany({ where: { userId: userId } });
}

/**
 * Create an email verification request for a user.
 * @param {string} userId - The user ID.
 * @param {string} id - The request ID.
 * @returns {Promise<EmailVerificationRequest | null>} The email verification request, or null if not found.
 */
export async function findOneUserEmailVerificationRequestRepository(
  userId,
  id,
) {
  return await db.emailVerificationRequest
    .findUnique({ where: { id: id, userId: userId } })
    .then(
      /** @returns {EmailVerificationRequest | null} */
      (result) =>
        result &&
        transformDbEmailVerificationRequestToEmailVerificationRequest(result),
    );
}

/**
 * Create an email verification request for a user.
 * @param {{
 *  id: string;
 *  userId: string;
 *  code: string;
 *  email: string;
 *  expiresAt: DateLike;
 * }} data - The request data.
 * @returns {Promise<EmailVerificationRequest>} The email verification request.
 */
export async function createOneEmailVerificationRequestRepository(data) {
  return await db.emailVerificationRequest
    .create({
      data: {
        ...data,
        expiresAt: Math.floor(dateLikeToNumber(data.expiresAt) / 1000),
      },
    })
    .then(transformDbEmailVerificationRequestToEmailVerificationRequest);
}
