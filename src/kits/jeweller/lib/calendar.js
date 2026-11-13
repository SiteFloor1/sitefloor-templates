// @ts-check
/**
 * Dates for a jeweller: the days a private appointment can be asked for (the house's own notice, opening days and
 * closures), the occasion that leads the Occasions page, and this month's stone.
 * The appointment days are worked out here so the shared date picker only has to show them.
 */
import { addDays, DAY_KEYS } from "../../../core/lib/hours.js";

/**
 * Days that can be requested: open days from `notice` days ahead, for `horizon` days. Exceptions (a closure, or
 * special hours) beat the weekly hours.
 * @param {{ weekly: Record<string, string[][]>, exceptions?: { date: string, ranges: string[][] }[] }} hours
 * @param {string} today YYYY-MM-DD in the shop's timezone
 * @param {{ notice: number, horizon: number }} o
 * @returns {string[]} YYYY-MM-DD
 */
export function appointmentDays(hours, today, o) {
  /** @type {string[]} */ const out = [];
  for (let i = o.notice; i < o.notice + o.horizon; i++) {
    const d = addDays(today, i);
    const ex = (hours.exceptions ?? []).find((e) => e.date === d);
    const ranges = ex ? ex.ranges : hours.weekly[DAY_KEYS[new Date(`${d}T12:00:00Z`).getUTCDay()]] ?? [];
    if (ranges.length) out.push(d);
  }
  return out;
}

/**
 * The house's appointment times that fit inside a day's opening hours.
 * @param {string[][]} ranges the day's [open, close] pairs @param {string[]} slots "HH:MM" start times @param {number} minutes length
 * @returns {string[]}
 */
export function slotsWithin(ranges, slots, minutes) {
  const m = (/** @type {string} */ hm) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3));
  return slots.filter((s) => ranges.some(([a, b]) => m(s) >= m(a) && m(s) + minutes <= (m(b) <= m(a) ? m(b) + 1440 : m(b))));
}

/**
 * The occasion to lead with: the one on now (latest start wins), else the next to come. Past ones drop off.
 * @template {{ from: string, to: string }} T @param {T[]} list @param {string} today
 * @returns {{ lead: T|null, rest: T[] }} rest: the others still to come, soonest first
 */
export function occasionOrder(list, today) {
  const live = list.filter((o) => o.to >= today).sort((a, b) => a.from.localeCompare(b.from));
  const now = live.filter((o) => o.from <= today).sort((a, b) => b.from.localeCompare(a.from))[0];
  const lead = now ?? live[0] ?? null;
  return { lead, rest: live.filter((o) => o !== lead) };
}

/** Month names, January first. */
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** @param {string} today YYYY-MM-DD @returns {number} 1–12 */
export const monthOf = (today) => Number(today.slice(5, 7));
