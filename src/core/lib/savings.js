// @ts-check
/**
 * Money maths for the loyalty card and memberships. Every number on the page is
 * worked out from the shop's own prices and rules, never typed in as a claim.
 */

const WEEKS_PER_MONTH = 52 / 12;

/** Cuts a month for someone who comes every `everyWeeks` weeks. @param {number} everyWeeks */
export const cutsPerMonth = (everyWeeks) => WEEKS_PER_MONTH / everyWeeks;

/**
 * What a month of memberships costs against paying each time.
 * A plan covers `cuts` a month ("unlimited" covers all); cuts beyond that are paid at the normal price.
 * @param {{ name: string, price: number, cuts: number|"unlimited" }[]} plans monthly price in pounds
 * @param {number} everyWeeks @param {number} price normal price of the cut the plans cover
 * @returns {{ payg: number, plans: { name: string, cost: number, saving: number }[], best: string|null }}
 */
export function compareMemberships(plans, everyWeeks, price) {
  const n = cutsPerMonth(everyWeeks);
  const payg = round2(n * price);
  const rows = plans.map((p) => {
    const extra = p.cuts === "unlimited" ? 0 : Math.max(0, n - p.cuts);
    const cost = round2(p.price + extra * price);
    return { name: p.name, cost, saving: round2(payg - cost) };
  });
  const top = rows.filter((r) => r.saving > 0).sort((a, b) => b.saving - a.saving)[0];
  return { payg, plans: rows, best: top ? top.name : null };
}

/**
 * Free cuts a year from a stamp card (every `stamps`-th cut free), for a regular.
 * Counts only whole free cuts, so it never rounds a saving up.
 * @param {number} everyWeeks @param {number} stamps @param {number} price
 */
export function loyaltyYear(everyWeeks, stamps, price) {
  const cuts = Math.floor(52 / everyWeeks);
  const free = Math.floor(cuts / stamps);
  return { cuts, free, value: free * price, weeksPerFree: everyWeeks * stamps };
}

/** "£22", "£22.50". @param {number} n */
export function pounds(n) {
  return `£${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

/** @param {number} n */
const round2 = (n) => Math.round(n * 100) / 100;
