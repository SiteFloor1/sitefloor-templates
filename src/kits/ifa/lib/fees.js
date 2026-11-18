// @ts-check
/**
 * Fees in pounds: the firm's own published fee schedule turned into money for an amount the visitor types. Arithmetic
 * only. Nothing here projects growth, a return or a value; the amount is what the fee is charged on, not what it becomes.
 *
 * A charge is one of:
 *   { "rate": 1.5 }                                   a percentage of the amount
 *   { "tiers": [{ "upTo": 500000, "rate": 0.75 }, { "rate": 0.5 }] }   bands, each rate on the part of the amount in it
 *   { "fixed": 2500 }                                 a set fee in pounds
 * with optional "min" and "max" in pounds.
 *
 * Money is worked in whole pence so nothing drifts; the page shows pounds and pence.
 */

/** @typedef {{ rate?: number, tiers?: { upTo?: number, rate: number }[], fixed?: number, min?: number, max?: number }} Charge */
/** @typedef {{ initial: Charge, ongoing: Charge, from?: number, to?: number }} Schedule */
/** @typedef {{ ok: true, initial: number, ongoing: number, monthly: number, firstYear: number } | { ok: false, why: "amount" | "below" | "above" | "schedule" }} Statement */

const pence = (/** @type {number} */ pounds) => Math.round(pounds * 100);
const isNum = (/** @type {unknown} */ v) => typeof v === "number" && Number.isFinite(v);
const isRate = (/** @type {unknown} */ v) => isNum(v) && /** @type {number} */ (v) > 0 && /** @type {number} */ (v) <= 10;

/** What's wrong with one charge, or null. @param {unknown} c @returns {string|null} */
export function chargeProblem(c) {
  if (c === null || typeof c !== "object" || Array.isArray(c)) return "a charge: { rate } or { tiers } or { fixed }, with optional min and max";
  const x = /** @type {Record<string, unknown>} */ (c);
  for (const k of Object.keys(x)) if (!["rate", "tiers", "fixed", "min", "max"].includes(k)) return `unknown setting "${k}"`;
  const kinds = ["rate", "tiers", "fixed"].filter((k) => x[k] !== undefined);
  if (kinds.length !== 1) return "exactly one of rate, tiers or fixed";
  if (x.rate !== undefined && !isRate(x.rate)) return "rate: a percentage above 0 and at most 10, e.g. 1.5";
  if (x.fixed !== undefined && !(isNum(x.fixed) && /** @type {number} */ (x.fixed) > 0)) return "fixed: a fee in pounds above 0";
  if (x.tiers !== undefined) {
    const t = x.tiers;
    if (!Array.isArray(t) || t.length < 2) return "tiers: at least two bands, the last with no upTo";
    let last = 0;
    for (const [i, b] of t.entries()) {
      if (!b || typeof b !== "object" || !isRate(b.rate)) return `tiers[${i}].rate: a percentage above 0 and at most 10`;
      const isLast = i === t.length - 1;
      if (isLast ? b.upTo !== undefined : !(isNum(b.upTo) && b.upTo > last)) return isLast ? "the last band has no upTo" : `tiers[${i}].upTo: pounds, higher than the band before`;
      if (!isLast) last = b.upTo;
    }
  }
  for (const k of ["min", "max"]) if (x[k] !== undefined && !(isNum(x[k]) && /** @type {number} */ (x[k]) >= 0)) return `${k}: pounds, 0 or more`;
  if (isNum(x.min) && isNum(x.max) && /** @type {number} */ (x.min) > /** @type {number} */ (x.max)) return "min is more than max";
  return null;
}

/** What's wrong with a whole schedule, or null. @param {unknown} s @returns {string|null} */
export function scheduleProblem(s) {
  if (!s || typeof s !== "object") return "the fee schedule: { initial, ongoing }";
  const x = /** @type {Record<string, unknown>} */ (s);
  for (const k of ["initial", "ongoing"]) {
    const p = chargeProblem(x[k]);
    if (p) return `${k}: ${p}`;
  }
  if (x.from !== undefined && !(isNum(x.from) && /** @type {number} */ (x.from) >= 0)) return "from: the smallest amount the firm advises on, in pounds";
  if (x.to !== undefined && !(isNum(x.to) && /** @type {number} */ (x.to) > (/** @type {number} */ (x.from) ?? 0))) return "to: the largest amount the tool works out, above from";
  return null;
}

/** One charge on an amount, in pence. @param {Charge} c @param {number} amount pounds */
export function chargeOn(c, amount) {
  let p;
  if (c.fixed !== undefined) p = pence(c.fixed);
  else if (c.tiers) {
    let rest = amount, below = 0, total = 0;
    for (const b of c.tiers) {
      const band = b.upTo === undefined ? rest : Math.min(rest, b.upTo - below);
      total += (band * b.rate) / 100;
      rest -= band; below = b.upTo ?? below;
      if (rest <= 0) break;
    }
    p = pence(total);
  } else p = pence((amount * /** @type {number} */ (c.rate)) / 100);
  if (c.min !== undefined) p = Math.max(p, pence(c.min));
  if (c.max !== undefined) p = Math.min(p, pence(c.max));
  return p;
}

/**
 * The statement for an amount: initial fee, ongoing fee a year and a month, and the first year's total, in pence.
 * Fails closed: a bad amount or a broken schedule gives a reason, never a figure.
 * @param {unknown} amount pounds @param {Schedule} schedule @returns {Statement}
 */
export function statement(amount, schedule) {
  if (scheduleProblem(schedule)) return { ok: false, why: "schedule" };
  if (!isNum(amount) || /** @type {number} */ (amount) <= 0 || !Number.isInteger(amount)) return { ok: false, why: "amount" };
  const a = /** @type {number} */ (amount);
  if (schedule.from !== undefined && a < schedule.from) return { ok: false, why: "below" };
  if (schedule.to !== undefined && a > schedule.to) return { ok: false, why: "above" };
  const initial = chargeOn(schedule.initial, a), ongoing = chargeOn(schedule.ongoing, a);
  return { ok: true, initial, ongoing, monthly: Math.round(ongoing / 12), firstYear: initial + ongoing };
}

/** Whole pounds from what a visitor types: "£250,000" or "250000" → 250000; anything else → NaN. @param {string} text */
export function readAmount(text) {
  const t = String(text ?? "").replace(/[£,\s]/g, "");
  return /^\d{1,9}$/.test(t) ? Number(t) : NaN;
}

/** Pence as "£3,750.00". @param {number} p */
export const money = (p) => `£${(p / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Pounds as "£250,000". @param {number} n */
export const pounds = (n) => `£${n.toLocaleString("en-GB")}`;

/** A charge in words, from the schedule itself: "1.5% (at least £1,500)". @param {Charge} c */
export function chargeWords(c) {
  const pct = (/** @type {number} */ r) => `${r.toLocaleString("en-GB", { maximumFractionDigits: 3 })}%`;
  let w;
  if (c.fixed !== undefined) w = pounds(c.fixed);
  else if (c.tiers) w = c.tiers.map((b, i) => (b.upTo === undefined ? `${pct(b.rate)} above ${pounds(/** @type {number} */ (c.tiers?.[i - 1]?.upTo))}` : `${pct(b.rate)} up to ${pounds(b.upTo)}`)).join(", ");
  else w = pct(/** @type {number} */ (c.rate));
  const limits = [c.min !== undefined ? `at least ${pounds(c.min)}` : "", c.max !== undefined ? `at most ${pounds(c.max)}` : ""].filter(Boolean);
  return limits.length ? `${w} (${limits.join(", ")})` : w;
}
