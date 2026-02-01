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

  // Sync local when proctors list arrives/changes (first load or auto-assign updates)
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
        // UI rule: max 5
        setError((e) => ({
          ...e,
          [proctorId]: "Max 5 teams per proctor.",
        }));
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
      setToast((t) => ({ ...t, [proctorId]: "Saved ✅" }));
      setTimeout(() => {
        setToast((t) => ({ ...t, [proctorId]: "" }));
      }, 1200);
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
    <div className="asg-root">
      <style>{`
        .asg-root{ color:#fff; }
        .asg-hero{
          border-radius:18px;
          border:1px solid rgba(255,255,255,.12);
          background:#000;
          padding:14px 16px;
        }
        .asg-title{
          margin:0;
          font-size:20px;
          font-weight:1000;
          letter-spacing:.08em;
          text-transform:uppercase;
        }
        .asg-sub{
          margin-top:6px;
          color:rgba(255,255,255,.7);
          font-size:13px;
          line-height:1.35;
        }
        .asg-actions{
          margin-top:12px;
          display:flex;
          gap:10px;
          flex-wrap:wrap;
          align-items:center;
          justify-content:space-between;
        }
        .asg-bigbtn{
          border:none;
          cursor:pointer;
          font-weight:1000;
          border-radius:14px;
          padding:12px 14px;
          background:linear-gradient(90deg,#22d3ee,#a78bfa);
          color:#041018;
          box-shadow:0 14px 26px rgba(0,0,0,.28);
          touch-action: manipulation;
        }
        .asg-bigbtn:active{ transform: translateY(1px); }

        .asg-grid{
          margin-top:12px;
          display:grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap:12px;
        }

        .asg-panel{
          border-radius:18px;
          border:1px solid rgba(255,255,255,.12);
          background:#06070f;
          padding:14px;
          box-shadow: 0 14px 45px rgba(0,0,0,.28);
        }

        .asg-head{
          display:flex;
          justify-content:space-between;
          gap:12px;
          align-items:flex-start;
          flex-wrap:wrap;
        }

        .asg-name{
          font-weight:1000;
          font-size:16px;
        }
        .asg-meta{
          margin-top:4px;
          font-size:12px;
          color:rgba(255,255,255,.7);
        }

        .asg-row{
          display:flex;
          gap:10px;
          flex-wrap:wrap;
          align-items:center;
          margin-top:10px;
        }

        .asg-input{
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,.14);
          background: #000;
          color: #fff;
          padding: 10px 12px;
          outline: none;
          font-weight: 800;
        }

        .asg-btn{
          border-radius: 14px;
          padding: 10px 12px;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.08);
          color:#fff;
          font-weight: 1000;
          cursor:pointer;
        }
        .asg-btn.primary{
          background: linear-gradient(90deg, rgba(34,211,238,.95), rgba(167,139,250,.95));
          color:#051020;
          border:none;
        }
        .asg-btn.danger{
          background: rgba(239,68,68,.18);
          border-color: rgba(239,68,68,.35);
        }
        .asg-btn:disabled{
          opacity:.6;
          cursor:not-allowed;
        }

        .asg-chips{
          display:flex;
          gap:8px;
          flex-wrap:wrap;
          margin-top:10px;
        }
        .chip{
          display:inline-flex;
          align-items:center;
          gap:8px;
          padding: 8px 10px;
          border-radius: 999px;
          border:1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.06);
          font-weight: 900;
          font-size: 12px;
        }
        .chip button{
          border:none;
          background: rgba(255,255,255,.12);
          color:#fff;
          border-radius: 999px;
          width: 22px;
          height: 22px;
          cursor:pointer;
          font-weight:1000;
        }

        .asg-list{
          margin-top: 10px;
          display:flex;
          flex-direction:column;
          gap:8px;
          max-height: 320px;
          overflow:auto;
          padding-right: 4px;
        }

        .teamBtn{
          width:100%;
          display:flex;
          justify-content: space-between;
          align-items:center;
          gap: 10px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.05);
          color:#fff;
          padding: 12px 12px;
          font-weight: 900;
          cursor:pointer;
          text-align:left;
          touch-action: manipulation;
        }
        .teamBtn:hover{ background: rgba(255,255,255,.08); }

        .teamBtn.on{
          border-color: rgba(34,197,94,.35);
          background: rgba(34,197,94,.10);
        }

        .teamSub{
          color: rgba(255,255,255,.65);
          font-weight: 700;
          font-size: 12px;
        }

        .msg-ok{ color: rgba(34,197,94,1); font-weight: 900; margin-top: 8px; }
        .msg-err{ color: rgba(248,113,113,1); font-weight: 900; margin-top: 8px; }

        @media (max-width: 900px){
          .asg-grid{ grid-template-columns: 1fr; }
          .asg-list{ max-height: 260px; }
        }
      `}</style>

      <div className="asg-hero">
        <h1 className="asg-title">Assignments</h1>
        <div className="asg-sub">
          Assign up to <b>5 teams</b> per proctor. Auto-Assign uses seat order and balances across 8 proctors.
        </div>

        <div className="asg-actions">
          <button className="asg-bigbtn" onClick={runAutoAssign}>
            ⚡ Auto-Assign (Seat Order)
          </button>
          <div className="asg-sub">
            Tip: After auto-assign, tap a proctor panel to adjust teams then <b>Save</b>.
          </div>
        </div>
      </div>

      <div className="asg-grid">
        {proctors.map((p) => {
          const selectedIds = local[p.id] || [];
          const selectedTeams = selectedIds.map((id) => teamsById.get(id)).filter(Boolean);

          const q = (query[p.id] || "").trim().toLowerCase();
          const filteredTeams =
            q.length === 0
              ? teams
              : teams.filter((t) => t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));

          return (
            <div className="asg-panel" key={p.id}>
              <div className="asg-head">
                <div>
                  <div className="asg-name">🎧 {p.name}</div>
                  <div className="asg-meta">{selectedIds.length}/5 teams assigned</div>
                </div>

                <div className="asg-row" style={{ marginTop: 0 }}>
                  <button
                    className="asg-btn danger"
                    onClick={() => clearAll(p.id)}
                    disabled={selectedIds.length === 0}
                    title="Clear all selected teams"
                  >
                    Clear
                  </button>
                  <button
                    className="asg-btn primary"
                    onClick={() => save(p.id)}
                    disabled={saving[p.id]}
                    title="Save assignments to server"
                  >
                    {saving[p.id] ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>

              <div className="asg-row">
                <input
                  className="asg-input"
                  placeholder="Search team name…"
                  value={query[p.id] || ""}
                  onChange={(e) => setQuery((prev) => ({ ...prev, [p.id]: e.target.value }))}
                />
              </div>

              {selectedTeams.length > 0 && (
                <div className="asg-chips">
                  {selectedTeams.map((t) => (
                    <span className="chip" key={t.id}>
                      {t.name}
                      <button onClick={() => toggle(p.id, t.id)} title="Remove">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="asg-list">
                {teams.length === 0 ? (
                  <div className="asg-meta">No teams yet. Go to Teams page first.</div>
                ) : (
                  filteredTeams.map((t) => {
                    const on = isSelected(p.id, t.id);
                    return (
                      <button
                        key={t.id}
                        className={`teamBtn ${on ? "on" : ""}`}
                        onClick={() => toggle(p.id, t.id)}
                      >
                        <div>
                          {on ? "✅ " : ""}{t.name}
                          <div className="teamSub">{t.id}</div>
                        </div>
                        <div className="teamSub">{on ? "ASSIGNED" : "tap to assign"}</div>
                      </button>
                    );
                  })
                )}
              </div>

              {toast[p.id] && <div className="msg-ok">{toast[p.id]}</div>}
              {error[p.id] && <div className="msg-err">{error[p.id]}</div>}

              <div className="asg-meta" style={{ marginTop: 10 }}>
                Server rule: a team can’t be assigned to two proctors. If Save fails, remove it from the other proctor.
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
