import Link from "next/link";

import { redirect } from "next/navigation";
import { getCurrentSession } from "~/libs/auth/next-js/utils/get-current-session";
import { getUserRecoveryCodeRepository } from "~/libs/auth/server/repositories/users";

export default async function AuthRecoveryCodePage() {
  const { session, user } = await getCurrentSession();

  if (session === null) {
    return redirect("/auth/login");
  }
  if (!user.emailVerified) {
    return redirect("/auth/verify-email");
  }
  if (!user.registered2FA) {
    return redirect("/auth/2fa/setup");
  }
  if (!session.twoFactorVerified) {
    return redirect("/auth/2fa");
  }
  const recoveryCode = await getUserRecoveryCodeRepository(user.id);

  return (
    <>
      <h1>Recovery code</h1>
      <p>Your recovery code is: {recoveryCode}</p>
      <p>
        You can use this recovery code if you lose access to your second
        factors.
      </p>
      <Link href="/">Next</Link>
    </>
  );
}
