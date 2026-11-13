// @ts-check
/**
 * The mehndi kit (bridal and event mehndi artists): everything the shared build needs to know about it, in one file.
 * src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so adding or changing this kit never
 * edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 */
import { checkMehndi } from "./config.js";

const K = "src/kits/mehndi/features";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- mehndi artist (trade/mehndi) ---
  { id: "name-find", dir: `${K}/name-find`, minPlan: "starter", kits: ["mehndi"], requires: ["hero"], js: true,
    summary: "The palm in the hero, lit like a piece in a case: a magnifier follows the finger or the pointer, and \"Show me\" rings the name the artist hid in the design." },
  { id: "mehndi-packages", section: "packages", dir: `${K}/mehndi-packages`, minPlan: "starter", kits: ["mehndi"], requires: ["packages"], js: false,
    summary: "Bridal mehndi by how far it goes (to the wrist, the elbow, the feet), each with its hours and from price in the artist's words, beside the bride's jewellery and hands." },
  { id: "mehndi-dates", section: "dates", dir: `${K}/mehndi-dates`, minPlan: "starter", kits: ["mehndi"], requires: ["dateCheck"], js: true,
    summary: "Is my date free? The wedding date in, free so far, a few hours left or taken out, from the artist's own Google Sheet; \"Ask about this date\" sends it on WhatsApp. Never says booked; an old or unreadable sheet asks the bride to message instead." },
  { id: "darkest-day", dir: `${K}/darkest-day`, minPlan: "plus", kits: ["mehndi"], requires: ["darkest"], needs: ["mehndi-dates"], js: true,
    summary: "Darkest on the day: under the date check, the wedding date names the evening to have the mehndi, from the artist's own number of days." },
  { id: "natural-henna", section: "natural", dir: `${K}/natural-henna`, minPlan: "starter", kits: ["mehndi"], requires: ["natural"], js: false,
    summary: "Natural henna only: what the artist's paste is made of and how the stain develops, with the NHS line on \"black henna\" (PPD), linked, and the day it was checked." },
  { id: "stain-days", section: "stain", dir: `${K}/stain-days`, minPlan: "signature", kits: ["mehndi"], requires: ["stainDays"], needs: ["mehndi-dates", "darkest-day"], clientOnly: true, js: true,
    summary: "Your stain, day by day: one stain photographed on the mehndi evening and each day after, dated from her wedding, with the darkest day named." },
  { id: "guest-quote", section: "guests", dir: `${K}/guest-quote`, minPlan: "signature", kits: ["mehndi"], requires: ["guests"], js: true,
    summary: "The guest mehndi sum: how many guests and which design size, out come the artists and the hours for the night and a from price, from the artist's own minutes and rates, sent on WhatsApp for a quote." },
  { id: "bridal-mehndi", dir: `${K}/bridal-mehndi`, minPlan: "plus", kits: ["mehndi"], requires: ["bridalPage"], page: "bridal", js: false,
    summary: "The bridal page: the bride, turned away by the window; the trial and patch test, what to do before the artist arrives, travel to the venue, and the packages and date check again." },
  { id: "mehndi-designs", dir: `${K}/mehndi-designs`, minPlan: "plus", kits: ["mehndi"], requires: ["designs", "designsPage"], page: "designs", js: true,
    summary: "The design library: the artist's own work close up, found by style (traditional, Arabic, Indo-Arabic, contemporary) and by bridal or guest, each with how far it goes, the hours and a from price; \"Ask for this\" on WhatsApp." },
  { id: "stain-guide", dir: `${K}/stain-guide`, minPlan: "plus", kits: ["mehndi"], requires: ["aftercare", "aftercarePage"], page: "aftercare", js: false,
    summary: "The stain and aftercare page: paste on, paste off, orange, deep brown, on real photographs; the artist's aftercare, one line each; how long it lasts." },
  { id: "mehndi-week", dir: `${K}/mehndi-week`, minPlan: "signature", kits: ["mehndi"], requires: ["planner", "plannerPage"], page: "planner", js: true,
    summary: "The wedding week planner: the wedding date in, every step out on its day (the trial, nails and waxing, the mehndi evening, paste off), from the artist's own days; one calendar file, sent to the family on WhatsApp, and \"hold my mehndi day\" to the artist." },
  { id: "hidden-details", dir: `${K}/hidden-details`, minPlan: "signature", kits: ["mehndi"], requires: ["personal", "personalPage"], needs: ["name-find"], page: "personal", js: true,
    summary: "Personal details in your design: what to hide (names, initials, a date, a place, a symbol) and where, gathered into one WhatsApp message, beside a real finished hand where the name can be found." },
];

/** Shared features a henna artist never offers (an Instagram feed, a team page, vouchers and the rest belong to shops). */
export const refuses = ["gallery", "work", "seasonal", "photo-band", "page-links", "team", "vouchers"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkMehndi;

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** @param {any} site */
export function pageData(site) {
  const on = (/** @type {string[]} */ ...ids) => ids.some((id) => site.features.includes(id));
  return {
    dateCheck: on("mehndi-dates") ? { source: site.dateCheck.source, csvUrl: site.dateCheck.csvUrl, staleAfterDays: site.dateCheck.staleAfterDays ?? 21, message: site.dateCheck.message } : null,
    darkest: on("darkest-day", "stain-days") ? { daysBefore: site.darkest.daysBefore, when: site.darkest.when ?? "" } : null,
    guests: on("guest-quote") ? { message: site.guests.message, perArtistMinutes: site.guests.perArtistMinutes, artists: site.guests.artists, max: site.guests.max } : null,
    designs: on("mehndi-designs") ? { message: site.designs.message } : null,
    planner: on("mehndi-week") ? { message: site.planner.message, steps: site.planner.steps } : null,
    personal: on("hidden-details") ? { message: site.personal.message } : null,
    place: [site.business.name, site.location.streetAddress, site.location.locality, site.location.postcode].filter(Boolean).join(", "),
    url: site.url,
  };
}

/**
 * Live data: simulated on a demo (src/demo), the artist's published Google Sheet otherwise.
 * @type {import("../../features/registry.js").Provider[]}
 */
export const providers = [
  {
    key: "dates",
    on: (site, enabled) => enabled.has("mehndi-dates"),
    simulated: (site) => site.dateCheck?.source === "simulated",
    demo: { from: "src/demo/dates-provider.js", name: "simulatedDates" },
    live: { from: "src/kits/mehndi/features/mehndi-dates/sheet-provider.js", name: "sheetDates" },
  },
];

/** What this kit adds to the site's Content-Security-Policy: the artist's published Google Sheet. @param {any} site */
export function csp(site) {
  return { sheets: site.dateCheck?.source === "sheet" && site.features?.includes("mehndi-dates") };
}
