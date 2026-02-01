// client/src/pages/Controller.jsx
import { useMemo } from 'react'
import { useGame } from '../useGame'
import {
  resetGame,
  undo,
  updateState,
  tbFinalize,
  tbNewClue,
  tbResolve,
} from '../api'

export default function Controller() {
  const { game } = useGame()
  const s = game.state

  const clincherTeams = useMemo(() => {
    return (game.clincher.tiedTeamIds || [])
      .map((id) => game.teams.find((t) => t.id === id))
      .filter(Boolean)
  }, [game])

  const tb = game.tieBreaker

  const allowedValues = useMemo(() => {
    if (s.phase === 'EASY') return [100, 200, 300, 400]
    if (s.phase === 'AVERAGE') return [200, 400, 600, 800]
    return []
  }, [s.phase])

  return (
    <div className="grid">
      <div className="card">
        <div className="h1">Controller</div>
        <div className="muted">
          Controls game phase, question, scoring window, and tie-break
          resolution.
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn secondary" onClick={() => undo()}>
            Undo
          </button>
          <button className="btn danger" onClick={() => resetGame()}>
            Reset
          </button>
        </div>
      </div>

      <div className="card">
        <div className="h1">Game State</div>

        <div className="row" style={{ marginTop: 10 }}>
          <div style={{ minWidth: 220 }}>
            <div className="muted">Phase</div>
            <select
              className="input"
              value={s.phase}
              onChange={(e) => updateState({ phase: e.target.value })}
            >
              <option value="EASY">EASY</option>
              <option value="AVERAGE">AVERAGE</option>
              <option value="DIFFICULT">DIFFICULT</option>
              <option value="JACKPOT">JACKPOT</option>
              <option value="TIE_BREAKER">TIE_BREAKER</option>
            </select>
          </div>

          <div style={{ minWidth: 220 }}>
            <div className="muted">Round Label (your tabs)</div>
            <select
              className="input"
              value={s.roundLabel}
              onChange={(e) => updateState({ roundLabel: e.target.value })}
            >
              <option>VIDEO GAMES</option>
              <option>MUSIC</option>
              <option>TECH</option>
              <option>ANIME</option>
              <option>MEMES</option>
              <option>FINAL ROUND</option>
              <option>TIE BREAKER</option>
              <option>JACKPOT</option>
            </select>
          </div>

          <div style={{ minWidth: 160 }}>
            <div className="muted">Clue #</div>
            <input
              className="input"
              type="number"
              value={s.clueNumber}
              min={1}
              onChange={(e) =>
                updateState({ clueNumber: Number(e.target.value) })
              }
            />
          </div>

          <div style={{ minWidth: 160 }}>
            <div className="muted">Seconds</div>
            <input className="input" value={s.seconds} disabled />
          </div>
        </div>

        {allowedValues.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div className="muted">Clue Value</div>
            <div className="row" style={{ marginTop: 6 }}>
              {allowedValues.map((v) => (
                <button
                  key={v}
                  className={'btn ' + (s.clueValue === v ? '' : 'secondary')}
                  onClick={() => updateState({ clueValue: v })}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="row" style={{ marginTop: 10 }}>
          <button
            className={'btn ' + (s.scoringOpen ? '' : 'secondary')}
            onClick={() => updateState({ scoringOpen: !s.scoringOpen })}
          >
            Scoring: {s.scoringOpen ? 'OPEN' : 'CLOSED'}
          </button>
        </div>
        {s.phase === 'DIFFICULT' && (
          <div className="row" style={{ marginTop: 10 }}>
            <button
              className={'btn ' + (s.betsOpen ? '' : 'secondary')}
              onClick={() => updateState({ betsOpen: !s.betsOpen })}
            >
              Bets: {s.betsOpen ? 'OPEN' : 'CLOSED'}
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="h1">Clincher Detection</div>
        {game.clincher.needed ? (
          <>
            <div style={{ marginTop: 8 }}>
              <b>Tie detected.</b> Clincher candidates:
            </div>
            <ul>
              {clincherTeams.map((t) => (
                <li key={t.id}>
                  {t.name} ({t.score})
                </li>
              ))}
            </ul>
            <div className="muted">Switch phase to TIE_BREAKER when ready.</div>
          </>
        ) : (
          <div style={{ marginTop: 8 }}>No tie for highest score.</div>
        )}
      </div>

      <div className="card">
        <div className="h1">Tie-breaker Panel</div>
        <div className="muted">
          Option A: buffer + conflict. Use New Clue, then finalize or resolve if
          conflict.
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn" onClick={() => tbNewClue()}>
            New Tie-break Clue
          </button>
          <button className="btn secondary" onClick={() => tbFinalize()}>
            Finalize
          </button>
        </div>

        <div style={{ marginTop: 10 }}>
          <div className="muted">
            Winner: {tb?.winnerTeamId ? tb.winnerTeamId : '—'}
          </div>
          <div className="muted">Conflict: {tb?.conflict ? 'YES' : 'NO'}</div>
          <div className="muted">
            Submissions: {(tb?.submissions || []).length}
          </div>
        </div>

        {tb?.conflict && (
          <div style={{ marginTop: 10 }}>
            <div>
              <b>Resolve conflict:</b>
            </div>
            <div className="row" style={{ marginTop: 6 }}>
              {(tb.submissions || []).map((sub, idx) => {
                const team = game.teams.find((t) => t.id === sub.teamId)
                return (
                  <button
                    key={idx}
                    className="btn"
                    onClick={() => tbResolve(sub.teamId)}
                  >
                    Pick {team ? team.name : sub.teamId}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
