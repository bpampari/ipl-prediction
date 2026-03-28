import { redirect } from "next/navigation";
import AuthPanel from "@/components/auth-panel";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AuthPage({ searchParams }) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const message = params?.message ?? "";

  return (
    <main className="auth-shell">
      <section className="auth-layout">
        <div className="auth-copy">
          <p className="eyebrow">Welcome back</p>
          <h1>Sign in with Google and start making your IPL picks.</h1>
          <p className="lead">
            The first 8 members can join the room. The first member becomes admin and
            manages match creation, seeding sample fixtures, and result settlement.
          </p>
        </div>

        <AuthPanel message={message} />
      </section>
    </main>
  );
}
