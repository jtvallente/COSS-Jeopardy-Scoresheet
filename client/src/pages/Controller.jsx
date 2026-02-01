// client/src/pages/Controller.jsx
import { useMemo, useState } from "react";
import { useGame } from "../useGame";
import { resetGame, undo, updateState, tbFinalize, tbNewClue, tbResolve } from "../api";

const PHASES = [
  { key: "EASY", label: "EASY", emoji: "🟦" },
  { key: "AVERAGE", label: "AVERAGE", emoji: "🟪" },
  { key: "DIFFICULT", label: "DIFFICULT", emoji: "🟥" },
  { key: "JACKPOT", label: "JACKPOT", emoji: "💰" },
  { key: "TIE_BREAKER", label: "TIE-BREAKER", emoji: "⚡" },
];

const ROUND_LABELS = [
  "VIDEO GAMES",
  "MUSIC",
  "TECH",
  "ANIME",
  "MEMES",
  "FINAL ROUND",
  "TIE BREAKER",
  "JACKPOT",
];

export default function Controller() {
  const { game } = useGame();
  const s = game.state;
  const tb = game.tieBreaker;

  const [confirmReset, setConfirmReset] = useState(false);

  const clincherTeams = useMemo(() => {
    return (game.clincher.tiedTeamIds || [])
      .map((id) => game.teams.find((t) => t.id === id))
      .filter(Boolean);
  }, [game]);

  const allowedValues = useMemo(() => {
    if (s.phase === "EASY") return [100, 200, 300, 400];
    if (s.phase === "AVERAGE") return [200, 400, 600, 800];
    return [];
  }, [s.phase]);

  const scoringOn = !!s.scoringOpen;
  const betsOn = !!s.betsOpen;

  async function doReset() {
    // small safety
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 2500);
      return;
    }
    await resetGame();
    setConfirmReset(false);
  }

  return (
    <div className="ctrl-root">
      <style>{`
        .ctrl-root{
          --glass: rgba(255,255,255,.08);
          --glass2: rgba(255,255,255,.06);
          --border: rgba(255,255,255,.14);
          --text: rgba(255,255,255,.88);
          --muted: rgba(255,255,255,.68);
          color: #fff;
        }

        .ctrl-hero{
          padding: 14px 16px;
          border-radius: 18px;
          border: 1px solid var(--border);
          background:
            radial-gradient(900px 260px at 10% 10%, rgba(99,102,241,.22), transparent 60%),
            radial-gradient(700px 240px at 90% 30%, rgba(236,72,153,.16), transparent 60%),
            linear-gradient(180deg, rgba(10,14,38,.72), rgba(8,10,28,.72));
          box-shadow: 0 18px 55px rgba(0,0,0,.35);
          margin-bottom: 12px;
        }

        .ctrl-title{
          font-size: 24px;
          font-weight: 1000;
          letter-spacing: .08em;
          text-transform: uppercase;
          text-shadow: 0 0 16px rgba(99,102,241,.55);
          margin: 0;
        }

        .ctrl-sub{
          color: var(--muted);
          margin-top: 6px;
          line-height: 1.35;
          font-size: 13px;
        }

        .ctrl-row{
          display:flex;
          gap:10px;
          flex-wrap: wrap;
          margin-top: 12px;
          align-items: center;
        }

        .big-pill{
          border-radius: 999px;
          padding: 8px 12px;
          border: 1px solid var(--border);
          background: var(--glass2);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: var(--text);
        }

        .big-pill b{ color:#fff; }

        .ctrl-grid{
          display:grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 12px;
        }

        .panel{
          border-radius: 18px;
          border: 1px solid var(--border);
          background: rgba(10,14,38,.55);
          backdrop-filter: blur(10px);
          padding: 14px;
          box-shadow: 0 14px 45px rgba(0,0,0,.28);
          overflow:hidden;
        }

        .panel h2{
          margin:0 0 6px;
          font-size: 14px;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: rgba(255,255,255,.75);
          font-weight: 1000;
        }

        .panel p{
          margin:0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.35;
        }

        .stage-btn{
          height: 52px;
          padding: 0 14px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,.16);
          background: rgba(255,255,255,.07);
          color: #fff;
          font-weight: 1000;
          letter-spacing: .02em;
          cursor: pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:10px;
          box-shadow: 0 12px 22px rgba(0,0,0,.25);
          transition: transform .06s ease, filter .2s ease;
          touch-action: manipulation;
          user-select: none;
          width: 100%;
        }
        .stage-btn:active{ transform: translateY(1px) scale(.99); }
        .stage-btn.secondary{ background: rgba(255,255,255,.05); }
        .stage-btn.danger{
          background: linear-gradient(90deg, rgba(239,68,68,.75), rgba(244,63,94,.75));
          border-color: rgba(255,255,255,.14);
          color: #13060b;
        }

        .btn-row{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 10px;
        }

        .kv{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 10px;
        }

        .field{
          border-radius: 16px;
          border: 1px solid var(--border);
          background: rgba(255,255,255,.06);
          padding: 10px;
        }
        .field label{
          display:block;
          font-size: 11px;
          color: var(--muted);
          letter-spacing: .12em;
          text-transform: uppercase;
          margin-bottom: 6px;
          font-weight: 900;
        }
        .field select, .field input{
          width: 100%;
          height: 44px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(5,7,20,.55);
          color:#fff;
          font-weight: 900;
          padding: 0 10px;
          outline:none;
        }
        .field select:focus, .field input:focus{
          box-shadow: 0 0 0 4px rgba(34,211,238,.14);
          border-color: rgba(34,211,238,.55);
        }

        .toggle-row{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 10px;
        }

        .toggle{
          height: 52px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,.16);
          background: rgba(255,255,255,.06);
          color:#fff;
          font-weight: 1000;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding: 0 14px;
          box-shadow: 0 12px 22px rgba(0,0,0,.22);
          touch-action: manipulation;
        }

        .lamp{
          display:inline-flex;
          align-items:center;
          gap:8px;
          font-size: 12px;
          letter-spacing: .1em;
          text-transform: uppercase;
          font-weight: 1000;
        }

        .lamp i{
          width: 12px; height: 12px; border-radius: 99px;
          background: #ef4444;
          box-shadow: none;
        }
        .lamp.on i{
          background: #22c55e;
          box-shadow: 0 0 0 0 rgba(34,197,94,.55);
          animation: pulse 1.4s infinite;
        }

        .value-grid{
          display:grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-top: 10px;
        }

        .chip{
          height: 48px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,.16);
          background: rgba(255,255,255,.06);
          color:#fff;
          font-weight: 1000;
          cursor:pointer;
          box-shadow: 0 12px 20px rgba(0,0,0,.22);
          touch-action: manipulation;
        }
        .chip.active{
          background: linear-gradient(90deg, rgba(34,211,238,.85), rgba(167,139,250,.85));
          color: #071027;
          border-color: rgba(255,255,255,.12);
        }

        .divider{
          height: 1px;
          background: rgba(255,255,255,.12);
          margin: 12px 0;
        }

        .list{
          margin-top: 8px;
          display:flex;
          flex-direction: column;
          gap: 8px;
        }

        .tag{
          display:inline-flex;
          align-items:center;
          gap:8px;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.06);
          font-weight: 900;
          font-size: 12px;
        }

        .tag.good{ border-color: rgba(34,197,94,.35); background: rgba(34,197,94,.12); }
        .tag.bad{ border-color: rgba(248,113,113,.35); background: rgba(248,113,113,.12); }

        @media (max-width: 920px){
          .ctrl-grid{ grid-template-columns: 1fr; }
          .value-grid{ grid-template-columns: repeat(2, 1fr); }
          .btn-row{ grid-template-columns: 1fr; }
          .toggle-row{ grid-template-columns: 1fr; }
          .kv{ grid-template-columns: 1fr; }
        }
      `}</style>

      {/* HERO / TOP BAR */}
      <div className="ctrl-hero">
        <h1 className="ctrl-title">Game Master Control Deck</h1>
        <div className="ctrl-sub">
          This is your “stage panel”. Set the phase, open scoring, open bets, and resolve tie-breakers.
          Everything updates live for proctors.
        </div>

        <div className="ctrl-row">
          <span className="big-pill">
            PHASE: <b>{s.phase}</b>
          </span>
          <span className="big-pill">
            CLUE #: <b>{s.clueNumber}</b>
          </span>
          {(s.phase === "EASY" || s.phase === "AVERAGE") && (
            <span className="big-pill">
              VALUE: <b>{s.clueValue}</b>
            </span>
          )}
          <span className="big-pill">
            TIMER: <b>{s.seconds}s</b>
          </span>
        </div>
      </div>

      <div className="ctrl-grid">
        {/* LEFT: MAIN STATE */}
        <div className="panel">
          <h2>Round / State</h2>
          <p>Choose the phase and adjust the current clue settings.</p>

          <div className="kv">
            <div className="field">
              <label>Phase</label>
              <select value={s.phase} onChange={(e) => updateState({ phase: e.target.value })}>
                {PHASES.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.emoji} {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Round Label</label>
              <select value={s.roundLabel} onChange={(e) => updateState({ roundLabel: e.target.value })}>
                {ROUND_LABELS.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Clue #</label>
              <input
                type="number"
                min={1}
                value={s.clueNumber}
                onChange={(e) => updateState({ clueNumber: Number(e.target.value) })}
              />
            </div>

            <div className="field">
              <label>Seconds</label>
              <input value={s.seconds} disabled />
            </div>
          </div>

          {allowedValues.length > 0 && (
            <>
              <div className="divider" />
              <h2>Clue Value</h2>
              <p>Tap a value. (Only for EASY / AVERAGE)</p>
              <div className="value-grid">
                {allowedValues.map((v) => (
                  <button
                    key={v}
                    className={`chip ${s.clueValue === v ? "active" : ""}`}
                    onClick={() => updateState({ clueValue: v })}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="divider" />

          <h2>Stage Switches</h2>
          <p>These are the big “show buttons”.</p>

          <div className="toggle-row">
            <button className="toggle" onClick={() => updateState({ scoringOpen: !s.scoringOpen })}>
              <span className={`lamp ${scoringOn ? "on" : ""}`}>
                <i /> SCORING {scoringOn ? "OPEN" : "CLOSED"}
              </span>
              <span style={{ fontWeight: 1000 }}>{scoringOn ? "✅" : "⛔"}</span>
            </button>

            {s.phase === "DIFFICULT" ? (
              <button className="toggle" onClick={() => updateState({ betsOpen: !s.betsOpen })}>
                <span className={`lamp ${betsOn ? "on" : ""}`}>
                  <i /> BETS {betsOn ? "OPEN" : "CLOSED"}
                </span>
                <span style={{ fontWeight: 1000 }}>{betsOn ? "🎲" : "🔒"}</span>
              </button>
            ) : (
              <div className="toggle" style={{ opacity: 0.65, cursor: "not-allowed" }}>
                <span className="lamp">
                  <i /> BETS (DIFFICULT ONLY)
                </span>
                <span>—</span>
              </div>
            )}
          </div>

          <div className="divider" />

          <h2>Safety Buttons</h2>
          <p>Undo is safe. Reset wipes everything.</p>

          <div className="btn-row">
            <button className="stage-btn secondary" onClick={() => undo()}>
              ↩️ Undo last action
            </button>

            <button className="stage-btn danger" onClick={doReset}>
              {confirmReset ? "⚠️ TAP AGAIN TO CONFIRM RESET" : "🧨 RESET GAME"}
            </button>
          </div>
        </div>

        {/* RIGHT: CLINCHER + TIE BREAK */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Clincher */}
          <div className="panel">
            <h2>Clincher Detection</h2>
            <p>If top score is tied, these teams are candidates.</p>

            <div className="list">
              {game.clincher.needed ? (
                <>
                  <span className="tag bad">⚠️ Tie detected</span>
                  {clincherTeams.map((t) => (
                    <div key={t.id} className="tag">
                      🧩 {t.name} — <b style={{ marginLeft: 4 }}>{t.score}</b>
                    </div>
                  ))}
                  <div style={{ color: "rgba(255,255,255,.68)", fontSize: 12, marginTop: 6 }}>
                    Switch to <b>TIE_BREAKER</b> when ready.
                  </div>
                </>
              ) : (
                <span className="tag good">✅ No tie for highest score</span>
              )}
            </div>
          </div>

          {/* Tie-breaker */}
          <div className="panel">
            <h2>Tie-Breaker Panel</h2>
            <p>Use New Clue, then Finalize. If conflict, pick a winner.</p>

            <div className="btn-row">
              <button className="stage-btn" onClick={() => tbNewClue()}>
                ⚡ New Tie-Break Clue
              </button>
              <button className="stage-btn secondary" onClick={() => tbFinalize()}>
                🧾 Finalize / Close Buffer
              </button>
            </div>

            <div className="divider" />

            <div className="list">
              <div className="tag">
                🏁 Winner: <b style={{ marginLeft: 6 }}>{tb?.winnerTeamId || "—"}</b>
              </div>
              <div className={`tag ${tb?.conflict ? "bad" : "good"}`}>
                {tb?.conflict ? "⚠️ Conflict: YES" : "✅ Conflict: NO"}
              </div>
              <div className="tag">
                📩 Submissions: <b style={{ marginLeft: 6 }}>{(tb?.submissions || []).length}</b>
              </div>
            </div>

            {tb?.conflict && (
              <>
                <div className="divider" />
                <h2>Resolve Conflict</h2>
                <p>Pick the winning team among submissions.</p>

                <div className="value-grid" style={{ gridTemplateColumns: "1fr", marginTop: 10 }}>
                  {(tb.submissions || []).map((sub, idx) => {
                    const team = game.teams.find((t) => t.id === sub.teamId);
                    return (
                      <button key={idx} className="chip active" onClick={() => tbResolve(sub.teamId)}>
                        🏆 Pick {team ? team.name : sub.teamId}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
