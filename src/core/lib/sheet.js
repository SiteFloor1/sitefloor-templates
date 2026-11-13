// @ts-check
/** Reading a Google Sheet published as CSV: shared by the chair board and the walk-in queue. */
import { wallTimeToUtc } from "./hours.js";

/**
 * Minimal CSV parser (handles quoted fields with commas and doubled quotes).
 * @param {string} text
 * @returns {string[][]}
 */
export function parseCsv(text) {
  /** @type {string[][]} */
  const rows = [];
  /** @type {string[]} */
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += ch;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/**
 * Reads an updated_at cell. Returns NaN for anything it can't read with certainty
 * (e.g. US-style MM/DD dates are never guessed at).
 * @param {string} text @param {string} timeZone shop timezone for times without an offset
 * @returns {number} ms since epoch, or NaN
 */
export function parseSheetTime(text, timeZone) {
  const s = text.trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(s)) return Date.parse(s);
  let m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s);
  /** @type {number[]} [year, month, day, hour, minute, second] */
  let t;
  if (m) t = [m[1], m[2], m[3], m[4], m[5], m[6] ?? "0"].map(Number);
  else {
    m = /^(\d{1,2})\/(\d{1,2})\/(\d{4}),? (\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s);
    if (!m) return NaN;
    t = [m[3], m[2], m[1], m[4], m[5], m[6] ?? "0"].map(Number);
  }
  const [year, month, day, hour, minute, second] = t;
  const valid = month >= 1 && month <= 12 && day >= 1 && day <= new Date(Date.UTC(year, month, 0)).getUTCDate()
    && hour <= 23 && minute <= 59 && second <= 59;
  return valid ? wallTimeToUtc({ year, month, day, hour, minute, second }, timeZone) : NaN;
}
