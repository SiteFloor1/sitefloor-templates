// @ts-check
/**
 * The private evening: the shop closes for one client. The free evenings come from the shop's own Google Sheet
 * (header row: date, start, status, updated_at); old or broken data is never shown as current (fail closed).
 */
import { parseSheetTime } from "../../../core/lib/sheet.js";

/** @typedef {{ date: string, start: string, status: "free"|"held" }} Evening */

/**
 * Rows from the sheet as evenings; rows that can't be read are left out, never guessed.
 * @param {string[][]} rows parsed CSV including the header @param {string} timeZone
 * @returns {{ evenings: Evening[], updated: number }} updated = newest updated_at (ms), NaN if none readable
 */
export function parseEvenings(rows, timeZone) {
  if (!rows.length) return { evenings: [], updated: NaN };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const [d, s, st, u] = ["date", "start", "status", "updated_at"].map((k) => head.indexOf(k));
  if (d < 0 || s < 0 || st < 0) return { evenings: [], updated: NaN };
  /** @type {Evening[]} */
  const evenings = [];
  let updated = NaN;
  for (const r of rows.slice(1)) {
    const date = (r[d] ?? "").trim(), start = (r[s] ?? "").trim(), status = (r[st] ?? "").trim().toLowerCase();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(start) || !["free", "held"].includes(status)) continue;
    evenings.push({ date, start, status: /** @type {"free"|"held"} */ (status) });
    if (u >= 0) { const t = parseSheetTime(r[u] ?? "", timeZone); if (!Number.isNaN(t)) updated = Number.isNaN(updated) ? t : Math.max(updated, t); }
  }
  return { evenings, updated };
}

/**
 * The evenings still to come that are free, soonest first. An evening today shows only until its start time.
 * @param {Evening[]} list @param {{ date: string, minutes: number }} now shop's wall clock @param {number} [max]
 */
export function openEvenings(list, now, max = 6) {
  const toMin = (/** @type {string} */ hm) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3));
  return list
    .filter((e) => e.status === "free" && (e.date > now.date || (e.date === now.date && toMin(e.start) > now.minutes)))
    .sort((a, b) => (a.date + a.start < b.date + b.start ? -1 : 1))
    .slice(0, max);
}

/** Is the sheet recent enough to trust? @param {number} updated ms @param {number} nowMs @param {number} staleAfterHours */
export function isFresh(updated, nowMs, staleAfterHours) {
  return Number.isFinite(updated) && nowMs - updated <= staleAfterHours * 3600_000 && updated <= nowMs + 300_000;
}

/**
 * The request on WhatsApp.
 * @param {{ business: string, when: string, guests: number, occasion: string, name: string }} o
 */
export function eveningText(o) {
  const clean = (/** @type {string} */ s) => s.replace(/\s+/g, " ").trim();
  return [
    `Hello ${o.business}, I'd like the private evening on ${clean(o.when)}.`,
    o.guests > 0 ? `I'll bring ${o.guests === 1 ? "one guest" : `${o.guests} guests`}.` : "I'll come alone.",
    o.occasion ? `It's for: ${clean(o.occasion)}.` : "",
    o.name ? clean(o.name) : "",
  ].filter(Boolean).join("\n");
}

/**
 * The bridal party evening on WhatsApp: the evening chosen, how many come, the wedding date, the names.
 * @param {{ business: string, when: string, party: number, wedding: string, names: string, bride: string }} o
 */
export function partyText(o) {
  const clean = (/** @type {string} */ s) => s.replace(/\s+/g, " ").trim();
  const names = o.names.split(/[\n,]+/).map(clean).filter(Boolean).slice(0, 12);
  return [
    `Hello ${o.business}, I'd like the bridal party evening on ${clean(o.when)}.`,
    `There will be ${o.party === 1 ? "one of us" : `${o.party} of us`}, me included.`,
    o.wedding ? `The wedding is on ${clean(o.wedding)}.` : "",
    names.length ? `With: ${names.join(", ")}.` : "",
    o.bride ? clean(o.bride) : "",
  ].filter(Boolean).join("\n");
}
