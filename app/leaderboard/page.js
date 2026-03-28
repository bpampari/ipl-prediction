import { redirect } from "next/navigation";
import PoolPageHeader from "@/components/pool-page-header";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/data";
import { formatPoints } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({ searchParams }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  const params = await searchParams;
  const message = params?.message ?? "";
  const dashboard = await getDashboardData(user.id);

  if (!dashboard.membership) {
    redirect("/dashboard");
  }

  return (
    <main className="dashboard-shell">
      <PoolPageHeader
        roomName={dashboard.room?.name}
        title="Leaderboard"
        subtitle="See the full season table, every player, and how the room is shaping up."
        isAdmin={dashboard.membership.role === "admin"}
        currentPath="/leaderboard"
      />

      {message ? <div className="notice-banner">{message}</div> : null}

      <section className="dashboard-grid">
        <div className="card card-span">
          <div className="section-head">
            <div>
              <p className="eyebrow">Season standings</p>
              <h2>All users and points</h2>
            </div>
          </div>

          <div className="leaderboard-list">
            {dashboard.standings.map((entry, index) => (
              <div className="leader-row" key={entry.userId}>
                <div className="leader-rank">{index + 1}</div>
                <div>
                  <p className="leader-name">{entry.displayName}</p>
                  <p className="muted-copy">
                    {entry.correctPicks} correct picks in {entry.playedMatches} settled matches
                  </p>
                </div>
                <div className={entry.points >= 0 ? "score-positive" : "score-negative"}>
                  {formatPoints(entry.points)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Room roster</p>
              <h2>All users</h2>
            </div>
          </div>

          <div className="member-list">
            {dashboard.members.map((member) => (
              <div className="member-row" key={member.user_id}>
                <div>
                  <p className="leader-name">{member.displayName}</p>
                  <p className="muted-copy">{member.role === "admin" ? "Admin" : "Player"}</p>
                </div>
                <span className="status-chip">{member.joinedLabel}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Pool summary</p>
              <h2>Season snapshot</h2>
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
              <p>Open picks</p>
              <h3>{dashboard.matches.filter((match) => !match.settled_at).length}</h3>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
