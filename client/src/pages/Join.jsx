// client/src/pages/Join.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";

// IMPORTANT:
// This Join page VALIDATES the Game ID against the server BEFORE letting you in.
// It expects your server GET /api/game to return { ok: true, game: {...} } on success,
// and { ok: false, error: "INVALID_GAME_ID" } (401) on failure.

export default function Join() {
  const [gameId, setGameId] = useState(localStorage.getItem("gameId") || "");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setErr("");

    const code = gameId.trim();
    if (!code) {
      setErr("Enter the Game ID.");
      return;
    }

    setBusy(true);

    try {
      // ✅ Validate against the server using the same header your app uses everywhere
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
      const res = await fetch(`${apiBase}/game`, {
        headers: { "x-game-id": code },
      });

      const json = await res.json().catch(() => ({}));

      // Server should reply { ok:false, error:"INVALID_GAME_ID" } for wrong code
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "INVALID_GAME_ID");
      }

      // ✅ Only store if valid
      localStorage.setItem("gameId", code);

      // ✅ Reconnect socket with correct auth
      socket.auth = { gameId: code };
      socket.disconnect();
      socket.connect();

      navigate("/controller", { replace: true });
    } catch {
      // Clean message for users
      setErr("Invalid Game ID. Ask the Game Master for the correct code.");
      // Optional: clear stored wrong value
      localStorage.removeItem("gameId");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: 420 }}>
        <div className="h1">Enter Game ID</div>
        <div className="muted" style={{ marginTop: 6 }}>
          Ask the Game Master for the code.
        </div>

        <form onSubmit={submit} style={{ marginTop: 12 }}>
          <input
            className="input"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            placeholder="e.g. JPD2026"
            disabled={busy}
          />

          {err && (
            <div style={{ color: "#dc2626", marginTop: 8, fontWeight: 600 }}>
              {err}
            </div>
          )}

          <button className="btn" style={{ marginTop: 12, width: "100%" }} disabled={busy}>
            {busy ? "Checking..." : "Join"}
          </button>
        </form>
      </div>
    </div>
  );
}
