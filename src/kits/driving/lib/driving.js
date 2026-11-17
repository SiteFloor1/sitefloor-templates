// @ts-check
/**
 * The driving kit's logic, no DOM: prices and block savings, "do you cover me?", the next free lessons and the
 * learner's progress card (both from the instructor's Google Sheet), "when could I pass?" and the cost to pass.
 * Every price and area is the instructor's own. The only outside figures are the DVSA's published averages (45 hours
 * of lessons and 22 of private practice) and the test fees from gov.uk, which the site stores with the date they were
 * checked. Nothing here invents a figure, and nothing reads as a promise.
 *
 * Next free lessons, published as CSV (only the free lessons, no names):
 *
 *   date,time,hours,gearbox,updated_at
 *   2026-11-19,16:00,2,manual,2026-11-17 08:10
 *
 * Learner progress, published as CSV (one row per learner, keyed by a code the instructor gives them; no names):
 *
 *   code,lessons,last_lesson,covered,practise,<skill columns…>,updated_at
 *
 * Fails closed: an unreadable or old sheet returns { ok: false } and the page shows no slots or no card.
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";
import { isTime, toMinutes, wallTimeToUtc } from "../../../core/lib/hours.js";
import { addDaysYmd, isYmd } from "../../../core/lib/diary.js";

/** The DVSA's published averages (Ready to Pass?): hours of professional lessons, and of private practice. */
export const DVSA_HOURS = 45;
export const DVSA_PRACTICE = 22;
/** Test fees are shown only while the date they were checked on gov.uk is this recent. */
export const FEES_FRESH_DAYS = 183;
/** The DVSA's five levels of progress, from first meeting a skill to doing it alone. */
export const LEVELS = ["Introduced", "Under full instruction", "Prompted", "Seldom prompted", "Independent"];

/** "£1,250". @param {number} n */
export const pounds = (n) => `£${Math.round(n).toLocaleString("en-GB")}`;

/** What a lesson in a block works out at, and what the block saves against single hours (never negative). @param {number} hourly @param {number} hours @param {number} price */
export function blockSaving(hourly, hours, price) {
  return { perHour: Math.round((price / hours) * 100) / 100, saving: Math.max(0, Math.round(hourly * hours - price)) };
}

/**
 * A UK postcode's district ("E14" from "E14 9GE" or "e14"), or null.
 * @param {string} postcode @returns {string|null}
 */
export function districtOf(postcode) {
  const s = String(postcode ?? "").toUpperCase().replace(/\s+/g, "");
  const full = s.match(/^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})$/);
  if (full) return full[1];
  return /^[A-Z]{1,2}\d[A-Z\d]?$/.test(s) ? s : null;
}

/**
 * Do you cover me? From the instructor's own districts. `name` is the area's name in their words.
 * @param {string} postcode @param {{ district: string, name: string }[]} districts
 * @returns {{ state: "bad" } | { state: "yes", district: string, name: string } | { state: "no", district: string }}
 */
export function coverAnswer(postcode, districts) {
  const district = districtOf(postcode);
  if (!district) return { state: "bad" };
  const hit = districts.find((d) => d.district.toUpperCase() === district);
  return hit ? { state: "yes", district, name: hit.name } : { state: "no", district };
}

/**
 * When could I pass? Hours still to go on the DVSA's average, the weeks they take at the hours a week chosen, and the
 * date that lands on. An estimate: the page says so, and an instructor says when a learner is ready.
 * @param {{ perWeek: number, soFar: number, today: string, average?: number }} o
 * @returns {{ left: number, weeks: number, ready: string|null }}
 */
export function passPlan({ perWeek, soFar, today, average = DVSA_HOURS }) {
  const left = Math.max(0, average - Math.max(0, soFar));
  if (!left) return { left: 0, weeks: 0, ready: null };
  const weeks = Math.max(1, Math.ceil(left / perWeek));
  return { left, weeks, ready: addDaysYmd(today, weeks * 7) };
}

/** Rounded to the nearest £10: an estimate never shows pennies. @param {number} n */
export const roundTen = (n) => Math.round(n / 10) * 10;

/**
 * The cost to pass: the hours still to go at the rate they'd be booked at (a block or the intensive course, the
 * instructor's own prices), plus the practical test and, if it isn't passed yet, the theory test (gov.uk fees, while
 * they are fresh). Rounded; the page calls it an estimate.
 * @param {{ left: number, rate: number, fees: { practical: number, theory: number } | null, theoryPassed: boolean }} o
 * @returns {{ total: number, lessons: number, practical: number, theory: number }}
 */
export function costToPass({ left, rate, fees, theoryPassed }) {
  const lessons = left * rate;
  const practical = fees ? fees.practical : 0;
  const theory = fees && !theoryPassed ? fees.theory : 0;
  return { total: roundTen(lessons + practical + theory), lessons: roundTen(lessons), practical, theory };
}

/** Are the stored gov.uk fees recent enough to show? @param {string} checked "YYYY-MM-DD" @param {string} today */
export function feesFresh(checked, today) {
  if (!isYmd(checked) || !isYmd(today)) return false;
  const age = (Date.parse(today) - Date.parse(checked)) / 86_400_000;
  return age >= 0 && age <= FEES_FRESH_DAYS;
}

/** @typedef {{ date: string, time: string, hours: number, gearbox: "manual"|"automatic" }} Slot */
/** @typedef {{ ok: true, slots: Slot[], updatedAt: number } | { ok: false }} Slots */

/**
 * Reads the instructor's free lessons. Past lessons drop off; a row written outside the expected columns (a name, a
 * phone number) or an old sheet fails the whole read, so nothing private or stale is shown.
 * @param {string} csv @param {number} nowMs @param {string} tz @param {number} staleAfterHours
 * @returns {Slots}
 */
export function slotsFromCsv(csv, nowMs, tz, staleAfterHours) {
  const rows = parseCsv(csv);
  if (rows.length < 1) return { ok: false };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const at = { date: head.indexOf("date"), time: head.indexOf("time"), hours: head.indexOf("hours"), gearbox: head.indexOf("gearbox"), updated: head.indexOf("updated_at") };
  if (Object.values(at).some((i) => i < 0)) return { ok: false };
  const keep = new Set(Object.values(at));
  if (rows.slice(1).some((r) => r.some((v, j) => !keep.has(j) && String(v ?? "").trim() !== ""))) return { ok: false };
  let updatedAt = 0;
  /** @type {Slot[]} */
  const slots = [];
  for (const r of rows.slice(1)) {
    const stamp = parseSheetTime(String(r[at.updated] ?? ""), tz);
    if (Number.isFinite(stamp)) updatedAt = Math.max(updatedAt, stamp);
    const date = String(r[at.date] ?? "").trim(), time = String(r[at.time] ?? "").trim();
    const hours = Number(String(r[at.hours] ?? "").trim()), gearbox = String(r[at.gearbox] ?? "").trim().toLowerCase();
    if (!isYmd(date) || !isTime(time) || !(hours > 0 && hours <= 8) || !["manual", "automatic"].includes(gearbox)) continue;
    const [yy, mm, dd] = date.split("-").map(Number), mins = toMinutes(time);
    if (wallTimeToUtc({ year: yy, month: mm, day: dd, hour: Math.floor(mins / 60), minute: mins % 60 }, tz) <= nowMs) continue;
    slots.push({ date, time, hours, gearbox: /** @type {Slot["gearbox"]} */ (gearbox) });
  }
  if (!updatedAt || updatedAt > nowMs + 5 * 60_000 || nowMs - updatedAt > staleAfterHours * 3_600_000) return { ok: false };
  slots.sort((a, b) => (a.date + a.time < b.date + b.time ? -1 : 1));
  return { ok: true, slots, updatedAt };
}

/** "4pm", "9:30am", from "16:00". @param {string} hhmm */
export function clock(hhmm) {
  const m = toMinutes(hhmm), h = Math.floor(m / 60), min = m % 60;
  return `${((h + 11) % 12) + 1}${min ? `:${String(min).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`;
}

/** "4–6pm", "11am–1pm". @param {string} start @param {number} hours */
export function span(start, hours) {
  const a = toMinutes(start), b = a + Math.round(hours * 60);
  const end = `${String(Math.floor(b / 60) % 24).padStart(2, "0")}:${String(b % 60).padStart(2, "0")}`;
  const ca = clock(start), cb = clock(end);
  return ca.slice(-2) === cb.slice(-2) ? `${ca.slice(0, -2)}–${cb}` : `${ca}–${cb}`;
}

/** Learner codes: letters and digits, 6 to 12, no names. */
export const CODE = /^[A-Z0-9]{6,12}$/;

/**
 * @typedef {{ ok: true, learner: { lessons: number, last: string|null, covered: string, practise: string, skills: { skill: string, level: number }[] }, updatedAt: number }
 *   | { ok: false, reason: "code"|"unknown"|"sheet" }} Progress
 */

/**
 * A learner's card from the instructor's sheet, by code. Skill columns are the instructor's own list (`skills`, in
 * their order); each cell is a level from 1 (Introduced) to 5 (Independent), or blank for not started.
 * @param {string} csv @param {string} code @param {number} nowMs @param {string} tz @param {number} staleAfterHours @param {string[]} skills
 * @returns {Progress}
 */
export function progressFromCsv(csv, code, nowMs, tz, staleAfterHours, skills) {
  const want = String(code ?? "").toUpperCase().replace(/\s+/g, "");
  if (!CODE.test(want)) return { ok: false, reason: "code" };
  const rows = parseCsv(csv);
  if (rows.length < 1) return { ok: false, reason: "sheet" };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const col = (/** @type {string} */ k) => head.indexOf(k.toLowerCase());
  const at = { code: col("code"), lessons: col("lessons"), last: col("last_lesson"), covered: col("covered"), practise: col("practise"), updated: col("updated_at") };
  if (Object.values(at).some((i) => i < 0) || skills.some((s) => col(s) < 0)) return { ok: false, reason: "sheet" };
  const row = rows.slice(1).find((r) => String(r[at.code] ?? "").toUpperCase().replace(/\s+/g, "") === want);
  if (!row) return { ok: false, reason: "unknown" };
  const updatedAt = parseSheetTime(String(row[at.updated] ?? ""), tz);
  if (!Number.isFinite(updatedAt) || updatedAt > nowMs + 5 * 60_000 || nowMs - updatedAt > staleAfterHours * 3_600_000) return { ok: false, reason: "sheet" };
  const last = String(row[at.last] ?? "").trim();
  const lessons = Number(String(row[at.lessons] ?? "").trim());
  return {
    ok: true,
    updatedAt,
    learner: {
      lessons: Number.isInteger(lessons) && lessons >= 0 ? lessons : 0,
      last: isYmd(last) ? last : null,
      covered: String(row[at.covered] ?? "").trim(),
      practise: String(row[at.practise] ?? "").trim(),
      skills: skills.map((skill) => {
        const v = Number(String(row[col(skill)] ?? "").trim());
        return { skill, level: Number.isInteger(v) && v >= 1 && v <= 5 ? v : 0 };
      }),
    },
  };
}

/** The demo's sample dates: the next given weekdays (0 = Sunday) after today, each once, in order. @param {string} today @param {number[]} weekdays */
export function nextWeekdays(today, weekdays) {
  const [y, m, d] = today.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return weekdays.map((w) => addDaysYmd(today, ((w - dow + 7) % 7) || 7)).sort();
}
