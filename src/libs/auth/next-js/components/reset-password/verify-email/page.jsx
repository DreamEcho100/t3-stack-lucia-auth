import { PasswordResetEmailVerificationForm } from "./components";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validatePasswordResetSessionRequest } from "~/libs/auth/server/utils/password-reset";

export default async function AuthPasswordResetEmailVerificationPage() {
  const cookiesManager = cookies();
  const { session } = await validatePasswordResetSessionRequest(
    (name) => cookiesManager.get(name)?.value,
    cookiesManager.set,
  );

  if (session === null) {
    return redirect("/auth/forgot-password");
  }
  if (session.emailVerified) {
    if (!session.twoFactorVerified) {
      return redirect("/auth/reset-password/2fa");
    }
    return redirect("/auth/reset-password");
  }

  return (
    <>
      <h1>Verify your email address</h1>
      <p>We sent an 8-digit code to {session.email}.</p>
      <PasswordResetEmailVerificationForm />
    </>
  );
}
