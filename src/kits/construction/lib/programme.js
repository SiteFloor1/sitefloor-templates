// @ts-check
/**
 * A build's programme from the builder's own stage lengths: when each stage would start and end for a start date the
 * visitor picks, as earliest and latest (every stage at its fewest weeks, or at its most), and the stage starts as a
 * calendar file. The lengths are the builder's, from their recent jobs; the dates are arithmetic, not a promise.
 */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** YYYY-MM-DD plus n days. @param {string} ymd @param {number} n */
export function addDays(ymd, n) {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** "9 Mar 2027" @param {string} ymd */
export function shortDate(ymd) {
  const d = new Date(`${ymd}T12:00:00Z`);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "Mar 2027" or "Mar–May 2027" or "Dec 2026–Feb 2027" @param {string} a @param {string} b */
export function monthSpan(a, b) {
  const x = new Date(`${a}T12:00:00Z`), y = new Date(`${b}T12:00:00Z`);
  const m = (/** @type {Date} */ d) => MONTHS[d.getUTCMonth()];
  if (x.getUTCFullYear() !== y.getUTCFullYear()) return `${m(x)} ${x.getUTCFullYear()}–${m(y)} ${y.getUTCFullYear()}`;
  return x.getUTCMonth() === y.getUTCMonth() ? `${m(x)} ${x.getUTCFullYear()}` : `${m(x)}–${m(y)} ${y.getUTCFullYear()}`;
}

/**
 * @param {{ id: string, name: string, weeks: [number, number] }[]} stages in order, each with its length
 * @param {string} start YYYY-MM-DD
 * @returns {{ id: string, name: string, from: [string, string], to: [string, string] }[] | null} earliest and latest; null unless every stage has a length
 */
export function programme(stages, start) {
  if (!stages.length || stages.some((s) => !Array.isArray(s.weeks)) || !/^\d{4}-\d{2}-\d{2}$/.test(start)) return null;
  let lo = start, hi = start;
  return stages.map((s) => {
    const from = /** @type {[string, string]} */ ([lo, hi]);
    lo = addDays(lo, s.weeks[0] * 7); hi = addDays(hi, s.weeks[1] * 7);
    return { id: s.id, name: s.name, from, to: [lo, hi] };
  });
}

/**
 * The stage starts as one calendar file (all-day events at the earliest dates, marked as estimates).
 * @param {{ id: string, name: string, from: [string, string] }[]} plan @param {string} business @param {Date} stamp
 */
export function programmeIcs(plan, business, stamp) {
  const esc = (/** @type {string} */ s) => s.replace(/[\\;,]/g, (c) => `\\${c}`);
  const utc = stamp.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sitefloor//build programme//EN", "CALSCALE:GREGORIAN",
    ...plan.flatMap((p) => ["BEGIN:VEVENT", `UID:${p.id}-${p.from[0]}@sitefloor`, `DTSTAMP:${utc}`,
      `DTSTART;VALUE=DATE:${p.from[0].replace(/-/g, "")}`, `DTEND;VALUE=DATE:${addDays(p.from[0], 1).replace(/-/g, "")}`,
      `SUMMARY:${esc(`${p.name} starts (estimate)`)}`,
      `DESCRIPTION:${esc(`An estimate from ${business}'s usual stage lengths, between ${shortDate(p.from[0])} and ${shortDate(p.from[1])}. Your programme confirms it.`)}`,
      "END:VEVENT"]),
    "END:VCALENDAR", ""].join("\r\n");
}
