// @ts-check
/**
 * Sun on the windows: for one day, when the sun is above the horizon and in front of a home's windows, from the sun's
 * position (src/core/lib/sun.js) and the bearings its windows face (from the operator's sheet). It knows nothing of
 * neighbouring buildings, trees or cloud, and every page that shows it says so.
 */
import { solarAngles } from "../../../core/lib/sun.js";
import { wallTimeToUtc, formatTime24 } from "../../../core/lib/hours.js";

const STEP = 5; // minutes
const LOW = 3; // degrees: below this the sun is too low to count
const SPREAD = 80; // degrees either side of a window's bearing that the sun still falls on the glass

/** Angle between two bearings, 0–180. @param {number} a @param {number} b */
const apart = (a, b) => Math.abs(((a - b + 540) % 360) - 180);

/**
 * @param {number[]} faces bearings, degrees from north
 * @param {string} ymd the day, in the residence's time zone
 * @param {{ lat: number, lng: number }} place @param {string} timeZone
 * @returns {{ on: string, off: string } | null} first and last minute of direct sun, "HH:MM" local; null for none
 */
export function sunWindow(faces, ymd, place, timeZone) {
  if (!faces.length) return null;
  const [year, month, day] = ymd.split("-").map(Number);
  const start = wallTimeToUtc({ year, month, day, hour: 0, minute: 0 }, timeZone);
  let on = -1, off = -1;
  for (let m = 0; m < 1440; m += STEP) {
    const s = solarAngles(start + m * 60_000, place.lat, place.lng);
    if (s.elevation > LOW && faces.some((f) => apart(s.azimuth, f) < SPREAD)) { if (on < 0) on = m; off = m; }
  }
  return on < 0 ? null : { on: formatTime24(on), off: formatTime24(off) };
}

/** "Sun on the windows today, 12:30 to 15:25" (the detail adds the full caveat). @param {{ on: string, off: string } | null} w */
export const sunText = (w) => (w ? `Sun on the windows today, ${w.on} to ${w.off}` : "No direct sun on the windows today");

/** The list's shorter line, with its caveat. @param {{ on: string, off: string } | null} w */
export const sunListText = (w) => `${sunText(w)} (no shade counted)`;
