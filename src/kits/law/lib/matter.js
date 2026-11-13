// @ts-check
/**
 * "Your matter, by code": the stage a client's matter has reached, from the firm's published Google Sheet (CSV).
 *
 *   code,stage,updated_at
 *   K7M2QXPA,valuing,2026-10-26 11:40
 *
 * A published sheet can be opened by anyone with its link, so it holds only a random code, a stage and a time: never
 * a name, an address, a note or anything about the matter. Codes are 8–12 letters and digits so they can't be guessed.
 * A sheet with anything in any other column, headed or not, is refused as unreadable.
 * Fails closed: an unreadable sheet, an unknown code or stage, or an update older than `staleAfterDays` says to call.
 * Calendar files: all-day reminders, in the visitor's own calendar.
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";

/** @param {string} s @returns {string} the code as typed, cleaned, or "" */
export function cleanMatterCode(s) {
  const c = String(s ?? "").replace(/[\s-]/g, "").toUpperCase();
  return /^[A-Z0-9]{8,12}$/.test(c) ? c : "";
}

/**
 * @typedef {{ ok: true, stage: number, updatedAt: number }} Matter
 * @typedef {{ ok: false, reason: "unreadable" | "unknown" | "stale" }} NoMatter
 */

/**
 * @param {string} csv @param {string} code @param {string[]} stages stage ids in order
 * @param {number} nowMs @param {number} staleAfterDays @param {string} timeZone
 * @returns {Matter | NoMatter}
 */
export function matterFromCsv(csv, code, stages, nowMs, staleAfterDays, timeZone) {
  const rows = parseCsv(csv);
  const head = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
  const at = (/** @type {string} */ k) => head.indexOf(k);
  if (at("code") < 0 || at("stage") < 0 || at("updated_at") < 0) return { ok: false, reason: "unreadable" };
  // Anything in any other column (a name, a note, even without a heading) means the public sheet holds more than it
  // may, so the whole sheet is refused rather than read.
  const allowed = new Set([at("code"), at("stage"), at("updated_at")]);
  if (rows.slice(1).some((r) => r.some((cell, i) => !allowed.has(i) && String(cell ?? "").trim() !== ""))) return { ok: false, reason: "unreadable" };
  const mine = rows.slice(1).filter((r) => code && cleanMatterCode(r[at("code")] ?? "") === code);
  if (mine.length !== 1) return { ok: false, reason: "unknown" };
  const r = mine[0];
  const stage = stages.indexOf((r[at("stage")] ?? "").trim().toLowerCase());
  const updatedAt = parseSheetTime(r[at("updated_at")] ?? "", timeZone);
  if (stage < 0 || !Number.isFinite(updatedAt) || updatedAt > nowMs + 5 * 60_000) return { ok: false, reason: "unreadable" };
  if (nowMs - updatedAt > staleAfterDays * 86_400_000) return { ok: false, reason: "stale" };
  return { ok: true, stage, updatedAt };
}

/** YYYY-MM-DD plus n days. @param {string} ymd @param {number} n */
export function addDaysYmd(ymd, n) {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** "Monday 9 November 2026" @param {string} ymd */
export function longDate(ymd) {
  const d = new Date(`${ymd}T12:00:00Z`);
  const p = (/** @type {Intl.DateTimeFormatOptions} */ o) => d.toLocaleDateString("en-GB", { ...o, timeZone: "UTC" });
  return `${p({ weekday: "long" })} ${p({ day: "numeric", month: "long", year: "numeric" })}`;
}

/**
 * All-day reminders as one calendar file.
 * @param {{ id: string, date: string, title: string, text?: string }[]} items @param {string} prodId @param {Date} stamp
 */
export function remindersIcs(items, prodId, stamp) {
  const esc = (/** @type {string} */ s) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const utc = stamp.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Sitefloor//${prodId}//EN`, "CALSCALE:GREGORIAN",
    ...items.flatMap((x) => [
      "BEGIN:VEVENT", `UID:${x.id}-${x.date}@sitefloor`, `DTSTAMP:${utc}`,
      `DTSTART;VALUE=DATE:${x.date.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${addDaysYmd(x.date, 1).replace(/-/g, "")}`,
      `SUMMARY:${esc(x.title)}`, ...(x.text ? [`DESCRIPTION:${esc(x.text)}`] : []), "END:VEVENT",
    ]),
    "END:VCALENDAR", "",
  ].join("\r\n");
}

/**
 * The firm's opening hours on a weekday, shown in another time zone. @param {[string, string][]} ranges London wall
 * times @param {string} ymd the day @param {string} firmZone @param {string} theirZone
 * @param {(t: { year: number, month: number, day: number, hour: number, minute: number }, zone: string) => number} toUtc
 * @returns {string} e.g. "17:00–02:00 (next day)"
 */
export function hoursIn(ranges, ymd, firmZone, theirZone, toUtc) {
  const [year, month, day] = ymd.split("-").map(Number);
  const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: theirZone });
  const dayOf = new Intl.DateTimeFormat("en-CA", { timeZone: theirZone });
  return ranges.map(([a, b]) => {
    const s = toUtc({ year, month, day, hour: Number(a.slice(0, 2)), minute: Number(a.slice(3)) }, firmZone);
    const e = toUtc({ year, month, day, hour: Number(b.slice(0, 2)), minute: Number(b.slice(3)) }, firmZone);
    const shift = (/** @type {number} */ ms) => { const d = dayOf.format(ms); return d > ymd ? " (next day)" : d < ymd ? " (day before)" : ""; };
    const sd = shift(s), ed = shift(e);
    return `${fmt.format(s)}${sd && sd !== ed ? sd : ""}–${fmt.format(e)}${ed}`;
  }).join(", ");
}
