// @ts-check
/**
 * The law kit (law firms): everything the shared build needs to know about it, in one file.
 * src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so adding or changing this kit never
 * edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 */
import { checkLaw } from "./config.js";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- law firm (trade/law-firm) ---
  { id: "practice", section: "practice", dir: "src/kits/law/features/practice", minPlan: "starter", kits: ["law"], requires: ["practice"], js: false,
    summary: "Where the firm acts: each practice area by name with one line, set large as an index, and who leads it." },
  { id: "people", section: "people", dir: "src/kits/law/features/people", minPlan: "starter", kits: ["law"], requires: ["people"], js: false,
    summary: "The firm's people: name, role, practice and, for every solicitor, their SRA ID, linked to the SRA's register." },
  { id: "regulation", section: "regulation", dir: "src/kits/law/features/regulation", minPlan: "starter", kits: ["law"], requires: ["regulation"], js: false,
    summary: "Regulation in plain sight: the SRA's digital badge under the first call to action, and a plate with the regulator, SRA number, complaints and published prices; the SRA number on every page." },
  { id: "pricing", dir: "src/kits/law/features/pricing", minPlan: "starter", kits: ["law"], requires: ["pricing", "regulation"], page: "pricing", freePage: true, js: false,
    summary: "Prices and service information as the SRA Transparency Rules ask: for each listed service the price or its basis, VAT, disbursements, what is and isn't included, key stages, timescales and who does the work (free on every plan)." },
  { id: "complaints", dir: "src/kits/law/features/complaints", minPlan: "starter", kits: ["law"], requires: ["complaints", "regulation"], page: "complaints", freePage: true, js: false,
    summary: "Complaints and regulation: the firm's own procedure, then how and when to go to the Legal Ombudsman and the SRA, the SRA number and the firm's insurance (free on every plan)." },
  { id: "enquiry", section: "enquiry", dir: "src/kits/law/features/enquiry", minPlan: "starter", kits: ["law"], requires: ["practice", "people"], needs: ["practice", "people"], js: true,
    summary: "Speak to a partner: choose what it's about and the partner who leads that practice is shown with their direct line and email." },
  { id: "practice-page", dir: "src/kits/law/features/practice-page", minPlan: "plus", kits: ["law"], requires: ["practice"], needs: ["practice"], page: "practice", js: false,
    summary: "The practice page: every area with what the firm does in it and the people who lead it." },
  { id: "people-page", dir: "src/kits/law/features/people-page", minPlan: "plus", kits: ["law"], requires: ["people"], needs: ["people"], page: "people", js: false,
    summary: "The people page: each partner and solicitor with a neutral portrait (or none), their practice, a short note and their SRA ID." },
  { id: "insights-page", dir: "src/kits/law/features/insights-page", minPlan: "plus", kits: ["law"], requires: ["insights"], page: "insights", morePages: ["insight"], js: false,
    summary: "Insights: the firm's own dated notes, each on its own page with its author, marked as general information and not advice." },
  { id: "first-contact", dir: "src/kits/law/features/first-contact", minPlan: "plus", kits: ["law"], requires: ["firstContact", "people"], needs: ["enquiry"], page: "contact", js: true,
    summary: "Conflict-safe first contact: the first message asks only who is involved, so the firm checks it can act before anyone shares a confidence; sent by email in the visitor's own words." },
  { id: "arrival", dir: "src/kits/law/features/arrival", minPlan: "plus", kits: ["law"], requires: ["arrival"], js: false,
    summary: "Discreet arrival: which door, where to leave the car and who will open it, set beside a photograph of the house." },
  { id: "area-pages", dir: "src/kits/law/features/area-pages", minPlan: "signature", kits: ["law"], requires: ["practice"], needs: ["practice-page"], page: "area", js: false,
    summary: "A page for each practice area: what the firm does, who leads it, the guides and any matters the clients have approved for publication (a collection, counted as one page)." },
  { id: "matters", dir: "src/kits/law/features/matters", minPlan: "signature", kits: ["law"], requires: ["matters"], needs: ["area-pages"], js: false,
    summary: "Public matters: work the firm may name because the client approved it and it is already public, each with its public source; never an outcome promised." },
  { id: "guides-page", dir: "src/kits/law/features/guides-page", minPlan: "signature", kits: ["law"], requires: ["guides"], page: "guides", morePages: ["guide"], js: false,
    summary: "Private client guides: longer pieces for families (wills, trusts, buying a house in London), each dated and reviewed by a named partner." },
  { id: "meeting-pack", dir: "src/kits/law/features/meeting-pack", minPlan: "signature", kits: ["law"], requires: ["meetingPack", "people"], needs: ["people"], page: "meeting", freePage: true, unlisted: true, js: true,
    summary: "The first-meeting pack: a private page the firm sends before a first meeting (when, who meets you, which door, what to bring, how fees work) and adds to the calendar. The details live in the link the firm sends; nothing is stored." },
  { id: "glossary", dir: "src/kits/law/features/glossary", minPlan: "starter", kits: ["law"], requires: ["glossary"], page: "words", freePage: true, js: true,
    summary: "Words we use: the terms clients meet (executor, grant of probate, trustee) in one plain sentence each, with a quick filter (free on every plan)." },
  { id: "matter-steps", dir: "src/kits/law/features/matter-steps", minPlan: "plus", kits: ["law"], requires: ["matterSteps"], needs: ["practice-page"], js: true,
    summary: "Your matter, step by step: for each kind of matter the firm's own stages as a timeline (what happens, roughly when, what the client does), on the practice page and each area's page." },
  { id: "bereavement", dir: "src/kits/law/features/bereavement", minPlan: "plus", kits: ["law"], requires: ["bereavement"], page: "when-someone-dies", js: true,
    summary: "When someone has died: the first steps in order with the official links, and reminders the family can add to their calendar from the day they start." },
  { id: "gather", dir: "src/kits/law/features/gather", minPlan: "plus", kits: ["law"], requires: ["gather"], page: "gather", js: true,
    summary: "What to gather: a checklist for each kind of matter; ticks stay on the visitor's own device, and the list can be copied or emailed to themselves." },
  { id: "your-hours", dir: "src/kits/law/features/your-hours", minPlan: "plus", kits: ["law"], requires: ["yourHours"], needs: ["enquiry"], js: true,
    summary: "Our day in yours: the firm's opening hours shown in the visitor's own time zone (or one of the firm's usual client cities), for families abroad." },
  { id: "will-reminder", dir: "src/kits/law/features/will-reminder", minPlan: "plus", kits: ["law"], requires: ["willReminder"], needs: ["practice-page"], js: true,
    summary: "Will review reminder: tick what has changed since the will was made (a marriage, a child, a house, a move abroad); the page says whether it is time to review it, or adds a reminder to the calendar for later." },
  { id: "estimator", dir: "src/kits/law/features/estimator", minPlan: "signature", kits: ["law"], requires: ["estimator", "pricing"], needs: ["pricing"], js: true,
    summary: "Probate cost estimator: four answers give an estimate from the firm's own published range, with VAT and the disbursements; never outside the published range, and no need to get in touch first." },
  { id: "intestacy", dir: "src/kits/law/features/intestacy", minPlan: "signature", kits: ["law"], requires: ["intestacy"], needs: ["succession-map"], js: true,
    summary: "If there's no will: tap who in the family is alive and see who would inherit under the intestacy rules of England and Wales, dated and sourced, general information only." },
  { id: "house-tour", dir: "src/kits/law/features/house-tour", minPlan: "signature", kits: ["law"], requires: ["house"], page: "house", js: true,
    summary: "The house, room by room: a photograph tour of the firm's rooms and doors, one line each; without scripts every room is listed." },
  { id: "matter-code", dir: "src/kits/law/features/matter-code", minPlan: "signature", kits: ["law"], requires: ["matterCode"], page: "your-matter", freePage: true, unlisted: true, js: true,
    summary: "Your matter, by code: the stage a matter has reached, from the firm's published sheet, which holds only a random code, a stage and a time; old or unknown codes say to call." },
  { id: "succession-map", dir: "src/kits/law/features/succession-map", minPlan: "signature", kits: ["law"], requires: ["succession"], page: "succession", js: true,
    summary: "The succession map: an illustration of how a family's estate can pass through a will or a trust across generations, stepped one generation at a time, labelled as an illustration and not advice." },
];

/** Shared features this trade never offers. */
export const refuses = ["gallery", "work", "reviews", "team", "vouchers"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkLaw;

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** Config the law scripts need: only "your matter, by code" reads from the page's data (codes, stages, the sheet). @param {any} site */
export function pageData(site) {
  if (!site.features.includes("matter-code")) return {};
  const m = site.matterCode;
  return { matterCode: { source: m.source, csvUrl: m.csvUrl, staleAfterDays: m.staleAfterDays, stages: m.stages.map((/** @type {any} */ s) => ({ id: s.id })), example: site.mode === "demo" ? m.example : undefined } };
}

/**
 * Live data: simulated on a demo (src/demo), the client's published Google Sheet otherwise.
 * @type {import("../../features/registry.js").Provider[]}
 */
export const providers = [
  {
    key: "matter",
    on: (site, enabled) => enabled.has("matter-code"),
    simulated: (site) => site.matterCode?.source === "simulated",
    demo: { from: "src/demo/matter-provider.js", name: "simulatedMatter" },
    live: { from: "src/kits/law/features/matter-code/sheet-provider.js", name: "sheetMatter" },
  },
];

/**
 * What this kit adds to the site's Content-Security-Policy (src/core/lib/seo.js): `sheets` when it reads a published
 * Google Sheet, and any other sources.
 * @param {any} site @returns {import("../../features/registry.js").KitCsp}
 */
export function csp(site) {
  return {
    sheets: site.features?.includes("matter-code") && site.matterCode?.source === "sheet", // your matter, by code
    frame: site.regulation?.badgeFrame ? ["https://cdn.yoshki.com"] : [], // the SRA digital badge (SRA Transparency Rules 4.1)
  };
}
