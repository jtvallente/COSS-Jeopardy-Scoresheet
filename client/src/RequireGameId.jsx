import { Navigate, useLocation } from "react-router-dom";

export default function RequireGameId({ children }) {
  const gameId = localStorage.getItem("gameId");
  const loc = useLocation();

  if (!gameId) {
    return <Navigate to="/join" replace state={{ from: loc.pathname }} />;
  }

  return children;
}
