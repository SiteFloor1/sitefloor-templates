// @ts-check
/**
 * The ballet kit (children's dance and ballet schools): everything the shared build needs to know about it, in one file.
 * src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so adding or changing this kit never
 * edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 */
import { checkBallet } from "./config.js";
import { yearItems } from "./lib/ballet.js";

const K = "src/kits/ballet/features";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  { id: "ballet-finder", dir: `${K}/ballet-finder`, minPlan: "starter", kits: ["ballet"], requires: ["hero", "classes"], js: true,
    summary: "The class finder on the first screen: the parent taps the child's age and sees the class, the day, the time and how long it lasts, with a trial request ready for WhatsApp." },
  { id: "ballet-year", dir: `${K}/ballet-year`, minPlan: "starter", kits: ["ballet"], requires: ["year"], js: true,
    summary: "The year in the round: term dates, half terms, shows and exams set round the hero's photograph, the next one named, and every date in one calendar file." },
  { id: "ballet-places", dir: `${K}/ballet-places`, minPlan: "plus", kits: ["ballet"], requires: ["places"], needs: ["ballet-finder"], js: true,
    summary: "Places left per class, beside the finder's answer and on the timetable, from the school's own Google Sheet; \"Full: join the list\" writes the waiting-list message. An old or unreadable sheet shows nothing rather than a wrong number." },
  { id: "ballet-trial", section: "trial", dir: `${K}/ballet-trial`, minPlan: "plus", kits: ["ballet"], requires: ["trial", "trialPage"], needs: ["ballet-finder"], page: "trial", js: true,
    summary: "The trial class: what to bring, what happens on the day and after, and a request that carries the age and class chosen above; its own page with the age and the day picked in two taps." },
  { id: "ballet-classes", dir: `${K}/ballet-classes`, minPlan: "plus", kits: ["ballet"], requires: ["classesPage"], needs: ["ballet-finder"], page: "classes", js: false,
    summary: "Classes by age: every class from the youngest up, its ages, days, times and length, in the school's words." },
  { id: "ballet-timetable", dir: `${K}/ballet-timetable`, minPlan: "plus", kits: ["ballet"], requires: ["timetablePage"], needs: ["ballet-finder"], page: "timetable", js: false,
    summary: "The week's timetable, day by day, each class with its ages and length." },
  { id: "ballet-catchup", dir: `${K}/ballet-catchup`, minPlan: "plus", kits: ["ballet"], requires: ["catchUp"], needs: ["ballet-timetable"], js: true,
    summary: "Missed a class? Pick it, and the other times this week at the same level appear, with a message to the school." },
  { id: "ballet-fees", dir: `${K}/ballet-fees`, minPlan: "plus", kits: ["ballet"], requires: ["fees", "feesPage"], page: "fees", js: false,
    summary: "Fees and terms in the school's own words: what a term costs, how to pay, missed weeks, notice." },
  { id: "ballet-uniform", section: "uniform", dir: `${K}/ballet-uniform`, minPlan: "plus", kits: ["ballet"], requires: ["uniform", "uniformPage"], page: "uniform", js: true,
    summary: "What to wear, class by class: the list for each class and the school's supplier, on the home page and its own page." },
  { id: "ballet-exams", dir: `${K}/ballet-exams`, minPlan: "plus", kits: ["ballet"], requires: ["exams", "examsPage"], page: "exams", js: true,
    summary: "Exams: the school's own words on exams, and each exam date with the classes sitting it, into the calendar. A board is named only if the school names it." },
  { id: "ballet-shows", dir: `${K}/ballet-shows`, minPlan: "signature", kits: ["ballet"], requires: ["shows", "showsPage"], page: "shows", js: false,
    summary: "Shows and tickets: each show's date, curtain-up, venue, running time and filming rule, and the school's own ticket page." },
  { id: "ballet-handbook", dir: `${K}/ballet-handbook`, minPlan: "signature", kits: ["ballet"], requires: ["handbook", "handbookPage"], page: "handbook", js: true,
    summary: "The parent handbook: collection, photographs, what to bring, illness, in the school's words, on one page that prints cleanly." },
  { id: "ballet-showday", dir: `${K}/ballet-showday`, minPlan: "signature", kits: ["ballet"], requires: ["showDay", "showDayPage"], page: "show-day", js: true,
    summary: "Show day by code: the parent types the class's code and sees arrival time, stage door, costume, hair and collection, from the school's own Google Sheet; a code, not a password." },
  { id: "ballet-path", dir: `${K}/ballet-path`, minPlan: "signature", kits: ["ballet"], requires: ["path"], needs: ["ballet-classes"], js: true,
    summary: "Where she'll go next: from the child's age, the classes she would usually move through year by year, in the school's words." },
];

/** Shared features a dance school never offers on this kit. */
export const refuses = ["gallery", "work", "seasonal", "photo-band", "page-links", "team", "vouchers"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkBallet;

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** @param {any} site */
export function pageData(site) {
  const on = (/** @type {string[]} */ ...ids) => ids.some((id) => site.features.includes(id));
  const ring = on("ballet-year")
    ? yearItems(site.year.items, on("ballet-shows") ? site.shows.items : [], on("ballet-exams") ? site.exams.items : [], "0000-00-00")
    : [];
  return {
    school: site.business.name,
    place: [site.business.name, site.location.streetAddress, site.location.locality, site.location.postcode].filter(Boolean).join(", "),
    classes: on("ballet-finder") ? { message: site.classes.message, items: site.classes.items } : null,
    year: on("ballet-year") ? { items: ring } : null,
    exams: on("ballet-exams") ? { items: site.exams.items.map((/** @type {any} */ e) => ({ id: `exam-${e.id}`, date: e.date, label: e.label, kind: "exam" })) } : null,
    trial: on("ballet-trial") ? { message: site.trial.message } : null,
    places: on("ballet-places") ? { source: site.places.source, csvUrl: site.places.csvUrl, staleAfterDays: site.places.staleAfterDays ?? 7, message: site.places.message } : null,
    catchUp: on("ballet-catchup") ? { message: site.catchUp.message } : null,
    showDay: on("ballet-showday") ? { source: site.showDay.source, csvUrl: site.showDay.csvUrl, staleAfterDays: site.showDay.staleAfterDays ?? 14, message: site.showDay.message } : null,
  };
}

/**
 * Live data: simulated on a demo (src/demo), the school's published Google Sheet otherwise.
 * @type {import("../../features/registry.js").Provider[]}
 */
export const providers = [
  {
    key: "balletPlaces",
    on: (site, enabled) => enabled.has("ballet-places"),
    simulated: (site) => site.places?.source === "simulated",
    demo: { from: "src/demo/ballet-places-provider.js", name: "simulatedPlaces" },
    live: { from: "src/kits/ballet/features/ballet-places/sheet-provider.js", name: "sheetPlaces" },
  },
  {
    key: "balletShowDay",
    on: (site, enabled) => enabled.has("ballet-showday"),
    simulated: (site) => site.showDay?.source === "simulated",
    demo: { from: "src/demo/ballet-showday-provider.js", name: "simulatedShowDay" },
    live: { from: "src/kits/ballet/features/ballet-showday/sheet-provider.js", name: "sheetShowDay" },
  },
];

/** What this kit adds to the site's Content-Security-Policy: the school's published Google Sheets. @param {any} site */
export function csp(site) {
  const on = (/** @type {string} */ id) => site.features?.includes(id);
  return { sheets: (on("ballet-places") && site.places?.source === "sheet") || (on("ballet-showday") && site.showDay?.source === "sheet") };
}
