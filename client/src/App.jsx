// client/src/App.jsx
import { NavLink, Route, Routes, Navigate } from 'react-router-dom'
import { useState } from 'react'
import './ui.css'

import Controller from './pages/Controller'
import Teams from './pages/Teams'
import Assignments from './pages/Assignments'
import Proctor from './pages/Proctor'
import Leaderboard from './pages/Leaderboard'
import Join from './pages/Join'

import { useGame } from './useGame'
import AuthGate from './AuthGate'

/* -------- GitHub-style SVG icons -------- */

const IconController = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="2" y="7" width="20" height="10" rx="2" />
    <line x1="6" y1="12" x2="6" y2="12" />
    <line x1="10" y1="12" x2="10" y2="12" />
  </svg>
)

const IconTeams = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="9" cy="7" r="3" />
    <circle cx="17" cy="7" r="3" />
    <path d="M2 21c0-4 3-7 7-7" />
    <path d="M15 14c4 0 7 3 7 7" />
  </svg>
)

const IconAssignments = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
)

const IconLeaderboard = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M3 12h4v8H3z" />
    <path d="M10 8h4v12h-4z" />
    <path d="M17 4h4v16h-4z" />
  </svg>
)

const IconProctor = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="7" r="4" />
    <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
  </svg>
)

/* ---------------- Sidebar ---------------- */

function Sidebar() {
  const { connected, game } = useGame()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="sb-toggle"
        aria-label="Open sidebar"
        onClick={() => setOpen((v) => !v)}
      >
        ☰
      </button>

      {/* Mobile backdrop */}
      <button
        className={`sb-backdrop ${open ? 'show' : ''}`}
        aria-label="Close sidebar"
        onClick={() => setOpen(false)}
      />

      <aside className={`sb ${open ? 'open' : ''}`}>
        <style>{`
          :root{
            --accent: #0425e0;
            --sb-bg: #0d1117;          /* GitHub dark */
            --sb-panel: #161b22;       /* GitHub dark panel */
            --sb-border: #30363d;      /* GitHub border */
            --sb-text: #c9d1d9;
            --sb-muted: #8b949e;
            --sb-hover: rgba(255,255,255,.06);
            --sb-black:rgb(0, 0, 0);
          }

          /* Sidebar container */
          .sb{
            width: 280px;
            background: var(--sb-panel);
            color: var(--sb-text);
            border-right: 1px solid var(--sb-border);
            padding: 14px;
            display:flex;
            flex-direction:column;
            gap: 12px;
          }

          /* Mobile drawer */
          @media (max-width: 900px){
            .sb{
              position: fixed;
              top: 0;
              left: 0;
              height: 100vh;
              transform: translateX(-105%);
              transition: transform .18s ease;
              z-index: 60;
              box-shadow: 14px 0 40px rgba(0,0,0,.55);
            }
            .sb.open{ transform: translateX(0); }
          }

          /* Mobile backdrop (full black) */
          .sb-backdrop{
            display:none;
          }
          @media (max-width: 900px){
            .sb-backdrop{
              display:block;
              position: fixed;
              inset: 0;
              background: #000;
              opacity: 0;
              pointer-events:none;
              transition: opacity .18s ease;
              z-index: 50;
              border: none;
            }
            .sb-backdrop.show{
              opacity: .55;
              pointer-events:auto;
            }
          }

          /* Toggle button */
          .sb-toggle{
            display:none;
            position: fixed;
            top: 12px;
            left: 12px;
            z-index: 70;
            border: 1px solid var(--sb-border);
            background: var(--sb-panel);
            color: var(--sb-text);
            border-radius: 10px;
            padding: 10px 12px;
            font-size: 18px;
            font-weight: 900;
          }
          @media (max-width: 900px){
            .sb-toggle{ display:block; }
          }

          /* Brand header */
          .sb-brand{
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap: 10px;
            padding: 10px 10px;
            border-radius: 12px;
            background: var(--sb-panel);
            border: 1px solid var(--sb-border);
          }
          .sb-title{
            display:flex;
            flex-direction:column;
            gap: 2px;
            min-width: 0;
          }
          .sb-title b{
            font-size: 13px;
            letter-spacing: .06em;
            text-transform: uppercase;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .sb-title span{
            font-size: 12px;
            color: var(--sb-muted);
          }

          /* Status dot */
          .sb-dot{
            width: 10px;
            height: 10px;
            border-radius: 99px;
            background: ${connected ? 'var(--accent)' : '#ef4444'};
            box-shadow: ${connected ? '0 0 0 4px rgba(4,37,224,.18)' : 'none'};
            flex: none;
          }

          /* Phase pill */
          .sb-phase{
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap: 10px;
            padding: 10px 10px;
            border-radius: 12px;
            background: var(--sb-panel);
            border: 1px solid var(--sb-border);
            font-size: 12px;
            color: var(--sb-muted);
          }
          .sb-phase b{
            color: var(--sb-text);
            letter-spacing: .08em;
            text-transform: uppercase;
            font-size: 12px;
          }
          .sb-pill{
            border: 1px solid rgba(4,37,224,.45);
            background: rgba(4,37,224,.14);
            color: #dbe2ff;
            padding: 4px 10px;
            border-radius: 999px;
            font-weight: 900;
            font-size: 12px;
            letter-spacing: .06em;
          }

          /* Sections */
          .sb-section{
            margin-top: 6px;
            font-size: 11px;
            letter-spacing: .12em;
            text-transform: uppercase;
            color: var(--sb-muted);
            padding: 0 8px;
          }

          /* Nav */
          .sb-nav{
            display:flex;
            flex-direction:column;
            gap: 4px;
          }
          .sb-link{
            display:flex;
            align-items:center;
            gap: 10px;
            padding: 10px 10px;
            border-radius: 10px;
            border: 1px solid transparent;
            text-decoration:none;
            color: var(--sb-text);
            font-weight: 700;
            font-size: 14px;
          }
          .sb-link:hover{
            background: var(--sb-hover);
            border-color: rgba(255,255,255,.06);
          }
          .sb-link.active{
            background: rgba(4,37,224,.16);
            border-color: rgba(4,37,224,.45);
          }

          .sb-link .sb-ico{
            width: 18px;
            height: 18px;
            border-radius: 6px;
            background: rgba(255,255,255,.06);
            border: 1px solid rgba(255,255,255,.08);
            display:grid;
            place-items:center;
            font-size: 12px;
            color: rgba(255,255,255,.75);
            flex:none;
          }
          .sb-link.active .sb-ico{
            background: rgba(4,37,224,.22);
            border-color: rgba(4,37,224,.45);
            color: #dbe2ff;
          }

          /* Proctors scroll */
          .sb-proctors{
            max-height: 440px;
            overflow-y: auto;
            padding-right: 4px;
          }
          .sb-proctors::-webkit-scrollbar{ width: 8px; }
          .sb-proctors::-webkit-scrollbar-thumb{
            background: rgba(255,255,255,.10);
            border-radius: 999px;
          }
        `}</style>

        <div className="sb-brand">
          <div className="sb-title">
            <b>COSS Jeopardy</b>
            <span>{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <div className="sb-dot" />
        </div>

        {game && (
          <div className="sb-phase">
            <div>
              <div style={{ fontSize: 11, color: 'var(--sb-muted)' }}>
                Phase
              </div>
              <b>{game.state.phase}</b>
            </div>
            <div className="sb-pill">{game.state.seconds}s</div>
          </div>
        )}

        <div className="sb-section">Game Master</div>
        <nav className="sb-nav">
          <NavLink
            to="/controller"
            className={({ isActive }) => `sb-link ${isActive ? 'active' : ''}`}
          >
            <span className="sb-ico">
              <IconController />
            </span>
            Controller
          </NavLink>

          <NavLink
            to="/teams"
            className={({ isActive }) => `sb-link ${isActive ? 'active' : ''}`}
          >
            <span className="sb-ico">
              <IconTeams />
            </span>
            Teams
          </NavLink>

          <NavLink
            to="/assign"
            className={({ isActive }) => `sb-link ${isActive ? 'active' : ''}`}
          >
            <span className="sb-ico">
              <IconAssignments />
            </span>
            Assignments
          </NavLink>

          <NavLink
            to="/leaderboard"
            className={({ isActive }) => `sb-link ${isActive ? 'active' : ''}`}
          >
            <span className="sb-ico">
              <IconLeaderboard />
            </span>
            Leaderboard
          </NavLink>
        </nav>

        <div className="sb-section">Proctors</div>
        <nav className="sb-nav sb-proctors">
          {Array.from({ length: 8 }, (_, i) => (
            <NavLink
              key={i}
              to={`/proctor/p${i + 1}`}
              className={({ isActive }) =>
                `sb-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="sb-ico">
                <IconProctor />
              </span>
              Proctor {i + 1}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}

/* ---------------- Layout (protected) ---------------- */

function AppLayout() {
  const { game } = useGame()

  if (!game) {
    return <div style={{ padding: 20 }}>Loading…</div>
  }

  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <Routes>
          <Route path="/" element={<Navigate to="/controller" replace />} />
          <Route path="/controller" element={<Controller />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/assign" element={<Assignments />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/proctor/:proctorId" element={<Proctor />} />
        </Routes>
      </div>
    </div>
  )
}

/* ---------------- Root App ---------------- */

export default function App() {
  return (
    <Routes>
      <Route path="/join" element={<Join />} />

      <Route
        path="/*"
        element={
          <AuthGate>
            <AppLayout />
          </AuthGate>
        }
      />
    </Routes>
  )
}
