import { redirect } from "next/navigation";
import MatchPickCard from "@/components/match-pick-card";
import MatchSettlementCard from "@/components/match-settlement-card";
import { createMatchAction, joinDefaultRoomAction, seedMatchesAction, settleMatchAction, signOutAction, updateProfileAction } from "./actions";
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
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">IPL 2026 Main Pool</p>
          <h1>{dashboard.room?.name || "IPL Predictor Pool"}</h1>
          <p className="lead">
            One room, 8 players, live picks, and automatic score settlement after every match.
          </p>
        </div>

        <form action={signOutAction}>
          <button className="ghost-button" type="submit">
            Sign out
          </button>
        </form>
      </section>

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
                  <p className="eyebrow">Leaderboard</p>
                  <h2>Season standings</h2>
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

            <div className="card">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Members</p>
                  <h2>Room roster</h2>
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
          </section>

          <section className="dashboard-grid">
            <div className="card card-span">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Stored picks</p>
                  <h2>Match results and all player predictions</h2>
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
                      isAdmin={dashboard.membership.role === "admin"}
                      settleMatchAction={settleMatchAction}
                    />
                  ))
                ) : (
                  <div className="empty-card">Match settlement will appear here once fixtures are added.</div>
                )}
              </div>
            </div>
          </section>

          {dashboard.membership.role === "admin" ? (
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
          ) : null}
        </>
      )}
    </main>
  );
}
