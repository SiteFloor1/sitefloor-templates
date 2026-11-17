// @ts-check
/**
 * The driving kit (driving instructors and small driving schools): everything the shared build needs to know about it,
 * in one file. src/features/registry.js finds this file by itself, so adding or changing this kit never edits a shared
 * file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself". The honesty rules every site keeps:
 * src/kits/driving/config.js.
 */
import { checkDriving } from "./config.js";

const K = "src/kits/driving/features";
/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // Starter: the four answers learners ask first, the first two on every plan
  { id: "driving-prices", dir: `${K}/driving-prices`, minPlan: "starter", kits: ["driving"], requires: ["lessons"], js: true,
    summary: "Prices (DRIVE-1): one switch between manual and automatic; one hour, two hours, a block (what it saves) and the intensive course (what it saves), from the instructor's own prices." },
  { id: "driving-areas", dir: `${K}/driving-areas`, minPlan: "starter", kits: ["driving"], requires: ["areas"], js: true,
    summary: "Do you cover me? (DRIVE-1): a postcode against the instructor's own districts; a yes names the area, a no says to message. Every district is printed too." },
  { id: "driving-testday", dir: `${K}/driving-testday`, minPlan: "starter", kits: ["driving"], requires: ["testDay"], js: false,
    summary: "Test day, in order: the five parts of the practical test and what to bring, from gov.uk, with the links to book a theory test, a practical test and a provisional licence." },
  // Plus
  { id: "driving-slots", dir: `${K}/driving-slots`, minPlan: "plus", kits: ["driving"], requires: ["slots"], js: true,
    summary: "Next free lessons (DRIVE-2): the next three free lessons from the instructor's Google Sheet, each asked for on WhatsApp, with when the sheet was updated. A stale or unreadable sheet shows no times, only \"message for times\"." },
  { id: "driving-ready", dir: `${K}/driving-ready`, minPlan: "plus", kits: ["driving"], requires: ["ready"], js: true,
    summary: "Ready to Pass? (DRIVE-3): the DVSA's own five points, answered Yes or Not yet; the verdict in a sentence, linked to gov.uk." },
  { id: "driving-lessons", dir: `${K}/driving-lessons`, minPlan: "plus", kits: ["driving"], requires: ["lessonsPage"], needs: ["driving-prices"], page: "lessons", js: false,
    summary: "Lessons and prices: every lesson and course, manual and automatic side by side, block savings worked out, and the gov.uk test fees with the date they were checked." },
  { id: "driving-area-page", dir: `${K}/driving-area-page`, minPlan: "plus", kits: ["driving"], requires: ["areaPage"], needs: ["driving-areas"], page: "areas", js: false,
    summary: "Areas: the postcode check, every district by name, and where lessons can start (home, school, college, work)." },
  { id: "driving-book", dir: `${K}/driving-book`, minPlan: "plus", kits: ["driving"], requires: ["bookPage"], page: "book", js: false,
    summary: "Book: how booking works in the instructor's words (first lesson, paying, cancelling), the next free lessons when on, and one way to ask." },
  { id: "driving-centres", dir: `${K}/driving-centres`, minPlan: "plus", kits: ["driving"], requires: ["centres"], page: "test-centres", js: false,
    summary: "Test centres (DRIVE-4): the centres the instructor teaches for, each with what they say about it, linked to gov.uk's centre finder. No waiting times or pass rates unless the client gives them, dated." },
  { id: "driving-parents", dir: `${K}/driving-parents`, minPlan: "plus", kits: ["driving"], requires: ["parents"], page: "parents", js: false,
    summary: "For parents: paying, what happens in a lesson, practising together (gov.uk's rules for supervising a learner) and insurance, in the instructor's words with gov.uk links." },
  { id: "driving-passed", dir: `${K}/driving-passed`, minPlan: "plus", kits: ["driving"], requires: ["passed", "gallery"], page: "passed", js: false,
    summary: "Passed: real pass photos from the instructor's own Instagram (Behold), shared with the pupil's agreement. No counts, no rates. Client sites only." },
  { id: "driving-gearbox", dir: `${K}/driving-gearbox`, minPlan: "plus", kits: ["driving"], requires: ["gearbox"], page: "automatic-or-manual", js: false,
    summary: "Automatic or manual: the difference in the instructor's words, what each costs here, and what an automatic licence lets you drive (gov.uk link)." },
  { id: "driving-intensive", dir: `${K}/driving-intensive`, minPlan: "plus", kits: ["driving"], requires: ["intensive"], page: "intensive", js: false,
    summary: "Intensive courses: who they suit, how the days run, prices from the instructor's own list, and booking the test early." },
  { id: "driving-theory", dir: `${K}/driving-theory`, minPlan: "plus", kits: ["driving"], requires: ["theory"], page: "theory", js: false,
    summary: "Theory test help: how the instructor helps with the theory and hazard perception, and the gov.uk link to book." },
  { id: "driving-passplus", dir: `${K}/driving-passplus`, minPlan: "plus", kits: ["driving"], requires: ["passPlus"], page: "pass-plus", js: false,
    summary: "Pass Plus and motorway lessons: what's covered and the price, with gov.uk's Pass Plus page." },
  { id: "driving-refresher", dir: `${K}/driving-refresher`, minPlan: "plus", kits: ["driving"], requires: ["refresher"], page: "refresher", js: false,
    summary: "Refresher lessons: for drivers who passed years ago or feel nervous, what a first refresher covers and its price." },
  { id: "driving-instructors", dir: `${K}/driving-instructors`, minPlan: "plus", kits: ["driving"], requires: ["instructors"], page: "instructors", js: false,
    summary: "Instructors: each instructor, the gearboxes they teach and their DVSA badge status (approved instructor or trainee) with the badge number only when the client supplies it." },
  // Signature
  { id: "driving-pass", dir: `${K}/driving-pass`, minPlan: "signature", kits: ["driving"], requires: ["planner", "fees"], needs: ["driving-prices"], js: true,
    summary: "When could I pass? (DRIVE-6): lessons a week, hours so far and whether the theory is passed give the weeks to test-ready on the DVSA's average and the cost to pass (the instructor's prices and the gov.uk fees, rounded), labelled an estimate, never a promise." },
  { id: "driving-progress", dir: `${K}/driving-progress`, minPlan: "signature", kits: ["driving"], requires: ["progress"], page: "progress", unlisted: true, js: true,
    summary: "Learner progress (DRIVE-5): the learner types their code and sees each skill at the DVSA's five levels, the last lesson and what to practise next, from the instructor's sheet. No names; a stale sheet shows nothing." },
  { id: "driving-journal", dir: `${K}/driving-journal`, minPlan: "signature", kits: ["driving"], requires: ["journal"], page: "journal", morePages: ["article"], js: false,
    summary: "Journal: the instructor's own short articles (test-day tips, common faults), each dated, rules linked to gov.uk." },
];

/** Shared features this trade never offers: free-form pages that escape the honesty checks, work galleries, a staff page
 *  (instructors have their own, with their DVSA status), and photo bands and link cards the first screen replaces. */
export const refuses = ["custom-pages", "work", "team", "photo-band", "page-links"];

/** Pass photos need real pupils who agreed to be shown: client sites only. */
export const clientOnly = ["driving-passed"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkDriving;

/** @param {any} site */
export function pageData(site) {
  const on = (/** @type {string} */ id) => site.features.includes(id);
  const l = site.lessons;
  return {
    driving: {
      lessons: on("driving-prices") ? { manual: l.manual ?? null, automatic: l.automatic ?? null } : null,
      areas: on("driving-areas") ? { districts: site.areas.districts, notCovered: site.areas.notCovered } : null,
      slots: on("driving-slots") ? { source: site.slots.source, csvUrl: site.slots.csvUrl, staleAfterHours: site.slots.staleAfterHours ?? 48, message: site.slots.message } : null,
      ready: on("driving-ready") ? { notYet: site.ready.notYet, yes: site.ready.yes } : null,
      pass: on("driving-pass") ? { perWeek: site.planner.perWeek, intensive: site.planner.intensive ?? null, fees: site.fees } : null,
      progress: on("driving-progress") ? { source: site.progress.source, csvUrl: site.progress.csvUrl, staleAfterHours: site.progress.staleAfterHours ?? 336, skills: site.progress.skills, example: site.mode === "demo" ? site.progress.example : null } : null,
    },
  };
}

/** Live data: simulated on a demo (src/demo), the instructor's published Google Sheet otherwise. @type {import("../../features/registry.js").Provider[]} */
export const providers = [
  {
    key: "drivingSlots",
    on: (site, enabled) => enabled.has("driving-slots") && !!site.slots,
    simulated: (site) => site.slots.source === "simulated",
    demo: { from: "src/demo/driving-slots-provider.js", name: "simulatedSlots" },
    live: { from: "src/kits/driving/features/driving-slots/sheet-provider.js", name: "sheetSlots" },
  },
  {
    key: "drivingProgress",
    on: (site, enabled) => enabled.has("driving-progress") && !!site.progress,
    simulated: (site) => site.progress.source === "simulated",
    demo: { from: "src/demo/driving-progress-provider.js", name: "simulatedProgress" },
    live: { from: "src/kits/driving/features/driving-progress/sheet-provider.js", name: "sheetProgress" },
  },
];

/** The instructor's published sheets. @param {any} site */
export function csp(site) {
  const f = site.features ?? [];
  return { sheets: (f.includes("driving-slots") && site.slots?.source === "sheet") || (f.includes("driving-progress") && site.progress?.source === "sheet") };
}
