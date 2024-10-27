import { encodeBase32UpperCaseNoPadding } from "@oslojs/encoding";

export function generateRandomRecoveryCode() {
  const recoveryCodeBytes = new Uint8Array(10);
  crypto.getRandomValues(recoveryCodeBytes);
  const recoveryCode = encodeBase32UpperCaseNoPadding(recoveryCodeBytes);
  return recoveryCode;
}
