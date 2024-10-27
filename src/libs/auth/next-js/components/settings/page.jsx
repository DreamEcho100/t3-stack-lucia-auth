import Link from "next/link";

import {
  RecoveryCodeSection,
  UpdateEmailForm,
  UpdatePasswordForm,
} from "./components";
import { redirect } from "next/navigation";
import { getCurrentSession } from "~/libs/auth/next-js/utils/get-current-session";
import { getUserRecoveryCodeRepository } from "~/libs/auth/server/repositories/users";

export default async function AuthSettingsPage() {
  const { session, user } = await getCurrentSession();

  if (session === null) {
    return redirect("/auth/login");
  }
  if (user.registered2FA && !session.twoFactorVerified) {
    return redirect("/auth/2fa");
  }

  /** @type {string | null} */
  let recoveryCode = null;
  if (user.registered2FA) {
    recoveryCode = await getUserRecoveryCodeRepository(user.id);
  }
  return (
    <>
      <header>
        <Link href="/">Home</Link>
        <Link href="/settings">Settings</Link>
      </header>
      <main>
        <h1>Settings</h1>
        <section>
          <h2>Update email</h2>
          <p>Your email: {user.email}</p>
          <UpdateEmailForm />
        </section>
        <section>
          <h2>Update password</h2>
          <UpdatePasswordForm />
        </section>
        {user.registered2FA && (
          <section>
            <h2>Update two-factor authentication</h2>
            <Link href="/auth/2fa/setup">Update</Link>
          </section>
        )}
        {recoveryCode !== null && (
          <RecoveryCodeSection recoveryCode={recoveryCode} />
        )}
      </main>
    </>
  );
}
