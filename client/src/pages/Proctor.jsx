// client/src/pages/Proctor.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useGame } from "../useGame";
import { score, tbCorrect, tbFinalize, setBet } from "../api";

export default function Proctor() {
  const { proctorId } = useParams();
  const { game } = useGame();

  const [busyTeamId, setBusyTeamId] = useState(null);
  const [flash, setFlash] = useState({ teamId: null, type: null }); // "ok" | "err"
  const [errorMsg, setErrorMsg] = useState("");

  // local editable bets
  const [betDrafts, setBetDrafts] = useState({}); // { [teamId]: string }

  const proctor = game.proctors.find((p) => p.id === proctorId);

  const assignedTeams = useMemo(() => {
    if (!proctor) return [];
    return proctor.teamIds
      .map((id) => game.teams.find((t) => t.id === id))
      .filter(Boolean);
  }, [proctor, game.teams]);

  // keep drafts in sync with server
  useEffect(() => {
    if (!proctor) return;

    setBetDrafts((prev) => {
      const next = { ...prev };

      for (const teamId of proctor.teamIds) {
        if (next[teamId] === undefined) {
          next[teamId] = String(game.bets?.[teamId] ?? 0);
        }
      }

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
    setTimeout(() => setFlash({ teamId: null, type: null }), 550);
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
    <div className="p-root">
      <style>{`
        .p-root{ color:#fff; }
        .p-hero{
          border-radius:18px;
          border:2px solid #22d3ee;
          background:#000;
          padding:14px 16px;
          box-shadow: 0 18px 55px rgba(0,0,0,.35);
        }
        .p-title{
          margin:0;
          font-size:18px;
          font-weight:1000;
          letter-spacing:.08em;
          text-transform:uppercase;
        }
        .p-sub{
          margin-top:6px;
          color:rgba(255,255,255,.75);
          font-size:13px;
          line-height:1.35;
        }
        .p-badges{
          margin-top:10px;
          display:flex;
          flex-wrap:wrap;
          gap:8px;
          align-items:center;
        }
        .badge{
          display:inline-flex;
          align-items:center;
          gap:8px;
          padding:6px 10px;
          border-radius:999px;
          border:1px solid rgba(255,255,255,.14);
          background:#0b1020;
          font-weight:1000;
          font-size:12px;
          letter-spacing:.06em;
          text-transform:uppercase;
          color:rgba(255,255,255,.9);
        }
        .badge.good{ border-color: rgba(34,197,94,.35); }
        .badge.warn{ border-color: rgba(249,115,22,.35); }
        .badge.bad{ border-color: rgba(239,68,68,.35); }

        .p-error{
          margin-top:10px;
          color:#f87171;
          font-weight:1000;
          background:#1a0b0b;
          border:1px solid rgba(239,68,68,.35);
          padding:10px 12px;
          border-radius:14px;
        }

        .p-section{
          margin-top:12px;
          border-radius:18px;
          border:1px solid #1f2937;
          background:#06070f;
          padding:14px;
          box-shadow: 0 14px 45px rgba(0,0,0,.28);
        }

        .p-sectionTitle{
          font-size:13px;
          font-weight:1000;
          letter-spacing:.12em;
          text-transform:uppercase;
          color:rgba(255,255,255,.75);
          margin:0;
        }
        .p-sectionSub{
          margin-top:6px;
          color:rgba(255,255,255,.68);
          font-size:13px;
        }

        .teamGrid{
          margin-top:12px;
          display:grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap:12px;
        }

        .teamCard{
          border-radius:18px;
          border:1px solid rgba(255,255,255,.12);
          background:#000;
          padding:12px;
        }

        .teamTop{
          display:flex;
          justify-content:space-between;
          gap:10px;
          align-items:flex-start;
        }

        .teamName{
          font-weight:1000;
          font-size:15px;
          line-height:1.2;
        }

        .teamScore{
          text-align:right;
        }
        .scoreNum{
          font-size:22px;
          font-weight:1000;
          letter-spacing:.04em;
        }
        .scoreLbl{
          font-size:11px;
          color:rgba(255,255,255,.7);
          text-transform:uppercase;
          letter-spacing:.12em;
          font-weight:1000;
        }

        .tag{
          display:inline-flex;
          align-items:center;
          gap:6px;
          margin-top:6px;
          padding:6px 10px;
          border-radius:999px;
          font-size:11px;
          font-weight:1000;
          letter-spacing:.08em;
          text-transform:uppercase;
          border:1px solid rgba(255,255,255,.14);
          background:#0b1020;
        }
        .tag.elim{ border-color: rgba(239,68,68,.35); color:#f87171; }
        .tag.dq{ border-color: rgba(249,115,22,.35); color:#fdba74; }
        .tag.ok{ border-color: rgba(34,197,94,.35); color:#86efac; }

        .flashOk{ outline: 2px solid #22c55e; }
        .flashErr{ outline: 2px solid #ef4444; }

        .btnRow{
          margin-top:10px;
          display:flex;
          gap:8px;
          flex-wrap:wrap;
        }
        .btn{
          border:none;
          border-radius:14px;
          padding:12px 12px;
          cursor:pointer;
          font-weight:1000;
          touch-action: manipulation;
        }
        .btn.primary{
          background: linear-gradient(90deg,#22d3ee,#a78bfa);
          color:#041018;
        }
        .btn.secondary{
          background:#111827;
          color:#fff;
          border:1px solid rgba(255,255,255,.14);
        }
        .btn.danger{
          background: rgba(239,68,68,.18);
          color:#fff;
          border:1px solid rgba(239,68,68,.35);
        }
        .btn:disabled{
          opacity:.55;
          cursor:not-allowed;
        }
        .btn:active{ transform: translateY(1px); }

        .betRow{
          margin-top:10px;
          display:flex;
          gap:8px;
          flex-wrap:wrap;
          align-items:center;
        }
        .betInput{
          width:110px;
          border-radius:14px;
          border:1px solid rgba(255,255,255,.14);
          background:#000;
          color:#fff;
          padding:10px 12px;
          font-weight:1000;
          outline:none;
        }
        .betHint{
          font-size:12px;
          color:rgba(255,255,255,.7);
          font-weight:900;
        }
        .betState{
          font-size:12px;
          font-weight:1000;
          color:rgba(255,255,255,.75);
        }

        .clincherList{
          margin-top:10px;
          display:flex;
          gap:8px;
          flex-wrap:wrap;
        }
        .pill{
          padding:8px 10px;
          border-radius:999px;
          border:1px solid rgba(255,255,255,.14);
          background:#000;
          font-weight:1000;
          font-size:12px;
          color:rgba(255,255,255,.9);
        }

        @media (max-width: 900px){
          .teamGrid{ grid-template-columns: 1fr; }
          .btn{ width:100%; }
          .betInput{ width:100%; }
        }
      `}</style>

      {/* HERO */}
      <div className="p-hero">
        <h1 className="p-title">{proctor.name}</h1>
        <div className="p-sub">
          Phase: <b>{phase}</b> • Clue #{game.state.clueNumber}{" "}
          {(phase === "EASY" || phase === "AVERAGE") && (
            <>
              • Value: <b>{game.state.clueValue}</b>
            </>
          )}
        </div>

        <div className="p-badges">
          <span className={`badge ${game.state.scoringOpen ? "good" : "bad"}`}>
            🎚 Scoring: {game.state.scoringOpen ? "OPEN" : "CLOSED"}
          </span>

          {phase === "DIFFICULT" && (
            <span className={`badge ${game.state.betsOpen ? "warn" : "bad"}`}>
              🎲 Bets: {game.state.betsOpen ? "OPEN" : "CLOSED"}
            </span>
          )}
        </div>

        {errorMsg && <div className="p-error">{errorMsg}</div>}
      </div>

      {/* ASSIGNED TEAMS */}
      <div className="p-section">
        <h2 className="p-sectionTitle">
          Assigned Teams ({assignedTeams.length}/5)
        </h2>
        <div className="p-sectionSub">
          Tap a result button once per clue. It updates live for everyone.
        </div>

        {assignedTeams.length === 0 ? (
          <div className="p-sectionSub" style={{ marginTop: 10 }}>
            No teams assigned yet. Ask the Game Master to run Auto-Assign or Save assignments.
          </div>
        ) : (
          <div className="teamGrid">
            {assignedTeams.map((t) => {
              const isBusy = busyTeamId === t.id;
              const isElim = !!t.eliminated;
              const isDQ = phase === "DIFFICULT" && t.score <= 0 && !isElim;

              const disableScoreButtons =
                isBusy || isElim || isDQ || (phase !== "TIE_BREAKER" && scoringDisabled);

              const disableBetControls = isBusy || isElim || isDQ || betsDisabled;

              const draft = betDrafts[t.id] ?? String(game.bets?.[t.id] ?? 0);
              const saved = String(game.bets?.[t.id] ?? 0);
              const isDirty = draft !== saved;

              const flashClass =
                flash.teamId === t.id
                  ? flash.type === "ok"
                    ? "flashOk"
                    : "flashErr"
                  : "";

              const tag =
                isElim ? { cls: "elim", txt: "ELIM" }
                : isDQ ? { cls: "dq", txt: "DISQUALIFIED" }
                : { cls: "ok", txt: "OK" };

              return (
                <div className={`teamCard ${flashClass}`} key={t.id}>
                  <div className="teamTop">
                    <div>
                      <div className="teamName">{t.name}</div>
                      <div className={`tag ${tag.cls}`}>● {tag.txt}</div>
                    </div>

                    <div className="teamScore">
                      <div className="scoreNum">{t.score}</div>
                      <div className="scoreLbl">score</div>
                    </div>
                  </div>

                  {phase === "DIFFICULT" && (
                    <div className="betRow">
                      <input
                        className="betInput"
                        type="number"
                        min={0}
                        max={t.score}
                        value={draft}
                        onChange={(e) =>
                          setBetDrafts((prev) => ({ ...prev, [t.id]: e.target.value }))
                        }
                        disabled={disableBetControls}
                        inputMode="numeric"
                      />

                      <span className="betHint">bet ≤ {t.score}</span>

                      <button
                        className={`btn ${isDirty ? "primary" : "secondary"}`}
                        disabled={disableBetControls || !isDirty}
                        onClick={() => handleBetSubmit(t.id)}
                      >
                        {isBusy ? "..." : "Submit Bet"}
                      </button>

                      {!betsDisabled && !isElim && !isDQ && (
                        <span className="betState">
                          {isDirty ? "Not saved" : "Saved"}
                        </span>
                      )}

                      {betsDisabled && (
                        <span className="betState">Bets closed</span>
                      )}
                    </div>
                  )}

                  {phase !== "TIE_BREAKER" ? (
                    <div className="btnRow">
                      <button
                        className="btn primary"
                        disabled={disableScoreButtons}
                        onClick={() => handleScore(t.id, "correct")}
                      >
                        ✅ Correct
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
                    <div className="btnRow">
                      <button
                        className="btn primary"
                        disabled={isBusy || isElim}
                        onClick={() => handleTieBreakCorrect(t.id)}
                      >
                        ⚡ Tie-break Correct
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CLINCHER */}
      <div className="p-section">
        <h2 className="p-sectionTitle">Clincher Candidates</h2>
        {game.clincher.needed ? (
          <div className="clincherList">
            {game.clincher.tiedTeamIds.map((id) => {
              const team = game.teams.find((t) => t.id === id);
              return <span className="pill" key={id}>{team ? team.name : id}</span>;
            })}
          </div>
        ) : (
          <div className="p-sectionSub" style={{ marginTop: 10 }}>
            No tie for highest score.
          </div>
        )}
      </div>
    </div>
  );
}
