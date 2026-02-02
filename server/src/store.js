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
  [PHASES.EASY]: { seconds: 10, allowedValues: [10, 20, 30, 40] },
  [PHASES.AVERAGE]: { seconds: 15, allowedValues: [20, 40, 60, 80] },
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
      clueId: 1,
      scoringOpen: false,
      submissions: [],
      winnerTeamId: null,
      conflict: false,
      bufferEndsAt: null,

      // freeze who is allowed to participate in TB
      candidateTeamIds: [],
      finalized: false,
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
  // ---------- LEADERBOARD ----------
  const sorted = [...store.game.teams].sort((a, b) => b.score - a.score)

  store.game.leaderboard = sorted.map((t) => ({
    id: t.id,
    name: t.name,
    score: t.score,
    eliminated: t.eliminated,
  }))

  // ---------- CLINCHER LOGIC ----------
  // Goal:
  // Ensure Top 1, Top 2, Top 3 are DISTINCT.
  // Priority:
  // 1) Tie for Rank 1
  // 2) Else tie for Rank 2
  // 3) Else tie for Rank 3
  // Ignore all other ranks completely.

  const active = sorted.filter((t) => !t.eliminated)

  // Not enough teams to have a tie
  if (active.length < 2) {
    store.game.clincher = { needed: false, tiedTeamIds: [] }
    return
  }

  // Helper: returns all teamIds tied at the given rank (1-based)
  function tieGroupAtRank(rank) {
    const idx = rank - 1
    if (!active[idx]) return []
    const score = active[idx].score
    return active.filter((t) => t.score === score).map((t) => t.id)
  }

  // ---- Rank 1 tie ----
  const rank1 = tieGroupAtRank(1)
  if (rank1.length > 1) {
    store.game.clincher = {
      needed: true,
      tiedTeamIds: rank1,
    }
    return
  }

  // ---- Rank 2 tie ----
  if (active.length >= 2) {
    const rank2 = tieGroupAtRank(2)
    if (rank2.length > 1) {
      store.game.clincher = {
        needed: true,
        tiedTeamIds: rank2,
      }
      return
    }
  }

  // ---- Rank 3 tie ----
  if (active.length >= 3) {
    const rank3 = tieGroupAtRank(3)
    if (rank3.length > 1) {
      store.game.clincher = {
        needed: true,
        tiedTeamIds: rank3,
      }
      return
    }
  }

  // ---- No clincher needed ----
  store.game.clincher = {
    needed: false,
    tiedTeamIds: [],
  }
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
  const cleaned = teamNames.map((s) => String(s ?? '').trim()).filter(Boolean)

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

  const tb = store.game.tieBreaker

  // freeze candidates ONCE per TB clue
  tb.candidateTeamIds = [...(store.game.clincher?.tiedTeamIds || [])]

  tb.clueId += 1
  tb.scoringOpen = true
  tb.submissions = []
  tb.winnerTeamId = null
  tb.conflict = false
  tb.bufferEndsAt = null
  tb.finalized = false
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
  const tb = store.game.tieBreaker

  if (s.phase !== PHASES.TIE_BREAKER) throw new Error('Not in TIE_BREAKER.')
  if (!tb.scoringOpen) throw new Error('Tie-breaker scoring is closed.')
  if (tb.finalized) throw new Error('Tie-breaker already finalized.')

  const p = getProctor(proctorId)
  if (!p) throw new Error('Invalid proctor.')
  if (!p.teamIds.includes(teamId)) {
    throw new Error('Not allowed: team not assigned to this proctor.')
  }

  const team = getTeam(teamId)
  if (!team) throw new Error('Invalid team.')
  if (team.eliminated) throw new Error('Team is eliminated.')

  // Only teams frozen as candidates can submit
  if (!tb.candidateTeamIds.includes(teamId)) {
    throw new Error('Team is not a tie-break candidate.')
  }

  // One submission per team (idempotent)
  if (tb.submissions.some((x) => x.teamId === teamId)) {
    return
  }
  const candidates = tb.candidateTeamIds || []
  if (candidates.length > 0 && !candidates.includes(teamId)) {
    throw new Error('Team is not a tie-break candidate.')
  }
  

  tb.submissions.push({ teamId, proctorId, ts: nowTs })

  // Multiple corrects are allowed → conflict if more than 1 submission
  tb.conflict = tb.submissions.length > 1
}

export function finalizeTieBreaker() {
  const tb = store.game.tieBreaker

  if (store.game.state.phase !== PHASES.TIE_BREAKER) {
    throw new Error('Not in TIE_BREAKER phase.')
  }
  if (!tb.scoringOpen) {
    throw new Error('Tie-breaker scoring is closed.')
  }
  if (tb.finalized) return

  if (!tb.submissions.length) {
    throw new Error('No submissions yet.')
  }

  tb.scoringOpen = false
  tb.finalized = true

  if (tb.submissions.length === 1) {
    // Single winner (auto)
    tb.conflict = false
    tb.winnerTeamId = tb.submissions[0].teamId

    const team = getTeam(tb.winnerTeamId)
    if (team) team.score += 1

    recomputeDerived()
    return { status: 'WINNER_SET', winnerTeamId: tb.winnerTeamId }
  }

  // Multiple winners → GM must resolve
  tb.conflict = true
  tb.winnerTeamId = null
  return { status: 'NEEDS_RESOLVE' }
}

export function resolveTieBreakerWinner(teamId) {
  const tb = store.game.tieBreaker

  if (store.game.state.phase !== PHASES.TIE_BREAKER)
    throw new Error('Not in TIE_BREAKER.')
  if (!tb.finalized) throw new Error('Finalize first.')
  if (!tb.conflict) throw new Error('No conflict to resolve.')
  if (!tb.submissions.length) throw new Error('No submissions to resolve.')
  if (tb.winnerTeamId) throw new Error('Winner already set.')

  const isCandidate = tb.submissions.some((s) => s.teamId === teamId)
  if (!isCandidate) throw new Error('Team is not a submission candidate.')

  tb.winnerTeamId = teamId
  tb.conflict = false
  tb.finalized = true
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

export function finalizeTieBreakerIfReady() {
  return finalizeTieBreaker()
}
