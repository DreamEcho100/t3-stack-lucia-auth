import { ForgotPasswordForm } from "./components";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <>
      <h1>Forgot your password?</h1>
      <ForgotPasswordForm />
      <Link href="/auth/login">Sign in</Link>
    </>
  );
}
