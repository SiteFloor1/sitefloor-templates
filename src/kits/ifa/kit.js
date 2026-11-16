// @ts-check
/**
 * The ifa kit (independent and restricted financial advisers): everything the shared build needs to know about it, in
 * one file. src/features/registry.js finds this file by itself, so this kit never edits a shared file. What each export
 * is for: docs/ARCHITECTURE.md, "A kit registers itself". Feature codes (IFA-1 to IFA-11, approved 16 Nov 2026):
 * docs/trades/financial-advisers/playbook.md. FCA rules shape the kit: fees are shown in pounds as arithmetic on the
 * firm's published schedule, and nothing projects growth or promises a return.
 */
import { checkIfa } from "./config.js";
import { fresh } from "./lib/milestones.js";
import { buildNow } from "../../core/lib/build-day.js";

const K = ["ifa"];
const D = "src/kits/ifa/features";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- Starter (IFA-1, IFA-5, IFA-7) ---
  { id: "ifa-fca", dir: `${D}/ifa-fca`, minPlan: "starter", kits: K, requires: ["regulation"], page: "regulatory", freePage: true, js: false,
    summary: "IFA-1. The firm's statutory status and FRN on every page, linked to its own entry on the FCA register, and the regulatory information page: how to complain, then the Financial Ombudsman Service with its free phone number. Free on every plan." },
  { id: "ifa-independence", dir: `${D}/ifa-independence`, minPlan: "starter", kits: K, requires: ["independence"], page: "independent", freePage: true, js: false,
    summary: "IFA-7. Independent or restricted: one plain line wherever the firm describes its advice, and a short page on what that means for the client and where free guidance lives. Always on, free on every plan." },
  { id: "ifa-check", dir: `${D}/ifa-check`, minPlan: "starter", kits: K, requires: ["check"], page: "check", freePage: true, js: false,
    summary: "IFA-5. Check it's us: the firm's register entry, the only numbers and email addresses it uses, what it will never ask, and the FCA's ScamSmart. Free on every plan." },
  { id: "ifa-services", section: "services", dir: `${D}/ifa-services`, minPlan: "starter", kits: K, requires: ["advice", "independence"], js: false,
    summary: "IFA-1. What we help with: each service in a line, with what to bring to talk about it beside it, who the firm works with and its minimum." },
  { id: "ifa-advisers", section: "advisers", dir: `${D}/ifa-advisers`, minPlan: "starter", kits: K, requires: ["advisers", "regulation"], js: false,
    summary: "IFA-1. The advisers: each name and role, their letters, and their FCA individual reference number linked to the register." },
  // --- Plus (IFA-2, IFA-3, IFA-8, IFA-9) ---
  { id: "ifa-fees", dir: `${D}/ifa-fees`, minPlan: "plus", kits: K, requires: ["fees"], page: "fees", js: false,
    summary: "IFA-2. Fees explained: the published schedule in words and three worked amounts in pounds, what the yearly fee buys, how the firm is paid, VAT, and platform and fund charges shown separately." },
  { id: "ifa-advisers-page", dir: `${D}/ifa-advisers-page`, minPlan: "plus", kits: K, requires: ["advisers"], needs: ["ifa-advisers"], page: "advisers", js: false,
    summary: "The advisers page: each adviser with a photograph, what they look after, their letters and their register entry." },
  { id: "ifa-meeting", dir: `${D}/ifa-meeting`, minPlan: "plus", kits: K, requires: ["meeting"], page: "first-meeting", js: true,
    summary: "IFA-3. The first meeting: free, how long, where, what happens, and a checklist of what to bring that the visitor ticks on their own phone (nothing is sent), then the firm's booking link." },
  { id: "ifa-upload", dir: `${D}/ifa-upload`, minPlan: "plus", kits: K, requires: ["upload"], needs: ["ifa-meeting"], js: false,
    summary: "IFA-8. Secure upload: a link to the firm's own client portal for statements, and never email them. The website never receives a file." },
  { id: "ifa-year", dir: `${D}/ifa-year`, minPlan: "plus", kits: K, requires: ["year"], page: "your-year", js: true,
    summary: "IFA-9. Your year with us: the review rhythm as the firm runs it, what brings an extra meeting, and a yearly reminder for the client's own review month as a calendar file." },
  { id: "ifa-services-page", dir: `${D}/ifa-services-page`, minPlan: "plus", kits: K, requires: ["advice"], needs: ["ifa-services"], page: "services", js: false,
    summary: "The services page: every service with what to bring, and a link to each topic's own page on Signature." },
  // --- Signature (IFA-4, IFA-6, IFA-10, IFA-11) ---
  { id: "ifa-statement", dir: `${D}/ifa-statement`, minPlan: "signature", kits: K, requires: ["fees"], js: true,
    summary: "IFA-6. Fees in pounds, the hero: type an amount and the firm's published fees appear as a statement, once, each year, each month and the first year, in pounds and pence. Arithmetic only: no returns, no projections; a broken schedule shows the fees page instead." },
  { id: "ifa-topics", dir: `${D}/ifa-topics`, minPlan: "signature", kits: K, requires: ["topics"], needs: ["ifa-services-page"], page: "topic", collection: true, js: false,
    summary: "A page for each subject (pensions and retirement, inheritance tax, protection, mortgages, business owners, later life): general information, dated and sourced, then how the firm helps and what to bring (a collection, counted as one page)." },
  { id: "ifa-milestones", dir: `${D}/ifa-milestones`, minPlan: "signature", kits: K, requires: ["milestones"], needs: ["ifa-topics"], js: true,
    summary: "IFA-10. Milestones: a year of birth in, the year a pension can usually first be taken and the State Pension age year out, under the law today, sourced to GOV.UK. No money and no growth; change-over years and unchecked rules send people to GOV.UK." },
  { id: "ifa-tracing", dir: `${D}/ifa-tracing`, minPlan: "signature", kits: K, requires: ["tracing"], page: "old-pensions", js: true,
    summary: "IFA-11. Old pensions: list past employers on the phone and get a tracing list to print or copy, with the government's free Pension Tracing Service and what to ask each scheme. Nothing is stored or sent." },
  { id: "ifa-guides", dir: `${D}/ifa-guides`, minPlan: "signature", kits: K, requires: ["guides"], page: "guide", morePages: ["guides"], collection: true, js: false,
    summary: "IFA-4. Life-event guides: retiring, inheriting, selling a business, separating, a parent needing care. The steps, what to have ready, dated and sourced, general information (a collection, counted as one page)." },
  { id: "ifa-journal", dir: `${D}/ifa-journal`, minPlan: "signature", kits: K, requires: ["journal"], page: "insights", js: false,
    summary: "The journal: the firm's own articles, newest first, each marked general information and showing who in compliance approved it and when." },
];

/**
 * Shared features this trade never offers: testimonials and galleries sit badly with financial promotion rules, and
 * offers, seasonal banners, photo bands and page tiles don't suit the trade.
 */
export const refuses = ["gallery", "work", "reviews", "team", "vouchers", "seasonal", "photo-band", "page-links"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkIfa;

/** What the browser scripts read from the page, only for the features that are on. @param {any} site */
export function pageData(site) {
  const on = (/** @type {string} */ id) => site.features.includes(id);
  /** @type {Record<string, any>} */ const out = {};
  if (on("ifa-statement")) out.fees = { schedule: site.fees.schedule, example: site.fees.example };
  if (on("ifa-year")) out.year = { note: site.year.note };
  if (on("ifa-meeting")) out.meeting = { count: site.meeting.bring.length, key: `${site.id}-bring` };
  return out;
}

/** What the templates read before the first paint: whether the milestone rules were checked recently enough to show. */
export function buildData() {
  return { milestonesFresh: fresh(buildNow()) };
}
