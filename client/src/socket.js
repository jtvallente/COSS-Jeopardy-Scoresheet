// client/src/socket.js
import { io } from "socket.io-client";

function getGameId() {
  return localStorage.getItem("gameId") || "";
}

// In dev, your socket server is on 4000.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  auth: { gameId: getGameId() },
  autoConnect: true,
});
