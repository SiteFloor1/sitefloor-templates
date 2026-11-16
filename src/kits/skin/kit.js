// @ts-check
/**
 * The skin kit (facialists, skin clinics and hotel-style beauty salons): everything the shared build needs to know
 * about it, in one file. src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so adding
 * or changing this kit never edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers
 * itself". The UK rules every page keeps: src/kits/skin/lib/rules.js. Feature codes (BEAU-n): docs/VISION.md.
 */
import { checkSkin } from "./config.js";
import { allItems } from "./lib/skin.js";

const K = "src/kits/skin/features";
/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- facialists and skin clinics (trade/beauty) ---
  { id: "skin-menu", section: "menu", dir: `${K}/skin-menu`, minPlan: "starter", kits: ["skin"], requires: ["menu"], js: true,
    summary: "Treatments by concern and by time (BEAU-1): the clinic's menu, each treatment with its minutes, price and line; one tap lists them by how long they take." },
  { id: "skin-first-visit", section: "firstVisit", dir: `${K}/skin-first-visit`, minPlan: "starter", kits: ["skin"], requires: ["firstVisit"], js: true,
    summary: "First visit and patch tests (BEAU-2): the clinic's own patch-test rule, and the day to come in for one worked out from the appointment, to the calendar." },
  { id: "skin-finder", dir: `${K}/skin-finder`, minPlan: "plus", kits: ["skin"], requires: ["finder", "menu"], js: true,
    summary: "Which facial is right for me (BEAU-3): five words for how skin feels today; a printed treatment card answers in the clinic's own words (the facial, minutes, price, afterwards, patch test, this evening), then Book this facial on WhatsApp." },
  { id: "skin-concerns-page", dir: `${K}/skin-concerns-page`, minPlan: "plus", kits: ["skin"], requires: ["finder", "menu"], needs: ["skin-finder"], page: "concerns", js: false,
    summary: "Treatments by concern: the finder's card, then every word with the clinic's treatment for it." },
  { id: "skin-category-pages", dir: `${K}/skin-category-pages`, minPlan: "plus", kits: ["skin"], requires: ["menu"], needs: ["skin-menu"], page: "category", collection: true, js: false,
    summary: "A page for each part of the menu (facials, brows and lashes, body and massage, waxing, men's): every treatment with its minutes, price, afterwards and patch test, in the clinic's words (a collection, counted as one page)." },
  { id: "skin-first-visit-page", dir: `${K}/skin-first-visit-page`, minPlan: "plus", kits: ["skin"], requires: ["firstVisit"], needs: ["skin-first-visit"], page: "first-visit", js: false,
    summary: "The first visit and patch tests page: the clinic's own paragraphs, the patch-test day worked out, and the sources of the rules, dated." },
  { id: "skin-courses", dir: `${K}/skin-courses`, minPlan: "plus", kits: ["skin"], requires: ["courses", "menu"], page: "courses", js: false,
    summary: "Courses and memberships (BEAU-4): each course with how many, how far apart and its price; each membership with what a month includes." },
  { id: "skin-rooms", dir: `${K}/skin-rooms`, minPlan: "plus", kits: ["skin"], requires: ["rooms"], page: "rooms", js: false,
    summary: "The rooms (BEAU-5): a photograph of each room with one line on what it is for." },
  { id: "skin-ritual", dir: `${K}/skin-ritual`, minPlan: "signature", kits: ["skin"], requires: ["rituals", "menu"], page: "rituals", js: true,
    summary: "The ritual builder (BEAU-6): choose a facial and add the clinic's rituals (a longer massage, LED, a scalp ritual); the time and price add up as you go, then the whole ritual goes to the clinic on WhatsApp." },
  { id: "skin-spaday", dir: `${K}/skin-spaday`, minPlan: "signature", kits: ["skin"], requires: ["spaDays"], page: "gifts", js: true,
    summary: "A spa day as a gift (BEAU-7 and BEAU-9): choose the clinic's day, write who it's for and from; the gift card is drawn as you type, then bought through the clinic's own Stripe link or on WhatsApp." },
  { id: "skin-rhythm", section: "rhythm", dir: `${K}/skin-rhythm`, minPlan: "signature", kits: ["skin"], requires: ["rhythm", "menu"], needs: ["skin-courses"], js: true,
    summary: "Treatment rhythm reminders (BEAU-8): choose the treatment and the day of the visit; the clinic's own reminders after it and the next visits at its spacing, as one calendar file. On the courses page." },
  { id: "skin-bridal", dir: `${K}/skin-bridal`, minPlan: "signature", kits: ["skin"], requires: ["bridal"], page: "bridal", js: true,
    summary: "The bridal beauty timeline: one date in, each of the clinic's steps dated back from the day (trial, facials, brows, the morning), to the calendar or to the clinic." },
  { id: "skin-journal", dir: `${K}/skin-journal`, minPlan: "signature", kits: ["skin"], requires: ["journal"], page: "journal", morePages: ["article"], js: false,
    summary: "The journal: the clinic's own pieces (skin through the seasons, what a facial really does), each dated and signed." },
];

// Shared features this trade never offers: the spa day gift replaces vouchers; the room tour replaces a gallery.
export const refuses = ["gallery", "work", "photo-band", "vouchers"];
// Reviews only ever come from the clinic's own Google reviews, so no demo shows them.
export const clientOnly = ["reviews"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkSkin;

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** @param {any} site */
export function pageData(site) {
  const on = (/** @type {string} */ id) => site.features.includes(id);
  const items = site.menu ? allItems(site.menu) : [];
  const card = (/** @type {any} */ x) => ({ id: x.id, name: x.name, minutes: x.minutes, price: x.price, from: x.from === true, afterwards: x.afterwards ?? "", patch: x.patch ?? "", evening: x.evening ?? "" });
  return {
    patch: on("skin-first-visit") ? { hoursBefore: site.firstVisit.patch.hoursBefore } : null,
    rituals: on("skin-ritual") ? { bases: site.rituals.bases.map((/** @type {string} */ id) => card(items.find((x) => x.id === id))), addOns: site.rituals.addOns, message: site.rituals.message } : null,
    spaDays: on("skin-spaday") ? { days: site.spaDays.days.map((/** @type {any} */ d) => ({ id: d.id, name: d.name, minutes: d.minutes, price: d.price, payLink: d.payLink ?? "" })), message: site.spaDays.message } : null,
    rhythm: on("skin-rhythm") ? { items: items.filter((x) => x.rhythm).map((x) => ({ id: x.id, name: x.name, rhythm: x.rhythm })), message: site.rhythm.message } : null,
    bridal: on("skin-bridal") ? { steps: site.bridal.steps, message: site.bridal.message } : null,
    name: site.business.name,
    place: [site.business.name, site.location.streetAddress, site.location.locality, site.location.postcode].filter(Boolean).join(", "),
  };
}
