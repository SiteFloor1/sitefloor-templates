// @ts-check
/**
 * What a stay costs, every mandatory fee inside the total (CMA: no drip pricing). Short stays: the nightly rate (with
 * service and VAT) times the nights, plus the cleaning charge once. Long lets are rolling tenancies with no end date,
 * so they are priced by the month, never by length; the only figures worked out are the Tenant Fees Act caps on the
 * holding deposit and the tenancy deposit, from the rent. Above the assured-tenancy rent limit nothing is worked out.
 */
import { RULES } from "./rules.js";

/** @typedef {import("./homes.js").Home} Home */
/** @typedef {{ kind: "short", nights: number, total: number, perNight: number }
 *   | { kind: "long", rent: number, weekly: number, holding: number, deposit: number, depositWeeks: number }
 *   | { kind: "none", why: "no-short" | "no-long" | "too-short" | "above-limit" }} Quote */

/** Whole pounds: "£9,180". @param {number} n */
export const pounds = (n) => `£${Math.round(n).toLocaleString("en-GB")}`;

/** @param {Home} h @param {number|"long"} stay nights, or "long" for a tenancy @returns {Quote} */
export function quote(h, stay) {
  if (stay === "long") {
    if (!h.long) return { kind: "none", why: "no-long" };
    const year = h.rent * 12;
    if (year > RULES.assuredLimit) return { kind: "none", why: "above-limit" };
    const weekly = year / 52;
    const depositWeeks = year >= RULES.fees.depositThreshold ? RULES.fees.depositWeeksFrom : RULES.fees.depositWeeksBelow;
    // the caps are maximums, so round down to the penny below and show whole pounds rounded down
    return { kind: "long", rent: h.rent, weekly, holding: Math.floor(weekly * RULES.fees.holdingWeeks), deposit: Math.floor(weekly * depositWeeks), depositWeeks };
  }
  if (!h.short) return { kind: "none", why: "no-short" };
  if (stay < h.minNights) return { kind: "none", why: "too-short" };
  const total = h.night * stay + h.clean;
  return { kind: "short", nights: stay, total, perNight: total / stay };
}

/** The headline a list shows: the shortest stay's all-in nightly figure, and the monthly rent. @param {Home} h */
export function headline(h) {
  const s = h.short ? quote(h, h.minNights) : null;
  return {
    night: s && s.kind === "short" ? { perNight: Math.ceil(s.perNight), nights: s.nights } : null,
    month: h.long && h.rent * 12 <= RULES.assuredLimit ? h.rent : null,
  };
}

/** Why there's no figure, in words. @param {Extract<Quote, { kind: "none" }>["why"]} why @param {Home} h */
export function noneText(why, h) {
  if (why === "no-short") return `${h.name} is let on a tenancy only.`;
  if (why === "no-long") return `${h.name} is let by the night only.`;
  if (why === "too-short") return `${h.name} has a ${h.minNights}-night minimum.`;
  return "Ask us for the terms: at this rent it isn't an assured tenancy.";
}
