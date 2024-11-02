import Link from "next/link";

import { TwoFactorVerificationForm } from "./components";
import { redirect } from "next/navigation";
import { getCurrentSession } from "~/libs/auth/next-js/utils/get-current-session";

export default async function AuthTwoFactorVerificationPage() {
  const { session, user } = await getCurrentSession();

  if (session === null) {
    return redirect("/auth/login");
  }

  if (!user.isEmailVerified) {
    return redirect("/auth/verify-email");
  }

  if (!user.isTwoFactorEnabled) {
    return redirect("/");
  }
  if (!user.is2FARegistered) {
    return redirect("/auth/2fa/setup");
  }
  if (session.isTwoFactorVerified) {
    return redirect("/");
  }

  return (
    <>
      <h1>Two-factor authentication</h1>
      <p>Enter the code from your authenticator app.</p>
      <TwoFactorVerificationForm />
      <Link href="/auth/2fa/reset">Use recovery code</Link>
    </>
  );
}
