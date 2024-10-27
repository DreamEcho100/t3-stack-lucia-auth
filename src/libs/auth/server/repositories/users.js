/** @import { User } from "~/libs/auth/types"; */
import { db } from "~/server/db";

import { decrypt, decryptToString } from "~/libs/auth/server/utils/encryption";
import { transformDbUserToUser } from "../utils/transform";

/**
 * Create a new user in the database.
 * @param {string} email
 * @param {string} username
 * @param {string} passwordHash
 * @param {Uint8Array} encryptedRecoveryCode
 * @returns {Promise<User>}
 */
export async function createUserRepository(
  email,
  username,
  passwordHash,
  encryptedRecoveryCode,
) {
  return await db.user
    .create({
      data: {
        email,
        username,
        passwordHash,
        recoveryCode: Buffer.from(encryptedRecoveryCode),
        emailVerified: 0, // Default value as unverified
      },
    })
    .then(transformDbUserToUser);
}

/**
 * Update the user's password in the database.
 * @param {string} userId
 * @param {string} passwordHash
 * @returns {Promise<User>}
 */
export async function updateUserPasswordRepository(userId, passwordHash) {
  return await db.user
    .update({
      where: { id: userId },
      data: { passwordHash },
    })
    .then(transformDbUserToUser);
}

/**
 * Update the user's email in the database.
 * @param {string} userId
 * @param {string} email
 * @returns {Promise<User>}
 */
export async function updateUserEmailAndSetEmailAsVerifiedRepository(
  userId,
  email,
) {
  return await db.user
    .update({
      where: { id: userId },
      data: { email, emailVerified: 1 }, // Mark email as verified
    })
    .then(transformDbUserToUser);
}

/**
 * Get a user's password hash from the database.
 * @param {string} userId
 * @returns {Promise<string|null>}
 */
export async function getUserPasswordHashRepository(userId) {
  const result = await db.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  return result?.passwordHash ?? null;
}

/**
 * Get a user's recovery code from the database and decrypt it.
 * @param {string} userId
 * @returns {Promise<string | null>}
 */
export async function getUserRecoveryCodeRepository(userId) {
  const result = await db.user.findUnique({
    where: { id: userId },
    select: { recoveryCode: true },
  });

  return result?.recoveryCode ? decryptToString(result.recoveryCode) : null;
}

/**
 * Get a user's TOTP key from the database and decrypt it.
 * @param {string} userId
 * @returns {Promise<Uint8Array | null>}
 */
export async function getUserTOTPKeyRepository(userId) {
  const result = await db.user.findUnique({
    where: { id: userId },
    select: { totpKey: true },
  });

  if (
    !result?.totpKey ||
    /** @type {typeof result.totpKey | 0} */ (result?.totpKey) === 0
  ) {
    return null;
  }

  const encrypted = result.totpKey;

  return decrypt(encrypted);
}

/**
 * Update the user's TOTP key in the database.
 * @param {string} userId
 * @param {Uint8Array} encryptedKey
 * @returns {Promise<User>}
 */
export async function updateUserTOTPKeyRepository(userId, encryptedKey) {
  return await db.user
    .update({
      where: { id: userId },
      data: { totpKey: Buffer.from(encryptedKey) },
    })
    .then(transformDbUserToUser);
}

/**
 * Reset the user's recovery code in the database.
 * @param {string} userId
 * @param {Uint8Array} encryptedRecoveryCode
 * @returns {Promise<User>}
 */
export async function resetUserRecoveryCodeRepository(
  userId,
  encryptedRecoveryCode,
) {
  return await db.user
    .update({
      where: { id: userId },
      data: { recoveryCode: Buffer.from(encryptedRecoveryCode) },
    })
    .then(transformDbUserToUser);
}

/**
 * Set user email as verified if the provided email matches the one in the database.
 * @param {string} userId
 * @param {string} email
 * @returns {Promise<User>}
 */
export async function setUserAsEmailVerifiedIfEmailMatchesRepository(
  userId,
  email,
) {
  return await db.user
    .update({
      where: { id: userId, email },
      data: { emailVerified: 1 }, // Mark email as verified
    })
    .then(transformDbUserToUser);
}

/**
 * Get a user by their email from the database.
 * @param {string} email
 * @returns {Promise<User | null>}
 */
export async function getUserByEmailRepository(email) {
  return await db.user
    .findUnique({
      where: { email },
    })
    .then((result) => result && transformDbUserToUser(result));
}

/**
 * find user by id
 * @param {string} userId
 * @param {import("@prisma/client").Prisma.TransactionClient} [tx] - Transaction client
 * @returns {Promise<Uint8Array | null | undefined>}
 */
export async function getOneUserRecoveryCodeRepository(userId, tx) {
  return await (tx ?? db).user
    .findUnique({
      where: { id: userId },
    })
    .then(
      (result) =>
        result?.recoveryCode &&
        new Uint8Array(
          result.recoveryCode.buffer,
          result.recoveryCode.byteOffset,
          result.recoveryCode.byteLength,
        ),
    );
}

/**
 * Update the user's recovery code in the database.
 * @param {string} userId
 * @param {Uint8Array} encryptedNewRecoveryCode
 * @param {Uint8Array} userRecoveryCode
 * @param {import("@prisma/client").Prisma.TransactionClient} [tx] - Transaction client
 * @returns {Promise<Uint8Array | null>}
 */
export async function updateUserRecoveryCodeRepository(
  userId,
  encryptedNewRecoveryCode,
  userRecoveryCode,
  tx,
) {
  return await (tx ?? db).user
    .update({
      where: { id: userId, recoveryCode: Buffer.from(userRecoveryCode) },
      data: {
        recoveryCode: Buffer.from(encryptedNewRecoveryCode),
        totpKey: null,
      },
    })
    .then(
      (result) =>
        result?.recoveryCode &&
        new Uint8Array(
          result.recoveryCode.buffer,
          result.recoveryCode.byteOffset,
          result.recoveryCode.byteLength,
        ),
    );
}
