// client/src/pages/Proctor.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useGame } from "../useGame";
import { score, tbCorrect, tbFinalize, setBet } from "../api";

export default function Proctor() {
  const { proctorId } = useParams();
  const { game } = useGame();

  const [busyTeamId, setBusyTeamId] = useState(null);
  const [flash, setFlash] = useState({ teamId: null, type: null }); // type: "ok" | "err"
  const [errorMsg, setErrorMsg] = useState("");

  // ✅ local editable bets per teamId
  const [betDrafts, setBetDrafts] = useState({}); // { [teamId]: string }

  const proctor = game.proctors.find((p) => p.id === proctorId);

  const assignedTeams = useMemo(() => {
    if (!proctor) return [];
    return proctor.teamIds
      .map((id) => game.teams.find((t) => t.id === id))
      .filter(Boolean);
  }, [proctor, game.teams]);

  // ✅ keep drafts in sync when server updates bets / assignments change
  useEffect(() => {
    if (!proctor) return;

    setBetDrafts((prev) => {
      const next = { ...prev };
      for (const teamId of proctor.teamIds) {
        // Only initialize if not already typed by user
        if (next[teamId] === undefined) {
          next[teamId] = String(game.bets?.[teamId] ?? 0);
        }
      }
      // remove drafts for teams no longer assigned
      for (const key of Object.keys(next)) {
        if (!proctor.teamIds.includes(key)) delete next[key];
      }
      return next;
    });
  }, [proctor?.id, proctor?.teamIds, game.bets]);

  if (!proctor) return <div className="card">Unknown proctor: {proctorId}</div>;

  const phase = game.state.phase;

  const scoringDisabled = !game.state.scoringOpen;
  const betsDisabled = !game.state.betsOpen;

  function flashRow(teamId, type) {
    setFlash({ teamId, type });
    setTimeout(() => setFlash({ teamId: null, type: null }), 500);
  }

  async function handleScore(teamId, result) {
    setErrorMsg("");
    setBusyTeamId(teamId);

    try {
      await score(proctor.id, teamId, result);
      flashRow(teamId, "ok");
    } catch (e) {
      setErrorMsg(e?.message || "Scoring failed.");
      flashRow(teamId, "err");
    } finally {
      setBusyTeamId(null);
    }
  }

  async function handleTieBreakCorrect(teamId) {
    setErrorMsg("");
    setBusyTeamId(teamId);

    try {
      await tbCorrect(proctor.id, teamId);
      flashRow(teamId, "ok");
      setTimeout(() => tbFinalize(), 600);
    } catch (e) {
      setErrorMsg(e?.message || "Tie-break submit failed.");
      flashRow(teamId, "err");
    } finally {
      setBusyTeamId(null);
    }
  }

  async function handleBetSubmit(teamId) {
    setErrorMsg("");
    setBusyTeamId(teamId);

    try {
      const raw = betDrafts[teamId] ?? "0";
      const bet = Number(raw);
      await setBet(proctor.id, teamId, bet);
      flashRow(teamId, "ok");
    } catch (e) {
      setErrorMsg(e?.message || "Bet update failed.");
      flashRow(teamId, "err");
    } finally {
      setBusyTeamId(null);
    }
  }

  return (
    <div className="grid">
      <div className="card">
        <div className="h1">{proctor.name}</div>

        <div className="muted" style={{ marginTop: 6 }}>
          Phase: <b>{phase}</b> • Clue #{game.state.clueNumber} •{" "}
          {phase === "EASY" || phase === "AVERAGE" ? (
            <>
              Value: <b>{game.state.clueValue}</b>
            </>
          ) : (
            <> (Bet-based / special)</>
          )}
        </div>

        <div className="muted" style={{ marginTop: 6 }}>
          Scoring is <b>{game.state.scoringOpen ? "OPEN" : "CLOSED"}</b>
          {phase === "DIFFICULT" && (
            <>
              {" "}
              • Bets are <b>{game.state.betsOpen ? "OPEN" : "CLOSED"}</b>
            </>
          )}
        </div>

        {errorMsg && (
          <div style={{ marginTop: 10, color: "#dc2626", fontWeight: 600 }}>
            {errorMsg}
          </div>
        )}
      </div>

      <div className="card">
        <div className="h1">Assigned Teams ({assignedTeams.length}/5)</div>

        {assignedTeams.length === 0 ? (
          <div className="muted">No teams assigned yet. Go to Assignments page.</div>
        ) : (
          <table className="table" style={{ marginTop: 10 }}>
            <thead>
              <tr>
                <th>Team</th>
                <th>Score</th>
                <th style={{ width: 560 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignedTeams.map((t) => {
                const isBusy = busyTeamId === t.id;
                const isElim = !!t.eliminated;

                // Round-specific disqualified (Final): score <= 0 in DIFFICULT
                const isDQ = phase === "DIFFICULT" && t.score <= 0 && !isElim;

                const rowStyle =
                  flash.teamId === t.id
                    ? {
                        outline:
                          flash.type === "ok" ? "2px solid #16a34a" : "2px solid #dc2626",
                        borderRadius: 8,
                      }
                    : isDQ
                    ? { opacity: 0.65, background: "#fff7ed" }
                    : undefined;

                const disableScoreButtons =
                  isBusy || isElim || isDQ || (phase !== "TIE_BREAKER" && scoringDisabled);

                const disableBetControls = isBusy || isElim || isDQ || betsDisabled;

                const draft = betDrafts[t.id] ?? String(game.bets?.[t.id] ?? 0);
                const saved = String(game.bets?.[t.id] ?? 0);
                const isDirty = draft !== saved;

                return (
                  <tr key={t.id} style={rowStyle}>
                    <td>
                      {t.name}{" "}
                      {isElim && (
                        <span style={{ color: "#dc2626", fontWeight: 700 }}>(ELIM)</span>
                      )}
                      {isDQ && (
                        <span style={{ color: "#f97316", fontWeight: 700 }}>
                          (DISQUALIFIED)
                        </span>
                      )}
                    </td>
                    <td>
                      <b>{t.score}</b>
                    </td>
                    <td>
                      {phase === "DIFFICULT" && (
                        <div className="row" style={{ marginBottom: 8, alignItems: "center" }}>
                          <input
                            className="input"
                            style={{ width: 120 }}
                            type="number"
                            min={0}
                            max={t.score}
                            value={draft}
                            onChange={(e) =>
                              setBetDrafts((prev) => ({ ...prev, [t.id]: e.target.value }))
                            }
                            disabled={disableBetControls}
                          />
                          <span className="muted">bet (≤ {t.score})</span>

                          <button
                            className={"btn " + (isDirty ? "" : "secondary")}
                            disabled={disableBetControls || !isDirty}
                            onClick={() => handleBetSubmit(t.id)}
                          >
                            {isBusy ? "..." : "Submit Bet"}
                          </button>

                          {!betsDisabled && !isElim && !isDQ && (
                            <span className="muted">
                              {isDirty ? "• not saved" : "• saved"}
                            </span>
                          )}

                          {betsDisabled && <span className="muted">• bets are closed</span>}
                        </div>
                      )}

                      {phase !== "TIE_BREAKER" ? (
                        <div className="row">
                          <button
                            className="btn"
                            disabled={disableScoreButtons}
                            onClick={() => handleScore(t.id, "correct")}
                          >
                            {isBusy ? "..." : "✅ Correct"}
                          </button>
                          <button
                            className="btn secondary"
                            disabled={disableScoreButtons}
                            onClick={() => handleScore(t.id, "wrong")}
                          >
                            ❌ Wrong
                          </button>
                          <button
                            className="btn secondary"
                            disabled={disableScoreButtons}
                            onClick={() => handleScore(t.id, "no_answer")}
                          >
                            — No Answer
                          </button>
                        </div>
                      ) : (
                        <div className="row">
                          <button
                            className="btn"
                            disabled={isBusy || isElim}
                            onClick={() => handleTieBreakCorrect(t.id)}
                          >
                            {isBusy ? "..." : "⚡ Tie-break Correct"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div className="h1">Clincher candidates</div>
        {game.clincher.needed ? (
          <div style={{ marginTop: 8 }}>
            {game.clincher.tiedTeamIds.map((id) => {
              const team = game.teams.find((t) => t.id === id);
              return <div key={id}>{team ? team.name : id}</div>;
            })}
          </div>
        ) : (
          <div className="muted" style={{ marginTop: 8 }}>
            No tie for highest score.
          </div>
        )}
      </div>
    </div>
  );
}
