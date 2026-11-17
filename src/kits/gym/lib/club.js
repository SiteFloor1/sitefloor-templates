// @ts-check
/**
 * Gym kit logic for the club's own pages, no DOM: the class finder, the coaches' weeks, personal training prices and
 * the members' events. Every class, time, coach, price and date is the club's own (site.json); nothing here adds one.
 */
import { wallTimeToUtc, DAY_KEYS } from "../../../core/lib/hours.js";
import { addDaysYmd } from "../../../core/lib/diary.js";
import { pounds, feeWords, numberWords } from "./gym.js";

/** The week in the order a gym's members read it, Monday first. */
export const WEEK = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const SHORT = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };

/* ------------------------------------------------------------------------------------------------------------------
 * The class finder: each class with every time it runs in the week, and the parts of the day those times fall in.
 * ------------------------------------------------------------------------------------------------------------------ */

/** @typedef {{ time: string, class: string, coach?: string, room?: string, url?: string }} Slot */
/** @typedef {{ day: string, time: string, coach: string, room: string, url: string, band: string }} Session */

/** The part of the day a class starts in: before 10:00 "morning", before 16:00 "midday", then "evening". @param {string} time */
export const timeBand = (time) => (time < "10:00" ? "morning" : time < "16:00" ? "midday" : "evening");

/** "Tue 18:45" @param {string} day @param {string} time */
export const sessionLabel = (day, time) => `${SHORT[/** @type {keyof typeof SHORT} */ (day)]} ${time}`;

/**
 * Each class with its week: [{ ...class, sessions, bands }], in the club's own order. A class not on the timetable
 * keeps an empty week (the page says so rather than hiding it).
 * @param {any[]} items @param {Record<string, Slot[]>} weekly
 */
export function classWeeks(items, weekly) {
  return items.map((c) => {
    /** @type {Session[]} */
    const sessions = WEEK.flatMap((day) => (weekly[day] ?? []).filter((s) => s.class === c.id)
      .sort((a, b) => (a.time < b.time ? -1 : 1))
      .map((s) => ({ day, time: s.time, coach: s.coach ?? "", room: s.room ?? "", url: s.url ?? "", band: timeBand(s.time) })));
    return { ...c, sessions, bands: [...new Set(sessions.map((s) => s.band))] };
  });
}

/**
 * Does a class match the finder's choice? An empty choice matches everything. The goal and the level are the club's
 * own words for the class (classTypes.items[].goals and .level).
 * @param {{ goals?: string[], level?: string, bands: string[] }} c @param {{ goal?: string, level?: string, band?: string }} pick
 */
export function classMatches(c, pick) {
  if (pick.goal && !(c.goals ?? []).includes(pick.goal)) return false;
  if (pick.level && c.level !== pick.level) return false;
  if (pick.band && !c.bands.includes(pick.band)) return false;
  return true;
}

/** "4 classes" / "1 class" / "No class fits that; try another time of day" @param {number} n */
export const finderCount = (n) => (n === 0 ? "No class fits that. Try another time of day." : `${numberWords(n)} ${n === 1 ? "class" : "classes"}`);

/**
 * A coach's week from the timetable, by the name the timetable uses: [{ day, time, class }], Monday first.
 * @param {Record<string, Slot[]>} weekly @param {string} name
 */
export function coachWeek(weekly, name) {
  return WEEK.flatMap((day) => (weekly[day] ?? []).filter((s) => s.coach === name).sort((a, b) => (a.time < b.time ? -1 : 1))
    .map((s) => ({ day, time: s.time, class: s.class })));
}

/**
 * A coach's classes, each once, with its times: [{ class, times: ["Tue 18:45", …] }], in the order they first teach.
 * @param {Record<string, Slot[]>} weekly @param {string} name
 */
export function coachClasses(weekly, name) {
  /** @type {Map<string, string[]>} */
  const by = new Map();
  for (const s of coachWeek(weekly, name)) by.set(s.class, [...(by.get(s.class) ?? []), sessionLabel(s.day, s.time)]);
  return [...by].map(([cls, times]) => ({ class: cls, times }));
}

/* ------------------------------------------------------------------------------------------------------------------
 * Personal training. The same price rule as memberships (DMCC Act 2024, CMA209): the headline is what the client pays
 * for the pack, every mandatory fee in (an assessment, say); the price a session follows it, worked out from that total.
 * ------------------------------------------------------------------------------------------------------------------ */

/** @typedef {{ sessions: number, price: number, mandatoryFees: { name: string, amount: number }[] }} Pack */

/** @param {Pack} p */
export const packTotal = (p) => p.price + p.mandatoryFees.reduce((s, f) => s + f.amount, 0);

/**
 * "£300 for six sessions, assessment fee included" and "£50 a session".
 * A single session reads "£55 a session". The per-session figure is rounded down to the penny, never up.
 * @param {Pack} p @returns {{ headline: string, each: string, fine: string }}
 */
export function packWords(p) {
  const total = packTotal(p);
  const included = p.mandatoryFees.length ? `, ${feeWords(p.mandatoryFees)} included` : "";
  const fine = p.mandatoryFees.map((f) => `${f.name.toLowerCase()} ${pounds(f.amount)}`).join(" · ");
  if (p.sessions === 1) return { headline: `${pounds(total)} a session${included}`, each: "", fine };
  const each = Math.floor((total * 100) / p.sessions) / 100;
  const eachText = Number.isInteger(each) ? pounds(each) : `£${each.toFixed(2)}`;
  return { headline: `${pounds(total)} for ${numberWords(p.sessions).toLowerCase()} sessions${included}`, each: `${eachText} a session`, fine };
}

/* ------------------------------------------------------------------------------------------------------------------
 * Members' events: the club's own list. Past events leave the page by themselves (at the build and in the browser);
 * each event goes into the calendar as one file, its time in UTC so it lands right in any time zone.
 * ------------------------------------------------------------------------------------------------------------------ */

/** @typedef {{ id: string, title: string, date: string, time: string, minutes: number, text: string, who?: string, place?: string, url?: string }} ClubEvent */

/** Events on or after a day, soonest first. @param {ClubEvent[]} items @param {string} today YYYY-MM-DD */
export const upcomingEvents = (items, today) => items.filter((e) => e.date >= today).sort((a, b) => (a.date + a.time < b.date + b.time ? -1 : 1));

/** "18:30 to 20:00" @param {ClubEvent} e */
export function eventHours(e) {
  const [h, m] = e.time.split(":").map(Number);
  const end = h * 60 + m + e.minutes;
  const hh = String(Math.floor(end / 60) % 24).padStart(2, "0"), mm = String(end % 60).padStart(2, "0");
  return `${e.time} to ${hh}:${mm}`;
}

const icsText = (/** @type {string} */ s) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const icsUtc = (/** @type {number} */ ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/**
 * One event as a calendar file. The time is the club's wall time, converted to UTC (so a clock change can't move it).
 * @param {{ event: ClubEvent, club: string, place: string, tz: string, stamp: string }} o
 */
export function eventIcs(o) {
  const e = o.event;
  const [y, m, d] = e.date.split("-").map(Number), [h, mi] = e.time.split(":").map(Number);
  const start = wallTimeToUtc({ year: y, month: m, day: d, hour: h, minute: mi }, o.tz);
  const slug = o.club.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Sitefloor//${icsText(o.club)} events//EN`, "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:${e.id}-${e.date}@${slug}`, `DTSTAMP:${o.stamp}`, `DTSTART:${icsUtc(start)}`, `DTEND:${icsUtc(start + e.minutes * 60_000)}`,
    `SUMMARY:${icsText(`${e.title} · ${o.club}`)}`, `DESCRIPTION:${icsText(e.text)}`, `LOCATION:${icsText(e.place || o.place)}`, "END:VEVENT",
    "END:VCALENDAR"].join("\r\n") + "\r\n";
}

/** Today's weekday key ("tue") for a YYYY-MM-DD. @param {string} ymd */
export const dayKeyOf = (ymd) => DAY_KEYS[new Date(`${ymd}T12:00:00Z`).getUTCDay()];

/** The next n days from today, YYYY-MM-DD. @param {string} today @param {number} n */
export const nextDays = (today, n) => Array.from({ length: n }, (_, i) => addDaysYmd(today, i));
