// client/src/pages/Join.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";

// Game-show Join screen (mobile friendly)
// Validates Game ID via GET /api/game using x-game-id header.

export default function Join() {
  const [gameId, setGameId] = useState(localStorage.getItem("gameId") || "");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const apiBase = useMemo(
    () => import.meta.env.VITE_API_URL || "http://localhost:4000/api",
    []
  );

  useEffect(() => {
    // nice UX: clear error when user types again
    if (err) setErr("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  async function submit(e) {
    e.preventDefault();
    setErr("");

    const code = gameId.trim();
    if (!code) {
      setErr("Enter the Game ID to join.");
      return;
    }

    setBusy(true);

    try {
      const res = await fetch(`${apiBase}/game`, {
        headers: { "x-game-id": code },
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "INVALID_GAME_ID");
      }

      localStorage.setItem("gameId", code);

      socket.auth = { gameId: code };
      socket.disconnect();
      socket.connect();

      navigate("/controller", { replace: true });
    } catch {
      setErr("Invalid Game ID. Ask the Game Master for the correct code.");
      localStorage.removeItem("gameId");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="join-root">
      {/* Inline CSS for this page only (no need to touch ui.css) */}
      <style>{`
        .join-root{
          min-height:100vh;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:18px;
          background:
            radial-gradient(1200px 600px at 20% 15%, rgba(99,102,241,.35), transparent 55%),
            radial-gradient(900px 500px at 80% 25%, rgba(236,72,153,.28), transparent 60%),
            radial-gradient(900px 500px at 50% 95%, rgba(34,211,238,.18), transparent 55%),
            linear-gradient(180deg, #050714, #070a1f 45%, #040514);
          color:#fff;
        }
        .join-card{
          width:100%;
          max-width:460px;
          border-radius:22px;
          padding:18px;
          border:1px solid rgba(255,255,255,.14);
          background: rgba(10, 14, 38, .65);
          backdrop-filter: blur(10px);
          box-shadow:
            0 24px 70px rgba(0,0,0,.55),
            0 0 0 1px rgba(255,255,255,.06) inset;
          position:relative;
          overflow:hidden;
        }
        .join-card:before{
          content:"";
          position:absolute;
          inset:-2px;
          background:
            radial-gradient(500px 160px at 10% 10%, rgba(99,102,241,.25), transparent 60%),
            radial-gradient(420px 160px at 90% 15%, rgba(236,72,153,.20), transparent 60%),
            radial-gradient(520px 220px at 50% 120%, rgba(34,211,238,.16), transparent 65%);
          pointer-events:none;
          filter: blur(0px);
        }
        .join-top{
          position:relative;
          display:flex;
          gap:12px;
          align-items:center;
          justify-content:space-between;
          margin-bottom:10px;
        }
        .show-badge{
          display:inline-flex;
          align-items:center;
          gap:8px;
          padding:8px 12px;
          border-radius:999px;
          font-weight:800;
          letter-spacing:.12em;
          text-transform:uppercase;
          font-size:12px;
          border:1px solid rgba(255,255,255,.16);
          background: rgba(255,255,255,.08);
          box-shadow: 0 10px 20px rgba(0,0,0,.25);
        }
        .pulse-dot{
          width:10px;height:10px;border-radius:99px;
          background: #22c55e;
          box-shadow: 0 0 0 0 rgba(34,197,94,.55);
          animation: pulse 1.4s infinite;
        }
        @keyframes pulse{
          0%{ box-shadow: 0 0 0 0 rgba(34,197,94,.55); }
          70%{ box-shadow: 0 0 0 10px rgba(34,197,94,0); }
          100%{ box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }
        .join-title{
          position:relative;
          font-size:30px;
          font-weight:1000;
          line-height:1.05;
          margin:6px 0 4px;
          text-shadow: 0 8px 30px rgba(0,0,0,.55);
          letter-spacing:-.02em;
        }
        .join-sub{
          position:relative;
          color: rgba(255,255,255,.78);
          line-height:1.35;
          margin: 0 0 14px;
          font-size:14px;
        }
        .join-form{
          position:relative;
          display:grid;
          gap:10px;
        }
        .join-input{
          height:56px;
          border-radius:16px;
          border:1px solid rgba(255,255,255,.18);
          background: rgba(255,255,255,.07);
          color:#fff;
          padding: 0 16px;
          font-size:18px;
          font-weight:800;
          letter-spacing:.08em;
          text-transform:uppercase;
          outline:none;
          box-shadow: 0 10px 22px rgba(0,0,0,.25);
        }
        .join-input::placeholder{
          color: rgba(255,255,255,.45);
          letter-spacing:.06em;
          text-transform:none;
          font-weight:700;
        }
        .join-input:focus{
          border-color: rgba(34,211,238,.6);
          box-shadow: 0 0 0 4px rgba(34,211,238,.15), 0 10px 22px rgba(0,0,0,.25);
        }
        .hint-row{
          display:flex;
          justify-content:space-between;
          gap:10px;
          font-size:12px;
          color: rgba(255,255,255,.65);
          padding: 0 4px;
        }
        .error-banner{
          border-radius:14px;
          padding:12px 12px;
          border:1px solid rgba(248,113,113,.35);
          background: rgba(220,38,38,.18);
          color:#ffecec;
          font-weight:800;
          line-height:1.25;
        }
        .join-btn{
          height:56px;
          border-radius:16px;
          border: none;
          cursor:pointer;
          font-weight:1000;
          font-size:18px;
          letter-spacing:.02em;
          color:#061022;
          background: linear-gradient(90deg, #22d3ee, #a78bfa 45%, #fb7185);
          box-shadow: 0 14px 28px rgba(0,0,0,.35);
          transition: transform .06s ease, filter .2s ease;
          touch-action: manipulation;
        }
        .join-btn:active{
          transform: translateY(1px) scale(.99);
        }
        .join-btn:disabled{
          cursor:not-allowed;
          filter: grayscale(.2) brightness(.9);
          opacity:.85;
        }
        .footer-note{
          margin-top:12px;
          color: rgba(255,255,255,.62);
          font-size:12px;
          line-height:1.35;
          text-align:center;
        }
        .kbd{
          display:inline-block;
          padding:2px 8px;
          border-radius:999px;
          border:1px solid rgba(255,255,255,.18);
          background: rgba(255,255,255,.07);
          color: rgba(255,255,255,.8);
          font-weight:900;
          letter-spacing:.06em;
        }

        /* Mobile tightening */
        @media (max-width: 420px){
          .join-card{ padding:16px; border-radius:20px; }
          .join-title{ font-size:26px; }
          .join-input, .join-btn{ height:54px; font-size:17px; }
        }
      `}</style>

      <div className="join-card">
        <div className="join-top">
          <div className="show-badge">
            <span className="pulse-dot" />
            LIVE SCOREBOARD
          </div>
          <div className="show-badge" style={{ letterSpacing: ".08em" }}>
            COSS JEOPARDY
          </div>
        </div>

        <div className="join-title">Enter the Game Code</div>
        <div className="join-sub">
          Ask the Game Master for the code, then press <span className="kbd">JOIN</span>.
          <br />
          Pro tip: keep your phone screen awake during the round.
        </div>

        <form className="join-form" onSubmit={submit}>
          <input
            className="join-input"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            placeholder="JPD2026"
            autoCapitalize="characters"
            autoCorrect="off"
            inputMode="text"
            disabled={busy}
          />

          <div className="hint-row">
            <span>Example: <b>JPD2026</b></span>
            <span>{busy ? "Checking code…" : "Ready"}</span>
          </div>

          {err && <div className="error-banner">{err}</div>}

          <button className="join-btn" disabled={busy}>
            {busy ? "CHECKING…" : "JOIN THE GAME"}
          </button>
        </form>

        <div className="footer-note">
          If you get kicked out, just reopen the link and enter the code again.
        </div>
      </div>
    </div>
  );
}
