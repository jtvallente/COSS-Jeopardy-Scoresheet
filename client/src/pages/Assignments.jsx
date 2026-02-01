// client/src/pages/Assignments.jsx
import { useState } from 'react'
import { useGame } from '../useGame'
import { assignProctor, autoAssign } from '../api'

export default function Assignments() {
  const { game } = useGame()
  const teams = game.teams || []
  const proctors = game.proctors || []

  const [local, setLocal] = useState(() => {
    const obj = {}
    for (const p of proctors) obj[p.id] = p.teamIds ?? []
    return obj
  })

  // If teams/proctors change later, user can refresh page; we keep it simple now.

  function toggle(proctorId, teamId) {
    setLocal((prev) => {
      const cur = new Set(prev[proctorId] || [])
      if (cur.has(teamId)) cur.delete(teamId)
      else cur.add(teamId)

      const arr = Array.from(cur)
      // enforce max 5 in UI
      if (arr.length > 5) return prev
      return { ...prev, [proctorId]: arr }
    })
  }

  async function save(proctorId) {
    await assignProctor(proctorId, local[proctorId] || [])
  }

  return (
    <div className="grid">
      <div className="card">
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <div className="h1">Assignments</div>
              <div className="muted">
                Seat-order auto assignment: balanced, max 5 each.
              </div>
            </div>
            <button className="btn" onClick={() => autoAssign()}>
              Auto-Assign (Seat Order)
            </button>
          </div>
        </div>
      </div>

      {proctors.map((p) => {
        const selected = new Set(local[p.id] || [])
        return (
          <div className="card" key={p.id}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div>
                <div className="h1">{p.name}</div>
                <div className="muted">{selected.size}/5 teams assigned</div>
              </div>
              <button className="btn" onClick={() => save(p.id)}>
                Save
              </button>
            </div>

            <div className="grid" style={{ marginTop: 10 }}>
              {teams.length === 0 ? (
                <div className="muted">
                  No teams yet. Go to Teams page first.
                </div>
              ) : (
                teams.map((t) => (
                  <label key={t.id} className="row" style={{ gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={selected.has(t.id)}
                      onChange={() => toggle(p.id, t.id)}
                    />
                    <span>{t.name}</span>
                    <span className="muted">({t.id})</span>
                  </label>
                ))
              )}
            </div>

            <div className="muted" style={{ marginTop: 8 }}>
              If Save fails: a team is already assigned to another proctor
              (server rule).
            </div>
          </div>
        )
      })}
    </div>
  )
}
