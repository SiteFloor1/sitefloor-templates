// @ts-check
/**
 * The tailor kit (bespoke tailors): everything the shared build needs to know about it, in one file.
 * src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so adding or changing this kit never
 * edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 */
import { checkTailor } from "./config.js";

const D = "src/kits/tailor/features";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- bespoke tailor (trade/tailor) ---
  { id: "garments", section: "garments", dir: `${D}/garments`, minPlan: "starter", kits: ["tailor"], requires: ["garments"], js: true,
    summary: "What the house makes, each with its own \"from\" price, and one Request that opens a quiet sheet: the garments in mind, when suits and, for a wedding, the date; sent on WhatsApp." },
  { id: "the-process", section: "process", dir: `${D}/the-process`, minPlan: "starter", kits: ["tailor"], requires: ["process"], js: false,
    summary: "How a commission runs, in a line a step: first appointment, cut, baste fitting, forward fitting, finished, in the house's own words." },
  { id: "cloth-book", section: "cloth", dir: `${D}/cloth-book`, minPlan: "plus", kits: ["tailor"], requires: ["cloths"], js: true,
    summary: "The cloth book, opened: tall lengths of real cloth hanging from one spine; tap one and its weave fills the screen with its cloth, weight and season, and \"Ask for a swatch\" on WhatsApp." },
  { id: "cloth-page", dir: `${D}/cloth-page`, minPlan: "plus", kits: ["tailor"], requires: ["cloths", "clothPage"], needs: ["cloth-book"], page: "cloth", js: false,
    summary: "The cloth library: every cloth in the book, found by season, each opening to its weave." },
  { id: "process-page", dir: `${D}/process-page`, minPlan: "plus", kits: ["tailor"], requires: ["process", "processPage"], page: "process", js: false,
    summary: "The bespoke process: each step with what happens at it and what to bring, from the first appointment to the finished coat." },
  { id: "travels", dir: `${D}/travels`, minPlan: "plus", kits: ["tailor"], requires: ["travels", "travelsPage"], page: "trunk-shows", js: true,
    summary: "Trunk shows by city: where the cutter will be and when, each to the calendar and a request for a slot on WhatsApp; ones that have finished drop off by themselves." },
  { id: "commission", section: "commission", dir: `${D}/commission`, minPlan: "signature", kits: ["tailor"], requires: ["commission", "process"], optional: ["fittingReminder"], js: true,
    summary: "Your commission, by code: the code on the order card shows which stage the coat has reached, as photographs, the next fitting with Add to calendar, and the cloth that opens to its weave. From the house's published sheet, which holds only a code, a stage, a time and a cloth." },
  { id: "lexicon", dir: `${D}/lexicon`, minPlan: "signature", kits: ["tailor"], requires: ["lexicon"], page: "lexicon", js: true,
    summary: "The style lexicon: the words a cutter uses (peak lapel, ticket pocket, side vents, a soft shoulder), one plain sentence each with a photograph, filtered by kind." },
  { id: "wedding-order", dir: `${D}/wedding-order`, minPlan: "signature", kits: ["tailor"], requires: ["weddingOrder"], optional: ["fittingReminder"], page: "weddings", js: true,
    summary: "The wedding party planner: the date and how many are being dressed, one cloth chosen for everyone; the last day to start (earlier for a larger party, by the house's own rule) and every fitting, in UK date order, to the calendar in one file and to the house on WhatsApp." },
  { id: "spec-card", dir: `${D}/spec-card`, minPlan: "signature", kits: ["tailor"], requires: ["spec"], page: "specification", js: true,
    summary: "The specification card: lapel, fastening, pockets and the cloth chosen from the house's own photographs build a one-page card, sent on WhatsApp with a link that opens it, or printed to bring to the first fitting." },
  { id: "reorder", dir: `${D}/reorder`, minPlan: "signature", kits: ["tailor"], requires: ["reorder"], page: "from-your-pattern", js: true,
    summary: "From your pattern: a returning client orders again by the code on their order card (the garment, the cloth or \"the same as last time\", any change), sent on WhatsApp from their own phone; the site keeps nothing and never asks for a measurement." },
  { id: "garment-pages", dir: `${D}/garment-pages`, minPlan: "plus", kits: ["tailor"], requires: ["garmentPages"], page: "what-we-make", morePages: ["garment"], js: false,
    summary: "What we make: every garment as a photograph on one page, and a page for each (suits, overcoats, dinner suits, shirts) with the house's words, details, the \"from\" price and the cloths it's made in (a collection, counted as one page)." },
  { id: "explained", dir: `${D}/explained`, minPlan: "plus", kits: ["tailor"], requires: ["explained"], page: "bespoke", js: false,
    summary: "Bespoke, made to measure and ready to wear compared in plain words, every general fact linked to its source and dated." },
  { id: "journal", dir: `${D}/journal`, minPlan: "plus", kits: ["tailor"], requires: ["journal"], page: "journal", morePages: ["article"], js: false,
    summary: "The journal: the house's own dated articles (cloth by season, what to wear to a wedding, caring for a suit), each on its own page with its sources." },
  { id: "voucher-page", dir: `${D}/voucher-page`, minPlan: "plus", kits: ["tailor"], requires: ["voucherPage", "vouchers"], needs: ["vouchers"], page: "vouchers", js: false,
    summary: "Gift vouchers on a page of their own, with the house's line and photograph." },
];

/** Shared features this trade doesn't offer. */
export const refuses = ["seasonal", "work", "photo-band", "page-links"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkTailor;

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** @param {any} site */
export function pageData(site) {
  const on = (/** @type {string} */ id) => site.features.includes(id);
  const c = site.commission;
  return {
    garments: on("garments") ? { message: site.garments.message } : null,
    cloths: on("cloth-book") ? { message: site.cloths.message } : null,
    travels: on("travels") ? { message: site.travels.message } : null,
    commission: on("commission") ? {
      source: c.source, csvUrl: c.csvUrl, staleAfterDays: c.staleAfterDays ?? 14, fittingMinutes: c.fittingMinutes ?? 60,
      stages: c.stages, cloths: (site.cloths?.items ?? []).map((/** @type {any} */ x) => x.id),
      example: site.mode === "demo" ? c.example : undefined,
      reminder: site.fittingReminder ? { at: site.fittingReminder.at, items: site.fittingReminder.items } : null,
    } : null,
    weddingOrder: on("wedding-order") ? { orderStep: site.weddingOrder.orderStep, steps: site.weddingOrder.steps, party: site.weddingOrder.party ?? null,
      reminder: site.fittingReminder?.weddingSteps?.length ? { at: site.fittingReminder.at, items: site.fittingReminder.items, steps: site.fittingReminder.weddingSteps } : null } : null,
    spec: on("spec-card") ? { message: site.spec.message } : null,
    reorder: on("reorder") ? { message: site.reorder.message } : null,
    place: [site.business.name, site.location.streetAddress, site.location.locality, site.location.postcode].filter(Boolean).join(", "),
  };
}

/**
 * Live data: simulated on a demo (src/demo), the house's published Google Sheet otherwise.
 * @type {import("../../features/registry.js").Provider[]}
 */
export const providers = [
  {
    key: "commission",
    on: (site, enabled) => enabled.has("commission"),
    simulated: (site) => site.commission?.source === "simulated",
    demo: { from: "src/demo/commission-provider.js", name: "simulatedCommission" },
    live: { from: "src/kits/tailor/features/commission/sheet-provider.js", name: "sheetCommission" },
  },
];

/** What this kit adds to the site's Content-Security-Policy. @param {any} site @returns {import("../../features/registry.js").KitCsp} */
export function csp(site) {
  return { sheets: site.features?.includes("commission") && site.commission?.source === "sheet" };
}
