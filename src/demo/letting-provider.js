// @ts-check
/**
 * DEMO ONLY. Halvern's homes sheet, written on the day the page is opened: updated at 09:15 today in office hours
 * (17:40 the evening before, earlier in the morning), and "available from" dates a few weeks ahead. With #stale in
 * the address the sheet is three days old, to show how every letting feature fails closed. It goes through the same
 * reader as a client's sheet. Never bundled into client sites.
 */
import { homesFromCsv } from "../kits/letting/lib/homes.js";

/** London wall time as parts. @param {number} ms @param {string} tz */
function wall(ms, tz) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(ms).map((x) => [x.type, x.value]));
  return { ymd: `${p.year}-${p.month}-${p.day}`, mins: Number(p.hour) * 60 + Number(p.minute) };
}
/** @param {number} ms @param {string} tz */
const dayAt = (ms, tz) => new Intl.DateTimeFormat("en-GB", { timeZone: tz, day: "numeric", month: "long" }).format(ms);

const D = 86_400_000;
// ref, building, floor, name, status, rent, beds, baths, m2, from (days ahead, -1 now), council tax, epc, furnished, outside
/** @type {[string, string, string, string, string, number, number, number, number, number, string, string, string, string][]} */
const ROWS = [
  ["1A", "sjw", "1", "Flat 1A", "available", 5950, 2, 2, 104, 23, "G", "C", "Unfurnished", "Juliet balcony"],
  ["1B", "sjw", "1", "Flat 1B", "let", 0, 2, 2, 98, 0, "", "", "", ""],
  ["2A", "sjw", "2", "Flat 2A", "let", 0, 3, 2, 142, 0, "", "", "", ""],
  ["2B", "sjw", "2", "Flat 2B", "available", 7900, 3, 3, 151, -1, "H", "C", "Furnished or unfurnished", "Balcony"],
  ["3A", "sjw", "3", "Flat 3A", "available", 6250, 2, 2, 108, 58, "G", "C", "Unfurnished", "None"],
  ["3B", "sjw", "3", "Flat 3B", "let agreed", 0, 2, 2, 104, 0, "", "", "", ""],
  ["4A", "sjw", "4", "Flat 4A", "let", 0, 3, 2, 139, 0, "", "", "", ""],
  ["4B", "sjw", "4", "Flat 4B", "let", 0, 2, 2, 101, 0, "", "", "", ""],
  ["5A", "sjw", "5", "Flat 5A", "available", 5650, 2, 2, 96, -1, "G", "D", "Furnished", "None"],
  ["5B", "sjw", "5", "Flat 5B", "let", 0, 1, 1, 64, 0, "", "", "", ""],
  ["6A", "sjw", "6", "Flat 6A", "available", 8200, 3, 3, 168, 79, "H", "C", "Unfurnished", "Roof terrace"],
  ["6B", "sjw", "6", "Flat 6B", "let", 0, 2, 2, 88, 0, "", "", "", ""],
  ["K1-LG", "ken", "LG", "No. 1, lower ground", "let", 0, 2, 1, 90, 0, "", "", "", ""],
  ["K3-LG", "ken", "LG", "No. 3, lower ground", "available", 3950, 2, 1, 74, -1, "E", "C", "Unfurnished", "Front area"],
  ["K4-G", "ken", "G", "No. 4, ground floor", "available", 5450, 2, 2, 96, 16, "F", "D", "Unfurnished", "Rear garden"],
  ["K2-G", "ken", "G", "No. 2, ground floor", "let", 0, 2, 2, 96, 0, "", "", "", ""],
  ["K1-1", "ken", "1", "No. 1, first floor", "available", 6900, 2, 2, 118, 30, "G", "C", "Furnished", "Balcony"],
  ["K4-1", "ken", "1", "No. 4, first floor", "available", 6750, 2, 2, 112, -1, "G", "D", "Unfurnished", "Balcony"],
  ["K2-2", "ken", "2", "No. 2, second floor", "available", 4950, 2, 1, 84, 44, "F", "C", "Unfurnished", "None"],
  ["K3-2", "ken", "2", "No. 3, second floor", "let", 0, 2, 1, 84, 0, "", "", "", ""],
  ["K3-3", "ken", "3", "No. 3, top floor", "available", 3650, 1, 1, 58, -1, "E", "D", "Furnished", "None"],
  ["K1-3", "ken", "3", "No. 1, top floor", "let", 0, 1, 1, 58, 0, "", "", "", ""],
  ["M-LG", "mar", "LG", "Garden floor", "let", 0, 1, 1, 66, 0, "", "", "", ""],
  ["M-G", "mar", "G", "Ground floor", "available", 5850, 2, 2, 92, -1, "G", "D", "Unfurnished", "Shared garden"],
  ["M-1", "mar", "1", "First floor", "let", 0, 2, 2, 104, 0, "", "", "", ""],
  ["M-2", "mar", "2", "Second floor", "available", 4950, 2, 1, 88, 37, "F", "D", "Furnished", "None"],
  ["M-3", "mar", "3", "Third floor", "let", 0, 1, 1, 70, 0, "", "", "", ""],
  ["M-4", "mar", "4", "Penthouse", "available", 6450, 2, 2, 96, 65, "G", "C", "Unfurnished", "Roof terrace"],
];

/** The sheet as the agent would publish it, for a given moment. @param {number} nowMs @param {string} tz @param {boolean} stale */
export function demoCsv(nowMs, tz, stale) {
  const { ymd, mins } = wall(nowMs, tz);
  const prev = wall(nowMs - D, tz).ymd;
  let at = mins >= 9 * 60 + 15 ? `${ymd} 09:15` : `${prev} 17:40`;
  if (stale) at = `${wall(nowMs - 3 * D, tz).ymd} 17:40`;
  const head = "ref,building,floor,name,status,rent_pcm,beds,baths,size_m2,available_from,council_tax,epc,furnished,parking,broadband,mobile,heating,outside,pets,notes,updated_at";
  const q = (/** @type {string|number} */ v) => (/[",]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  const rows = ROWS.map((r) => [r[0], r[1], r[2], r[3], r[4], r[4] === "available" ? r[5] : "", r[6], r[7], r[8],
    r[4] !== "available" ? "" : r[9] < 0 ? "now" : dayAt(nowMs + r[9] * D, tz), r[10], r[11], r[12],
    r[4] === "available" ? "Residents' permit" : "", r[4] === "available" ? "Fibre, up to 900 Mbps" : "", r[4] === "available" ? "Good indoors, all networks" : "",
    r[4] === "available" ? "Gas central heating" : "", r[13], r[4] === "available" ? "By agreement" : "", "", at].map(q).join(","));
  return [head, ...rows].join("\n");
}

/** @type {import("../kits/letting/features/letting-board/load.js").HomesProvider} */
export const simulatedHomes = {
  async load(ctx) {
    const stale = typeof location !== "undefined" && location.hash === "#stale";
    const tz = ctx.data.hours.timezone;
    return homesFromCsv(demoCsv(Date.now(), tz, stale), Date.now(), tz, /** @type {any} */ (ctx.data).homes);
  },
};
