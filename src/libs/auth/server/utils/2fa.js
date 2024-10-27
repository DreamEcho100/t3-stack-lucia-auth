import { decryptToString, encryptString } from "./encryption";
import { generateRandomRecoveryCode } from "./generate-random-recovery-code";
import {
  getOneUserRecoveryCodeRepository,
  updateUserRecoveryCodeRepository,
} from "../repositories/users";
import { setAllSessionsAsNot2FAVerifiedRepository } from "../repositories/sessions";
import { db } from "~/server/db";
// import { generateRandomRecoveryCode } from "./utils";

/**
 * Reset the user's 2FA with a recovery code.
 * @param {string} userId - The user ID.
 * @param {string} recoveryCode - The recovery code.
 * @returns {Promise<boolean>} - True if the 2FA was reset, false otherwise.
 */
export async function resetUser2FAWithRecoveryCode(userId, recoveryCode) {
  // Note: In Postgres and MySQL, these queries should be done in a transaction using SELECT FOR UPDATE
  return await db.$transaction(async (tx) => {
    //
    const userRecoveryCodeStored = await getOneUserRecoveryCodeRepository(
      userId,
      tx,
    );
    if (!userRecoveryCodeStored) {
      return false;
    }
    const userRecoveryCode = decryptToString(userRecoveryCodeStored);
    if (recoveryCode !== userRecoveryCode) {
      return false;
    }

    const newRecoveryCode = generateRandomRecoveryCode();
    const encryptedNewRecoveryCode = encryptString(newRecoveryCode);
    await setAllSessionsAsNot2FAVerifiedRepository(userId, tx);

    const updatedUserRecoveryCode = await updateUserRecoveryCodeRepository(
      userId,
      encryptedNewRecoveryCode,
      userRecoveryCodeStored,
      tx,
    );

    return (
      !!updatedUserRecoveryCode &&
      updatedUserRecoveryCode !== userRecoveryCodeStored
    );
  });
}
