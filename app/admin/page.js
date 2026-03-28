import { redirect } from "next/navigation";
import MatchSettlementCard from "@/components/match-settlement-card";
import PoolPageHeader from "@/components/pool-page-header";
import { createMatchAction, seedMatchesAction, settleMatchAction } from "@/app/dashboard/actions";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }) {
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

  if (dashboard.membership.role !== "admin") {
    redirect("/dashboard?message=Admin+access+only");
  }

  return (
    <main className="dashboard-shell">
      <PoolPageHeader
        roomName={dashboard.room?.name}
        title="Admin"
        subtitle="Create fixtures, review every pick, and settle each match after the game."
        isAdmin
        currentPath="/admin"
      />

      {message ? <div className="notice-banner">{message}</div> : null}

      <section className="dashboard-grid">
        <div className="card card-span">
          <div className="section-head">
            <div>
              <p className="eyebrow">Admin</p>
              <h2>Create a new IPL match</h2>
            </div>
          </div>

          <form action={createMatchAction} className="match-form-grid">
            <label>
              Team 1
              <input name="teamA" placeholder="Mumbai Indians" required />
            </label>
            <label>
              Team 2
              <input name="teamB" placeholder="Chennai Super Kings" required />
            </label>
            <label>
              Match date
              <input name="matchDate" type="date" required />
            </label>
            <label>
              Match time
              <input name="matchTime" type="time" defaultValue="19:30" required />
            </label>
            <button className="primary-button align-bottom" type="submit">
              Add match
            </button>
          </form>

          <div className="admin-tools">
            <div>
              <p className="leader-name">Quick setup</p>
              <p className="muted-copy">
                Seed a small sample IPL fixture list so the room can start using the product immediately.
              </p>
            </div>
            <form action={seedMatchesAction}>
              <button className="ghost-button" type="submit">
                Seed sample matches
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="card card-span">
          <div className="section-head">
            <div>
              <p className="eyebrow">Match control</p>
              <h2>All picks and result settlement</h2>
            </div>
          </div>

          <div className="card-list">
            {dashboard.matches.length ? (
              dashboard.matches.map((match) => (
                <MatchSettlementCard
                  key={match.id}
                  match={match}
                  predictions={dashboard.predictionsForMatch[match.id] || []}
                  members={dashboard.members}
                  isAdmin
                  settleMatchAction={settleMatchAction}
                />
              ))
            ) : (
              <div className="empty-card">No matches yet. Create the first fixture above.</div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
