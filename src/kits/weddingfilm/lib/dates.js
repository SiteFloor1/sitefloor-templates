// @ts-check
/**
 * Is our date free? The studio keeps its diary in a Google Sheet published as CSV: one row per date it has
 * taken, `date,status,updated_at` (status "booked" or "held"; updated_at when the studio last touched the sheet).
 * A date not in the sheet is free. Fails closed: if the sheet can't be read, has no updated_at, or is older than the
 * studio's staleAfterHours, the answer is "ask", never "free". Also the delivery dates worked forward from a wedding.
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";
import { isYmd, addDaysYmd, ukDate } from "../../../core/lib/diary.js";

/** @typedef {"free"|"held"|"booked"|"past"|"ask"} DateAnswer */
/** @typedef {{ ok: true, taken: Map<string, "held"|"booked">, updated: number } | { ok: false, reason: "unreadable"|"stale"|"undated" }} Diary */

/**
 * Reads the studio's sheet. @param {string} text CSV @param {number} now ms @param {string} tz @param {number} staleAfterHours
 * @returns {Diary}
 */
export function diaryFromCsv(text, now, tz, staleAfterHours) {
  const rows = parseCsv(text);
  if (!rows.length) return { ok: false, reason: "unreadable" };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const at = { date: head.indexOf("date"), status: head.indexOf("status"), updated: head.indexOf("updated_at") };
  if (at.date < 0 || at.status < 0 || at.updated < 0) return { ok: false, reason: "unreadable" };
  /** @type {Map<string, "held"|"booked">} */ const taken = new Map();
  let updated = NaN;
  for (const r of rows.slice(1)) {
    const d = (r[at.date] ?? "").trim(), s = (r[at.status] ?? "").trim().toLowerCase(), u = parseSheetTime(r[at.updated] ?? "", tz);
    if (!Number.isNaN(u) && !(u <= updated)) updated = u;
    if (!isYmd(d)) continue;
    // A row the studio can't have meant as free counts as booked: an unknown word never frees a date.
    taken.set(d, s === "held" ? "held" : "booked");
  }
  if (Number.isNaN(updated)) return { ok: false, reason: "undated" };
  // Stamped more than ten minutes ahead: a typo (2027 for 2026) would otherwise keep the diary "fresh" for a year.
  if (updated - now > 10 * 60_000) return { ok: false, reason: "unreadable" };
  if (now - updated > staleAfterHours * 3_600_000) return { ok: false, reason: "stale" };
  return { ok: true, taken, updated };
}

/**
 * The answer for one wedding date. @param {Diary} diary @param {string} ymd @param {string} today YYYY-MM-DD at the studio
 * @returns {DateAnswer}
 */
export function answerFor(diary, ymd, today) {
  if (!isYmd(ymd)) return "ask";
  if (ymd < today) return "past";
  if (!diary.ok) return "ask";
  return diary.taken.get(ymd) ?? "free";
}

/** What the answer says on the page. @type {Record<DateAnswer, string>} */
export const ANSWER_WORDS = {
  free: "is free in our diary.",
  held: "is held for another couple for now. Ask us and we'll tell you if it comes free.",
  booked: "is booked. Ask us about the days either side, or a second team.",
  past: "has passed. Choose a date ahead.",
  ask: "we can't check just now. Send it to us and we'll reply with the answer.",
};

/**
 * The WhatsApp message: the studio's opening, then the date and venue, and what the page said (never "booked for
 * you": nothing is held until the studio replies). @param {string} opening
 * @param {{ date: string, venue?: string, answer: DateAnswer, sunset?: string }} o
 */
export function dateText(opening, o) {
  const lines = [opening.trim(), "", `Wedding: ${isYmd(o.date) ? ukDate(o.date) : "date to follow"}`];
  if (o.venue?.trim()) lines.push(`Venue: ${o.venue.trim()}`);
  if (o.answer === "free") lines.push("Your site shows the date as free. Could you hold it while we talk?");
  else if (o.answer === "held") lines.push("Your site shows the date as held. Could you let us know if it comes free?");
  else if (o.answer === "booked") lines.push("Your site shows the date as booked. Do you have a second team, or the days either side?");
  if (o.sunset) lines.push(`Sunset that day: ${o.sunset}`);
  return lines.join("\n");
}

/**
 * When each part of the work arrives, from the studio's own timings (weeks after the wedding), earliest first.
 * @param {string} wedding YYYY-MM-DD @param {{ id: string, label: string, weeksAfter: number }[]} steps
 */
export function deliveryDates(wedding, steps) {
  return steps.map((s) => ({ ...s, date: addDaysYmd(wedding, 7 * s.weeksAfter) })).sort((a, b) => a.weeksAfter - b.weeksAfter);
}
