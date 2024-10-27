import { decodeBase64 } from "@oslojs/encoding";
import { createCipheriv, createDecipheriv } from "crypto";
import { DynamicBuffer } from "@oslojs/binary";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY is not set in the environment");
}

const key = decodeBase64(ENCRYPTION_KEY);

/**
 * @param {Uint8Array} data - The data to be encrypted.
 * @returns {Uint8Array} The encrypted data.
 */
export function encrypt(data) {
  const iv = new Uint8Array(16);
  crypto.getRandomValues(iv);
  const cipher = createCipheriv("aes-128-gcm", key, iv);
  const encrypted = new DynamicBuffer(0);
  encrypted.write(iv);
  encrypted.write(cipher.update(data));
  encrypted.write(cipher.final());
  encrypted.write(cipher.getAuthTag());
  return encrypted.bytes();
}

/**
 * @param {string} data - The string to be encrypted.
 * @returns {Uint8Array} The encrypted data.
 */
export function encryptString(data) {
  return encrypt(new TextEncoder().encode(data));
}

/**
 * @param {Uint8Array} encrypted - The encrypted data.
 * @returns {Uint8Array} The decrypted data.
 */
export function decrypt(encrypted) {
  if (encrypted.byteLength < 33) {
    throw new Error("Invalid data");
  }
  const decipher = createDecipheriv("aes-128-gcm", key, encrypted.slice(0, 16));
  decipher.setAuthTag(encrypted.slice(encrypted.byteLength - 16));
  const decrypted = new DynamicBuffer(0);
  decrypted.write(
    decipher.update(encrypted.slice(16, encrypted.byteLength - 16)),
  );
  decrypted.write(decipher.final());
  return decrypted.bytes();
}

/**
 * @param {Uint8Array} data - The data to be decrypted.
 * @returns {string} The decrypted data.
 */
export function decryptToString(data) {
  return new TextDecoder().decode(decrypt(data));
}
