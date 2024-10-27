import { TwoFactorSetUpForm } from "./components";

import { encodeBase64 } from "@oslojs/encoding";
import { createTOTPKeyURI } from "@oslojs/otp";
import { redirect } from "next/navigation";
import { renderSVG } from "uqr";
import { getCurrentSession } from "~/libs/auth/next-js/utils/get-current-session";

export default async function AuthTwoFactorSetUpPage() {
  const { session, user } = await getCurrentSession();
  if (session === null) {
    return redirect("/auth/login");
  }
  if (!user.emailVerified) {
    return redirect("/auth/verify-email");
  }

  if (!user.isTwoFactorEnabled) {
    return redirect("/");
  }

  if (user.registered2FA && !session.twoFactorVerified) {
    return redirect("/auth/2fa");
  }

  const totpKey = new Uint8Array(20);
  crypto.getRandomValues(totpKey);
  const encodedTOTPKey = encodeBase64(totpKey);
  const keyURI = createTOTPKeyURI("Demo", user.username, totpKey, 30, 6);
  const qrcode = renderSVG(keyURI);
  return (
    <>
      <h1>Set up two-factor authentication</h1>
      <div
        style={{
          width: "200px",
          height: "200px",
        }}
        dangerouslySetInnerHTML={{ __html: qrcode }}
      ></div>
      <TwoFactorSetUpForm encodedTOTPKey={encodedTOTPKey} />
    </>
  );
}
