// @ts-check
/**
 * The cleaning kit (domestic and commercial cleaning companies): everything the shared build needs to know about it, in
 * one file. src/features/registry.js finds this file by itself, so adding or changing this kit never edits a shared
 * file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 * Every minute and price a page shows comes from one function, src/kits/cleaning/lib/visit.js.
 */
import { checkCleaning } from "./config.js";

const K = "src/kits/cleaning/features";
/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- domestic and commercial cleaning (trade/cleaning) ---
  { id: "cleaning-services", section: "services", dir: `${K}/cleaning-services`, minPlan: "starter", kits: ["cleaning"], requires: ["cleans"], js: false,
    summary: "What the company cleans: regular cleans, deep cleans, end of tenancy, offices, each in one line with its hourly rate or \"from\" price, in the company's words." },
  { id: "cleaning-areas", section: "areas", dir: `${K}/cleaning-areas`, minPlan: "starter", kits: ["cleaning"], requires: ["areas"], js: true,
    summary: "Do you clean in my postcode: the company's own postcode districts; type a postcode and get yes, or not yet." },
  { id: "cleaning-keys", section: "keys", dir: `${K}/cleaning-keys`, minPlan: "starter", kits: ["cleaning"], requires: ["keys"], js: false,
    summary: "Do I need to be in: how the company holds keys (numbers, never addresses), each step of a key's day, or no key at all, in its own words." },
  { id: "cleaning-strip", dir: `${K}/cleaning-strip`, minPlan: "plus", kits: ["cleaning"], requires: ["visit"], js: true,
    summary: "The visit, room by room: each room as wide as its minutes, a hairline per minute, on a ruler; bedrooms, bathrooms and how often resize and reprice it, from the company's own minutes and rates; tap a room for what's done there." },
  { id: "cleaning-bill", section: "bill", dir: `${K}/cleaning-bill`, minPlan: "plus", kits: ["cleaning"], requires: ["visit"], needs: ["cleaning-strip"], js: true,
    summary: "The bill, worked out in front of you: every room and extra in minutes, time on site, the hourly rate, one price rounded once, sent on WhatsApp." },
  { id: "cleaning-free-days", dir: `${K}/cleaning-free-days`, minPlan: "plus", kits: ["cleaning"], requires: ["areas"], needs: ["cleaning-areas"], js: false,
    summary: "The next free days in a postcode district, under the postcode check, from the company's Google Sheet; an old or missing sheet says \"ask us\", never a date." },
  { id: "cleaning-included", dir: `${K}/cleaning-included`, minPlan: "plus", kits: ["cleaning"], requires: ["visit"], page: "included", js: false,
    summary: "What every clean includes: room by room, the tasks and minutes on a regular visit and on a deep clean, and what isn't included, from the same checklist as the price." },
  { id: "cleaning-tenancy", dir: `${K}/cleaning-tenancy`, minPlan: "plus", kits: ["cleaning"], requires: ["tenancy"], page: "end-of-tenancy", js: true,
    summary: "End of tenancy: the room-by-room checklist to tick as you go, what to do before the cleaners arrive, the company's own re-clean terms word for word, and the deposit rules linked to gov.uk. Never a promised deposit." },
  { id: "cleaning-policies", dir: `${K}/cleaning-policies`, minPlan: "plus", kits: ["cleaning"], requires: ["policies"], page: "policies", js: false,
    summary: "Policies: cancelling and moving a visit, holidays, breakages, putting things right, paying, in the company's words." },
  { id: "cleaning-moveout", dir: `${K}/cleaning-moveout`, minPlan: "signature", kits: ["cleaning"], requires: ["tenancy"], needs: ["cleaning-tenancy"], js: true,
    summary: "The move-out planner: a check-out date gives the day of the clean and the day to book by, from the company's own lead times, to the calendar or sent on WhatsApp." },
  { id: "cleaning-schedule", dir: `${K}/cleaning-schedule`, minPlan: "signature", kits: ["cleaning"], requires: ["visit"], needs: ["cleaning-bill"], js: true,
    summary: "Your cleaning day in the calendar: a weekday and a start time give a repeating calendar entry (weekly or fortnightly) with the visit's length." },
  { id: "cleaning-3d", dir: `${K}/cleaning-3d`, minPlan: "signature", kits: ["cleaning"], requires: ["visit"], needs: ["cleaning-strip"], js: true,
    summary: "Room by room in 3D: a small link loads an illustration of a two-bedroom flat (about 130 KB, only on tap); tap a room for its tasks and minutes, from the same checklist." },
  { id: "cleaning-offices", dir: `${K}/cleaning-offices`, minPlan: "signature", kits: ["cleaning"], requires: ["offices"], page: "offices", js: true,
    summary: "Offices, out of hours: drag your opening hours and see when the team is in; zones and their minutes for your floor; a site-survey request on WhatsApp. No price until the survey." },
  { id: "cleaning-service-pages", dir: `${K}/cleaning-service-pages`, minPlan: "signature", kits: ["cleaning"], requires: ["cleans"], needs: ["cleaning-services"], page: "service", collection: true, js: false,
    summary: "A page for each service (deep cleans, after builders, short-let turnovers…): what it covers, how long, the rate, in the company's words (a collection, counted as one page)." },
  { id: "cleaning-cleaners", dir: `${K}/cleaning-cleaners`, minPlan: "signature", kits: ["cleaning"], requires: ["cleaners"], page: "cleaners", js: false,
    summary: "Our cleaners: how the company hires, vets, insures and trains, only as it states, with the same cleaner each visit and how cover works." },
  { id: "cleaning-journal", dir: `${K}/cleaning-journal`, minPlan: "signature", kits: ["cleaning"], requires: ["journal"], page: "journal", morePages: ["article"], js: false,
    summary: "The journal: the company's own pieces (getting a deposit back, keeping a home clean between visits), each dated." },
];

/** Shared features this trade never offers: photo galleries of other people's homes, staff faces, free-form pages and vouchers. */
export const refuses = ["gallery", "work", "photo-band", "team", "custom-pages", "vouchers"];

/** Needs the company's own material: real reviews copied from Google with name and date. */
export const clientOnly = ["reviews"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkCleaning;

/** The 3D chunk (three.js and the procedural flat), gzipped, as the link prints it. tests/unit/cleaning.test.js keeps it honest. */
export const MODEL_3D_KB = 125;
/** @param {any} _site */
export function buildData(_site) { return { cleaning3dKb: MODEL_3D_KB }; }

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** @param {any} site */
export function pageData(site) {
  const on = (/** @type {string} */ id) => site.features.includes(id);
  const v = site.visit;
  return {
    cleaning: {
      visit: on("cleaning-strip") ? { rates: v.rates, minimum: v.minimum, deep: v.deep, rooms: v.rooms, extras: v.extras, defaults: v.defaults } : null,
      areas: on("cleaning-areas") ? { districts: site.areas.districts } : null,
      days: on("cleaning-free-days") && site.areas.days ? site.areas.days : null,
      tenancy: on("cleaning-moveout") ? { cleanDaysBefore: site.tenancy.cleanDaysBefore, bookDaysBefore: site.tenancy.bookDaysBefore, message: site.tenancy.message } : null,
      offices: on("cleaning-offices") ? { zones: site.offices.zones, gap: site.offices.gap, hours: site.offices.hours, message: site.offices.message } : null,
      schedule: on("cleaning-schedule") ? { start: v.startTime ?? "09:00" } : null,
    },
    name: site.business.name,
    place: [site.location.streetAddress, site.location.locality, site.location.postcode].filter(Boolean).join(", "),
  };
}

/**
 * Live data: the company's free days, simulated on a demo (src/demo), its published Google Sheet otherwise.
 * @type {import("../../features/registry.js").Provider[]}
 */
export const providers = [
  {
    key: "cleaningDays",
    on: (site, enabled) => enabled.has("cleaning-free-days") && !!site.areas?.days,
    simulated: (site) => site.areas.days.source === "simulated",
    demo: { from: "src/demo/cleaning-days-provider.js", name: "simulatedCleaningDays" },
    live: { from: "src/kits/cleaning/features/cleaning-free-days/sheet-provider.js", name: "sheetCleaningDays" },
  },
];

/** What this kit adds to the Content-Security-Policy: `sheets` when free days come from a published Google Sheet. @param {any} site */
export function csp(site) {
  return { sheets: site.areas?.days?.source === "sheet" && site.features?.includes("cleaning-free-days") };
}
