import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="landing-shell">
      <section className="landing-hero">
        <div className="hero-copy-block">
          <p className="eyebrow">IPL Pool</p>
          <h1>Run your 8-player IPL prediction room like a real product.</h1>
          <p className="lead">
            Players sign in with Google or phone OTP, pick the match winner, and the
            pool settles automatically after each result.
          </p>
          <div className="hero-actions">
            <Link className="primary-link" href="/auth">
              Get started
            </Link>
            <Link className="secondary-link" href="/auth">
              Sign in to your room
            </Link>
          </div>
        </div>

        <div className="hero-panel">
          <p className="eyebrow">Room Rules</p>
          <ul className="feature-list">
            <li>Single room with maximum 8 players</li>
            <li>50 points staked per prediction</li>
            <li>Correct picks split the losing pool</li>
            <li>Admin can create matches and settle outcomes</li>
            <li>Leaderboard tracks full season performance</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
