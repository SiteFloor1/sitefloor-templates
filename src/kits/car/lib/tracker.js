// @ts-check
/**
 * "Your car, live": where a customer's car is in the studio, from the studio's published Google Sheet (CSV).
 * One row per car in, found by the code the studio gave the customer:
 *
 *   code,stage,updated_at,note,photo
 *   K7M2QX,fitting,2026-10-26 11:40,Fronts done; rears next,https://drive.google.com/file/d/…/view
 *
 * The published CSV can be opened by anyone who has its link, so the sheet holds no names, number plates or phone
 * numbers: a random code, a stage, a time, a short note and a photo of the car (no plate, no people).
 * Fails closed: an unreadable sheet, an unknown code or stage, or an update older than `staleAfterHours` returns
 * { ok: false } with the reason, and the page says to message the studio.
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";

/** A code as the customer might type it: spaces and dashes dropped, capitals. 4–10 letters and digits, or "". @param {string} s */
export function cleanCode(s) {
  const c = String(s ?? "").replace(/[\s-]/g, "").toUpperCase();
  return /^[A-Z0-9]{4,10}$/.test(c) ? c : "";
}

/**
 * A photo link the page may show: a Google Drive share link becomes its image link; a googleusercontent.com image
 * stays; anything else is dropped (the page's security policy only allows Google's image host).
 * @param {string} url @returns {string}
 */
export function photoUrl(url) {
  const s = String(url ?? "").trim();
  const drive = /^https:\/\/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{10,})/.exec(s);
  if (drive) return `https://lh3.googleusercontent.com/d/${drive[1]}`;
  return /^https:\/\/[a-z0-9-]+\.googleusercontent\.com\/[^\s"'<>]+$/i.test(s) ? s : "";
}

/**
 * @typedef {{ ok: true, stage: number, updatedAt: number, note: string, photo: string }} Job
 * @typedef {{ ok: false, reason: "unreadable" | "unknown" | "stale" }} NoJob
 */

/**
 * @param {string} csv @param {string} code from cleanCode @param {string[]} stages the stage ids, in order
 * @param {number} nowMs @param {number} staleAfterHours @param {string} timeZone
 * @returns {Job | NoJob}
 */
export function jobFromCsv(csv, code, stages, nowMs, staleAfterHours, timeZone) {
  const rows = parseCsv(csv);
  const head = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
  const at = (/** @type {string} */ k) => head.indexOf(k);
  if (at("code") < 0 || at("stage") < 0 || at("updated_at") < 0) return { ok: false, reason: "unreadable" };
  const mine = rows.slice(1).filter((r) => cleanCode(r[at("code")] ?? "") === code && code);
  if (mine.length !== 1) return { ok: false, reason: "unknown" }; // none, or the studio used a code twice
  const r = mine[0];
  const stage = stages.indexOf((r[at("stage")] ?? "").trim().toLowerCase());
  const updatedAt = parseSheetTime(r[at("updated_at")] ?? "", timeZone);
  if (stage < 0 || !Number.isFinite(updatedAt) || updatedAt > nowMs + 5 * 60_000) return { ok: false, reason: "unreadable" };
  if (nowMs - updatedAt > staleAfterHours * 3_600_000) return { ok: false, reason: "stale" };
  const cell = (/** @type {string} */ k) => (at(k) < 0 ? "" : (r[at(k)] ?? "").trim());
  return { ok: true, stage, updatedAt, note: cell("note").slice(0, 280), photo: photoUrl(cell("photo")) };
}

/** "just now", "12 minutes ago", "3 hours ago", "yesterday". @param {number} ms */
export function agoText(ms) {
  const m = Math.max(0, Math.round(ms / 60_000));
  if (m < 2) return "just now";
  if (m < 60) return `${m} minutes ago`;
  const h = Math.round(m / 60);
  if (h < 24) return h === 1 ? "an hour ago" : `${h} hours ago`;
  return h < 48 ? "yesterday" : `${Math.round(h / 24)} days ago`;
}
