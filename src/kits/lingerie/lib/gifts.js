// @ts-check
/**
 * The gift concierge: the dates someone buys for (her birthday, an anniversary, Valentine's), each next occurrence, and
 * a calendar file that reminds them in time to order. Reminders are separate all-day events (not alarms), because many
 * calendars drop alarms from imported files; all-day events carry no time, so no time zone can move them.
 */
import { addDaysYmd, ukDate } from "../../../core/lib/diary.js";

/** Is "MM-DD" a day that exists in some year (29 February included)? @param {unknown} v */
export function isMonthDay(v) {
  if (typeof v !== "string" || !/^\d{2}-\d{2}$/.test(v)) return false;
  const [m, d] = v.split("-").map(Number);
  return m >= 1 && m <= 12 && d >= 1 && d <= new Date(Date.UTC(2024, m, 0)).getUTCDate();
}

/** @param {number} y */
const leap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** "MM-DD" in a given year; 29 February falls on the 28th in other years. @param {string} md @param {number} y */
export function inYear(md, y) {
  const day = md === "02-29" && !leap(y) ? "02-28" : md;
  return `${y}-${day}`;
}

/** The next time "MM-DD" comes round, today included. @param {string} md @param {string} today YYYY-MM-DD */
export function nextOccurrence(md, today) {
  const y = Number(today.slice(0, 4));
  const thisYear = inYear(md, y);
  return thisYear >= today ? thisYear : inYear(md, y + 1);
}

/** @param {string} s */
const icsText = (s) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/**
 * One yearly all-day event per date, and for each a yearly reminder `lead` days before.
 * @param {{ business: string, link: string, stamp: string, leads: number[], dates: { id: string, label: string, md: string }[], today: string }} o
 *   stamp = UTC "YYYYMMDDTHHMMSSZ"; leads = days before, e.g. [21, 7]
 * @returns {string}
 */
export function conciergeIcs(o) {
  const slug = o.business.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  /** @param {string} uid @param {string} date @param {string} rrule @param {string} title @param {string} note */
  const ev = (uid, date, rrule, title, note) => [
    "BEGIN:VEVENT", `UID:${uid}@${slug}`, `DTSTAMP:${o.stamp}`,
    `DTSTART;VALUE=DATE:${date.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${addDaysYmd(date, 1).replace(/-/g, "")}`,
    rrule, `SUMMARY:${icsText(title)}`, ...(note ? [`DESCRIPTION:${icsText(note)}`] : []), "END:VEVENT",
  ];
  const yearly = (/** @type {string} */ md) => (md === "02-29" ? "RRULE:FREQ=YEARLY;BYMONTH=2;BYMONTHDAY=-1" : "RRULE:FREQ=YEARLY");
  const out = ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Sitefloor//${icsText(o.business)} gift dates//EN`, "CALSCALE:GREGORIAN"];
  for (const d of o.dates) {
    const date = nextOccurrence(d.md, o.today);
    out.push(...ev(`${d.id}-${d.md}`, date, yearly(d.md), d.label, ""));
    for (const lead of o.leads) {
      out.push(...ev(`${d.id}-${d.md}-${lead}`, addDaysYmd(date, -lead), "RRULE:FREQ=YEARLY", `${d.label} in ${lead} days`, `Time to choose something from ${o.business}: ${o.link}`));
    }
  }
  out.push("END:VCALENDAR");
  return out.join("\r\n") + "\r\n";
}

/** The dates as a short list for the screen: "Her birthday · Saturday 14 March 2027". @param {{ label: string, md: string }[]} dates @param {string} today */
export function conciergeList(dates, today) {
  return dates.map((d) => ({ label: d.label, date: nextOccurrence(d.md, today), when: ukDate(nextOccurrence(d.md, today)) }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
