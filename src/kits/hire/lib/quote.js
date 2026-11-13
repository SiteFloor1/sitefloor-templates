// @ts-check
/**
 * The hire quote: what a car costs for the chosen dates, every part shown. Prices only from the client's own table
 * (day, weekend, week and month rates per car; extras; delivery zones; airport fees) and only on `periods`, the days on
 * the UK wall clock that the shared date picker works out. Nothing here invents a figure: a rate the client hasn't set
 * is never assumed, and the deposit is listed on its own because it is returned.
 */
import { DAY_KEYS } from "../../../core/lib/hours.js";

/**
 * @typedef {object} RateRules  how the client's rate table applies (site.hire.rates)
 * @property {{ pickUp: string[], returnOn: string[], maxDays: number } | undefined} [weekend]  when the weekend rate applies
 * @property {number} weekDays   days a week rate covers (usually 7: the client says)
 * @property {number} monthDays  days a month rate covers (the client says: 28, 30…)
 */
/** @typedef {{ id: string, label: string, price: number, per: "day"|"hire" }} Extra */
/** @typedef {{ label: string, amount: number, note?: string }} Part */

/** @param {string} iso @returns {string} "mon"… */
const dayKey = (iso) => DAY_KEYS[new Date(`${iso}T12:00:00Z`).getUTCDay()];

/**
 * Does the client's weekend rate apply to these dates?
 * @param {RateRules} rules @param {{ from: string, to: string, periods: number }} r
 */
export function isWeekend(rules, r) {
  const w = rules.weekend;
  return Boolean(w && w.pickUp.includes(dayKey(r.from)) && w.returnOn.includes(dayKey(r.to)) && r.periods <= w.maxDays);
}

/**
 * The hire itself, from the car's own rates: the weekend rate when it applies, else whole months, whole weeks and the
 * days left over, each at the client's rate. A rate the car doesn't have is skipped, never guessed.
 * @param {import("./fleet.js").Car} car @param {RateRules} rules @param {{ from: string, to: string, periods: number }} r
 * @returns {Part[] | null} null when the car has no rate that covers these dates (ask the business)
 */
export function hireParts(car, rules, r) {
  const rates = car.rates ?? {};
  if (rates.weekend !== undefined && isWeekend(rules, r)) return [{ label: "Weekend rate", amount: rates.weekend }];
  /** @type {Part[]} */ const parts = [];
  let left = r.periods;
  if (rates.month !== undefined && left >= rules.monthDays) {
    const n = Math.floor(left / rules.monthDays);
    parts.push({ label: n === 1 ? "One month" : `${n} months`, amount: n * rates.month, note: `${n} × ${money(rates.month)}` });
    left -= n * rules.monthDays;
  }
  if (rates.week !== undefined && left >= rules.weekDays) {
    const n = Math.floor(left / rules.weekDays);
    parts.push({ label: n === 1 ? "One week" : `${n} weeks`, amount: n * rates.week, note: `${n} × ${money(rates.week)}` });
    left -= n * rules.weekDays;
  }
  if (left > 0) {
    if (rates.day === undefined) return null;
    parts.push({ label: left === 1 ? "One day" : `${left} days`, amount: left * rates.day, note: `${left} × ${money(rates.day)}` });
  }
  return parts.length ? parts : null;
}

/**
 * Miles included for the hire, and the cost of the miles the customer expects beyond them.
 * @param {import("./fleet.js").Car} car @param {number} periods @param {number} expected miles the customer expects to drive (0 if unsure)
 * @returns {{ included: number|"unlimited", over: number, part: Part|null }}
 */
export function mileage(car, periods, expected) {
  const m = car.miles;
  if (!m) return { included: 0, over: 0, part: null };
  if (m.perDay === "unlimited") return { included: "unlimited", over: 0, part: null };
  const included = m.perDay * periods;
  const over = Math.max(0, Math.round(expected) - included);
  return { included, over, part: over > 0 && m.extra !== undefined ? { label: `${over} extra miles`, amount: round2(over * m.extra), note: `${over} × ${money(m.extra)}` } : null };
}

/**
 * Extras the customer chose, priced from the client's list (per day on `periods`, or once per hire).
 * @param {Extra[]} extras @param {string[]} chosen @param {number} periods @returns {Part[]}
 */
export function extraParts(extras, chosen, periods) {
  return extras.filter((x) => chosen.includes(x.id)).map((x) => (x.per === "day"
    ? { label: x.label, amount: round2(x.price * periods), note: `${periods} × ${money(x.price)}` }
    : { label: x.label, amount: x.price }));
}

/**
 * The whole quote. `handover` is how the car reaches the customer: collected (no fee), a delivery zone's fee or an
 * airport's meet-and-greet fee (the caller looks those up in the client's zones and airports).
 * @param {object} o
 * @param {import("./fleet.js").Car} o.car
 * @param {RateRules} o.rules
 * @param {{ from: string, to: string, periods: number }} o.range
 * @param {Extra[]} o.extras
 * @param {string[]} o.chosen
 * @param {number} o.expectedMiles
 * @param {{ label: string, fee: number } | null} o.handover
 */
export function quote({ car, rules, range, extras, chosen, expectedMiles, handover }) {
  const hire = hireParts(car, rules, range);
  if (!hire) return { ok: false, reason: "This car has no rate on our table for those dates. Ask us and we'll price it." };
  const miles = mileage(car, range.periods, expectedMiles);
  /** @type {Part[]} */
  const parts = [...hire, ...(handover && handover.fee > 0 ? [{ label: handover.label, amount: handover.fee }] : []), ...extraParts(extras, chosen, range.periods), ...(miles.part ? [miles.part] : [])];
  return { ok: true, parts, total: round2(parts.reduce((a, p) => a + p.amount, 0)), deposit: car.deposit ?? null, included: miles.included };
}

/**
 * Chauffeur hours: the time asked for, rounded up to the client's billing step, never below the car's minimum.
 * @param {number} minutes @param {{ minHours: number }} car @param {number} stepMinutes the client's step (15, 30 or 60)
 */
export function chauffeurHours(minutes, car, stepMinutes) {
  const billed = Math.ceil(Math.max(0, minutes) / stepMinutes) * stepMinutes;
  return Math.max(car.minHours, billed / 60);
}

/**
 * The minutes from the first time to the last in a list of "HH:MM" stops, in order; a time earlier than the one before
 * runs past midnight. Returns null for an unreadable time.
 * @param {string[]} times
 */
export function spanMinutes(times) {
  let total = 0;
  for (let i = 1; i < times.length; i++) {
    const a = toMin(times[i - 1]); const b = toMin(times[i]);
    if (a === null || b === null) return null;
    total += b >= a ? b - a : b + 1440 - a;
  }
  return total;
}

/** @param {string} t @returns {number|null} */
function toMin(t) {
  const m = /^(\d{2}):(\d{2})$/.exec(t ?? "");
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** £1,150 or £1.50. @param {number} n */
export function money(n) {
  return `£${Number.isInteger(n) ? n.toLocaleString("en-GB") : n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** @param {number} n */
const round2 = (n) => Math.round(n * 100) / 100;
