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
        <div className="stadium-card">
          <div className="stadium-copy">
            <p className="eyebrow light-eyebrow">Friends Night League</p>
            <h1>Call the winner. Back your instinct. Climb the table.</h1>
            <p className="stadium-lead">
              Match day bragging rights start here. Pick your side, watch the points move,
              and see who really knows IPL better than the rest of the gang.
            </p>
            <div className="hero-actions">
              <Link className="primary-link" href="/auth">
                Enter the room
              </Link>
              <Link className="secondary-link inverted-link" href="/auth">
                Check today&apos;s picks
              </Link>
            </div>
          </div>

          <div className="stadium-visual" aria-hidden="true">
            <div className="sky-glow" />
            <div className="floodlight floodlight-left" />
            <div className="floodlight floodlight-right" />
            <div className="stadium-bowl" />
            <div className="pitch-ring" />
            <div className="pitch-strip" />
            <div className="crease crease-top" />
            <div className="crease crease-bottom" />
            <div className="wicket wicket-top" />
            <div className="wicket wicket-bottom" />
            <div className="ball-marker" />
          </div>
        </div>

        <div className="hero-panel home-side-panel">
          <p className="eyebrow">How It Feels</p>
          <div className="home-side-copy">
            <h2>Small group. Big banter.</h2>
            <p className="lead">
              Built for one private room where every pick matters and every result reshuffles the mood.
            </p>
          </div>
          <div className="feature-stack">
            <div className="feature-tile">
              <strong>Pick before the toss is history</strong>
              <span>Lock in your call and let the table decide who saw it coming.</span>
            </div>
            <div className="feature-tile">
              <strong>Every match changes the race</strong>
              <span>Wrong calls sting. Right calls pull points from the losing side.</span>
            </div>
            <div className="feature-tile">
              <strong>Season table tells the truth</strong>
              <span>By the end of the IPL, the leaderboard says who actually knows the game.</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
