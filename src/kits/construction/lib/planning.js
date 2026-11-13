// @ts-check
/**
 * Planning, party wall and building-regulation facts for England, each as GOV.UK states it, with the page and the date
 * it was checked. This file is the only place these facts live: the planning guide on the 3D model, the planning page
 * and the service pages all read it, so a change in the rules is one edit here (and a new `checked` date).
 *
 * Every limit is for permitted development (PD): work a house may do without applying for planning permission, if it
 * meets every condition. It is a guide, never a decision: the council decides, or a lawful development certificate
 * confirms it. PD rights do not apply to flats; conservation areas and other "article 2(3) land" have tighter rules.
 */

export const CHECKED = "2026-11-04";
/** The roof rules (Class B) were checked again for the loft guide on this date. */
export const LOFT_CHECKED = "2026-11-05";

/** GOV.UK pages, by key. `updated` is the date the page itself showed when checked. */
export const SOURCES = {
  pd: { label: "Permitted development rights for householders: technical guidance", url: "https://www.gov.uk/government/publications/permitted-development-rights-for-householders-technical-guidance/permitted-development-rights-for-householders-technical-guidance", checked: CHECKED },
  pdLoft: { label: "Permitted development rights for householders: technical guidance, Class B (additions to the roof)", url: "https://www.gov.uk/government/publications/permitted-development-rights-for-householders-technical-guidance/permitted-development-rights-for-householders-technical-guidance", checked: LOFT_CHECKED },
  ldc: { label: "Lawful development certificates", url: "https://www.gov.uk/guidance/lawful-development-certificates", checked: CHECKED },
  permission: { label: "Planning permission: the basics", url: "https://www.gov.uk/planning-permission-england-wales", checked: CHECKED },
  partyWork: { label: "Party walls and building work: work you must tell your neighbour about", url: "https://www.gov.uk/party-walls-building-works/work-tell-your-neighbour-about", checked: CHECKED },
  partyWhen: { label: "Party walls and building work: when and how to tell them", url: "https://www.gov.uk/party-walls-building-works/when-how-tell-them", checked: CHECKED },
  partyAgree: { label: "Party walls and building work: reaching an agreement with your neighbours", url: "https://www.gov.uk/party-walls-building-works/reaching-agreement-with-neighbours", checked: CHECKED },
  regs: { label: "Building regulations approval", url: "https://www.gov.uk/building-regulations-approval", checked: CHECKED },
};

/**
 * Single-storey rear extensions under Class A, measured from the original rear wall (earlier extensions count):
 * the usual limit, and the larger limit under prior approval (neighbours are consulted; not on article 2(3) land).
 */
export const REAR = {
  detached: { pd: 4, prior: 8 },
  other: { pd: 3, prior: 6 },
  height: 4,          // metres, at most
  eavesNearBoundary: 3, // metres, at most, when within 2 m of the boundary
};

/**
 * Roof extensions under Class B: the added volume over the original roof space (earlier roof extensions count), the
 * set-back from the eaves along the roof slope (not for a hip-to-gable), and the side-window rule.
 */
export const LOFT = {
  terrace: 40,     // cubic metres, a terrace house (end terraces included)
  other: 50,       // cubic metres, any other house
  eaves: 0.2,      // metres from the eaves, measured along the slope, so far as practicable
  sill: 1.7,       // side windows obscure-glazed and only opening above this height from the floor
};

/** @param {string} house "terrace" | "semi" | "detached" */
export const loftAllowance = (house) => (house === "terrace" ? LOFT.terrace : LOFT.other);

/**
 * Where a loft conversion of this added volume sits against the allowance, for the loft guide.
 * @param {string} house @param {number} added cubic metres over the original roof space
 * @returns {{ zone: "pd"|"permission", allowance: number, words: string }}
 */
export function loftZone(house, added) {
  const allowance = loftAllowance(house);
  const kind = house === "terrace" ? "a terraced house" : "a semi-detached or detached house";
  const about = Math.round(added);
  if (added <= allowance) return { zone: "pd", allowance, words: `About ${about} m³ added: within the ${allowance} m³ permitted-development allowance for ${kind}.` };
  return { zone: "permission", allowance, words: `About ${about} m³ added: over the ${allowance} m³ allowance for ${kind}, so it needs planning permission.` };
}

/** The other roof conditions, set under the loft guide. */
export const LOFT_RULES = [
  "No higher than the highest part of the existing roof.",
  "No roof extension on a slope at the front of the house that faces a road.",
  `So far as practicable, at least ${LOFT.eaves * 100} cm back from the eaves, measured along the roof (not for a hip-to-gable).`,
  `Side windows obscure-glazed, and opening only more than ${LOFT.sill} m above the floor.`,
  "No balconies, verandas or raised platforms.",
  "Materials similar in appearance to the house; a dormer's flat roof can be felt, lead or zinc.",
  "Earlier roof extensions count towards the allowance, measured from the original roof space.",
  "In a conservation area or other article 2(3) land, roof extensions need planning permission. Permitted development rights don't apply to flats.",
];

/** @param {string} house "terrace" | "semi" | "detached" */
export const rearLimits = (house) => (house === "detached" ? REAR.detached : REAR.other);

/**
 * Where a rear extension of this depth sits against the limits, for the planning guide on the 3D model.
 * @param {string} house @param {number} depth metres from the original rear wall
 * @returns {{ zone: "pd"|"prior"|"permission", limits: { pd: number, prior: number }, words: string }}
 */
export function rearZone(house, depth) {
  const l = rearLimits(house);
  const kind = house === "detached" ? "a detached house" : "a terraced or semi-detached house";
  if (depth <= l.pd) return { zone: "pd", limits: l, words: `Within ${l.pd} m: the usual permitted-development depth for ${kind}.` };
  if (depth <= l.prior) return { zone: "prior", limits: l, words: `Between ${l.pd} and ${l.prior} m: possible for ${kind} only through prior approval, where the council consults your neighbours. Not in a conservation area.` };
  return { zone: "permission", limits: l, words: `Over ${l.prior} m: beyond permitted development for ${kind}, so it needs planning permission.` };
}

/**
 * The planning page and the service pages: each topic in plain words, as close to GOV.UK as plain English allows, with
 * its sources. `points` are facts; nothing here is advice.
 * @type {Record<string, { title: string, points: string[], sources: (keyof typeof SOURCES)[] }>}
 */
export const TOPICS = {
  permission: {
    title: "Do you need planning permission?",
    points: [
      "You'll probably need planning permission to build something new, to make a major change such as an extension, or to change a building's use.",
      "Some work on a house doesn't need it, under permitted development rights, if it meets every condition. These rights don't apply to flats.",
      "To check, contact your local planning authority through your council.",
    ],
    sources: ["permission", "pd"],
  },
  rear: {
    title: "Rear extensions",
    points: [
      `A single-storey rear extension can go out up to ${REAR.other.pd} m from the original rear wall of a terraced or semi-detached house, or ${REAR.detached.pd} m for a detached house, and be no more than ${REAR.height} m high.`,
      `Under prior approval, where the council consults your neighbours, those depths can be ${REAR.other.prior} m and ${REAR.detached.prior} m. This route isn't available in conservation areas and other article 2(3) land.`,
      `Within 2 m of the boundary, the eaves can be no higher than ${REAR.eavesNearBoundary} m. The materials should look similar to the house's.`,
      "Earlier extensions to the house count towards these limits, and buildings around the house can't cover more than half the garden and grounds.",
    ],
    sources: ["pd"],
  },
  side: {
    title: "Side extensions",
    points: [
      "A side extension can only be single storey, no more than 4 m high, and no wider than half the width of the original house.",
      "In a conservation area and other article 2(3) land, side extensions aren't permitted development.",
    ],
    sources: ["pd"],
  },
  loft: {
    title: "Loft conversions",
    points: [
      `A roof extension can add up to ${LOFT.terrace} cubic metres to a terraced house, or ${LOFT.other} cubic metres to other houses, counting any earlier roof extensions.`,
      "It can't be higher than the highest part of the existing roof, or go beyond the roof slope at the front where it faces a road.",
      `So far as practicable it sits at least ${LOFT.eaves * 100} cm back from the eaves. Side windows are obscure-glazed and only open more than ${LOFT.sill} m above the floor.`,
      "Balconies, verandas and raised platforms aren't permitted development, and in conservation areas roof extensions need planning permission.",
    ],
    sources: ["pdLoft"],
  },
  certificate: {
    title: "A lawful development certificate",
    points: [
      "Anyone can apply to the local planning authority for a certificate confirming that a proposed use or development would be lawful, for example that an extension falls within permitted development.",
    ],
    sources: ["ldc"],
  },
  party: {
    title: "Party walls",
    points: [
      "You must tell your neighbour if you want to build on or at the boundary, work on an existing party wall or party structure, or dig below and near the foundation level of their property.",
      "Give notice between 2 months and a year before the work starts.",
      "Your neighbour must say in writing within 14 days whether they consent. If they refuse, or don't reply, the dispute process starts: you can't assume silence means yes.",
      "If you can't agree, an appointed surveyor sets out who pays what.",
    ],
    sources: ["partyWork", "partyWhen", "partyAgree"],
  },
  regs: {
    title: "Building regulations",
    points: [
      "The Building Regulations 2010 cover the construction and extension of buildings; check whether your work needs approval before you start.",
      "Approval comes from your council's building control or a registered building control approver. You don't need to apply yourself if you use someone registered with a competent person scheme.",
    ],
    sources: ["regs"],
  },
};

/** The words under every planning guide: a guide, never a decision. */
export const NOT_A_DECISION = "A guide, not a decision. Check with your council or apply for a lawful development certificate.";

/** The other conditions, set under the planning guide. */
export const GUIDE_RULES = [
  `No more than ${REAR.height} m high.`,
  `Within 2 m of the boundary, the eaves no higher than ${REAR.eavesNearBoundary} m.`,
  "Materials similar in appearance to the house.",
  "Measured from the original rear wall; earlier extensions count.",
  "Permitted development rights don't apply to flats.",
  "In a conservation area or other article 2(3) land, the prior approval route isn't available, and side extensions need planning permission.",
];
