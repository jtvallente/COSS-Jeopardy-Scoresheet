// server/src/index.js
import 'dotenv/config'

import express from 'express'
import cors from 'cors'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'

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

function broadcast() {
  io.emit('game:update', store.game)
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
app.post('/api/state', (req, res) => {
  snapshot()
  try {
    updateGameState(req.body || {})
    broadcast()
    res.json({ ok: true, game: store.game })
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message })
  }
})

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
app.post('/api/tiebreaker/new-clue', (req, res) => {
  snapshot()
  try {
    startTieBreakerClue()
    broadcast()
    res.json({ ok: true, game: store.game })
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message })
  }
})

app.post('/api/tiebreaker/open', (req, res) => {
  const { scoringOpen } = req.body
  if (typeof scoringOpen !== 'boolean') {
    return res.status(400).json({ ok: false, error: 'scoringOpen(boolean) required' })
  }

  snapshot()
  try {
    openTieBreakerScoring(scoringOpen)
    broadcast()
    res.json({ ok: true, game: store.game })
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message })
  }
})

app.post('/api/tiebreaker/correct', (req, res) => {
  const { proctorId, teamId } = req.body
  if (!proctorId || !teamId) {
    return res.status(400).json({ ok: false, error: 'proctorId + teamId required' })
  }

  snapshot()
  try {
    submitTieBreakerCorrect({ proctorId, teamId })
    broadcast()
    res.json({ ok: true, game: store.game })
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message })
  }
})

app.post('/api/tiebreaker/finalize', (req, res) => {
  snapshot()
  try {
    const result = finalizeTieBreaker()
    broadcast()
    res.json({ ok: true, game: store.game, result })
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message })
  }
})

app.post('/api/tiebreaker/resolve', (req, res) => {
  const { teamId } = req.body
  if (!teamId) {
    return res.status(400).json({ ok: false, error: 'teamId required' })
  }

  snapshot()
  try {
    resolveTieBreakerWinner(teamId)
    broadcast()
    res.json({ ok: true, game: store.game })
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message })
  }
})

// ---------------- Start ----------------
const PORT = process.env.PORT || 4000
server.listen(PORT, '0.0.0.0', () => {
  console.log(`API running on http://0.0.0.0:${PORT}`)
})
