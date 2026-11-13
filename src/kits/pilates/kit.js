// @ts-check
/**
 * The pilates kit (reformer pilates studios): everything the shared build needs to know about it, in one file.
 * src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so adding or changing this kit never
 * edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 */
import { checkPilates } from "./config.js";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // Pilates (reformer studios)
  { id: "timetable", section: "timetable", dir: "src/kits/pilates/features/timetable", minPlan: "starter", kits: ["pilates"], requires: ["timetable", "classTypes"], js: true,
    summary: "Today's classes along the foot of the hero and the week below, from the studio's own timetable; days the studio is closed show no classes; times move on by themselves as the day goes." },
  { id: "class-types", section: "classTypes", dir: "src/kits/pilates/features/class-types", minPlan: "starter", kits: ["pilates"], requires: ["classTypes"], js: false,
    summary: "The studio's classes: each one's name, length, level and one line on what it's like, in the studio's words." },
  { id: "first-class", section: "firstClass", dir: "src/kits/pilates/features/first-class", minPlan: "starter", kits: ["pilates"], requires: ["firstClass", "classTypes"], js: false,
    summary: "Your first class: which class to book and what happens, step by step (arrive early, grip socks, tell the teacher), in the studio's words." },
  { id: "spaces-left", dir: "src/kits/pilates/features/spaces-left", minPlan: "plus", kits: ["pilates"], requires: ["places"], needs: ["timetable"], js: true,
    summary: "Places left in each class, drawn as the room's reformers (filled booked, open free), from the studio's Google Sheet. A stale or unreadable sheet shows no places rather than wrong ones." },
  { id: "intro-card", section: "introCard", dir: "src/kits/pilates/features/intro-card", minPlan: "plus", kits: ["pilates"], requires: ["introCard"], js: false,
    summary: "The intro offer as a class card, punched at the desk once per class, bought with the studio's own Stripe Payment Link." },
  { id: "your-week", dir: "src/kits/pilates/features/your-week", minPlan: "plus", kits: ["pilates"], requires: ["timetable"], needs: ["timetable"], js: true,
    summary: "Your week: tick classes on the timetable and add them all to the phone's calendar in one file, at the studio's time." },
  { id: "class-finder", section: "classFinder", dir: "src/kits/pilates/features/class-finder", minPlan: "plus", kits: ["pilates"], requires: ["classFinder"], needs: ["timetable"], js: true,
    summary: "Find your first class: three taps (new or returning, pace, pregnant or postnatal) name the studio's chosen class and its next three times." },
  { id: "waitlist", dir: "src/kits/pilates/features/waitlist", minPlan: "plus", kits: ["pilates"], requires: ["waitlist"], needs: ["spaces-left"], js: true,
    summary: "The waitlist: on a full class, one tap sends the studio a pre-filled WhatsApp asking for the next place. The studio decides who gets it." },
  { id: "gift-cards", section: "giftCards", dir: "src/kits/pilates/features/gift-cards", minPlan: "plus", kits: ["pilates"], requires: ["giftCards"], js: true,
    summary: "Gift class cards: choose a card, write who it's for and a line; pay with the studio's own Stripe link and send the details on WhatsApp so the studio can write and hand over the card." },
  { id: "classes-page", dir: "src/kits/pilates/features/classes-page", minPlan: "plus", kits: ["pilates"], requires: ["classesPage"], page: "classes", js: false,
    summary: "A page for the classes, the first class, the class finder and the reformer clip, so the home page stays short." },
  { id: "studio-gifts", dir: "src/kits/pilates/features/studio-gifts", minPlan: "plus", kits: ["pilates"], requires: ["giftsPage"], page: "gifts", js: false,
    summary: "A page for gift class cards and vouchers, kept off the home page." },
  { id: "pack-calculator", section: "packs", dir: "src/kits/pilates/features/pack-calculator", minPlan: "plus", kits: ["pilates"], requires: ["packs"], js: true,
    summary: "Packs and memberships: say how often you come and see what each way of paying costs a month and a class, cheapest first, from the studio's own prices; packs that would run out unused are counted honestly." },
  { id: "class-pages", dir: "src/kits/pilates/features/class-pages", minPlan: "signature", kits: ["pilates"], requires: ["classTypes", "timetable"], needs: ["timetable"], page: "class", js: true,
    summary: "A page for each class: who it's for, what happens, its next times with places, and who teaches it." },
  { id: "teacher-pages", dir: "src/kits/pilates/features/teacher-pages", minPlan: "signature", kits: ["pilates"], requires: ["teacherPages", "staff"], needs: ["team"], page: "teacher", js: false,
    summary: "A page for each teacher: their training in their words, their classes this week from the timetable, and a private session request." },
  { id: "method-library", dir: "src/kits/pilates/features/method-library", minPlan: "signature", kits: ["pilates"], requires: ["method"], page: "method", morePages: ["exercise"], js: false,
    summary: "The method library: a page for each core exercise, with a photograph, what it works, the usual springs, the easier and harder versions, and the classes it comes up in, in the studio's words." },
  { id: "reformer-settings", dir: "src/kits/pilates/features/reformer-settings", minPlan: "signature", kits: ["pilates"], requires: ["machine"], page: "settings", unlisted: true, js: true,
    summary: "Your reformer settings: the teacher fills in a client's springs, footbar, headrest, straps and gear after their first class and sends the link; the settings live in the link (nothing is stored) and can be kept on the phone." },
  { id: "class-passport", dir: "src/kits/pilates/features/class-passport", minPlan: "signature", kits: ["pilates"], requires: ["passport"], page: "passport", js: true,
    summary: "The class passport: a member types their code and sees what's left on their card, when it expires, classes this month and in all, and their next milestone, from the studio's sheet (no names in it). Fails closed." },
  { id: "prenatal-guide", dir: "src/kits/pilates/features/prenatal-guide", minPlan: "signature", kits: ["pilates"], requires: ["prenatal"], page: "prenatal", js: false,
    summary: "Pregnancy and after: which class at which stage, the go-ahead from a GP or midwife first, in the studio's words, and a question on WhatsApp." },
  { id: "private-hire", dir: "src/kits/pilates/features/private-hire", minPlan: "signature", kits: ["pilates"], requires: ["studioHire"], page: "hire", js: true,
    summary: "Private hire and team classes: what's included, how many, and a request (which, the date, how many, a company name) sent on WhatsApp." },
  { id: "workshops", dir: "src/kits/pilates/features/workshops", minPlan: "signature", kits: ["pilates"], requires: ["workshops"], page: "workshops", js: true,
    summary: "Workshops and events: dated sessions with the teacher, length and places; each into the calendar in one tap, a place by the studio's Stripe link or WhatsApp; past ones drop off." },
  { id: "private-page", dir: "src/kits/pilates/features/private-page", minPlan: "signature", kits: ["pilates"], requires: ["privatePage"], page: "private", js: true,
    summary: "Private and duet sessions: what each is, the assessment first, and a request (one-to-one or duet, what it's for, when suits) sent on WhatsApp for the studio to offer a time." },
  { id: "retreats-page", dir: "src/kits/pilates/features/retreats-page", minPlan: "signature", kits: ["pilates"], requires: ["retreats"], page: "retreats", morePages: ["retreat"], js: true,
    summary: "Retreats: where, when, what's included and the studio's deposit link; ones that have finished drop off by themselves; a waiting list by the studio's own Google Form. Each retreat has its own page: day by day, the rooms, places left as the studio last counted, and how long until the balance is due." },
  { id: "reformer-clip", section: "reformerClip", dir: "src/kits/pilates/features/reformer-clip", minPlan: "signature", kits: ["pilates"], requires: ["reformerClip"], js: true,
    summary: "The reformer, explained: a real clip of a teacher showing a first-timer onto the reformer, the picture first and the film on tap, captioned in the studio's words." },
];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkPilates;

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** Config the pilates scripts need, only what the enabled features use. @param {any} site */
export function pageData(site) {
  const on = (/** @type {string[]} */ ...ids) => ids.some((id) => site.features.includes(id));
  return {
    pilates: {
      reformers: site.timetable?.reformers ?? 0,
      weekly: site.timetable?.weekly ?? {},
      classes: Object.fromEntries((site.classTypes?.items ?? []).map((/** @type {any} */ c) => [c.id, { name: c.name, minutes: c.minutes, level: c.level ?? "", text: c.text }])),
      book: site.messages.book,
      places: on("spaces-left") && site.places ? { source: site.places.source, csvUrl: site.places.csvUrl, staleAfterMinutes: site.places.staleAfterMinutes } : null,
      waitlist: on("waitlist") && on("spaces-left") ? site.waitlist.message : null,
      finder: on("class-finder") ? site.classFinder : null,
      gifts: on("gift-cards") ? { message: site.giftCards.message, items: site.giftCards.items.map((/** @type {any} */ g) => ({ id: g.id, name: g.name, payLink: g.payLink })) } : null,
      privateMessage: on("private-page") ? site.privatePage.message : null,
      hireMessage: on("private-hire") ? site.studioHire.message : null,
      machine: on("reformer-settings") ? site.machine : null,
      passport: on("class-passport") && site.passport ? { source: site.passport.source, csvUrl: site.passport.csvUrl, staleAfterHours: site.passport.staleAfterHours, milestones: site.passport.milestones } : null,
      packs: on("pack-calculator") ? site.packs : null,
      place: [site.business.name, site.location.streetAddress, site.location.locality, site.location.postcode].filter(Boolean).join(", "),
    },
  };
}

/**
 * Live data: simulated on a demo (src/demo), the client's published Google Sheet otherwise.
 * @type {import("../../features/registry.js").Provider[]}
 */
export const providers = [
  {
    key: "places",
    on: (site, enabled) => enabled.has("spaces-left") && !!site.places,
    simulated: (site) => site.places.source === "simulated",
    demo: { from: "src/demo/places-provider.js", name: "simulatedPlaces" },
    live: { from: "src/kits/pilates/features/spaces-left/sheet-provider.js", name: "sheetPlaces" },
  },
  {
    key: "passport",
    on: (site, enabled) => enabled.has("class-passport") && !!site.passport,
    simulated: (site) => site.passport.source === "simulated",
    demo: { from: "src/demo/passport-provider.js", name: "simulatedPassport" },
    live: { from: "src/kits/pilates/features/class-passport/sheet-provider.js", name: "sheetPassport" },
  },
];

/**
 * What this kit adds to the site's Content-Security-Policy (src/core/lib/seo.js): `sheets` when it reads a published
 * Google Sheet, and any other sources.
 * @param {any} site @returns {import("../../features/registry.js").KitCsp}
 */
export function csp(site) {
  // Places and the class passport, each from the studio's own sheet.
  return { sheets: (site.places?.source === "sheet" && site.features?.includes("spaces-left")) || (site.passport?.source === "sheet" && site.features?.includes("class-passport")) };
}
