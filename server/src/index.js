// server/src/index.js
import 'dotenv/config'

import express from 'express'
import cors from 'cors'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import path from "path"
import { fileURLToPath } from "url"
import { createGamePersister } from "./persist.js"
import { startTieBreakerFromController } from './store.js'


import {
  store,
  snapshot,
  undo,
  resetGame,

  // teams
  replaceTeams,
  addTeams,

  // controller state
  updateGameState,

  // assignments + scoring
  assignTeamsToProctor,
  scoreByProctor,

  // bets (DIFFICULT)
  setBetByProctor,

  // tie-breaker
  startTieBreakerClue,
  openTieBreakerScoring,
  submitTieBreakerCorrect,
  finalizeTieBreaker,
  resolveTieBreakerWinner,

  // auto-assign
  autoAssignBySeatOrder,
} from './store.js'

const app = express()
app.use(cors())
app.use(express.json())

const GAME_ID = process.env.GAME_ID || 'JPD2026'
console.log('SERVER GAME_ID =', GAME_ID)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Save file lives on GM laptop here:
const SAVE_PATH = path.join(__dirname, "../data/game.snapshot.json");

const persister = createGamePersister({
  filePath: SAVE_PATH,
  getGame: () => store.game,
});

// Try load on boot:
(async () => {
  try {
    const loaded = await persister.load();
    if (loaded.ok) {
      store.game = loaded.game;
      console.log("[PERSIST] Loaded saved game from:", SAVE_PATH);
    } else {
      console.log("[PERSIST] No saved game loaded:", loaded.reason);
    }
  } catch (e) {
    console.error("[PERSIST] Load failed:", e);
  }
})();


// ---------------- Game ID gate (REST) ----------------
function requireGameId(req, res, next) {
  if (req.path === '/api/health') return next()

  const clientGameId = req.headers['x-game-id']
  if (!clientGameId || clientGameId !== GAME_ID) {
    return res.status(401).json({ ok: false, error: 'INVALID_GAME_ID' })
  }
  next()
}

app.get('/api/debug/gameid', (req, res) => {
  res.json({
    header: req.headers['x-game-id'] || null,
    serverGameId: GAME_ID,
    match: (req.headers['x-game-id'] || '') === GAME_ID,
  })
})

app.use(requireGameId)

// ---------------- Server + Socket ----------------
const server = http.createServer(app)
const io = new SocketIOServer(server, { cors: { origin: '*' } })

function broadcast(extraEvent = null) {
  // Always emit game update (existing behavior)
  io.emit("game:update", store.game);

  // Optionally emit a transient UI event
  if (extraEvent) {
    io.emit("game:event", extraEvent);
  }

  // Persist game state 
  persister.scheduleSave(200);
}



// Game ID gate (Socket)
io.use((socket, next) => {
  const gameId = socket.handshake.auth?.gameId
  if (!gameId || gameId !== GAME_ID) return next(new Error('INVALID_GAME_ID'))
  next()
})

io.on('connection', (socket) => {
  socket.emit('game:update', store.game)
})

// ---------------- Health ----------------
app.get('/api/health', (req, res) => res.json({ ok: true }))

// ---------------- Game ----------------
app.get('/api/game', (req, res) => res.json({ ok: true, game: store.game }))

app.get("/api/game/persist-status", (req, res) => {
  res.json({ ok: true, ...persister.getStatus() });
});

app.post("/api/game/save", async (req, res) => {
  try {
    await persister.saveNow();
    res.json({ ok: true, savedTo: persister.getStatus().filePath });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/api/game/load", async (req, res) => {
  try {
    const loaded = await persister.load();
    if (!loaded.ok) {
      return res.status(400).json({ ok: false, error: loaded.reason });
    }
    store.game = loaded.game;
    broadcast();
    res.json({ ok: true, game: store.game });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/game/reset', (req, res) => {
  resetGame()
  broadcast()
  res.json({ ok: true, game: store.game })
})

app.post('/api/undo', (req, res) => {
  const ok = undo()
  if (ok) broadcast()
  res.json({ ok, game: store.game })
})

// ---------------- Teams ----------------
app.post('/api/teams/replace', (req, res) => {
  const { teams } = req.body
  if (!Array.isArray(teams) || teams.length < 1) {
    return res.status(400).json({ ok: false, error: 'teams[] required' })
  }

  snapshot()
  try {
    replaceTeams(teams)
    broadcast()
    res.json({ ok: true, game: store.game })
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message })
  }
})

app.post('/api/teams/add', (req, res) => {
  const { teams } = req.body
  if (!Array.isArray(teams) || teams.length < 1) {
    return res.status(400).json({ ok: false, error: 'teams[] required' })
  }

  snapshot()
  try {
    addTeams(teams)
    broadcast()
    res.json({ ok: true, game: store.game })
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message })
  }
})

// Import teams from CSV text (1st column = name)
app.post('/api/teams/import-csv', (req, res) => {
  const { csvText, mode } = req.body
  if (typeof csvText !== 'string' || !csvText.trim()) {
    return res.status(400).json({ ok: false, error: 'csvText (string) required' })
  }

  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const names = lines.map((line) => line.split(',')[0]?.trim()).filter(Boolean)

  if (names.length === 0) {
    return res.status(400).json({ ok: false, error: 'No team names found in csvText.' })
  }

  snapshot()
  try {
    if (mode === 'replace') replaceTeams(names)
    else addTeams(names)

    broadcast()
    res.json({ ok: true, game: store.game, imported: names.length })
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message })
  }
})

// ---------------- Controller / State ----------------
app.post("/api/state", (req, res) => {
  try {
    snapshot(); // move inside try so it can't crash the route
    updateGameState(req.body);
    broadcast();
    res.json({ ok: true, game: store.game });
  } catch (e) {
    console.error("[STATE ERROR]", e);
    res.status(400).json({ ok: false, error: e.message });
  }
});



// ---------------- Proctors / Assignments ----------------
app.post('/api/proctors/auto-assign', (req, res) => {
  snapshot()
  try {
    autoAssignBySeatOrder()
    broadcast()
    res.json({ ok: true, game: store.game })
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message })
  }
})

app.post('/api/proctors/assign', (req, res) => {
  const { proctorId, teamIds } = req.body
  if (!proctorId || !Array.isArray(teamIds)) {
    return res.status(400).json({ ok: false, error: 'proctorId + teamIds[] required' })
  }

  snapshot()
  try {
    assignTeamsToProctor(proctorId, teamIds)
    broadcast()
    res.json({ ok: true, game: store.game })
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message })
  }
})

// ---------------- Scoring ----------------
app.post('/api/score', (req, res) => {
  const { proctorId, teamId, result } = req.body
  if (!proctorId || !teamId || !result) {
    return res.status(400).json({ ok: false, error: 'proctorId + teamId + result required' })
  }

  snapshot()
  try {
    scoreByProctor({ proctorId, teamId, result })
    broadcast()
    res.json({ ok: true, game: store.game })
  } catch (e) {
    res.status(403).json({ ok: false, error: e.message })
  }
})

// ---------------- Bets (DIFFICULT) ----------------
app.post('/api/bets/set', (req, res) => {
  const { proctorId, teamId } = req.body
  const bet = Number(req.body.bet)

  if (!proctorId || !teamId || !Number.isFinite(bet)) {
    return res.status(400).json({
      ok: false,
      error: 'proctorId + teamId + bet(number) required',
    })
  }

  snapshot()
  try {
    setBetByProctor({ proctorId, teamId, bet })
    broadcast()
    res.json({ ok: true, game: store.game })
  } catch (e) {
    res.status(403).json({ ok: false, error: e.message })
  }
})

// ---------------- Tie-breaker ----------------

function assertTieBreakerAllowed() {
  // Final must be completed (set this when DIFFICULT clue 5 is closed)
  if (!store.game.state?.postFinal) {
    const err = new Error('Final round not completed yet.')
    err.status = 400
    throw err
  }

  // Must have top-score tie
  if (!store.game.clincher?.needed || !(store.game.clincher?.tiedTeamIds || []).length) {
    const err = new Error('No tie for highest score. Tie-break not allowed.')
    err.status = 400
    throw err
  }
}

app.post('/api/tiebreaker/new-clue', (req, res) => {
  snapshot()
  try {
    assertTieBreakerAllowed()

    startTieBreakerClue()
    broadcast()
    res.json({ ok: true, game: store.game })
  } catch (e) {
    res.status(e.status || 400).json({ ok: false, error: e.message })
  }
})


app.post('/api/tiebreaker/open', (req, res) => {
  const { scoringOpen } = req.body
  if (typeof scoringOpen !== 'boolean') {
    return res.status(400).json({ ok: false, error: 'scoringOpen(boolean) required' })
  }

  snapshot()
  try {
    assertTieBreakerAllowed() // optional safety
    openTieBreakerScoring(scoringOpen)
    broadcast()
    res.json({ ok: true, game: store.game })
  } catch (e) {
    res.status(e.status || 400).json({ ok: false, error: e.message })
  }
})

app.post('/api/tiebreaker/correct', (req, res) => {
  const { proctorId, teamId } = req.body
  if (!proctorId || !teamId) {
    return res.status(400).json({ ok: false, error: 'proctorId + teamId required' })
  }

  snapshot()
  try {
    assertTieBreakerAllowed() // optional safety
    submitTieBreakerCorrect({ proctorId, teamId })
    broadcast()
    res.json({ ok: true, game: store.game })
  } catch (e) {
    res.status(e.status || 400).json({ ok: false, error: e.message })
  }
})

app.post('/api/tiebreaker/finalize', (req, res) => {
  snapshot()
  try {
    assertTieBreakerAllowed() // optional safety
    const result = finalizeTieBreaker()
    broadcast()
    res.json({ ok: true, game: store.game, result })
  } catch (e) {
    res.status(e.status || 400).json({ ok: false, error: e.message })
  }
})

app.post('/api/tiebreaker/resolve', (req, res) => {
  const { teamId } = req.body
  if (!teamId) {
    return res.status(400).json({ ok: false, error: 'teamId required' })
  }

  snapshot()
  try {
    assertTieBreakerAllowed() // optional safety
    resolveTieBreakerWinner(teamId)
    broadcast()
    res.json({ ok: true, game: store.game })
  } catch (e) {
    res.status(e.status || 400).json({ ok: false, error: e.message })
  }
})

app.post("/api/flag", (req, res) => {
  const { proctorId, teamId } = req.body;
  if (!proctorId || !teamId) {
    return res.status(400).json({ ok: false, error: "proctorId and teamId required" });
  }

  io.emit("game:event", {
    type: "FLAG_RAISED",
    ts: Date.now(),
    proctorId,
    teamId,
    phase: store.game.state.phase,
    roundLabel: store.game.state.roundLabel,
    clueNumber: store.game.state.clueNumber,
  });

  res.json({ ok: true });
});

app.post('/api/tiebreaker/start', (req, res) => {
  snapshot()
  try {
    startTieBreakerFromController()
    broadcast()
    res.json({ ok: true, game: store.game })
  } catch (e) {
    console.error('[TB START ERROR]', e)
    res.status(400).json({ ok: false, error: e.message })
  }
})


// ---------------- Start ----------------
const PORT = process.env.PORT || 4000
server.listen(PORT, '0.0.0.0', () => {
  console.log(`API running on http://0.0.0.0:${PORT}`)
})
