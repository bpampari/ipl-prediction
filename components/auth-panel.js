"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function AuthPanel({ message }) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState(message || "");
  const [otpSent, setOtpSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleGoogleLogin() {
    startTransition(async () => {
      setStatus("");

      const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo }
      });

      if (error) {
        setStatus(error.message);
      }
    });
  }

  function handlePhoneLogin(event) {
    event.preventDefault();

    startTransition(async () => {
      setStatus("");
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          channel: "sms"
        }
      });

      if (error) {
        setStatus(error.message);
        return;
      }

      setOtpSent(true);
      setStatus("OTP sent. Enter the code from your phone to finish login.");
    });
  }

  function handleOtpVerification(event) {
    event.preventDefault();

    startTransition(async () => {
      setStatus("");
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: "sms"
      });

      if (error) {
        setStatus(error.message);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <section className="auth-panel">
      <div className="stack-gap">
        <button className="primary-button" type="button" onClick={handleGoogleLogin} disabled={isPending}>
          Continue with Google
        </button>

        <div className="auth-divider">or use phone OTP</div>

        <form className="stack-form" onSubmit={handlePhoneLogin}>
          <label>
            Mobile number
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+919876543210"
              required
            />
          </label>
          <button className="secondary-link" type="submit" disabled={isPending}>
            Send OTP
          </button>
        </form>

        {otpSent ? (
          <form className="stack-form" onSubmit={handleOtpVerification}>
            <label>
              OTP code
              <input
                inputMode="numeric"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="123456"
                required
              />
            </label>
            <button className="primary-button" type="submit" disabled={isPending}>
              Verify and sign in
            </button>
          </form>
        ) : null}

        {status ? <div className="status-text">{status}</div> : null}
      </div>
    </section>
  );
}
