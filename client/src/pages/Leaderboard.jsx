// client/src/pages/Leaderboard.jsx
import { useMemo, useState } from "react";
import { useGame } from "../useGame";

export default function Leaderboard() {
  const { game } = useGame();
  const [showTop10, setShowTop10] = useState(false);

  const phase = game.state.phase;

  const rows = useMemo(() => game.leaderboard || [], [game.leaderboard]);

  function statusOf(t) {
    // We show DISQUALIFIED only during DIFFICULT (your rule)
    if (phase === "DIFFICULT" && t.eliminated)
      return { label: "DISQUALIFIED", tone: "bad" };
    if (t.eliminated) return { label: "ELIM", tone: "bad" };
    return { label: "IN", tone: "good" };
  }

  const top3 = rows.slice(0, 3);
  const top10 = rows.slice(0, 10);

  return (
    <div className="lb-root">
      <style>{`
        .lb-root{
          color:#fff;
        }

        .lb-hero{
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,.14);
          padding: 14px 16px;
          background:
            radial-gradient(900px 260px at 10% 10%, rgba(34,211,238,.18), transparent 60%),
            radial-gradient(900px 260px at 90% 20%, rgba(167,139,250,.18), transparent 60%),
            linear-gradient(180deg, rgba(10,14,38,.72), rgba(8,10,28,.72));
          box-shadow: 0 18px 55px rgba(0,0,0,.35);
        }

        .lb-title{
          margin:0;
          font-size: 22px;
          font-weight: 1000;
          text-transform: uppercase;
          letter-spacing: .08em;
          text-shadow: 0 0 16px rgba(99,102,241,.55);
        }

        .lb-sub{
          margin-top: 6px;
          color: rgba(255,255,255,.7);
          font-size: 13px;
          line-height: 1.35;
          display:flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .lb-btn{
          border: none;
          cursor:pointer;
          font-weight: 1000;
          border-radius: 14px;
          padding: 10px 14px;
          background: linear-gradient(90deg, rgba(34,211,238,.85), rgba(167,139,250,.85));
          color: #071027;
          box-shadow: 0 14px 26px rgba(0,0,0,.28);
          touch-action: manipulation;
        }
        .lb-btn:active{ transform: translateY(1px); }

        .lb-grid{
          margin-top: 12px;
          display:grid;
          grid-template-columns: 1.2fr .8fr;
          gap: 12px;
        }

        .panel{
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(10,14,38,.55);
          backdrop-filter: blur(10px);
          padding: 14px;
          box-shadow: 0 14px 45px rgba(0,0,0,.28);
          overflow:hidden;
        }

        .panel h2{
          margin:0 0 6px;
          font-size: 13px;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: rgba(255,255,255,.75);
          font-weight: 1000;
        }
        .panel p{ margin:0; color: rgba(255,255,255,.68); font-size: 13px; }

        .podium{
          margin-top: 12px;
          display:grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .pod{
          border-radius: 18px;
          padding: 12px;
          border: 1px solid rgba(255,255,255,.14);
          box-shadow: 0 18px 35px rgba(0,0,0,.25);
          position: relative;
          overflow:hidden;
          min-height: 112px;
          display:flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .pod::after{
          content:"";
          position:absolute;
          inset:-40px;
          background: radial-gradient(circle at 30% 20%, rgba(255,255,255,.25), transparent 55%);
          transform: rotate(10deg);
          pointer-events:none;
        }

        .pod.rank1{ background: linear-gradient(180deg, rgba(245,158,11,.35), rgba(10,14,38,.65)); }
        .pod.rank2{ background: linear-gradient(180deg, rgba(156,163,175,.30), rgba(10,14,38,.65)); }
        .pod.rank3{ background: linear-gradient(180deg, rgba(251,146,60,.28), rgba(10,14,38,.65)); }

        .pod-top{
          display:flex;
          justify-content: space-between;
          align-items:center;
          gap: 10px;
          z-index: 1;
        }

        .rank-badge{
          font-weight: 1000;
          letter-spacing: .1em;
          text-transform: uppercase;
          font-size: 12px;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.08);
        }

        .pod-name{
          z-index: 1;
          font-weight: 1000;
          font-size: 16px;
          line-height: 1.15;
          text-shadow: 0 0 12px rgba(0,0,0,.4);
        }

        .pod-score{
          z-index: 1;
          font-weight: 1000;
          font-size: 26px;
          letter-spacing: .02em;
        }

        .pill{
          display:inline-flex;
          align-items:center;
          gap: 8px;
          padding: 6px 10px;
          border-radius: 999px;
          font-weight: 1000;
          font-size: 12px;
          letter-spacing: .06em;
          text-transform: uppercase;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.06);
        }
        .pill.good{ border-color: rgba(34,197,94,.35); background: rgba(34,197,94,.12); }
        .pill.bad{ border-color: rgba(248,113,113,.35); background: rgba(248,113,113,.12); }

        .tableWrap{
          margin-top: 12px;
          overflow:auto;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,.12);
        }

        table{
          width:100%;
          border-collapse: collapse;
          min-width: 520px;
        }

        thead th{
          text-align:left;
          font-size: 12px;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: rgba(255,255,255,.7);
          padding: 12px;
          background: rgba(255,255,255,.06);
          position: sticky;
          top: 0;
          z-index: 2;
        }

        tbody td{
          padding: 12px;
          border-top: 1px solid rgba(255,255,255,.08);
          font-weight: 700;
          color: rgba(255,255,255,.88);
        }

        tbody tr:hover{
          background: rgba(255,255,255,.05);
        }

        .rankCell{
          font-weight: 1000;
          width: 72px;
        }

        .rowPodium1{ background: rgba(245,158,11,.12); }
        .rowPodium2{ background: rgba(156,163,175,.10); }
        .rowPodium3{ background: rgba(251,146,60,.10); }

        /* Clincher box */
        .clincherList{
          margin-top: 10px;
          display:flex;
          flex-direction: column;
          gap: 8px;
        }

        /* Modal */
        .modalOverlay{
          position: fixed;
          inset: 0;
          background: #000;
          display:flex;
          align-items:center;
          justify-content:center;
          z-index: 80;
          padding: 16px;
        }

        .modal{
          width: 100%;
          max-width: 860px;
          max-height: 85vh;
          overflow:auto;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,.16);
          background:
            radial-gradient(900px 340px at 10% 10%, rgba(34,211,238,.18), transparent 100%),
            radial-gradient(900px 340px at 90% 20%, rgba(167,139,250,.18), transparent 100%),
            rgba(10,14,38,.85);
          box-shadow: 0 30px 90px rgba(0,0,0,.55);
          padding: 14px;
        }

        .modalHead{
          display:flex;
          justify-content: space-between;
          align-items:center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .closeBtn{
          border-radius: 14px;
          padding: 10px 14px;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.08);
          color:#fff;
          font-weight: 1000;
          cursor:pointer;
        }

        @media (max-width: 920px){
          .lb-grid{ grid-template-columns: 1fr; }
          table{ min-width: 0; }
          thead th{ position: static; }
          .podium{ grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Hero */}
      <div className="lb-hero">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 className="lb-title">Leaderboard</h1>
            <div className="lb-sub">
              <span>
                Live rankings • Phase: <b>{phase}</b>
              </span>
              <span style={{ color: "rgba(255,255,255,.7)" }}>
                Updates automatically (no refresh)
              </span>
            </div>
          </div>

          <button className="lb-btn" onClick={() => setShowTop10(true)}>
            📺 Show Top 10 (Public)
          </button>
        </div>

        {/* Podium */}
        <div className="podium">
          {[0, 1, 2].map((i) => {
            const t = top3[i];
            if (!t) {
              return (
                <div key={i} className={`pod rank${i + 1}`}>
                  <div className="pod-top">
                    <span className="rank-badge">#{i + 1}</span>
                    <span className="pill">—</span>
                  </div>
                  <div className="pod-name">Waiting…</div>
                  <div className="pod-score">0</div>
                </div>
              );
            }
            const st = statusOf(t);
            return (
              <div key={t.id} className={`pod rank${i + 1}`}>
                <div className="pod-top">
                  <span className="rank-badge">{i === 0 ? "🥇 #1" : i === 1 ? "🥈 #2" : "🥉 #3"}</span>
                  <span className={`pill ${st.tone}`}>{st.label}</span>
                </div>
                <div className="pod-name">{t.name}</div>
                <div className="pod-score">{t.score}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="lb-grid">
        {/* Main Table */}
        <div className="panel">
          <h2>Full Rankings</h2>
          <p>All teams, sorted by score.</p>

          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 72 }}>Rank</th>
                  <th>Team</th>
                  <th style={{ width: 110 }}>Score</th>
                  <th style={{ width: 170 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t, idx) => {
                  const rank = idx + 1;
                  const st = statusOf(t);
                  const podiumRowClass =
                    rank === 1 ? "rowPodium1" : rank === 2 ? "rowPodium2" : rank === 3 ? "rowPodium3" : "";

                  return (
                    <tr key={t.id} className={podiumRowClass}>
                      <td className="rankCell">{rank}</td>
                      <td style={{ fontWeight: 1000 }}>{t.name}</td>
                      <td style={{ fontWeight: 1000 }}>{t.score}</td>
                      <td>
                        <span className={`pill ${st.tone}`}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: 16, color: "rgba(255,255,255,.7)" }}>
                      No teams yet. Import teams first.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Clincher */}
        <div className="panel">
          <h2>Clincher Status</h2>
          <p>If top score is tied, these teams go to the clincher.</p>

          <div className="clincherList">
            {game.clincher.needed ? (
              <>
                <span className="pill bad">⚡ Tie detected</span>
                {(game.clincher.tiedTeamIds || []).map((id) => {
                  const team = game.teams.find((t) => t.id === id);
                  return (
                    <div key={id} className="pill">
                      🎯 {team?.name ?? id}
                    </div>
                  );
                })}
              </>
            ) : (
              <span className="pill good">✅ No tie for highest score</span>
            )}
          </div>
        </div>
      </div>

      {/* Top 10 Modal */}
      {showTop10 && (
        <div className="modalOverlay" onClick={() => setShowTop10(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modalHead">
              <div>
                <div style={{ fontWeight: 1000, letterSpacing: ".08em", textTransform: "uppercase" }}>
                  📺 CURRENT TOP 10
                </div>
                <div style={{ color: "rgba(255,255,255,.7)", fontSize: 13, marginTop: 4 }}>
                  For projector showing • Updates live
                </div>
              </div>

              <button className="closeBtn" onClick={() => setShowTop10(false)}>
                Close
              </button>
            </div>

            <div className="tableWrap" style={{ marginTop: 12 }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 72 }}>#</th>
                    <th>Team</th>
                    <th style={{ width: 110 }}>Score</th>
                    <th style={{ width: 170 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {top10.map((t, idx) => {
                    const rank = idx + 1;
                    const st = statusOf(t);
                    const podiumRowClass =
                      rank === 1 ? "rowPodium1" : rank === 2 ? "rowPodium2" : rank === 3 ? "rowPodium3" : "";

                    return (
                      <tr key={t.id} className={podiumRowClass}>
                        <td className="rankCell">{rank}</td>
                        <td style={{ fontWeight: 1000 }}>{t.name}</td>
                        <td style={{ fontWeight: 1000 }}>{t.score}</td>
                        <td>
                          <span className={`pill ${st.tone}`}>{st.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {top10.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: 16, color: "rgba(255,255,255,.7)" }}>
                        No teams yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 12, color: "rgba(255,255,255,.7)", fontSize: 12 }}>
              Tip: Use this on a projector for the audience.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
