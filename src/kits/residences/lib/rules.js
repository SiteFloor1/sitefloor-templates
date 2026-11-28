// @ts-check
/**
 * The rules the residences kit states, each with its GOV.UK source and the day it was checked. Only what the kit
 * works out from them lives here (the deposit caps); everything else a page says about a stay or a tenancy is the
 * operator's own words from site.json. Re-check every source before the date moves.
 */
export const RULES = {
  checked: "2026-11-26",
  /** Assured tenancies are periodic (rolling) with no end date, from 1 May 2026. */
  rolling: {
    url: "https://www.gov.uk/guidance/renters-rights-act-overview-for-tenants",
    source: "GOV.UK, Renters' Rights Act overview for tenants",
  },
  /** Only the payments the Tenant Fees Act 2019 permits can be charged in connection with a tenancy. */
  fees: {
    url: "https://www.gov.uk/government/publications/tenant-fees-act-amended-by-the-renters-rights-act-2025/tenant-fees-act-2019-statutory-guidance-for-enforcement-authorities",
    source: "GOV.UK, Tenant Fees Act 2019: statutory guidance",
    holdingWeeks: 1,
    depositWeeksBelow: 5,
    depositWeeksFrom: 6,
    depositThreshold: 50_000,
  },
  /** Headline prices must include every mandatory fee (drip pricing). */
  prices: {
    url: "https://www.gov.uk/government/publications/unfair-commercial-practices-cma207",
    source: "GOV.UK, CMA guidance on unfair commercial practices (CMA207)",
  },
  /** Letting agents and property managers in England must belong to an approved redress scheme. */
  redress: {
    url: "https://www.gov.uk/redress-scheme-estate-agencies",
    source: "GOV.UK, Registering with a redress scheme as a property agent",
    schemes: ["The Property Ombudsman", "Property Redress Scheme"],
  },
  /** Above this annual rent a tenancy isn't an assured tenancy, so the kit works nothing out and says to ask. */
  assuredLimit: 100_000,
};

/** "26 November 2026". @param {string} ymd */
export const ukDay = (ymd) => new Date(`${ymd}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
