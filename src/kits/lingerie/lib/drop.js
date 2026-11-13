// @ts-check
/**
 * The drop (online brands): a new collection goes live at a set time in the shop's own time zone. Before it, a
 * countdown and the waitlist; while it's live, the link to shop it; after its end (if it has one), it says so.
 */
import { wallTimeToUtc } from "../../../core/lib/hours.js";

/** "YYYY-MM-DDTHH:MM" on the shop's wall clock → ms. @param {string} local @param {string} timeZone */
export function dropInstant(local, timeZone) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) return NaN;
  const [year, month, day, hour, minute] = m.slice(1).map(Number);
  return wallTimeToUtc({ year, month, day, hour, minute }, timeZone);
}

/**
 * Where the drop stands.
 * @param {{ at: string, ends?: string }} drop @param {string} timeZone @param {number} nowMs
 * @returns {{ phase: "before"|"live"|"after", left: { days: number, hours: number, minutes: number, seconds: number } }}
 */
export function dropState(drop, timeZone, nowMs) {
  const start = dropInstant(drop.at, timeZone);
  const end = drop.ends ? dropInstant(drop.ends, timeZone) : Infinity;
  const phase = nowMs < start ? "before" : nowMs < end ? "live" : "after";
  const ms = Math.max(0, phase === "before" ? start - nowMs : 0);
  const s = Math.floor(ms / 1000);
  return { phase, left: { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 } };
}
