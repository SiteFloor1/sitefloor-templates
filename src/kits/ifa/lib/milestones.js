// @ts-check
/**
 * Milestones: from a year of birth, the year someone can usually first take money from a personal or workplace pension,
 * and their State Pension age year, under the law as it stands. No money, no growth, no projection: only dates.
 *
 * Sources, checked 16 Nov 2026:
 * - Normal minimum pension age rises from 55 to 57 on 6 April 2028 (Finance Act 2022), so people born after 5 April 1973
 *   reach it at 57 and people born before 6 April 1971 reached it at 55. Those born in between fall in the change-over.
 *   https://www.gov.uk/government/publications/increasing-normal-minimum-pension-age
 * - State Pension age: 66 for people born 6 October 1954 to 5 April 1960; rising by months to 67 for people born
 *   6 April 1960 to 5 March 1961; 67 for people born 6 March 1961 to 5 April 1977; then rising to 68 under the
 *   Pensions Act 2007 between 2044 and 2046 (68 for people born after 5 April 1978). A third State Pension age review
 *   is under way, so a later date could change.
 *   https://www.gov.uk/state-pension-age · https://www.gov.uk/government/collections/third-state-pension-age-review
 *
 * Only whole birth years whose answer doesn't depend on the day are given; every change-over year sends people to
 * GOV.UK's own checker. After MAX_AGE_DAYS without a fresh check the dates are hidden and only the link shows.
 */
export const CHECKED = "2026-11-16";
export const MAX_AGE_DAYS = 180;
export const SPA_CHECKER = "https://www.gov.uk/state-pension-age";
export const NMPA_SOURCE = "https://www.gov.uk/government/publications/increasing-normal-minimum-pension-age";

/** @typedef {{ year: number, age: number, what: "pension" | "state", source: string }} Milestone */
/** @typedef {{ ok: true, items: Milestone[] } | { ok: false, why: "year" | "changeover" | "stale" }} Milestones */

/** Whether the rules were checked recently enough to show. @param {number} nowMs */
export const fresh = (nowMs) => (nowMs - Date.parse(`${CHECKED}T00:00:00Z`)) / 86_400_000 <= MAX_AGE_DAYS;

/** @param {unknown} yob @param {number} nowMs @returns {Milestones} */
export function milestones(yob, nowMs) {
  if (!fresh(nowMs)) return { ok: false, why: "stale" };
  const thisYear = new Date(nowMs).getUTCFullYear();
  if (!Number.isInteger(yob) || /** @type {number} */ (yob) < 1950 || /** @type {number} */ (yob) > thisYear - 16) return { ok: false, why: "year" };
  const y = /** @type {number} */ (yob);
  /** @type {Milestone|null} */
  const pension = y >= 1974 ? { year: y + 57, age: 57, what: "pension", source: "Normal minimum pension age, 57 from 6 April 2028" }
    : y <= 1970 ? { year: y + 55, age: 55, what: "pension", source: "Normal minimum pension age" } : null;
  /** @type {Milestone|null} */
  const state = y >= 1962 && y <= 1976 ? { year: y + 67, age: 67, what: "state", source: "State Pension age, Pensions Act 2014" }
    : y >= 1955 && y <= 1959 ? { year: y + 66, age: 66, what: "state", source: "State Pension age, Pensions Act 2011" }
    : y >= 1979 ? { year: y + 68, age: 68, what: "state", source: "State Pension age, Pensions Act 2007 (68 from 2046)" } : null;
  if (!pension || !state) return { ok: false, why: "changeover" };
  return { ok: true, items: [pension, state] };
}
