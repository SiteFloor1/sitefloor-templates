// @ts-check
/**
 * What could the owner's home earn (HOL-6)? Worked out ONLY from the company's own published figures for last year:
 * for each size of home, the average night, the nights booked, how many of its homes that is, and the lowest and
 * highest amount one of those homes paid its owner. Never market data. The fee is the company's own, VAT included.
 * The owner's own weeks are taken off at the same rate as any other week, and the page says so. London homes stop at
 * 90 nights a year unless the owner has planning permission (Deregulation Act 2015, s.44).
 */
import { pounds } from "./money.js";

export const LONDON_NIGHTS = 90;
export const LONDON_RULE = {
  text: "Short lets in Greater London are limited to 90 nights a year without planning permission.",
  url: "https://www.legislation.gov.uk/ukpga/2015/20/section/44",
  source: "Deregulation Act 2015, s.44",
  checked: "2026-11-26",
};

/**
 * @typedef {object} Size
 * @property {number} beds @property {number} night average paid by guests a night, all fees in
 * @property {number} nights nights booked in the year @property {number} homes how many homes the figures come from
 * @property {number} lowest @property {number} highest what the lowest- and highest-earning home paid its owner
 */
/** @typedef {{ year: number, percent: number, sizes: Size[], london?: boolean }} Figures */

const WORDS = ["", "one", "two", "three", "four", "five", "six", "seven", "eight"];
/** @param {number} n */
export const bedWord = (n) => `${WORDS[n] ?? n}-bedroom`;

/**
 * @param {Figures} fig @param {number} beds @param {number} [ownWeeks] @param {{ permission?: boolean }} [opts]
 * @returns {{ beds: number, nights: number, night: number, guests: number, fee: number, toYou: number, lowest: number,
 *   highest: number, homes: number, year: number, ownNights: number, capped: boolean, basis: string }|null}
 */
export function estimate(fig, beds, ownWeeks = 0, opts = {}) {
  const s = fig.sizes.find((x) => x.beds === beds);
  if (!s) return null;
  const ownNights = Math.max(0, Math.round(ownWeeks * 7));
  // the owner's weeks are booked as often as any other week of the year
  let nights = Math.max(0, Math.round(s.nights - ownNights * (s.nights / 365)));
  const capped = !!fig.london && !opts.permission && nights > LONDON_NIGHTS;
  if (capped) nights = LONDON_NIGHTS;
  const guests = nights * s.night;
  const fee = Math.round(guests * fig.percent) / 100;
  const toYou = guests - fee;
  const basis = `Our estimate, not a promise, from what our ${s.homes} ${bedWord(beds)} homes earned in ${fig.year}${ownWeeks ? `, less ${ownWeeks} ${ownWeeks === 1 ? "week" : "weeks"} of your own stays` : ""}${capped ? `, held to London's ${LONDON_NIGHTS} nights` : ""}. The lowest paid its owner ${pounds(s.lowest)}, the highest ${pounds(s.highest)}.`;
  return { beds, nights, night: s.night, guests, fee, toYou, lowest: s.lowest, highest: s.highest, homes: s.homes, year: fig.year, ownNights, capped, basis };
}

/** Problems with published figures (refused at build time, so a wrong estimate never ships). @param {any} fig @returns {string[]} */
export function figuresProblems(fig) {
  const out = [];
  if (!fig || typeof fig !== "object") return ["estimate: the company's own figures for last year are required; without them the estimate is left off"];
  if (!Number.isInteger(fig.year) || fig.year < 2020) out.push("estimate.year: the year the figures are for, e.g. 2025");
  if (typeof fig.percent !== "number" || fig.percent <= 0 || fig.percent >= 60) out.push("estimate.percent: the fee as a percentage of what guests pay, VAT included");
  if (!Array.isArray(fig.sizes) || !fig.sizes.length) out.push("estimate.sizes: at least one size of home");
  else fig.sizes.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    const at = `estimate.sizes[${i}]`;
    for (const k of ["beds", "night", "nights", "homes", "lowest", "highest"]) if (typeof s?.[k] !== "number" || s[k] <= 0) out.push(`${at}.${k}: a number above 0`);
    if (s?.nights > 365) out.push(`${at}.nights: a year has 365 nights`);
    if (s?.lowest > s?.highest) out.push(`${at}: lowest is above highest`);
    if (Number.isInteger(s?.homes) && s.homes < 3) out.push(`${at}.homes: at least 3 homes, or the "average" describes one owner's home`);
    if (fig.sizes.findIndex((/** @type {any} */ x) => x.beds === s?.beds) !== i) out.push(`${at}.beds: listed twice`);
  });
  return out;
}
