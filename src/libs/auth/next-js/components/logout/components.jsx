"use client";

/** @import { ActionResult } from "./actions"; */

import { logoutAction } from "./actions";
import { useFormState } from "react-dom";

/** @type {ActionResult} */
const initialState = {
  type: "idle",
};
export function LogoutButton() {
  const [, action] = useFormState(logoutAction, initialState);
  return (
    <form action={action}>
      <button>Sign out</button>
    </form>
  );
}
