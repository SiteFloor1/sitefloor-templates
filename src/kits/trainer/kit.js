// @ts-check
/**
 * The trainer kit (independent personal trainers and small private studios): everything the shared build needs to
 * know about it, in one file. src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so
 * adding or changing this kit never edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit
 * registers itself". The honesty rules every site keeps: src/kits/trainer/config.js.
 */
import { checkTrainer } from "./config.js";

const K = "src/kits/trainer/features";
/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- personal trainers and private studios (trade/trainer) ---
  { id: "trainer-diary", dir: `${K}/trainer-diary`, minPlan: "starter", kits: ["trainer"], requires: ["diary"], js: true,
    summary: "The diary: the trainer's week as a printed appointment page, from their Google Sheet. Spoken-for hours stay quiet, hours already gone read as passed, and the few open ones are printed in ink; tapping one asks for it on WhatsApp. A stale or unreadable sheet shows no open hours, only \"message me for times\"." },
  { id: "trainer-services", section: "services", dir: `${K}/trainer-services`, minPlan: "starter", kits: ["trainer"], requires: ["sessions", "qualifications"], js: false,
    summary: "Sessions and qualifications: each kind of session with its length and price in the trainer's words, and every qualification with its awarding body and year; a link to the trainer's own register entry only when they have one." },
  { id: "trainer-month", section: "firstMonth", dir: `${K}/trainer-month`, minPlan: "signature", kits: ["trainer"], requires: ["firstMonth", "diary"], needs: ["trainer-diary"], js: true,
    summary: "Your first month: choose where (the studio or your home) and how often; see the first session minute by minute, what the place provides, every date for the four weeks after, and what it costs from the trainer's own prices. Reserve the first session on WhatsApp or add every session to a calendar." },
  // Plus
  { id: "trainer-programmes", dir: `${K}/trainer-programmes`, minPlan: "plus", kits: ["trainer"], requires: ["programmes"], page: "programmes", morePages: ["programme"], js: false,
    summary: "Programmes: a page for each kind of training the trainer is qualified for (strength, pregnancy and after, back from injury…), who it's for, what the sessions are, and who they work alongside. Pregnancy and injury programmes name the qualification they rest on." },
  { id: "trainer-goal", dir: `${K}/trainer-goal`, minPlan: "plus", kits: ["trainer"], requires: ["goalFinder", "programmes"], needs: ["trainer-programmes"], js: true,
    summary: "Goal finder (PT-3): your goal, how long since you trained, days a week and any injury → the programme that fits and a sample week, sent to the trainer on WhatsApp. Nothing promised; an injury means a talk first." },
  { id: "trainer-stories", dir: `${K}/trainer-stories`, minPlan: "plus", kits: ["trainer"], requires: ["stories"], page: "results", js: false,
    summary: "Client stories (PT-4): clients in their own words, each with consent recorded (when and how they agreed). No photographs, no numbers, nothing promised. A demo shows marked samples." },
  { id: "trainer-coverage", dir: `${K}/trainer-coverage`, minPlan: "plus", kits: ["trainer"], requires: ["coverage"], js: true,
    summary: "Do you come to me? (PT-5): type a postcode and see, from the trainer's own list of districts, whether they come to your home or train in your park; further out, online." },
  { id: "trainer-checklist", dir: `${K}/trainer-checklist`, minPlan: "plus", kits: ["trainer"], requires: ["checklist"], js: true,
    summary: "Before your session (PT-8): what to wear, eat and bring, and the night before, as a list to tick on the phone (nothing stored), with the cancellation policy in the trainer's words." },
  { id: "trainer-start", dir: `${K}/trainer-start`, minPlan: "plus", kits: ["trainer"], requires: ["startHere", "firstMonth"], page: "start", js: false,
    summary: "Start here: the first session minute by minute, the health questionnaire and why it's asked, and what to bring, on one page." },
  { id: "trainer-prices", dir: `${K}/trainer-prices`, minPlan: "plus", kits: ["trainer"], requires: ["pricesPage"], page: "prices", js: true,
    summary: "Prices and blocks: single sessions and blocks of 5, 10 or 20 with what each session works out at and how long a block lasts; a duo switch shows the price per person when two train together; pay by the trainer's own Stripe link." },
  // Signature
  { id: "trainer-timeline", dir: `${K}/trainer-timeline`, minPlan: "signature", kits: ["trainer"], requires: ["timeline", "firstMonth", "diary"], js: true,
    summary: "Your twelve weeks (PT-6): choose how often, the day and the time to start; the twelve weeks lay themselves out with the trainer's phases, every session dated, bank holidays and closed days marked and left out, the finish date and the cost. Save every session to a calendar in one file, or send the plan on WhatsApp." },
  { id: "trainer-packages", dir: `${K}/trainer-packages`, minPlan: "signature", kits: ["trainer"], requires: ["packages"], page: "corporate", js: true,
    summary: "Corporate and family (PT-7): team sessions at the office or the studio and family sessions at home, what each includes and its price from; a request (which, how many, which days, a company or family name) sent on WhatsApp." },
  { id: "trainer-online", dir: `${K}/trainer-online`, minPlan: "signature", kits: ["trainer"], requires: ["online"], page: "online", js: false,
    summary: "At home and online: what the trainer brings to your home, what online coaching includes (the plan, the check-ins, the kit you need) and the prices, with the coverage check." },
  { id: "trainer-nutrition", dir: `${K}/trainer-nutrition`, minPlan: "signature", kits: ["trainer"], requires: ["nutrition"], page: "nutrition", js: false,
    summary: "Nutrition approach: what the trainer does and doesn't do, within their own qualification, and who they refer to (a registered dietitian or the client's GP) for anything more." },
  { id: "trainer-studio", dir: `${K}/trainer-studio`, minPlan: "signature", kits: ["trainer"], requires: ["studio"], page: "studio", js: false,
    summary: "The studio: photographs of the room, what's in it and the facts people ask (showers, towels, step-free, how many train at once)." },
  { id: "trainer-journal", dir: `${K}/trainer-journal`, minPlan: "signature", kits: ["trainer"], requires: ["journal"], page: "journal", morePages: ["article"], js: false,
    summary: "Journal: the trainer's own short articles (starting strength training, training around a busy week, rest), each on its own page." },
];

/** Shared features this trade never offers: free-form pages that escape the honesty checks, and work galleries (a trainer's "work" is before/after photos; client stories come in words, with consent). */
export const refuses = ["custom-pages", "work"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkTrainer;

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** @param {any} site */
export function pageData(site) {
  const on = (/** @type {string} */ id) => site.features.includes(id);
  const d = site.diary;
  return {
    trainer: {
      name: site.business.name,
      place: [site.business.name, site.location.streetAddress, site.location.locality, site.location.postcode].filter(Boolean).join(", "),
      diary: on("trainer-diary") && d ? { source: d.source, csvUrl: d.csvUrl, staleAfterHours: d.staleAfterHours ?? 36, days: d.days, from: d.from, to: d.to, minutes: d.minutes ?? 60, priceFrom: d.priceFrom, block: d.photo?.block ?? null } : null,
      goal: on("trainer-goal") ? { goals: site.goalFinder.goals, levels: site.goalFinder.levels, injury: site.goalFinder.injury, message: site.goalFinder.message, programmes: site.programmes.items.map((/** @type {any} */ p) => ({ id: p.id, name: p.name, line: p.line, sessions: p.sessions })) } : null,
      coverage: on("trainer-coverage") ? { areas: site.coverage.areas, elsewhere: site.coverage.elsewhere } : null,
      timeline: on("trainer-timeline") ? { phases: site.timeline.phases.map((/** @type {any} */ p) => ({ from: p.from, to: p.to, name: p.name })), session: site.firstMonth.prices.session, postcode: site.location.postcode, closed: (site.hours?.exceptions ?? []).filter((/** @type {any} */ e) => !e.ranges?.length).map((/** @type {any} */ e) => e.date), message: site.timeline.message, minutes: d?.minutes ?? 60 } : null,
      packages: on("trainer-packages") ? { message: site.packages.message } : null,
      month: on("trainer-month") ? { places: site.firstMonth.places.map((/** @type {any} */ p) => ({ id: p.id, label: p.label, text: p.text, away: !!p.away })), often: site.firstMonth.often, prices: site.firstMonth.prices, message: site.firstMonth.message } : null,
    },
  };
}

/**
 * Live data: simulated on a demo (src/demo), the trainer's published Google Sheet otherwise.
 * @type {import("../../features/registry.js").Provider[]}
 */
export const providers = [
  {
    key: "diary",
    on: (site, enabled) => enabled.has("trainer-diary") && !!site.diary,
    simulated: (site) => site.diary.source === "simulated",
    demo: { from: "src/demo/diary-provider.js", name: "simulatedDiary" },
    live: { from: "src/kits/trainer/features/trainer-diary/sheet-provider.js", name: "sheetDiary" },
  },
];

/** What this kit adds to the site's Content-Security-Policy: the trainer's published sheet. @param {any} site */
export function csp(site) {
  return { sheets: site.diary?.source === "sheet" && site.features?.includes("trainer-diary") };
}
