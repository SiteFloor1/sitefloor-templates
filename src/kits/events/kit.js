// @ts-check
/**
 * The events kit (event designers and producers): everything the shared build needs to know about it, in one file.
 * src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so adding or changing this kit
 * never edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 */
import { checkEvents } from "./config.js";

const K = "src/kits/events/features";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- events (trade/events) ---
  // Agencies that design and produce weddings, dinners and launches: the room on the night is the product. Starter:
  // the rooms (the agency's own photographs) with an enquiry each, and the date check from their sheet. Plus: the
  // portfolio with rooms for your number, a page per occasion, Start your event (the brief as a short form, with key
  // dates to the calendar) and the journal. Signature: See your room before the day (design visuals, always labelled),
  // Lay the table, the sample run of the night, case studies, the venue directory, the room drawn for your number and
  // the private proposal page by code.
  { id: "events-rooms", section: "rooms", dir: `${K}/events-rooms`, minPlan: "starter", kits: ["events"], requires: ["rooms"], js: false,
    summary: "The rooms (EVT-1): the agency's own photographs of rooms on the night, each with the occasion and how many it held, and an enquiry on WhatsApp that names the room." },
  { id: "events-dates", dir: `${K}/events-dates`, minPlan: "starter", kits: ["events"], requires: ["dates"], js: true,
    summary: "Is your date free? (EVT-3): pick a date and see free, on hold or taken, and the next free Saturday (or the agency's usual days), from the agency's published sheet. Says so and asks them to message when the sheet is out of date." },
  { id: "events-portfolio", dir: `${K}/events-portfolio`, minPlan: "plus", kits: ["events"], requires: ["rooms"], needs: ["events-rooms"], page: "rooms", js: true,
    summary: "The portfolio, with rooms for your number: every room large, filtered by the occasion and how many guests, closest first; says so when none is near." },
  { id: "events-occasions", dir: `${K}/events-occasions`, minPlan: "plus", kits: ["events"], requires: ["occasions"], page: "occasion", collection: true, js: false,
    summary: "A page per occasion or service (weddings, companies, private parties, launches, design and styling, production, destination events): the agency's words, a photograph and the rooms that match. The pages count as one." },
  { id: "events-brief", dir: `${K}/events-brief`, minPlan: "plus", kits: ["events"], requires: ["brief"], page: "start", js: true,
    summary: "Start your event (EVT-2): a short form (occasion, date, guests, budget band, venue) that becomes one tidy message on WhatsApp or email. With the date check on, it says whether the date is free as they choose it." },
  { id: "events-key-dates", dir: `${K}/events-key-dates`, minPlan: "plus", kits: ["events"], requires: ["keyDates"], needs: ["events-brief"], js: true,
    summary: "Key dates to your calendar: the agency's own milestones (final numbers, the tasting, the site visit) worked back from the event date and saved as one calendar file." },
  { id: "events-journal", dir: `${K}/events-journal`, minPlan: "plus", kits: ["events"], requires: ["journal"], page: "journal", morePages: ["article"], collection: true, js: false,
    summary: "The journal: the agency's articles (planning timelines, choosing a venue), a page each. The articles count as one page." },
  { id: "events-visuals", section: "visuals", dir: `${K}/events-visuals`, minPlan: "signature", kits: ["events"], requires: ["visuals"], js: true,
    summary: "See your room before the day: the agency's design visuals of a proposed room, up to four views of one set, always labelled \"A design visual\" and never shown among past events." },
  { id: "events-lay-table", section: "layTable", dir: `${K}/events-lay-table`, minPlan: "signature", kits: ["events"], requires: ["layTable"], js: true,
    summary: "Lay the table: three dressings of one table seen from one camera (for example candlelight, then greenery, then flowers), to choose between; always labelled as design visuals." },
  { id: "events-run", dir: `${K}/events-run`, minPlan: "signature", kits: ["events"], requires: ["runOfShow"], page: "run-of-the-night", js: false,
    summary: "The sample run of the night (EVT-4): set-up to hand-back as a printed running order, always labelled a sample." },
  { id: "events-cases", dir: `${K}/events-cases`, minPlan: "signature", kits: ["events"], requires: ["cases"], page: "case-studies", morePages: ["case"], collection: true, js: false,
    summary: "Case studies (EVT-5): the brief, the room and the mood in the agency's words, with their photographs of that event. The case studies count as one page." },
  { id: "events-venues", dir: `${K}/events-venues`, minPlan: "signature", kits: ["events"], requires: ["venues"], page: "venues", js: false,
    summary: "Venues (EVT-6): the rooms the agency works in, as they list them (area, kind, seated and standing), grouped by area. Never names a venue as a partner unless the agency says so." },
  { id: "events-room-plan", dir: `${K}/events-room-plan`, minPlan: "signature", kits: ["events"], requires: ["roomPlan"], page: "your-room", js: true,
    summary: "Your room, drawn (EVT-7): choose a room from the agency's list, the guests and long tables, rounds or standing; the plan redraws to scale and says when it won't fit. A guide; the venue's own capacity and rules decide." },
  { id: "events-proposal", dir: `${K}/events-proposal`, minPlan: "signature", kits: ["events"], requires: ["proposal", "visuals"], needs: ["events-visuals"], page: "your-proposal", unlisted: true, js: true,
    summary: "Your proposal, by code: the code the agency sends opens the design visuals, the date and days to go, the guests and the room drawn. From the agency's published sheet, which holds only codes, set names, rooms, numbers and dates; nothing personal." },
];

// A room on the night sells on the agency's own photographs; nothing here needs a photo feed, team grid or vouchers.
export const refuses = ["gallery", "work", "team", "photo-band", "page-links", "seasonal", "vouchers"];
// Reviews only ever come from the agency's own Google reviews.
export const clientOnly = ["reviews"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkEvents;

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** @param {any} site */
export function pageData(site) {
  const on = (/** @type {string} */ id) => site.features.includes(id);
  const d = site.dates, p = site.proposal;
  return {
    events: {
      name: site.business.name,
      host: new URL(site.url).host,
      dates: on("events-dates") ? { source: d.source, csvUrl: d.csvUrl, staleAfterDays: d.staleAfterDays ?? 7, days: d.days ?? ["sat"], leadDays: d.leadDays ?? 14 } : null,
      rooms: on("events-portfolio") ? site.rooms.items.map((/** @type {any} */ r) => ({ id: r.id, guests: r.guests, occasion: r.occasion })) : null,
      keyDates: on("events-key-dates") ? site.keyDates.items : null,
      roomPlan: on("events-room-plan") || on("events-proposal") && site.roomPlan ? site.roomPlan?.rooms ?? null : null,
      proposal: on("events-proposal") ? { source: p.source, csvUrl: p.csvUrl, staleAfterDays: p.staleAfterDays ?? 21, example: site.mode === "demo" ? p.example : undefined,
        sets: site.visuals.sets.map((/** @type {any} */ s) => s.id) } : null,
    },
  };
}

/**
 * Live data: the date check and the private proposal read simulations on a demo (src/demo), the agency's published
 * sheets otherwise.
 * @type {import("../../features/registry.js").Provider[]}
 */
export const providers = [
  {
    key: "eventDates",
    on: (site, enabled) => enabled.has("events-dates"),
    simulated: (site) => site.dates?.source === "simulated",
    demo: { from: "src/demo/event-dates-provider.js", name: "simulatedEventDates" },
    live: { from: "src/kits/events/features/events-dates/sheet-provider.js", name: "sheetEventDates" },
  },
  {
    key: "proposal",
    on: (site, enabled) => enabled.has("events-proposal"),
    simulated: (site) => site.proposal?.source === "simulated",
    demo: { from: "src/demo/proposal-provider.js", name: "simulatedProposal" },
    live: { from: "src/kits/events/features/events-proposal/sheet-provider.js", name: "sheetProposal" },
  },
];

/** What this kit adds to the site's Content-Security-Policy. @param {any} site @returns {import("../../features/registry.js").KitCsp} */
export function csp(site) {
  const f = site.features ?? [];
  return { sheets: (f.includes("events-dates") && site.dates?.source === "sheet") || (f.includes("events-proposal") && site.proposal?.source === "sheet") };
}
