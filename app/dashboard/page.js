import Link from "next/link";
import { redirect } from "next/navigation";
import MatchPickCard from "@/components/match-pick-card";
import PoolPageHeader from "@/components/pool-page-header";
import { joinDefaultRoomAction, updateProfileAction } from "./actions";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/data";
import { formatPoints } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  const params = await searchParams;
  const message = params?.message ?? "";
  const dashboard = await getDashboardData(user.id);

  return (
    <main className="dashboard-shell">
      <PoolPageHeader
        roomName={dashboard.room?.name}
        title="My Picks"
        subtitle="Lock in your team before match time and keep pace with the season."
        isAdmin={dashboard.membership?.role === "admin"}
        currentPath="/dashboard"
      />

      {message ? <div className="notice-banner">{message}</div> : null}

      {!dashboard.membership ? (
        <section className="join-card">
          <div>
            <p className="eyebrow">Join room</p>
            <h2>Enter the main pool</h2>
            <p className="muted-copy">
              This room allows a maximum of 8 players. The first member becomes admin.
            </p>
          </div>
          <div className="join-meta">
            <p>
              Players joined: <strong>{dashboard.memberCount}/8</strong>
            </p>
            <form action={joinDefaultRoomAction}>
              <button className="primary-button" type="submit" disabled={dashboard.memberCount >= 8}>
                {dashboard.memberCount >= 8 ? "Room full" : "Join this room"}
              </button>
            </form>
          </div>
        </section>
      ) : (
        <>
          <section className="dashboard-grid">
            <div className="card stack-gap">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Your profile</p>
                  <h2>Player identity</h2>
                </div>
              </div>

              <form action={updateProfileAction} className="stack-form">
                <label>
                  Display name
                  <input
                    name="displayName"
                    defaultValue={dashboard.currentProfile?.display_name || user.user_metadata?.full_name || ""}
                    maxLength={40}
                    placeholder="Enter your name"
                    required
                  />
                </label>
                <button className="primary-button" type="submit">
                  Save profile
                </button>
              </form>
            </div>

            <div className="card stack-gap">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Room snapshot</p>
                  <h2>Current pool status</h2>
                </div>
              </div>

              <div className="stat-grid">
                <div className="stat-card">
                  <p>Members</p>
                  <h3>{dashboard.memberCount}/8</h3>
                </div>
                <div className="stat-card">
                  <p>Matches</p>
                  <h3>{dashboard.matches.length}</h3>
                </div>
                <div className="stat-card">
                  <p>Settled</p>
                  <h3>{dashboard.settledCount}</h3>
                </div>
                <div className="stat-card">
                  <p>Your points</p>
                  <h3>{formatPoints(dashboard.currentStanding?.points || 0)}</h3>
                </div>
              </div>
            </div>
          </section>

          <section className="dashboard-grid">
            <div className="card card-span">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Your picks</p>
                  <h2>Choose the winner for each IPL match</h2>
                </div>
              </div>

              <div className="card-list">
                {dashboard.matches.length ? (
                  dashboard.matches.map((match) => (
                    <MatchPickCard
                      key={match.id}
                      match={match}
                      prediction={dashboard.predictionsByMatch[match.id] || null}
                    />
                  ))
                ) : (
                  <div className="empty-card">No matches yet. The admin can add the first fixture.</div>
                )}
              </div>
            </div>
          </section>

          <section className="dashboard-grid">
            <div className="card">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Your position</p>
                  <h2>Season standing</h2>
                </div>
              </div>

              <div className="stat-grid">
                <div className="stat-card">
                  <p>Rank</p>
                  <h3>
                    {Math.max(
                      1,
                      dashboard.standings.findIndex((entry) => entry.userId === user.id) + 1
                    )}
                  </h3>
                </div>
                <div className="stat-card">
                  <p>Correct picks</p>
                  <h3>{dashboard.currentStanding?.correctPicks || 0}</h3>
                </div>
                <div className="stat-card">
                  <p>Played matches</p>
                  <h3>{dashboard.currentStanding?.playedMatches || 0}</h3>
                </div>
                <div className="stat-card">
                  <p>Total points</p>
                  <h3>{formatPoints(dashboard.currentStanding?.points || 0)}</h3>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Quick links</p>
                  <h2>Room pages</h2>
                </div>
              </div>

              <div className="member-list">
                <Link className="quick-link-card" href="/leaderboard">
                  <strong>Open leaderboard</strong>
                  <span>See every player and the full season table.</span>
                </Link>
                {dashboard.membership.role === "admin" ? (
                  <Link className="quick-link-card" href="/admin">
                    <strong>Open admin page</strong>
                    <span>Create matches, review picks, and settle results.</span>
                  </Link>
                ) : null}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
