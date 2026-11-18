// @ts-check
/**
 * The gym kit (premium gyms and health clubs): everything the shared build needs to know about it, in one file.
 * src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so adding or changing this kit never
 * edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself". The honesty rules every
 * site keeps (lawful prices, fresh counts only, booking in the club's own app): src/kits/gym/config.js.
 */
import { checkGym } from "./config.js";

const K = "src/kits/gym/features";
/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- gyms and health clubs (trade/gym) ---
  // Starter
  { id: "gym-count", dir: `${K}/gym-count`, minPlan: "starter", kits: ["gym"], requires: ["busy"], js: true,
    summary: "How busy it is (GYM-3): one number and one line in the hero, from the club's own usual count for this hour of this weekday, always said as \"usually\". With the live count (Signature) it becomes the door count, while it is fresh." },
  { id: "gym-timetable", section: "timetable", dir: `${K}/gym-timetable`, minPlan: "starter", kits: ["gym"], requires: ["classTypes", "timetable"], js: true,
    summary: "Classes (GYM-1): the rest of today and tomorrow from the club's own timetable, each with \"Book in the app\", a link straight to the club's booking app (Mindbody, Glofox, TeamUp)." },
  { id: "gym-memberships", dir: `${K}/gym-memberships`, minPlan: "starter", kits: ["gym"], requires: ["clubMemberships"], js: false,
    summary: "Memberships (GYM-2): each membership's total with every mandatory fee in it, worked out by the build (the DMCC Act's rule): the term's total for a contract, the first month's total for a rolling one, then what's included." },
  { id: "gym-friend", dir: `${K}/gym-friend`, minPlan: "starter", kits: ["gym"], requires: ["friendPass"], js: true,
    summary: "Bring a friend (GYM-11): the club's guest rules and a request (the friend's first name and the day) sent on WhatsApp." },
  // Plus
  { id: "gym-daypass", dir: `${K}/gym-daypass`, minPlan: "plus", kits: ["gym"], requires: ["dayPass"], js: true,
    summary: "A free day pass (GYM-5): pick a day and what you train for; the request goes to the club on WhatsApp." },
  { id: "gym-recovery", dir: `${K}/gym-recovery`, minPlan: "plus", kits: ["gym"], requires: ["recovery"], js: true,
    summary: "Heat and cold (GYM-10): the sauna and plunge slots by the half hour, each with \"Book in the app\"; places left only from a fresh sheet (Signature)." },
  { id: "gym-week", dir: `${K}/gym-week`, minPlan: "plus", kits: ["gym"], requires: ["timetable", "classTypes", "busy", "timetablePage"], needs: ["gym-timetable", "gym-count"], page: "timetable", js: true,
    summary: "The timetable page: the whole week, and how busy the club usually is hour by hour on the chosen day, with the hour now marked." },
  { id: "gym-membership-page", dir: `${K}/gym-membership-page`, minPlan: "plus", kits: ["gym"], requires: ["clubMemberships", "membershipPage"], needs: ["gym-memberships"], page: "memberships", js: false,
    summary: "The memberships page: the memberships with their lawful totals, the guest rules and the corporate rate, so the home page stays short." },
  { id: "gym-corporate", dir: `${K}/gym-corporate`, minPlan: "plus", kits: ["gym"], requires: ["corporate", "clubMemberships"], page: "corporate", js: true,
    summary: "Corporate rate (GYM-12): type your company and see its rate as a lawful total, from the club's own list; not listed, ask on WhatsApp." },
  { id: "gym-recovery-page", dir: `${K}/gym-recovery-page`, minPlan: "plus", kits: ["gym"], requires: ["recovery"], needs: ["gym-recovery"], page: "recovery", js: false,
    summary: "The heat and cold page: the rooms, the rules and every slot of the week." },
  { id: "gym-classes", dir: `${K}/gym-classes`, minPlan: "plus", kits: ["gym"], requires: ["classTypes", "timetable", "classFinder"], page: "classes", js: true,
    summary: "Class finder (GYM-4): choose what you train for, who it suits and the time of day; the club's own classes that fit, each with every time it runs this week and \"Book in the app\"." },
  { id: "gym-trial", dir: `${K}/gym-trial`, minPlan: "plus", kits: ["gym"], requires: ["dayPass", "trialPage"], needs: ["gym-daypass"], page: "trial", js: false,
    summary: "The free trial page (GYM-5): what the day includes, what happens when you arrive, and the day pass request (WhatsApp), so the home page stays short." },
  { id: "gym-tour", dir: `${K}/gym-tour`, minPlan: "plus", kits: ["gym"], requires: ["tour"], page: "club", js: true,
    summary: "The club, room by room (GYM-6): a photograph of each room large, with what's in it and the facts people ask (how many, step-free, towels). Choose a room from the list; without JavaScript every room is shown in turn." },
  { id: "gym-coaches", dir: `${K}/gym-coaches`, minPlan: "plus", kits: ["gym"], requires: ["coaches", "timetable", "classTypes"], page: "coaches", js: false,
    summary: "The coaches: each coach's photograph, qualifications as on their certificates, and the classes they take this week, read from the timetable." },
  { id: "gym-training", dir: `${K}/gym-training`, minPlan: "plus", kits: ["gym"], requires: ["training"], page: "training", js: false,
    summary: "Personal training: who it's for and the club's packs, each a lawful total with every mandatory fee in (the DMCC Act's rule), then the price a session; ask on WhatsApp." },
  { id: "gym-first", dir: `${K}/gym-first`, minPlan: "plus", kits: ["gym"], requires: ["firstVisit"], page: "first-visit", js: false,
    summary: "Your first visit: what to bring, what happens from the front desk to the floor, and the house rules. Directions stay on Plan your visit." },
  { id: "gym-app", dir: `${K}/gym-app`, minPlan: "plus", kits: ["gym"], requires: ["app"], page: "app", js: false,
    summary: "The app and booking: how to get the club's booking app, the booking rules in the club's words (when bookings open, cancelling, the waitlist) and links straight to it." },
  // Signature
  { id: "gym-live", dir: `${K}/gym-live`, minPlan: "signature", kits: ["gym"], requires: ["busy"], needs: ["gym-count"], js: true,
    summary: "The live count: the door count from the club's sheet in the hero, with its age, while it is under 15 minutes old; older or unreadable, the hero goes back to \"usually\"." },
  { id: "gym-spaces", dir: `${K}/gym-spaces`, minPlan: "signature", kits: ["gym"], requires: ["spaces"], needs: ["gym-timetable"], js: true,
    summary: "Places left (GYM-7): from the club's sheet, only while it is under 15 minutes old, on classes and heat and cold slots. Without a fresh sheet every session shows \"Book in the app\" and nothing else." },
  { id: "gym-hyrox", dir: `${K}/gym-hyrox`, minPlan: "signature", kits: ["gym"], requires: ["hyrox", "timetable", "classTypes"], js: true,
    summary: "Hyrox race prep (GYM-8): type the race date (dd/mm/yyyy) and the weeks to it are shared out over the club's phases, each with its dates and the club's own classes; every session goes into the calendar in one file. No results promised." },
  { id: "gym-hyrox-page", dir: `${K}/gym-hyrox-page`, minPlan: "signature", kits: ["gym"], requires: ["hyrox"], needs: ["gym-hyrox"], page: "hyrox", js: false,
    summary: "The Hyrox page: the race-prep planner, what each phase is for and the club's notes on race day." },
  { id: "gym-events", dir: `${K}/gym-events`, minPlan: "signature", kits: ["gym"], requires: ["events"], page: "events", morePages: ["event-ics"], js: true,
    summary: "Members' events (GYM-9): the club's own list, soonest first, the next one large; each goes into the calendar as one file (its time right in any time zone) and is booked in the app or asked about on WhatsApp. Past events leave by themselves." },
  { id: "gym-journal", dir: `${K}/gym-journal`, minPlan: "signature", kits: ["gym"], requires: ["journal"], page: "journal", morePages: ["article"], js: false,
    summary: "Journal: the club's own short articles (a first Hyrox, sauna and cold plunge, a weekly routine), each on its own page." },
];

/**
 * Shared features this trade doesn't offer: free-form pages that escape the price and count checks, before/after work
 * galleries, and the shared price and membership lists (a gym's prices go through clubMemberships, so the mandatory fees
 * are always in the total). The shared team page too: the gym's own coaches page (gym-coaches) reads each coach's
 * classes from the timetable. Not in this look: reviews, vouchers, gallery, photo-band, page-links, seasonal.
 */
export const refuses = ["custom-pages", "work", "before-after", "memberships", "price-list", "price-page", "team", "reviews", "vouchers", "gallery", "photo-band", "page-links", "seasonal"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkGym;

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** @param {any} site */
export function pageData(site) {
  const on = (/** @type {string} */ id) => site.features.includes(id);
  const live = on("gym-live") && site.busy?.live ? site.busy.live : null;
  return {
    gym: {
      name: site.business.name,
      place: [site.business.name, site.location.streetAddress, site.location.locality, site.location.postcode].filter(Boolean).join(", "),
      app: { name: site.booking.name, url: site.booking.url },
      busy: on("gym-count") ? { capacity: site.busy.capacity, usual: site.busy.usual } : null,
      live: live ? { source: live.source, csvUrl: live.csvUrl, staleAfterMinutes: live.staleAfterMinutes ?? 15 } : null,
      classes: Object.fromEntries((site.classTypes?.items ?? []).map((/** @type {any} */ c) => [c.id, { name: c.name, minutes: c.minutes, size: c.size ?? null }])),
      weekly: site.timetable?.weekly ?? {},
      recovery: on("gym-recovery") ? site.recovery.slots.map((/** @type {any} */ s) => ({ id: s.id, name: s.name, minutes: s.minutes, size: s.size, with: s.with ?? "", days: s.days, times: s.times, url: s.url ?? "" })) : null,
      spaces: on("gym-spaces") && site.spaces ? { source: site.spaces.source, csvUrl: site.spaces.csvUrl, staleAfterMinutes: site.spaces.staleAfterMinutes ?? 15 } : null,
      hyrox: on("gym-hyrox") ? { phases: site.hyrox.phases, taper: site.hyrox.taper, minWeeks: site.hyrox.minWeeks, maxWeeks: site.hyrox.maxWeeks, short: site.hyrox.short, long: site.hyrox.long } : null,
      friend: on("gym-friend") ? site.friendPass.message : null,
      dayPass: on("gym-daypass") ? site.dayPass.message : null,
      corporate: on("gym-corporate") ? { message: site.corporate.message, companies: site.corporate.companies } : null,
    },
  };
}

/**
 * Live data: simulated on a demo (src/demo), the club's published Google Sheet otherwise.
 * @type {import("../../features/registry.js").Provider[]}
 */
export const providers = [
  {
    key: "gymCount",
    on: (site, enabled) => enabled.has("gym-live") && !!site.busy?.live,
    simulated: (site) => site.busy.live.source === "simulated",
    demo: { from: "src/demo/gym-count-provider.js", name: "simulatedCount" },
    live: { from: "src/kits/gym/features/gym-live/sheet-provider.js", name: "sheetCount" },
  },
  {
    key: "gymPlaces",
    on: (site, enabled) => enabled.has("gym-spaces") && !!site.spaces,
    simulated: (site) => site.spaces.source === "simulated",
    demo: { from: "src/demo/gym-places-provider.js", name: "simulatedGymPlaces" },
    live: { from: "src/kits/gym/features/gym-spaces/sheet-provider.js", name: "sheetGymPlaces" },
  },
];

/** What this kit adds to the site's Content-Security-Policy: the club's published sheets. @param {any} site */
export function csp(site) {
  const f = site.features ?? [];
  return { sheets: (f.includes("gym-live") && site.busy?.live?.source === "sheet") || (f.includes("gym-spaces") && site.spaces?.source === "sheet") };
}
