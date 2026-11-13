// @ts-check
/**
 * The cakes kit (celebration cake designers who work to commission): everything the shared build needs to know about
 * it, in one file. src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so adding or
 * changing this kit never edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 * Not the bakery kit: that one sells the day's stock from a counter; this one sells cakes made to order.
 */
import { checkCakes } from "./config.js";

const D = "src/kits/cakes/features";
const K = ["cakes"];

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // Starter
  { id: "commissions", section: "pieces", dir: `${D}/commissions`, minPlan: "starter", kits: K, requires: ["pieces"], js: false,
    summary: "The studio's cakes, numbered like a collection: each one large, with its tiers, how many it serves and its \"from\" price, in the studio's words." },
  { id: "lead-time", section: "leadTime", dir: `${D}/lead-time`, minPlan: "starter", kits: K, requires: ["leadTime"], js: false,
    summary: "How far ahead to book: weddings, parties, the tasting box, as the studio sets them." },
  { id: "cake-date-check", section: "dateCheck", dir: `${D}/cake-date-check`, minPlan: "starter", kits: K, requires: ["dates"], js: true,
    summary: "Is our date free? Pick a date and see free, one place left or taken, from the studio's own diary in a Google Sheet. A stale or unreadable sheet, or a date inside the studio's notice, says \"ask us\", never \"free\"." },
  { id: "allergens", section: "allergens", dir: `${D}/allergens`, minPlan: "starter", kits: K, requires: ["allergens", "flavours"], js: false,
    summary: "Allergens before anyone orders: each flavour's allergens from the studio's own chart, what its kitchen handles, its own answer on severe allergies, and the FSA guidance it follows." },
  // Plus
  { id: "servings", section: "servings", dir: `${D}/servings`, minPlan: "plus", kits: K, requires: ["servings"], js: true,
    summary: "How many are you feeding? Type the guests and the answer builds the cake in type, a line per tier sized to its width: tiers, portions (with coffee or as the dessert) and the \"from\" price, from the studio's own portion chart." },
  { id: "flavours", section: "flavours", dir: `${D}/flavours`, minPlan: "plus", kits: K, requires: ["flavours"], js: true,
    summary: "Choose by the slice: a photograph of the studio's cut flavours stacked up; tap a flavour and its layer is outlined, with what's in it and when it's in season." },
  { id: "tasting-box", section: "tasting", dir: `${D}/tasting-box`, minPlan: "plus", kits: K, requires: ["tasting"], js: false,
    summary: "The tasting box: what's in it, when it's posted, what it costs, paid with the studio's own Stripe Payment Link." },
  { id: "cake-care", section: "care", dir: `${D}/cake-care`, minPlan: "plus", kits: K, requires: ["care"], js: false,
    summary: "Looking after the cake: carrying, storing, cutting and keeping the top tier, in the studio's words." },
  { id: "brief-builder", dir: `${D}/brief-builder`, minPlan: "plus", kits: K, requires: ["brief", "servings", "flavours", "cakePages"], needs: ["servings", "flavours"], page: "order", js: true,
    summary: "Order a cake: date, guests, a flavour for each tier, the finish and the venue, sent to the studio as one tidy WhatsApp brief it can quote from." },
  { id: "flavours-page", dir: `${D}/flavours-page`, minPlan: "plus", kits: K, requires: ["cakePages", "flavours"], needs: ["flavours"], page: "flavours", js: false,
    summary: "The flavours page: every flavour with what's in it, when it's in season and its allergens." },
  { id: "allergens-page", dir: `${D}/allergens-page`, minPlan: "plus", kits: K, requires: ["cakePages"], needs: ["allergens"], page: "allergens", js: false,
    summary: "A page for allergens, so a couple or their venue can be sent one link." },
  // Signature
  { id: "seasonal-flavours", section: "seasonal", dir: `${D}/seasonal-flavours`, minPlan: "signature", kits: K, requires: ["flavours"], needs: ["flavours"], js: true,
    summary: "The flavour calendar: choose your month and see which of the studio's flavours are in season then." },
  { id: "consultation", section: "consultation", dir: `${D}/consultation`, minPlan: "signature", kits: K, requires: ["consultation"], js: true,
    summary: "Book a design consultation: at the studio or on a video call, which days suit and the date of the event, sent on WhatsApp for the studio to offer a time." },
  { id: "venue-check", section: "delivery", dir: `${D}/venue-check`, minPlan: "signature", kits: K, requires: ["delivery"], js: true,
    summary: "Will you bring it to us? A venue's postcode gives the studio's own answer: the area, the starting charge and when it arrives to set up. Anywhere it hasn't listed asks for the venue instead of guessing." },
  { id: "how-it-works", section: "process", dir: `${D}/how-it-works`, minPlan: "signature", kits: K, requires: ["process"], js: false,
    summary: "How a commission works, step by step, from the date held to the cake set up, with the studio's own deposit and balance terms." },
  { id: "servings-page", dir: `${D}/servings-page`, minPlan: "signature", kits: K, requires: ["cakePages", "servings"], needs: ["servings"], page: "servings", js: false,
    summary: "The servings guide: the calculator and the studio's own portion chart for every tier." },
  { id: "tasting-page", dir: `${D}/tasting-page`, minPlan: "signature", kits: K, requires: ["cakePages"], needs: ["tasting-box"], page: "tasting", js: false,
    summary: "A page for the tasting box." },
  { id: "delivery-page", dir: `${D}/delivery-page`, minPlan: "signature", kits: K, requires: ["cakePages", "delivery"], needs: ["venue-check"], page: "delivery", js: false,
    summary: "Delivery and set-up: the venue check, what happens on the day, stands, marquees and who's responsible once it's set up." },
  { id: "cake-care-page", dir: `${D}/cake-care-page`, minPlan: "signature", kits: K, requires: ["cakePages"], needs: ["cake-care"], page: "care", js: false,
    summary: "A page for looking after the cake, to send with every order." },
  { id: "how-it-works-page", dir: `${D}/how-it-works-page`, minPlan: "signature", kits: K, requires: ["cakePages"], needs: ["how-it-works"], page: "how-it-works", js: false,
    summary: "How a commission works: the steps, the lead time and the design consultation on one page." },
  { id: "commission-pages", dir: `${D}/commission-pages`, minPlan: "signature", kits: K, requires: ["cakePages", "pieces"], needs: ["commissions"], page: "commissions", morePages: ["commission"], collection: true, js: false,
    summary: "The commissions: all of the studio's cakes on one page, and a page for each with its photograph, tiers, servings, flavours and a \"commission one like it\" message." },
  { id: "weddings-page", dir: `${D}/range-pages`, minPlan: "signature", kits: K, requires: ["ranges"], needs: ["commissions"], page: "weddings", js: false,
    summary: "Wedding cakes: the studio's wedding pieces, its prices by tiers and the questions couples ask." },
  { id: "celebrations-page", dir: `${D}/range-pages`, minPlan: "signature", kits: K, requires: ["ranges"], needs: ["commissions"], page: "celebrations", js: false,
    summary: "Celebration cakes: birthdays, christenings and anniversaries, with their prices and notice." },
  { id: "corporate-page", dir: `${D}/range-pages`, minPlan: "signature", kits: K, requires: ["ranges"], needs: ["commissions"], page: "corporate", js: false,
    summary: "Corporate and brand cakes: launches and anniversaries in a company's colours, invoiced to the company." },
  { id: "dessert-tables-page", dir: `${D}/range-pages`, minPlan: "signature", kits: K, requires: ["ranges"], needs: ["commissions"], page: "dessert-tables", js: false,
    summary: "Dessert tables: what goes on one, how many pieces per guest, alongside or instead of a cake." },
];

/** Shared features this trade never offers: the commissions replace the gallery and the work page. */
export const refuses = ["gallery", "work", "team", "photo-band", "custom-pages", "vouchers"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkCakes;

/** Config the cakes scripts need, only what the enabled features use. @param {any} site */
export function pageData(site) {
  const on = (/** @type {string} */ id) => site.features.includes(id);
  const flavours = (site.flavours?.items ?? []).map((/** @type {any} */ f) => ({ id: f.id, name: f.name, what: f.what, months: f.months ?? null, layer: f.layer ?? null }));
  return {
    cakes: {
      chart: on("servings") ? { tiers: site.servings.tiers, maxTiers: site.servings.maxTiers, prices: site.servings.prices } : null,
      flavours: on("flavours") ? flavours : null,
      dates: on("cake-date-check") ? { source: site.dates.source, csvUrl: site.dates.csvUrl, staleAfterDays: site.dates.staleAfterDays, minDays: site.dates.minDays, words: site.dates.words } : null,
      delivery: on("venue-check") ? { areas: site.delivery.areas, unknown: site.delivery.unknown } : null,
      consultation: on("consultation") ? { message: site.consultation.message, kinds: site.consultation.kinds.map((/** @type {any} */ k) => ({ id: k.id, name: k.name })) } : null,
      brief: on("brief-builder") ? { intro: site.brief.intro, finishes: site.brief.finishes } : null,
    },
  };
}

/**
 * Live data: the studio's diary, simulated on a demo (src/demo), its published Google Sheet otherwise.
 * @type {import("../../features/registry.js").Provider[]}
 */
export const providers = [
  {
    key: "cakeDates",
    on: (site, enabled) => enabled.has("cake-date-check") && !!site.dates,
    simulated: (site) => site.dates.source === "simulated",
    demo: { from: "src/demo/cake-dates-provider.js", name: "simulatedDates" },
    live: { from: "src/kits/cakes/features/cake-date-check/sheet-provider.js", name: "sheetDates" },
  },
];

/**
 * What this kit adds to the site's Content-Security-Policy (src/core/lib/seo.js): `sheets` when the diary is read
 * from a published Google Sheet.
 * @param {any} site @returns {import("../../features/registry.js").KitCsp}
 */
export function csp(site) {
  return { sheets: site.dates?.source === "sheet" && site.features?.includes("cake-date-check") };
}
