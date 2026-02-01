// client/src/App.jsx
import { NavLink, Route, Routes, Navigate } from 'react-router-dom'
import './ui.css'

import Controller from './pages/Controller'
import Teams from './pages/Teams'
import Assignments from './pages/Assignments'
import Proctor from './pages/Proctor'
import Leaderboard from './pages/Leaderboard'
import Join from './pages/Join'

import RequireGameId from './RequireGameId'
import { useGame } from './useGame'
import AuthGate from './AuthGate'

/* ---------------- Sidebar ---------------- */

function Sidebar() {
  const { connected, game } = useGame()

  return (
    <div className="sidebar">
      <div className="brand">COSS Jeopardy</div>

      <div className="muted">
        Socket: {connected ? 'connected' : 'disconnected'}
      </div>

      {game && (
        <div className="muted" style={{ marginTop: 6 }}>
          Phase: <b style={{ color: 'white' }}>{game.state.phase}</b>
          <span className="badge">{game.state.seconds}s</span>
        </div>
      )}

      <div className="nav" style={{ marginTop: 14 }}>
        <NavLink to="/controller">Controller</NavLink>
        <NavLink to="/teams">Teams</NavLink>
        <NavLink to="/assign">Assignments</NavLink>
        <NavLink to="/leaderboard">Leaderboard</NavLink>

        <div style={{ height: 10 }} />

        {Array.from({ length: 8 }, (_, i) => (
          <NavLink key={i} to={`/proctor/p${i + 1}`}>
            Proctor {i + 1}
          </NavLink>
        ))}
      </div>
    </div>
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
      {/* Public entry */}
      <Route path="/join" element={<Join />} />

      {/* Everything else requires Game ID */}
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
