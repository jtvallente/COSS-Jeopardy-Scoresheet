// server/src/persist.js
import fs from "fs/promises";
import path from "path";

/**
 * Writes JSON atomically:
 * 1) write to temp file
 * 2) rename over target file
 */
async function atomicWriteJson(filePath, data) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  const tmp = `${filePath}.tmp`;
  const json = JSON.stringify(data, null, 2);

  await fs.writeFile(tmp, json, "utf8");
  await fs.rename(tmp, filePath);
}

/**
 * Reads JSON if file exists.
 */
async function readJsonIfExists(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    if (e?.code === "ENOENT") return null;
    throw e;
  }
}

/**
 * Very light schema sanity check — prevents loading garbage JSON.
 */
function isValidGameShape(game) {
  return (
    game &&
    typeof game === "object" &&
    game.state &&
    typeof game.state === "object" &&
    Array.isArray(game.teams) &&
    Array.isArray(game.proctors) &&
    game.tieBreaker &&
    typeof game.tieBreaker === "object"
  );
}

/**
 * Creates a debounced saver so 50 rapid updates only write once.
 */
export function createGamePersister({ filePath, getGame }) {
  let timer = null;
  let pending = false;
  let lastError = null;

  async function flush() {
    timer = null;
    pending = true;
    try {
      await atomicWriteJson(filePath, getGame());
      lastError = null;
    } catch (e) {
      lastError = e;
      console.error("[PERSIST] Save failed:", e);
    } finally {
      pending = false;
    }
  }

  function scheduleSave(delayMs = 200) {
    if (timer) return; // already scheduled
    timer = setTimeout(flush, delayMs);
  }

  async function saveNow() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    await flush();
  }

  async function load() {
    const data = await readJsonIfExists(filePath);
    if (!data) return { ok: false, reason: "NO_FILE" };
    if (!isValidGameShape(data)) return { ok: false, reason: "INVALID_SHAPE" };
    return { ok: true, game: data };
  }

  function getStatus() {
    return {
      filePath,
      pending,
      lastError: lastError ? String(lastError?.message || lastError) : null,
    };
  }

  return { scheduleSave, saveNow, load, getStatus };
}
