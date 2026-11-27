// @ts-check
/**
 * The pop-up kit (pop-up shops and brand experiences: a brand that takes a space for days or weeks, and may tour):
 * everything the shared build needs to know about it, in one file. src/features/registry.js finds this file by itself,
 * so adding or changing this kit never edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit
 * registers itself".
 */
import { checkPopup } from "./config.js";

const K = "src/kits/popup/features";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- pop-up (trade/pop-up) ---
  // Starter: the run (dates, place, open now, days left, add to calendar). Plus: the rooms and how long a visit takes,
  // the opening countdown and waitlist, what's on, only here (sold out from the brand's sheet), private hire, the
  // brand's Instagram (the shared gallery through Behold). Signature: timed entry, the invitation, the queue now, the
  // tour, bring us to your city, past pop-ups, press and collaborations (the last two only with the brand's own).
  { id: "popup-run", dir: `${K}/popup-run`, minPlan: "starter", kits: ["popup"], requires: ["popup"], js: true,
    summary: "The run: the dates, the place and the days left, and one live line on whether to go (\"Open now, until 9pm\", \"Closed now. Opens tomorrow at 11am\", \"Opens 9 January\", \"Ended 9 December\"), worked out from the brand's own dates and hours in UK time; Add to calendar for the whole run. Outside the run the site never says open." },
  { id: "popup-rooms", section: "rooms", dir: `${K}/popup-rooms`, minPlan: "plus", kits: ["popup"], requires: ["rooms"], js: true,
    summary: "The rooms: each room or station of the experience with its photograph and the minutes it takes, and the whole visit door to door; choose a room to bring it forward and read its line." },
  { id: "popup-experience", dir: `${K}/popup-experience`, minPlan: "plus", kits: ["popup"], requires: ["rooms", "experiencePage"], needs: ["popup-rooms"], page: "experience", js: false,
    summary: "The experience page: every room in order, large, with its minutes and the brand's own words." },
  { id: "popup-waitlist", section: "waitlist", dir: `${K}/popup-waitlist`, minPlan: "plus", kits: ["popup"], requires: ["waitlist"], needs: ["popup-run"], page: "waitlist", js: true,
    summary: "The opening countdown and waitlist: the days until the next opening, from the brand's dates, and a way onto the brand's own list (its form, or a pre-filled WhatsApp). Never a count of people waiting." },
  { id: "popup-whats-on", dir: `${K}/popup-whats-on`, minPlan: "plus", kits: ["popup"], requires: ["programme"], needs: ["popup-run"], page: "whats-on", js: true,
    summary: "What's on: the dated programme (a launch night, a talk, a tasting), each with its day, times, total price and how to book; past ones drop off by themselves." },
  { id: "popup-only-here", dir: `${K}/popup-only-here`, minPlan: "plus", kits: ["popup"], requires: ["onlyHere"], page: "only-here", js: true,
    summary: "Only here: the pieces sold only at the pop-up, each with its total price; \"Sold out\" only from the brand's own stock sheet, and nothing marked at all when the sheet is old." },
  { id: "popup-hire", dir: `${K}/popup-hire`, minPlan: "plus", kits: ["popup"], requires: ["hirePage"], page: "private-hire", js: false,
    summary: "Private hire and groups: what the brand offers for a group or a private evening, in its own words and prices, and a pre-filled enquiry." },
  { id: "popup-slots", section: "slots", dir: `${K}/popup-slots`, minPlan: "signature", kits: ["popup"], requires: ["slots"], needs: ["popup-run"], page: "book", js: true,
    summary: "Timed entry: pick a day of the run, then a time; each time opens the brand's own booking page (with the day and time filled in where its link allows). Times come from the opening hours; it never says booked or few left." },
  { id: "popup-invite", dir: `${K}/popup-invite`, minPlan: "signature", kits: ["popup"], requires: ["invite"], needs: ["popup-slots"], js: true,
    summary: "The invitation: after choosing a time, a card with the day, time and place, drawn on the phone to save, and a WhatsApp message to send with it. It says plainly that it isn't a ticket." },
  { id: "popup-line", dir: `${K}/popup-line`, minPlan: "signature", kits: ["popup"], requires: ["line"], needs: ["popup-run"], js: true,
    summary: "The queue now: staff tap the wait into a Google Form; the run shows \"Queue about 20 minutes (at 2:05pm)\". Hidden after 30 minutes without an update, and whenever the pop-up is closed." },
  { id: "popup-tour", dir: `${K}/popup-tour`, minPlan: "signature", kits: ["popup"], requires: ["popup", "tourPage"], needs: ["popup-run"], page: "tour", js: true,
    summary: "The tour: every stop as a ticket and on a map of Britain, each with its own live state (on now, opens in N days, ended); choose one to book, be told when it opens, or see the past one." },
  { id: "popup-city", dir: `${K}/popup-city`, minPlan: "signature", kits: ["popup"], requires: ["city"], needs: ["popup-waitlist"], js: true,
    summary: "Bring us to your city: a city and an email (or a WhatsApp message) to the brand's own form. Shows no counts." },
  { id: "popup-past", dir: `${K}/popup-past`, minPlan: "signature", kits: ["popup"], requires: ["popup", "pastPage"], needs: ["popup-run"], page: "past", js: true,
    summary: "Past pop-ups: each ended stop with its place, dates and the brand's own photograph." },
  { id: "popup-press", dir: `${K}/popup-press`, minPlan: "signature", kits: ["popup"], requires: ["press"], page: "press", js: false,
    summary: "Press: the brand's real coverage, each with the outlet, the date and a link. Only ever the brand's own; client-only." },
  { id: "popup-partners", dir: `${K}/popup-partners`, minPlan: "signature", kits: ["popup"], requires: ["partners"], page: "collaborations", js: false,
    summary: "Collaborations: the brand's real partners and what they made together, with links. Only ever the brand's own; client-only." },
];

/** A pop-up lives on its dates: the run, the rooms and the times replace a team page, vouchers, link pages and seasonal banners. */
export const refuses = ["seasonal", "page-links", "vouchers", "team", "photo-band", "work"];
/** Press and collaborations exist only as the brand's own; reviews only ever come from its own Google reviews. */
export const clientOnly = ["popup-press", "popup-partners", "reviews"];
/** Top-level settings no feature lists: the responsible-drinking line for alcohol brands. */
export const settings = ["alcohol"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkPopup;

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** @param {any} site */
export function pageData(site) {
  const on = (/** @type {string} */ id) => site.features.includes(id);
  return {
    popup: { stops: site.popup.stops },
    slots: on("popup-slots") ? { every: site.slots.every ?? 30, lastBefore: site.slots.lastBefore ?? 60, url: site.slots.url } : null,
    stock: on("popup-only-here") ? { source: site.onlyHere.stock.source, csvUrl: site.onlyHere.stock.csvUrl, staleAfterDays: site.onlyHere.stock.staleAfterDays ?? 3, ids: site.onlyHere.items.map((/** @type {any} */ x) => x.id) } : null,
    line: on("popup-line") ? { source: site.line.source, csvUrl: site.line.csvUrl, staleAfterMinutes: site.line.staleAfterMinutes ?? 30 } : null,
    waitlist: on("popup-waitlist") ? { formUrl: site.waitlist.formUrl ?? "", message: site.waitlist.message } : null,
    city: on("popup-city") ? { formUrl: site.city.formUrl ?? "", message: site.city.message } : null,
    programme: on("popup-whats-on") ? { items: site.programme.items.map((/** @type {any} */ p) => ({ id: p.id, date: p.date })) } : null,
    name: site.business.name,
  };
}

/**
 * Live data: simulated on a demo (src/demo), the brand's own published Google Sheets otherwise.
 * @type {import("../../features/registry.js").Provider[]}
 */
export const providers = [
  {
    key: "popupStock",
    on: (site, enabled) => enabled.has("popup-only-here"),
    simulated: (site) => site.onlyHere?.stock?.source === "simulated",
    demo: { from: "src/demo/popup-stock-provider.js", name: "simulatedStock" },
    live: { from: "src/kits/popup/features/popup-only-here/sheet-provider.js", name: "sheetStock" },
  },
  {
    key: "popupLine",
    on: (site, enabled) => enabled.has("popup-line"),
    simulated: (site) => site.line?.source === "simulated",
    demo: { from: "src/demo/popup-line-provider.js", name: "simulatedLine" },
    live: { from: "src/kits/popup/features/popup-line/sheet-provider.js", name: "sheetLine" },
  },
];

/** What this kit adds to the security policy: the brand's published Google Sheets. @param {any} site */
export function csp(site) {
  const f = site.features ?? [];
  const sheets = (f.includes("popup-only-here") && site.onlyHere?.stock?.source === "sheet") || (f.includes("popup-line") && site.line?.source === "sheet");
  return { sheets };
}
