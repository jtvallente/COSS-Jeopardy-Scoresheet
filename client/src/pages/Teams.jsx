// client/src/pages/Teams.jsx
import { useState } from "react";
import { useGame } from "../useGame";
import { addTeams, importTeamsCSV, replaceTeams } from "../api";

export default function Teams() {
  const { game } = useGame();
  const [namesText, setNamesText] = useState("");
  const [csvText, setCsvText] = useState("");

  const teams = game.teams || [];

  async function onReplace() {
    const names = namesText.split("\n").map(s => s.trim()).filter(Boolean);
    await replaceTeams(names);
    setNamesText("");
  }

  async function onAdd() {
    const names = namesText.split("\n").map(s => s.trim()).filter(Boolean);
    await addTeams(names);
    setNamesText("");
  }

  async function onImport(mode) {
    await importTeamsCSV(csvText, mode);
    setCsvText("");
  }

  return (
    <div className="grid">
      <div className="card">
        <div className="h1">Teams</div>
        <div className="muted">Add manually or import CSV. (Live updates)</div>

        <div className="row" style={{ marginTop: 10 }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div className="muted">Paste team names (one per line)</div>
            <textarea
              className="input"
              rows={6}
              value={namesText}
              onChange={(e) => setNamesText(e.target.value)}
              placeholder={"Team 1\nTeam 2\nTeam 3"}
            />
            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn" onClick={onAdd} disabled={!namesText.trim()}>
                Add Teams
              </button>
              <button className="btn secondary" onClick={onReplace} disabled={!namesText.trim()}>
                Replace All Teams
              </button>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 280 }}>
            <div className="muted">Import CSV text (first column = team name)</div>
            <textarea
              className="input"
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={"Team A\nTeam B\nTeam C\n\nor:\nTeam A,School\nTeam B,School"}
            />
            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn" onClick={() => onImport("add")} disabled={!csvText.trim()}>
                Import (Add)
              </button>
              <button className="btn secondary" onClick={() => onImport("replace")} disabled={!csvText.trim()}>
                Import (Replace)
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="h1">Current Teams ({teams.length})</div>
        <table className="table" style={{ marginTop: 10 }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {teams.map(t => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.name}</td>
                <td><b>{t.score}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
