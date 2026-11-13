// @ts-check
/**
 * Calendar days for the nail salon: the bridal timeline (the trial, the final set, worked back from the wedding by the
 * salon's own numbers of days), the infill reminder and the monthly edit's month. Days are YYYY-MM-DD handled in UTC so
 * a clock change never moves an appointment; calendar files use all-day events, which carry no time zone at all.
 */

const DAY = 86_400_000;
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** A real calendar day (no 30 February). @param {unknown} v @returns {v is string} */
export function isYmd(v) {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

/** Three numbers in, YYYY-MM-DD out, or "" if the day doesn't exist. @param {number} y @param {number} m 1–12 @param {number} d */
export function ymdOf(y, m, d) {
  const v = `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return isYmd(v) ? v : "";
}

/** @param {string} ymd @param {number} days */
export function addDaysYmd(ymd, days) {
  return new Date(Date.parse(`${ymd}T12:00:00Z`) + days * DAY).toISOString().slice(0, 10);
}

/** UK order, always: "Saturday 18 September 2027". @param {string} ymd @param {boolean} [weekday] */
export function ukDate(ymd, weekday = true) {
  const d = new Date(`${ymd}T12:00:00Z`);
  const day = d.toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" });
  return `${weekday ? `${day} ` : ""}${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "2026-11" → "November". @param {string} ym */
export function monthName(ym) {
  return MONTHS[Number(ym.slice(5, 7)) - 1] ?? "";
}

/**
 * The monthly edit shows from a month before its month until two weeks after it ends; then it hides itself, so a
 * salon that forgets to change it never shows last season as new. @param {string} ym "YYYY-MM" @param {string} today
 */
export function editLive(ym, today) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(ym)) return false;
  const start = `${ym}-01`;
  const [y, m] = ym.split("-").map(Number);
  const end = addDaysYmd(m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`, -1);
  return today >= addDaysYmd(start, -31) && today <= addDaysYmd(end, 14);
}

/** @typedef {{ id: string, label: string, daysBefore: number, text?: string }} BridalStep */

/**
 * Each bridal step's day, earliest first, marked past if it falls before today.
 * @param {string} wedding @param {BridalStep[]} steps @param {string} today
 */
export function bridalDates(wedding, steps, today) {
  return steps
    .map((s) => { const date = addDaysYmd(wedding, -s.daysBefore); return { ...s, date, past: date < today }; })
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** @param {string} s */
const icsText = (s) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/**
 * A calendar file of all-day events.
 * @param {{ salon: string, place: string, stamp: string, kind: string, events: { id: string, date: string, title: string, note?: string }[] }} o
 *   stamp = UTC "YYYYMMDDTHHMMSSZ"; kind names the file's purpose, e.g. "bridal nails"
 */
export function allDayIcs(o) {
  const slug = o.salon.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Sitefloor//${icsText(o.salon)} ${icsText(o.kind)}//EN`, "CALSCALE:GREGORIAN",
    ...o.events.flatMap((e) => [
      "BEGIN:VEVENT",
      `UID:${e.id}-${e.date}@${slug}`,
      `DTSTAMP:${o.stamp}`,
      `DTSTART;VALUE=DATE:${e.date.replace(/-/g, "")}`,
      `DTEND;VALUE=DATE:${addDaysYmd(e.date, 1).replace(/-/g, "")}`,
      `SUMMARY:${icsText(e.title)}`,
      ...(e.note ? [`DESCRIPTION:${icsText(e.note)}`] : []),
      `LOCATION:${icsText(o.place)}`,
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ].join("\r\n") + "\r\n";
}

/** "20261029T091200Z" for the calendar's stamp. @param {Date} d */
export function icsStamp(d) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
