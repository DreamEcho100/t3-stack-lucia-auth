"use client";

/** @import { ActionResult } from "./actions"; */

import { useFormState } from "react-dom";
import { verifyPasswordResetEmailAction } from "./actions";

/** @type {ActionResult} */
const initialState = {
  type: "idle",
};

export function PasswordResetEmailVerificationForm() {
  const [state, action] = useFormState(
    verifyPasswordResetEmailAction,
    initialState,
  );

  return (
    <form action={action}>
      <label htmlFor="form-verify.code">Code</label>
      <input id="form-verify.code" name="code" required />
      <button>verify</button>
      <p>{state.message}</p>
    </form>
  );
}
