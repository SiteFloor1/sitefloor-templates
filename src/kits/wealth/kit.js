// @ts-check
/**
 * The wealth kit (private wealth managers and family-office style firms): everything the shared build needs to know
 * about it, in one file. src/features/registry.js finds this file by itself, so this kit never edits a shared file.
 * What each export is for: docs/ARCHITECTURE.md, "A kit registers itself". FCA rules shape the kit: no performance
 * figures, return claims or calculators; insights are general information, never advice; the firm's FCA status and
 * capital-at-risk wording sit where the firm is promoted.
 */
import { checkWealth } from "./config.js";

const K = ["wealth"];
const D = "src/kits/wealth/features";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- Starter ---
  { id: "fca", dir: `${D}/fca`, minPlan: "starter", kits: K, requires: ["regulation"], page: "regulatory", freePage: true, js: false,
    summary: "FCA status in plain sight: the firm's FCA reference number with a link to the FCA register, capital-at-risk wording beside the first call to action, and the regulatory information page (complaints, the Financial Ombudsman Service, what the FCA doesn't regulate). Free on every plan." },
  { id: "check", dir: `${D}/check`, minPlan: "starter", kits: K, requires: ["check"], page: "check", freePage: true, js: false,
    summary: "Is this really us?: the firm's only phone numbers and email domains, what it will never ask for, and how to check a call or a change of bank details before acting. Free on every plan." },
  { id: "situations", section: "situations", dir: `${D}/situations`, minPlan: "starter", kits: K, requires: ["situations"], js: true,
    summary: "Your situation: one quiet sentence, I am selling a business (or receiving an inheritance, moving to the UK, retiring) and I live in the UK or abroad; choosing changes the line and the next step." },
  { id: "help", section: "help", dir: `${D}/help`, minPlan: "starter", kits: K, requires: ["help"], js: false,
    summary: "How we help: the firm's services in calm columns, each with a photograph, a title and one sentence, and who the firm works with, including its minimum if it has one." },
  { id: "advisers", section: "advisers", dir: `${D}/advisers`, minPlan: "starter", kits: K, requires: ["advisers"], js: false,
    summary: "Your advisers: each person's name and role and, for everyone the FCA certifies or approves, their individual reference number, with a link to check it on the FCA register." },
  { id: "office", section: "office", dir: `${D}/office`, minPlan: "starter", kits: K, requires: ["offices"], js: true,
    summary: "Our office: the address, the time there now and whether it is open, how to get there, the meeting rooms, and that the firm will come to you. With more offices, each one with its own time now." },
  // --- Plus ---
  { id: "insights", section: "insights", dir: `${D}/insights`, minPlan: "plus", kits: K, requires: ["insights"], js: true,
    summary: "Insights on the home page: the three newest, with photographs. The firm publishes them from its own Google Sheet; a row shows only once compliance has ticked it as approved, and every one is marked general information, not advice." },
  { id: "insight-library", dir: `${D}/insight-library`, minPlan: "plus", kits: K, requires: ["insights"], needs: ["insights"], page: "insights", js: true,
    summary: "The insights page: every approved insight, newest first, filtered by subject, each opening to its full text with its author and approval date." },
  { id: "approach", dir: `${D}/approach`, minPlan: "plus", kits: K, requires: ["approach"], page: "approach", js: false,
    summary: "How we work: the firm's own steps from first meeting to yearly review, and its fees in pounds, explained in plain English." },
  { id: "advisers-page", dir: `${D}/advisers-page`, minPlan: "plus", kits: K, requires: ["advisers"], needs: ["advisers"], page: "people", js: false,
    summary: "The people page: each adviser with what they lead, a short note, their direct line and their FCA individual reference number." },
  { id: "meeting", dir: `${D}/meeting`, minPlan: "plus", kits: K, requires: ["meeting"], page: "meeting", js: true,
    summary: "Arrange a meeting: who you are, how to reach you, what it is about and where to meet, sent by email or WhatsApp in your own words. It asks nothing about your money and stops account or card numbers being sent." },
  { id: "bring", dir: `${D}/bring`, minPlan: "plus", kits: K, requires: ["bring"], needs: ["meeting"], js: false,
    summary: "What to bring to a first meeting: a short checklist on the meeting page, to print or tick off." },
  // --- Signature ---
  { id: "life-events", dir: `${D}/life-events`, minPlan: "signature", kits: K, requires: ["lifeEvents"], page: "life", collection: true, js: false,
    summary: "A page for each moment: selling a business, family and succession, moving to the UK, retiring and giving, each with what the firm does, what to have ready, the related insights and the next step (a collection, counted as one page)." },
  { id: "timeline", dir: `${D}/timeline`, minPlan: "signature", kits: K, requires: ["lifeEvents"], needs: ["life-events"], js: false,
    summary: "The timeline: on a moment's page, who does what and roughly when (you, the firm, your solicitor and accountant), from the first conversation to afterwards; an illustration with no figures." },
  { id: "offices-page", dir: `${D}/offices-page`, minPlan: "signature", kits: K, requires: ["offices"], needs: ["office"], page: "offices", js: true,
    summary: "Discreet offices: each office's entrance, parking, step-free access and private rooms, its time now, and the firm's offer to meet at home." },
  { id: "adviser-pages", dir: `${D}/adviser-pages`, minPlan: "plus", kits: K, requires: ["advisers"], needs: ["advisers"], page: "adviser", collection: true, js: false,
    summary: "Each adviser's own page: a photograph, what they look after, their FCA reference with a link to check it, their direct line, and a booking link (a collection, counted as one page)." },
  { id: "firm-events", dir: `${D}/firm-events`, minPlan: "plus", kits: K, requires: ["events"], page: "events", js: true,
    summary: "Events: seminars and next-generation evenings from the firm's own sheet once compliance has approved them, each with a reply link and a calendar file; past events drop off by themselves." },
  { id: "documents", dir: `${D}/documents`, minPlan: "signature", kits: K, requires: ["documents", "lifeEvents"], needs: ["life-events"], page: "documents", js: true,
    summary: "The documents to gather: choose a moment, such as selling a business, and see exactly which papers to find before a first meeting, grouped, to tick, print or copy. No figures and no advice." },
  { id: "wishes-guide", dir: `${D}/wishes-guide`, minPlan: "plus", kits: K, requires: ["wishesGuide"], page: "letter-of-wishes", js: false,
    summary: "A letter of wishes, a guide: what it is, that it isn't binding, what people put in it and how it stays private, in plain English, each point sourced and dated. General information, not advice." },
  { id: "family-map", dir: `${D}/family-map`, minPlan: "signature", kits: K, requires: ["familyMap"], page: "family", js: true,
    summary: "The family map: before a first meeting, sketch who is who across the generations and the advisers you already have. It stays on your own device; print it or copy it into an email to yourself." },
];

/**
 * Shared features this trade never offers: testimonials and galleries sit badly with financial promotion rules, and
 * seasonal offers, photo bands and page tiles don't suit the trade. Plan your visit becomes "Before we meet" (the look).
 */
export const refuses = ["gallery", "work", "reviews", "team", "vouchers", "seasonal", "photo-band", "page-links"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkWealth;

/** What the browser scripts read from the page, only for the features that are on. @param {any} site */
export function pageData(site) {
  const on = (/** @type {string} */ id) => site.features.includes(id);
  /** @type {Record<string, any>} */ const out = {};
  if (on("situations")) out.situations = { items: site.situations.items.map((/** @type {any} */ s) => ({ id: s.id, line: s.line, next: s.next })), places: site.situations.places };
  if (on("office")) out.offices = site.offices.items.map((/** @type {any} */ o, /** @type {number} */ i) => ({ id: o.id, hours: i === 0 ? site.hours : { timezone: o.timezone, weekly: o.weekly } }));
  if (on("insights")) {
    const ins = site.insights;
    out.insights = { source: ins.source, csvUrl: ins.csvUrl, photos: Object.keys(ins.photos), sample: site.mode === "demo" ? ins.sample : undefined };
  }
  if (on("firm-events")) out.events = { source: site.events.source, csvUrl: site.events.csvUrl, items: site.events.items, sample: site.mode === "demo" ? site.events.sample : undefined };
  if (on("meeting")) out.meeting = { email: site.meeting.email ?? site.contact.email ?? "" };
  return out;
}

/**
 * Live data: the firm's insights sheet. Simulated on a demo (src/demo), the firm's published Google Sheet otherwise.
 * @type {import("../../features/registry.js").Provider[]}
 */
export const providers = [
  {
    key: "insights",
    on: (site, enabled) => enabled.has("insights") && site.insights?.source !== "site",
    simulated: (site) => site.insights?.source === "simulated",
    demo: { from: "src/demo/insights-provider.js", name: "simulatedInsights" },
    live: { from: "src/kits/wealth/features/insights/sheet-provider.js", name: "sheetInsights" },
  },
  {
    key: "events",
    local: "wealthEventsProvider",
    on: (site, enabled) => enabled.has("firm-events") && site.events?.source !== "site",
    simulated: (site) => site.events?.source === "simulated",
    demo: { from: "src/demo/events-provider.js", name: "simulatedEvents" },
    live: { from: "src/kits/wealth/features/firm-events/sheet-provider.js", name: "sheetEvents" },
  },
];

/** What this kit adds to the security policy: the Google Sheets hosts, when the firm publishes insights or events from a sheet. @param {any} site */
export function csp(site) {
  const on = (/** @type {string} */ id) => !!site.features?.includes(id);
  return { sheets: (on("insights") && site.insights?.source === "sheet") || (on("firm-events") && site.events?.source === "sheet") };
}
