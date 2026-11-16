// @ts-check
/**
 * Your year with us: a yearly reminder for the client's own review month, as a calendar file made in the browser.
 * Nothing is stored or sent.
 */
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const esc = (/** @type {string} */ s) => s.replace(/\\/g, "\\\\").replace(/[;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, "\\n");
const slug = (/** @type {string} */ s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * A yearly all-day reminder on the first weekday of the chosen month, starting the next time that month comes round.
 * @param {{ firm: string, month: number, today: Date, note: string }} o month 1–12 @returns {string}
 */
export function reviewIcs(o) {
  if (!Number.isInteger(o.month) || o.month < 1 || o.month > 12) throw new Error("month must be 1 to 12");
  const y = o.today.getUTCFullYear() + (o.month - 1 < o.today.getUTCMonth() ? 1 : 0);
  const d = new Date(Date.UTC(y, o.month - 1, 1));
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() + 1);
  const ymd = (/** @type {Date} */ x) => x.toISOString().slice(0, 10).replace(/-/g, "");
  const next = new Date(d.getTime() + 86_400_000);
  const stamp = o.today.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Sitefloor//${esc(o.firm)} reviews//EN`, "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:review-${o.month}@${slug(o.firm)}`, `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${ymd(d)}`, `DTEND;VALUE=DATE:${ymd(next)}`, "RRULE:FREQ=YEARLY",
    `SUMMARY:${esc(`Yearly review with ${o.firm}`)}`, `DESCRIPTION:${esc(o.note)}`,
    "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
}
