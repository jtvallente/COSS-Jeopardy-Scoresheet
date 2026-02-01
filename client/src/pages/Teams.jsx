// client/src/pages/Teams.jsx
import { useMemo, useState } from "react";
import { useGame } from "../useGame";
import { addTeams, importTeamsCSV, replaceTeams } from "../api";

export default function Teams() {
  const { game } = useGame();

  const [namesText, setNamesText] = useState("");
  const [csvText, setCsvText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [search, setSearch] = useState("");

  const teams = game.teams || [];

  const filteredTeams = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q)
    );
  }, [teams, search]);

  function parseNames(text) {
    return text
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function safeRun(fn) {
    setMsg({ type: "", text: "" });
    setBusy(true);
    try {
      await fn();
      setMsg({ type: "ok", text: "✅ Updated successfully." });
      setTimeout(() => setMsg({ type: "", text: "" }), 1500);
    } catch (e) {
      setMsg({ type: "err", text: e?.message || "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  async function onReplace() {
    const names = parseNames(namesText);
    if (names.length === 0) return;
    await safeRun(async () => {
      await replaceTeams(names);
      setNamesText("");
    });
  }

  async function onAdd() {
    const names = parseNames(namesText);
    if (names.length === 0) return;
    await safeRun(async () => {
      await addTeams(names);
      setNamesText("");
    });
  }

  async function onImport(mode) {
    const text = csvText.trim();
    if (!text) return;
    await safeRun(async () => {
      await importTeamsCSV(text, mode);
      setCsvText("");
    });
  }

  return (
    <div className="tm-root">
      <style>{`
        .tm-root{ color:#fff; }

        .tm-hero{
          border-radius:18px;
          border:2px solid #22d3ee;
          background:#000;
          padding:14px 16px;
          box-shadow: 0 18px 55px rgba(0,0,0,.35);
        }

        .tm-title{
          margin:0;
          font-size:20px;
          font-weight:1000;
          letter-spacing:.08em;
          text-transform:uppercase;
        }

        .tm-sub{
          margin-top:6px;
          color:rgba(255,255,255,.75);
          font-size:13px;
          line-height:1.35;
        }

        .tm-grid{
          margin-top:12px;
          display:grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap:12px;
        }

        .panel{
          border-radius:18px;
          border:1px solid #1f2937;
          background:#06070f; /* solid */
          padding:14px;
          box-shadow: 0 14px 45px rgba(0,0,0,.28);
        }

        .panel h2{
          margin:0;
          font-size:13px;
          letter-spacing:.12em;
          text-transform:uppercase;
          color:rgba(255,255,255,.75);
          font-weight:1000;
        }

        .panel p{
          margin:6px 0 0;
          color:rgba(255,255,255,.68);
          font-size:13px;
          line-height:1.35;
        }

        .tm-textarea{
          width:95%;
          border-radius:16px;
          border:1px solid rgba(255,255,255,.14);
          background:#000;
          color:#fff;
          padding:12px;
          font-weight:800;
          outline:none;
          resize: vertical;
          min-height: 150px;
        }

        .tm-row{
          display:flex;
          gap:10px;
          flex-wrap:wrap;
          align-items:center;
          margin-top:10px;
        }

        .tm-btn{
          border:none;
          cursor:pointer;
          font-weight:1000;
          border-radius:14px;
          padding:12px 14px;
          touch-action: manipulation;
        }

        .tm-btn.primary{
          background: linear-gradient(90deg,#22d3ee,#a78bfa);
          color:#041018;
          box-shadow: 0 14px 26px rgba(0,0,0,.28);
        }
        .tm-btn.secondary{
          background:#111827;
          color:#fff;
          border:1px solid rgba(255,255,255,.14);
        }
        .tm-btn.danger{
          background: rgba(239,68,68,.18);
          color:#fff;
          border:1px solid rgba(239,68,68,.35);
        }
        .tm-btn:disabled{
          opacity:.6;
          cursor:not-allowed;
        }
        .tm-btn:active{ transform: translateY(1px); }

        .tm-msg{
          margin-top:10px;
          font-weight:1000;
        }
        .tm-msg.ok{ color:#22c55e; }
        .tm-msg.err{ color:#f87171; }

        .tm-bottom{
          margin-top:12px;
          display:grid;
          grid-template-columns: 1fr;
          gap:12px;
        }

        .tm-search{
          width:100%;
          border-radius:16px;
          border:1px solid rgba(255,255,255,.14);
          background:#000;
          color:#fff;
          padding:12px;
          font-weight:900;
          outline:none;
        }

        .tm-tableWrap{
          overflow:auto;
          border-radius:16px;
          border:1px solid rgba(255,255,255,.12);
        }
        .tm-table{
          width:100%;
          border-collapse: collapse;
          min-width: 520px;
        }
        .tm-table th{
          text-align:left;
          padding:12px;
          font-size:12px;
          letter-spacing:.12em;
          text-transform:uppercase;
          color:rgba(255,255,255,.7);
          background:#0b1020;
          position: sticky;
          top: 0;
          z-index: 2;
        }
        .tm-table td{
          padding:12px;
          border-top:1px solid rgba(255,255,255,.08);
          font-weight:800;
          color:rgba(255,255,255,.9);
        }
        .tm-table tr:hover{
          background:#0b1020;
        }
        .tm-badge{
          display:inline-flex;
          align-items:center;
          gap:8px;
          padding:6px 10px;
          border-radius:999px;
          border:1px solid rgba(255,255,255,.14);
          background:#0b1020;
          font-weight:1000;
          font-size:12px;
          letter-spacing:.06em;
          text-transform:uppercase;
          color:rgba(255,255,255,.85);
        }

        @media (max-width: 900px){
          .tm-grid{ grid-template-columns: 1fr; }
          .tm-table{ min-width: 0; }
          .tm-table th{ position: static; }
        }
      `}</style>

      {/* HERO */}
      <div className="tm-hero">
        <h1 className="tm-title">Teams</h1>
        <div className="tm-sub">
          Add teams manually or import. <b>Order matters:</b> list teams in seat order (left → right, row by row).
        </div>

        <div className="tm-row" style={{ marginTop: 12 }}>
          <span className="tm-badge">👥 Current teams: {teams.length}/40</span>
          {busy && <span className="tm-badge">⏳ Updating…</span>}
        </div>

        {msg.text && (
          <div className={`tm-msg ${msg.type}`} role="alert">
            {msg.text}
          </div>
        )}
      </div>

      {/* INPUT PANELS */}
      <div className="tm-grid">
        <div className="panel">
          <h2>Paste names</h2>
          <p>One team per line. This is the easiest way for seat order.</p>

          <textarea
            className="tm-textarea"
            value={namesText}
            onChange={(e) => setNamesText(e.target.value)}
            placeholder={"Team 1\nTeam 2\nTeam 3"}
            disabled={busy}
          />

          <div className="tm-row">
            <button
              className="tm-btn primary"
              onClick={onAdd}
              disabled={busy || !namesText.trim()}
              title="Adds to existing teams"
            >
              ➕ Add Teams
            </button>

            <button
              className="tm-btn danger"
              onClick={onReplace}
              disabled={busy || !namesText.trim()}
              title="Replaces everything (resets team list)"
            >
              🔄 Replace All
            </button>
          </div>
        </div>

        <div className="panel">
          <h2>Import CSV text</h2>
          <p>First column is team name. You can paste from Google Sheets/Excel.</p>

          <textarea
            className="tm-textarea"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={
              "Team A\nTeam B\nTeam C\n\nor:\nTeam A,School\nTeam B,School"
            }
            disabled={busy}
          />

          <div className="tm-row">
            <button
              className="tm-btn primary"
              onClick={() => onImport("add")}
              disabled={busy || !csvText.trim()}
            >
              📥 Import (Add)
            </button>

            <button
              className="tm-btn danger"
              onClick={() => onImport("replace")}
              disabled={busy || !csvText.trim()}
            >
              📥 Import (Replace)
            </button>
          </div>
        </div>
      </div>

      {/* CURRENT TEAMS */}
      <div className="panel" style={{ marginTop: 12 }}>
        <div className="tm-row" style={{ justifyContent: "space-between" }}>
          <div>
            <h2>Current Teams</h2>
            <p>Shows live scores. Use search to find teams quickly.</p>
          </div>
          <span className="tm-badge">Showing: {filteredTeams.length}</span>
        </div>

        <div className="tm-row" style={{ marginTop: 10 }}>
          <input
            className="tm-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by team name or ID…"
          />
        </div>

        <div className="tm-tableWrap" style={{ marginTop: 10 }}>
          <table className="tm-table">
            <thead>
              <tr>
                <th style={{ width: 90 }}>ID</th>
                <th>Team</th>
                <th style={{ width: 110 }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td style={{ fontWeight: 1000 }}>{t.name}</td>
                  <td style={{ fontWeight: 1000 }}>{t.score}</td>
                </tr>
              ))}

              {filteredTeams.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ color: "rgba(255,255,255,.7)" }}>
                    No matches.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 10, color: "rgba(255,255,255,.7)", fontSize: 12 }}>
          Tip: After importing, go to <b>Assignments</b> → <b>Auto-Assign</b> → Save.
        </div>
      </div>
    </div>
  );
}
