// @ts-check
/**
 * The hol kit (holiday-let and Airbnb management companies in Great Britain): everything the shared build needs to
 * know about it, in one file. src/features/registry.js finds this file by itself. What each export is for:
 * docs/ARCHITECTURE.md, "A kit registers itself". Owners are the company's customers, so owners come first; guests
 * book through the company's own links. Honesty shapes the kit: the earnings estimate exists only when the company
 * publishes last year's figures, every figure carries its basis, the fee is shown in pounds with VAT, guest prices
 * are totals with every fee, and each rule links to the official page with the date it was checked.
 * Codes HOL-1 to HOL-9 are the owner's names for the features (docs/VISION.md).
 */
import { checkHol } from "./config.js";
import { codeHash } from "./lib/owners.js";

const K = ["hol"];
const D = "src/kits/hol/features";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- Starter ---
  { id: "hol-fees", section: "fees", dir: `${D}/hol-fees`, minPlan: "starter", kits: K, requires: ["fees"], page: "fees", freePage: true, js: false,
    summary: "HOL-1, what we do and what it costs (free on every plan, in the menu of every page): who does what, the owner's side and the company's, and the fee as a percentage and in pounds on an example, VAT included, with every other charge listed once." },
  { id: "hol-rules", section: "rules", dir: `${D}/hol-rules`, minPlan: "starter", kits: K, requires: ["rules"], page: "rules", freePage: true, js: true,
    summary: "HOL-2, rules where your home is: pick England, London, Scotland or Wales and see what applies, each line linked to GOV.UK, legislation.gov.uk, gov.scot or GOV.WALES with the date it was checked; six months on, a line shows only its official link. A card on the home page; the page in full." },
  // --- Plus ---
  { id: "hol-owners", dir: `${D}/hol-owners`, minPlan: "plus", kits: K, requires: ["owners", "fees"], page: "owners", js: false,
    summary: "For owners: what the company promises its owners, who does what, then (when on) how we start and an owner's month." },
  { id: "hol-start", dir: `${D}/hol-start`, minPlan: "plus", kits: K, requires: ["start"], needs: ["hol-owners"], js: false,
    summary: "HOL-4, how we start: the onboarding steps in the company's own words and timings, on the owners page." },
  { id: "hol-statement", dir: `${D}/hol-statement`, minPlan: "plus", kits: K, requires: ["statement", "fees"], needs: ["hol-owners"], js: false,
    summary: "HOL-8, an owner's month: a sample monthly statement from the company's own layout (nights, what guests paid, the fee in pounds, costs, paid out), labelled a sample, its sums checked at build time." },
  { id: "hol-review", dir: `${D}/hol-review`, minPlan: "plus", kits: K, requires: ["review"], page: "review", js: true,
    summary: "HOL-3, ask for a revenue review: a short form (where, bedrooms, sleeps, how it's let now) that writes one WhatsApp message to the company. The site sends and keeps nothing." },
  { id: "hol-turnover", section: "turnover", dir: `${D}/hol-turnover`, minPlan: "plus", kits: K, requires: ["turnover"], js: true,
    summary: "HOL-5, between guests: the changeover as a ruled day of times beside a room photograph; choosing a time opens its line and changes the photograph. On the home page." },
  { id: "hol-homes", section: "homes", dir: `${D}/hol-homes`, minPlan: "plus", kits: K, requires: ["homes"], page: "homes", js: false,
    summary: "HOL-7, the homes we look after: each home's photograph, town, sleeps and bedrooms, the guest's total for a stated stay with every fee included (CMA), and its booking link. Three on the home page, all on The homes." },
  // --- Signature ---
  { id: "hol-estimate", dir: `${D}/hol-estimate`, minPlan: "signature", kits: K, requires: ["estimate", "fees"], js: true,
    summary: "HOL-6, what could it earn? Under the hero photograph, one sum: what guests pay, less the fee, equals what reaches the owner, from the company's own last-year figures by size of home; own weeks taken off, the range and the basis on the same line. Without published figures it can't be turned on." },
  { id: "hol-calendar", dir: `${D}/hol-calendar`, minPlan: "signature", kits: K, requires: ["homes"], needs: ["hol-homes"], js: true,
    summary: "HOL-7 on Signature: each home's next free dates, from the company's own Google Sheet of booked stays; hidden when the sheet is more than a day and a half old." },
  { id: "hol-manage", dir: `${D}/hol-manage`, minPlan: "signature", kits: K, requires: ["manage"], page: "manage", js: false,
    summary: "What we manage: the kinds of home the company takes on, how many it looks after, and what it doesn't take on." },
  { id: "hol-areas", dir: `${D}/hol-areas`, minPlan: "signature", kits: K, requires: ["areas"], page: "areas", js: false,
    summary: "Areas: where the company works, by town and postcode district, with its notes on each." },
  { id: "hol-care", dir: `${D}/hol-care`, minPlan: "signature", kits: K, requires: ["care", "turnover"], needs: ["hol-turnover"], page: "care", js: false,
    summary: "Cleaning and linen: the changeover in full, the linen and what's restocked, and what the owner receives after each visit." },
  { id: "hol-styling", dir: `${D}/hol-styling`, minPlan: "signature", kits: K, requires: ["styling"], page: "styling", js: false,
    summary: "Interior styling: what the company does to ready a home for guests, and what it costs, VAT included." },
  { id: "hol-onboarding", dir: `${D}/hol-onboarding`, minPlan: "signature", kits: K, requires: ["onboarding", "start"], needs: ["hol-start"], page: "onboarding", js: false,
    summary: "Onboarding: the start steps in full, then the papers a holiday let needs before the first guest, each with its official link." },
  { id: "hol-guide", dir: `${D}/hol-guide`, minPlan: "signature", kits: K, requires: ["guides", "homes"], needs: ["hol-homes"], page: "guide", unlisted: true, collection: true, js: true,
    summary: "HOL-9, guest guidebook by code: a private page for each home (arrival, Wi-Fi network, heating, bins, walks, the nearest shop and pharmacy) opened with the code in the booking message. Not security: door codes and passwords never go in it." },
  { id: "hol-stories", dir: `${D}/hol-stories`, minPlan: "signature", kits: K, requires: ["stories"], page: "stories", js: false,
    summary: "Owner stories: real reviews from the company's owners, copied with their name, date and where they were left. Client only: a demo never invents them." },
  { id: "hol-journal", dir: `${D}/hol-journal`, minPlan: "signature", kits: K, requires: ["journal"], page: "journal", morePages: ["article"], collection: true, js: false,
    summary: "The journal: articles for owners (preparing a home for guests, the rules), each dated, with the day its rules were checked and its sources." },
];

/**
 * Shared features this trade doesn't offer. Owners don't visit an office and guests book through the company's links,
 * so there is no Plan your visit page (the office's hours and address sit on the fees page, from "visit"). Reviews
 * belong on Owner stories (real ones, client only). Galleries need a client's own matched photographs.
 */
export const refuses = ["plan-visit", "questions", "gallery", "work", "reviews", "team", "vouchers", "seasonal", "photo-band", "page-links", "custom-pages"];

/** Owner stories need the company's real owners' words; no demo may turn them on. */
export const clientOnly = ["hol-stories"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkHol;

/** What the browser scripts read from the page, only for the features that are on. @param {any} site */
export function pageData(site) {
  const on = (/** @type {string} */ id) => site.features.includes(id);
  /** @type {Record<string, any>} */ const out = {};
  if (on("hol-estimate")) out.estimate = { year: site.estimate.year, percent: site.fees.percent, sizes: site.estimate.sizes, london: !!site.estimate.london };
  if (on("hol-review")) out.review = { opening: site.review.message };
  if (on("hol-calendar")) out.calendar = { source: site.homes.calendar.source, csvUrl: site.homes.calendar.csvUrl, staleAfterHours: site.homes.calendar.staleAfterHours ?? 36, homes: site.homes.items.map((/** @type {any} */ h) => h.id) };
  if (on("hol-guide")) out.guides = Object.fromEntries(site.guides.items.map((/** @type {any} */ g) => [g.home, codeHash(g.code)]));
  return out;
}

/**
 * Live data: the company's sheet of booked stays. Simulated on a demo (src/demo), its published Google Sheet otherwise.
 * @type {import("../../features/registry.js").Provider[]}
 */
export const providers = [
  {
    key: "stays",
    on: (site, enabled) => enabled.has("hol-calendar"),
    simulated: (site) => site.homes?.calendar?.source === "simulated",
    demo: { from: "src/demo/hol-calendar-provider.js", name: "simulatedStays" },
    live: { from: "src/kits/hol/features/hol-calendar/sheet-provider.js", name: "sheetStays" },
  },
];

/** What this kit adds to the security policy: the Google Sheets hosts, when booked stays come from a sheet. @param {any} site */
export function csp(site) {
  return { sheets: !!site.features?.includes("hol-calendar") && site.homes?.calendar?.source === "sheet" };
}
