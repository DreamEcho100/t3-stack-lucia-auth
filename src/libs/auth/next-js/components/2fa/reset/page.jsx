import { TwoFactorResetForm } from "./components";

import { redirect } from "next/navigation";
import { getCurrentSession } from "~/libs/auth/next-js/utils/get-current-session";

export default async function AuthTwoFactorResetPage() {
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
      <h1>Recover your account</h1>
      <TwoFactorResetForm />
    </>
  );
}
