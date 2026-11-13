// @ts-check
/**
 * Your film's progress: a code the studio gives the couple, looked up in the studio's sheet published as CSV.
 * Columns: code, wedding, stage, trailer, photographs, note, updated_at.
 * The published sheet is public: anyone can download it from the page. So it holds codes and dates only, never
 * names and never links; a sheet with a link in any cell is refused, and the studio sends films and galleries privately.
 * `stage` is where the film is: footage, edit, colour, sound or delivered. `trailer` and `photographs` are each
 * "delivered", an expected date (YYYY-MM-DD) or blank (no date yet). The sheet holds codes, never names.
 * Fails closed: an unknown code, an unreadable or stale sheet shows nothing but the reason; a stage word the page
 * doesn't know counts as the first stage, so the page never says the film is further on than the studio wrote.
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";
import { isYmd } from "../../../core/lib/diary.js";

/** The film's stages, in order, with what the couple reads. */
export const STAGES = /** @type {const} */ ([
  { id: "footage", label: "Footage in", text: "Every card from your day is backed up twice and logged." },
  { id: "edit", label: "In the edit", text: "We're choosing the moments and the music." },
  { id: "colour", label: "Colour", text: "Grading every shot so the day looks like it felt." },
  { id: "sound", label: "Sound", text: "Vows, speeches and music, mixed and levelled." },
  { id: "delivered", label: "Delivered", text: "Your film is ready." },
]);

/** @typedef {{ state: "delivered" } | { state: "due", date: string } | { state: "waiting" }} Part */
/**
 * @typedef {{ ok: true, wedding: string, stage: number, trailer: Part, photographs: Part|null, note: string, updated: number }
 *   | { ok: false, reason: "unreadable"|"stale"|"unknown"|"short" }} Progress
 */

/** Codes are letters and digits, 6–16, case ignored. @param {string} raw */
export const cleanCode = (raw) => raw.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 16);

/** @param {string} v @returns {Part} */
function part(v) {
  const s = v.trim().toLowerCase();
  if (s === "delivered") return { state: "delivered" };
  if (isYmd(s)) return { state: "due", date: s };
  return { state: "waiting" };
}

/** A link anywhere in the sheet: refused, because the sheet is public. */
const LINK = /:\/\/|www\.|\.(com|co\.uk|uk|net|org|io|app|link)\b\/?/i;

/** An update stamped more than this far ahead is a typo, not a fresh sheet. */
export const FUTURE_SLACK_MS = 10 * 60_000;

/** Which stage, 0–4; a word it doesn't know is stage 0. @param {string} v */
export const stageOf = (v) => Math.max(0, STAGES.findIndex((s) => s.id === v.trim().toLowerCase()));

/**
 * @param {string} text CSV @param {string} code as typed @param {number} now ms @param {string} tz @param {number} staleAfterHours
 * @returns {Progress}
 */
export function progressFromCsv(text, code, now, tz, staleAfterHours) {
  const want = cleanCode(code);
  if (want.length < 6) return { ok: false, reason: "short" };
  const rows = parseCsv(text);
  if (!rows.length || rows.some((r) => r.some((c) => LINK.test(c)))) return { ok: false, reason: "unreadable" };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const col = (/** @type {string} */ k) => head.indexOf(k);
  if (["code", "wedding", "stage", "trailer", "updated_at"].some((k) => col(k) < 0)) return { ok: false, reason: "unreadable" };
  const row = rows.slice(1).find((r) => cleanCode(r[col("code")] ?? "") === want);
  if (!row) return { ok: false, reason: "unknown" };
  const updated = parseSheetTime(row[col("updated_at")] ?? "", tz);
  if (Number.isNaN(updated) || updated - now > FUTURE_SLACK_MS) return { ok: false, reason: "unreadable" };
  if (now - updated > staleAfterHours * 3_600_000) return { ok: false, reason: "stale" };
  const cell = (/** @type {string} */ k) => (col(k) < 0 ? "" : row[col(k)] ?? "");
  const wedding = cell("wedding").trim();
  return {
    ok: true, wedding: isYmd(wedding) ? wedding : "", stage: stageOf(cell("stage")),
    trailer: part(cell("trailer")), photographs: col("photographs") < 0 ? null : part(cell("photographs")),
    note: cell("note").trim().slice(0, 280), updated,
  };
}
