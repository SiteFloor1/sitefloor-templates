// @ts-check
/**
 * The nursery kit (day nurseries and pre-schools): everything the shared build needs to know about it, in one file.
 * src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so adding or changing this kit never
 * edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 */
import { checkNursery } from "./config.js";
import { closedDays } from "./lib/nursery.js";

const K = "src/kits/nursery/features";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  { id: "nursery-wall", dir: `${K}/nursery-wall`, minPlan: "starter", kits: ["nursery"], requires: ["hero"], js: true,
    summary: "The work on the walls: the first screen shows the children's work large, one piece at a time, each with a gallery caption (what it is, the room, the area of learning)." },
  { id: "nursery-today", dir: `${K}/nursery-today`, minPlan: "starter", kits: ["nursery"], requires: ["today"], js: true,
    summary: "Today at nursery: one line from the nursery's Google Sheet (a snow closure, an open morning), shown only on the day it is for." },
  { id: "nursery-places", section: "places", dir: `${K}/nursery-places`, minPlan: "starter", kits: ["nursery"], requires: ["rooms", "places"], js: true,
    summary: "Places, room by room: tap the child's age to see the room and the next month with a place, and six months of places for every room, from the nursery's own Google Sheet. An old or unreadable sheet shows no numbers, only \"Ask about a place\"." },
  { id: "nursery-fees", section: "fees", dir: `${K}/nursery-fees`, minPlan: "starter", kits: ["nursery"], requires: ["fees", "funding"], js: false,
    summary: "Fees: the nursery's rates, each including everything compulsory, the optional extras named as optional, and the funded hours linked to gov.uk with the date the wording was checked." },
  { id: "nursery-rooms", dir: `${K}/nursery-rooms`, minPlan: "plus", kits: ["nursery"], requires: ["rooms", "roomsPage"], page: "rooms", js: false,
    summary: "Rooms by age: each room, its ages, what it's like and its ratio in the nursery's own words." },
  { id: "nursery-funding", dir: `${K}/nursery-funding`, minPlan: "plus", kits: ["nursery"], requires: ["fees", "funding", "feesPage"], needs: ["nursery-fees"], page: "fees", js: true,
    summary: "Fees and funding page: every rate and extra, the nursery's words on funded hours, and when funding can start: the child's date of birth in, the term from gov.uk's \"term after\" rule out." },
  { id: "nursery-visit", section: "visitRequest", dir: `${K}/nursery-visit`, minPlan: "plus", kits: ["nursery"], requires: ["visit", "visitPage"], page: "look-round", js: true,
    summary: "Book a visit: the next visit times from the nursery's weekly pattern, closed days skipped; pick one and the child's age, and the request goes to WhatsApp." },
  { id: "nursery-day", dir: `${K}/nursery-day`, minPlan: "plus", kits: ["nursery"], requires: ["day", "dayPage"], page: "day", js: true,
    summary: "A day with us: the day in photographs at the nursery's own times, with the moment under way marked on weekdays." },
  { id: "nursery-menu", dir: `${K}/nursery-menu`, minPlan: "plus", kits: ["nursery"], requires: ["menu", "foodPage"], page: "food", js: false,
    summary: "Food and menus: the week's breakfasts, lunches and teas, and the nursery's own allergy statement." },
  { id: "nursery-ofsted", dir: `${K}/nursery-ofsted`, minPlan: "plus", kits: ["nursery"], requires: ["ofsted", "ofstedPage"], page: "ofsted", js: false,
    summary: "Ofsted and policies: the outcome in the report's own words with the inspection date, linked to the report on Ofsted's site, and the nursery's policies." },
  { id: "nursery-ready", dir: `${K}/nursery-ready`, minPlan: "plus", kits: ["nursery"], requires: ["ready", "readyPage"], page: "getting-ready", js: true,
    summary: "Getting ready: what to pack, room by room, and the questions worth asking on a visit, on one page that prints cleanly." },
  { id: "nursery-week", section: "week", dir: `${K}/nursery-week`, minPlan: "signature", kits: ["nursery"], requires: ["fees", "funding", "week"], needs: ["nursery-fees"], js: true,
    summary: "What a week costs: age, days and funded hours in, the monthly fee out with every line shown, funded hours taken off as gov.uk sets them, extras optional; a quote to check on WhatsApp." },
  { id: "nursery-terms", dir: `${K}/nursery-terms`, minPlan: "signature", kits: ["nursery"], requires: ["terms", "termsPage"], page: "term-dates", js: true,
    summary: "Term dates and closures: what's ahead, past dates hidden by themselves, and every date in one calendar file." },
  { id: "nursery-settling", dir: `${K}/nursery-settling`, minPlan: "signature", kits: ["nursery"], requires: ["settling", "settlingPage"], optional: ["terms"], page: "settling-in", js: true,
    summary: "Settling in: pick a start date and the nursery's own settling-in sessions fall on the next open weekdays, closures skipped, into the calendar or sent to the nursery." },
  { id: "nursery-work", dir: `${K}/nursery-work`, minPlan: "signature", kits: ["nursery"], requires: ["work", "workPage"], page: "the-work", js: false,
    summary: "The work: the children's work hung as an exhibition, each piece with its caption. Never a face or a name: the nursery's own photographs, cropped." },
];

/** Shared features a nursery never offers on this kit. */
export const refuses = ["gallery", "work", "seasonal", "photo-band", "page-links", "team", "vouchers", "reviews"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkNursery;

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** @param {any} site */
export function pageData(site) {
  const on = (/** @type {string[]} */ ...ids) => ids.some((id) => site.features.includes(id));
  const closed = site.terms ? closedDays(site.terms.items) : [];
  return { nursery: {
    name: site.business.name,
    place: [site.business.name, site.location.streetAddress, site.location.locality, site.location.postcode].filter(Boolean).join(", "),
    today: on("nursery-today") ? { source: site.today.source, csvUrl: site.today.csvUrl } : null,
    places: on("nursery-places") ? {
      source: site.places.source, csvUrl: site.places.csvUrl, staleAfterDays: site.places.staleAfterDays ?? 14, months: site.places.months ?? 6,
      message: site.rooms.message, rooms: site.rooms.items.map((/** @type {any} */ r) => ({ id: r.id, name: r.name, ages: r.ages })),
    } : null,
    week: on("nursery-week") ? {
      rate: site.fees.rate, weeksOpen: site.fees.weeksOpen, sessions: site.fees.sessions, stretched: site.funding.stretched,
      extras: site.fees.extras ?? [], message: site.week.message,
    } : null,
    visit: on("nursery-visit") ? { times: site.visit.times, message: site.visit.message, closed } : null,
    day: on("nursery-day") ? { closes: site.day.closes, times: site.day.moments.map((/** @type {any} */ m) => m.time) } : null,
    terms: on("nursery-terms") ? { items: site.terms.items } : null,
    settling: on("nursery-settling") ? { steps: site.settling.steps, message: site.settling.message, closed } : null,
  } };
}

/**
 * Live data: simulated on a demo (src/demo), the nursery's published Google Sheet otherwise.
 * @type {import("../../features/registry.js").Provider[]}
 */
export const providers = [
  {
    key: "nurseryPlaces",
    on: (site, enabled) => enabled.has("nursery-places"),
    simulated: (site) => site.places?.source === "simulated",
    demo: { from: "src/demo/nursery-places-provider.js", name: "simulatedNurseryPlaces" },
    live: { from: "src/kits/nursery/features/nursery-places/sheet-provider.js", name: "sheetNurseryPlaces" },
  },
  {
    key: "nurseryToday",
    on: (site, enabled) => enabled.has("nursery-today"),
    simulated: (site) => site.today?.source === "simulated",
    demo: { from: "src/demo/nursery-today-provider.js", name: "simulatedNurseryToday" },
    live: { from: "src/kits/nursery/features/nursery-today/sheet-provider.js", name: "sheetNurseryToday" },
  },
];

/** What this kit adds to the site's Content-Security-Policy: the nursery's published Google Sheets. @param {any} site */
export function csp(site) {
  const on = (/** @type {string} */ id) => site.features?.includes(id);
  return { sheets: (on("nursery-places") && site.places?.source === "sheet") || (on("nursery-today") && site.today?.source === "sheet") };
}
