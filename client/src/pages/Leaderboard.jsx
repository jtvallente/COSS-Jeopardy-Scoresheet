// client/src/pages/Leaderboard.jsx
import { useMemo, useState } from 'react'
import { useGame } from '../useGame'

/* ---------------- Minimal GitHub-ish Icons ---------------- */

const Icon = ({ children }) => (
  <span className="gh-ico" aria-hidden="true">
    {children}
  </span>
)

const IFlag = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
    <path d="M3 1.75A.75.75 0 0 1 3.75 1h.5a.75.75 0 0 1 .75.75V2h5.5a.75.75 0 0 1 .6.3l1 1.333a.75.75 0 0 1 0 .9l-1 1.333a.75.75 0 0 1-.6.3H5v6.084a.75.75 0 1 1-1.5 0V1.75ZM5 3.5v2h5.125l.625-.833-.625-.834H5Z" />
  </svg>
)

const IHash = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
    <path d="M6.57 1.5a.75.75 0 0 1 .75.9L6.93 4.5h2.64l.4-2.1a.75.75 0 1 1 1.47.28L11.07 4.5h2.18a.75.75 0 0 1 0 1.5h-2.47l-.5 2.6h2.22a.75.75 0 0 1 0 1.5h-2.5l-.4 2.1a.75.75 0 1 1-1.47-.28l.35-1.82H6.83l-.4 2.1a.75.75 0 1 1-1.47-.28l.35-1.82H3.25a.75.75 0 0 1 0-1.5h2.35l.5-2.6H3.5a.75.75 0 0 1 0-1.5h2.89l.4-2.1a.75.75 0 0 1 .78-.9ZM7.6 6l-.5 2.6h2.64l.5-2.6H7.6Z" />
  </svg>
)
const ITrophy = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
    <path d="M4 1.75A.75.75 0 0 1 4.75 1h6.5a.75.75 0 0 1 .75.75V3h1.25A.75.75 0 0 1 14 3.75v1A3.25 3.25 0 0 1 11.1 8a4.5 4.5 0 0 1-2.35 2.03V12h2.25a.75.75 0 0 1 0 1.5H5a.75.75 0 0 1 0-1.5h2.25V10.03A4.5 4.5 0 0 1 4.9 8 3.25 3.25 0 0 1 2 4.75v-1A.75.75 0 0 1 2.75 3H4V1.75ZM12 4.5v.25A1.75 1.75 0 0 1 10.25 6.5h-.2c.3-.53.47-1.14.47-1.79V4.5H12ZM4 4.5h1.48v.21c0 .65.17 1.26.47 1.79h-.2A1.75 1.75 0 0 1 4 4.75V4.5Z" />
  </svg>
)

export default function Leaderboard() {
  const { game } = useGame()
  const [showTop10, setShowTop10] = useState(false)

  const phase = game.state.phase
  const rows = useMemo(() => {
    const teams = game.teams || []
    return [...teams]
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .map((t) => ({
        id: t.id,
        name: t.name,
        score: t.score,
        eliminated: t.eliminated,
      }))
  }, [game.teams])

  function statusOf(t) {
    if (t.eliminated) return { label: 'ELIM', tone: 'bad' }
    if (phase === 'DIFFICULT' && t.score <= 0)
      return { label: 'DISQ', tone: 'warn' }
    return { label: 'OK', tone: 'good' }
  }

  const top3 = rows.slice(0, 3)
  const top10 = rows.slice(0, 10)

  return (
    <div className="ghlb">
      <style>{`
        /* GitHub-ish dark base + your alive twist */
        .ghlb{
          --bg:#0d1117;
          --panel:#161b22;
          --panel2:#0b1220;
          --border:#30363d;
          --text:#c9d1d9;
          --muted:#8b949e;

          --accent:#0425e0;

          --good:#2ea043;
          --warn:#d29922;
          --bad:#f85149;

          --gold:#f5c451;
          --silver:#c9d1d9;
          --bronze:#d2995f;
          --shadow: 0 0 0 1px var(--border);
          --panel: #161b22;

          color:var(--text);
        }

        .wrap{ padding:16px; max-width:1200px; margin:0 auto; }

        /* Header */
        .head{
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:12px;
          flex-wrap:wrap;
        }
        .title{
          margin:0;
          font-size:20px;
          font-weight:900;
          letter-spacing:.02em;
        }
        .sub{
          margin-top:4px;
          font-size:12px;
          color:var(--muted);
          display:flex;
          gap:10px;
          flex-wrap:wrap;
        }

        .btn{
          height:34px;
          padding:0 12px;
          border-radius:6px;
          border:1px solid var(--border);
          background:var(--panel2);
          color:var(--text);
          font-weight:800;
          cursor:pointer;
        }
        .btn:hover{
          border-color: rgba(4,37,224,.9);
          box-shadow: 0 0 0 3px rgba(4,37,224,.18);
        }

        /* Podium cards (no emojis) */
        .podium{
          margin-top:14px;
          display:grid;
          grid-template-columns:repeat(3,1fr);
          gap:12px;
        }
        .pod{
          position:relative;
          border-radius:10px;
          border:1px solid var(--border);
          background:var(--panel);
          padding:14px;
          box-shadow:0 10px 28px rgba(0,0,0,.45);
          overflow:hidden;
        }
        .pod::after{
          content:"";
          position:absolute;
          inset:-60%;
          background: radial-gradient(circle at 20% 10%, rgba(255,255,255,.18), transparent 55%);
          opacity:.18;
          pointer-events:none;
          transform: rotate(10deg);
        }
        .pod.rank1{ border-top:3px solid var(--gold); }
        .pod.rank2{ border-top:3px solid var(--silver); }
        .pod.rank3{ border-top:3px solid var(--bronze); }

        .podTop{
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:10px;
        }
        .rankBadge{
          font-size:11px;
          font-weight:900;
          letter-spacing:.14em;
          text-transform:uppercase;
          color:var(--muted);
          padding:4px 10px;
          border-radius:999px;
          border:1px solid var(--border);
          background:rgba(255,255,255,.03);
        }
        .podName{
          margin-top:8px;
          font-size:16px;
          font-weight:900;
          line-height:1.1;
        }
        .podScore{
          margin-top:10px;
          font-size:30px;
          font-weight:900;
          letter-spacing:.02em;
        }

        .pill{
          display:inline-flex;
          align-items:center;
          padding:4px 10px;
          border-radius:999px;
          font-size:11px;
          font-weight:900;
          letter-spacing:.06em;
          text-transform:uppercase;
          border:1px solid var(--border);
          background:rgba(255,255,255,.03);
          color:var(--text);
        }
        .pill.good{ border-color: rgba(46,160,67,.6); color:#d2fedb; }
        .pill.warn{ border-color: rgba(210,153,34,.7); color:#ffe8b6; }
        .pill.bad{ border-color: rgba(248,81,73,.7); color:#ffd7d5; }

        /* Main panels */
        .grid{
          margin-top:14px;
          display:grid;
          grid-template-columns: 1.2fr .8fr;
          gap:12px;
        }
        .panel{
          background:var(--panel);
          border:1px solid var(--border);
          border-radius:10px;
          padding:12px;
        }
        .panelTitle{
          margin:0;
          font-size:12px;
          font-weight:900;
          letter-spacing:.12em;
          text-transform:uppercase;
          color:var(--muted);
        }
        .panelSub{
          margin-top:6px;
          font-size:12px;
          color:var(--muted);
        }

        /* Table */
        .tableWrap{
          margin-top:12px;
          overflow:auto;
          border-radius:10px;
          border:1px solid var(--border);
        }
        table{
          width:100%;
          border-collapse:collapse;
          min-width:520px;
        }
        thead th{
          text-align:left;
          padding:10px;
          font-size:11px;
          text-transform:uppercase;
          letter-spacing:.12em;
          color:var(--muted);
          background:var(--panel2);
          position: sticky;
          top: 0;
          z-index: 2;
        }
        tbody td{
          padding:10px;
          border-top:1px solid var(--border);
          font-weight:800;
          color:var(--text);
        }
        tbody tr:hover{ background: rgba(255,255,255,.03); }

        /* Top 3 row color cue */
        .row1{ background: rgba(245,196,81,.10); }
        .row2{ background: rgba(201,209,217,.08); }
        .row3{ background: rgba(210,153,95,.08); }

        /* Clincher list */
        .clincherList{
          margin-top:12px;
          display:flex;
          flex-direction:column;
          gap:8px;
        }
        .item{
          display:flex;
          justify-content:space-between;
          gap:10px;
          align-items:center;
          padding:10px;
          border-radius:10px;
          border:1px solid var(--border);
          background: rgba(255,255,255,.02);
        }

        /* Modal */
        .overlay{
          position:fixed;
          inset:0;
          background:#000;
          display:flex;
          align-items:center;
          justify-content:center;
          z-index:80;
        }
        .modal{
          width:100%;
          max-width:900px;
          max-height:85vh;
          overflow:auto;
          background:#0d1117;
          border-radius:12px;
          border:1px solid var(--border);
          box-shadow:0 40px 120px rgba(0,0,0,.75);
          padding:16px;
        }
        .modalHead{
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:12px;
        }

        .gh-meta{
          display:flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
          .gh-meta{
          display:flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
          margin-top: 10px;
        }
           .gh-chip{
          display:inline-flex;
          align-items:center;
          gap: 8px;
          padding: 6px 10px;
          border-radius: 999px;
          background: var(--panel);
          box-shadow: var(--shadow);
          font-size: 12px;
          color: var(--muted);
          white-space: nowrap;
        }
        .gh-chip b{ color: var(--text); }

        @media(max-width:920px){
          .podium{ grid-template-columns:1fr; }
          .grid{ grid-template-columns:1fr; }
          table{ min-width: 0; }
          thead th{ position: static; }
          .gh-meta{ justify-content:flex-start; }
        }
      `}</style>

      <div className="wrap">
        {/* Header */}
        <div className="head">
          <div>
            <h1 className="title">LEADERBOARD</h1>
            <div className="gh-meta">
              <span className="gh-chip">
                <Icon>
                  <ITrophy />
                </Icon>{' '}
                Live rankings
              </span>
              <span className="gh-chip">
                <Icon>
                  <IFlag />
                </Icon>{' '}
                Phase: <b>{phase}</b>
              </span>
              <span className="gh-chip">
                <Icon>
                  <IHash />
                </Icon>{' '}
                Clue: <b>{game.state.clueNumber}</b>
              </span>
            </div>
          </div>

          <button className="btn" onClick={() => setShowTop10(true)}>
            Show Top 10
          </button>
        </div>

        {/* Podium */}
        <div className="podium">
          {[0, 1, 2].map((i) => {
            const t = top3[i]
            const st = t ? statusOf(t) : { label: '—', tone: '' }

            return (
              <div key={i} className={`pod rank${i + 1}`}>
                <div className="podTop">
                  <span className="rankBadge">RANK #{i + 1}</span>
                  <span className={`pill ${st.tone}`}>{st.label}</span>
                </div>
                <div className="podName">{t?.name ?? 'Waiting…'}</div>
                <div className="podScore">{t?.score ?? 0}</div>
              </div>
            )
          })}
        </div>

        <div className="grid">
          {/* Full table */}
          <div className="panel">
            <div className="panelTitle">Full Rankings</div>
            <div className="panelSub">All teams sorted by score.</div>

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
                    const rank = idx + 1
                    const st = statusOf(t)
                    const rowClass =
                      rank === 1
                        ? 'row1'
                        : rank === 2
                        ? 'row2'
                        : rank === 3
                        ? 'row3'
                        : ''

                    return (
                      <tr key={t.id} className={rowClass}>
                        <td style={{ fontWeight: 900 }}>{rank}</td>
                        <td style={{ fontWeight: 900 }}>{t.name}</td>
                        <td style={{ fontWeight: 900 }}>{t.score}</td>
                        <td>
                          <span className={`pill ${st.tone}`}>{st.label}</span>
                        </td>
                      </tr>
                    )
                  })}

                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        style={{ padding: 16, color: 'var(--muted)' }}
                      >
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
            <div className="panelTitle">Clincher Status</div>
            <div className="panelSub">
              If top score is tied, these teams go to clincher.
            </div>

            <div className="clincherList">
              {game.clincher.needed ? (
                (game.clincher.tiedTeamIds || []).map((id) => {
                  const team = game.teams.find((t) => t.id === id)
                  return (
                    <div className="item" key={id}>
                      <span style={{ fontWeight: 900 }}>
                        {team?.name ?? id}
                      </span>
                      <span className="pill warn">TIED</span>
                    </div>
                  )
                })
              ) : (
                <div className="item">
                  <span style={{ fontWeight: 900 }}>
                    No tie for highest score
                  </span>
                  <span className="pill good">CLEAR</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showTop10 && (
        <div className="overlay" onClick={() => setShowTop10(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modalHead">
              <div style={{ fontWeight: 900 }}>TOP 10 — LIVE</div>
              <button className="btn" onClick={() => setShowTop10(false)}>
                Close
              </button>
            </div>

            <table>
              <thead>
                <tr>
                  <th style={{ width: 70 }}>Rank</th>
                  <th>Team</th>
                  <th style={{ width: 110 }}>Score</th>
                  <th style={{ width: 140 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {top10.map((t, idx) => {
                  const st = statusOf(t)
                  const r = idx + 1
                  return (
                    <tr
                      key={t.id}
                      className={
                        r === 1
                          ? 'row1'
                          : r === 2
                          ? 'row2'
                          : r === 3
                          ? 'row3'
                          : ''
                      }
                    >
                      <td>{r}</td>
                      <td>{t.name}</td>
                      <td>{t.score}</td>
                      <td>
                        <span className={`pill ${st.tone}`}>{st.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
