import { formatPoints } from "@/lib/format";

export default function MatchSettlementCard({ match, predictions, members, isAdmin, settleMatchAction }) {
  return (
    <article className="settlement-card">
      <div className="settlement-head">
        <div>
          <h3>{match.team_a} vs {match.team_b}</h3>
          <p className="muted-copy">{match.match_date_label}</p>
        </div>
        <span className="status-chip">{match.settled_at ? "Settled" : "Awaiting result"}</span>
      </div>

      <div className="prediction-table-wrap">
        <table className="prediction-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Pick</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const prediction = predictions.find((entry) => entry.user_id === member.user_id);
              const delta = prediction?.points_delta;
              const scoreClass =
                typeof delta === "number"
                  ? delta < 0
                    ? "score-negative"
                    : "score-positive"
                  : "score-neutral";

              return (
                <tr key={member.user_id}>
                  <td>{member.displayName}</td>
                  <td>{prediction?.predicted_team || "No pick"}</td>
                  <td className={scoreClass}>
                    {typeof delta === "number" ? formatPoints(delta) : match.settled_at ? "No score" : "Pending"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {match.settled_at ? (
        <p className="muted-copy">
          Winner: <strong>{match.actual_winner}</strong>
        </p>
      ) : isAdmin ? (
        <form action={settleMatchAction} className="match-form-grid">
          <input type="hidden" name="matchId" value={match.id} />
          <label>
            Actual winner
            <select name="actualWinner" required defaultValue="">
              <option value="" disabled>
                Select winner
              </option>
              <option value={match.team_a}>{match.team_a}</option>
              <option value={match.team_b}>{match.team_b}</option>
            </select>
          </label>
          <button className="primary-button align-bottom" type="submit">
            Settle match
          </button>
        </form>
      ) : (
        <p className="muted-copy">The admin will settle this match after the result is confirmed.</p>
      )}
    </article>
  );
}
