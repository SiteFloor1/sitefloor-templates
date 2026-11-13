// @ts-check
/**
 * The studio's week: which classes run on a date, the next ones from now, what a person new to the reformer should
 * book first, and the classes they pick as a calendar file. Every class, time and length comes from the studio's own
 * timetable in site.json; nothing here invents one. Dates are calendar days (YYYY-MM-DD); times are the studio's wall
 * clock (HH:MM) in its own time zone.
 */
import { DAY_KEYS, DAY_NAMES, addDays, rangesFor, toMinutes } from "../../../core/lib/hours.js";

/** @typedef {{ id: string, name: string, minutes: number, level?: string, text?: string }} ClassType */
/** @typedef {{ time: string, class: string, teacher?: string }} Slot */
/** @typedef {{ reformers: number, weekly: Record<string, Slot[]> }} Timetable */
/** @typedef {{ date: string, time: string, class: string, teacher: string, key: string }} Session one class on one day */

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** The key a session is known by in the places sheet and in the page. @param {string} date @param {string} time */
export const sessionKey = (date, time) => `${date} ${time}`;

/**
 * The classes on a date, earliest first. A day the studio is closed (a dated exception with no opening hours, e.g.
 * Christmas) has none, so the timetable never shows a class the studio won't run.
 * @param {Timetable} tt @param {import("../../../core/lib/hours.js").Hours} hours @param {string} date
 * @returns {Session[]}
 */
export function classesOn(tt, hours, date) {
  const ex = (hours.exceptions ?? []).find((e) => e.date === date);
  if (ex && !ex.ranges.length) return [];
  const day = DAY_KEYS[new Date(`${date}T12:00:00Z`).getUTCDay()];
  return [...(tt.weekly[day] ?? [])]
    .sort((a, b) => toMinutes(a.time) - toMinutes(b.time))
    .map((s) => ({ date, time: s.time, class: s.class, teacher: s.teacher ?? "", key: sessionKey(date, s.time) }));
}

/** Seven days from `date`, each with its classes. @param {Timetable} tt @param {any} hours @param {string} date @param {number} [days] */
export function weekFrom(tt, hours, date, days = 7) {
  return Array.from({ length: days }, (_, i) => { const d = addDays(date, i); return { date: d, classes: classesOn(tt, hours, d) }; });
}

/**
 * Classes that haven't started yet, soonest first, optionally of one type.
 * @param {Timetable} tt @param {any} hours @param {{ date: string, minutes: number }} now @param {number} n @param {string} [type]
 * @returns {Session[]}
 */
export function upcoming(tt, hours, now, n, type) {
  /** @type {Session[]} */
  const out = [];
  for (let i = 0; i < 28 && out.length < n; i++) {
    const d = addDays(now.date, i);
    for (const s of classesOn(tt, hours, d)) {
      if (i === 0 && toMinutes(s.time) <= now.minutes) continue;
      if (type && s.class !== type) continue;
      out.push(s);
      if (out.length === n) break;
    }
  }
  return out;
}

/** "Thursday 29 October". @param {string} date */
export function dayName(date) {
  const d = new Date(`${date}T12:00:00Z`);
  return `${DAY_NAMES[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** "Thu 29". @param {string} date */
export function shortDay(date) {
  const d = new Date(`${date}T12:00:00Z`);
  return `${DAY_NAMES[d.getUTCDay()].slice(0, 3)} ${d.getUTCDate()}`;
}

/** "7.15" for 07:15, as the studio would say it. @param {string} hhmm */
export function saidTime(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h}.${String(m).padStart(2, "0")}`;
}

/**
 * The six (or however many) reformers, booked first: true = booked, false = free. Unknown places give null.
 * @param {number} reformers @param {number|null} left
 * @returns {boolean[]|null}
 */
export function reformerMarks(reformers, left) {
  if (left === null || !Number.isInteger(left) || left < 0) return null;
  const free = Math.min(left, reformers);
  return Array.from({ length: reformers }, (_, i) => i < reformers - free);
}

/** "2 left", "1 left", "Full". @param {number} left */
export const placesWords = (left) => (left <= 0 ? "Full" : `${left} left`);

/**
 * Find your first class: three answers in, the studio's own choice of class out. The studio maps each answer to one
 * of its class ids in site.json (classFinder); a pregnancy answer always wins, then "new", then the pace.
 * @param {{ pregnancy: boolean, isNew: boolean, pace: "slower"|"steady"|"faster" }} a
 * @param {{ new: string, slower: string, steady: string, faster: string, pregnancy?: string }} map
 * @returns {{ class: string, why: "pregnancy"|"new"|"pace" }}
 */
export function findClass(a, map) {
  if (a.pregnancy && map.pregnancy) return { class: map.pregnancy, why: "pregnancy" };
  if (a.isNew) return { class: map.new, why: "new" };
  return { class: map[a.pace], why: "pace" };
}

/** Fills {class}, {day} and {time} in the studio's waitlist message. @param {string} template @param {{ class: string, day: string, time: string }} v */
export function waitlistText(template, v) {
  return template.replace(/\{(class|day|time)\}/g, (_, k) => v[/** @type {"class"|"day"|"time"} */ (k)]);
}

/** @param {string} s */
const icsText = (s) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/**
 * The classes someone picked, as one calendar file. Times carry the studio's time zone (TZID), so the class sits at
 * the right hour wherever the phone is.
 * @param {{ items: { date: string, time: string, minutes: number, name: string }[], studio: string, place: string, tz: string, stamp: string }} o
 * @returns {string}
 */
export function weekIcs(o) {
  const local = (/** @type {string} */ date, /** @type {number} */ mins) => {
    const day = addDays(date, Math.floor(mins / 1440)), m = mins % 1440;
    return `${day.replace(/-/g, "")}T${String(Math.floor(m / 60)).padStart(2, "0")}${String(m % 60).padStart(2, "0")}00`;
  };
  const slug = o.studio.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Sitefloor//${icsText(o.studio)} classes//EN`, "CALSCALE:GREGORIAN",
    ...o.items.flatMap((c) => {
      const start = toMinutes(c.time);
      return [
        "BEGIN:VEVENT",
        `UID:${c.date}-${c.time.replace(":", "")}@${slug}`,
        `DTSTAMP:${o.stamp}`,
        `DTSTART;TZID=${o.tz}:${local(c.date, start)}`,
        `DTEND;TZID=${o.tz}:${local(c.date, start + c.minutes)}`,
        `SUMMARY:${icsText(`${c.name} · ${o.studio}`)}`,
        `LOCATION:${icsText(o.place)}`,
        "END:VEVENT",
      ];
    }),
    "END:VCALENDAR",
  ].join("\r\n") + "\r\n";
}

/** Is the studio open on this date at all (for "closed today" wording). @param {any} hours @param {string} date */
export const openOn = (hours, date) => rangesFor(hours, date).ranges.length > 0;
