// client/src/pages/Assignments.jsx
import { useEffect, useMemo, useState } from "react";
import { useGame } from "../useGame";
import { assignProctor, autoAssign } from "../api";

function uniq(arr) {
  return Array.from(new Set(arr));
}

export default function Assignments() {
  const { game } = useGame();
  const teams = game.teams || [];
  const proctors = game.proctors || [];

  // Local working copy per proctor
  const [local, setLocal] = useState({});
  const [query, setQuery] = useState({}); // per-proctor search
  const [saving, setSaving] = useState({}); // { p1:true }
  const [toast, setToast] = useState({}); // { p1: "Saved!" }
  const [error, setError] = useState({}); // { p1: "..." }

  // Sync local when proctors list arrives/changes
  useEffect(() => {
    const obj = {};
    for (const p of proctors) obj[p.id] = p.teamIds ?? [];
    setLocal(obj);
  }, [proctors]);

  const teamsById = useMemo(() => {
    const m = new Map();
    for (const t of teams) m.set(t.id, t);
    return m;
  }, [teams]);

  function isSelected(proctorId, teamId) {
    return (local[proctorId] || []).includes(teamId);
  }

  function toggle(proctorId, teamId) {
    setError((e) => ({ ...e, [proctorId]: "" }));
    setToast((t) => ({ ...t, [proctorId]: "" }));

    setLocal((prev) => {
      const cur = prev[proctorId] || [];
      const has = cur.includes(teamId);

      if (has) {
        return { ...prev, [proctorId]: cur.filter((x) => x !== teamId) };
      }

      if (cur.length >= 5) {
        setError((e) => ({ ...e, [proctorId]: "Max 5 teams per proctor." }));
        return prev;
      }

      return { ...prev, [proctorId]: uniq([...cur, teamId]) };
    });
  }

  function clearAll(proctorId) {
    setLocal((prev) => ({ ...prev, [proctorId]: [] }));
    setError((e) => ({ ...e, [proctorId]: "" }));
    setToast((t) => ({ ...t, [proctorId]: "" }));
  }

  async function save(proctorId) {
    setSaving((s) => ({ ...s, [proctorId]: true }));
    setError((e) => ({ ...e, [proctorId]: "" }));
    setToast((t) => ({ ...t, [proctorId]: "" }));

    try {
      await assignProctor(proctorId, local[proctorId] || []);
      setToast((t) => ({ ...t, [proctorId]: "Saved." }));
      setTimeout(() => setToast((t) => ({ ...t, [proctorId]: "" })), 1200);
    } catch (e) {
      setError((err) => ({
        ...err,
        [proctorId]:
          e?.message ||
          "Save failed. A team may already be assigned to another proctor.",
      }));
    } finally {
      setSaving((s) => ({ ...s, [proctorId]: false }));
    }
  }

  async function runAutoAssign() {
    try {
      await autoAssign();
      // local will sync via useEffect when game.proctors updates
    } catch (e) {
      alert(e?.message || "Auto-assign failed.");
    }
  }

  return (
    <div className="gh-asg">
      <style>{`
        .gh-asg{
          --bg:#0d1117;
          --panel:#161b22;
          --panel2:#0f141b;
          --border:#30363d;
          --text:#c9d1d9;
          --muted:#8b949e;
          --accent:#0425e0;
          --danger:#f85149;
          --ok:#3fb950;
          --shadow: 0 0 0 1px var(--border);
          color: var(--text);
        }
        .wrap{
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px;
        }

        /* Header */
        .header{
          display:flex;
          justify-content:space-between;
          gap:12px;
          flex-wrap:wrap;
          align-items:flex-start;
          margin-bottom: 12px;
        }
        .title{
          margin:0;
          font-size:20px;
          font-weight:900;
        }
        .sub{
          margin-top:4px;
          font-size:12px;
          color: var(--muted);
          line-height: 1.35;
          max-width: 760px;
        }

        .actions{
          display:flex;
          gap:10px;
          align-items:center;
          flex-wrap:wrap;
        }

        .btn{
          height: 34px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--panel2);
          color: var(--text);
          font-weight: 800;
          cursor:pointer;
          padding: 0 12px;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          user-select:none;
        }
        .btn:disabled{ opacity:.6; cursor:not-allowed; }
        .btn.primary{
          border-color: rgba(4,37,224,.70);
          background: rgba(4,37,224,.18);
        }
        .btn.danger{
          border-color: rgba(248,81,73,.60);
          background: rgba(248,81,73,.12);
          color: #ffd7d5;
        }

        /* Layout */
        .grid{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .card{
          background: var(--panel);
          box-shadow: var(--shadow);
          border-radius: 10px;
          padding: 12px;
          min-width:0;
        }

        .cardHead{
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap: 10px;
          flex-wrap:wrap;
          margin-bottom: 10px;
        }
        .pname{
          font-size: 20px;
          font-weight: 900;
          margin: 0;
        }
        .meta{
          margin-top: 4px;
          color: var(--muted);
          font-size: 12px;
        }

        .rightBtns{
          display:flex;
          gap: 8px;
          align-items:center;
        }

        /* Search */
        .search{
          width:96%;
          height: 34px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--panel2);
          color: var(--text);
          padding: 0 10px;
          outline:none;
          font-weight: 700;
        }
        .search:focus{
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(4,37,224,.25);
        }

        /* Selected chips */
        .chips{
          display:flex;
          flex-wrap:wrap;
          gap: 6px;
          margin-top: 10px;
        }
        .chip{
          display:inline-flex;
          align-items:center;
          gap: 8px;
          padding: 6px 10px;
          border-radius: 999px;
          background: var(--panel2);
          border: 1px solid var(--border);
          font-size: 12px;
          font-weight: 800;
          color: var(--text);
        }
        .chip small{ color: var(--muted); font-weight:700; }
        .x{
          width: 20px;
          height: 20px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--muted);
          cursor:pointer;
          font-weight: 900;
          line-height: 1;
          display:flex;
          align-items:center;
          justify-content:center;
        }
        .x:hover{
          color: var(--text);
          border-color: rgba(4,37,224,.6);
          box-shadow: 0 0 0 3px rgba(4,37,224,.15);
        }

        /* Team list */
        .list{
          margin-top: 10px;
          border-radius: 10px;
          box-shadow: var(--shadow);
          overflow:hidden;
          max-height: 360px;
          overflow-y:auto;
          background: var(--panel2);
        }
        .team{
          width:100%;
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap: 10px;
          padding: 10px 10px;
          border: none;
          border-top: 1px solid rgba(48,54,61,.65);
          background: transparent;
          color: var(--text);
          cursor:pointer;
          text-align:left;
          font-weight: 800;
        }
        .team:first-child{ border-top:none; }
        .team:hover{ background: rgba(4,37,224,.08); }

        .left{
          display:flex;
          flex-direction:column;
          gap: 2px;
          min-width: 0;
        }
        .tname{
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tid{
          font-size: 12px;
          color: var(--muted);
          font-weight: 700;
        }
        .tag{
          font-size: 12px;
          color: var(--muted);
          font-weight: 800;
          white-space: nowrap;
        }

        .team.on{
          background: rgba(4,37,224,.14);
        }
        .team.on .tag{
          color: #dbeafe;
        }

        /* Messages */
        .msg{
          margin-top: 10px;
          border-radius: 6px;
          padding: 8px 10px;
          border: 1px solid var(--border);
          background: var(--panel2);
          font-weight: 800;
          font-size: 12px;
        }
        .msg.ok{
          border-color: rgba(63,185,80,.55);
          background: rgba(63,185,80,.10);
          color: #d2fedb;
        }
        .msg.err{
          border-color: rgba(248,81,73,.60);
          background: rgba(248,81,73,.12);
          color: #ffd7d5;
        }

        .foot{
          margin-top: 10px;
          font-size: 12px;
          color: var(--muted);
          line-height: 1.35;
        }

        @media (max-width: 920px){
          .grid{ grid-template-columns: 1fr; }
          .list{ max-height: 280px; }
        }
      `}</style>

      <div className="wrap">
        <div className="header">
          <div>
            <h1 className="title">ASSIGNMENTS</h1>
            <div className="sub">
              Assign up to <b>5 teams</b> per proctor. Auto-Assign uses seat order and balances across 8 proctors.
              After auto-assign, adjust teams per proctor then hit <b>Save</b>.
            </div>
          </div>

          <div className="actions">
            <button className="btn primary" onClick={runAutoAssign}>
              Auto-Assign
            </button>
          </div>
        </div>

        <div className="grid">
          {proctors.map((p) => {
            const selectedIds = local[p.id] || [];
            const selectedTeams = selectedIds.map((id) => teamsById.get(id)).filter(Boolean);

            const q = (query[p.id] || "").trim().toLowerCase();
            const filtered =
              q.length === 0
                ? teams
                : teams.filter(
                    (t) =>
                      t.name.toLowerCase().includes(q) ||
                      t.id.toLowerCase().includes(q)
                  );

            return (
              <div className="card" key={p.id}>
                <div className="cardHead">
                  <div>
                    <div className="pname">{p.name}</div>
                    <div className="meta">{selectedIds.length}/5 teams assigned</div>
                  </div>

                  <div className="rightBtns">
                    <button
                      className="btn danger"
                      onClick={() => clearAll(p.id)}
                      disabled={selectedIds.length === 0}
                      title="Clear selection"
                    >
                      Clear
                    </button>
                    <button
                      className="btn primary"
                      onClick={() => save(p.id)}
                      disabled={!!saving[p.id]}
                      title="Save to server"
                    >
                      {saving[p.id] ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>

                <input
                  className="search"
                  placeholder="Search teams…"
                  value={query[p.id] || ""}
                  onChange={(e) => setQuery((prev) => ({ ...prev, [p.id]: e.target.value }))}
                />

                {selectedTeams.length > 0 && (
                  <div className="chips">
                    {selectedTeams.map((t) => (
                      <span className="chip" key={t.id} title={t.id}>
                        <span className="tname">{t.name}</span>
                        <small>{t.id}</small>
                        <button className="x" onClick={() => toggle(p.id, t.id)} aria-label="Remove">
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="list" role="list">
                  {teams.length === 0 ? (
                    <div className="msg err" style={{ margin: 10 }}>
                      No teams yet. Go to Teams page first.
                    </div>
                  ) : (
                    filtered.map((t) => {
                      const on = isSelected(p.id, t.id);
                      return (
                        <button
                          key={t.id}
                          className={`team ${on ? "on" : ""}`}
                          onClick={() => toggle(p.id, t.id)}
                          role="listitem"
                        >
                          <div className="left">
                            <div className="tname">{t.name}</div>
                            <div className="tid">{t.id}</div>
                          </div>
                          <div className="tag">{on ? "Assigned" : "Tap to assign"}</div>
                        </button>
                      );
                    })
                  )}
                </div>

                {toast[p.id] && <div className="msg ok">{toast[p.id]}</div>}
                {error[p.id] && <div className="msg err">{error[p.id]}</div>}

                <div className="foot">
                  Server rule: a team can’t be assigned to two proctors. If Save fails, remove it from the other proctor and try again.
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
