"use client";

import { useState, useTransition } from "react";
import { savePredictionAction } from "@/app/dashboard/actions";

export default function MatchPickCard({ match, prediction }) {
  const [selectedTeam, setSelectedTeam] = useState(prediction?.predicted_team || "");
  const [status, setStatus] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event) {
    event.preventDefault();

    startTransition(async () => {
      const result = await savePredictionAction({
        matchId: match.id,
        predictedTeam: selectedTeam
      });

      setStatus(result.error ? result.error : "Choice saved.");
    });
  }

  const isLocked = Boolean(match.settled_at || match.predictions_locked);

  return (
    <article className="pick-card">
      <div className="pick-card-head">
        <div>
          <h3>{match.team_a} vs {match.team_b}</h3>
          <p className="muted-copy">{match.match_date_label}</p>
        </div>
        <span className="status-chip">{isLocked ? "Locked" : "Open"}</span>
      </div>

      <form className="stack-form" onSubmit={handleSubmit}>
        <label>
          Your prediction
          <select
            value={selectedTeam}
            onChange={(event) => setSelectedTeam(event.target.value)}
            disabled={isLocked || isPending}
            required
          >
            <option value="">Select winner</option>
            <option value={match.team_a}>{match.team_a}</option>
            <option value={match.team_b}>{match.team_b}</option>
          </select>
        </label>

        <button className="primary-button" type="submit" disabled={isLocked || isPending || !selectedTeam}>
          {isLocked ? "Predictions locked" : "Save my pick"}
        </button>
      </form>

      <p className="prediction-note">
        {isLocked
          ? match.settled_at
            ? prediction
              ? `You selected ${prediction.predicted_team} before settlement.`
              : "You did not submit a pick before this match was settled."
            : prediction
              ? `You selected ${prediction.predicted_team} before the scheduled start time.`
              : "The scheduled match time has passed, so this now counts as a missed pick."
          : prediction
            ? `Saved choice: ${prediction.predicted_team}`
            : "No choice saved yet."}
      </p>

      {status ? <p className="muted-copy">{status}</p> : null}
    </article>
  );
}
