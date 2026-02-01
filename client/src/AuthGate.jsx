import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export default function AuthGate({ children }) {
  const [status, setStatus] = useState("checking"); // checking | ok | bad

  useEffect(() => {
    const gameId = localStorage.getItem("gameId") || "";

    // no code at all -> go join
    if (!gameId) {
      setTimeout(() => setStatus("bad"), 0);
      return;
    }

    // validate with server
    (async () => {
      try {
        const res = await fetch(`${API}/game`, {
          headers: { "x-game-id": gameId },
        });
        const json = await res.json();

        if (res.ok && json.ok) {
          setStatus("ok");
        } else {
          localStorage.removeItem("gameId");
          setStatus("bad");
        }
      } catch {
        // if server unreachable, treat as bad for now
        localStorage.removeItem("gameId");
        setStatus("bad");
      }
    })();
  }, []);

  if (status === "checking") {
    return <div style={{ padding: 20 }}>Checking Game ID…</div>;
  }

  if (status === "bad") {
    return <Navigate to="/join" replace />;
  }

  return children;
}
