"use client";

import { useState, useTransition } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function AuthPanel({ message }) {
  const supabase = createBrowserSupabaseClient();
  const [status, setStatus] = useState(message || "");
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

  return (
    <section className="auth-panel">
      <div className="stack-gap">
        <button className="primary-button" type="button" onClick={handleGoogleLogin} disabled={isPending}>
          Continue with Google
        </button>

        <div className="status-text">
          Google sign-in is active for this build. Once you sign in, you can join the main room and start making picks.
        </div>

        {status ? <div className="status-text">{status}</div> : null}
      </div>
    </section>
  );
}
