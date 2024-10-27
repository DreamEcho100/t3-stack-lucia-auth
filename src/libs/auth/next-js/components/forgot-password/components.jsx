"use client";

/** @import { ActionResult } from "./actions"; */

import { useFormState } from "react-dom";
import { forgotPasswordAction } from "./actions";

/** @type {ActionResult} */
const initialState = {
  type: "idle",
};

export function ForgotPasswordForm() {
  const [state, action] = useFormState(forgotPasswordAction, initialState);

  return (
    <form action={action}>
      <label htmlFor="form-forgot.email">Email</label>
      <input type="email" id="form-forgot.email" name="email" required />
      <br />
      <button>Send</button>
      <p>{state.message}</p>
    </form>
  );
}
