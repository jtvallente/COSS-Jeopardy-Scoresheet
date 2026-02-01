import { useContext } from "react";
import { GameCtx } from "./GameContext";

export function useGame() {
  const ctx = useContext(GameCtx);
  if (!ctx) {
    throw new Error("useGame must be used inside GameProvider");
  }
  return ctx;
}
