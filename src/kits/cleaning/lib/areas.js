// @ts-check
/**
 * Where the company cleans, and its next free days. Postcode districts are the company's own list. Free days come from
 * its Google Sheet (or the demo's simulation) as CSV `district,date,updated_at`; a sheet older than the company's
 * `staleAfterDays`, unreadable or missing gives { ok: false } and the site says "ask us", never a date.
 */
import { DAY_NAMES } from "../../../core/lib/hours.js";
import { MONTHS } from "../../../core/lib/diary.js";

/**
 * The outward code of a UK postcode ("sw4 7aa" → "SW4", "SW1A1AA" → "SW1A", "sw4" → "SW4"), or null.
 * @param {string} input
 */
export function outward(input) {
  const s = String(input ?? "").toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z]{1,2}\d[A-Z\d]?(\d[A-Z]{2})?$/.test(s)) return null;
  return s.length >= 5 && /\d[A-Z]{2}$/.test(s) ? s.slice(0, -3) : s;
}

/** A district as the company writes it ("SW4", "SW1", "EC1A"). @param {string} z */
export const isDistrict = (z) => /^[A-Z]{1,2}\d[A-Z\d]?$/.test(z);

/** Whether an outward code is covered. "SW1" covers SW1A–SW1Y but not SW10. @param {string} code @param {string[]} districts */
export function covered(code, districts) {
  return districts.some((z) => code === z || (code.length === z.length + 1 && code.startsWith(z) && /[A-Z]$/.test(code)));
}

/** @typedef {{ ok: true, days: Record<string, string[]> } | { ok: false }} FreeDays district → dates (YYYY-MM-DD), soonest first */

/**
 * Free days from the sheet's CSV, kept only if fresh, only from today on.
 * @param {string} csv @param {string} today YYYY-MM-DD @param {number} staleAfterDays @returns {FreeDays}
 */
export function freeDaysFromCsv(csv, today, staleAfterDays) {
  const rows = String(csv).trim().split(/\r?\n/).map((l) => l.split(",").map((x) => x.trim()));
  const head = rows.shift() ?? [];
  const at = (/** @type {string} */ k) => head.indexOf(k);
  const [iD, iDate, iUp] = [at("district"), at("date"), at("updated_at")];
  if (iD < 0 || iDate < 0 || iUp < 0) return { ok: false };
  let newest = "";
  /** @type {Record<string, string[]>} */ const days = {};
  for (const r of rows) {
    const d = (r[iD] ?? "").toUpperCase(), date = r[iDate] ?? "", up = (r[iUp] ?? "").slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(up) && up > newest) newest = up;
    if (!isDistrict(d) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < today) continue;
    (days[d] ||= []).push(date);
  }
  if (!newest) return { ok: false };
  const age = (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${newest}T00:00:00Z`)) / 864e5;
  if (age > staleAfterDays || age < -1) return { ok: false };
  for (const k of Object.keys(days)) days[k].sort();
  return { ok: true, days };
}

/** "Tuesday 24 November" @param {string} ymd */
export function dayWords(ymd) {
  const d = new Date(`${ymd}T12:00:00Z`);
  return `${DAY_NAMES[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/**
 * What to say to someone who typed a postcode.
 * @param {string} input @param {string[]} districts @param {FreeDays|null} free null when the site shows no free days
 * @returns {{ state: "invalid"|"no"|"yes", code: string|null, text: string, days: string[] }}
 */
export function areaAnswer(input, districts, free) {
  const code = outward(input);
  if (!code) return { state: "invalid", code: null, text: "That doesn't look like a UK postcode. Try the first half, like SW4.", days: [] };
  const zone = districts.find((z) => covered(code, [z]));
  if (!zone) return { state: "no", code, text: `We don't clean in ${code} yet.`, days: [] };
  if (!free) return { state: "yes", code, text: `Yes, we clean in ${code}.`, days: [] };
  if (!free.ok) return { state: "yes", code, text: `Yes, we clean in ${code}. Ask us for the next free day.`, days: [] };
  const days = (free.days[zone] ?? []).slice(0, 3);
  return { state: "yes", code, text: days.length ? `Yes, we clean in ${code}. Next free: ${dayWords(days[0])}.` : `Yes, we clean in ${code}. Ask us for the next free day.`, days };
}
