// @ts-check
/**
 * The residences kit (luxury residences and hotel-grade rentals: one building, or a few, of furnished homes let by
 * the night or on a tenancy, with hotel service). Everything the shared build needs to know about it, in one file;
 * src/features/registry.js finds it by itself. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 * The law shapes it: every headline price holds every mandatory fee (CMA, no drip pricing); long lets are rolling
 * tenancies, priced by the month, with only the payments the Tenant Fees Act permits; the redress scheme and fees
 * are shown as the operator supplies them, linked to GOV.UK with the date checked (lib/rules.js).
 */
import { checkResidences } from "./config.js";

const K = ["residences"];
const D = "src/kits/residences/features";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- Starter ---
  { id: "residences-fees", dir: `${D}/residences-fees`, minPlan: "starter", kits: K, requires: ["fees", "schemes"], page: "fees", freePage: true, js: false,
    summary: "Fees and terms (free on every plan, in every page's menu): what a short stay includes and costs, the payments the Tenant Fees Act permits on a tenancy, and the redress scheme, as the operator supplies them, each rule linked to GOV.UK with the date checked." },
  { id: "residences-homes", section: "homes", dir: `${D}/residences-homes`, minPlan: "starter", kits: K, requires: ["homes"], js: true,
    summary: "Free now and free from: each free home from the operator's Google Sheet with its photo, size, the date it is free, the all-in price a night for its shortest stay and the rent a month, and an enquiry by WhatsApp. A stale sheet shows no home as free." },
  { id: "residences-viewing", dir: `${D}/residences-viewing`, minPlan: "starter", kits: K, requires: ["viewing"], page: "viewing", freePage: true, js: true,
    summary: "Book a viewing (free on every plan): in person or on a video call, a day and a time, which home; it writes the WhatsApp message. The site sends and keeps nothing." },
  // --- Plus ---
  { id: "residences-list", dir: `${D}/residences-list`, minPlan: "plus", kits: K, requires: [], needs: ["residences-homes"], page: "residences", js: true,
    summary: "Residences: every free home on one page, filtered by stay (short or long), bedrooms and the date you need it from." },
  { id: "residences-quiet", dir: `${D}/residences-quiet`, minPlan: "plus", kits: K, requires: [], needs: ["residences-homes"], js: false,
    summary: "Quiet notes on each home: street or courtyard side, glazing, cooling and blackout, from the sheet; a blank cell is left out, never guessed." },
  { id: "residences-quote", dir: `${D}/residences-quote`, minPlan: "plus", kits: K, requires: [], needs: ["residences-homes"], page: "quote", unlisted: true, js: true,
    summary: "Send this quote: a home, a stay and its all-in total as a link to send to whoever is paying, with the date the prices were updated and \"not a booking\" on it." },
  { id: "residences-areas", dir: `${D}/residences-areas`, minPlan: "plus", kits: K, requires: ["areas"], page: "areas", morePages: ["area"], collection: true, js: false,
    summary: "Areas: a page per neighbourhood the residence is in or near, with a photograph and the operator's own notes." },
  { id: "residences-short", dir: `${D}/residences-short`, minPlan: "plus", kits: K, requires: ["shortLets"], needs: ["residences-homes"], page: "short-lets", js: false,
    summary: "Short lets: how a stay by the night works, what's included and the booking terms in plain words, before anyone enquires." },
  { id: "residences-long", dir: `${D}/residences-long`, minPlan: "plus", kits: K, requires: ["longLets"], needs: ["residences-homes"], page: "long-lets", js: true,
    summary: "Long lets: a rolling tenancy with no end date, priced by the month; type a rent to see the most the holding deposit and the deposit can be, from the Tenant Fees Act caps, linked to GOV.UK." },
  { id: "residences-serviced", dir: `${D}/residences-serviced`, minPlan: "plus", kits: K, requires: ["serviced"], page: "serviced", js: false,
    summary: "What \"serviced\" means: what each length of stay includes, side by side (cleaning, linen, concierge, bills), in the operator's words." },
  { id: "residences-arriving", dir: `${D}/residences-arriving`, minPlan: "plus", kits: K, requires: ["arriving"], page: "arriving", js: true,
    summary: "Arriving: the steps from the street to the door, late arrivals and the concierge's hours, and the arrival day as a calendar file. No door codes or key details on the web." },
  { id: "residences-about", dir: `${D}/residences-about`, minPlan: "plus", kits: K, requires: ["about"], page: "about", js: false,
    summary: "About: the building, who runs it and how, in the operator's own words and photographs." },
  { id: "residences-plans", dir: `${D}/residences-plans`, minPlan: "plus", kits: K, requires: [], needs: ["residences-homes"], js: false,
    summary: "Floor plans: the operator's own plan of each home, in its card. Client sites only: a demo has no real plans." },
  // --- Signature ---
  { id: "residences-stay", dir: `${D}/residences-stay`, minPlan: "signature", kits: K, requires: ["stay"], needs: ["residences-homes"], js: true,
    summary: "The stay bar, docked under the photograph: pick a home and slide from a few nights to a long let; the total holds every mandatory fee and the homes below re-price to the same stay. A long let is priced by the month, with the Tenant Fees Act deposits and the GOV.UK sources." },
  { id: "residences-sun", dir: `${D}/residences-sun`, minPlan: "signature", kits: K, requires: ["light"], needs: ["residences-homes"], js: false,
    summary: "Sun on the windows: each home's card says when the sun reaches its windows today, from the sun's position and the way the home faces (from the sheet); it ignores neighbouring buildings and cloud, and says so." },
  { id: "residences-map", dir: `${D}/residences-map`, minPlan: "signature", kits: K, requires: ["neighbourhood"], page: "neighbourhood", js: false,
    summary: "Neighbourhood guide: the places the operator names, drawn around the building on rings of walking time, with the operator's minutes or an estimate marked \"about\". No ratings." },
  { id: "residences-concierge", dir: `${D}/residences-concierge`, minPlan: "signature", kits: K, requires: ["concierge"], page: "concierge", js: true,
    summary: "Concierge, before you arrive: tick what you'd like waiting (only what the operator lists) and give a day and time; it writes the WhatsApp message, and the concierge replies with anything that has a price." },
  { id: "residences-corporate", dir: `${D}/residences-corporate`, minPlan: "signature", kits: K, requires: ["corporate"], page: "corporate", js: true,
    summary: "Corporate relocations: the operator's terms for companies (invoicing, who signs), and a relocation request written as one message." },
  { id: "residences-owners", dir: `${D}/residences-owners`, minPlan: "signature", kits: K, requires: ["owners"], page: "landlords", js: false,
    summary: "For landlords: each service the operator offers other owners, what it includes and its fee with VAT, in one list." },
  { id: "residences-journal", dir: `${D}/residences-journal`, minPlan: "signature", kits: K, requires: ["journal"], page: "journal", morePages: ["article"], collection: true, js: false,
    summary: "Journal: the operator's own articles (moving to London, renting in England as a newcomer), each dated, with any rules checked against GOV.UK and the date." },
  { id: "residences-tour", dir: `${D}/residences-tour`, minPlan: "signature", kits: K, requires: [], needs: ["residences-homes"], js: false,
    summary: "The operator's own 3D tour of a home, opened from its card (Matterport). Client sites only: it needs the client's own scan." },
];

/** Galleries, reviews and the like each need this look's own markup and the operator's own material first. */
export const refuses = ["gallery", "work", "reviews", "team", "vouchers", "seasonal", "photo-band", "page-links", "custom-pages"];

/** Features that need the operator's own material, so no demo turns them on; the client fixture covers them. */
export const clientOnly = ["residences-plans", "residences-tour"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkResidences;

/** What the browser scripts read from the page, only for the features that are on. @param {any} site */
export function pageData(site) {
  const on = (/** @type {string} */ id) => site.features.includes(id);
  /** @type {Record<string, any>} */ const out = {};
  if (on("residences-homes")) {
    const h = site.homes;
    out.homes = {
      source: h.source, csvUrl: h.csvUrl, staleAfterHours: h.staleAfterHours ?? 36, ask: h.ask, photos: h.photos,
      quiet: on("residences-quiet"), quote: on("residences-quote"),
      plans: on("residences-plans") ? h.plans ?? {} : {}, tours: on("residences-tour") ? h.tours ?? {} : {},
    };
  }
  if (on("residences-stay")) out.stay = site.stay;
  if (on("residences-sun")) out.light = site.light;
  if (on("residences-viewing")) out.viewing = { message: site.viewing.message, kinds: site.viewing.kinds };
  if (on("residences-concierge")) out.concierge = { message: site.concierge.message };
  if (on("residences-corporate")) out.corporate = { message: site.corporate.message };
  if (on("residences-arriving")) out.arriving = { steps: site.arriving.steps.map((/** @type {any} */ s) => s.title), concierge: site.arriving.hours, place: `${site.business.name}, ${site.location.streetAddress}, ${site.location.locality} ${site.location.postcode}` };
  return out;
}

/**
 * Live data: the homes sheet. Simulated on a demo (src/demo), the operator's published Google Sheet otherwise.
 * @type {import("../../features/registry.js").Provider[]}
 */
export const providers = [
  {
    key: "residences",
    on: (site, enabled) => enabled.has("residences-homes"),
    simulated: (site) => site.homes?.source === "simulated",
    demo: { from: "src/demo/residences-provider.js", name: "simulatedResidences" },
    live: { from: "src/kits/residences/features/residences-homes/sheet-provider.js", name: "sheetResidences" },
  },
];

/** The Google Sheets hosts when the homes come from a sheet; Matterport when a tour is on. @param {any} site */
export function csp(site) {
  const on = (/** @type {string} */ id) => !!site.features?.includes(id);
  return { sheets: on("residences-homes") && site.homes?.source === "sheet", ...(on("residences-tour") ? { frame: ["https://my.matterport.com"] } : {}) };
}
