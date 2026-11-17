// @ts-check
/**
 * The agent's homes, from its Google Sheet (published as CSV). One row per home:
 *
 *   ref,building,floor,name,status,rent_pcm,beds,baths,size_m2,available_from,council_tax,epc,
 *   furnished,parking,broadband,mobile,heating,outside,pets,notes,updated_at
 *
 * status: "available", "let agreed" or "let". building and floor match the buildings in site.json (letting.buildings).
 * Fails closed: a sheet that can't be read, has no readable updated_at, or whose newest update is older than the
 * agent's limit (staleAfterHours) shows no home as available anywhere; the caller says the list is being updated.
 * A row that can't be read with certainty (no rent, an unknown building or floor) is left out, never guessed.
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";
import { moveIn, pounds } from "./fees.js";

export const STATUSES = ["available", "let agreed", "let"];
export const COLUMNS = ["ref", "building", "floor", "name", "status", "rent_pcm", "beds", "baths", "size_m2", "available_from", "council_tax", "epc",
  "furnished", "parking", "broadband", "mobile", "heating", "outside", "pets", "notes", "updated_at"];
const NEEDED = ["ref", "building", "floor", "name", "status", "rent_pcm", "updated_at"];
const BANDS = /^[A-H]$/;
const EPC = /^[A-G]$/;

/**
 * @typedef {{ ref: string, building: string, floor: string, name: string, status: string, rent: number, beds: number|null,
 *   baths: number|null, m2: number|null, available: string, councilTax: string, epc: string, more: [string, string][],
 *   notes: string }} Home
 * @typedef {{ ok: true, homes: Home[], updatedAt: number } | { ok: false, reason: "unreadable"|"stale"|"empty" }} Homes
 */

/** @param {string} s */
const num = (s) => { const n = Number(String(s).replace(/[£,\s]/g, "")); return Number.isFinite(n) && n >= 0 ? n : null; };

/**
 * @param {string} csv @param {number} nowMs @param {string} timeZone
 * @param {{ staleAfterHours: number, buildings: { id: string, floors: string[] }[] }} cfg
 * @returns {Homes}
 */
export function homesFromCsv(csv, nowMs, timeZone, cfg) {
  const rows = parseCsv(csv);
  if (rows.length < 2) return { ok: false, reason: "empty" };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const col = (/** @type {string} */ name) => head.indexOf(name);
  if (NEEDED.some((c) => col(c) < 0)) return { ok: false, reason: "unreadable" };
  const floorsOf = new Map(cfg.buildings.map((b) => [b.id, b.floors.map((/** @type {any} */ f) => (typeof f === "string" ? f : f.id))]));
  /** @type {Home[]} */ const homes = [];
  let updatedAt = 0;
  for (const r of rows.slice(1)) {
    const cell = (/** @type {string} */ name) => (col(name) >= 0 ? (r[col(name)] ?? "").trim() : "");
    const at = parseSheetTime(cell("updated_at"), timeZone);
    if (Number.isNaN(at)) continue;
    updatedAt = Math.max(updatedAt, at);
    const status = cell("status").toLowerCase();
    const building = cell("building"), floor = cell("floor").toUpperCase();
    const rent = num(cell("rent_pcm"));
    if (!STATUSES.includes(status) || !floorsOf.get(building)?.includes(floor) || !cell("ref") || !cell("name")) continue;
    if (status === "available" && !(rent && Number.isInteger(rent))) continue;
    const ct = cell("council_tax").toUpperCase(), epc = cell("epc").toUpperCase();
    // Part A material information (NTSELAT): rent, deposits and council tax band on the listing itself; without the
    // band or the EPC rating a home can't be shown as available.
    if (status === "available" && (!BANDS.test(ct) || !EPC.test(epc))) continue;
    /** @type {[string, string][]} */
    const more = /** @type {[string, string][]} */ ([["Furnished", cell("furnished")], ["Parking", cell("parking")], ["Broadband", cell("broadband")], ["Mobile signal", cell("mobile")],
      ["Heating", cell("heating")], ["Outside space", cell("outside")], ["Pets", cell("pets")]]).filter((x) => x[1] !== "");
    homes.push({
      ref: cell("ref"), building, floor, name: cell("name"), status, rent: rent ?? 0,
      beds: num(cell("beds")), baths: num(cell("baths")), m2: num(cell("size_m2")), available: cell("available_from") || "now",
      councilTax: ct, epc, more, notes: cell("notes"),
    });
  }
  if (!updatedAt) return { ok: false, reason: "unreadable" };
  if (nowMs - updatedAt > cfg.staleAfterHours * 3_600_000) return { ok: false, reason: "stale" };
  return { ok: true, homes, updatedAt };
}

/** Square feet from square metres, rounded. @param {number} m2 */
export const sqft = (m2) => Math.round(m2 * 10.7639);

/** The Part A line for a home: deposits from the rent within the caps, council tax band and EPC. @param {Home} h @param {any} [agent] */
export function partA(h, agent) {
  const m = moveIn(h.rent, agent);
  if (m.outside) return `Rent over £100,000 a year: deposit by agreement · Council tax ${h.councilTax} · EPC ${h.epc}`;
  return `Holding deposit ${pounds(m.holding)} · Deposit ${pounds(m.deposit)} (${m.depositWeeks} weeks) · Council tax ${h.councilTax} · EPC ${h.epc}`;
}

/** "Updated 09:15 today" in the agent's time zone. @param {number} at @param {number} nowMs @param {string} timeZone */
export function updatedText(at, nowMs, timeZone) {
  const day = (/** @type {number} */ ms) => new Intl.DateTimeFormat("en-GB", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(ms);
  const time = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit" }).format(at);
  const when = day(at) === day(nowMs) ? "today" : day(at) === day(nowMs - 86_400_000) ? "yesterday"
    : new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "long" }).format(at);
  return `Updated ${time} ${when}`;
}

/** Homes free on a floor of a building. @param {Home[]} homes @param {string} building @param {string} floor */
export const freeOn = (homes, building, floor) => homes.filter((h) => h.building === building && h.floor === floor && h.status === "available");

/** The viewing request, written for WhatsApp. @param {string} template @param {Home} h @param {string} buildingName */
export const viewingText = (template, h, buildingName) => `${template}\n\n${h.name}, ${buildingName} (ref ${h.ref}), ${pounds(h.rent)} a month.`;
