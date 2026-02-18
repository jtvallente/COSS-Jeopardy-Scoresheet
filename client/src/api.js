// client/src/api.js
// Adds Game ID gate via x-game-id header + supports local dev + deployed setups.

const API = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function getGameId() {
  return localStorage.getItem("gameId") || "";
}

async function request(path, { method = "GET", body } = {}) {
    const headers = {
      "Content-Type": "application/json",
      "x-game-id": getGameId(),
      "Cache-Control": "no-cache",
    };
  
    const res = await fetch(`${API}${path}`, {
      method,
      headers,
      cache: "no-store",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  
    let json = null;
    try {
      json = await res.json();
    } catch {
      // if server returned html/text (proxy error, etc)
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      return null;
    }
  
    if (!res.ok || json?.ok === false) {
      throw new Error(json?.error || `Request failed (${res.status})`);
    }
  
    return json.game ?? json;
  }
  

async function post(path, body) {
  return request(path, { method: "POST", body });
}

export async function getGame() {
  // Your server may return the game directly or { ok:true, game }.
  // request() supports both.
  return request("/game");
}

// Teams
export const replaceTeams = (teams) => post("/teams/replace", { teams });
export const addTeams = (teams) => post("/teams/add", { teams });
export const importTeamsCSV = (csvText, mode = "add") =>
  post("/teams/import-csv", { csvText, mode });

// Controller state
export const updateState = (partial) => post("/state", partial);

// Auto-assign
export const autoAssign = () => post("/proctors/auto-assign");

// Assignments
export const assignProctor = (proctorId, teamIds) =>
  post("/proctors/assign", { proctorId, teamIds });

// Scoring
export const score = (proctorId, teamId, result) =>
  post("/score", { proctorId, teamId, result });

// Bets (DIFFICULT)
export const setBet = (proctorId, teamId, bet) =>
  post("/bets/set", { proctorId, teamId, bet });

// Tie-breaker
export const tbNewClue = () => post("/tiebreaker/new-clue");
export const tbOpen = (scoringOpen) => post("/tiebreaker/open", { scoringOpen });
export const tbCorrect = (proctorId, teamId) =>
  post("/tiebreaker/correct", { proctorId, teamId });
export const tbFinalize = () => post("/tiebreaker/finalize");
export const tbResolve = (teamId) => post("/tiebreaker/resolve", { teamId });

// Utility
export const resetGame = () => post("/game/reset");
export const undo = () => post("/undo");


export const saveSnapshot = () => post("/game/save");
export const loadSnapshot = () => post("/game/load");

export const raiseFlag = (proctorId, teamId) =>
  post('/flag', { proctorId, teamId })

export const tbStart = () => post('/tiebreaker/start');
