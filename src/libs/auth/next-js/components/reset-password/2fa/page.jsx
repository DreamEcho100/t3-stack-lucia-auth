import { validatePasswordResetSessionRequest } from "~/libs/auth/server/utils/password-reset";
import {
  PasswordResetRecoveryCodeForm,
  PasswordResetTOTPForm,
} from "./components";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function AuthPasswordReset2FAVerificationPage() {
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

  if (
    !user.isTwoFactorEnabled ||
    !user.registered2FA ||
    session.twoFactorVerified
  ) {
    return redirect("/auth/reset-password");
  }
  return (
    <>
      <h1>Two-factor authentication</h1>
      <p>Enter the code from your authenticator app.</p>
      <PasswordResetTOTPForm />
      <section>
        <h2>Use your recovery code instead</h2>
        <PasswordResetRecoveryCodeForm />
      </section>
    </>
  );
}
