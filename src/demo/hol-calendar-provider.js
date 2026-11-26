// @ts-check
/**
 * DEMO ONLY. Tressa's sheet of booked stays, written on the day the page is opened: updated at 08:40 today (the
 * evening before, earlier in the morning), with each home booked in runs around a few free gaps over the next twelve
 * weeks. With #stale in the address the sheet is three days old, to show the calendar failing closed. It goes through
 * the same reader as a client's sheet. Never bundled into client sites.
 */
import { staysFromCsv, addDays } from "../kits/hol/lib/calendar.js";

// home: [first night (days from today), nights] for each booked stay
/** @type {Record<string, [number, number][]>} */
const BOOKED = {
  glasshouse: [[0, 4], [7, 7], [14, 7], [27, 10], [44, 7], [58, 14]],
  "window-seat": [[2, 5], [10, 7], [21, 14], [40, 7], [52, 7]],
  terrace: [[0, 7], [7, 14], [25, 7], [32, 14], [53, 10]],
  deck: [[1, 3], [6, 9], [19, 7], [33, 7], [47, 14]],
};

/** @param {number} ms @param {string} tz */
function wall(ms, tz) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(ms).map((x) => [x.type, x.value]));
  return { ymd: `${p.year}-${p.month}-${p.day}`, mins: Number(p.hour) * 60 + Number(p.minute) };
}

/** The demo sheet as CSV for a given moment. @param {number} now @param {string} tz @param {boolean} stale */
export function demoStaysCsv(now, tz, stale = false) {
  const w = wall(now, tz);
  // updated at 08:40 today, or 17:40 yesterday before then; three days earlier when stale
  const back = (w.mins >= 8 * 60 + 40 ? w.mins - (8 * 60 + 40) : w.mins + 6 * 60 + 20) * 60_000 + (stale ? 3 * 86_400_000 : 0);
  const updated = new Date(now - back).toISOString();
  const rows = ["home,from,to,updated_at"];
  for (const [home, stays] of Object.entries(BOOKED)) for (const [d, n] of stays) rows.push(`${home},${addDays(w.ymd, d)},${addDays(w.ymd, d + n)},${updated}`);
  return rows.join("\n");
}

export const simulatedStays = {
  /** @param {import("../core/js/core.js").Ctx} ctx */
  async load(ctx) {
    const csv = demoStaysCsv(Date.now(), ctx.data.hours.timezone, location.hash === "#stale");
    return { ok: true, ...staysFromCsv(csv) };
  },
};
