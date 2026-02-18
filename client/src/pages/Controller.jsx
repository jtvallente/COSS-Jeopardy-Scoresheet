// client/src/pages/Controller.jsx
import { useMemo, useState, useEffect, useRef } from 'react'
import { useGame } from '../useGame'
import {
  resetGame,
  updateState,
  tbFinalize,
  tbResolve,
  tbStart,
} from '../api'

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

const ITag = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
    <path d="M7.5 1h-4A1.5 1.5 0 0 0 2 2.5v4a1.5 1.5 0 0 0 .44 1.06l6 6a1.5 1.5 0 0 0 2.12 0l3-3a1.5 1.5 0 0 0 0-2.12l-6-6A1.5 1.5 0 0 0 7.5 1Zm-4 .5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .35.15l6 6a.5.5 0 0 1 0 .7l-3 3a.5.5 0 0 1-.7 0l-6-6A.5.5 0 0 1 4.5 4V1.5Z" />
    <path d="M5.25 3.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" />
  </svg>
)

const ICurrencyDollar = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
    <path d="M8 1a.75.75 0 0 1 .75.75V3.1c1.7.23 3 1.34 3 2.9a.75.75 0 0 1-1.5 0c0-.9-.87-1.6-2.25-1.6S5.75 5.1 5.75 6c0 .8.72 1.26 2.18 1.55l.14.03c1.78.36 3.18 1.13 3.18 2.92 0 1.56-1.3 2.67-3 2.9v1.35a.75.75 0 0 1-1.5 0V13.4c-1.7-.23-3-1.34-3-2.9a.75.75 0 0 1 1.5 0c0 .9.87 1.6 2.25 1.6s2.25-.7 2.25-1.6c0-.8-.72-1.26-2.18-1.55l-.14-.03C5.4 8.56 4 7.79 4 6c0-1.56 1.3-2.67 3-2.9V1.75A.75.75 0 0 1 8 1Z" />
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

const ROUND_LABELS = ['VIDEO GAMES', 'MUSIC', 'TECH', 'ANIME', 'MEMES']

export default function Controller() {
  const { game, lastEvent } = useGame()
  const s = game.state
  const tb = game.tieBreaker

  const [confirmReset, setConfirmReset] = useState(false)
  const [flagNotices, setFlagNotices] = useState([])

  // const [clueDraft, setClueDraft] = useState(() => String(s.clueNumber ?? 1))

  // const clueIsDirty = clueDraft !== String(s.clueNumber ?? 1)

  const seenFlagsRef = useRef(new Set())
  const flagNoticesRef = useRef([])

  useEffect(() => {
    if (!lastEvent) return
    if (lastEvent.type !== 'FLAG_RAISED') return

    const key = [
      lastEvent.type,
      lastEvent.ts,
      lastEvent.proctorId,
      lastEvent.teamId,
      lastEvent.phase,
      lastEvent.roundLabel,
      lastEvent.clueNumber,
    ].join('|')

    if (seenFlagsRef.current.has(key)) return
    seenFlagsRef.current.add(key)

    const nextFlagNotices = [lastEvent, ...flagNoticesRef.current].slice(0, 5)
    flagNoticesRef.current = nextFlagNotices
    setFlagNotices(nextFlagNotices)
  }, [lastEvent])

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

  const clueValueRequired = s.phase === 'EASY' || s.phase === 'AVERAGE'
  const clueValueIsSet =
    !clueValueRequired ||
    (Number.isFinite(Number(s.clueValue)) && Number(s.clueValue) > 0)

  const scoringToggleDisabledReason =
    clueValueRequired && !clueValueIsSet ? 'Set a clue value first' : null

  // function commitClueDraft() {
  //   const trimmed = clueDraft.trim()
  //   if (!trimmed) {
  //     setClueDraft(String(s.clueNumber ?? 1))
  //     return
  //   }

  //   const n = Number(trimmed)
  //   if (!Number.isFinite(n) || n < 1) {
  //     setClueDraft(String(s.clueNumber ?? 1))
  //     return
  //   }

  //   updateState({ clueNumber: n, scoringOpen: false })
  // }

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

  const clincherNeeded = !!game.clincher?.needed
  const isTieBreakerPhase = s.phase === 'TIE_BREAKER'
  const tieBreakActive = clincherNeeded || isTieBreakerPhase

  const submissionsCount = (tb?.submissions || []).length
  const canFinalize = isTieBreakerPhase && submissionsCount > 0
  const canResolve = !!tb?.conflict && submissionsCount > 0

  const canStartTieBreak =
    game.state.postFinal && game.clincher?.needed && !isTieBreakerPhase

  // ---- NEW: progress metrics (server provides these) ----
  const scoringEligible = (game.scoringTracker?.eligibleTeamIds || []).length
  const scoringReceived = (game.scoringTracker?.receivedTeamIds || []).length

  const allScoresReceived =
    scoringEligible > 0 && scoringReceived === scoringEligible

  const scoringCloseBlocked = scoringOn && !allScoresReceived

  const betEligible = (game.betTracker?.eligibleTeamIds || []).length
  const betSubmitted = (game.betTracker?.submittedTeamIds || []).length

  const allBetsSubmitted = betEligible > 0 && betSubmitted === betEligible

  const betsToggleDisabled = s.scoringOpen
  const betsToggleTitle = betsToggleDisabled
    ? 'Close scoring before opening/closing bets.'
    : 'Toggle bets'

  // Only block when trying to OPEN scoring (currently closed) in DIFFICULT
  const scoringOpenBlockedByBets =
    s.phase === 'DIFFICULT' && !scoringOn && !allBetsSubmitted

  const scoringDisabledReason = scoringToggleDisabledReason
    ? scoringToggleDisabledReason
    : scoringOpenBlockedByBets
    ? `Scoring can only be opened after all bets are submitted (${betSubmitted}/${betEligible}).`
    : scoringCloseBlocked
    ? `Scoring can only be closed after all scores are received (${scoringReceived}/${scoringEligible}).`
    : null

  const scoringTitle = scoringDisabledReason || 'Toggle scoring'

  async function startTieBreaker() {
    await tbStart()
  }

  async function setClueValue(v) {
    await updateState({ clueValue: v, scoringOpen: false })
  }

  async function toggleScoring() {
    if (clueValueRequired && !clueValueIsSet) return
    await updateState({ scoringOpen: !s.scoringOpen })
  }

  //persistence
  // const [snapshotMsg, setSnapshotMsg] = useState('')
  // const [snapshotBusy, setSnapshotBusy] = useState(false)

  // function flashSnapshotMsg(text) {
  //   setSnapshotMsg(text)
  //   setTimeout(() => setSnapshotMsg(''), 2500)
  // }

  // async function doSaveSnapshot() {
  //   try {
  //     setSnapshotBusy(true)
  //     const data = await saveSnapshot()
  //     if (!data.ok)
  //       return flashSnapshotMsg(`Save failed: ${data.error || 'Unknown error'}`)
  //     flashSnapshotMsg('Snapshot saved')
  //   } catch (e) {
  //     flashSnapshotMsg(`Save failed: ${e.message}`)
  //   } finally {
  //     setSnapshotBusy(false)
  //   }
  // }

  // async function doLoadSnapshot() {
  //   // strong guard: restore is scary
  //   const yes = window.confirm(
  //     'Restore snapshot?\n\nThis will REPLACE the current game state with the last saved snapshot.'
  //   )
  //   if (!yes) return

  //   try {
  //     setSnapshotBusy(true)
  //     const data = await loadSnapshot()
  //     if (!data.ok)
  //       return flashSnapshotMsg(`Load failed: ${data.error || 'Unknown error'}`)
  //     flashSnapshotMsg('Snapshot restored')
  //   } catch (e) {
  //     flashSnapshotMsg(`Load failed: ${e.message}`)
  //   } finally {
  //     setSnapshotBusy(false)
  //   }
  // }

  return (
    <div className="gh-page">
      <style>{`
        
        .gh-page{
          --bg: #0d1117;
          --panel: #161b22;
          --panel2: #0f141b;
          --border: #30363d;
          --text: #c9d1d9;
          --muted: #8b949e;
          --accent: #0425e0;
          --danger: #f85149;
          --ok: #3fb950;
          --shadow: 0 0 0 1px var(--border);
          color: var(--text);
        }
        .gh-page, .gh-page *{ box-sizing: border-box; }
        .gh-wrap{ max-width: 1200px; margin: 0 auto; padding: 16px; }
        .gh-header{ display:flex; align-items:center; justify-content:space-between; gap: 12px; margin-bottom: 12px; }
        .gh-title{ display:flex; align-items:center; gap: 10px; font-size: 20px; font-weight: 800; letter-spacing: .01em; color: var(--text); }
        .gh-sub{ margin-top: 2px; color: var(--muted); font-size: 12px; }
        .gh-meta{ display:flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
        .gh-chip{ display:inline-flex; align-items:center; gap: 8px; padding: 6px 10px; border-radius: 999px; background: var(--panel); box-shadow: var(--shadow); font-size: 12px; color: var(--muted); white-space: nowrap; }
        .gh-chip b{ color: var(--text); }
        .gh-ico{ display:inline-flex; width: 16px; height: 16px; color: var(--muted); }
        .gh-grid{ display:grid; grid-template-columns: 1.4fr 1fr; gap: 12px; align-items:start; }
        .gh-card{ background: var(--panel); box-shadow: var(--shadow); border-radius: 10px; padding: 12px; min-width: 0; }
        .gh-card h2{ margin: 0 0 10px; font-size: 13px; font-weight: 800; color: var(--text); display:flex; align-items:center; gap: 8px; }
        .gh-fields{ display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .gh-field{ display:flex; flex-direction: column; gap: 6px; min-width: 0; }
        .gh-label{ font-size: 11px; color: var(--muted); font-weight: 700; }
        .gh-input, .gh-select{ width: 100%; height: 34px; border-radius: 6px; border: 1px solid var(--border); background: var(--panel2); color: var(--text); padding: 0 10px; outline: none; min-width: 0; }
        .gh-input:focus, .gh-select:focus{ border-color: var(--accent); box-shadow: 0 0 0 3px rgba(4,37,224,.25); }
        .gh-help{ font-size: 12px; color: var(--muted); display:flex; align-items:center; gap: 8px; margin-top: 6px; line-height: 1.4; }
        .gh-values{ display:grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 8px; }
        .gh-value{ height: 34px; border-radius: 6px; border: 1px solid var(--border); background: var(--panel2); color: var(--text); font-weight: 800; cursor: pointer; }
        .gh-value.active{ border-color: var(--accent); box-shadow: 0 0 0 2px rgba(4,37,224,.25) inset; }
        .gh-toggleRow{ display:grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
        .gh-toggle{ height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--panel2); color: var(--text); font-weight: 800; cursor: pointer; display:flex; align-items:center; justify-content:space-between; padding: 0 10px; gap: 10px; min-width: 0; }
        .gh-badge{ display:inline-flex; align-items:center; gap: 6px; font-size: 12px; color: var(--muted); font-weight: 800; }
        .dot{ width: 8px; height: 8px; border-radius: 99px; background: var(--muted); }
        .dot.on{ background: var(--ok); }
        .dot.off{ background: var(--danger); }
        .gh-actions{ display:flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
        .gh-btn{ height: 34px; border-radius: 6px; border: 1px solid var(--border); background: var(--panel2); color: var(--text); font-weight: 800; cursor: pointer; display:inline-flex; align-items:center; justify-content:center; gap: 8px; padding: 0 12px; }
        .gh-btn.primary{ border-color: rgba(4,37,224,.7); background: rgba(4,37,224,.18); }
        .gh-btn:disabled{ opacity: .55; cursor: not-allowed; }
        .gh-btn.danger{ border-color: rgba(248,81,73,.6); background: rgba(248,81,73,.15); color: #ffddda; }
        .gh-list{ display:flex; flex-direction: column; gap: 8px; margin-top: 8px; }
        .gh-item{ border-radius: 6px; border: 1px solid var(--border); background: var(--panel2); padding: 8px 10px; display:flex; align-items:center; justify-content:space-between; gap: 10px; }
        .gh-item strong{ font-size: 13px; color: var(--text); }
        .gh-item small{ color: var(--muted); font-weight: 700; }
        .gh-alert{ border-radius: 6px; border: 1px solid rgba(248,81,73,.6); background: rgba(248,81,73,.12); padding: 8px 10px; color: #ffd7d5; font-weight: 800; display:flex; align-items:center; justify-content:space-between; gap: 10px; }
        .gh-ok{ border-radius: 6px; border: 1px solid rgba(63,185,80,.55); background: rgba(63,185,80,.10); padding: 8px 10px; color: #d2fedb; font-weight: 800; display:flex; align-items:center; gap: 8px; }
        .gh-overview{
        border: 1px solid var(--border);
        background: var(--panel2);
        border-radius: 10px;
        padding: 10px;
        box-shadow: 0 0 0 1px rgba(0,0,0,.12) inset;
        margin-bottom: 10px;
        }
        .gh-overviewTop{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap: 10px;
        flex-wrap:wrap;
        }
        .gh-overviewTitle{
        display:flex;
        align-items:center;
        gap: 8px;
        font-weight: 900;
        letter-spacing: .08em;
        text-transform: uppercase;
        font-size: 11px;
        color: var(--muted);
        }
        .gh-overviewGrid{
        margin-top: 10px;
        display:grid;
        grid-template-columns: repeat(2, minmax(0,1fr));
        gap: 8px;
        }
        .gh-stat{
        border: 1px solid var(--border);
        background: rgba(255,255,255,.02);
        border-radius: 10px;
        padding: 10px;
        display:flex;
        align-items:flex-start;
        gap: 10px;
        min-width: 0;
        }
        .gh-stat .gh-ico{ margin-top: 1px; }
        .gh-statLabel{
        font-size: 11px;
        color: var(--muted);
        font-weight: 800;
        letter-spacing: .06em;
        text-transform: uppercase;
        line-height: 1.1;
        }
        .gh-statValue{
        margin-top: 4px;
        font-size: 14px;
        font-weight: 900;
        color: var(--text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        }
        .gh-pillRow{
        display:flex;
        gap: 8px;
        flex-wrap:wrap;
        }
        .gh-pill{
        display:inline-flex;
        align-items:center;
        gap: 8px;
        padding: 6px 10px;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: rgba(255,255,255,.02);
        font-weight: 900;
        letter-spacing: .08em;
        text-transform: uppercase;
        font-size: 11px;
        color: var(--text);
        white-space: nowrap;
        }
        .gh-pill .dot{ width: 10px; height: 10px; }
        .gh-pill.good{ border-color: rgba(63,185,80,.55); }
        .gh-pill.bad{ border-color: rgba(248,81,73,.55); }
        .gh-pill.warn{ border-color: rgba(210,153,34,.55); }
        @media (max-width: 920px){
        .gh-overviewGrid{ grid-template-columns: 1fr; }
        }
        .gh-span2{
        grid-column: 1 / -1; /* makes it the “---” row */
        }
        @media (max-width: 920px){
        .gh-overviewGrid{ grid-template-columns: 1fr; }
        .gh-span2{ grid-column: auto; }
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
            <div className="gh-sub">
              Control panel. Updates live to proctors.
            </div>
          </div>
        </div>

        <div className="gh-grid">
          {/* LEFT */}
          <div className="gh-card">
            <div className="gh-overview">
              <div className="gh-overviewTop">
                <div className="gh-overviewTitle">
                  <Icon>
                    <IFlag />
                  </Icon>{' '}
                  Round Overview
                </div>

                <div className="gh-pillRow">
                  <span
                    className={'gh-pill ' + (s.scoringOpen ? 'good' : 'bad')}
                  >
                    <span className={'dot ' + (s.scoringOpen ? 'on' : 'off')} />
                    Scoring {s.scoringOpen ? 'Open' : 'Closed'}
                  </span>

                  <span className={'gh-pill ' + (s.betsOpen ? 'warn' : 'bad')}>
                    <span className={'dot ' + (s.betsOpen ? 'on' : 'off')} />
                    Bets {s.betsOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
              </div>

              <div className="gh-overviewGrid">
                <div className="gh-stat">
                  <Icon>
                    <IFlag />
                  </Icon>
                  <div style={{ minWidth: 0 }}>
                    <div className="gh-statLabel">Phase</div>
                    <div className="gh-statValue">{s.phase}</div>
                  </div>
                </div>

                <div className="gh-stat">
                  <Icon>
                    <ITag />
                  </Icon>
                  <div style={{ minWidth: 0 }}>
                    <div className="gh-statLabel">Category</div>
                    <div className="gh-statValue">{s.roundLabel}</div>
                  </div>
                </div>

                <div className="gh-stat">
                  <Icon>
                    <IHash />
                  </Icon>
                  <div style={{ minWidth: 0 }}>
                    <div className="gh-statLabel">Clue #</div>
                    <div className="gh-statValue">{s.clueNumber}</div>
                  </div>
                </div>

                <div className="gh-stat">
                  <Icon>
                    <IClock />
                  </Icon>
                  <div style={{ minWidth: 0 }}>
                    <div className="gh-statLabel">Seconds</div>
                    <div className="gh-statValue">{s.seconds}s</div>
                  </div>
                </div>

                <div className="gh-stat gh-span2">
                  <Icon>
                    <ICurrencyDollar />
                  </Icon>
                  <div style={{ minWidth: 0 }}>
                    <div className="gh-statLabel">Clue Value</div>
                    <div className="gh-statValue">
                      {(s.phase === 'EASY' || s.phase === 'AVERAGE') &&
                      Number(s.clueValue) > 0
                        ? s.clueValue
                        : '—'}
                    </div>
                  </div>
                </div>

                {/* NEW: Scoring progress */}
                <div className="gh-stat">
                  <Icon>
                    <ICheck />
                  </Icon>
                  <div style={{ minWidth: 0 }}>
                    <div className="gh-statLabel">Scores Received</div>
                    <div className="gh-statValue">
                      {scoringReceived}/{scoringEligible}
                    </div>
                  </div>
                </div>

                {/* NEW: Bets progress */}
                <div className="gh-stat">
                  <Icon>
                    <ICurrencyDollar />
                  </Icon>
                  <div style={{ minWidth: 0 }}>
                    <div className="gh-statLabel">Bets Submitted</div>
                    <div className="gh-statValue">
                      {s.phase === 'DIFFICULT'
                        ? `${betSubmitted}/${betEligible}`
                        : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <h2>
              <Icon>
                <IFlag />
              </Icon>{' '}
              Round / State
            </h2>
            <div className="gh-card" style={{ marginTop: 12 }}>
              <div className="gh-fields">
                {/* <div className="gh-field">
                <div className="gh-label">Phase</div>
                <div
                  className="gh-input"
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  {s.phase}
                </div>
              </div> */}

                <div className="gh-field" style={{ gridColumn: '1 / -1' }}>
                  <div className="gh-label">Category</div>

                  <div className="gh-values">
                    {ROUND_LABELS.map((label) => (
                      <button
                        key={label}
                        className={
                          'gh-value ' + (s.roundLabel === label ? 'active' : '')
                        }
                        onClick={() => updateState({ roundLabel: label })}
                        title={`Set category to ${label}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* <div className="gh-field">
                <div className="gh-label">Clue #</div>
                <div
                  className="gh-input"
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  {s.clueNumber}
                </div>
                <div className="gh-help">
                  Clue number auto-advances when scoring is closed.
                </div>
              </div> */}

                {/* <div className="gh-field">
                <div className="gh-label">Seconds</div>
                <input className="gh-input" value={s.seconds} disabled />
              </div> */}
              </div>

              {allowedValues.length > 0 && (
                <>
                  <div style={{ marginTop: 12 }} className="gh-label">
                    Clue Value
                  </div>
                  <div className="gh-values">
                    {allowedValues.map((v) => (
                      <button
                        key={v}
                        className={
                          'gh-value ' + (s.clueValue === v ? 'active' : '')
                        }
                        onClick={() => setClueValue(v)}
                        title="Setting clue value closes scoring"
                      >
                        {v}
                      </button>
                    ))}
                  </div>

                  {!clueValueIsSet && (
                    <div className="gh-help">
                      <span style={{ color: 'var(--danger)', fontWeight: 800 }}>
                        Set a clue value before opening scoring.
                      </span>
                    </div>
                  )}
                </>
              )}

              <div style={{ marginTop: 12 }} className="gh-label">
                Stage Switches
              </div>
              <div className="gh-toggleRow">
                <button
                  className="gh-toggle"
                  onClick={toggleScoring}
                  disabled={!!scoringDisabledReason}
                  title={scoringTitle}
                  aria-disabled={!!scoringDisabledReason}
                  aria-describedby="scoring-lock-hint"
                  style={
                    scoringDisabledReason
                      ? { opacity: 0.65, cursor: 'not-allowed' }
                      : undefined
                  }
                >
                  <span className="gh-badge">
                    <span className={'dot ' + (scoringOn ? 'on' : 'off')} />
                    Scoring
                  </span>

                  <span
                    className="gh-badge"
                    style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                  >
                    {/* progress indicator always visible */}
                    <span style={{ color: 'var(--muted)', fontWeight: 800 }}>
                      {scoringEligible > 0
                        ? `${scoringReceived}/${scoringEligible}`
                        : '—'}
                    </span>

                    <span
                      style={{
                        color: scoringOn ? 'var(--ok)' : 'var(--danger)',
                        display: 'inline-flex',
                        gap: 6,
                      }}
                    >
                      <Icon>{scoringOn ? <ICheck /> : <IX />}</Icon>
                      {scoringOn ? 'OPEN' : 'CLOSED'}
                    </span>
                  </span>
                </button>

                {/* helper text under the toggle (works even if tooltips don’t) */}
                <div
                  id="scoring-lock-hint"
                  className="gh-help"
                  style={{ marginTop: 6 }}
                >
                  {scoringCloseBlocked ? (
                    <span style={{ color: 'var(--muted)' }}>
                      Scoring will unlock for closing only after all eligible
                      teams submit scores (<b>{scoringReceived}</b>/
                      <b>{scoringEligible}</b>).
                    </span>
                  ) : (
                    <span style={{ color: 'var(--muted)' }}>
                      {scoringOn
                        ? 'Close scoring when everyone has submitted.'
                        : 'Open scoring to accept proctor submissions.'}
                    </span>
                  )}
                </div>

                {s.phase === 'DIFFICULT' ? (
                  <button
                    className="gh-toggle"
                    onClick={() => {
                      if (s.scoringOpen) return
                      updateState({ betsOpen: !s.betsOpen })
                    }}
                    disabled={s.scoringOpen}
                    title={betsToggleTitle}
                    style={
                      s.scoringOpen
                        ? { opacity: 0.65, cursor: 'not-allowed' }
                        : undefined
                    }
                  >
                    <span className="gh-badge">
                      <span className={'dot ' + (betsOn ? 'on' : 'off')} />
                      Bets
                    </span>

                    <span
                      className="gh-badge"
                      style={{ color: betsOn ? 'var(--ok)' : 'var(--danger)' }}
                    >
                      <Icon>{betsOn ? <ICheck /> : <IX />}</Icon>
                      {betsOn ? 'OPEN' : 'CLOSED'}
                    </span>
                  </button>
                ) : (
                  <div
                    className="gh-toggle"
                    style={{ opacity: 0.65, cursor: 'not-allowed' }}
                  >
                    <span className="gh-badge">
                      <span className="dot" /> Bets
                    </span>
                    <span className="gh-badge">DIFFICULT ONLY</span>
                  </div>
                )}
              </div>
            </div>
            {/* --- Proctor Scoring Monitor --- */}
            <div className="gh-card" style={{ marginTop: 12 }}>
              <h2>Scoring Progress by Proctor</h2>

              <div className="gh-list">
                {game.proctors.map((p) => {
                  const eligibleTeams = (
                    game.scoringTracker?.eligibleTeamIds || []
                  ).filter((id) => p.teamIds.includes(id))

                  const receivedTeams = (
                    game.scoringTracker?.receivedTeamIds || []
                  ).filter((id) => eligibleTeams.includes(id))

                  return (
                    <div key={p.id} className="gh-item">
                      {/* Proctor name + progress */}
                      <div>
                        <strong>{p.name}</strong>
                        <div>
                          <small>
                            {receivedTeams.length} / {eligibleTeams.length}
                          </small>
                        </div>
                      </div>

                      {/* Team submission pills */}
                      <div className="gh-pillRow">
                        {eligibleTeams.map((teamId) => {
                          const team = game.teams.find((t) => t.id === teamId)
                          const received = receivedTeams.includes(teamId)

                          return (
                            <span
                              key={teamId}
                              className={`gh-pill ${
                                received ? 'good' : 'warn'
                              }`}
                              title={received ? 'Submitted' : 'Waiting'}
                            >
                              <span
                                className={`dot ${received ? 'on' : 'off'}`}
                              />
                              {team?.name ?? teamId}
                            </span>
                          )
                        })}

                        {eligibleTeams.length === 0 && (
                          <span className="gh-pill">
                            <span className="dot off" />
                            No teams
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="gh-actions">
              {/* <button className="gh-btn" onClick={() => undo()}>
                <Icon>
                  <IUndo />
                </Icon>{' '}
                Undo
              </button>

              <button
                className="gh-btn"
                onClick={doSaveSnapshot}
                disabled={snapshotBusy}
                title="Write game.snapshot.json to GM laptop"
              >
                <Icon>
                  <ICheck />
                </Icon>
                {snapshotBusy ? 'Saving…' : 'Save Snapshot'}
              </button>

              <button
                className="gh-btn"
                onClick={doLoadSnapshot}
                disabled={snapshotBusy}
                title="Restore game state from last snapshot"
              >
                <Icon>
                  <IClock />
                </Icon>
                {snapshotBusy ? 'Loading…' : 'Restore Snapshot'}
              </button> */}

              <button
                className="gh-btn danger"
                onClick={doReset}
                title="Resets all scores and state"
              >
                <Icon>
                  <ITrash />
                </Icon>
                {confirmReset ? 'Confirm Reset' : 'Reset'}
              </button>
            </div>

            {/* {snapshotMsg && (
              <div className="gh-help" style={{ marginTop: 8 }}>
                <span style={{ fontWeight: 800 }}>{snapshotMsg}</span>
              </div>
            )} */}
          </div>

          {/* RIGHT */}
          <div className="gh-card">
            {flagNotices.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <h2>
                  <Icon>
                    <IFlag />
                  </Icon>
                  Flags Raised
                </h2>

                <div className="gh-list">
                  {flagNotices.map((evt, idx) => {
                    const proctor = game.proctors.find(
                      (p) => p.id === evt.proctorId
                    )
                    const team = game.teams.find((t) => t.id === evt.teamId)

                    return (
                      <div
                        key={evt.ts + idx}
                        className="gh-item"
                        style={{
                          border: '1px solid rgba(210,153,34,.55)',
                          background: 'rgba(210,153,34,.12)',
                          color: '#ffe8b6',
                        }}
                      >
                        {' '}
                        <div style={{ minWidth: 160 }}>
                          <strong>{proctor?.name ?? evt.proctorId}</strong>
                          <div style={{ fontSize: 11, marginTop: 2 }}>
                            {evt.phase} • {evt.roundLabel} • Clue{' '}
                            {evt.clueNumber}
                          </div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0, fontWeight: 800 }}>
                          {team?.name ?? evt.teamId}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            gap: 8,
                            alignItems: 'center',
                          }}
                        >
                          <span style={{ fontSize: 11 }}>
                            {new Date(evt.ts).toLocaleTimeString()}
                          </span>

                          {/* DISMISS */}
                          <button
                            className="gh-btn"
                            onClick={() => {
                              const next = flagNoticesRef.current.filter(
                                (_, i) => i !== idx
                              )
                              flagNoticesRef.current = next
                              setFlagNotices(next)
                            }}
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <h2 style={{ marginTop: 16 }}>
              <Icon>
                <ITrophy />
              </Icon>{' '}
              Clincher
            </h2>

            {clincherNeeded ? (
              <div className="gh-alert">
                <span>Top tie detected</span>
                <span style={{ color: 'var(--muted)' }}>
                  {clincherTeams.length} teams
                </span>
              </div>
            ) : (
              <div className="gh-ok">
                <Icon>
                  <ICheck />
                </Icon>{' '}
                No tie for highest score
              </div>
            )}

            <div className="gh-list">
              {clincherNeeded &&
                clincherTeams.map((t) => (
                  <div key={t.id} className="gh-item">
                    <div>
                      <strong>{t.name}</strong>
                      <div>
                        <small>{t.id}</small>
                      </div>
                    </div>
                    <strong>{t.score}</strong>
                  </div>
                ))}
            </div>

            <div style={{ height: 12 }} />

            <h2>
              <Icon>
                <IBolt />
              </Icon>{' '}
              Tie-breaker
            </h2>

            {!tieBreakActive ? (
              <div className="gh-help">
                No tie detected. Tie-break controls stay locked unless a top-tie
                happens (or you’re already in Tie-breaker phase).
              </div>
            ) : (
              <div className="gh-help">
                <b>Step 1:</b> Start Tie-break → <b>Step 2:</b> Proctors press
                “Tie-break Correct” →<b> Step 3:</b> Finalize.
              </div>
            )}

            <div className="gh-actions" style={{ marginTop: 10 }}>
              <button
                className="gh-btn primary"
                onClick={startTieBreaker}
                disabled={!canStartTieBreak}
                title={
                  !game.state.postFinal
                    ? 'Finish the final round first'
                    : !game.clincher?.needed
                    ? 'No tie for highest score'
                    : 'Start tie-break'
                }
              >
                Start Tie-break
              </button>

              <button
                className="gh-btn"
                onClick={() => tbFinalize()}
                disabled={!canFinalize}
                title={
                  !isTieBreakerPhase
                    ? 'Switch phase to TIE_BREAKER first'
                    : submissionsCount === 0
                    ? 'Wait for at least 1 submission'
                    : 'Finalize tie-break'
                }
              >
                <Icon>
                  <IClock />
                </Icon>
                Finalize
              </button>
            </div>

            <div className="gh-list">
              <div className="gh-item">
                <div>
                  <small>Mode</small>
                </div>
                <strong
                  style={{
                    color: isTieBreakerPhase ? 'var(--accent)' : 'var(--muted)',
                  }}
                >
                  {isTieBreakerPhase ? 'TIE_BREAKER' : '—'}
                </strong>
              </div>

              <div className="gh-item">
                <div>
                  <small>Submissions</small>
                </div>
                <strong>{submissionsCount}</strong>
              </div>

              <div className="gh-item">
                <div>
                  <small>Conflict</small>
                </div>
                <strong
                  style={{
                    color: tb?.conflict ? 'var(--danger)' : 'var(--ok)',
                  }}
                >
                  {tb?.conflict ? 'YES' : 'NO'}
                </strong>
              </div>

              <div className="gh-item">
                <div>
                  <small>Winner</small>
                </div>
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
                        <Icon>
                          <ITrophy />
                        </Icon>
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
