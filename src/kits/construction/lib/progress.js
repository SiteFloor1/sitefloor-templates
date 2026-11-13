// @ts-check
/**
 * "Your house, this week": where a client's build has reached, from the builder's published Google Sheet (CSV).
 *
 *   code,stage,updated_at,done,next,photo
 *   PG4K7M2Q,envelope,2026-11-02 16:10,Trusses fixed on the new wing.,Roofer on site Monday.,https://drive.google.com/file/d/…/view
 *
 * A published sheet can be opened by anyone with its link, so it holds only a random code, the stage, a time, two
 * short lines about the work (never a name, an address or a door code) and, if the builder wants, one photograph
 * shared from Google Drive. Codes are 8–12 letters and digits so they can't be guessed. Anything in any other column,
 * headed or not, means the sheet holds more than it may, and the whole sheet is refused.
 * Fails closed: an unreadable sheet, an unknown code or stage, or an update older than `staleAfterDays` says to call.
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";

/** The longest line the sheet may give for "done" or "next". */
export const LINE_MAX = 240;

/** @param {string} s @returns {string} the code as typed, cleaned, or "" */
export function cleanCode(s) {
  const c = String(s ?? "").replace(/[\s-]/g, "").toUpperCase();
  return /^[A-Z0-9]{8,12}$/.test(c) ? c : "";
}

/**
 * A Google Drive share link (or file id) as a picture the page can show, or "" for anything else. Only Drive's own
 * thumbnail address is allowed (the site's security policy lists it), at a width that suits the page.
 * @param {string} link @param {number} [width]
 */
export function drivePhoto(link, width = 1600) {
  const s = String(link ?? "").trim();
  if (!s) return "";
  const m = /^https:\/\/drive\.google\.com\/(?:file\/d\/([\w-]{20,})|open\?id=([\w-]{20,})|uc\?(?:export=\w+&)?id=([\w-]{20,})|thumbnail\?id=([\w-]{20,}))/.exec(s);
  const id = m ? (m[1] ?? m[2] ?? m[3] ?? m[4]) : "";
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${Math.round(width)}` : "";
}

/**
 * @typedef {{ ok: true, stage: number, updatedAt: number, done: string, next: string, photo: string }} Update
 * @typedef {{ ok: false, reason: "unreadable" | "unknown" | "stale" }} NoUpdate
 */

const COLUMNS = ["code", "stage", "updated_at", "done", "next", "photo"];

/**
 * @param {string} csv @param {string} code @param {string[]} stages stage ids in order
 * @param {number} nowMs @param {number} staleAfterDays @param {string} timeZone
 * @returns {Update | NoUpdate}
 */
export function progressFromCsv(csv, code, stages, nowMs, staleAfterDays, timeZone) {
  const rows = parseCsv(csv);
  const head = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
  const at = (/** @type {string} */ k) => head.indexOf(k);
  if (at("code") < 0 || at("stage") < 0 || at("updated_at") < 0) return { ok: false, reason: "unreadable" };
  const allowed = new Set(COLUMNS.map(at).filter((i) => i >= 0));
  if (rows.slice(1).some((r) => r.some((cell, i) => !allowed.has(i) && String(cell ?? "").trim() !== ""))) return { ok: false, reason: "unreadable" };
  const mine = rows.slice(1).filter((r) => code && cleanCode(r[at("code")] ?? "") === code);
  if (mine.length !== 1) return { ok: false, reason: "unknown" };
  const r = mine[0];
  const cell = (/** @type {string} */ k) => (at(k) >= 0 ? String(r[at(k)] ?? "").trim() : "");
  const stage = stages.indexOf(cell("stage").toLowerCase());
  const updatedAt = parseSheetTime(cell("updated_at"), timeZone);
  if (stage < 0 || !Number.isFinite(updatedAt) || updatedAt > nowMs + 5 * 60_000) return { ok: false, reason: "unreadable" };
  if (nowMs - updatedAt > staleAfterDays * 86_400_000) return { ok: false, reason: "stale" };
  const line = (/** @type {string} */ k) => { const t = cell(k).replace(/\s+/g, " "); return t.length > LINE_MAX ? `${t.slice(0, LINE_MAX - 1).trimEnd()}…` : t; };
  return { ok: true, stage, updatedAt, done: line("done"), next: line("next"), photo: drivePhoto(cell("photo")) };
}

/** "within the hour", "3 hours ago", "yesterday", "4 days ago" @param {number} ms */
export function agoWords(ms) {
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return "within the hour";
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  if (h < 48) return "yesterday";
  return `${Math.round(h / 24)} days ago`;
}
