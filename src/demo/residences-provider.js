// @ts-check
/**
 * DEMO ONLY. Sevrell's homes sheet, written on the day the page is opened: updated at 09:15 today (17:40 the evening
 * before, earlier in the morning), with "free from" dates a few days ahead. Every home, price and bearing is sample
 * data. With #stale in the address the sheet is three days old, to show how every residences feature fails closed.
 * It goes through the same reader as a client's sheet. Never bundled into client sites.
 */
import { homesFromCsv, COLUMNS } from "../kits/residences/lib/homes.js";

/** London wall time as parts. @param {number} ms @param {string} tz */
function wall(ms, tz) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(ms).map((x) => [x.type, x.value]));
  return { ymd: `${p.year}-${p.month}-${p.day}`, mins: Number(p.hour) * 60 + Number(p.minute) };
}
const D = 86_400_000;

// ref, name, floor, status, beds, baths, m2, free (days ahead, -1 now), stays, night, clean, min, rent, faces, side, glazing, cooling, blackout
/** @type {(string|number)[][]} */
const ROWS = [
  ["2E", "Two East", "2", "free", 1, 1, 64, -1, "both", 495, 160, 3, 6450, "90", "Courtyard", "Acoustic double glazing", "Air conditioning", "Blackout blinds"],
  ["2W", "Two West", "2", "let", 1, 1, 62, 0, "", "", "", "", "", "", "", "", "", ""],
  ["3E", "Three East", "3", "booked", 2, 2, 110, 0, "", "", "", "", "", "", "", "", "", ""],
  ["4W", "Four West", "4", "free", 2, 2, 112, 8, "both", 640, 220, 3, 7950, "270", "Street, set back behind trees", "Acoustic double glazing", "Air conditioning", "Blackout curtains"],
  ["4E", "Four East", "4", "let", 2, 2, 114, 0, "", "", "", "", "", "", "", "", "", ""],
  ["5E", "Five East", "5", "free", 2, 2, 118, -1, "both", 690, 220, 3, 8300, "135 225", "Corner, street and courtyard", "Acoustic double glazing", "Air conditioning", "Blackout curtains"],
  ["6W", "Six West", "6", "booked", 2, 2, 116, 0, "", "", "", "", "", "", "", "", "", ""],
  ["PH", "The Penthouse", "8", "free", 3, 3, 214, 16, "short", 1450, 380, 4, "", "90 180 270", "Top floor, terrace all round", "Acoustic double glazing", "Air conditioning", "Blackout blinds"],
];

/** The sheet as the operator would publish it, for a given moment. @param {number} nowMs @param {string} tz @param {boolean} stale */
export function demoCsv(nowMs, tz, stale) {
  const { ymd, mins } = wall(nowMs, tz);
  let at = mins >= 9 * 60 + 15 ? `${ymd} 09:15` : `${wall(nowMs - D, tz).ymd} 17:40`;
  if (stale) at = `${wall(nowMs - 3 * D, tz).ymd} 17:40`;
  const rows = ROWS.map((r) => {
    const free = r[3] === "free";
    const from = !free ? "" : Number(r[7]) < 0 ? "now" : wall(nowMs + Number(r[7]) * D, tz).ymd;
    return [r[0], r[1], r[2], r[3], r[4], r[5], r[6], from, ...r.slice(8), at].map(String).map((v) => (/[",]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(",");
  });
  return [COLUMNS.join(","), ...rows].join("\n");
}

export const simulatedResidences = {
  /** @param {import("../core/js/core.js").Ctx} ctx */
  async load(ctx) {
    const stale = typeof location !== "undefined" && location.hash === "#stale";
    const tz = ctx.data.hours.timezone;
    return homesFromCsv(demoCsv(Date.now(), tz, stale), Date.now(), tz, /** @type {any} */ (ctx.data).homes);
  },
};
