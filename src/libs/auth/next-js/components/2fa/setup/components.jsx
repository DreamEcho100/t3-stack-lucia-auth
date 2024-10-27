"use client";

/** @import { ActionResult } from "./actions"; */

import { setup2FAAction } from "./actions";
import { useFormState } from "react-dom";

/** @type {ActionResult} */
const initialState = {
  type: "idle",
};

/** @param {{ encodedTOTPKey: string }} props */
export function TwoFactorSetUpForm(props) {
  const [state, action] = useFormState(setup2FAAction, initialState);
  return (
    <form action={action}>
      <input name="key" value={props.encodedTOTPKey} hidden required />
      <label htmlFor="form-totp.code">Verify the code from the app</label>
      <input id="form-totp.code" name="code" required />
      <br />
      <button>Save</button>
      <p>{state.message}</p>
    </form>
  );
}
