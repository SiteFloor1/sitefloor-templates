// @ts-check
/**
 * Private pages read from the florist's own published Google Sheet, by a reference only (never a name): where an
 * order is (follow your order) and a business client's flowers this week. Anything uncertain fails closed, so the
 * page says "message us" rather than guessing.
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";

/** "amb-4k7q" → "AMB4K7Q"; empty if it isn't 4–10 letters and digits. @param {unknown} s */
export function cleanRef(s) {
  const c = String(s ?? "").replace(/[\s-]/g, "").toUpperCase();
  return /^[A-Z0-9]{4,10}$/.test(c) ? c : "";
}

/** Only photos the florist keeps in Google (Drive or Photos); a Drive share link becomes its image URL. @param {unknown} url */
export function photoUrl(url) {
  const s = String(url ?? "").trim();
  const drive = /^https:\/\/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{10,})/.exec(s);
  if (drive) return `https://lh3.googleusercontent.com/d/${drive[1]}`;
  return /^https:\/\/[a-z0-9-]+\.googleusercontent\.com\/[^\s"'<>]+$/i.test(s) ? s : "";
}

/** "just now", "12 minutes ago", "an hour ago". @param {number} ms */
export function agoLabel(ms) {
  const m = Math.max(0, Math.round(ms / 60_000));
  if (m < 2) return "just now";
  if (m < 60) return `${m} minutes ago`;
  const h = Math.round(m / 60);
  if (h < 24) return h === 1 ? "an hour ago" : `${h} hours ago`;
  return h < 48 ? "yesterday" : `${Math.round(h / 24)} days ago`;
}

/** @param {string} csv @param {string} key column holding the reference @param {string} ref */
function rowFor(csv, key, ref) {
  const rows = parseCsv(csv);
  const head = (rows[0] ?? []).map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const at = (/** @type {string} */ k) => head.indexOf(k);
  if (at(key) < 0) return { head, row: null, bad: true };
  const mine = rows.slice(1).filter((r) => ref && cleanRef(r[at(key)]) === ref);
  return { head, row: mine.length === 1 ? mine[0] : null, bad: false }; // none, or the same reference twice
}

/**
 * @typedef {{ ok: true, stage: number, updatedAt: number, note: string, photo: string }} Order
 * @typedef {{ ok: false, reason: "unknown"|"stale"|"unreadable" }} NoResult
 */
/**
 * One order from the Sheet. Columns: ref, stage (a stage id), updated_at, note, photo.
 * @param {string} csv @param {string} ref @param {string[]} stages @param {number} nowMs @param {number} staleHours @param {string} timeZone
 * @returns {Order|NoResult}
 */
export function orderFromCsv(csv, ref, stages, nowMs, staleHours, timeZone) {
  const { head, row, bad } = rowFor(csv, "ref", ref);
  const at = (/** @type {string} */ k) => head.indexOf(k);
  if (bad || at("stage") < 0 || at("updated_at") < 0) return { ok: false, reason: "unreadable" };
  if (!row) return { ok: false, reason: "unknown" };
  const cell = (/** @type {string} */ k) => (at(k) < 0 ? "" : (row[at(k)] ?? "").trim());
  const stage = stages.indexOf(cell("stage").toLowerCase());
  const updatedAt = parseSheetTime(cell("updated_at"), timeZone);
  if (stage < 0 || !Number.isFinite(updatedAt) || updatedAt > nowMs + 5 * 60_000) return { ok: false, reason: "unreadable" };
  if (nowMs - updatedAt > staleHours * 3_600_000) return { ok: false, reason: "stale" };
  return { ok: true, stage, updatedAt, note: cell("note").slice(0, 280), photo: photoUrl(cell("photo")) };
}

/**
 * @typedef {{ ok: true, name: string, weekOf: string, pieces: { place: string, what: string }[], next: string, note: string, photo: string }} Account
 */
/**
 * A business client's flowers this week. Columns: code, name, week_of, pieces ("Lobby: coral roses; Bar: …"),
 * next_change, note, photo, updated_at. A row not updated for `staleDays` says so rather than calling old flowers
 * "this week".
 * @param {string} csv @param {string} code @param {number} nowMs @param {number} staleDays @param {string} timeZone
 * @returns {Account|NoResult}
 */
export function accountFromCsv(csv, code, nowMs, staleDays, timeZone) {
  const { head, row, bad } = rowFor(csv, "code", code);
  const at = (/** @type {string} */ k) => head.indexOf(k);
  if (bad || at("pieces") < 0 || at("updated_at") < 0) return { ok: false, reason: "unreadable" };
  if (!row) return { ok: false, reason: "unknown" };
  const cell = (/** @type {string} */ k, n = 200) => (at(k) < 0 ? "" : (row[at(k)] ?? "").trim().slice(0, n));
  const updatedAt = parseSheetTime(cell("updated_at"), timeZone);
  if (!Number.isFinite(updatedAt) || updatedAt > nowMs + 5 * 60_000) return { ok: false, reason: "unreadable" };
  if (nowMs - updatedAt > staleDays * 86_400_000) return { ok: false, reason: "stale" };
  const pieces = cell("pieces", 1200).split(";").map((p) => p.trim()).filter(Boolean).slice(0, 12).map((p) => {
    const i = p.indexOf(":");
    return i > 0 ? { place: p.slice(0, i).trim(), what: p.slice(i + 1).trim() } : { place: "", what: p };
  });
  if (!pieces.length) return { ok: false, reason: "unreadable" };
  return { ok: true, name: cell("name", 80), weekOf: cell("week_of", 40), pieces, next: cell("next_change", 80), note: cell("note", 280), photo: photoUrl(cell("photo")) };
}
