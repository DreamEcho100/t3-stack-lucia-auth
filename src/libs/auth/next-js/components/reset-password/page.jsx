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
  if (!session.emailVerified) {
    return redirect("/auth/reset-password/verify-email");
  }

  const shouldRedirectTo2FA =
    !user.isTwoFactorEnabled ||
    (user.registered2FA && !session.twoFactorVerified);

  if (shouldRedirectTo2FA) {
    return redirect("/auth/reset-password/2fa");
  }

  return (
    <>
      <h1>Enter your new password</h1>
      <PasswordResetForm />
    </>
  );
}
