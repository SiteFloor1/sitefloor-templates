// @ts-check
/**
 * Date-range logic for the shared date picker (src/features/date-range): which days a customer can choose, which times,
 * and whether a chosen range is allowed. Pure functions, no DOM, no prices (each kit prices a range itself).
 *
 * Everything runs on the business's own UK clock (`now` comes from zonedNow), never the visitor's. A day can be:
 *   past    before today
 *   far     beyond the business's booking horizon
 *   taken   blocked on the business's Sheet (only when the Sheet was read; an unreadable Sheet blocks nothing)
 *   closed  the business is shut (hours, exceptions, bank holidays): no pick-up or return that day, but a hire can run
 *           through it
 *   soon    open, but inside the lead time (no time left that day once the notice is counted)
 *   free    can be chosen
 */
import { addDays, rangesFor, toMinutes, wallTimeToUtc, DAY_NAMES } from "./hours.js";
import { bankHolidays } from "./bank-holidays.js";

/** @typedef {import("./hours.js").Hours} Hours */
/** @typedef {import("./hours.js").ZonedNow} ZonedNow */
/** @typedef {import("./bank-holidays.js").Region} Region */
/** @typedef {"past"|"far"|"taken"|"closed"|"soon"|"free"} DayState */

/**
 * @typedef {object} RangeRules
 * @property {Hours} hours           the business's opening hours (exceptions win over the weekly pattern)
 * @property {Region} region         for bank holidays
 * @property {"closed"|"open"} bankHolidays  how the business treats bank holidays (an hours exception for the date wins)
 * @property {number} horizonDays    how far ahead the calendar goes, counted from today
 * @property {number} [leadHours]    notice needed before a pick-up (or an appointment), in hours; 0 if none
 * @property {boolean} [single]      one date (an appointment), not a start and an end
 * @property {number} [minDays]      shortest range (24-hour periods with times, nights without); default 1
 * @property {number} [maxDays]      longest range, same units
 * @property {string[]} [slots]      the business's own times ("HH:MM"); a slot is offered on a day only inside its hours
 * @property {number} [slotMinutes]  how long what starts at a slot lasts (an appointment); a slot is offered only if it ends by
 *                                   closing. 0 (default): a moment, such as a hand-over, may be at closing time itself
 */

/** @typedef {{ status: "ok", dates: string[] } | { status: "error" } | null} Blocked  what the Sheet said; null = no Sheet */

/**
 * @typedef {object} Selection
 * @property {string} [from]      YYYY-MM-DD (the date, for single mode)
 * @property {string} [to]        YYYY-MM-DD
 * @property {string} [fromTime]  HH:MM, one of the slots
 * @property {string} [toTime]
 */

/**
 * @typedef {object} RangeResult
 * @property {boolean} ok
 * @property {string} [reason]       plain-English reason when not ok
 * @property {string} [from]
 * @property {string} [to]
 * @property {number} [nights]       calendar nights between the dates
 * @property {number} [hours]        exact elapsed hours, when both times are chosen (BST/GMT aware), for display
 * @property {number} [periods]      days on the UK wall clock (nights, plus one if the return time is later than the
 *                                   pick-up time) with times, else nights; what min/max are checked on and kits price
 * @property {string[]} [dates]      every date the range touches, from the first to the last
 * @property {number} [weekendDays]  Saturdays and Sundays among `dates`
 */

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** @param {string} iso */
const weekday = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay();

/** Nights between two dates (b − a). @param {string} a @param {string} b */
export const nightsBetween = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000);

/** "Saturday 14 November". @param {string} iso */
export function dayName(iso) {
  const [, m, d] = iso.split("-").map(Number);
  return `${DAY_NAMES[weekday(iso)]} ${d} ${MONTHS[m - 1]}`;
}

/** "Sat 14 Nov", for short summaries and messages. @param {string} iso */
export function shortDay(iso) {
  const [, m, d] = iso.split("-").map(Number);
  return `${DAY_NAMES[weekday(iso)].slice(0, 3)} ${d} ${MONTHS[m - 1].slice(0, 3)}`;
}

/** @type {Map<string, Set<string>>} */
const holidayCache = new Map();
/** @param {string} iso @param {Region} region */
function isBankHoliday(iso, region) {
  const key = `${iso.slice(0, 4)}:${region}`;
  if (!holidayCache.has(key)) holidayCache.set(key, new Set(bankHolidays(Number(iso.slice(0, 4)), region)));
  return /** @type {Set<string>} */ (holidayCache.get(key)).has(iso);
}

/**
 * Opening ranges on a date, as [start, end] minutes; bank holidays closed when the business says so, unless the hours
 * have an exception for that very date.
 * @param {string} iso @param {RangeRules} rules
 * @returns {[number, number][]}
 */
export function openingOn(iso, rules) {
  const hasException = (rules.hours.exceptions ?? []).some((e) => e.date === iso);
  if (!hasException && rules.bankHolidays === "closed" && isBankHoliday(iso, rules.region)) return [];
  return rangesFor(rules.hours, iso).ranges.map((r) => {
    const s = toMinutes(r[0]);
    let e = toMinutes(r[1]);
    if (e <= s) e = 24 * 60; // overnight or midnight: the day's part ends at midnight for hand-overs
    return /** @type {[number, number]} */ ([s, e]);
  });
}

/** The earliest moment a pick-up can be, on the business's clock. @param {ZonedNow} now @param {number} leadHours */
export function earliest(now, leadHours) {
  const total = now.minutes + Math.round(leadHours * 60);
  return { date: addDays(now.date, Math.floor(total / 1440)), minutes: total % 1440 };
}

/**
 * The business's times on a date: its slots that fall inside opening hours, or, with no slots, nothing (date only).
 * With `after` (minutes), only times at or after it.
 * @param {string} iso @param {RangeRules} rules @param {number} [after]
 * @returns {string[]}
 */
export function slotsOn(iso, rules, after = 0) {
  const open = openingOn(iso, rules);
  return (rules.slots ?? []).filter((t) => {
    const m = toMinutes(t);
    return m >= after && open.some(([s, e]) => m >= s && m + (rules.slotMinutes ?? 0) <= e);
  });
}

/**
 * What a day is, for the calendar and for checking.
 * @param {string} iso @param {RangeRules} rules @param {ZonedNow} now @param {Blocked} [blocked]
 * @returns {DayState}
 */
export function dayState(iso, rules, now, blocked = null) {
  if (iso < now.date) return "past";
  if (iso > addDays(now.date, rules.horizonDays)) return "far";
  if (blocked?.status === "ok" && blocked.dates.includes(iso)) return "taken";
  const open = openingOn(iso, rules);
  if (open.length === 0) return "closed";
  const first = earliest(now, rules.leadHours ?? 0);
  if (iso < first.date) return "soon";
  if (iso === first.date) {
    const left = rules.slots?.length ? slotsOn(iso, rules, first.minutes).length > 0 : open.some(([, e]) => e > first.minutes);
    if (!left) return "soon";
  }
  return "free";
}

/** Words for a day's state, as a screen reader hears it after the date. @param {DayState} s */
export const STATE_WORDS = { past: "gone", far: "not open for requests yet", taken: "taken", closed: "closed", soon: "too soon", free: "free" };

/** "Saturday 14 November, free". @param {string} iso @param {DayState} state */
export const dayLabel = (iso, state) => `${dayName(iso)}, ${STATE_WORDS[state]}`;

/**
 * Checks a chosen date or range against the business's rules.
 * @param {Selection} sel @param {RangeRules} rules @param {ZonedNow} now @param {Blocked} [blocked]
 * @returns {RangeResult}
 */
export function checkRange(sel, rules, now, blocked = null) {
  const times = (rules.slots?.length ?? 0) > 0;
  const fail = (/** @type {string} */ reason) => ({ ok: false, reason });
  if (!sel.from || !DATE.test(sel.from)) return fail(rules.single ? "Choose a date." : "Choose a pick-up date.");
  const start = dayState(sel.from, rules, now, blocked);
  if (start !== "free") return fail(startReason(sel.from, start, rules, now));
  const startTime = times ? timeReason(sel.from, sel.fromTime, rules, now, true) : null;
  if (startTime) return fail(startTime);
  if (rules.single) return { ok: true, from: sel.from, dates: [sel.from], nights: 0, periods: 0, weekendDays: weekday(sel.from) % 6 === 0 ? 1 : 0 };

  if (!sel.to || !DATE.test(sel.to)) return fail("Choose a return date.");
  if (sel.to < sel.from) return fail("The return date is before the pick-up date.");
  const nights = nightsBetween(sel.from, sel.to);
  const dates = Array.from({ length: nights + 1 }, (_, i) => addDays(/** @type {string} */ (sel.from), i));
  const end = endReason(sel.to, dates, rules, now, blocked);
  if (end) return fail(end);
  const timed = times ? timedLength(sel, rules, now, nights) : { periods: nights, hours: undefined };
  if ("reason" in timed) return fail(/** @type {string} */ (timed.reason));
  const { periods, hours } = timed;
  const length = lengthReason(periods, rules, times);
  if (length) return fail(length);
  return { ok: true, from: sel.from, to: sel.to, nights, hours, periods, dates, weekendDays: dates.filter((d) => weekday(d) % 6 === 0).length };
}

/**
 * With times: the return time's check, the exact hours, and days on the UK wall clock (nights, plus one when the return
 * time is later in the day than the pick-up time), so the clocks changing never adds or removes a day.
 * @param {Selection} sel @param {RangeRules} rules @param {ZonedNow} now @param {number} nights
 * @returns {{ reason: string } | { periods: number, hours: number }}
 */
function timedLength(sel, rules, now, nights) {
  const endTime = timeReason(/** @type {string} */ (sel.to), sel.toTime, rules, now, false);
  if (endTime) return { reason: endTime };
  const from = /** @type {string} */ (sel.fromTime), to = /** @type {string} */ (sel.toTime);
  const hours = (instant(/** @type {string} */ (sel.to), to, rules) - instant(/** @type {string} */ (sel.from), from, rules)) / 3600000;
  if (hours <= 0) return { reason: "The return time is before the pick-up time." };
  return { periods: nights + (to > from ? 1 : 0), hours };
}

/** The UTC instant of a date and time on the business's clock. @param {string} d @param {string} t @param {RangeRules} rules */
function instant(d, t, rules) {
  const [year, month, day] = d.split("-").map(Number);
  const [hour, minute] = t.split(":").map(Number);
  return wallTimeToUtc({ year, month, day, hour, minute }, rules.hours.timezone);
}

/** Why a chosen time won't do, or null. @param {string} date @param {string|undefined} time @param {RangeRules} rules @param {ZonedNow} now @param {boolean} isStart */
function timeReason(date, time, rules, now, isStart) {
  const first = earliest(now, rules.leadHours ?? 0);
  const ok = slotsOn(date, rules, isStart && date === first.date ? first.minutes : 0);
  if (!time) return rules.single ? "Choose a time." : `Choose a ${isStart ? "pick-up" : "return"} time.`;
  if (!ok.includes(time)) return `${time} isn't one of our times on ${dayName(date)}${ok.length ? `; choose ${ok.join(", ")}` : ""}.`;
  return null;
}

/** Why a return day won't do, or null. @param {string} to @param {string[]} dates @param {RangeRules} rules @param {ZonedNow} now @param {Blocked} blocked */
function endReason(to, dates, rules, now, blocked) {
  const end = dayState(to, rules, now, blocked);
  if (end === "far") return `We take requests up to ${dayName(addDays(now.date, rules.horizonDays))}.`;
  if (end === "closed") return `We're closed on ${dayName(to)}, so the car can't come back that day. Choose another return day.`;
  const taken = blocked?.status === "ok" ? dates.find((d) => blocked.dates.includes(d)) : undefined;
  if (taken === to) return `${dayName(to)} is taken on our calendar.`;
  if (taken) return `${dayName(taken)} is taken on our calendar, so this range can't run through it.`;
  return null;
}

/** Why a range is too short or too long, or null. @param {number} periods @param {RangeRules} rules @param {boolean} times */
function lengthReason(periods, rules, times) {
  const min = Math.max(rules.minDays ?? 1, 1);
  const unit = (/** @type {number} */ n) => (times ? `${n} day${n === 1 ? "" : "s"}` : `${n} night${n === 1 ? "" : "s"}`);
  if (periods < min) return `The shortest hire is ${unit(min)}.`;
  if (rules.maxDays !== undefined && periods > rules.maxDays) return `The longest hire is ${unit(rules.maxDays)}; ask us about longer.`;
  return null;
}

/** @param {string} iso @param {DayState} state @param {RangeRules} rules @param {ZonedNow} now */
function startReason(iso, state, rules, now) {
  const what = rules.single ? "" : "pick-up ";
  if (state === "past") return `${dayName(iso)} has gone. Choose a later ${what}date.`;
  if (state === "far") return `We take requests up to ${dayName(addDays(now.date, rules.horizonDays))}.`;
  if (state === "taken") return `${dayName(iso)} is taken on our calendar.`;
  if (state === "closed") return `We're closed on ${dayName(iso)}. Choose another ${what}day.`;
  const next = firstFree(rules, now);
  const soonest = next ? ` The earliest is ${dayName(next)}.` : "";
  return rules.leadHours ? `That's too soon: we need ${rules.leadHours} hours' notice.${soonest}` : `There's no time left on ${dayName(iso)}.${soonest}`;
}

/**
 * The first day that can be chosen, or null if none within the horizon. (No Sheet here: the Sheet can only add blocks.)
 * @param {RangeRules} rules @param {ZonedNow} now
 */
export function firstFree(rules, now) {
  for (let i = 0; i <= rules.horizonDays; i++) {
    const d = addDays(now.date, i);
    if (dayState(d, rules, now) === "free") return d;
  }
  return null;
}

/**
 * The weeks of a month for a calendar, Monday first; days outside the month are null.
 * @param {number} year @param {number} month 1–12
 * @returns {(string|null)[][]}
 */
export function monthWeeks(year, month) {
  const first = `${year}-${String(month).padStart(2, "0")}-01`;
  const lead = (weekday(first) + 6) % 7;
  const days = nightsBetween(first, addDays(month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`, 0));
  /** @type {(string|null)[]} */
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => addDays(first, i))];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}

/** "November 2026". @param {number} year @param {number} month */
export const monthName = (year, month) => `${MONTHS[month - 1]} ${year}`;

/**
 * Reads a published-to-web Sheet of blocked dates (one YYYY-MM-DD per row in its first column, header row allowed).
 * Anything unreadable gives an error state, which blocks nothing: the picker then says to ask.
 * @param {string[][]|null} rows parsed CSV, or null when the fetch failed
 * @returns {Blocked}
 */
export function blockedFromRows(rows) {
  if (!rows) return { status: "error" };
  const dates = rows.map((r) => (r[0] ?? "").trim()).filter((v) => DATE.test(v));
  return { status: "ok", dates };
}

/**
 * Checks a site's rules for a picker before they ship. Kits call this from their own validation.
 * @param {any} r @param {string} at path for messages @param {(path: string, msg: string) => void} err
 */
export function checkRangeRules(r, at, err) {
  if (r === null || typeof r !== "object" || Array.isArray(r)) { err(at, "{ horizonDays, bankHolidays, leadHours?, minDays?, maxDays?, slots?, slotMinutes? }"); return; }
  const known = ["horizonDays", "bankHolidays", "leadHours", "minDays", "maxDays", "slots", "slotMinutes"];
  for (const k of Object.keys(r)) if (!known.includes(k)) err(`${at}.${k}`, `unknown setting; one of ${known.join(", ")}`);
  const int = (/** @type {unknown} */ v, /** @type {number} */ lo, /** @type {number} */ hi) => Number.isInteger(v) && /** @type {number} */ (v) >= lo && /** @type {number} */ (v) <= hi;
  if (!int(r.horizonDays, 1, 730)) err(`${at}.horizonDays`, "how many days ahead the business takes requests, e.g. 180");
  if (!["closed", "open"].includes(r.bankHolidays)) err(`${at}.bankHolidays`, '"closed" or "open": does the business hand over on bank holidays? (an hours exception for a date wins)');
  if (r.leadHours !== undefined && !int(r.leadHours, 0, 720)) err(`${at}.leadHours`, "hours' notice the business needs, 0–720");
  if (r.minDays !== undefined && !int(r.minDays, 1, 365)) err(`${at}.minDays`, "shortest range, 1–365");
  if (r.maxDays !== undefined && (!int(r.maxDays, 1, 365) || (int(r.minDays, 1, 365) && r.maxDays < r.minDays))) err(`${at}.maxDays`, "longest range, at least minDays");
  if (r.slots !== undefined && !goodSlots(r.slots)) err(`${at}.slots`, 'the business\'s own times, "HH:MM", in order, e.g. ["10:00", "14:00", "18:00"]');
  if (r.slotMinutes !== undefined && !int(r.slotMinutes, 0, 600)) err(`${at}.slotMinutes`, "how long what starts at a time lasts, in minutes, 0–600");
}

/** Times in order, each "HH:MM", none twice. @param {unknown} slots */
const goodSlots = (slots) => Array.isArray(slots) && slots.length > 0
  && slots.every((t, i) => typeof t === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(t) && (i === 0 || t > slots[i - 1]));
