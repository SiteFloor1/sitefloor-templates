// @ts-check
/**
 * Calendar files (.ics, every time in UTC): an anniversary reminder a few weeks before the date each year, and a
 * yearly clean-and-check reminder after a piece is collected. One recurring event each, at 10am shop time.
 */
import { wallTimeToUtc, addDays } from "../../../core/lib/hours.js";

const AT = { hour: 10, minute: 0 };

/** @param {number} ms */
const utc = (ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
/** @param {string} s */
const esc = (s) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

/**
 * The next time a yearly date (month and day) falls on or after a given day.
 * @param {string} date YYYY-MM-DD (any year: only month and day are used) @param {string} from YYYY-MM-DD
 * @returns {string} YYYY-MM-DD
 */
export function nextYearly(date, from) {
  const md = date.slice(5);
  const y = Number(from.slice(0, 4));
  // 29 February falls back to 28 February in other years.
  const on = (/** @type {number} */ yr) => { const leap = (yr % 4 === 0 && yr % 100 !== 0) || yr % 400 === 0; return `${yr}-${md === "02-29" && !leap ? "02-28" : md}`; };
  return on(y) >= from ? on(y) : on(y + 1);
}

/** Folds a content line at 75 octets, as the calendar format asks (continuations start with a space). @param {string} line */
function fold(line) {
  const enc = new TextEncoder();
  /** @type {string[]} */ const out = [];
  let cur = "", size = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (size + n > (out.length ? 74 : 75)) { out.push(cur); cur = ""; size = 0; }
    cur += ch; size += n;
  }
  return [...out, cur].join("\r\n ");
}

/**
 * @param {{ uid: string, first: string, title: string, body: string, place: string, timeZone: string, stamp: Date, prodId: string }} o
 *   first: YYYY-MM-DD of the first reminder; it repeats every year
 */
function yearlyIcs(o) {
  const [year, month, day] = o.first.split("-").map(Number);
  const start = wallTimeToUtc({ year, month, day, ...AT }, o.timeZone);
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Sitefloor//${o.prodId}//EN`, "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:${o.uid}@sitefloor`, `DTSTAMP:${utc(o.stamp.getTime())}`,
    `DTSTART:${utc(start)}`, `DTEND:${utc(start + 15 * 60_000)}`, "RRULE:FREQ=YEARLY",
    `SUMMARY:${esc(o.title)}`, `LOCATION:${esc(o.place)}`, `DESCRIPTION:${esc(o.body)}`,
    "BEGIN:VALARM", "TRIGGER:PT0M", "ACTION:DISPLAY", `DESCRIPTION:${esc(o.title)}`, "END:VALARM",
    "END:VEVENT", "END:VCALENDAR", "",
  ].map(fold).join("\r\n");
}

/**
 * An anniversary reminder `weeksBefore` weeks ahead of the date, every year.
 * @param {{ date: string, weeksBefore: number, label: string, business: string, place: string, url: string, timeZone: string, today: string, stamp: Date, ideas?: string[] }} o ideas: the shortlist, one line each
 *   date: the anniversary (YYYY-MM-DD, any year); label: whose anniversary, in the customer's words
 */
export function anniversaryIcs(o) {
  const next = nextYearly(o.date, addDays(o.today, o.weeksBefore * 7));
  const first = addDays(next, -o.weeksBefore * 7);
  const when = new Date(`${next}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
  return yearlyIcs({
    uid: `anniversary-${o.date.slice(5)}-${o.weeksBefore}`, first, prodId: "Anniversary",
    title: `${o.label} on ${when}: ${o.weeksBefore} weeks to go`,
    body: `${o.label} is on ${when}. Time to choose something.${o.ideas?.length ? `\n\nYour shortlist from ${o.business}:\n${o.ideas.join("\n")}` : ""}\n\n${o.business}\n${o.url}`,
    place: o.place, timeZone: o.timeZone, stamp: o.stamp,
  });
}

/**
 * A yearly clean-and-check reminder, a year after the day the piece was collected.
 * @param {{ collected: string, piece: string, business: string, place: string, timeZone: string, stamp: Date, note: string }} o
 */
export function aftercareIcs(o) {
  return yearlyIcs({
    uid: `aftercare-${o.collected}`, first: nextYearly(o.collected, addDays(o.collected, 1)), prodId: "Aftercare",
    title: `${o.piece}: a clean and check at ${o.business}`,
    body: `${o.note}\n\n${o.business}, ${o.place}`,
    place: o.place, timeZone: o.timeZone, stamp: o.stamp,
  });
}
