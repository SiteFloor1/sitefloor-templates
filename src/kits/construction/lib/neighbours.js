// @ts-check
/**
 * For our neighbours: what is happening this week at each live site, from the builder's published Google Sheet (CSV).
 *
 *   site,updated_at,this_week,noisy,deliveries
 *   n5-rear,2026-11-02 08:30,Bricklayers on the new walls.,Tuesday and Wednesday mornings,Steel on Thursday before 9 am
 *
 * The sheet is public to anyone with its link, so it holds only the site's id (the one in site.json, never a street or
 * a house name), a time and three short lines. Anything in any other column, headed or not, means the sheet holds more
 * than it may, and the whole sheet is refused. Fails closed: unreadable, unknown or out of date says to call.
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";
import { LINE_MAX } from "./progress.js";

const COLUMNS = ["site", "updated_at", "this_week", "noisy", "deliveries"];

/**
 * @typedef {{ ok: true, updatedAt: number, week: string, noisy: string, deliveries: string }} SiteWeek
 * @typedef {{ ok: false, reason: "unreadable" | "unknown" | "stale" }} NoWeek
 */

/**
 * @param {string} csv @param {string} site the site's id @param {number} nowMs @param {number} staleAfterDays @param {string} timeZone
 * @returns {SiteWeek | NoWeek}
 */
export function siteWeekFromCsv(csv, site, nowMs, staleAfterDays, timeZone) {
  const rows = parseCsv(csv);
  const head = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
  const at = (/** @type {string} */ k) => head.indexOf(k);
  if (at("site") < 0 || at("updated_at") < 0 || at("this_week") < 0) return { ok: false, reason: "unreadable" };
  const allowed = new Set(COLUMNS.map(at).filter((i) => i >= 0));
  if (rows.slice(1).some((r) => r.some((cell, i) => !allowed.has(i) && String(cell ?? "").trim() !== ""))) return { ok: false, reason: "unreadable" };
  const mine = rows.slice(1).filter((r) => String(r[at("site")] ?? "").trim().toLowerCase() === site);
  if (mine.length !== 1) return { ok: false, reason: "unknown" };
  const r = mine[0];
  const cell = (/** @type {string} */ k) => (at(k) >= 0 ? String(r[at(k)] ?? "").trim().replace(/\s+/g, " ") : "");
  const line = (/** @type {string} */ k) => { const t = cell(k); return t.length > LINE_MAX ? `${t.slice(0, LINE_MAX - 1).trimEnd()}…` : t; };
  const updatedAt = parseSheetTime(cell("updated_at"), timeZone);
  if (!Number.isFinite(updatedAt) || updatedAt > nowMs + 5 * 60_000 || !cell("this_week")) return { ok: false, reason: "unreadable" };
  if (nowMs - updatedAt > staleAfterDays * 86_400_000) return { ok: false, reason: "stale" };
  return { ok: true, updatedAt, week: line("this_week"), noisy: line("noisy"), deliveries: line("deliveries") };
}

/** The WhatsApp opening for a neighbour: the builder's line with the site's district. @param {string} message @param {string} district */
export const neighbourMessage = (message, district) => String(message ?? "").replaceAll("{district}", district);
