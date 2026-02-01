// client/src/pages/Proctor.jsx
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useGame } from '../useGame'
import { score, tbCorrect, setBet } from '../api'

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

const ICurrencyDollar = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
    <path d="M8 1a.75.75 0 0 1 .75.75V3.1c1.7.23 3 1.34 3 2.9a.75.75 0 0 1-1.5 0c0-.9-.87-1.6-2.25-1.6S5.75 5.1 5.75 6c0 .8.72 1.26 2.18 1.55l.14.03c1.78.36 3.18 1.13 3.18 2.92 0 1.56-1.3 2.67-3 2.9v1.35a.75.75 0 0 1-1.5 0V13.4c-1.7-.23-3-1.34-3-2.9a.75.75 0 0 1 1.5 0c0 .9.87 1.6 2.25 1.6s2.25-.7 2.25-1.6c0-.8-.72-1.26-2.18-1.55l-.14-.03C5.4 8.56 4 7.79 4 6c0-1.56 1.3-2.67 3-2.9V1.75A.75.75 0 0 1 8 1Z" />
  </svg>
)

export default function Proctor() {
  const { proctorId } = useParams()
  const { game } = useGame()

  const [busyTeamId, setBusyTeamId] = useState(null)
  const [flash, setFlash] = useState({ teamId: null, type: null }) // "ok" | "err"
  const [errorMsg, setErrorMsg] = useState('')

  // local editable bets
  const [betDrafts, setBetDrafts] = useState({}) // { [teamId]: string }

  const proctor = game.proctors.find((p) => p.id === proctorId)

  const assignedTeams = useMemo(() => {
    if (!proctor) return []
    return proctor.teamIds
      .map((id) => game.teams.find((t) => t.id === id))
      .filter(Boolean)
  }, [proctor, game.teams])

  // keep drafts in sync with server
  useEffect(() => {
    if (!proctor) return

    setBetDrafts((prev) => {
      const next = { ...prev }

      for (const teamId of proctor.teamIds) {
        if (next[teamId] === undefined) {
          next[teamId] = String(game.bets?.[teamId] ?? 0)
        }
      }

      for (const key of Object.keys(next)) {
        if (!proctor.teamIds.includes(key)) delete next[key]
      }

      return next
    })
  }, [proctor?.id, proctor?.teamIds, game.bets])

  if (!proctor) return <div className="card">Unknown proctor: {proctorId}</div>

  const phase = game.state.phase
  const scoringDisabled = !game.state.scoringOpen
  const betsDisabled = !game.state.betsOpen

  const tieIds = game.clincher?.tiedTeamIds || []
  const inTieBreaker = phase === 'TIE_BREAKER'
  const isClincherTeam = (teamId) => tieIds.includes(teamId)

  function flashRow(teamId, type) {
    setFlash({ teamId, type })
    setTimeout(() => setFlash({ teamId: null, type: null }), 550)
  }

  async function handleScore(teamId, result) {
    setErrorMsg('')
    setBusyTeamId(teamId)

    try {
      await score(proctor.id, teamId, result)
      flashRow(teamId, 'ok')
    } catch (e) {
      setErrorMsg(e?.message || 'Scoring failed.')
      flashRow(teamId, 'err')
    } finally {
      setBusyTeamId(null)
    }
  }

  async function handleTieBreakCorrect(teamId) {
    setErrorMsg('')
    setBusyTeamId(teamId)

    try {
      await tbCorrect(proctor.id, teamId)
      flashRow(teamId, 'ok')
      // NOTE: no auto-finalize here; Game Master finalizes in Controller
    } catch (e) {
      setErrorMsg(e?.message || 'Tie-break submit failed.')
      flashRow(teamId, 'err')
    } finally {
      setBusyTeamId(null)
    }
  }

  async function handleBetSubmit(teamId) {
    setErrorMsg('')
    setBusyTeamId(teamId)

    try {
      const raw = betDrafts[teamId] ?? '0'
      const bet = Number(raw)
      await setBet(proctor.id, teamId, bet)
      flashRow(teamId, 'ok')
    } catch (e) {
      setErrorMsg(e?.message || 'Bet update failed.')
      flashRow(teamId, 'err')
    } finally {
      setBusyTeamId(null)
    }
  }

  return (
    <div className="ghp">
      <style>{`
        .ghp{
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
          --shadow: 0 0 0 1px var(--border);
          --panel: #161b22;

          color:var(--text);
        }

        .wrap{ padding:16px; max-width:1200px; margin:0 auto; }

        /* Sticky top bar for mobile */
        .topbar{
          position: sticky;
          top: 0;
          z-index: 10;
          background: linear-gradient(180deg, rgba(13,17,23,.98), rgba(13,17,23,.88));
          backdrop-filter: blur(8px);
          border:1px solid var(--border);
          border-radius:12px;
          padding:12px;
          box-shadow: 0 14px 45px rgba(0,0,0,.45);
        }

        .headRow{
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
          align-items:center;
        }

        .kpi{
          display:flex;
          gap:8px;
          flex-wrap:wrap;
          align-items:center;
          margin-top:10px;
        }

        .pill{
          display:inline-flex;
          align-items:center;
          gap:8px;
          padding:6px 10px;
          border-radius:999px;
          border:1px solid var(--border);
          background: rgba(255,255,255,.03);
          color:var(--text);
          font-size:11px;
          font-weight:900;
          letter-spacing:.08em;
          text-transform:uppercase;
          white-space:nowrap;
        }

        .dot{
          width:10px;
          height:10px;
          border-radius:50%;
          background: var(--bad);
        }
        .dot.good{ background: var(--good); }
        .dot.warn{ background: var(--warn); }

        .error{
          margin-top:10px;
          border:1px solid rgba(248,81,73,.55);
          background: rgba(248,81,73,.08);
          color:#ffd7d5;
          border-radius:10px;
          padding:10px 12px;
          font-weight:800;
          font-size:12px;
        }

        .section{
          margin-top:14px;
          border:1px solid var(--border);
          background: var(--panel);
          border-radius:12px;
          padding:12px;
        }

        .sectionTitle{
          margin:0;
          font-size:12px;
          font-weight:900;
          letter-spacing:.12em;
          text-transform:uppercase;
          color:var(--muted);
        }

        .sectionSub{
          margin-top:6px;
          font-size:12px;
          color:var(--muted);
          line-height:1.35;
        }

        /* Team cards */
        .teamGrid{
          margin-top:12px;
          display:grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap:12px;
        }

        .teamCard{
          border:1px solid var(--border);
          background: var(--bg);
          border-radius:12px;
          padding:12px;
          box-shadow: 0 10px 28px rgba(0,0,0,.35);
        }

        /* Tie-breaker gating */
        .teamCard.muted{
          opacity: .45;
          filter: saturate(.6);
        }
        .teamCard.muted .btn,
        .teamCard.muted .betBtn,
        .teamCard.muted input{
          pointer-events: none;
        }

        .teamCard.flashOk{
          border-color: rgba(46,160,67,.75);
          box-shadow: 0 0 0 3px rgba(46,160,67,.15), 0 10px 28px rgba(0,0,0,.35);
        }
        .teamCard.flashErr{
          border-color: rgba(248,81,73,.75);
          box-shadow: 0 0 0 3px rgba(248,81,73,.14), 0 10px 28px rgba(0,0,0,.35);
        }

        .teamTop{
          display:flex;
          justify-content:space-between;
          gap:12px;
          align-items:flex-start;
        }

        .teamName{
          font-weight:900;
          font-size:20px;
          line-height:1.2;
          color:var(--text);
        }

        .metaRow{
          margin-top:6px;
          display:flex;
          gap:8px;
          flex-wrap:wrap;
          align-items:center;
        }

        .statusPill{
          display:inline-flex;
          align-items:center;
          gap:8px;
          padding:5px 10px;
          border-radius:999px;
          border:1px solid var(--border);
          background: rgba(255,255,255,.03);
          font-size:11px;
          font-weight:900;
          letter-spacing:.08em;
          text-transform:uppercase;
          color:var(--text);
        }
        .statusPill.good{ border-color: rgba(46,160,67,.6); color:#d2fedb; }
        .statusPill.warn{ border-color: rgba(210,153,34,.7); color:#ffe8b6; }
        .statusPill.bad{ border-color: rgba(248,81,73,.7); color:#ffd7d5; }

        .scoreBox{
          text-align:right;
          min-width: 86px;
        }
        .scoreNum{
          font-weight:900;
          font-size:22px;
          letter-spacing:.02em;
          color:var(--text);
        }
        .scoreLbl{
          margin-top:2px;
          font-size:11px;
          color:var(--muted);
          letter-spacing:.12em;
          text-transform:uppercase;
          font-weight:900;
        }

        /* Buttons (GitHub-ish) */
        .btnRow{
          margin-top:12px;
          display:grid;
          grid-template-columns: repeat(3, 1fr);
          gap:8px;
        }

        .btn{
          height:44px;
          border-radius:10px;
          border:1px solid var(--border);
          background: var(--panel2);
          color: var(--text);
          font-weight:900;
          cursor:pointer;
          touch-action: manipulation;
          user-select:none;
        }
        .btn:hover{
          border-color: rgba(4,37,224,.8);
          box-shadow: 0 0 0 3px rgba(4,37,224,.18);
        }
        .btn:active{ transform: translateY(1px); }
        .btn:disabled{ opacity:.55; cursor:not-allowed; }

        .btnPrimary{
          background: linear-gradient(180deg, rgba(4,37,224,.98), rgba(4,37,224,.72));
          border-color: rgba(4,37,224,.9);
          color:#fff;
        }
        .btnPrimary:hover{
          box-shadow: 0 0 0 3px rgba(4,37,224,.25), 0 10px 28px rgba(0,0,0,.35);
        }

        .btnDanger{
          border-color: rgba(248,81,73,.65);
        }

        /* Bet box */
        .betRow{
          margin-top:12px;
          display:grid;
          grid-template-columns: 140px 1fr 150px;
          gap:8px;
          align-items:center;
        }

        .betInput{
          height:44px;
          border-radius:10px;
          border:1px solid var(--border);
          background: var(--panel2);
          color: var(--text);
          padding: 0 12px;
          font-weight:900;
          outline:none;
        }
        .betInput:focus{
          border-color: rgba(4,37,224,.9);
          box-shadow: 0 0 0 3px rgba(4,37,224,.22);
        }
        .betHint{
          font-size:12px;
          color:var(--muted);
          font-weight:800;
        }
        .betState{
          font-size:12px;
          color:var(--muted);
          font-weight:800;
          text-align:right;
        }

        .betBtn{
          height:44px;
          border-radius:10px;
          font-weight:900;
          border:1px solid var(--border);
          background: var(--panel2);
          color:var(--text);
          cursor:pointer;
        }
        .betBtn:hover{
          border-color: rgba(4,37,224,.8);
          box-shadow: 0 0 0 3px rgba(4,37,224,.18);
        }
        .betBtn.primary{
          background: linear-gradient(180deg, rgba(4,37,224,.98), rgba(4,37,224,.72));
          border-color: rgba(4,37,224,.9);
          color:#fff;
        }
        .betBtn:disabled{ opacity:.55; cursor:not-allowed; }

        /* Clincher */
        .clincherRow{
          margin-top:10px;
          display:flex;
          gap:8px;
          flex-wrap:wrap;
        }
        .teamChip{
          display:inline-flex;
          align-items:center;
          padding:8px 10px;
          border-radius:999px;
          border:1px solid var(--border);
          background: rgba(255,255,255,.03);
          font-weight:900;
          font-size:12px;
          color:var(--text);
        }

        .gh-chip{
          display:inline-flex;
          align-items:center;
          gap: 8px;
          padding: 4px 10px;
          border-radius: 999px;
          background: var(--panel);
          box-shadow: var(--shadow);
          font-size: 12px;
          color: var(--muted);
          white-space: nowrap;
        }
        .gh-chip b{ color: var(--text); }

        /* Mobile */
        @media (max-width: 900px){
          .teamGrid{ grid-template-columns: 1fr; }
          .btnRow{ grid-template-columns: 1fr; }
          .betRow{ grid-template-columns: 1fr; }
          .betState{ text-align:left; }
        }
      `}</style>

      <div className="wrap">
        {/* TOP BAR */}
        <div className="topbar">
          <div className="headRow">
            <div>
              <h1 className="title">{proctor.name}</h1>
              <div className="sub">
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
                {(phase === 'EASY' || phase === 'AVERAGE') && (
                  <span className="gh-chip">
                    <Icon>
                      <ICurrencyDollar />
                    </Icon>{' '}
                    Value: <b>{game.state.clueValue}</b>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="kpi">
            <span className="pill">
              <span className={`dot ${game.state.scoringOpen ? 'good' : ''}`} />
              Scoring {game.state.scoringOpen ? 'Open' : 'Closed'}
            </span>

            {phase === 'DIFFICULT' && (
              <span className="pill">
                <span className={`dot ${game.state.betsOpen ? 'warn' : ''}`} />
                Bets {game.state.betsOpen ? 'Open' : 'Closed'}
              </span>
            )}

            {/* Category */}
            <span className="pill" style={{ borderColor: 'rgba(4,37,224,.55)' }}>
              Category: <b style={{ color: 'var(--text)' }}>{game.state.roundLabel}</b>
            </span>

            {/* Time */}
            <span className="pill" style={{ borderColor: 'rgba(4,37,224,.55)' }}>
              Time: <b style={{ color: 'var(--text)' }}>{game.state.seconds}s</b>
            </span>
          </div>

          {errorMsg && <div className="error">{errorMsg}</div>}
        </div>

        {/* ASSIGNED TEAMS */}
        <div className="section">
          <h2 className="sectionTitle">Assigned Teams ({assignedTeams.length}/5)</h2>
          <div className="sectionSub">Tap once per clue. Updates live (no refresh).</div>

          {assignedTeams.length === 0 ? (
            <div className="sectionSub" style={{ marginTop: 10 }}>
              No teams assigned yet. Ask the Game Master to run Auto-Assign and Save.
            </div>
          ) : (
            <div className="teamGrid">
              {assignedTeams.map((t) => {
                const isBusy = busyTeamId === t.id
                const isElim = !!t.eliminated
                const isDQ = phase === 'DIFFICULT' && t.score <= 0 && !isElim

                const muted = inTieBreaker && !isClincherTeam(t.id)

                const disableScoreButtons =
                  isBusy ||
                  isElim ||
                  isDQ ||
                  (inTieBreaker && !isClincherTeam(t.id)) ||
                  (!inTieBreaker && scoringDisabled)

                const disableBetControls = isBusy || isElim || isDQ || betsDisabled

                const draft = betDrafts[t.id] ?? String(game.bets?.[t.id] ?? 0)
                const saved = String(game.bets?.[t.id] ?? 0)
                const isDirty = draft !== saved

                const flashClass =
                  flash.teamId === t.id ? (flash.type === 'ok' ? 'flashOk' : 'flashErr') : ''

                const tag = isElim
                  ? { cls: 'bad', txt: 'ELIM' }
                  : isDQ
                  ? { cls: 'warn', txt: 'DISQUALIFIED' }
                  : inTieBreaker
                  ? muted
                    ? { cls: 'warn', txt: 'NOT IN TIE-BREAK' }
                    : { cls: 'good', txt: 'TIE-BREAK' }
                  : { cls: 'good', txt: 'OK' }

                return (
                  <div
                    className={`teamCard ${flashClass} ${muted ? 'muted' : ''}`}
                    key={t.id}
                    aria-disabled={muted ? 'true' : 'false'}
                  >
                    <div className="teamTop">
                      <div>
                        <div className="teamName">{t.name}</div>
                        <div className="metaRow">
                          <span className={`statusPill ${tag.cls}`}>{tag.txt}</span>
                          <span className="statusPill" style={{ color: 'var(--muted)' }}>
                            {t.id}
                          </span>
                        </div>
                      </div>

                      <div className="scoreBox">
                        <div className="scoreNum">{t.score}</div>
                        <div className="scoreLbl">score</div>
                      </div>
                    </div>

                    {/* BETS (DIFFICULT) */}
                    {phase === 'DIFFICULT' && (
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

                        <div className="betHint">Bet ≤ {t.score}</div>

                        <button
                          className={`betBtn ${isDirty ? 'primary' : ''}`}
                          disabled={disableBetControls || !isDirty}
                          onClick={() => handleBetSubmit(t.id)}
                        >
                          {isBusy ? '...' : 'Submit Bet'}
                        </button>

                        {!betsDisabled && !isElim && !isDQ && (
                          <div className="betState">{isDirty ? 'Not saved' : 'Saved'}</div>
                        )}

                        {betsDisabled && <div className="betState">Bets closed</div>}
                      </div>
                    )}

                    {/* ACTIONS */}
                    {!inTieBreaker ? (
                      <div className="btnRow">
                        <button
                          className="btn btnPrimary"
                          disabled={disableScoreButtons}
                          onClick={() => handleScore(t.id, 'correct')}
                        >
                          Correct
                        </button>
                        <button
                          className="btn"
                          disabled={disableScoreButtons}
                          onClick={() => handleScore(t.id, 'wrong')}
                        >
                          Wrong
                        </button>
                        <button
                          className="btn btnDanger"
                          disabled={disableScoreButtons}
                          onClick={() => handleScore(t.id, 'no_answer')}
                        >
                          No Answer
                        </button>
                      </div>
                    ) : (
                      <div className="btnRow" style={{ gridTemplateColumns: '1fr' }}>
                        <button
                          className="btn btnPrimary"
                          disabled={disableScoreButtons}
                          onClick={() => handleTieBreakCorrect(t.id)}
                        >
                          Tie-break Correct
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* CLINCHER */}
        <div className="section">
          <h2 className="sectionTitle">Clincher Candidates</h2>

          {game.clincher.needed ? (
            <div className="clincherRow">
              {tieIds.map((id) => {
                const team = game.teams.find((t) => t.id === id)
                return (
                  <span className="teamChip" key={id}>
                    {team ? team.name : id}
                  </span>
                )
              })}
            </div>
          ) : (
            <div className="sectionSub" style={{ marginTop: 10 }}>
              No tie for highest score.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
