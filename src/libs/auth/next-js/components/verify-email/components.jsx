"use client";

/** @import { ActionResult } from "./actions"; */

import {
  resendEmailVerificationCodeAction,
  verifyEmailAction,
} from "./actions";
import { useFormState } from "react-dom";

/** @type {ActionResult} */
const emailVerificationInitialState = {
  type: "idle",
};

export function EmailVerificationForm() {
  const [state, action] = useFormState(
    verifyEmailAction,
    emailVerificationInitialState,
  );
  return (
    <form action={action}>
      <label htmlFor="form-verify.code">Code</label>
      <input id="form-verify.code" name="code" required />
      <button>Verify</button>
      <p>{state.message}</p>
    </form>
  );
}

/** @type {ActionResult} */
const resendEmailInitialState = {
  type: "idle",
};

export function ResendEmailVerificationCodeForm() {
  const [state, action] = useFormState(
    resendEmailVerificationCodeAction,
    resendEmailInitialState,
  );
  return (
    <form action={action}>
      <button>Resend code</button>
      <p>{state.message}</p>
    </form>
  );
}
