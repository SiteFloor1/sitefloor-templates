// @ts-check
/**
 * Dates worked back from a wedding (the bridal kit's gown diary, the lingerie kit's wedding dates): order by, each
 * fitting, collection.
 * Every step is a number of weeks before the wedding that the salon sets in site.json (diary.steps); nothing here
 * invents a lead time. Dates are calendar days (YYYY-MM-DD) handled in UTC so a clock change never moves a fitting.
 */

/** @typedef {{ id: string, label: string, weeksBefore: number, note?: string }} DiaryStep */
/** @typedef {DiaryStep & { date: string, past: boolean }} DiaryDate */

const DAY = 86400000;
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Is this a real calendar day (no 30 February)? @param {unknown} v @returns {v is string} */
export function isYmd(v) {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

/** A day, three numbers in, as YYYY-MM-DD, or "" if the day doesn't exist. @param {number} y @param {number} m 1–12 @param {number} d */
export function ymdOf(y, m, d) {
  const v = `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return isYmd(v) ? v : "";
}

/** @param {string} ymd @param {number} days */
export function addDaysYmd(ymd, days) {
  return new Date(Date.parse(`${ymd}T12:00:00Z`) + days * DAY).toISOString().slice(0, 10);
}

/** Whole days from a to b (negative if b is earlier). @param {string} a @param {string} b */
export function daysBetween(a, b) {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / DAY);
}

/** UK order, always: "Saturday 18 September 2027" (or without the weekday). @param {string} ymd @param {boolean} [weekday] */
export function ukDate(ymd, weekday = true) {
  const d = new Date(`${ymd}T12:00:00Z`);
  const day = d.toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" });
  return `${weekday ? `${day} ` : ""}${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** The last day to order, `weeks` before the wedding. @param {string} wedding @param {number} weeks */
export function orderBy(wedding, weeks) {
  return addDaysYmd(wedding, -7 * weeks);
}

/**
 * Every step's date, earliest first, each marked past if it falls before today.
 * @param {string} wedding @param {DiaryStep[]} steps @param {string} today
 * @returns {DiaryDate[]}
 */
export function diaryDates(wedding, steps, today) {
  return steps
    .map((s) => { const date = addDaysYmd(wedding, -7 * s.weeksBefore); return { ...s, date, past: date < today }; })
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/**
 * Where a bride stands: weeks to go, whether the wedding is already past, and whether the order date has gone by.
 * @param {string} wedding @param {string} today @param {number} orderWeeks
 * @returns {{ days: number, weeks: number, passed: boolean, late: boolean, orderDate: string }}
 */
export function diaryStatus(wedding, today, orderWeeks) {
  const days = daysBetween(today, wedding);
  const orderDate = orderBy(wedding, orderWeeks);
  return { days, weeks: Math.floor(days / 7), passed: days < 0, late: days >= 0 && orderDate < today, orderDate };
}

/** @param {string} s */
const icsText = (s) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/**
 * The diary as a calendar file: one all-day event per step that hasn't passed, and the wedding itself.
 * All-day events carry no time, so no time zone can shift them.
 * @param {{ wedding: string, dates: DiaryDate[], salon: string, place: string, stamp: string, title?: string }} o stamp = UTC "YYYYMMDDTHHMMSSZ"; title names the calendar (default "gown diary")
 * @returns {string}
 */
export function diaryIcs(o) {
  const ev = (/** @type {string} */ id, /** @type {string} */ date, /** @type {string} */ title, /** @type {string} */ note) => [
    "BEGIN:VEVENT",
    `UID:${id}-${o.wedding}@${o.salon.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    `DTSTAMP:${o.stamp}`,
    `DTSTART;VALUE=DATE:${date.replace(/-/g, "")}`,
    `DTEND;VALUE=DATE:${addDaysYmd(date, 1).replace(/-/g, "")}`,
    `SUMMARY:${icsText(title)}`,
    ...(note ? [`DESCRIPTION:${icsText(note)}`] : []),
    `LOCATION:${icsText(o.place)}`,
    "END:VEVENT",
  ];
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Sitefloor//${icsText(o.salon)} ${icsText(o.title ?? "gown diary")}//EN`, "CALSCALE:GREGORIAN",
    ...o.dates.filter((d) => !d.past).flatMap((d) => ev(d.id, d.date, `${d.label} · ${o.salon}`, d.note ?? "")),
    ...ev("wedding", o.wedding, "The wedding", ""),
    "END:VCALENDAR",
  ].join("\r\n") + "\r\n";
}
