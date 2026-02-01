// client/src/App.jsx
import { NavLink, Route, Routes, Navigate } from "react-router-dom";
import { useState } from "react";
import "./ui.css";

import Controller from "./pages/Controller";
import Teams from "./pages/Teams";
import Assignments from "./pages/Assignments";
import Proctor from "./pages/Proctor";
import Leaderboard from "./pages/Leaderboard";
import Join from "./pages/Join";

import { useGame } from "./useGame";
import AuthGate from "./AuthGate";

/* ---------------- Sidebar ---------------- */

function Sidebar() {
  const { connected, game } = useGame();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="sidebar-toggle"
        onClick={() => setOpen((v) => !v)}
      >
        ☰
      </button>

      <aside className={`sidebar ${open ? "open" : ""}`}>
        <style>{`
          .sidebar {
            width: 260px;
            background:
              linear-gradient(180deg, #050714, #070a1f 60%, #040514);
            color: #fff;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            border-right: 1px solid rgba(255,255,255,.12);
          }

          .sidebar-toggle {
            display: none;
            position: fixed;
            top: 14px;
            left: 14px;
            z-index: 50;
            background: linear-gradient(90deg, #22d3ee, #a78bfa);
            border: none;
            border-radius: 10px;
            padding: 10px 14px;
            font-size: 18px;
            font-weight: 900;
            color: #061022;
            box-shadow: 0 10px 24px rgba(0,0,0,.35);
          }

          .brand {
            font-size: 22px;
            font-weight: 1000;
            letter-spacing: .08em;
            text-transform: uppercase;
            text-shadow: 0 0 14px rgba(99,102,241,.7);
          }

          .status {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: rgba(255,255,255,.75);
          }

          .dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #22c55e;
            box-shadow: 0 0 0 0 rgba(34,197,94,.6);
            animation: pulse 1.4s infinite;
          }

          .dot.off {
            background: #ef4444;
            animation: none;
          }

          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(34,197,94,.6); }
            70% { box-shadow: 0 0 0 10px rgba(34,197,94,0); }
            100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
          }

          .phase-box {
            background: rgba(255,255,255,.08);
            border: 1px solid rgba(255,255,255,.14);
            border-radius: 14px;
            padding: 10px;
            font-size: 13px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .badge {
            background: linear-gradient(90deg, #22d3ee, #a78bfa);
            color: #061022;
            font-weight: 900;
            padding: 4px 10px;
            border-radius: 999px;
            font-size: 12px;
          }

          .nav {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .nav a {
            padding: 10px 12px;
            border-radius: 12px;
            color: rgba(255,255,255,.85);
            text-decoration: none;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all .15s ease;
          }

          .nav a:hover {
            background: rgba(255,255,255,.08);
          }

          .nav a.active {
            background: linear-gradient(90deg, rgba(99,102,241,.35), rgba(236,72,153,.35));
            color: #fff;
            box-shadow: inset 0 0 0 1px rgba(255,255,255,.18);
          }

          .section {
            margin-top: 12px;
            font-size: 12px;
            letter-spacing: .12em;
            text-transform: uppercase;
            color: rgba(255,255,255,.6);
          }

          .proctors {
            max-height: 220px;
            overflow-y: auto;
          }

          @media (max-width: 900px) {
            .sidebar {
              position: fixed;
              top: 0;
              left: 0;
              height: 100vh;
              transform: translateX(-100%);
              transition: transform .2s ease;
              z-index: 40;
            }

            .sidebar.open {
              transform: translateX(0);
            }

            .sidebar-toggle {
              display: block;
            }
          }
        `}</style>

        <div className="brand">COSS Jeopardy</div>

        <div className="status">
          <span className={`dot ${connected ? "" : "off"}`} />
          {connected ? "Connected" : "Disconnected"}
        </div>

        {game && (
          <div className="phase-box">
            <span>{game.state.phase}</span>
            <span className="badge">{game.state.seconds}s</span>
          </div>
        )}

        <div className="section">Game Master</div>
        <nav className="nav">
          <NavLink to="/controller">🎮 Controller</NavLink>
          <NavLink to="/teams">👥 Teams</NavLink>
          <NavLink to="/assign">🧭 Assignments</NavLink>
          <NavLink to="/leaderboard">🏆 Leaderboard</NavLink>
        </nav>

        <div className="section">Proctors</div>
        <nav className="nav proctors">
          {Array.from({ length: 8 }, (_, i) => (
            <NavLink key={i} to={`/proctor/p${i + 1}`}>
              🎧 Proctor {i + 1}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

/* ---------------- Layout (protected) ---------------- */

function AppLayout() {
  const { game } = useGame();

  if (!game) {
    return <div style={{ padding: 20 }}>Loading…</div>;
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
  );
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
  );
}
