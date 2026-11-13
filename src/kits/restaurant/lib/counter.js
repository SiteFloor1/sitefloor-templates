// @ts-check
/**
 * The counter: what each bake in the café's glass case is doing today, from the same sheet as the specials.
 *
 *   fresh   a tray came out in the last `freshForMinutes` (the case lights it up: "Fresh out 8:10")
 *   baked   a tray came out earlier today ("Baked 8:10")
 *   out     sold out today
 *   ""      nothing on the sheet for it today; it's on the counter as usual
 *   unknown the sheet couldn't be read, so the site says nothing about it
 *
 * A bake can be named on the sheet by its id ("cardamom-knot") or its name ("Cardamom knot").
 */
import { zonedNow, formatTime12 } from "../../../core/lib/hours.js";

/** @typedef {"fresh"|"baked"|"out"|""|"unknown"} BakeState */
/** @typedef {{ id: string, state: BakeState, at: number|null }} BakeNow */

/**
 * @param {{ id: string, name: string }[]} bakes
 * @param {import("./tonight.js").Tonight} tonight
 * @param {number} nowMs
 * @param {number} freshForMinutes
 * @returns {BakeNow[]}
 */
export function counterNow(bakes, tonight, nowMs, freshForMinutes) {
  if (!tonight.ok) return bakes.map((b) => ({ id: b.id, state: /** @type {BakeState} */ ("unknown"), at: null }));
  return bakes.map((b) => {
    const keys = [b.id.toLowerCase(), b.name.toLowerCase()];
    if (tonight.soldOut.some((n) => keys.includes(n))) return { id: b.id, state: /** @type {BakeState} */ ("out"), at: null };
    const at = Math.max(0, ...tonight.fresh.filter((f) => keys.includes(f.name)).map((f) => f.at));
    if (!at) return { id: b.id, state: /** @type {BakeState} */ (""), at: null };
    return { id: b.id, state: /** @type {BakeState} */ (nowMs - at <= freshForMinutes * 60_000 ? "fresh" : "baked"), at };
  });
}

/**
 * The tag on a bake: "Fresh out 8:10am", "Baked 8:10am", "Sold out", or "" for none.
 * @param {BakeNow} b @param {string} timeZone
 */
export function bakeTag(b, timeZone) {
  if (b.state === "out") return "Sold out";
  if ((b.state === "fresh" || b.state === "baked") && b.at !== null) {
    const t = formatTime12(zonedNow(new Date(b.at), timeZone).minutes);
    return b.state === "fresh" ? `Fresh out ${t}` : `Baked ${t}`;
  }
  return "";
}
