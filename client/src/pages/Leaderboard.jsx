// client/src/pages/Leaderboard.jsx
import { useState } from "react";
import { useGame } from "../useGame";

export default function Leaderboard() {
  const { game } = useGame();
  const [showTop10, setShowTop10] = useState(false);

  const phase = game.state.phase;
  const rows = game.leaderboard || [];

  function statusOf(t) {
    if (t.eliminated) return { label: "ELIM", color: "#dc2626" };
    if (phase === "DIFFICULT" && t.score <= 0)
      return { label: "DISQUALIFIED", color: "#f97316" };
    return { label: "OK", color: "#16a34a" };
  }

  function podiumStyle(rank) {
    if (rank === 1) return { background: "#fde68a" }; // gold
    if (rank === 2) return { background: "#e5e7eb" }; // silver
    if (rank === 3) return { background: "#fbcfe8" }; // bronze
    return {};
  }

  return (
    <div className="grid">
      {/* Main leaderboard */}
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <div className="h1">Leaderboard</div>
            <div className="muted">Live rankings</div>
          </div>
          <button className="btn" onClick={() => setShowTop10(true)}>
            Show Top 10
          </button>
        </div>

        <table className="table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th style={{ width: 60 }}>Rank</th>
              <th>Team</th>
              <th style={{ width: 100 }}>Score</th>
              <th style={{ width: 140 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t, idx) => {
              const rank = idx + 1;
              const status = statusOf(t);

              return (
                <tr key={t.id} style={podiumStyle(rank)}>
                  <td>
                    <b>{rank}</b>
                  </td>
                  <td>
                    <b>{t.name}</b>
                  </td>
                  <td>
                    <b>{t.score}</b>
                  </td>
                  <td>
                    <span
                      style={{
                        fontWeight: 700,
                        color: status.color,
                      }}
                    >
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Clincher info */}
      <div className="card">
        <div className="h1">Clincher Status</div>
        {game.clincher.needed ? (
          <div style={{ marginTop: 8 }}>
            <div className="muted">Tied teams for highest score:</div>
            <ul>
              {game.clincher.tiedTeamIds.map((id) => {
                const team = game.teams.find((t) => t.id === id);
                return <li key={id}>{team?.name ?? id}</li>;
              })}
            </ul>
          </div>
        ) : (
          <div className="muted" style={{ marginTop: 8 }}>
            No tie for highest score.
          </div>
        )}
      </div>

      {/* Top 10 Modal */}
      {showTop10 && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setShowTop10(false)}
        >
          <div
            className="card"
            style={{
              width: "90%",
              maxWidth: 720,
              maxHeight: "80vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div className="h1">Top 10 Teams</div>
              <button className="btn secondary" onClick={() => setShowTop10(false)}>
                Close
              </button>
            </div>

            <table className="table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th style={{ width: 60 }}>#</th>
                  <th>Team</th>
                  <th style={{ width: 100 }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((t, idx) => (
                  <tr key={t.id} style={podiumStyle(idx + 1)}>
                    <td>
                      <b>{idx + 1}</b>
                    </td>
                    <td>
                      <b>{t.name}</b>
                    </td>
                    <td>
                      <b>{t.score}</b>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="muted" style={{ marginTop: 10 }}>
              For public display · Updates live
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
