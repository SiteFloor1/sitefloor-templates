// @ts-check
/**
 * The move-in day planner: dates worked out from the day the keys are handed over, and a calendar file. The steps
 * that rest on the law say so and carry their GOV.UK source (checked 15 Nov 2026): a deposit must be protected, and
 * the tenant told the scheme and the rest of the prescribed information, within 30 days of the landlord getting it.
 * Everything else is the agent's own (site.json: moveday.steps). Calendar days only (YYYY-MM-DD), so a clock change
 * never moves a step. Pure logic, no DOM.
 */
import { addDaysYmd, ukDate, isYmd } from "../../../core/lib/diary.js";

export const DEPOSIT_RULE = {
  days: 30,
  source: "https://www.gov.uk/deposit-protection-schemes-and-landlords/information-you-must-give-to-your-tenants",
  checked: "2026-11-15",
};

/** @typedef {{ id: string, label: string, offset: number, time?: string, note?: string }} Step */
/** @typedef {Step & { date: string, when: string, rule?: boolean }} Planned */

/**
 * The plan for a move-in day: the agent's steps, then the deposit check 30 days after the deposit was paid (on or
 * before the keys; the move-in day if not given). Sorted by date, then by time.
 * @param {string} keys YYYY-MM-DD @param {Step[]} steps @param {string} [depositPaid] YYYY-MM-DD
 * @returns {Planned[]}
 */
export function plan(keys, steps, depositPaid) {
  if (!isYmd(keys)) return [];
  const paid = depositPaid && isYmd(depositPaid) && depositPaid <= keys ? depositPaid : keys;
  /** @type {Planned[]} */
  const out = steps.map((s) => ({ ...s, date: addDaysYmd(keys, s.offset), when: "" }));
  out.push({ id: "deposit", label: "Your deposit's protection details should be with you", offset: 0, date: addDaysYmd(paid, DEPOSIT_RULE.days), when: "", rule: true,
    note: "The landlord or agent must protect your deposit in a government-approved scheme, and tell you which one and how to get it back, within 30 days of getting it. If they haven't reached you, ask." });
  for (const p of out) p.when = ukDate(p.date);
  // by day; within a day, timed steps first (in time order), then the rest in the agent's order
  return out.map((p, i) => ({ p, i })).sort((a, b) => a.p.date.localeCompare(b.p.date) || (a.p.time ?? "99").localeCompare(b.p.time ?? "99") || a.i - b.i).map((x) => x.p);
}

/** @param {string} s */
const esc = (s) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
/** Lines no longer than 75 octets (UTF-8), as the format asks, never splitting a character. @param {string} line */
function fold(line) {
  const enc = new TextEncoder(), out = [];
  let cur = "", bytes = 0, limit = 75;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (bytes + n > limit) { out.push(cur); cur = " "; bytes = 1; limit = 75; }
    cur += ch; bytes += n;
  }
  out.push(cur);
  return out.join("\r\n");
}

/** UK time (Europe/London) for timed steps, so every calendar reads them as UK clock time, summer and winter. */
const LONDON = ["BEGIN:VTIMEZONE", "TZID:Europe/London",
  "BEGIN:DAYLIGHT", "TZOFFSETFROM:+0000", "TZOFFSETTO:+0100", "TZNAME:BST", "DTSTART:19700329T010000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU", "END:DAYLIGHT",
  "BEGIN:STANDARD", "TZOFFSETFROM:+0100", "TZOFFSETTO:+0000", "TZNAME:GMT", "DTSTART:19701025T020000", "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU", "END:STANDARD",
  "END:VTIMEZONE"];

/**
 * The plan as a calendar file. Timed steps last an hour at the agent's local time (TZID); others are all-day.
 * @param {{ planned: Planned[], agent: string, place: string, stamp: string, tz: string }} o stamp = UTC "YYYYMMDDTHHMMSSZ"
 */
export function planIcs(o) {
  const slug = o.agent.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const ev = (/** @type {Planned} */ p) => {
    const d = p.date.replace(/-/g, "");
    const timed = p.time && /^\d{2}:\d{2}$/.test(p.time);
    const start = timed ? `DTSTART;TZID=${o.tz}:${d}T${p.time?.replace(":", "")}00` : `DTSTART;VALUE=DATE:${d}`;
    const endH = timed ? String(Number(p.time?.slice(0, 2)) + 1).padStart(2, "0") + (p.time?.slice(3) ?? "00") : "";
    const end = timed ? `DTEND;TZID=${o.tz}:${d}T${endH}00` : `DTEND;VALUE=DATE:${addDaysYmd(p.date, 1).replace(/-/g, "")}`;
    return ["BEGIN:VEVENT", `UID:${p.id}-${d}@${slug}`, `DTSTAMP:${o.stamp}`, start, end, `SUMMARY:${esc(p.label)}`,
      ...(p.note ? [`DESCRIPTION:${esc(p.note)}`] : []), `LOCATION:${esc(o.place)}`, "END:VEVENT"];
  };
  const timed = o.planned.some((p) => p.time);
  if (timed && o.tz !== "Europe/London") throw new Error(`no time zone definition for ${o.tz}`);
  return ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Sitefloor//${esc(o.agent)} move-in day//EN`, "CALSCALE:GREGORIAN",
    ...(timed ? LONDON : []), ...o.planned.flatMap(ev), "END:VCALENDAR"].map(fold).join("\r\n") + "\r\n";
}
