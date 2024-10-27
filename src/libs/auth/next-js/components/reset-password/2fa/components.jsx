"use client";

/** @import { ActionResult } from "./actions"; */

import { useFormState } from "react-dom";
import {
  verifyPasswordReset2FAWithRecoveryCodeAction,
  verifyPasswordReset2FAWithTOTPAction,
} from "./actions";

/** @type {ActionResult} */
const initialPasswordResetTOTPState = {
  type: "idle",
};

export function PasswordResetTOTPForm() {
  const [state, action] = useFormState(
    verifyPasswordReset2FAWithTOTPAction,
    initialPasswordResetTOTPState,
  );

  return (
    <form action={action}>
      <label htmlFor="form-totp.code">Code</label>
      <input id="form-totp.code" name="code" required />
      <br />
      <button>Verify</button>
      <p>{state.message}</p>
    </form>
  );
}

/** @type {ActionResult} */
const initialPasswordResetRecoveryCodeState = {
  type: "idle",
};

export function PasswordResetRecoveryCodeForm() {
  const [state, action] = useFormState(
    verifyPasswordReset2FAWithRecoveryCodeAction,
    initialPasswordResetRecoveryCodeState,
  );

  return (
    <form action={action}>
      <label htmlFor="form-recovery-code.code">Recovery code</label>
      <input id="form-recovery-code.code" name="code" required />
      <br />
      <br />
      <button>Verify</button>
      <p>{state.message}</p>
    </form>
  );
}
