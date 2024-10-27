import { hash, verify } from "@node-rs/argon2";
import { sha1 } from "@oslojs/crypto/sha1";
import { encodeHexLowerCase } from "@oslojs/encoding";

/**
 * @param {string} password - The password to be hashed.
 * @returns {Promise<string>} A promise that resolves to the hashed password.
 */
export async function hashPassword(password) {
  return await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
}

/**
 * @param {string} hash - The hashed password.
 * @param {string} password - The password to be verified.
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the password is verified.
 */
export async function verifyPasswordHash(hash, password) {
  return await verify(hash, password);
}

/**
 * @param {string} password - The password to be verified.
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the password is strong.
 */
export async function verifyPasswordStrength(password) {
  if (password.length < 8 || password.length > 255) {
    return false;
  }
  const hash = encodeHexLowerCase(sha1(new TextEncoder().encode(password)));
  const hashPrefix = hash.slice(0, 5);
  const response = await fetch(
    `https://api.pwnedpasswords.com/range/${hashPrefix}`,
  );
  const data = await response.text();
  const items = data.split("\n");
  for (const item of items) {
    const hashSuffix = item.slice(0, 35).toLowerCase();
    if (hash === hashPrefix + hashSuffix) {
      return false;
    }
  }
  return true;
}
