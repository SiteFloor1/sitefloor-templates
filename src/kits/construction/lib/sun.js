// @ts-check
/**
 * Where the sun is, for the light study: its height above the horizon and its compass bearing, for a place and a
 * moment, by NOAA's solar position equations (accurate to a fraction of a degree, which is plenty for a room). The
 * study then says whether sun reaches the new room's glass for the way the garden faces. It ignores neighbouring
 * buildings and trees, and says so.
 */
import { wallTimeToUtc } from "../../../core/lib/hours.js";
import { sunPosition } from "../../../core/lib/sun.js";

// The sun's position is shared (src/core/lib/sun.js); re-exported so this kit's features keep one import.
export { sunPosition };

/** The eight ways a garden can face, as compass bearings. */
export const FACINGS = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };
const POINTS = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "the south-west" for a bearing. @param {number} az */
export const compass = (az) => POINTS[Math.round((((az % 360) + 360) % 360) / 45) % 8];

/** The 21st of the month at a London (or other zone's) clock time, as UTC ms. @param {number} year @param {number} month 1–12 @param {number} minutes since midnight @param {string} zone */
export function momentFor(year, month, minutes, zone) {
  return wallTimeToUtc({ year, month, day: 21, hour: Math.floor(minutes / 60), minute: minutes % 60 }, zone);
}

/**
 * What the light study says: where the sun is, and whether it reaches the new room's glass (the glass faces the same
 * way as the garden) or its roof light.
 * @param {{ elevation: number, azimuth: number }} sun @param {number} facing the garden's bearing @param {boolean} roofLight
 */
export function lightWords(sun, facing, roofLight) {
  if (sun.elevation <= 0) return { lit: false, glass: false, words: "The sun is down." };
  const off = Math.abs(((sun.azimuth - facing + 540) % 360) - 180);
  const glass = off < 85 && sun.elevation > 2;
  const where = `The sun is ${Math.round(sun.elevation)}° up, in the ${compass(sun.azimuth)}.`;
  if (glass) return { lit: true, glass, words: `${where} It shines on the new glass.` };
  if (roofLight && sun.elevation > 12) return { lit: true, glass, words: `${where} The glass is in shade; the roof light takes the sun.` };
  return { lit: true, glass, words: `${where} The glass is in shade, with daylight from the sky.` };
}

/** "21 June, 3:00 pm" @param {number} month 1–12 @param {number} minutes */
export function whenWords(month, minutes) {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return `21 ${MONTHS[month - 1]}, ${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}
