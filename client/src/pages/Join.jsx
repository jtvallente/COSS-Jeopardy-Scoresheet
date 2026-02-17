// client/src/pages/Join.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { socket } from '../socket'

// GitHub-like Join screen (mobile friendly)
// Validates Game ID via GET /api/game using x-game-id header.

export default function Join() {
  const [gameId, setGameId] = useState(localStorage.getItem('gameId') || '')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  const apiBase = useMemo(
    () => import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
    []
  )

  useEffect(() => {
    if (err) setErr('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId])

  async function submit(e) {
    e.preventDefault()
    setErr('')

    const code = gameId.trim()
    if (!code) {
      setErr('Enter the Game ID to join.')
      return
    }

    setBusy(true)

    try {
      const res = await fetch(`${apiBase}/game`, {
        headers: { 'x-game-id': code },
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'INVALID_GAME_ID')
      }

      localStorage.setItem('gameId', code)

      socket.auth = { gameId: code }
      socket.disconnect()
      socket.connect()

      navigate('/controller', { replace: true })
    } catch {
      setErr('Invalid Game ID. Ask the Game Master for the correct code.')
      localStorage.removeItem('gameId')
    } finally {
      setBusy(false)
    }
  }

  const normalized = gameId.toUpperCase()

  return (
    <div className="gh-join">
      <style>{`
        /* Page */
        .gh-join{
          min-height:100vh;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:18px;
          background:#0d1117; /* GitHub dark */
          color:#c9d1d9;
        }

        /* Container */
        .gh-wrap{
          width:100%;
          max-width:420px;
        }

        /* Title */
        .gh-brand{
          display:flex;
          align-items:center;
          justify-content:center;
          gap:10px;
          margin-bottom:14px;
          color:#e6edf3;
          font-weight:900;
          letter-spacing:.02em;
        }
        .gh-logo{
          width:38px;height:38px;border-radius:12px;
          background:#161b22;
          border:1px solid #30363d;
          display:grid;
          place-items:center;
          box-shadow: 0 10px 26px rgba(0,0,0,.35);
          font-size:18px;
        }
        .gh-title{
          text-align:center;
          margin: 0 0 10px;
          font-size:20px;
          font-weight:900;
          color:#e6edf3;
        }
        .gh-sub{
          text-align:center;
          margin: 0 0 16px;
          font-size:13px;
          line-height:1.4;
          color:#8b949e;
        }

        /* Card */
        .gh-card{
          background:#161b22;
          border:1px solid #30363d;
          border-radius:12px;
          padding:16px;
          box-shadow: 0 12px 34px rgba(0,0,0,.35);
        }

        /* Label + input */
        .gh-label{
          display:block;
          font-size:12px;
          font-weight:800;
          color:#c9d1d9;
          margin-bottom:8px;
        }

        .gh-input{
          width:93%;
          height:44px;
          border-radius:10px;
          border:1px solid #30363d;
          background:#0d1117;
          color:#e6edf3;
          padding: 0 12px;
          outline:none;
          font-size:14px;
          font-weight:800;
          letter-spacing:.12em;
          text-transform:uppercase;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,.25);
        }
        .gh-input::placeholder{
          color:#6e7681;
          letter-spacing:.08em;
          font-weight:700;
        }
        .gh-input:focus{
          border-color:#1f6feb;
          box-shadow: 0 0 0 3px rgba(31,111,235,.25);
        }

        /* Help row */
        .gh-row{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
          margin-top:10px;
          font-size:12px;
          color:#8b949e;
        }
        .gh-pill{
          display:inline-flex;
          align-items:center;
          gap:8px;
          padding:6px 10px;
          border:1px solid #30363d;
          background:#0d1117;
          border-radius:999px;
          color:#8b949e;
          font-weight:700;
          white-space:nowrap;
        }
        .dot{
          width:8px;height:8px;border-radius:99px;
          background:${busy ? '#f85149' : '#0425e0'};
          box-shadow: 0 0 0 2px rgba(0,0,0,.25);
        }

        /* Error */
        .gh-error{
          margin-top:12px;
          border-radius:10px;
          padding:10px 12px;
          border:1px solid rgba(248,81,73,.55);
          background: rgba(248,81,73,.12);
          color:#ffdcd7;
          font-weight:800;
          font-size:12.5px;
          line-height:1.3;
        }

        /* Button */
        .gh-btn{
          width:100%;
          margin-top:12px;
          height:44px;
          border-radius:10px;
          border:1px solid rgba(240,246,252,.10);
          background:#0425e0; /* GitHub green */
          color:#fff;
          font-weight:900;
          font-size:14px;
          letter-spacing:.02em;
          cursor:pointer;
          transition: filter .15s ease, transform .05s ease;
          touch-action: manipulation;
        }
        .gh-btn:hover{ filter: brightness(1.05); }
        .gh-btn:active{ transform: translateY(1px); }
        .gh-btn:disabled{
          opacity:.65;
          cursor:not-allowed;
          filter: grayscale(.2);
        }

        /* Footer note */
        .gh-foot{
          margin-top:12px;
          text-align:center;
          font-size:12px;
          color:#8b949e;
          line-height:1.35;
        }
        .kbd{
          display:inline-block;
          padding:1px 7px;
          border-radius:6px;
          border:1px solid #30363d;
          background:#0d1117;
          color:#c9d1d9;
          font-weight:900;
          letter-spacing:.06em;
          font-size:11px;
        }

        /* Mobile tweaks */
        @media (max-width: 420px){
          .gh-card{ padding:14px; }
          .gh-title{ font-size:19px; }
        }

        .brand-stack{
  margin-top: 14px;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:10px;
}

.brand-logo{
  width:72px;
  height:72px;
  object-fit:contain;
  border-radius:50px;
  background:#0b102a;
  padding:8px;
  box-shadow:
    0 14px 30px rgba(0,0,0,.55),
    0 0 0 1px rgba(255,255,255,.12);
}

.brand-title{
  font-size:22px;
  font-weight:1000;
  letter-spacing:.14em;
  text-transform:uppercase;
  color:#fff;
  text-shadow:0 6px 22px rgba(0,0,0,.6);
}

@media (max-width: 420px){
  .brand-logo{ width:64px; height:64px; }
  .brand-title{ font-size:20px; }
}

.join-top{
  position:relative;
  display:flex;
  justify-content:center; /* or center if you want */
  margin-bottom:20px;
  margin-top: 20px
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
  background:#111827; /* solid, no transparency */
  box-shadow: 0 10px 20px rgba(0,0,0,.25);
}

.pulse-dot{
  width:10px;height:10px;border-radius:99px;
  background:#0425e0;
  box-shadow: 0 0 0 0 rgba(34,197,94,.55);
  animation:pulse 1.4s infinite;
}



      `}</style>

      <div className="gh-wrap">
        

        {/* LOGO + TITLE */}
        <div className="brand-stack">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-D9hy5MEseYSh7JJCVH-9C3DFFSVDMubJ4w&s"
            alt="COSS Logo"
            className="brand-logo"
          />
          <div className="brand-title">COSS JEOPARDY</div>
        </div>

        <div className="join-top">
          <div className="show-badge">
            <span className="pulse-dot" />
            LIVE SCOREBOARD
          </div>
        </div>
        <p className="gh-sub">
          Enter the Game ID from the Game Master to join.
          <br />
          Tip: keep your phone awake while scoring.
        </p>

        <div className="gh-card">
          <form onSubmit={submit}>
            <label className="gh-label" htmlFor="gameId">
              Game ID
            </label>

            <input
              id="gameId"
              className="gh-input"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              placeholder="ABC1234"
              autoCapitalize="characters"
              autoCorrect="off"
              inputMode="text"
              disabled={busy}
            />

            <div className="gh-row">
              <span>
                Preview: <span className="kbd">{normalized || '—'}</span>
              </span>
              <span className="gh-pill">
                <span className="dot" />
                {busy ? 'Checking…' : 'Ready'}
              </span>
            </div>

            {err && <div className="gh-error">{err}</div>}

            <button className="gh-btn" disabled={busy}>
              {busy ? 'Checking…' : 'Join'}
            </button>
          </form>
        </div>

        <div className="gh-foot">
          If you get kicked out, reopen the link and enter the code again.
          <br />
          Press <span className="kbd">Join</span> after typing the code.
        </div>
      </div>
    </div>
  )
}
