// @ts-check
/**
 * Posting a box: the shop sends on the days it chooses, from orders in by a cut-off time, and the parcel usually
 * arrives the next day. From now, the next send day the order makes and the day it should usually arrive. A send day
 * must be one of the shop's posting days, a day it's open (its hours and closures) and not a bank holiday; arrival
 * skips Sundays, bank holidays and 25–26 December, so an order on 23 December never says "Friday 25 December". No DOM.
 */
import { addDays, DAY_KEYS, toMinutes, rangesFor } from "../../../core/lib/hours.js";
import { bankHolidays } from "../../../core/lib/bank-holidays.js";

/** @typedef {{ price: number, days: string[], cutoff: string, service?: string, note?: string }} Post days: "mon"…"sat"; cutoff "HH:MM" */

/** @param {string} region @returns {(day: string) => boolean} */
function holidayTest(region) {
  /** @type {Map<number, Set<string>>} */ const years = new Map();
  return (day) => {
    const y = Number(day.slice(0, 4));
    // Christmas Day and Boxing Day themselves: no post goes out or arrives, even when the holiday moves to a weekday.
    if (!years.has(y)) years.set(y, new Set([...bankHolidays(y, /** @type {any} */ (region)), `${y}-12-25`, `${y}-12-26`]));
    return /** @type {Set<string>} */ (years.get(y)).has(day);
  };
}

/**
 * @param {Post} p @param {{ date: string, weekday: number, minutes: number }} now the shop's wall clock
 * @param {{ hours?: any, region?: string }} [o] the shop's hours (closures) and bank-holiday region
 * @returns {{ orderBy: { date: string, time: string }, sends: string, arrives: string } | null} null: nothing in the next five weeks
 */
export function nextPost(p, now, o = {}) {
  const cut = toMinutes(p.cutoff), holiday = holidayTest(o.region ?? "england-wales");
  for (let i = 0; i < 36; i++) {
    const day = addDays(now.date, i), wd = (now.weekday + i) % 7;
    if (!p.days.includes(DAY_KEYS[wd]) || holiday(day)) continue;
    if (o.hours && !rangesFor(o.hours, day).ranges.length) continue;
    if (i === 0 && now.minutes >= cut) continue;
    let arrives = addDays(day, 1), k = (wd + 1) % 7;
    while (k === 0 || holiday(arrives)) { arrives = addDays(arrives, 1); k = (k + 1) % 7; }
    return { orderBy: { date: day, time: p.cutoff }, sends: day, arrives };
  }
  return null;
}
