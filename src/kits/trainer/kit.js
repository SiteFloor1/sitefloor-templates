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
];

/** Shared features this trade never offers: free-form pages that escape the honesty checks, and before/after work galleries (client stories come with consent, later). */
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
