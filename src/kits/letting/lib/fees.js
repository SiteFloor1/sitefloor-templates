// @ts-check
/**
 * What a tenant may be asked to pay, and what a landlord receives, in England. Pure logic, no DOM.
 *
 * The rules (GOV.UK, "Fees you can charge as part of a tenancy", updated 12 Nov 2026, checked 15 Nov 2026; Tenant
 * Fees Act 2019 as amended by the Renters' Rights Act 2025 from 1 May 2026):
 * - the rules cover assured periodic tenancies, student accommodation and licences in England, but not properties
 *   with an annual rent of more than £100,000;
 * - a tenancy deposit of up to 5 weeks' rent where the annual rent is below £50,000, up to 6 weeks' from £50,000 to
 *   £100,000;
 * - a holding deposit of up to 1 week's rent (15 calendar days unless agreed otherwise in writing);
 * - rent in advance of at most one month, only after the agreement is signed and before the start date;
 * - up to £50 for a change the tenant asks for (more only if the cost is shown to be higher);
 * - nothing else, apart from utilities, council tax, late-rent interest and lost keys at cost.
 * A week's rent is the annual rent divided by 52. Amounts are rounded down to the pound so they never exceed the cap.
 */

export const RULES = {
  source: "https://www.gov.uk/guidance/fees-you-can-charge-as-part-of-a-tenancy",
  sourceTitle: "Fees you can charge as part of a tenancy (GOV.UK)",
  updated: "2026-11-12",
  checked: "2026-11-15",
  outsideAbove: 100_000, // a year: "more than £100,000" is outside the rules
  sixWeeksFrom: 50_000, // a year
  maxHoldingWeeks: 1,
  maxDepositWeeksBelow: 5,
  maxDepositWeeksFrom: 6,
  maxChangeFee: 50,
  holdingDays: 15,
};

/** @param {number} rentPcm */
export const yearly = (rentPcm) => rentPcm * 12;
/** @param {number} rentPcm */
export const weekly = (rentPcm) => (rentPcm * 12) / 52;

/**
 * What a tenant pays before the keys, within the caps and the agent's own choice of weeks (never above the caps).
 * @param {number} rentPcm a whole-pound monthly rent
 * @param {{ holdingWeeks?: number, depositWeeksBelow?: number, depositWeeksFrom?: number }} [agent]
 * @returns {{ outside: true } | { outside: false, holding: number, deposit: number, depositWeeks: number, first: number, beforeKeys: number }}
 */
export function moveIn(rentPcm, agent = {}) {
  if (!(rentPcm > 0)) return { outside: false, holding: 0, deposit: 0, depositWeeks: 0, first: 0, beforeKeys: 0 };
  if (yearly(rentPcm) > RULES.outsideAbove) return { outside: true };
  const high = yearly(rentPcm) >= RULES.sixWeeksFrom;
  const cap = high ? RULES.maxDepositWeeksFrom : RULES.maxDepositWeeksBelow;
  const depositWeeks = Math.min(cap, (high ? agent.depositWeeksFrom : agent.depositWeeksBelow) ?? cap);
  const holdingWeeks = Math.min(RULES.maxHoldingWeeks, agent.holdingWeeks ?? RULES.maxHoldingWeeks);
  const w = weekly(rentPcm);
  const holding = Math.floor(w * holdingWeeks);
  const deposit = Math.floor(w * depositWeeks);
  // the holding deposit is refunded or, with the tenant's agreement, put towards the first month or the deposit,
  // so it isn't added again: before the keys a tenant pays the deposit and the first month
  return { outside: false, holding, deposit, depositWeeks, first: rentPcm, beforeKeys: deposit + rentPcm };
}

/**
 * What a landlord receives under one of the agent's services, from the agent's own published rate (with VAT).
 * "monthly": a percentage of each month's rent; "year-once": a percentage of a year's rent, once, then the rent goes
 * to the landlord. An illustration: repairs, service charge, insurance, mortgage and tax are the landlord's.
 * @param {number} rentPcm @param {{ basis: "monthly"|"year-once", percent: number }} service
 */
export function landlordView(rentPcm, service) {
  const pct = service.percent / 100;
  if (service.basis === "year-once") {
    const fee = round2(rentPcm * 12 * pct);
    return { basis: service.basis, base: rentPcm * 12, fee, net: rentPcm };
  }
  const fee = round2(rentPcm * pct);
  return { basis: service.basis, base: rentPcm, fee, net: round2(rentPcm - fee) };
}

/** @param {number} n */
const round2 = (n) => Math.round(n * 100) / 100;

/** "£1,234" @param {number} n */
export const pounds = (n) => "£" + Math.floor(n).toLocaleString("en-GB");
/** "£1,234.50" @param {number} n */
export const pence = (n) => "£" + n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Is the agent's own setting within the caps? Returns what's wrong, or null. @param {any} t */
export function tenantTermsProblem(t) {
  if (t.holdingWeeks !== undefined && !(t.holdingWeeks > 0 && t.holdingWeeks <= RULES.maxHoldingWeeks)) return `holdingWeeks: at most ${RULES.maxHoldingWeeks} week's rent`;
  if (t.depositWeeksBelow !== undefined && !(Number.isInteger(t.depositWeeksBelow) && t.depositWeeksBelow >= 0 && t.depositWeeksBelow <= RULES.maxDepositWeeksBelow)) return `depositWeeksBelow: 0 to ${RULES.maxDepositWeeksBelow} weeks (annual rent below £50,000)`;
  if (t.depositWeeksFrom !== undefined && !(Number.isInteger(t.depositWeeksFrom) && t.depositWeeksFrom >= 0 && t.depositWeeksFrom <= RULES.maxDepositWeeksFrom)) return `depositWeeksFrom: 0 to ${RULES.maxDepositWeeksFrom} weeks (annual rent from £50,000 to £100,000)`;
  if (t.changeFee !== undefined && t.changeFee !== null && !(t.changeFee >= 0 && t.changeFee <= RULES.maxChangeFee)) return `changeFee: at most £${RULES.maxChangeFee} (more only where the agent can show a higher cost, written in its own words)`;
  return null;
}

/**
 * The tenant's side in words: what is paid before the keys for a monthly rent, within the caps.
 * @param {number} rentPcm @param {any} [agent]
 * @returns {{ rows: [string, string][], total: string, note: string }}
 */
export function tenantSide(rentPcm, agent) {
  const m = moveIn(rentPcm, agent);
  if (m.outside) return { rows: [["Holding deposit", "–"], ["Tenancy deposit", "–"], ["First month, after signing", "–"]], total: "Ask us",
    note: "Over £100,000 a year the Tenant Fees Act doesn't apply; we agree the terms with you in writing." };
  const weeks = ["no", "one", "two", "three", "four", "five", "six"][m.depositWeeks];
  return {
    rows: [["Holding deposit, one week", pounds(m.holding)], [`Tenancy deposit, ${weeks} weeks`, pounds(m.deposit)], ["First month, after signing", pounds(m.first)]],
    total: pounds(m.beforeKeys),
    note: "With your agreement the holding deposit goes towards the first month. No other fees to move in: the Tenant Fees Act 2019 bans them."
      + (m.depositWeeks === 6 ? " Six weeks applies from £50,000 a year." : ""),
  };
}

/**
 * The owner's side in words, for one service. @param {number} rentPcm @param {{ basis: "monthly"|"year-once", percent: number }} service
 * @returns {{ rows: [string, string][], totalLabel: string, total: string }}
 */
export function ownerSide(rentPcm, service) {
  const v = landlordView(rentPcm, service);
  const pct = `${service.percent}%`;
  if (v.basis === "year-once") return { rows: [["A year's rent", pence(v.base)], [`Our fee once, ${pct} with VAT`, `−${pence(v.fee)}`]], totalLabel: "Then the rent goes to you", total: pounds(v.net) };
  return { rows: [["Rent", pence(v.base)], [`Our fee, ${pct} with VAT`, `−${pence(v.fee)}`]], totalLabel: "Reaches you each month", total: pounds(v.net) };
}

/** A rent typed in a box: digits only, up to six. @param {string} s */
export const rentFrom = (s) => Number(String(s).replace(/\D/g, "").slice(0, 6)) || 0;
