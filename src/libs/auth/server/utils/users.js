/**
 * @import { DBUser, User } from "~/libs/auth/types";
 */

import { hashPassword } from "~/libs/auth/server/utils/passwords";
import { encryptString } from "~/libs/auth/server/utils/encryption";
import { generateRandomRecoveryCode } from "~/libs/auth/server/utils/generate-random-recovery-code";
import { encrypt } from "~/libs/auth/server/utils/encryption";
import {
  createUserRepository,
  resetUserRecoveryCodeRepository,
  updateUserPasswordRepository,
  updateUserTOTPKeyRepository,
} from "~/libs/auth/server/repositories/users";

/**
 * Create a new user.
 * @param {string} email
 * @param {string} username
 * @param {string} password
 * @returns {Promise<User>}
 */
export async function createUser(email, username, password) {
  const passwordHash = await hashPassword(password);
  const recoveryCode = generateRandomRecoveryCode();
  const encryptedRecoveryCode = encryptString(recoveryCode);

  const result = await createUserRepository(
    email,
    username,
    passwordHash,
    encryptedRecoveryCode,
  );

  return result;
}

/**
 * Reset the user's recovery code and return it.
 * @param {string} userId
 * @returns {Promise<string>}
 */
export async function resetUserRecoveryCode(userId) {
  const recoveryCode = generateRandomRecoveryCode();
  const encryptedCode = encryptString(recoveryCode);
  const result = await resetUserRecoveryCodeRepository(userId, encryptedCode);

  if (!result) {
    throw new Error(`User with ID ${userId} not found`);
  }

  return recoveryCode;
}

// /**
//  * Update the user's email and mark the email as verified.
//  * @param {string} userId
//  * @param {string} email
//  * @returns {Promise<User>}
//  */
// export async function updateUserEmailAndSetEmailAsVerified(userId, email) {
//   const result = await updateUserEmailRepository(userId, email);

//   if (!result) {
//     throw new Error(`User with ID ${userId} not found`);
//   }

//   return result;
// }

/**
 * Update a user's password.
 * @param {string} userId
 * @param {string} password
 * @returns {Promise<User>}
 */
export async function updateUserPassword(userId, password) {
  const passwordHash = await hashPassword(password);
  const result = await updateUserPasswordRepository(userId, passwordHash);

  if (!result) {
    throw new Error(`User with ID ${userId} not found`);
  }

  return result;
}

/**
 * Update the user's TOTP key.
 * @param {string} userId
 * @param {Uint8Array} key
 * @returns {Promise<User>}
 */
export async function updateUserTOTPKey(userId, key) {
  const encryptedKey = encrypt(key);
  const result = await updateUserTOTPKeyRepository(userId, encryptedKey);

  if (!result) {
    throw new Error(`User with ID ${userId} not found`);
  }

  return result;
}
