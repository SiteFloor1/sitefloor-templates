// @ts-check
/**
 * Remember the date: a calendar file the customer keeps (nothing is sent to the florist or to us). One yearly event
 * on the date itself, with a reminder on the last day to order in time, at 9am shop time.
 */
import { wallTimeToUtc, addDays } from "../../../core/lib/hours.js";

/** @param {number} ms */
const utc = (ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
/** @param {string} s */
const esc = (s) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

/** Folds a line at 75 octets, as the calendar format asks. @param {string} line */
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
 * The next time a yearly date falls on or after a day; 29 February falls back to 28 February in other years.
 * @param {string} date YYYY-MM-DD @param {string} from YYYY-MM-DD
 */
export function nextYearly(date, from) {
  const md = date.slice(5);
  const y = Number(from.slice(0, 4));
  const on = (/** @type {number} */ yr) => { const leap = (yr % 4 === 0 && yr % 100 !== 0) || yr % 400 === 0; return `${yr}-${md === "02-29" && !leap ? "02-28" : md}`; };
  return on(y) >= from ? on(y) : on(y + 1);
}

/**
 * @param {{ label: string, date: string, orderDaysBefore: number, business: string, url: string, timeZone: string, today: string, stamp: Date, uid: string }} o
 * @returns {string} an .ics file
 */
export function rememberIcs(o) {
  const day = nextYearly(o.date, o.today);
  const at = (/** @type {string} */ d) => { const [year, month, dd] = d.split("-").map(Number); return wallTimeToUtc({ year, month, day: dd, hour: 9, minute: 0 }, o.timeZone); };
  const start = at(day);
  const orderBy = addDays(day, -o.orderDaysBefore);
  const minutesBefore = Math.round((start - at(orderBy)) / 60000);
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sitefloor//Florist//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${o.uid}`,
    `DTSTAMP:${utc(o.stamp.getTime())}`,
    `DTSTART:${utc(start)}`,
    `DTEND:${utc(start + 30 * 60000)}`,
    "RRULE:FREQ=YEARLY",
    `SUMMARY:${esc(o.label)}`,
    `DESCRIPTION:${esc(`Flowers from ${o.business}: order by the day before to be sure of delivery. ${o.url}`)}`,
    `URL:${o.url}`,
    "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(`Order flowers for ${o.label}`)}`, `TRIGGER:-PT${minutesBefore}M`, "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ];
  return `${lines.map(fold).join("\r\n")}\r\n`;
}
