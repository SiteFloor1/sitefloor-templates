// @ts-check
/**
 * The residence's homes sheet, read the same way on a demo (simulated rows) and a client site (the published Google
 * Sheet). One row per home. A home is shown as free only with its prices whole and its date readable; the whole sheet
 * fails closed when it is older than staleAfterHours or its updated_at can't be read.
 *
 * Columns: ref,name,floor,status,beds,baths,size_m2,free_from,stays,night,clean,min_nights,rent_pcm,faces,
 * side,glazing,cooling,blackout,updated_at
 *   status     free | booked | let
 *   free_from  "now" or YYYY-MM-DD
 *   stays      short | long | both
 *   night      the nightly rate in whole pounds with service and VAT in it
 *   clean      the cleaning charge for each stay, whole pounds with VAT (0 if none)
 *   rent_pcm   the monthly rent on a tenancy (blank when the home isn't let on a tenancy)
 *   faces      the compass bearings the home's main windows face, e.g. "135 225" (blank: no sun line for it)
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";

/** @typedef {{ ref: string, name: string, floor: string, beds: number, baths: number, m2: number, from: string,
 *   short: boolean, long: boolean, night: number, clean: number, minNights: number, rent: number, faces: number[],
 *   quiet: [string, string][] }} Home */
/** @typedef {{ ok: true, homes: Home[], updatedAt: number } | { ok: false, reason: "unreadable"|"stale" }} Homes */

export const COLUMNS = ["ref", "name", "floor", "status", "beds", "baths", "size_m2", "free_from", "stays", "night", "clean", "min_nights", "rent_pcm", "faces", "side", "glazing", "cooling", "blackout", "updated_at"];
const QUIET = /** @type {const} */ ([["side", "Side"], ["glazing", "Glazing"], ["cooling", "Cooling"], ["blackout", "Blackout"]]);

const whole = (/** @type {string} */ s) => (/^\d+$/.test(s.trim()) ? Number(s) : NaN);

/**
 * @param {string} csv @param {number} now ms @param {string} timeZone
 * @param {{ staleAfterHours?: number }} cfg
 * @returns {Homes}
 */
export function homesFromCsv(csv, now, timeZone, cfg) {
  const rows = parseCsv(csv);
  if (rows.length < 2) return { ok: false, reason: "unreadable" };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const col = (/** @type {string[]} */ r, /** @type {string} */ k) => (r[head.indexOf(k)] ?? "").trim();
  if (COLUMNS.some((c) => !head.includes(c))) return { ok: false, reason: "unreadable" };
  const stamps = rows.slice(1).map((r) => parseSheetTime(col(r, "updated_at"), timeZone)).filter((t) => !Number.isNaN(t));
  if (!stamps.length) return { ok: false, reason: "unreadable" };
  const updatedAt = Math.max(...stamps);
  if (now - updatedAt > (cfg.staleAfterHours ?? 36) * 3_600_000 || updatedAt - now > 3_600_000) return { ok: false, reason: "stale" };
  /** @type {Home[]} */
  const homes = [];
  for (const r of rows.slice(1)) {
    if (col(r, "status").toLowerCase() !== "free") continue;
    const stays = col(r, "stays").toLowerCase();
    const from = col(r, "free_from").toLowerCase();
    const h = {
      ref: col(r, "ref"), name: col(r, "name"), floor: col(r, "floor"),
      beds: whole(col(r, "beds")), baths: whole(col(r, "baths")), m2: whole(col(r, "size_m2")),
      from, short: stays === "short" || stays === "both", long: stays === "long" || stays === "both",
      night: whole(col(r, "night")), clean: col(r, "clean") === "" ? 0 : whole(col(r, "clean")), minNights: whole(col(r, "min_nights")),
      rent: col(r, "rent_pcm") === "" ? 0 : whole(col(r, "rent_pcm")),
      faces: col(r, "faces").split(/\s+/).filter(Boolean).map(Number).filter((n) => Number.isFinite(n) && n >= 0 && n < 360),
      quiet: /** @type {[string, string][]} */ (QUIET.map(([k, label]) => [label, col(r, k)]).filter(([, v]) => v)),
    };
    const dateOk = h.from === "now" || /^\d{4}-\d{2}-\d{2}$/.test(h.from);
    const shortOk = !h.short || (h.night > 0 && Number.isFinite(h.clean) && h.minNights >= 1);
    const longOk = !h.long || h.rent > 0;
    if (h.ref && h.name && (h.short || h.long) && dateOk && shortOk && longOk && [h.beds, h.baths, h.m2].every(Number.isFinite)) homes.push(h);
  }
  return { ok: true, homes, updatedAt };
}

/** "Free now" or "Free from 4 December". @param {string} from */
export function freeText(from) {
  if (from === "now") return "Free now";
  return `Free from ${new Date(`${from}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })}`;
}

/** "Updated today at 09:15" / "Updated 25 November at 17:40". @param {number} at @param {number} now @param {string} timeZone */
export function updatedText(at, now, timeZone) {
  const day = (/** @type {number} */ ms) => new Intl.DateTimeFormat("en-GB", { timeZone, day: "numeric", month: "long" }).format(ms);
  const time = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(at);
  return `Updated ${day(at) === day(now) ? "today" : day(at)} at ${time}`;
}

/** 1 m² = 10.764 sq ft. @param {number} m2 */
export const sqft = (m2) => Math.round(m2 * 10.7639);

/** The WhatsApp message for a home. @param {string} start @param {Home} h @param {string} [stay] */
export const askText = (start, h, stay) => `${start} ${h.name} (${h.ref})${stay ? `, ${stay}` : ""}.`;
