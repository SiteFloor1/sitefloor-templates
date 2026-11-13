// @ts-check
/**
 * UK bank holidays, worked out from the rules rather than a list that goes out
 * of date. Used for car-park charges ("bank holidays charged like Sundays").
 *
 * Rules (gov.uk/bank-holidays): fixed dates move to the next free weekday when
 * they fall at a weekend. One-off holidays (a coronation, a jubilee) are not
 * predictable; add them as dated exceptions.
 */
import { easter } from "./seasons.js";
import { addDays } from "./hours.js";

/** @typedef {"england-wales"|"scotland"|"northern-ireland"} Region */
export const REGIONS = /** @type {const} */ (["england-wales", "scotland", "northern-ireland"]);

const pad = (/** @type {number} */ n) => String(n).padStart(2, "0");
const date = (/** @type {number} */ y, /** @type {number} */ m, /** @type {number} */ d) => `${y}-${pad(m)}-${pad(d)}`;
const weekday = (/** @type {string} */ iso) => new Date(`${iso}T12:00:00Z`).getUTCDay();

/** First (n = 1) or last (n = -1) Monday of a month. @param {number} y @param {number} m @param {1|-1} n */
function monday(y, m, n) {
  if (n === 1) { let d = date(y, m, 1); while (weekday(d) !== 1) d = addDays(d, 1); return d; }
  let d = addDays(date(m === 12 ? y + 1 : y, m === 12 ? 1 : m + 1, 1), -1);
  while (weekday(d) !== 1) d = addDays(d, -1);
  return d;
}

/**
 * Every bank holiday in a year, as YYYY-MM-DD, sorted.
 * @param {number} y @param {Region} region
 * @returns {string[]}
 */
export function bankHolidays(y, region) {
  const e = easter(y);
  const moving = [addDays(e, -2), monday(y, 5, 1), monday(y, 5, -1)]; // Good Friday, early May, spring
  if (region !== "scotland") moving.push(addDays(e, 1), monday(y, 8, -1)); // Easter Monday, summer
  else moving.push(monday(y, 8, 1)); // Scotland's summer holiday is the first Monday of August
  const fixed = [date(y, 1, 1), date(y, 12, 25), date(y, 12, 26)];
  if (region === "scotland") fixed.push(date(y, 1, 2), date(y, 11, 30));
  if (region === "northern-ireland") fixed.push(date(y, 3, 17), date(y, 7, 12));
  const taken = new Set([...moving, ...fixed.filter((d) => weekday(d) % 6 !== 0)]);
  // Weekend fixed dates move to the next weekday that isn't already a holiday, in date order.
  for (const d of fixed.filter((x) => weekday(x) % 6 === 0).sort()) {
    let sub = addDays(d, 1);
    while (weekday(sub) % 6 === 0 || taken.has(sub)) sub = addDays(sub, 1);
    taken.add(sub);
  }
  return [...taken].sort();
}

/**
 * The bank-holiday region for a UK postcode. Scottish and Northern Irish postcode
 * areas; a few border districts (TD15, DG16 and the like) need `location.region`.
 * @param {string} postcode
 * @returns {Region}
 */
export function regionFromPostcode(postcode) {
  const area = (/^[A-Z]{1,2}/i.exec(postcode.trim())?.[0] ?? "").toUpperCase();
  if (area === "BT") return "northern-ireland";
  return ["AB", "DD", "DG", "EH", "FK", "G", "HS", "IV", "KA", "KW", "KY", "ML", "PA", "PH", "TD", "ZE"].includes(area) ? "scotland" : "england-wales";
}
