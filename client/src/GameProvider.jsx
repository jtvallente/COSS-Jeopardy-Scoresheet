import { useEffect, useMemo, useState } from "react";
import { socket } from "./socket";
import { getGame } from "./api";
import { GameCtx } from "./GameContext";

export function GameProvider({ children }) {
  const [game, setGame] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    getGame().then(setGame);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onUpdate = (data) => setGame(data);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("game:update", onUpdate);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("game:update", onUpdate);
    };
  }, []);

  const value = useMemo(
    () => ({ game, connected }),
    [game, connected]
  );

  return (
    <GameCtx.Provider value={value}>
      {children}
    </GameCtx.Provider>
  );
}
