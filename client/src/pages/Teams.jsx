// client/src/pages/Teams.jsx
import { useMemo, useState } from "react";
import { useGame } from "../useGame";
import { addTeams, importTeamsCSV, replaceTeams } from "../api";

export default function Teams() {
  const { game } = useGame();

  const [namesText, setNamesText] = useState("");
  const [csvText, setCsvText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" }); // ok | err
  const [search, setSearch] = useState("");

  const teams = game.teams || [];

  const filteredTeams = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((t) => t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q));
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
      setMsg({ type: "ok", text: "Updated successfully." });
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
    <div className="gh-teams">
      <style>{`
        .gh-teams{
          --bg: #0d1117;
          --panel: #161b22;
          --panel2: #0f141b;
          --border: #30363d;
          --text: #c9d1d9;
          --muted: #8b949e;
          --accent: #0425e0;
          --danger: #f85149;
          --ok: #3fb950;
          --shadow: 0 0 0 1px var(--border);
          color: var(--text);
        }
        .wrap{
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px;
        }

        .header{
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap: 12px;
          margin-bottom: 12px;
        }
        .title{
          font-size: 20px;
          font-weight: 800;
          color: var(--text);
          margin: 0;
        }
        .sub{
          margin-top: 4px;
          font-size: 12px;
          color: var(--muted);
          line-height: 1.35;
        }

        .meta{
          display:flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content:flex-end;
        }
        .chip{
          display:inline-flex;
          align-items:center;
          gap: 8px;
          padding: 6px 10px;
          border-radius: 999px;
          background: var(--panel);
          box-shadow: var(--shadow);
          font-size: 12px;
          color: var(--muted);
          white-space: nowrap;
        }
        .chip b{ color: var(--text); }

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
          min-width: 0;
        }
        .card h2{
          margin: 0 0 8px;
          font-size: 13px;
          font-weight: 800;
          color: var(--text);
        }
        .card p{
          margin: 0 0 10px;
          font-size: 12px;
          color: var(--muted);
          line-height: 1.35;
        }

        .ta{
          width: 95%;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--panel2);
          color: var(--text);
          padding: 10px;
          font-weight: 700;
          outline: none;
          resize: vertical;
          min-height: 160px;
        }
        .ta:focus{
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(4,37,224,.25);
        }

        .row{
          display:flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items:center;
          margin-top: 10px;
        }

        .btn{
          height: 34px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--panel2);
          color: var(--text);
          font-weight: 800;
          cursor: pointer;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          padding: 0 12px;
        }
        .btn:disabled{
          opacity: .6;
          cursor: not-allowed;
        }
        .btn.primary{
          border-color: rgba(4,37,224,.70);
          background: rgba(4,37,224,.18);
        }
        .btn.danger{
          border-color: rgba(248,81,73,.60);
          background: rgba(248,81,73,.12);
          color: #ffd7d5;
        }

        .banner{
          margin-top: 10px;
          border-radius: 6px;
          padding: 8px 10px;
          font-weight: 800;
          border: 1px solid var(--border);
          background: var(--panel2);
          color: var(--text);
        }
        .banner.ok{
          border-color: rgba(63,185,80,.55);
          background: rgba(63,185,80,.10);
          color: #d2fedb;
        }
        .banner.err{
          border-color: rgba(248,81,73,.60);
          background: rgba(248,81,73,.12);
          color: #ffd7d5;
        }

        .big{
          margin-top: 12px;
        }

        .search{
          width: 100%;
          height: 34px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--panel2);
          color: var(--text);
          padding: 0 10px;
          outline: none;
          font-weight: 700;
        }
        .search:focus{
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(4,37,224,.25);
        }

        .tableWrap{
          margin-top: 10px;
          overflow: auto;
          border-radius: 10px;
          box-shadow: var(--shadow);
        }
        table{
          width: 100%;
          border-collapse: collapse;
          min-width: 520px;
          background: var(--panel);
        }
        thead th{
          position: sticky;
          top: 0;
          z-index: 2;
          text-align: left;
          padding: 10px;
          font-size: 11px;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--muted);
          background: #0f141b;
          border-bottom: 1px solid var(--border);
        }
        tbody td{
          padding: 10px;
          border-top: 1px solid rgba(48,54,61,.65);
          color: var(--text);
          font-weight: 700;
        }
        tbody tr:hover{
          background: rgba(4,37,224,.08);
        }

        .foot{
          margin-top: 10px;
          font-size: 12px;
          color: var(--muted);
          line-height: 1.35;
        }

        @media (max-width: 920px){
          .grid{ grid-template-columns: 1fr; }
          table{ min-width: 0; }
          thead th{ position: static; }
          .meta{ justify-content:flex-start; }
        }
      `}</style>

      <div className="wrap">
        <div className="header">
          <div>
            <h1 className="title">TEAMS</h1>
            <div className="sub">
              Add teams manually or import CSV. <b>Order matters:</b> list teams in seat order.
            </div>
          </div>

          <div className="meta">
            <span className="chip">
              Teams: <b>{teams.length}</b>
            </span>
            {busy && <span className="chip">Updating…</span>}
          </div>
        </div>

        {msg.text && <div className={`banner ${msg.type}`}>{msg.text}</div>}

        <div className="grid" style={{ marginTop: 12 }}>
          <div className="card">
            <h2>Paste names</h2>
            <p>One team per line. Best for seat order input.</p>

            <textarea
              className="ta"
              value={namesText}
              onChange={(e) => setNamesText(e.target.value)}
              placeholder={"Team 1\nTeam 2\nTeam 3"}
              disabled={busy}
            />

            <div className="row">
              <button className="btn primary" onClick={onAdd} disabled={busy || !namesText.trim()}>
                Add Teams
              </button>
              <button className="btn danger" onClick={onReplace} disabled={busy || !namesText.trim()}>
                Replace All
              </button>
            </div>
          </div>

          <div className="card">
            <h2>Import CSV text</h2>
            <p>First column is team name. Paste from Sheets/Excel.</p>

            <textarea
              className="ta"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={"Team A\nTeam B\n\nor:\nTeam A,School\nTeam B,School"}
              disabled={busy}
            />

            <div className="row">
              <button className="btn primary" onClick={() => onImport("add")} disabled={busy || !csvText.trim()}>
                Import (Add)
              </button>
              <button className="btn danger" onClick={() => onImport("replace")} disabled={busy || !csvText.trim()}>
                Import (Replace)
              </button>
            </div>
          </div>
        </div>

        <div className="card big">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <h2 style={{ marginBottom: 2 }}>Current Teams</h2>
              <p style={{ margin: 0 }}>Search by team name or ID. Scores update live.</p>
            </div>
            <span className="chip">
              Showing: <b>{filteredTeams.length}</b>
            </span>
          </div>

          <div className="row" style={{ marginTop: 10 }}>
            <input
              className="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
            />
          </div>

          <div className="tableWrap">
            <table>
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
                    <td style={{ fontWeight: 800 }}>{t.name}</td>
                    <td style={{ fontWeight: 800 }}>{t.score}</td>
                  </tr>
                ))}

                {filteredTeams.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ color: "var(--muted)" }}>
                      No matches.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="foot">
            Tip: After importing, go to <b>Assignments</b> → <b>Auto-Assign</b> → Save.
          </div>
        </div>
      </div>
    </div>
  );
}
