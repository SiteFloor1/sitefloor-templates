// @ts-check
/**
 * SCH-5: the admissions timeline from a date of birth (England and Wales).
 *
 * The school year runs from 1 September to 31 August, so every child born between 1 September and the next 31 August
 * is in one year group. A child starts Reception in the September after their fourth birthday; the youngest in the
 * year (born 31 August) and the oldest (born 1 September) start in the same September.
 *
 * Nothing here invents a school's rules: the entry points the school offers and its registration and assessment
 * deadlines come from site.json (`admissions.entries`), each deadline as a day and month counted from the September of
 * entry (e.g. "15 January of the entry year", "1 November the year before"). Days are calendar days (YYYY-MM-DD)
 * handled in UTC so a clock change never moves one. Scotland and Northern Ireland use other cut-offs and aren't
 * supported: the kit's config refuses them.
 */
import { addDaysYmd, isYmd, ukDate, MONTHS } from "../../../core/lib/diary.js";

/** @typedef {{ id: string, label: string, day: number, month: number, yearsBefore: number, note?: string }} DeadlineRule */
/** @typedef {{ id: string, label: string, yearGroup: number, deadlines?: DeadlineRule[], note?: string }} EntryRule */
/** @typedef {{ id: string, label: string, date: string, past: boolean, note?: string }} Deadline */
/** @typedef {{ id: string, label: string, yearGroup: number, groupName: string, start: string, startWords: string, past: boolean, deadlines: Deadline[], note?: string }} Entry */

/** Year groups as numbers: Nursery -1, Reception 0, Year 1 … Year 13. */
export const NURSERY = -1;
export const RECEPTION = 0;
export const LAST_YEAR = 13;

/** The usual independent-school entry points and the year group each joins. A school lists only the ones it offers. */
export const ENTRY_POINTS = Object.freeze({ "3+": NURSERY, "4+": RECEPTION, "7+": 3, "11+": 7, "13+": 9, "16+": 12 });

/** "Nursery", "Reception", "Year 4", "Year 12 (Lower Sixth)". @param {number} g */
export function groupName(g) {
  if (g === NURSERY) return "Nursery";
  if (g === RECEPTION) return "Reception";
  if (g === 12) return "Year 12 (Lower Sixth)";
  if (g === 13) return "Year 13 (Upper Sixth)";
  return `Year ${g}`;
}

/** The calendar year whose September starts this child's Reception year. @param {string} dob YYYY-MM-DD */
export function receptionYear(dob) {
  if (!isYmd(dob)) throw new RangeError(`Not a real date: ${dob}`);
  const y = Number(dob.slice(0, 4));
  const m = Number(dob.slice(5, 7));
  return (m >= 9 ? y + 1 : y) + 4;
}

/** The September (YYYY-09-01) a child starts year group `g`. @param {string} dob @param {number} g */
export const groupStart = (dob, g) => `${receptionYear(dob) + g}-09-01`;

/** The school year (its starting calendar year) that a day falls in: 1 Sept 2025 – 31 Aug 2026 is 2025. @param {string} ymd */
export const schoolYearOf = (ymd) => Number(ymd.slice(0, 4)) - (Number(ymd.slice(5, 7)) >= 9 ? 0 : 1);

/**
 * The child's year group on a day: a number from Nursery (-1) to Year 13, or "too young" / "left" outside that.
 * @param {string} dob @param {string} today
 * @returns {number | "too young" | "left"}
 */
export function groupOn(dob, today) {
  const g = schoolYearOf(today) - receptionYear(dob);
  if (g < NURSERY) return "too young";
  if (g > LAST_YEAR) return "left";
  return g;
}

/**
 * Born between 1 April and 31 August: the youngest in the year. In England a summer-born child need not start school
 * until the term after their fifth birthday; the kit only flags it, and the school's own words say what it offers.
 * @param {string} dob
 */
export function summerBorn(dob) {
  const m = Number(dob.slice(5, 7));
  return m >= 4 && m <= 8;
}

/**
 * Compulsory school age (England): the first prescribed day (31 December, 31 March or 31 August) on or after the
 * fifth birthday. Education is then required from the start of the next term.
 * @param {string} dob
 */
export function compulsoryFrom(dob) {
  if (!isYmd(dob)) throw new RangeError(`Not a real date: ${dob}`);
  const y = Number(dob.slice(0, 4)) + 5;
  const fifth = isYmd(`${y}${dob.slice(4)}`) ? `${y}${dob.slice(4)}` : `${y}-03-01`; // born 29 February
  for (const d of [`${y}-03-31`, `${y}-08-31`, `${y}-12-31`]) if (d >= fifth) return d;
  return `${y + 1}-03-31`;
}

/** A deadline's day for an entry starting in September of `entryYear`. @param {DeadlineRule} r @param {number} entryYear */
export function deadlineDate(r, entryYear) {
  const y = entryYear - r.yearsBefore;
  const v = `${y}-${String(r.month).padStart(2, "0")}-${String(r.day).padStart(2, "0")}`;
  if (!isYmd(v)) throw new RangeError(`Not a real date: ${v} (${r.id})`);
  return v;
}

/**
 * The child's timeline at this school: every entry point the school offers, with the September the child would
 * join and that entry's deadlines worked out for them. Entries and deadlines already past are kept but marked, so
 * the page can say so plainly; entries are in year-group order.
 * @param {{ dob: string, today: string, entries: EntryRule[] }} o
 * @returns {Entry[]}
 */
export function timeline(o) {
  if (!isYmd(o.today)) throw new RangeError(`Not a real date: ${o.today}`);
  const r = receptionYear(o.dob);
  return [...o.entries].sort((a, b) => a.yearGroup - b.yearGroup).map((e) => {
    const year = r + e.yearGroup;
    const start = `${year}-09-01`;
    const deadlines = (e.deadlines ?? []).map((d) => {
      const date = deadlineDate(d, year);
      return { id: d.id, label: d.label, date, past: date < o.today, ...(d.note ? { note: d.note } : {}) };
    }).sort((a, b) => a.date.localeCompare(b.date));
    return {
      id: e.id, label: e.label, yearGroup: e.yearGroup, groupName: groupName(e.yearGroup), start,
      startWords: `September ${year}`, past: start < o.today, deadlines, ...(e.note ? { note: e.note } : {}),
    };
  });
}

/**
 * The entry to lead with: the earliest one the child can still join whose deadlines haven't all passed, or null when
 * every entry is behind them.
 * @param {Entry[]} t
 */
export function nextEntry(t) {
  return t.find((e) => !e.past && e.deadlines.every((d) => !d.past)) ?? t.find((e) => !e.past) ?? null;
}

/** "Born 14 March 2021" @param {string} dob */
export const bornWords = (dob) => `Born ${ukDate(dob, false)}`;

/** "September 2025" for a YYYY-MM-DD. @param {string} ymd */
export const monthWords = (ymd) => `${MONTHS[Number(ymd.slice(5, 7)) - 1]} ${ymd.slice(0, 4)}`;

/** @param {string} s */
const icsText = (s) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/**
 * One calendar file with the child's dates still to come: each future deadline and the first day of the chosen entry
 * (all-day events). Nothing about the child is in the file except what the parent typed in their own browser.
 * @param {{ entry: Entry, school: string, place: string, stamp: string, startDay?: string }} o
 *   stamp = UTC "YYYYMMDDTHHMMSSZ"; startDay = the school's own first day of term if it publishes one (else 1 September)
 */
export function timelineIcs(o) {
  const slug = o.school.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const ev = (/** @type {string} */ id, /** @type {string} */ date, /** @type {string} */ title, /** @type {string} */ note) => [
    "BEGIN:VEVENT", `UID:${id}-${date}@${slug}`, `DTSTAMP:${o.stamp}`,
    `DTSTART;VALUE=DATE:${date.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${addDaysYmd(date, 1).replace(/-/g, "")}`,
    `SUMMARY:${icsText(`${title} · ${o.school}`)}`, ...(note ? [`DESCRIPTION:${icsText(note)}`] : []),
    `LOCATION:${icsText(o.place)}`, "END:VEVENT",
  ];
  const start = o.startDay && isYmd(o.startDay) ? o.startDay : o.entry.start;
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Sitefloor//${icsText(o.school)} admissions//EN`, "CALSCALE:GREGORIAN",
    ...o.entry.deadlines.filter((d) => !d.past).flatMap((d) => ev(`${o.entry.id}-${d.id}`, d.date, `${d.label} (${o.entry.label} entry)`, d.note ?? "")),
    ...(o.entry.past ? [] : ev(`${o.entry.id}-start`, start, `First term, ${o.entry.groupName}`, "")),
    "END:VCALENDAR",
  ].join("\r\n") + "\r\n";
}
