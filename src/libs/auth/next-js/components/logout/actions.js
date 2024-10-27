"use server";

import { redirect } from "next/navigation";
import { deleteSessionByIdRepository } from "~/libs/auth/server/repositories/sessions";
import { getCurrentSession } from "~/libs/auth/next-js/utils/get-current-session";
import { deleteSessionTokenCookie } from "~/libs/auth/server/utils/sessions";
import { cookies } from "next/headers";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 *
 * @returns {Promise<ActionResult>}
 */
export async function logoutAction() {
  const { session } = await getCurrentSession();
  if (session === null) {
    return {
      message: "Not authenticated",
      // messageCode: "NOT_AUTHENTICATED",
      type: "error",
      statusCode: 401,
    };
  }
  await deleteSessionByIdRepository(session.id);
  const cookiesManager = cookies();
  deleteSessionTokenCookie(cookiesManager.set);
  return redirect("/auth/login");
}
