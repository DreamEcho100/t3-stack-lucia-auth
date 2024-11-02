import { validatePasswordResetSessionRequest } from "~/libs/auth/server/utils/password-reset";
import { PasswordResetForm } from "./components";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function AuthPasswordResetPage() {
  const cookiesManager = cookies();
  const { session, user } = await validatePasswordResetSessionRequest(
    (name) => cookiesManager.get(name)?.value,
    cookiesManager.set,
  );

  if (session === null) {
    return redirect("/auth/forgot-password");
  }
  if (!session.isEmailVerified) {
    return redirect("/auth/reset-password/verify-email");
  }

  if (
    user.isTwoFactorEnabled &&
    user.is2FARegistered &&
    !session.isTwoFactorVerified
  ) {
    return redirect("/auth/reset-password/2fa");
  }

  return (
    <>
      <h1>Enter your new password</h1>
      <PasswordResetForm />
    </>
  );
}
