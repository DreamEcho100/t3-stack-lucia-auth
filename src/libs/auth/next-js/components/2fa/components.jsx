"use client";

/** @import { ActionResult } from "./actions"; */

import { verify2FAAction } from "./actions";
import { useFormState } from "react-dom";

/** @type {ActionResult} */
const initialState = {
  type: "idle",
};

export function TwoFactorVerificationForm() {
  const [state, action] = useFormState(verify2FAAction, initialState);

  return (
    <form action={action}>
      <label htmlFor="form-totp.code">Code</label>
      <input
        id="form-totp.code"
        name="code"
        autoComplete="one-time-code"
        required
      />
      <br />
      <button>Verify</button>
      <p>{state.message}</p>
    </form>
  );
}
