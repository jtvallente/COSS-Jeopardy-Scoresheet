import { useEffect, useMemo, useState } from "react";
import { socket } from "./socket";
import { getGame } from "./api";
import { GameCtx } from "./GameContext";

export function GameProvider({ children }) {
  const [game, setGame] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);

  useEffect(() => {
    getGame().then(setGame);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onUpdate = (data) => setGame(data);

    // NEW: transient UI-only events (flags, etc.)
    const onEvent = (evt) => setLastEvent(evt);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("game:update", onUpdate);
    socket.on("game:event", onEvent);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("game:update", onUpdate);
      socket.off("game:event", onEvent);
    };
  }, []);

  const value = useMemo(
    () => ({ game, connected, lastEvent }),
    [game, connected, lastEvent]
  );

  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}
