// @ts-check
/**
 * The nursery kit's logic, with no DOM: places by room from the nursery's sheet, today's one-line notice, the week's
 * fees with funded hours taken off, when funding can start, visit times, term dates and closures, the settling-in
 * sessions and the calendar files. Every rate, room, time, step and date is the nursery's own (site.json or its sheet);
 * the only rules written here are gov.uk's funded-hours rules, each one named where it is used.
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";
import { addDaysYmd, isYmd } from "../../../core/lib/diary.js";

export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export const DAY_NAMES = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY = 86_400_000;

/** The weekday key of a calendar day ("mon"…"sun"). @param {string} ymd */
export const dayKey = (ymd) => DAYS[(new Date(`${ymd}T12:00:00Z`).getUTCDay() + 6) % 7];

/** Today in the nursery's time zone, YYYY-MM-DD. @param {number} ms @param {string} timeZone */
export function ymdIn(ms, timeZone) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

/** Minutes past midnight in the nursery's time zone. @param {number} ms @param {string} timeZone */
export function minutesIn(ms, timeZone) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return Number(p.hour) * 60 + Number(p.minute);
}

/** "Tue 1 Dec" (short) or "Tuesday 1 December 2026" (long). @param {string} ymd @param {"short"|"long"|"month"} [form] */
export function dateWords(ymd, form = "short") {
  const d = new Date(`${ymd}T12:00:00Z`);
  const day = d.getUTCDate(), m = MONTHS[d.getUTCMonth()], y = d.getUTCFullYear();
  if (form === "long") return `${DAY_NAMES[dayKey(ymd)]} ${day} ${m} ${y}`;
  if (form === "month") return `${day} ${m} ${y}`;
  return `${SHORT_DAYS[d.getUTCDay()]} ${day} ${m.slice(0, 3)}`;
}

/** "9.30am", "12 noon", "4pm". @param {string} hhmm */
export function timeWords(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  if (h === 12 && m === 0) return "12 noon";
  const hh = h % 12 || 12, ap = h < 12 ? "am" : "pm";
  return m ? `${hh}.${String(m).padStart(2, "0")}${ap}` : `${hh}${ap}`;
}

/** "YYYY-MM" for this month and the next n-1. @param {string} todayYmd @param {number} n */
export function monthsAhead(todayYmd, n) {
  const [y, m] = todayYmd.split("-").map(Number);
  return Array.from({ length: n }, (_, i) => {
    const t = new Date(Date.UTC(y, m - 1 + i, 1));
    return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

/** "Dec" or "December 2026" for "2026-12". @param {string} ym @param {"short"|"long"|"name"} [form] */
export function monthWords(ym, form = "short") {
  const [y, m] = ym.split("-").map(Number);
  const name = MONTHS[m - 1];
  return form === "long" ? `${name} ${y}` : form === "name" ? name : name.slice(0, 3);
}

// ---- Places by room -------------------------------------------------------------------------------------------

/** A sheet row's own date may run this far ahead of the visitor's clock (devices disagree by a minute or two). */
export const CLOCK_SKEW_MS = 10 * 60_000;

/** @param {number} t @param {number} now @param {number} staleAfterDays */
export const rowIsCurrent = (t, now, staleAfterDays) =>
  Number.isFinite(t) && t <= now + CLOCK_SKEW_MS && now - t <= staleAfterDays * DAY;

/** @typedef {{ ok: false } | { ok: true, places: Record<string, number>, updatedAt: number }} PlacesResult */

/** A room's month in the places sheet. @param {string} room @param {string} ym */
export const placeKey = (room, ym) => `${room}|${ym}`;

/**
 * The nursery's places sheet: room,month,places,updated_at (month YYYY-MM; places a whole number, 0 or "full" when
 * there are none). Fails closed: a missing column, a word or month it can't read returns { ok: false }; and each row is
 * judged by its own updated_at, so a row whose date is unreadable, in the future or older than `staleAfterDays` is
 * left out (that month shows nothing), however fresh the others are.
 * @param {string} csv @param {number} now @param {number} staleAfterDays @param {string} timeZone @param {string[]} rooms
 * @returns {PlacesResult}
 */
export function placesFromCsv(csv, now, staleAfterDays, timeZone, rooms) {
  const rows = parseCsv(csv);
  const head = (rows.shift() ?? []).map((h) => h.trim().toLowerCase());
  const col = (/** @type {string} */ n) => head.indexOf(n);
  if (["room", "month", "places", "updated_at"].some((n) => col(n) < 0)) return { ok: false };
  /** @type {Record<string, number>} */
  const places = {};
  let updatedAt = Infinity;
  for (const r of rows) {
    const room = (r[col("room")] ?? "").trim(), month = (r[col("month")] ?? "").trim();
    const raw = (r[col("places")] ?? "").trim().toLowerCase();
    if (!rooms.includes(room) || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return { ok: false };
    const value = raw === "full" ? 0 : /^\d{1,2}$/.test(raw) ? Number(raw) : NaN;
    if (Number.isNaN(value)) return { ok: false };
    const t = parseSheetTime(r[col("updated_at")] ?? "", timeZone);
    if (!rowIsCurrent(t, now, staleAfterDays)) continue;
    places[placeKey(room, month)] = value;
    updatedAt = Math.min(updatedAt, t);
  }
  if (!Number.isFinite(updatedAt)) return { ok: false };
  return { ok: true, places, updatedAt };
}

/** A month's words: "2 free", "1 free", "Full", or null when the sheet doesn't say. @param {number|undefined} v */
export function placesWords(v) {
  if (v === undefined) return null;
  if (v === 0) return { state: "full", words: "Full" };
  return { state: "free", words: `${v} free` };
}

/** The first month with a place for a room, or "" if none of them has one. @param {Record<string, number>} places @param {string} room @param {string[]} months */
export function nextPlace(places, room, months) {
  return months.find((ym) => (places[placeKey(room, ym)] ?? 0) > 0) ?? "";
}

/** Does the sheet say anything about this room in these months? @param {Record<string, number>} places @param {string} room @param {string[]} months */
export const roomKnown = (places, room, months) => months.some((ym) => places[placeKey(room, ym)] !== undefined);

// ---- Today at nursery -----------------------------------------------------------------------------------------

/**
 * Today's notice, from the nursery's sheet: date,message (one row per day it wants to say something). Only a row for
 * today (in the nursery's time zone) is shown; anything unreadable shows nothing, so an old notice can't linger.
 * @param {string} csv @param {string} todayYmd @returns {string}
 */
export function todayFromCsv(csv, todayYmd) {
  const rows = parseCsv(csv);
  const head = (rows.shift() ?? []).map((h) => h.trim().toLowerCase());
  const d = head.indexOf("date"), m = head.indexOf("message");
  if (d < 0 || m < 0) return "";
  const row = rows.find((r) => (r[d] ?? "").trim() === todayYmd);
  const text = (row?.[m] ?? "").trim();
  return text.length <= 160 ? text : "";
}

// ---- The week's fees ------------------------------------------------------------------------------------------

/**
 * gov.uk's funded hours: 15 or 30 hours a week for 38 weeks a year (570 or 1,140 hours). A nursery open more weeks can
 * stretch them across the year; this spreads them over the weeks it says it is open, never more than are booked.
 */
export const FUNDED_WEEKS = 38;

/** Which funded-hours offers an age can have (gov.uk, checked 26 Nov 2026): none under 9 months; working families' 30
 * from 9 months; 15 for some 2 year olds; 15 for every 3 and 4 year old, 30 for eligible working families.
 * Bands: 0 under 9 months, 1 nine months to 2, 2 two, 3 three and four. */
export const FUNDING_BY_BAND = /** @type {Record<number, number[]>} */ ({ 0: [0], 1: [0, 30], 2: [0, 15, 30], 3: [15, 30] });

/**
 * What a week costs. Stretched (the default): the year's funded hours (38 × funded) spread evenly over the weeks open.
 * Term time only (`stretched: false`): up to `funded` hours off in each of 38 weeks, every other week paid in full.
 * Either way the year's fees are split into 12 equal months. `funded` and `paid` are a week's hours (term weeks when
 * term time only); `fullWeeks` is how many weeks are paid in full (0 when stretched).
 * @typedef {{ rate: number, weeksOpen: number, sessions: Record<string, { hours: number }>, stretched?: boolean }} FeeSettings
 * @param {FeeSettings} f @param {string[]} days each a session id from f.sessions, or "off" @param {number} funded 0, 15 or 30
 */
export function weekCost(f, days, funded) {
  const booked = days.reduce((a, s) => a + (s === "off" ? 0 : f.sessions[s]?.hours ?? 0), 0);
  const termOnly = f.stretched === false;
  const fundedWeek = termOnly ? Math.min(booked, funded) : Math.min(booked, (funded * FUNDED_WEEKS) / f.weeksOpen);
  const paid = booked - fundedWeek;
  const fundedWeeks = termOnly ? Math.min(FUNDED_WEEKS, f.weeksOpen) : f.weeksOpen;
  const yearPaid = booked * f.weeksOpen - fundedWeek * fundedWeeks;
  const month = Math.round(((yearPaid * f.rate) / 12) * 100) / 100;
  return { booked, funded: fundedWeek, paid, month, termOnly, fullWeeks: termOnly ? f.weeksOpen - fundedWeeks : 0, daysOn: days.filter((s) => s !== "off").length };
}

/** Hours to two places, without trailing zeros: 22.35, 30, 7.65. @param {number} n */
export const hoursWords = (n) => String(Math.round(n * 100) / 100);

/** £309, £1,413; pence only when there are some (£5.50). @param {number} n */
export function pounds(n) {
  const whole = Math.abs(n - Math.round(n)) < 0.005;
  return "£" + (whole ? Math.round(n) : n).toLocaleString("en-GB", whole ? {} : { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---- When funding can start (gov.uk "the term after") ---------------------------------------------------------

/** The day a child reaches an age in months (a day that doesn't exist, 31 into a short month, becomes the 1st after). @param {string} dob @param {number} months */
export function ageDate(dob, months) {
  const [y, m, d] = dob.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  const day = d > last ? 1 : d;
  const base = d > last ? new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 1)) : new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), day));
  return base.toISOString().slice(0, 10);
}

/**
 * gov.uk: funded hours start from the term after a child reaches the age. Reached 1 January to 31 March: from 1 April;
 * 1 April to 31 August: from 1 September; 1 September to 31 December: from 1 January.
 * @param {string} reached YYYY-MM-DD
 */
export function termAfter(reached) {
  const [y, m] = reached.split("-").map(Number);
  if (m <= 3) return `${y}-04-01`;
  if (m <= 8) return `${y}-09-01`;
  return `${y + 1}-01-01`;
}

/**
 * When each offer could start for a child born on `dob`: the working families' hours from the term after 9 months, the
 * universal 15 hours from the term after the third birthday. Each is null once the child is 5 or the term has passed
 * long ago; `now` says whether it has already started.
 * @param {string} dob @param {string} todayYmd
 */
export function fundingStart(dob, todayYmd) {
  if (!isYmd(dob) || dob > todayYmd && daysBetweenYmd(todayYmd, dob) > 366) return null;
  const working = termAfter(ageDate(dob, 9)), universal = termAfter(ageDate(dob, 36));
  const school = ageDate(dob, 60);
  if (todayYmd >= school) return null;
  return {
    working: { date: working, started: todayYmd >= working, before: working < WORKING_FROM },
    universal: { date: universal, started: todayYmd >= universal, before: false },
  };
}

/** The working families' hours for under-3s began on 1 April 2024 (two year olds; nine months from 1 September 2024,
 * gov.uk): a start worked out before then is said as "open now" with no date. */
const WORKING_FROM = "2024-04-01";

/** @param {string} a @param {string} b */
const daysBetweenYmd = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / DAY);

// ---- Visit times ----------------------------------------------------------------------------------------------

/** @typedef {{ day: string, time: string, week?: "first", note?: string }} VisitTime */

/**
 * The next `n` visit times after today from the nursery's weekly pattern; a slot with week "first" only falls in the
 * first seven days of a month. Closed days (closures) are skipped.
 * @param {VisitTime[]} pattern @param {string} todayYmd @param {number} n @param {string[]} [closed]
 */
export function visitSlots(pattern, todayYmd, n, closed = []) {
  /** @type {(VisitTime & { date: string })[]} */
  const out = [];
  for (let k = 1; k <= 62 && out.length < n; k++) {
    const date = addDaysYmd(todayYmd, k);
    if (closed.includes(date)) continue;
    for (const p of [...pattern].sort((a, b) => a.time.localeCompare(b.time))) {
      if (p.day !== dayKey(date)) continue;
      if (p.week === "first" && Number(date.slice(8)) > 7) continue;
      out.push({ ...p, date });
    }
  }
  return out.slice(0, n);
}

// ---- Term dates and closures ----------------------------------------------------------------------------------

/** @typedef {{ id: string, label: string, date: string, end?: string, kind: "term"|"closed"|"open-day" }} TermItem */

/** Upcoming items (still running or ahead), soonest first. @param {TermItem[]} items @param {string} todayYmd */
export const upcoming = (items, todayYmd) =>
  items.filter((x) => (x.end ?? x.date) >= todayYmd).sort((a, b) => a.date.localeCompare(b.date));

/** Every closed day in a list of items (each day of a closure's range). @param {TermItem[]} items */
export function closedDays(items) {
  /** @type {string[]} */
  const out = [];
  for (const x of items) {
    if (x.kind !== "closed") continue;
    for (let d = x.date; d <= (x.end ?? x.date); d = addDaysYmd(d, 1)) out.push(d);
  }
  return out;
}

// ---- Settling in ----------------------------------------------------------------------------------------------

/** @typedef {{ label: string, from: string, to: string, withParent?: boolean, note?: string }} SettlingStep */

/**
 * The settling-in sessions as dates: step 1 on the start date (or the next open weekday), each next step on the next
 * weekday the nursery is open (Monday to Friday, not a closed day). Only the nursery's own steps and times.
 * @param {string} start @param {SettlingStep[]} steps @param {string[]} closed
 */
export function settlingPlan(start, steps, closed) {
  const open = (/** @type {string} */ d) => !["sat", "sun"].includes(dayKey(d)) && !closed.includes(d);
  let d = start;
  for (let i = 0; i < 31 && !open(d); i++) d = addDaysYmd(d, 1);
  return steps.map((s, i) => {
    if (i > 0) { d = addDaysYmd(d, 1); for (let k = 0; k < 31 && !open(d); k++) d = addDaysYmd(d, 1); }
    return { ...s, date: d };
  });
}

// ---- Calendar files -------------------------------------------------------------------------------------------

/** Text safe for a calendar line. @param {string} s */
const icsText = (s) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

/** "20261117T091500Z" for a calendar file's DTSTAMP. @param {number} ms */
export const icsStamp = (ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/**
 * One calendar file. All-day items (term dates, closures) or timed ones (settling-in sessions, local time).
 * @param {{ name: string, place: string, stamp: string, items: { id: string, label: string, date: string, end?: string, from?: string, to?: string }[] }} o
 */
export function ics(o) {
  const slug = o.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Sitefloor//${icsText(o.name)}//EN`, "CALSCALE:GREGORIAN"];
  for (const x of o.items) {
    const day = x.date.replace(/-/g, "");
    lines.push("BEGIN:VEVENT", `UID:${x.id}-${x.date}@${slug}`, `DTSTAMP:${o.stamp}`);
    if (x.from && x.to) lines.push(`DTSTART:${day}T${x.from.replace(":", "")}00`, `DTEND:${day}T${x.to.replace(":", "")}00`);
    else lines.push(`DTSTART;VALUE=DATE:${day}`, `DTEND;VALUE=DATE:${addDaysYmd(x.end ?? x.date, 1).replace(/-/g, "")}`);
    lines.push(`SUMMARY:${icsText(`${x.label} · ${o.name}`)}`, `LOCATION:${icsText(o.place)}`, "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

// ---- A day with us --------------------------------------------------------------------------------------------

/**
 * Which moment of the day is around now: the last one that has started, on a weekday the nursery is open, between the
 * first moment and closing. -1 otherwise. @param {{ time: string }[]} moments @param {number} minutes @param {string} day
 * @param {string} closes HH:MM
 */
export function aroundNow(moments, minutes, day, closes) {
  if (["sat", "sun"].includes(day)) return -1;
  const at = (/** @type {string} */ t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  if (minutes >= at(closes)) return -1;
  let idx = -1;
  moments.forEach((x, i) => { if (minutes >= at(x.time)) idx = i; });
  return idx;
}
