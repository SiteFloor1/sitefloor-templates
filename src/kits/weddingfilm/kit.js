// @ts-check
/**
 * The weddingfilm kit (wedding videographers and photographers): everything the shared build needs to know about it,
 * in one file. src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so adding or changing
 * this kit never edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 */
import { checkWeddingFilm } from "./config.js";

const DIR = "src/kits/weddingfilm/features";
const K = ["weddingfilm"];

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  { id: "studio-film", dir: `${DIR}/studio-film`, minPlan: "starter", kits: K, requires: ["hero"], js: true,
    summary: "The work first: the studio's own film across the top of the home page at cinema ratio, muted with a pause button. The still shows straight away; the film starts once the page has loaded, never with reduced motion or Save-Data." },
  { id: "wf-packages", section: "packages", dir: `${DIR}/wf-packages`, minPlan: "starter", kits: K, requires: ["packages"], js: false,
    summary: "The packages: hours of coverage, the films and photographs in each, the price and the deposit, in the studio's own words and figures." },
  { id: "date-check", section: "dateCheck", dir: `${DIR}/date-check`, minPlan: "plus", kits: K, requires: ["dateCheck"], js: true,
    summary: "Is our date free? A date in, the answer from the studio's own diary sheet (free, held or booked), then the date and venue sent on WhatsApp. If the sheet can't be read or is out of date, it never says free: it asks the couple to send the date." },
  { id: "delivery-times", section: "delivery", dir: `${DIR}/delivery-times`, minPlan: "starter", kits: K, requires: ["delivery"], js: true,
    summary: "What you receive and when: the trailer, the film and the photographs, each a number of weeks after the wedding the studio sets; with a wedding date, the actual days." },
  { id: "sunset-line", dir: `${DIR}/sunset-line`, minPlan: "plus", kits: K, requires: ["places"], needs: ["date-check"], js: false,
    summary: "Sunset on your date: the date check also says when the sun sets at the place chosen, calculated for that day, and puts it in the message." },
  { id: "wf-builder", section: "builder", dir: `${DIR}/wf-builder`, minPlan: "plus", kits: K, requires: ["builder", "packages"], needs: ["wf-packages"], js: true,
    summary: "Build your package: a package, then extras (an hour more, a second shooter, drone where the venue allows, an album), the total from the studio's own prices, sent on WhatsApp; the deposit by the studio's own Stripe link." },
  { id: "films-page", dir: `${DIR}/films-page`, minPlan: "plus", kits: K, requires: ["films", "filmsPage", "venues"], page: "films", morePages: ["film"], collection: true, js: true,
    summary: "The films: each wedding's film with its venue and season, the still first and the film on tap; find films by venue. Each film has its own page: the film large, the couple's day in a few lines, the venue and the light that evening." },
  { id: "photographs-page", dir: `${DIR}/photographs-page`, minPlan: "plus", kits: K, requires: ["photographs", "photographsPage"], page: "photography", js: false,
    summary: "The photographs: each wedding as a short sequence, large, with its venue." },
  { id: "wf-packages-page", dir: `${DIR}/wf-packages-page`, minPlan: "plus", kits: K, requires: ["packagesPage"], needs: ["wf-packages"], page: "packages", js: false,
    summary: "A page for the packages, the builder and what you receive when, so the home page stays on the work." },
  { id: "faq-page", dir: `${DIR}/faq-page`, minPlan: "plus", kits: K, requires: ["questions", "faqPage"], page: "faq", js: false,
    summary: "Every question couples ask, by topic, on one page, in the studio's words." },
  { id: "showreel", dir: `${DIR}/showreel`, minPlan: "signature", kits: K, requires: ["chapters"], needs: ["studio-film"], js: true,
    summary: "The film in chapters: under the hero film, its chapters as a programme; tap one to go to it, a line fills as each plays; Watch full screen opens the film large, with the chapters." },
  { id: "light-planner", section: "lightPlanner", dir: `${DIR}/light-planner`, minPlan: "signature", kits: K, requires: ["lightPlanner", "places"], js: true,
    summary: "The wedding-day light: a date and a place in one sentence give the real sunset, golden hour and blue hour, calculated for that day; the day drawn to scale, the portrait window the studio keeps, into the calendar or sent on WhatsApp." },
  { id: "film-progress", dir: `${DIR}/film-progress`, minPlan: "signature", kits: K, requires: ["progress"], page: "your-film", unlisted: true, js: true,
    summary: "Your film's progress: the couple type the code the studio gave them and see where their film is (footage in, edit, colour, sound, delivered), the trailer's date and their links, from the studio's sheet (codes only, no names). Fails closed." },
  { id: "day-planner", dir: `${DIR}/day-planner`, minPlan: "signature", kits: K, requires: ["dayPlanner", "places", "lightPlanner"], page: "the-day", js: true,
    summary: "The day, explained and planned: enter the date, the place and the ceremony time, and the day's filming timeline is built from the studio's own block lengths, with the portraits placed in the golden hour calculated for that evening; into the calendar or sent on WhatsApp. Then the day in the studio's words." },
  { id: "venues-page", dir: `${DIR}/venues-page`, minPlan: "signature", kits: K, requires: ["venues", "films"], page: "venues", js: false,
    summary: "Venues we've filmed: each venue with its photograph, the golden hour there in June and September (calculated), its drone rule in the venue's words, the UK drone rules (sourced) and the films made there." },
  { id: "music-page", dir: `${DIR}/music-page`, minPlan: "signature", kits: K, requires: ["musicPage"], page: "music", js: false,
    summary: "Music and licensing, explained: why the studio uses licensed music, what churches ask for, and what couples can choose, each fact with its source and the date it was checked." },
];

/** Shared features this trade never offers: no gift vouchers, seasonal banners, parallax bands, stock cards or a second gallery page. */
export const refuses = ["vouchers", "seasonal", "photo-band", "page-links", "work"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkWeddingFilm;

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** @param {any} site */
export function pageData(site) {
  const on = (/** @type {string[]} */ ...ids) => ids.some((id) => site.features.includes(id));
  const places = on("sunset-line", "light-planner", "day-planner") ? site.places.items.map((/** @type {any} */ p) => ({ id: p.id, name: p.name, lat: p.lat, lon: p.lon, tz: p.tz ?? "Europe/London" })) : null;
  return {
    weddingfilm: {
      dates: on("date-check") ? { message: site.dateCheck.message, source: site.dateCheck.source, csvUrl: site.dateCheck.csvUrl ?? "", staleAfterHours: site.dateCheck.staleAfterHours ?? 48 } : null,
      places,
      sunset: on("sunset-line"),
      delivery: on("delivery-times") ? site.delivery.steps : null,
      builder: on("wf-builder") ? {
        message: site.builder.message,
        packages: site.packages.items.map((/** @type {any} */ p) => ({ id: p.id, name: p.name, price: p.price })),
        extras: site.builder.extras.map((/** @type {any} */ x) => ({ id: x.id, name: x.name, price: x.price, per: x.per ?? "", max: x.max ?? 1 })),
      } : null,
      chapters: on("showreel") ? site.chapters.items.map((/** @type {any} */ c) => ({ title: c.title, at: c.at })) : null,
      reelLength: on("showreel") ? site.chapters.length : 0,
      planner: on("light-planner") ? { message: site.lightPlanner.message, portrait: site.lightPlanner.portrait ?? null, place: site.lightPlanner.place } : null,
      progress: on("film-progress") ? { source: site.progress.source, csvUrl: site.progress.csvUrl ?? "", staleAfterHours: site.progress.staleAfterHours ?? 72 } : null,
      day: on("day-planner") ? { message: site.dayPlanner.message, blocks: site.dayPlanner.blocks, ceremony: site.dayPlanner.ceremony, portrait: site.lightPlanner.portrait ?? { start: 5, length: 40 }, date: site.lightPlanner.date, place: site.lightPlanner.place } : null,
    },
  };
}

/**
 * Live data: simulated on a demo (src/demo), the studio's published Google Sheet otherwise.
 * @type {import("../../features/registry.js").Provider[]}
 */
export const providers = [
  {
    key: "weddingDates",
    on: (site, enabled) => enabled.has("date-check") && !!site.dateCheck,
    simulated: (site) => site.dateCheck.source === "simulated",
    demo: { from: "src/demo/wedding-dates-provider.js", name: "simulatedWeddingDates" },
    live: { from: "src/kits/weddingfilm/features/date-check/sheet-provider.js", name: "sheetWeddingDates" },
  },
  {
    key: "progress",
    on: (site, enabled) => enabled.has("film-progress") && !!site.progress,
    simulated: (site) => site.progress.source === "simulated",
    demo: { from: "src/demo/film-progress-provider.js", name: "simulatedProgress" },
    live: { from: "src/kits/weddingfilm/features/film-progress/sheet-provider.js", name: "sheetProgress" },
  },
];

/** The diary and the couples' sheet are each the studio's own published Google Sheet. @param {any} site @returns {import("../../features/registry.js").KitCsp} */
export function csp(site) {
  return { sheets: (site.dateCheck?.source === "sheet" && site.features?.includes("date-check")) || (site.progress?.source === "sheet" && site.features?.includes("film-progress")) };
}
