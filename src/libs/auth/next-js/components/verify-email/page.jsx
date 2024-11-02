import Link from "next/link";
import {
  EmailVerificationForm,
  ResendEmailVerificationCodeForm,
} from "./components";

import { redirect } from "next/navigation";
import { getUserEmailVerificationRequestFromRequest } from "~/libs/auth/server/utils/email-verification";
import { getCurrentSession } from "~/libs/auth/next-js/utils/get-current-session";
import { cookies } from "next/headers";

export default async function AuthVerifyEmailPage() {
  const { user, session } = await getCurrentSession();
  if (user === null) {
    return redirect("/auth/login");
  }

  // TODO: Ideally we'd sent a new verification email automatically if the previous one is expired,
  // but we can't set cookies inside server components.
  const verificationRequest = await getUserEmailVerificationRequestFromRequest(
    () => ({ user, session }),
    (name) => cookies().get(name)?.value,
    cookies().set,
  );
  if (verificationRequest === null && user.isEmailVerified) {
    return redirect("/");
  }
  return (
    <>
      <h1>Verify your email address</h1>
      <p>
        We sent an 8-digit code to {verificationRequest?.email ?? user.email}.
      </p>
      <EmailVerificationForm />
      <ResendEmailVerificationCodeForm />
      <Link href="/settings">Change your email</Link>
    </>
  );
}
