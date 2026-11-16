// @ts-check
/**
 * The letting kit (independent letting and property management agents in England): everything the shared build needs
 * to know about it, in one file. src/features/registry.js finds this file by itself. What each export is for:
 * docs/ARCHITECTURE.md, "A kit registers itself". The law shapes the kit: every fee shown with VAT, the redress and
 * client money protection schemes named on every page, the Tenant Fees Act caps worked out from the rent, and the
 * material information (rent, deposits, council tax band, EPC) on every home shown as available.
 */
import { checkLetting } from "./config.js";

const K = ["letting"];
const D = "src/kits/letting/features";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- Starter ---
  { id: "letting-fees", dir: `${D}/letting-fees`, minPlan: "starter", kits: K, requires: ["fees", "schemes"], page: "fees", freePage: true, js: false,
    summary: "Fees (free on every plan, and in the menu of every page): every landlord fee with VAT, what a tenant may be asked to pay and nothing else, the redress and client money protection schemes with their certificate, from GOV.UK's rules and dated." },
  { id: "letting-board", section: "homes", dir: `${D}/letting-board`, minPlan: "starter", kits: K, requires: ["homes"], js: true,
    summary: "Homes free now: from the agent's own Google Sheet, each with its rent, size, deposits, council tax band and EPC, and a viewing request by WhatsApp. When the sheet hasn't been updated for a day and a half, no home is shown as free." },
  { id: "letting-movein", dir: `${D}/letting-movein`, minPlan: "starter", kits: K, requires: ["fees"], needs: ["letting-fees"], js: true,
    summary: "What you pay before the keys: type a rent and see the holding deposit, the deposit (five or six weeks) and the first month, within the Tenant Fees Act caps. On the fees page." },
  // --- Plus ---
  { id: "letting-owners", dir: `${D}/letting-owners`, minPlan: "plus", kits: K, requires: ["owners", "fees"], page: "owners", js: false,
    summary: "For owners: each service with what it includes and its fee with VAT, the duties the agent looks after for a landlord, and a valuation request by WhatsApp." },
  { id: "letting-repairs", dir: `${D}/letting-repairs`, minPlan: "plus", kits: K, requires: ["repairs"], page: "repairs", js: true,
    summary: "Report a repair: what counts as an emergency and the out-of-hours number (the gas emergency line first), then a short form that writes the WhatsApp message; the tenant adds photos there. The site sends and keeps nothing." },
  { id: "letting-manage", dir: `${D}/letting-manage`, minPlan: "plus", kits: K, requires: ["manage"], page: "manage", js: false,
    summary: "What we manage: how many homes the agent looks after (counted from its buildings), the kinds of home it takes on, a managed let's year month by month, and what it doesn't take on." },
  { id: "letting-areas", dir: `${D}/letting-areas`, minPlan: "plus", kits: K, requires: ["areas", "homes"], needs: ["letting-board"], page: "areas", morePages: ["area"], collection: true, js: true,
    summary: "Areas: a page per area the agent lets in, with its photograph, the agent's notes and the homes free there now from the sheet." },
  { id: "letting-journal", dir: `${D}/letting-journal`, minPlan: "plus", kits: K, requires: ["journal"], page: "journal", morePages: ["article"], collection: true, js: false,
    summary: "The journal: long-let articles for tenants and owners, each dated, with the day its rules were checked against GOV.UK and its sources." },
  // --- Signature ---
  { id: "letting-building", dir: `${D}/letting-building`, minPlan: "signature", kits: K, requires: ["homes"], needs: ["letting-board"], js: true,
    summary: "The lift indicator and the building in 3D: a brass plate of floor lamps over the photograph of the entrance; a floor lights its free homes. On tap, an illustration of the building turns into view with every free home's windows lit from the sheet. Nothing loads before the tap; a stale sheet lights nothing." },
  { id: "letting-residences", dir: `${D}/letting-residences`, minPlan: "signature", kits: K, requires: ["homes"], needs: ["letting-board"], page: "residences", js: true,
    summary: "Residences: the schedule of every building, floor by floor, with each free home's rent, bedrooms and size, from the same sheet. On a phone, one building at a time." },
  { id: "letting-valuation", dir: `${D}/letting-valuation`, minPlan: "signature", kits: K, requires: ["valuation", "fees"], page: "valuation", js: true,
    summary: "What would my home let for? The owner completes one sentence about the home; it goes to the agent on WhatsApp as a valuation request. No figure is worked out: the agent replies." },
  { id: "letting-onboarding", dir: `${D}/letting-onboarding`, minPlan: "signature", kits: K, requires: ["onboarding"], page: "onboarding", js: true,
    summary: "Onboarding for owners: from the first call to the first rent, step by step, then the papers a let needs as a checklist that goes to the agent as one WhatsApp message." },
  { id: "letting-stories", dir: `${D}/letting-stories`, minPlan: "signature", kits: K, requires: ["stories"], page: "stories", js: false,
    summary: "Owner stories: before, what the agent did, and since, in the owner's own figures; real owners with their permission on a client site, marked fictional on a demo." },
  { id: "letting-moveday", dir: `${D}/letting-moveday`, minPlan: "signature", kits: K, requires: ["moveday"], page: "moving-in", js: true,
    summary: "Move-in day planner: from the day the keys are handed over, the inventory, keys, meter readings, council tax and the deposit's protection details within 30 days, saved to the tenant's calendar." },
  { id: "letting-net", section: "net", dir: `${D}/letting-net`, minPlan: "signature", kits: K, requires: ["fees"], js: true,
    summary: "One rent, from both sides: type a monthly rent and see what a tenant pays before the keys beside what reaches the owner under each service, from the agent's own published fees. An illustration, not advice." },
];

/**
 * Shared features this trade doesn't offer yet: each would need this look's own markup first (Plan your visit and
 * the questions have it). Galleries and before/after need a client's own matched photographs of one home.
 */
export const refuses = ["gallery", "work", "reviews", "team", "vouchers", "seasonal", "photo-band", "page-links", "custom-pages"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkLetting;

/** What the browser scripts read from the page, only for the features that are on. @param {any} site */
export function pageData(site) {
  const on = (/** @type {string} */ id) => site.features.includes(id);
  /** @type {Record<string, any>} */ const out = {};
  if (on("letting-board")) {
    const h = site.homes;
    out.homes = {
      source: h.source, csvUrl: h.csvUrl, staleAfterHours: h.staleAfterHours ?? 36, hero: h.hero, viewing: h.viewing,
      buildings: h.buildings.map((/** @type {any} */ b) => ({ id: b.id, name: b.name, kind: b.kind, model: b.model,
        floors: b.floors.map((/** @type {any} */ f) => ({ id: f.id, label: f.label, note: f.note, units: f.units })) })),
      tenant: site.fees?.tenant ?? {},
    };
  }
  if (on("letting-movein") || on("letting-net")) out.fees = { example: site.fees.example ?? 2000, tenant: site.fees.tenant ?? {}, services: site.fees.services.map((/** @type {any} */ s) => ({ id: s.id, name: s.name, basis: s.basis, percent: s.percent })) };
  if (on("letting-repairs")) out.repairs = { message: site.repairs.message };
  if (on("letting-valuation")) out.valuation = { message: site.valuation.message };
  if (on("letting-onboarding")) out.onboarding = { message: site.onboarding.message };
  if (on("letting-moveday")) out.moveday = { steps: site.moveday.steps, agent: site.business.name, place: `${site.business.name}, ${site.location.streetAddress}, ${site.location.locality}` };
  return out;
}

/**
 * Live data: the agent's homes sheet. Simulated on a demo (src/demo), the agent's published Google Sheet otherwise.
 * @type {import("../../features/registry.js").Provider[]}
 */
export const providers = [
  {
    key: "homes",
    on: (site, enabled) => enabled.has("letting-board"),
    simulated: (site) => site.homes?.source === "simulated",
    demo: { from: "src/demo/letting-provider.js", name: "simulatedHomes" },
    live: { from: "src/kits/letting/features/letting-board/sheet-provider.js", name: "sheetHomes" },
  },
];

/** What this kit adds to the security policy: the Google Sheets hosts, when the agent's homes come from a sheet. @param {any} site */
export function csp(site) {
  return { sheets: !!site.features?.includes("letting-board") && site.homes?.source === "sheet" };
}
