// server/src/store.js
// Jeopardy 2026 internal scoresheet store (in-memory).
// Matches the mechanics PDF: Easy, Average, Difficult (bets), Jackpot, Tie-breaker.

const PHASES = {
  EASY: 'EASY', // JEOPARDY!
  AVERAGE: 'AVERAGE', // DOUBLE JEOPARDY!
  DIFFICULT: 'DIFFICULT', // FINAL JEOPARDY! (bets)
  JACKPOT: 'JACKPOT', // Jackpot Jeopardy!
  TIE_BREAKER: 'TIE_BREAKER', // Clincher
}

const ROUND_PRESETS = {
  [PHASES.EASY]: { seconds: 10, allowedValues: [100, 200, 300, 400] },
  [PHASES.AVERAGE]: { seconds: 15, allowedValues: [200, 400, 600, 800] },
  [PHASES.DIFFICULT]: { seconds: 30, allowedValues: [] }, // values are bets
  [PHASES.JACKPOT]: { seconds: 30, allowedValues: [] }, // can be custom
  [PHASES.TIE_BREAKER]: { seconds: 30, allowedValues: [] },
}

const TIE_BUFFER_MS = 400 // adjust (300–800ms works well)

function makeProctors() {
  return Array.from({ length: 8 }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Proctor ${i + 1}`,
    teamIds: [], // max 5 teams
  }))
}

export const store = {
  game: makeInitialGame(),
  undoStack: [],
}

function makeInitialGame() {
  return {
    id: 'local-game',

    // Controlled by Game Master (Controller module)
    state: {
      phase: PHASES.EASY,
      roundLabel: 'VIDEO GAMES', // for your tabs/sections (optional, UI)
      clueNumber: 1,
      clueValue: 100, // used in EASY/AVERAGE
      scoringOpen: true,
      seconds: ROUND_PRESETS[PHASES.EASY].seconds,
      betsOpen: false,
    },

    tieBreaker: {
      clueId: 1, // increments each tie-breaker clue
      scoringOpen: false, // controlled by GM when in TIE_BREAKER
      submissions: [], // { teamId, proctorId, ts }
      winnerTeamId: null,
      conflict: false,
      bufferEndsAt: null, // timestamp (ms) when buffer window ends
    },

    // Teams module
    teams: [], // { id, name, score, eliminated:boolean }

    // 8 Proctors module + assignments
    proctors: makeProctors(),

    // Bets for DIFFICULT round (teamId -> bet for current clue)
    bets: {},

    // Computed helpers
    leaderboard: [], // derived from teams
    clincher: {
      needed: false,
      tiedTeamIds: [],
    },
  }
}

/* ---------------- Undo / Reset ---------------- */

export function snapshot() {
  const snap = JSON.parse(JSON.stringify(store.game))
  store.undoStack.push(snap)
  if (store.undoStack.length > 200) store.undoStack.shift()
}

export function undo() {
  const prev = store.undoStack.pop()
  if (!prev) return false
  store.game = prev
  return true
}

export function resetGame() {
  store.game = makeInitialGame()
  store.undoStack = []
}

/* ---------------- Helpers ---------------- */

function getTeam(teamId) {
  return store.game.teams.find((t) => t.id === teamId) || null
}

function getProctor(proctorId) {
  return store.game.proctors.find((p) => p.id === proctorId) || null
}

function recomputeDerived() {
  // Leaderboard: descending by score
  store.game.leaderboard = [...store.game.teams]
    .sort((a, b) => b.score - a.score)
    .map((t) => ({
      id: t.id,
      name: t.name,
      score: t.score,
      eliminated: t.eliminated,
    }))

  // Clincher detection: tie for highest score
  const activeTeams = store.game.teams.filter((t) => !t.eliminated)
  if (activeTeams.length === 0) {
    store.game.clincher = { needed: false, tiedTeamIds: [] }
    return
  }
  let max = activeTeams[0].score
  for (const t of activeTeams) if (t.score > max) max = t.score

  const tied = activeTeams.filter((t) => t.score === max).map((t) => t.id)
  store.game.clincher = { needed: tied.length > 1, tiedTeamIds: tied }
}

function setPhase(phase) {
  const preset = ROUND_PRESETS[phase]
  if (!preset) throw new Error('Invalid phase.')

  store.game.state.phase = phase
  store.game.state.seconds = preset.seconds

  // Default clueValue for phases that use fixed values
  if (phase === PHASES.EASY) store.game.state.clueValue = 100
  if (phase === PHASES.AVERAGE) store.game.state.clueValue = 200

  // Clear bets when leaving DIFFICULT
  if (phase !== PHASES.DIFFICULT) store.game.bets = {}

  // lock bets unless DIFFICULT
  store.game.state.betsOpen = false

  // optional: when entering DIFFICULT, close scoring until bets are collected
  if (phase === PHASES.DIFFICULT) {
    store.game.state.scoringOpen = false
    store.game.bets = {}
  }

  recomputeDerived()
}

/* ---------------- Teams module ---------------- */

export function replaceTeams(teamNames) {
    const cleaned = teamNames
      .map((s) => String(s ?? '').trim())
      .filter(Boolean)
  
    if (cleaned.length > 40) throw new Error('Max 40 teams only.')
  
    store.game.teams = cleaned.map((name, i) => ({
      id: `t${i + 1}`,
      name,
      score: 0,
      eliminated: false,
    }))
  
    // Clear assignments when replacing teams
    store.game.proctors.forEach((p) => (p.teamIds = []))
    store.game.bets = {}
    recomputeDerived()
  }
  

export function addTeams(teamNames) {
  const start = store.game.teams.length
  const newTeams = teamNames
    .map((s) => String(s ?? '').trim())
    .filter(Boolean)
    .map((name, i) => ({
      id: `t${start + i + 1}`,
      name,
      score: 0,
      eliminated: false,
    }))

  if (store.game.teams.length + newTeams.length > 40) {
    throw new Error('Max 40 teams only.')
  }

  store.game.teams.push(...newTeams)
  recomputeDerived()
}

/* ---------------- Proctor assignments ---------------- */

export function assignTeamsToProctor(proctorId, teamIds) {
  const p = getProctor(proctorId)
  if (!p) throw new Error('Invalid proctor.')

  if (!Array.isArray(teamIds)) throw new Error('teamIds must be an array.')
  if (teamIds.length > 5) throw new Error('Max 5 teams per proctor.')

  // Prevent duplicate team assignment across proctors (recommended)
  for (const other of store.game.proctors) {
    if (other.id === proctorId) continue
    const overlap = other.teamIds.filter((id) => teamIds.includes(id))
    if (overlap.length)
      throw new Error('A team is already assigned to another proctor.')
  }

  // Validate teams exist
  for (const id of teamIds) {
    if (!getTeam(id)) throw new Error(`Unknown team id: ${id}`)
  }

  p.teamIds = teamIds
}

/* ---------------- Controller module (game state) ---------------- */

export function updateGameState(partial) {
  const s = store.game.state

  // phase change via updateGameState({ phase: "AVERAGE" })
  if (partial.phase && partial.phase !== s.phase) {
    setPhase(partial.phase)
  }

  if (typeof partial.roundLabel === 'string') s.roundLabel = partial.roundLabel
  if (typeof partial.clueNumber === 'number' && partial.clueNumber >= 1)
    s.clueNumber = partial.clueNumber

  if (typeof partial.scoringOpen === 'boolean')
    s.scoringOpen = partial.scoringOpen

  // clueValue only meaningful for EASY/AVERAGE
  if (typeof partial.clueValue === 'number') {
    const phase = s.phase
    const allowed = ROUND_PRESETS[phase]?.allowedValues ?? []
    if (allowed.length && !allowed.includes(partial.clueValue)) {
      throw new Error(
        `Invalid clueValue for ${phase}. Allowed: ${allowed.join(', ')}`
      )
    }
    s.clueValue = partial.clueValue
  }

  if (typeof partial.betsOpen === 'boolean') {
    // only meaningful in DIFFICULT
    if (store.game.state.phase !== PHASES.DIFFICULT && partial.betsOpen) {
      throw new Error('betsOpen can only be enabled in DIFFICULT phase.')
    }
    store.game.state.betsOpen = partial.betsOpen
  }

  recomputeDerived()
}

/* ---------------- Difficult (bets) ---------------- */

export function setBetByProctor({ proctorId, teamId, bet }) {
  const s = store.game.state

  if (s.phase !== PHASES.DIFFICULT)
    
    throw new Error('Bets only allowed in DIFFICULT phase.')
  if (!s.betsOpen) throw new Error('Bets are closed.')

  const p = getProctor(proctorId)
  if (!p) throw new Error('Invalid proctor.')
  if (!p.teamIds.includes(teamId))
    throw new Error('Not allowed: team not assigned to this proctor.')

  const team = getTeam(teamId)
  if (!team) throw new Error('Invalid team.')
  if (team.eliminated) throw new Error('Team is disqualified/eliminated.')
  if (team.score <= 0)
    throw new Error('Team score is <= 0; disqualified for DIFFICULT.')

  const b = Number(bet)
  if (!Number.isFinite(b) || b < 0)
    throw new Error('Bet must be a number >= 0.')
  if (b > team.score) throw new Error('Bet must be <= team score.')

  store.game.bets[teamId] = b
}

/* ---------------- Scoring (Proctor action) ---------------- */

export function scoreByProctor({ proctorId, teamId, result }) {
  const s = store.game.state
  if (!s.scoringOpen) throw new Error('Scoring is closed.')

  const p = getProctor(proctorId)
  if (!p) throw new Error('Invalid proctor.')
  if (!p.teamIds.includes(teamId))
    throw new Error('Not allowed: team not assigned to this proctor.')

  const team = getTeam(teamId)
  if (!team) throw new Error('Invalid team.')
  if (team.eliminated) throw new Error('Team is eliminated.')

  // result: "correct" | "wrong" | "no_answer"
  if (!['correct', 'wrong', 'no_answer'].includes(result)) {
    throw new Error('Invalid result.')
  }

  const phase = s.phase

  // EASY: PDF does not state deduction rule; we keep wrong/no_answer as 0 by default.
  if (phase === PHASES.EASY) {
    const v = s.clueValue
    if (result === 'correct') team.score += v
    // wrong/no_answer -> 0
  }

  // AVERAGE: wrong deduct clue value; no answer no deduction.
  if (phase === PHASES.AVERAGE) {
    const v = s.clueValue
    if (result === 'correct') team.score += v
    if (result === 'wrong') team.score -= v
    // no_answer -> 0
  }

  // DIFFICULT: bet-based scoring; disqualify if team hits <= 0 during difficult
  if (phase === PHASES.DIFFICULT) {
    // Bet must exist; if missing, treat as 0
    const bet = Number(store.game.bets[teamId] ?? 0)

    if (result === 'correct') team.score += bet
    if (result === 'wrong') team.score -= bet
    // no_answer -> 0 (since they submitted nothing; adjust if you want)

    if (team.score <= 0) {
      team.eliminated = true
    }
  }

  // JACKPOT / TIE_BREAKER scoring can be defined later; keep as no-op for now.
  if (phase === PHASES.JACKPOT || phase === PHASES.TIE_BREAKER) {
    // We won't invent rules here—Controller will decide later.
  }

  recomputeDerived()
}
export function startTieBreakerClue() {
  if (store.game.state.phase !== PHASES.TIE_BREAKER) {
    throw new Error('Not in TIE_BREAKER phase.')
  }
  store.game.tieBreaker.clueId += 1
  store.game.tieBreaker.scoringOpen = true
  store.game.tieBreaker.submissions = []
  store.game.tieBreaker.winnerTeamId = null
  store.game.tieBreaker.conflict = false
  store.game.tieBreaker.bufferEndsAt = null
}

export function openTieBreakerScoring(isOpen) {
  if (store.game.state.phase !== PHASES.TIE_BREAKER) {
    throw new Error('Not in TIE_BREAKER phase.')
  }
  store.game.tieBreaker.scoringOpen = !!isOpen
}

export function submitTieBreakerCorrect({
  proctorId,
  teamId,
  nowTs = Date.now(),
}) {
  const s = store.game.state
  if (s.phase !== PHASES.TIE_BREAKER) throw new Error('Not in TIE_BREAKER.')
  if (!store.game.tieBreaker.scoringOpen)
    throw new Error('Tie-breaker scoring is closed.')

  const p = getProctor(proctorId)
  if (!p) throw new Error('Invalid proctor.')
  if (!p.teamIds.includes(teamId))
    throw new Error('Not allowed: team not assigned to this proctor.')

  const team = getTeam(teamId)
  if (!team) throw new Error('Invalid team.')
  if (team.eliminated) throw new Error('Team is eliminated.')

  // Prevent duplicate submissions by same team for same clue
  if (store.game.tieBreaker.submissions.some((x) => x.teamId === teamId)) {
    return // ignore silently (or throw if you prefer)
  }

  // Record submission
  store.game.tieBreaker.submissions.push({
    teamId,
    proctorId,
    ts: nowTs,
  })

  // If this is the first correct, start buffer window
  if (!store.game.tieBreaker.bufferEndsAt) {
    store.game.tieBreaker.bufferEndsAt = nowTs + TIE_BUFFER_MS
  } else {
    // If another correct arrives within buffer window, mark conflict
    if (nowTs <= store.game.tieBreaker.bufferEndsAt) {
      store.game.tieBreaker.conflict = true
    }
  }
}

export function finalizeTieBreakerIfReady(nowTs = Date.now()) {
  const tb = store.game.tieBreaker

  if (store.game.state.phase !== PHASES.TIE_BREAKER) return false
  if (!tb.bufferEndsAt) return false // no submissions yet
  if (tb.winnerTeamId) return false // already decided
  if (nowTs < tb.bufferEndsAt) return false // buffer not finished yet

  // Buffer finished: decide or require GM
  tb.scoringOpen = false

  if (!tb.submissions.length) return false

  if (tb.conflict) {
    // Let GM resolve
    return true // "ready to resolve"
  }

  // No conflict: earliest submission wins
  const winner = [...tb.submissions].sort((a, b) => a.ts - b.ts)[0]
  tb.winnerTeamId = winner.teamId

  // Score +1 (your rule)
  const team = getTeam(winner.teamId)
  if (team) team.score += 1

  recomputeDerived()
  return true
}

export function resolveTieBreakerWinner(teamId) {
  const tb = store.game.tieBreaker
  if (store.game.state.phase !== PHASES.TIE_BREAKER)
    throw new Error('Not in TIE_BREAKER.')
  if (!tb.submissions.length) throw new Error('No submissions to resolve.')
  if (!tb.conflict) throw new Error('No conflict to resolve.')
  if (tb.winnerTeamId) throw new Error('Winner already set.')

  const isCandidate = tb.submissions.some((s) => s.teamId === teamId)
  if (!isCandidate) throw new Error('Team is not a submission candidate.')

  tb.winnerTeamId = teamId
  tb.scoringOpen = false

  const team = getTeam(teamId)
  if (team) team.score += 1

  recomputeDerived()
}
export function autoAssignBySeatOrder() {
  const n = store.game.teams.length
  const proctors = store.game.proctors

  // Clear first
  proctors.forEach((p) => (p.teamIds = []))

  if (n === 0) return

  const chunkSize = Math.ceil(n / proctors.length) // proctors.length = 8
  if (chunkSize > 5)
    throw new Error('Assignment would exceed 5 teams per proctor.')

  let i = 0
  for (const p of proctors) {
    const slice = store.game.teams.slice(i, i + chunkSize).map((t) => t.id)
    p.teamIds = slice
    i += chunkSize
    if (i >= n) break
  }
  recomputeDerived()

}
