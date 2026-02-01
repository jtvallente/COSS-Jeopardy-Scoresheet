// client/src/pages/Controller.jsx
import { useMemo, useState } from 'react'
import { useGame } from '../useGame'
import { resetGame, undo, updateState, tbFinalize, tbNewClue, tbResolve } from '../api'

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

const IClock = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
    <path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16Zm0-1.5A6.5 6.5 0 1 0 8 1.5a6.5 6.5 0 0 0 0 13Z" />
    <path d="M8.75 4a.75.75 0 0 0-1.5 0v4c0 .414.336.75.75.75h3a.75.75 0 0 0 0-1.5H8.75V4Z" />
  </svg>
)

const ICheck = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
    <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-6.25 6.25a.75.75 0 0 1-1.06 0l-3.25-3.25a.75.75 0 1 1 1.06-1.06l2.72 2.72 5.72-5.72a.75.75 0 0 1 1.06 0Z" />
  </svg>
)

const IX = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
    <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 1 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
  </svg>
)

const IUndo = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
    <path d="M6.5 2.5a.75.75 0 0 0 0 1.5h3.25a3.75 3.75 0 1 1 0 7.5H6.5a.75.75 0 0 0 0 1.5h3.25a5.25 5.25 0 1 0 0-10.5H6.5Z" />
    <path d="M6.78 1.97a.75.75 0 0 1 0 1.06L4.81 5 6.78 6.97a.75.75 0 1 1-1.06 1.06l-2.5-2.5a.75.75 0 0 1 0-1.06l2.5-2.5a.75.75 0 0 1 1.06 0Z" />
  </svg>
)

const ITrash = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
    <path d="M6 1.75A1.75 1.75 0 0 1 7.75 0h.5A1.75 1.75 0 0 1 10 1.75V2h3.25a.75.75 0 0 1 0 1.5H13l-.8 10.4A2.25 2.25 0 0 1 9.96 16H6.04A2.25 2.25 0 0 1 3.8 13.9L3 3.5h-.25a.75.75 0 0 1 0-1.5H6v-.25ZM8 1.5h-.25a.25.25 0 0 0-.25.25V2h.75v-.25A.25.25 0 0 0 8 1.5ZM4.5 3.5l.8 10.28c.03.4.37.72.77.72h3.86c.4 0 .74-.32.77-.72L11.5 3.5h-7Z" />
  </svg>
)

const IBolt = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
    <path d="M9.5 1 3.75 9h3.6L6.5 15l5.75-8H8.6L9.5 1Z" />
  </svg>
)

const ITrophy = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
    <path d="M4 1.75A.75.75 0 0 1 4.75 1h6.5a.75.75 0 0 1 .75.75V3h1.25A.75.75 0 0 1 14 3.75v1A3.25 3.25 0 0 1 11.1 8a4.5 4.5 0 0 1-2.35 2.03V12h2.25a.75.75 0 0 1 0 1.5H5a.75.75 0 0 1 0-1.5h2.25V10.03A4.5 4.5 0 0 1 4.9 8 3.25 3.25 0 0 1 2 4.75v-1A.75.75 0 0 1 2.75 3H4V1.75ZM12 4.5v.25A1.75 1.75 0 0 1 10.25 6.5h-.2c.3-.53.47-1.14.47-1.79V4.5H12ZM4 4.5h1.48v.21c0 .65.17 1.26.47 1.79h-.2A1.75 1.75 0 0 1 4 4.75V4.5Z" />
  </svg>
)

/* ---------------- Data ---------------- */

const PHASES = [
  { key: 'EASY', label: 'Easy' },
  { key: 'AVERAGE', label: 'Average' },
  { key: 'DIFFICULT', label: 'Difficult' },
  { key: 'JACKPOT', label: 'Jackpot' },
  { key: 'TIE_BREAKER', label: 'Tie-breaker' },
]

const ROUND_LABELS = [
  'VIDEO GAMES',
  'MUSIC',
  'TECH',
  'ANIME',
  'MEMES',
]

export default function Controller() {
  const { game } = useGame()
  const s = game.state
  const tb = game.tieBreaker

  const [confirmReset, setConfirmReset] = useState(false)
  const [clueDraft, setClueDraft] = useState(() => String(s.clueNumber ?? 1))

  const clueIsDirty = clueDraft !== String(s.clueNumber ?? 1)

  const clincherTeams = useMemo(() => {
    return (game.clincher.tiedTeamIds || [])
      .map((id) => game.teams.find((t) => t.id === id))
      .filter(Boolean)
  }, [game])

  const allowedValues = useMemo(() => {
    if (s.phase === 'EASY') return [10, 20, 30, 40]
    if (s.phase === 'AVERAGE') return [20, 40, 60, 80]
    return []
  }, [s.phase])

  function commitClueDraft() {
    const trimmed = clueDraft.trim()
    if (!trimmed) {
      setClueDraft(String(s.clueNumber ?? 1))
      return
    }
    const n = Number(trimmed)
    if (!Number.isFinite(n) || n < 1) {
      setClueDraft(String(s.clueNumber ?? 1))
      return
    }
    updateState({ clueNumber: n })
  }

  async function doReset() {
    if (!confirmReset) {
      setConfirmReset(true)
      setTimeout(() => setConfirmReset(false), 2500)
      return
    }
    await resetGame()
    setConfirmReset(false)
  }

  const scoringOn = !!s.scoringOpen
  const betsOn = !!s.betsOpen

  // ✅ Tie-breaker gating: only show “live controls” when needed or already in TB
  const clincherNeeded = !!game.clincher?.needed
  const isTieBreakerPhase = s.phase === 'TIE_BREAKER'
  const tieBreakActive = clincherNeeded || isTieBreakerPhase

  const submissionsCount = (tb?.submissions || []).length
  const canFinalize = isTieBreakerPhase && submissionsCount > 0
  const canResolve = !!tb?.conflict && submissionsCount > 0

  // ✅ One-button start: sets phase + opens scoring + creates new TB clue
  async function startTieBreaker() {
    // Put the whole app in tie-break mode first (so proctors see TB UI)
    await updateState({
      phase: 'TIE_BREAKER',
      roundLabel: 'TIE BREAKER',
      scoringOpen: true,
      betsOpen: false,
    })
    // Then spawn the new TB clue on server
    await tbNewClue()
  }

  return (
    <div className="gh-page">
      <style>{`
        /* GitHub-ish baseline */
        .gh-page{
          --bg: #0d1117;
          --panel: #161b22;
          --panel2: #0f141b;
          --border: #30363d;
          --text: #c9d1d9;
          --muted: #8b949e;
          --accent: #0425e0; /* your blue */
          --danger: #f85149;
          --ok: #3fb950;
          --shadow: 0 0 0 1px var(--border);
          color: var(--text);
        }

        .gh-page, .gh-page *{ box-sizing: border-box; }
        .gh-wrap{
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px;
        }

        .gh-header{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .gh-title{
          display:flex;
          align-items:center;
          gap: 10px;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: .01em;
          color: var(--text);
        }

        .gh-sub{
          margin-top: 2px;
          color: var(--muted);
          font-size: 12px;
        }

        .gh-meta{
          display:flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
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

        .gh-ico{
          display:inline-flex;
          width: 16px;
          height: 16px;
          color: var(--muted);
        }

        .gh-grid{
          display:grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 12px;
          align-items:start;
        }

        .gh-card{
          background: var(--panel);
          box-shadow: var(--shadow);
          border-radius: 10px;
          padding: 12px;
          min-width: 0;
        }

        .gh-card h2{
          margin: 0 0 10px;
          font-size: 13px;
          font-weight: 800;
          color: var(--text);
          display:flex;
          align-items:center;
          gap: 8px;
        }

        .gh-fields{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .gh-field{
          display:flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }

        .gh-label{
          font-size: 11px;
          color: var(--muted);
          font-weight: 700;
        }

        .gh-input, .gh-select{
          width: 100%;
          height: 34px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--panel2);
          color: var(--text);
          padding: 0 10px;
          outline: none;
          min-width: 0;
        }

        .gh-input:focus, .gh-select:focus{
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(4,37,224,.25);
        }

        .gh-help{
          font-size: 12px;
          color: var(--muted);
          display:flex;
          align-items:center;
          gap: 8px;
          margin-top: 6px;
          line-height: 1.4;
        }

        .gh-values{
          display:grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-top: 8px;
        }

        .gh-value{
          height: 34px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--panel2);
          color: var(--text);
          font-weight: 800;
          cursor: pointer;
        }

        .gh-value.active{
          border-color: var(--accent);
          box-shadow: 0 0 0 2px rgba(4,37,224,.25) inset;
        }

        .gh-toggleRow{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 10px;
        }

        .gh-toggle{
          height: 38px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--panel2);
          color: var(--text);
          font-weight: 800;
          cursor: pointer;
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding: 0 10px;
          gap: 10px;
          min-width: 0;
        }

        .gh-badge{
          display:inline-flex;
          align-items:center;
          gap: 6px;
          font-size: 12px;
          color: var(--muted);
          font-weight: 800;
        }

        .dot{
          width: 8px;
          height: 8px;
          border-radius: 99px;
          background: var(--muted);
        }
        .dot.on{ background: var(--ok); }
        .dot.off{ background: var(--danger); }

        .gh-actions{
          display:flex;
          gap: 10px;
          margin-top: 10px;
          flex-wrap: wrap;
        }

        .gh-btn{
          height: 34px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--panel2);
          color: var(--text);
          font-weight: 800;
          cursor: pointer;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap: 8px;
          padding: 0 12px;
        }

        .gh-btn.primary{
          border-color: rgba(4,37,224,.7);
          background: rgba(4,37,224,.18);
        }

        .gh-btn:disabled{
          opacity: .55;
          cursor: not-allowed;
        }

        .gh-btn.danger{
          border-color: rgba(248,81,73,.6);
          background: rgba(248,81,73,.15);
          color: #ffddda;
        }

        .gh-list{
          display:flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 8px;
        }

        .gh-item{
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--panel2);
          padding: 8px 10px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap: 10px;
        }

        .gh-item strong{
          font-size: 13px;
          color: var(--text);
        }

        .gh-item small{
          color: var(--muted);
          font-weight: 700;
        }

        .gh-alert{
          border-radius: 6px;
          border: 1px solid rgba(248,81,73,.6);
          background: rgba(248,81,73,.12);
          padding: 8px 10px;
          color: #ffd7d5;
          font-weight: 800;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap: 10px;
        }

        .gh-ok{
          border-radius: 6px;
          border: 1px solid rgba(63,185,80,.55);
          background: rgba(63,185,80,.10);
          padding: 8px 10px;
          color: #d2fedb;
          font-weight: 800;
          display:flex;
          align-items:center;
          gap: 8px;
        }

        @media (max-width: 920px){
          .gh-grid{ grid-template-columns: 1fr; }
          .gh-fields{ grid-template-columns: 1fr; }
          .gh-values{ grid-template-columns: repeat(2, 1fr); }
          .gh-toggleRow{ grid-template-columns: 1fr; }
          .gh-meta{ justify-content:flex-start; }
        }
      `}</style>

      <div className="gh-wrap">
        <div className="gh-header">
          <div>
            <div className="gh-title">CONTROLLER • GAME MASTER</div>
            <div className="gh-sub">Control panel. Updates live to proctors.</div>
          </div>

          <div className="gh-meta">
            <span className="gh-chip">
              <Icon><IFlag /></Icon> Phase: <b>{s.phase}</b>
            </span>
            <span className="gh-chip">
              <Icon><IHash /></Icon> Clue: <b>{s.clueNumber}</b>
            </span>
            <span className="gh-chip">
              <Icon><IClock /></Icon> Timer: <b>{s.seconds}s</b>
            </span>
          </div>
        </div>

        <div className="gh-grid">
          {/* LEFT */}
          <div className="gh-card">
            <h2><Icon><IFlag /></Icon> Round / State</h2>

            <div className="gh-fields">
              <div className="gh-field">
                <div className="gh-label">Phase</div>
                <select
                  className="gh-select"
                  value={s.phase}
                  onChange={(e) => updateState({ phase: e.target.value })}
                >
                  {PHASES.map((p) => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div className="gh-field">
                <div className="gh-label">Round Label</div>
                <select
                  className="gh-select"
                  value={s.roundLabel}
                  onChange={(e) => updateState({ roundLabel: e.target.value })}
                >
                  {ROUND_LABELS.map((x) => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </div>

              <div className="gh-field">
                <div className="gh-label">Clue #</div>
                <select
                  className="gh-input"
                  value={clueDraft}
                  onChange={(e) => setClueDraft(e.target.value)}
                  onBlur={commitClueDraft}
                >
                  <option value="">Select clue #</option>
                  {[...Array(20)].map((_, i) => {
                    const value = String(i + 1)
                    return <option key={value} value={value}>{value}</option>
                  })}
                </select>

                {clueIsDirty && (
                  <div className="gh-help">
                    <span>Unsaved — select another value or tap outside</span>
                  </div>
                )}
              </div>

              <div className="gh-field">
                <div className="gh-label">Seconds</div>
                <input className="gh-input" value={s.seconds} disabled />
              </div>
            </div>

            {allowedValues.length > 0 && (
              <>
                <div style={{ marginTop: 12 }} className="gh-label">Clue Value</div>
                <div className="gh-values">
                  {allowedValues.map((v) => (
                    <button
                      key={v}
                      className={'gh-value ' + (s.clueValue === v ? 'active' : '')}
                      onClick={() => updateState({ clueValue: v })}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div style={{ marginTop: 12 }} className="gh-label">Stage Switches</div>
            <div className="gh-toggleRow">
              <button className="gh-toggle" onClick={() => updateState({ scoringOpen: !s.scoringOpen })}>
                <span className="gh-badge">
                  <span className={'dot ' + (scoringOn ? 'on' : 'off')} />
                  Scoring
                </span>
                <span className="gh-badge" style={{ color: scoringOn ? 'var(--ok)' : 'var(--danger)' }}>
                  <Icon>{scoringOn ? <ICheck /> : <IX />}</Icon>
                  {scoringOn ? 'OPEN' : 'CLOSED'}
                </span>
              </button>

              {s.phase === 'DIFFICULT' ? (
                <button className="gh-toggle" onClick={() => updateState({ betsOpen: !s.betsOpen })}>
                  <span className="gh-badge">
                    <span className={'dot ' + (betsOn ? 'on' : 'off')} />
                    Bets
                  </span>
                  <span className="gh-badge" style={{ color: betsOn ? 'var(--ok)' : 'var(--danger)' }}>
                    <Icon>{betsOn ? <ICheck /> : <IX />}</Icon>
                    {betsOn ? 'OPEN' : 'CLOSED'}
                  </span>
                </button>
              ) : (
                <div className="gh-toggle" style={{ opacity: 0.65, cursor: 'not-allowed' }}>
                  <span className="gh-badge"><span className="dot" /> Bets</span>
                  <span className="gh-badge">DIFFICULT ONLY</span>
                </div>
              )}
            </div>

            <div className="gh-actions">
              <button className="gh-btn" onClick={() => undo()}>
                <Icon><IUndo /></Icon> Undo
              </button>

              <button className="gh-btn danger" onClick={doReset} title="Resets all scores and state">
                <Icon><ITrash /></Icon>
                {confirmReset ? 'Confirm Reset' : 'Reset'}
              </button>
            </div>
          </div>

          {/* RIGHT */}
          <div className="gh-card">
            <h2><Icon><ITrophy /></Icon> Clincher</h2>

            {clincherNeeded ? (
              <div className="gh-alert">
                <span>Top tie detected</span>
                <span style={{ color: 'var(--muted)' }}>{clincherTeams.length} teams</span>
              </div>
            ) : (
              <div className="gh-ok">
                <Icon><ICheck /></Icon> No tie for highest score
              </div>
            )}

            <div className="gh-list">
              {clincherNeeded &&
                clincherTeams.map((t) => (
                  <div key={t.id} className="gh-item">
                    <div>
                      <strong>{t.name}</strong>
                      <div><small>{t.id}</small></div>
                    </div>
                    <strong>{t.score}</strong>
                  </div>
                ))}
            </div>

            <div style={{ height: 12 }} />

            <h2><Icon><IBolt /></Icon> Tie-breaker</h2>

            {!tieBreakActive ? (
              <div className="gh-help">
                No tie detected. Tie-break controls stay locked unless a top-tie happens
                (or you’re already in Tie-breaker phase).
              </div>
            ) : (
              <div className="gh-help">
                <b>Step 1:</b> Start Tie-break → <b>Step 2:</b> Proctors press “Tie-break Correct” →
                <b> Step 3:</b> Finalize.
              </div>
            )}

            <div className="gh-actions" style={{ marginTop: 10 }}>
              <button
                className="gh-btn primary"
                onClick={startTieBreaker}
                disabled={!tieBreakActive}
                title="Switches phase to TIE_BREAKER, opens scoring, and creates a new tie-break clue"
              >
                <Icon><IBolt /></Icon>
                Start Tie-break
              </button>

              <button
                className="gh-btn"
                onClick={() => tbFinalize()}
                disabled={!canFinalize}
                title={!isTieBreakerPhase ? 'Switch phase to TIE_BREAKER first' : submissionsCount === 0 ? 'Wait for at least 1 submission' : 'Finalize tie-break'}
              >
                <Icon><IClock /></Icon>
                Finalize
              </button>
            </div>

            <div className="gh-list">
              <div className="gh-item">
                <div><small>Mode</small></div>
                <strong style={{ color: isTieBreakerPhase ? 'var(--accent)' : 'var(--muted)' }}>
                  {isTieBreakerPhase ? 'TIE_BREAKER' : '—'}
                </strong>
              </div>

              <div className="gh-item">
                <div><small>Submissions</small></div>
                <strong>{submissionsCount}</strong>
              </div>

              <div className="gh-item">
                <div><small>Conflict</small></div>
                <strong style={{ color: tb?.conflict ? 'var(--danger)' : 'var(--ok)' }}>
                  {tb?.conflict ? 'YES' : 'NO'}
                </strong>
              </div>

              <div className="gh-item">
                <div><small>Winner</small></div>
                <strong>{tb?.winnerTeamId || '—'}</strong>
              </div>
            </div>

            {canResolve && (
              <div style={{ marginTop: 10 }}>
                <div className="gh-label">Resolve conflict</div>
                <div className="gh-list">
                  {(tb.submissions || []).map((sub, idx) => {
                    const team = game.teams.find((t) => t.id === sub.teamId)
                    return (
                      <button
                        key={idx}
                        className="gh-btn primary"
                        style={{ width: '100%', justifyContent: 'flex-start' }}
                        onClick={() => tbResolve(sub.teamId)}
                      >
                        <Icon><ITrophy /></Icon>
                        Pick {team ? team.name : sub.teamId}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
