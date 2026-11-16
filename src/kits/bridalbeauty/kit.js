// @ts-check
/**
 * The bridalbeauty kit (bridal hair and makeup artists): everything the shared build needs to know about it, in one
 * file. src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so adding or changing this
 * kit never edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 */
import { checkBridalBeauty } from "./config.js";

const K = "src/kits/bridalbeauty/features";
const kits = ["bridalbeauty"];

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  { id: "bridalbeauty-cover", dir: `${K}/bridalbeauty-cover`, minPlan: "starter", kits, requires: ["hero"], js: true,
    summary: "The cover: one finished bride full-bleed, the artist's name across the top (above her head, or behind it when her photo allows), and cover lines that are the real answers: is my date free, trial and wedding day for the service she picks, and what time we start. Change the date in the line and the cover rewrites itself." },
  { id: "bridalbeauty-packages", section: "packages", dir: `${K}/bridalbeauty-packages`, minPlan: "starter", kits, requires: ["packages"], js: false,
    summary: "For the bride: hair and makeup, makeup, hair, each with the trial, minutes in the chair and the artist's price; the party per person; extras like staying for touch-ups." },
  { id: "bridalbeauty-dates", dir: `${K}/bridalbeauty-dates`, minPlan: "starter", kits, requires: ["dateCheck"], needs: ["bridalbeauty-cover"], js: false,
    summary: "Is my date free? On the cover: open, on hold or taken from the artist's own Google Sheet, and \"Ask about this date\" on WhatsApp. Never says booked; an old or unreadable sheet asks the bride to message instead." },
  { id: "bridalbeauty-ready", section: "ready", dir: `${K}/bridalbeauty-ready`, minPlan: "starter", kits, requires: ["ready"], js: true,
    summary: "Before I arrive: what to have ready on the morning (clean skin, a chair by a window, a button-front top), in the artist's words, shared with the bridal party from her phone." },
  { id: "bridalbeauty-start", dir: `${K}/bridalbeauty-start`, minPlan: "plus", kits, requires: ["morning"], needs: ["bridalbeauty-cover", "bridalbeauty-packages"], js: false,
    summary: "What time do we start? A line on the cover: her ceremony time and how many are in the chair give the start, with the artist's early-start fee named when it applies." },
  { id: "bridalbeauty-looks", section: "season", dir: `${K}/bridalbeauty-looks`, minPlan: "plus", kits, requires: ["looks", "looksPage"], page: "looks", js: true,
    summary: "The look library: the artist's own brides, each look named for its makeup and hair with the minutes in the chair; four on the home page as This season, every one on its page, found by finish and by hair; \"Ask for this look\" on WhatsApp." },
  { id: "bridalbeauty-trial", dir: `${K}/bridalbeauty-trial`, minPlan: "plus", kits, requires: ["trial", "trialPage"], page: "trials", js: true,
    summary: "The trial page: the wedding date in, the weeks to have the trial in out; where, how long, the price, what to bring; a trial request on WhatsApp." },
  { id: "bridalbeauty-travel", section: "travel", dir: `${K}/bridalbeauty-travel`, minPlan: "plus", kits, requires: ["travel"], js: true,
    summary: "Travel by postcode: where she's getting ready in, free within the artist's area or the artist's fee for that district; anywhere else, ask." },
  { id: "bridalbeauty-bridal", dir: `${K}/bridalbeauty-bridal`, minPlan: "plus", kits, requires: ["bridalPage"], needs: ["bridalbeauty-packages"], page: "bridal", js: false,
    summary: "The bridal page: every package and extra, the booking terms in the artist's words, travel, and reviews." },
  { id: "bridalbeauty-party", section: "party", dir: `${K}/bridalbeauty-party`, minPlan: "signature", kits, requires: ["party", "morning"], needs: ["bridalbeauty-packages", "bridalbeauty-start"], js: true,
    summary: "Everyone in the chair: bridesmaids, mothers and children priced together from the artist's own prices, the early-start fee and a second artist added when the morning needs them, and the cover's start time moving with them; sent on WhatsApp for a quote." },
  { id: "bridalbeauty-morning", dir: `${K}/bridalbeauty-morning`, minPlan: "signature", kits, requires: ["morning", "morningPage"], needs: ["bridalbeauty-start", "bridalbeauty-packages"], page: "morning", js: true,
    summary: "The wedding morning, worked back: the ceremony time, who's in the chair and what each has, out comes everyone's slot, the start, the buffer and the dress, two artists when one would start too early; each person's slot in their calendar, the plan to the group from her phone." },
  { id: "bridalbeauty-skin", dir: `${K}/bridalbeauty-skin`, minPlan: "signature", kits, requires: ["skin", "skinPage"], page: "skin", js: true,
    summary: "Skin prep, counted down: the wedding date in, each step on its day in the artist's own words (the trial, nothing new, brows, the night before), into her calendar. Treatments are a question for a clinician, and the page says so." },
  { id: "bridalbeauty-guides", dir: `${K}/bridalbeauty-guides`, minPlan: "plus", kits, requires: ["guides"], page: "guide", js: false,
    summary: "Guide pages for the weddings she does (abroad, small weddings, Asian bridal, the bridal party, editorial): worked price examples taken from her packages, looks from her library, timings and the questions brides ask. Each page counts as a page." },
  { id: "bridalbeauty-journal", dir: `${K}/bridalbeauty-journal`, minPlan: "plus", kits, requires: ["journal"], page: "journal", morePages: ["article"], js: false,
    summary: "The journal: her own pieces (skin before the day, making makeup last, choosing a look), each its own page; counts as one page." },
];

/** Shared features a bridal hair and makeup artist never offers (a feed of her own posts, team pages and the rest belong to shops). */
export const refuses = ["gallery", "work", "seasonal", "photo-band", "page-links", "team", "vouchers", "custom-pages"];

/**
 * Checks this kit's settings in site.json (runs for every site; it returns early for other kits).
 * @param {any} site @param {(path: string, msg: string) => void} err @param {((rel: string) => boolean)|undefined} exists
 */
export const check = (site, err, exists) => checkBridalBeauty(site, err, exists, /** @type {{ id: string, page?: string }[]} */ (/** @type {unknown} */ (features)));

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** @param {any} site */
export function pageData(site) {
  const on = (/** @type {string[]} */ ...ids) => ids.some((id) => site.features.includes(id));
  const svc = (/** @type {any[]} */ l) => l.map((x) => ({ id: x.id, name: x.name, minutes: x.minutes, price: x.price }));
  const m = site.morning;
  return {
    dateCheck: on("bridalbeauty-dates") ? { source: site.dateCheck.source, csvUrl: site.dateCheck.csvUrl, staleAfterDays: site.dateCheck.staleAfterDays ?? 21, message: site.dateCheck.message } : null,
    packages: on("bridalbeauty-packages") ? { message: site.packages.message, bride: svc(site.packages.bride), party: svc(site.packages.party) } : null,
    morning: on("bridalbeauty-start") ? { message: m.message, ceremony: m.ceremony.default, travel: m.travelMinutes, dress: m.dressMinutes, buffer: m.bufferMinutes, early: m.earlyStart, second: m.secondArtist ?? null } : null,
    party: on("bridalbeauty-party") ? { message: site.party.message, start: site.party.start, max: site.party.max } : null,
    looks: on("bridalbeauty-looks") ? { message: site.looks.message } : null,
    trial: on("bridalbeauty-trial") ? { message: site.trial.message, earliestWeeks: site.trial.earliestWeeks, latestWeeks: site.trial.latestWeeks } : null,
    travel: on("bridalbeauty-travel") ? { message: site.travel.message, free: site.travel.free, zones: site.travel.zones } : null,
    skin: on("bridalbeauty-skin") ? { message: site.skin.message, steps: site.skin.steps } : null,
    place: [site.business.name, site.location.locality].filter(Boolean).join(", "),
  };
}

/**
 * Live data: simulated on a demo (src/demo), the artist's published Google Sheet otherwise.
 * @type {import("../../features/registry.js").Provider[]}
 */
export const providers = [
  {
    key: "diary",
    on: (site, enabled) => enabled.has("bridalbeauty-dates"),
    simulated: (site) => site.dateCheck?.source === "simulated",
    demo: { from: "src/demo/bridal-diary-provider.js", name: "simulatedDiary" },
    live: { from: "src/kits/bridalbeauty/features/bridalbeauty-dates/sheet-provider.js", name: "sheetDiary" },
  },
];

/** What this kit adds to the site's Content-Security-Policy: the artist's published Google Sheet. @param {any} site */
export function csp(site) {
  return { sheets: site.dateCheck?.source === "sheet" && site.features?.includes("bridalbeauty-dates") };
}
