// @ts-check
/**
 * Getting here: journeys, parking and access for any business people visit.
 * Pure functions, used at build time and in the browser.
 *
 * Parking charges are stored like opening hours (the times you PAY), so the
 * same tested logic answers "is it free right now, and until when?". A car park
 * can also have its own opening hours, bank-holiday rule and dated exceptions.
 */
import { openStatus, formatTime12, DAY_NAMES, isTime, DAY_KEYS, addDays } from "./hours.js";
import { bankHolidays } from "./bank-holidays.js";

/** @typedef {"walk"|"bus"|"train"|"tram"|"car"|"bike"} Mode */
/** @typedef {{ mode: Mode, from: string, minutes: number, steps: string[], origin?: string, stop?: string }} Journey */
/** @typedef {[string, string]} Range */
/** @typedef {Partial<Record<import("./hours.js").DayKey, Range[]>>} Week */
/**
 * @typedef {object} Parking
 * @property {string} name
 * @property {number} [walk]            minutes on foot to the door
 * @property {string} [price]
 * @property {string} [note]
 * @property {"always"|"never"|Week} paid  when you pay
 * @property {Week} [open]              when the car park is open (leave out if it never closes)
 * @property {"sunday"|"normal"|"free"} [bankHolidays]  how bank holidays are charged (required with a schedule)
 * @property {{ date: string, ranges: Range[], note?: string }[]} [exceptions]  one-off days: the hours you pay that day
 * @property {{ bankHolidays?: boolean, dates?: string[] }} [closures]  days the car park is shut (Christmas, bank holidays)
 */
/** @typedef {{ label: string, yes: boolean }} AccessItem */
/** @typedef {import("./bank-holidays.js").Region} Region */

export const MODES = /** @type {const} */ (["walk", "bus", "train", "tram", "car", "bike"]);

/**
 * Words for each mode, for headings and the board. For bus, train and tram,
 * `minutes` is the walk from the stop, which is what the business can vouch for.
 * Driving times change with traffic, so they are given as "about" and "outside rush hour".
 */
export const MODE_WORDS = {
  walk: { tab: "Walk", verb: "walk", board: "walk" },
  bus: { tab: "Bus", verb: "walk from the stop", board: "walk from the stop" },
  train: { tab: "Train", verb: "walk from the station", board: "walk from the station" },
  tram: { tab: "Tram", verb: "walk from the stop", board: "walk from the stop" },
  car: { tab: "Car", verb: "drive, outside rush hour", board: "drive", about: true },
  bike: { tab: "Bike", verb: "cycle", board: "cycle" },
};

/** "10 min walk", "about 8 min drive". @param {{ mode: string, minutes: number }} j */
export function boardTime(j) {
  const w = /** @type {any} */ (MODE_WORDS)[j.mode] ?? { board: "" };
  return `${w.about ? "about " : ""}${j.minutes} min ${w.board}`;
}

/** @param {string} mode */
export const isTransit = (mode) => mode === "bus" || mode === "train" || mode === "tram";

/**
 * "Leave Leeds station by 2:45pm" or, for a bus, "Get off at Kirkgate Market by 2:53pm".
 * @param {{ mode: string, from: string, stop?: string }} j @param {string} time
 */
export const leaveText = (j, time) => (isTransit(j.mode) ? `Get off at ${j.stop ?? j.from} by ${time}` : `Leave ${j.from} by ${time}`);

const TRAVEL_MODE = { walk: "walking", bus: "transit", train: "transit", tram: "transit", car: "driving", bike: "bicycling" };

/**
 * Google Maps directions to the business in the journey's mode. Starts from the
 * journey's origin when given ("Leeds station, Leeds"), otherwise from wherever
 * the visitor is.
 * @param {{ streetAddress: string, locality: string, postcode: string }} location
 * @param {Journey} j
 */
export function directionsUrl(location, j) {
  const p = new URLSearchParams({ api: "1", destination: `${location.streetAddress}, ${location.locality} ${location.postcode}`, travelmode: TRAVEL_MODE[j.mode] });
  if (j.origin) p.set("origin", j.origin);
  return `https://www.google.com/maps/dir/?${p.toString().replace(/\+/g, "%20")}`;
}

/** @param {Week} w @returns {Record<import("./hours.js").DayKey, Range[]>} */
const fullWeek = (w) => /** @type {any} */ (Object.fromEntries(DAY_KEYS.map((d) => [d, w[d] ?? []])));

/**
 * The car park's paying hours as an opening-hours schedule, with bank holidays
 * and one-off days as exceptions.
 * @param {Parking} p @param {string} timezone @param {Region} region @param {string} today YYYY-MM-DD
 */
export function chargingHours(p, timezone, region, today) {
  const weekly = fullWeek(/** @type {Week} */ (p.paid));
  const year = Number(today.slice(0, 4));
  const own = (p.exceptions ?? []).map((e) => ({ ...e }));
  const rule = p.bankHolidays ?? "normal";
  const holidays = rule === "normal" ? [] : [year - 1, year, year + 1].flatMap((y) => bankHolidays(y, region))
    .filter((d) => !own.some((e) => e.date === d))
    .map((date) => ({ date, ranges: rule === "free" ? [] : weekly.sun, note: "bank holiday" }));
  return { timezone, weekly, exceptions: [...own, ...holidays] };
}

const DAY_MIN = 1440;

/**
 * When does a paid period that is running now actually end? Follows ranges that
 * run on past midnight into the next day, so a 24-hour car park isn't "paid until 12am".
 * @param {ReturnType<typeof chargingHours>} hours @param {import("./hours.js").ZonedNow} now
 * @param {number} closesAt minutes after today's midnight (may be over 1440)
 * @returns {{ minutes: number, days: number } | null} days after today; null = paid for a week or more
 */
function paidUntil(hours, now, closesAt) {
  let end = closesAt;
  while (end % DAY_MIN === 0) {
    const days = end / DAY_MIN;
    if (days >= 7) return null;
    const next = openStatus(hours, { date: addDays(now.date, days), weekday: (now.weekday + days) % 7, minutes: 0 });
    if (!next.open || next.closesAt === null) break;
    end = days * DAY_MIN + next.closesAt;
  }
  return { minutes: end % DAY_MIN, days: Math.floor(end / DAY_MIN) };
}

/** "until 6pm", "until 3am tomorrow", "until midnight Friday". @param {{ minutes: number, days: number }} u @param {number} weekday */
function untilText(u, weekday) {
  if (u.minutes === 0) return `until midnight${u.days <= 1 ? "" : ` ${DAY_NAMES[(weekday + u.days - 1) % 7]}`}`;
  return `until ${formatTime12(u.minutes)}${whenWord(u.days, weekday)}`;
}

/** "", " tomorrow", " Saturday". @param {number} days @param {number} weekday */
const whenWord = (days, weekday) => (days === 0 ? "" : days === 1 ? " tomorrow" : ` ${DAY_NAMES[(weekday + days) % 7]}`);

const ALL_DAY = /** @type {Week} */ (Object.fromEntries(DAY_KEYS.map((d) => [d, [["00:00", "00:00"]]])));

/**
 * When the car park is open: its own hours (or all day), minus closure dates and, if it shuts then, bank holidays.
 * @param {Parking} p @param {string} timezone @param {Region} region @param {string} today
 */
function openingHours(p, timezone, region, today) {
  const year = Number(today.slice(0, 4));
  const dates = [...(p.closures?.dates ?? []), ...(p.closures?.bankHolidays ? [year - 1, year, year + 1].flatMap((y) => bankHolidays(y, region)) : [])];
  return { timezone, weekly: fullWeek(p.open ?? ALL_DAY), exceptions: dates.map((date) => ({ date, ranges: /** @type {Range[]} */ ([]) })) };
}

/**
 * Is this car park open, and is it free right now? Written for a person.
 * @param {Parking} p @param {string} timezone
 * @param {import("./hours.js").ZonedNow} now
 * @param {Region} [region]
 * @returns {{ free: boolean, closed?: boolean, text: string }}
 */
export function parkingStatus(p, timezone, now, region = "england-wales") {
  const price = p.price ? ` · ${p.price}` : "";
  if (p.open || p.closures) {
    const o = openStatus(openingHours(p, timezone, region, now.date), now);
    if (!o.open) {
      if (!o.nextOpen) return { free: false, closed: true, text: "Closed" };
      const days = Math.round((Date.parse(o.nextOpen.date) - Date.parse(now.date)) / 86400000);
      return { free: false, closed: true, text: `Closed now · opens ${formatTime12(o.nextOpen.minutes)}${whenWord(days, now.weekday)}` };
    }
  }
  if (p.paid === "never") return { free: true, text: "Free" };
  if (p.paid === "always") return { free: false, text: `Paid${price || " at all times"}` };
  const hours = chargingHours(p, timezone, region, now.date);
  const s = openStatus(hours, now);
  const holiday = s.note === "bank holiday" ? " (bank holiday)" : "";
  if (s.open && s.closesAt !== null) {
    const until = paidUntil(hours, now, s.closesAt);
    if (!until) return { free: false, text: `Paid 24 hours${price}` };
    return { free: false, text: `Paid${holiday} ${untilText(until, now.weekday)}${price}` };
  }
  if (!s.nextOpen) return { free: true, text: `Free${holiday}` };
  const days = Math.round((Date.parse(s.nextOpen.date) - Date.parse(now.date)) / 86400000);
  return { free: true, text: `Free now${holiday} · charges from ${s.nextOpen.minutes === 0 ? "midnight" : formatTime12(s.nextOpen.minutes)}${whenWord(days, now.weekday)}` };
}

/** "25 Dec". @param {string} iso */
const shortDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

const SHORT = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };
const PLURAL = { mon: "Mondays", tue: "Tuesdays", wed: "Wednesdays", thu: "Thursdays", fri: "Fridays", sat: "Saturdays", sun: "Sundays" };
const WEEK = /** @type {const} */ (["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);

/** "8am–6pm", "all day". @param {Range[]} ranges */
const rangeText = (ranges) => ranges.map(([a, b]) => (a === "00:00" && b === "00:00" ? "all day" : `${formatTime12(toMin(a))}–${formatTime12(toMin(b))}`)).join(", ");
const toMin = (/** @type {string} */ t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

/**
 * Runs of days with the same hours, Monday first: [["Mon–Sat", "8am–6pm"], ...], plus the days with none.
 * @param {Week} week
 */
function runs(week) {
  /** @type {{ from: string, to: string, text: string }[]} */
  const out = [];
  /** @type {string[]} */
  const none = [];
  for (const d of WEEK) {
    const r = week[d] ?? [];
    if (!r.length) { none.push(d); continue; }
    const text = rangeText(r);
    const last = out[out.length - 1];
    if (last && last.text === text && WEEK.indexOf(/** @type {any} */ (last.to)) === WEEK.indexOf(d) - 1) last.to = d;
    else out.push({ from: d, to: d, text });
  }
  const label = (/** @type {{ from: string, to: string }} */ r) => (r.from === "mon" && r.to === "sun" ? "every day" : r.from === r.to ? /** @type {any} */ (SHORT)[r.from] : `${/** @type {any} */ (SHORT)[r.from]}–${/** @type {any} */ (SHORT)[r.to]}`);
  return { parts: out.map((r) => (label(r) === "every day" && r.text === "all day" ? "24 hours a day" : `${label(r)} ${r.text}`)), none };
}

/** "Sundays", "Saturdays and Sundays". @param {string[]} days */
const dayList = (days) => {
  if (days.length === 2 && days[0] === "sat" && days[1] === "sun") return "at weekends";
  const names = days.map((d) => /** @type {any} */ (PLURAL)[d]);
  return `on ${names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0]}`;
};

/**
 * The car park's charging and opening times as one line, for the page itself
 * (works without JavaScript): "Charges Mon–Sat 8am–6pm · free on Sundays and bank holidays".
 * @param {Parking} p
 */
export function parkingSummary(p) {
  /** @type {string[]} */
  const bits = [];
  if (p.open) {
    const o = runs(p.open);
    bits.push(`Open ${o.parts.join(", ")}${o.none.length ? `, closed ${dayList(o.none).replace(/^on /, "")}` : ""}`);
  }
  if (p.closures?.bankHolidays || p.closures?.dates?.length) bits.push(`closed ${[p.closures.bankHolidays ? "on bank holidays" : "", ...new Set((p.closures.dates ?? []).map(shortDate))].filter(Boolean).join(", ")}`);
  if (p.paid === "never") bits.push("Free");
  else if (p.paid === "always") bits.push("Paid whenever it's open");
  else {
    const c = runs(p.paid);
    const freeBH = p.bankHolidays === "free" || (p.bankHolidays === "sunday" && !(p.paid.sun ?? []).length);
    const free = c.none.length ? `free ${dayList(c.none)}${freeBH ? " and bank holidays" : ""}` : freeBH ? "free on bank holidays" : "";
    bits.push(`Charges ${c.parts.join(", ")}`);
    if (free) bits.push(free);
    else if (p.bankHolidays === "sunday") bits.push("bank holidays as Sunday");
  }
  return bits.join(" · ");
}

/**
 * When to set off for an appointment, allowing a few minutes to find the door.
 * @param {number} appointment minutes after midnight @param {number} journey minutes @param {number} [spare]
 * @returns {number} minutes after midnight (may be negative = the day before)
 */
export const leaveBy = (appointment, journey, spare = 5) => appointment - journey - spare;

/** "11:45pm the night before" for times before midnight. @param {number} minutes from leaveBy */
export const leaveTime = (minutes) => `${formatTime12(minutes)}${minutes < 0 ? " the night before" : ""}`;

/** @param {any} x */
const text = (x) => typeof x === "string" && x.trim().length > 0;
/** @param {any} v */
const isDate = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(`${v}T12:00:00Z`).toISOString().slice(0, 10) === v;

/**
 * A week of ranges: only known day keys, real times, start ≠ end (except 00:00–00:00 for all day).
 * @param {any} w @param {string} path @param {(path: string, msg: string) => void} err @param {boolean} needOne
 */
function checkWeek(w, path, err, needOne, emptyMsg = 'no hours on any day; if it is free all the time, use "never"') {
  if (w === null || typeof w !== "object" || Array.isArray(w)) { err(path, '{ "mon": [["08:00","18:00"]], …, "sun": [] }'); return; }
  for (const k of Object.keys(w)) if (!(/** @type {readonly string[]} */ (DAY_KEYS)).includes(k)) err(`${path}.${k}`, `unknown day; use ${DAY_KEYS.join(", ")}`);
  for (const d of DAY_KEYS) checkRangeList(w[d] ?? [], `${path}.${d}`, err);
  if (needOne && !DAY_KEYS.some((d) => Array.isArray(w[d]) && w[d].length)) err(path, emptyMsg);
}

/** @param {any} ranges @param {string} path @param {(path: string, msg: string) => void} err */
function checkRangeList(ranges, path, err) {
  if (!Array.isArray(ranges)) { err(path, 'list of ["HH:MM","HH:MM"]'); return; }
  ranges.forEach((/** @type {any} */ r, /** @type {number} */ i) => {
    if (!Array.isArray(r) || r.length !== 2 || !isTime(r[0]) || !isTime(r[1])) err(path, 'list of ["HH:MM","HH:MM"]');
    else if (r[0] === r[1] && r[0] !== "00:00") err(`${path}[${i}]`, 'start and end are the same; for all day use ["00:00","00:00"]');
  });
}

/** @param {any} cl */
const validClosures = (cl) => cl !== null && typeof cl === "object" && (cl.bankHolidays === undefined || typeof cl.bankHolidays === "boolean") && (cl.dates ?? []).every(isDate);

const CAR_PARK_KEYS = ["name", "walk", "price", "note", "paid", "open", "bankHolidays", "exceptions", "closures"];

/** @param {any} c @param {string} p @param {(path: string, msg: string) => void} err */
function checkCarPark(c, p, err) {
  if (!text(c?.name)) err(`${p}.name`, "required text is missing");
  if (c?.walk !== undefined && !(Number.isInteger(c.walk) && c.walk >= 0)) err(`${p}.walk`, "minutes on foot to the door");
  for (const k of Object.keys(c ?? {})) if (!CAR_PARK_KEYS.includes(k)) err(`${p}.${k}`, `unknown setting; use ${CAR_PARK_KEYS.join(", ")}`);
  if (c?.open !== undefined) checkWeek(c.open, `${p}.open`, err, true, "no opening hours on any day; leave \"open\" out if it never closes");
  if (c?.closures !== undefined && !validClosures(c.closures)) err(`${p}.closures`, '{ "bankHolidays": true, "dates": ["2026-12-25"] }');
  if (c?.paid === "always" || c?.paid === "never") return;
  checkSchedule(c, p, err);
}

/** A car park that charges at set times. @param {any} c @param {string} p @param {(path: string, msg: string) => void} err */
function checkSchedule(c, p, err) {
  if (c?.paid === null || typeof c?.paid !== "object" || Array.isArray(c?.paid)) { err(`${p}.paid`, '"always", "never", or the hours you pay, like opening hours'); return; }
  checkWeek(c.paid, `${p}.paid`, err, true);
  if (!["sunday", "normal", "free"].includes(c.bankHolidays)) err(`${p}.bankHolidays`, '"sunday" (charged like Sundays, the usual council rule), "normal" or "free"; check the car park\'s sign');
  (c.exceptions ?? []).forEach((/** @type {any} */ e, /** @type {number} */ i) => {
    if (!isDate(e?.date)) err(`${p}.exceptions[${i}].date`, "a real date, YYYY-MM-DD");
    checkRangeList(e?.ranges, `${p}.exceptions[${i}].ranges`, err);
  });
}

/**
 * @param {any} v @param {(path: string, msg: string) => void} err
 * @param {boolean} [isClient] client sites must say when the facts were checked
 */
export function checkArrival(v, err, isClient = false) {
  (v.journeys ?? []).forEach((/** @type {any} */ j, /** @type {number} */ i) => {
    const p = `visitInfo.journeys[${i}]`;
    if (!MODES.includes(j?.mode)) err(`${p}.mode`, `one of ${MODES.join(", ")}`);
    if (!text(j?.from)) err(`${p}.from`, 'where the journey starts, e.g. "Leeds station"');
    if (!Number.isInteger(j?.minutes) || j.minutes < 1 || j.minutes > 180) err(`${p}.minutes`, "whole minutes, 1–180");
    if (!Array.isArray(j?.steps) || !j.steps.length || !j.steps.every(text)) err(`${p}.steps`, "one or more short directions");
  });
  (v.parking ?? []).forEach((/** @type {any} */ c, /** @type {number} */ i) => checkCarPark(c, `visitInfo.parking[${i}]`, err));
  (v.access ?? []).forEach((/** @type {any} */ a, /** @type {number} */ i) => {
    if (!text(a?.label) || typeof a?.yes !== "boolean") err(`visitInfo.access[${i}]`, '{ "label": "Step-free entrance", "yes": true }');
  });
  const facts = (v.journeys ?? []).length || (v.parking ?? []).length || (v.access ?? []).length;
  if (v.checked !== undefined || (isClient && facts)) {
    const m = /^(\d{4})-(\d{2})$/.exec(String(v.checked));
    if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) err("visitInfo.checked", 'the month these journey, parking and access facts were checked with the business, "YYYY-MM"');
  }
}

/** "October 2026" from "2026-10". @param {string} ym */
export const checkedText = (ym) => new Date(`${ym}-15T12:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
