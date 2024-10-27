"use client";

/** @import { ActionResult } from "./actions"; */

import { reset2FAAction } from "./actions";
import { useFormState } from "react-dom";

/** @type {ActionResult} */
const initialState = {
  type: "idle",
};

export function TwoFactorResetForm() {
  const [state, action] = useFormState(reset2FAAction, initialState);
  return (
    <form action={action}>
      <label htmlFor="form-totp.code">Recovery code</label>
      <input id="form-totp.code" name="code" required />
      <br />
      <button>Verify</button>
      <p>{state.message ?? ""}</p>
    </form>
  );
}
