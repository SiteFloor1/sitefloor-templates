// @ts-check
/**
 * The nails kit (nail salons): everything the shared build needs to know about it, in one file.
 * src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so adding or changing this kit never
 * edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 */
import { checkNails } from "./config.js";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- nail salon (trade/nail-salon) ---
  { id: "shade-hand", dir: "src/kits/nails/features/shade-hand", minPlan: "starter", kits: ["nails"], requires: ["hero", "shades"], js: true,
    summary: "The hand in the hero and the house shades as flat swatches: tap one and the photo fades to the same hand wearing it (the salon's own photos), with its name, finish and number on a card and Book in that colour." },
  { id: "next-slot", dir: "src/kits/nails/features/next-slot", minPlan: "starter", kits: ["nails"], requires: ["nextSlot"], js: true,
    summary: "The next free appointment, from the salon's own Google Sheet, under the shade card; old or missing data says \"message us\" instead of a time." },
  { id: "menu-hours", section: "menu", dir: "src/kits/nails/features/menu-hours", minPlan: "starter", kits: ["nails"], requires: ["menu"], js: false,
    summary: "The menu by the hour: treatments grouped by how long they take (30, 60, 90 minutes), each with its price and one line, and a photo of the work for each band." },
  { id: "gel-biab", section: "gelBiab", dir: "src/kits/nails/features/gel-biab", minPlan: "starter", kits: ["nails"], requires: ["gelBiab"], js: false,
    summary: "Gel, BIAB or acrylic side by side in the salon's words: how long each lasts, what it's good for, removal and infills." },
  { id: "salon", section: "salon", dir: "src/kits/nails/features/salon", minPlan: "starter", kits: ["nails"], requires: ["salon"], js: false,
    summary: "The salon itself: the colour wall and a detail at the counter, side by side, with one line." },
  { id: "nail-menu", dir: "src/kits/nails/features/nail-menu", minPlan: "plus", kits: ["nails"], requires: ["menu", "menuPage"], needs: ["menu-hours"], page: "menu", js: false,
    summary: "The menu page: every treatment by the hour, then removals, policies and the questions people ask before booking." },
  { id: "shades-page", dir: "src/kits/nails/features/shades-page", minPlan: "plus", kits: ["nails"], requires: ["shades", "shadesPage"], page: "shades", js: true,
    summary: "House shades: every colour as a flat swatch with its number, finish and system, filtered by family; each one books in its own colour." },
  { id: "art-page", dir: "src/kits/nails/features/art-page", minPlan: "plus", kits: ["nails"], requires: ["art", "artPage"], page: "art", js: true,
    summary: "Nail art: the salon's sets by shape, length and level, each with its time and price, and \"Ask for this\" on WhatsApp." },
  { id: "shapes-page", dir: "src/kits/nails/features/shapes-page", minPlan: "plus", kits: ["nails"], requires: ["shapes", "shapesPage"], page: "shapes", js: false,
    summary: "Nail shapes: each shape the salon files, what it suits, shown on a real set." },
  { id: "monthly-edit", section: "edit", dir: "src/kits/nails/features/monthly-edit", minPlan: "plus", kits: ["nails"], requires: ["edit"], js: false,
    summary: "The monthly edit on the home page: three or four sets for the month, large, with time and price; it hides itself two weeks after the month ends." },
  { id: "nail-bridal", dir: "src/kits/nails/features/nail-bridal", minPlan: "plus", kits: ["nails"], requires: ["bridal", "bridalPage"], page: "bridal", js: false,
    summary: "Bridal nails: the trial and the final set in the salon's words, with a request on WhatsApp." },
  { id: "nail-gifts", dir: "src/kits/nails/features/nail-gifts", minPlan: "plus", kits: ["nails"], requires: ["giftPage"], page: "gifts", js: false,
    summary: "The gift page: vouchers with the card preview, on a page of their own." },
  { id: "infill-reminder", section: "infill", dir: "src/kits/nails/features/infill-reminder", minPlan: "plus", kits: ["nails"], requires: ["infill"], js: true,
    summary: "Infill reminder: the day of your set in, and your infill goes into your calendar at the gap the salon recommends." },
  { id: "usual-set", dir: "src/kits/nails/features/usual-set", minPlan: "plus", kits: ["nails"], requires: ["yourUsual"], js: true,
    summary: "Your usual: the set this phone last asked for, ready to send again in one tap; remembered only on the visitor's own phone." },
  { id: "shade-on-hand", dir: "src/kits/nails/features/shade-on-hand", minPlan: "signature", kits: ["nails"], requires: ["hero", "shades"], needs: ["shade-hand"], js: false,
    summary: "Shade on your hand: any house shade laid into the nails of the hero photo, with the photo's own light and gloss kept, on hands in different skin tones." },
  { id: "build-set", section: "buildSet", dir: "src/kits/nails/features/build-set", minPlan: "signature", kits: ["nails"], requires: ["buildSet", "shades"], js: true,
    summary: "Build your set: system, shape, length, finish, shade and art in, the time and price out from the salon's own figures, sent on WhatsApp." },
  { id: "nail-bridal-timeline", section: "bridalTimeline", dir: "src/kits/nails/features/nail-bridal-timeline", minPlan: "signature", kits: ["nails"], requires: ["bridal"], js: true,
    summary: "The bridal nails timeline: one wedding date in, the trial and the final set out in UK date order, added to her calendar in one file." },
  { id: "party-booking", section: "parties", dir: "src/kits/nails/features/party-booking", minPlan: "signature", kits: ["nails"], requires: ["parties", "menu"], js: true,
    summary: "Hen and bridal parties: the date, how many, and the treatments everyone wants, gathered into one WhatsApp message." },
  { id: "finish-clips", section: "finishes", dir: "src/kits/nails/features/finish-clips", minPlan: "signature", kits: ["nails"], requires: ["finishes"], js: true,
    summary: "The finish in motion: chrome, cat-eye, velvet and matte as real macro clips catching the light; a still first, the clip only on tap." },
];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkNails;

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** Config the nail salon's scripts need, only what the enabled features use. Shades and photos travel in the HTML. @param {any} site */
export function pageData(site) {
  const on = (/** @type {string[]} */ ...ids) => ids.some((id) => site.features.includes(id));
  const levelName = (/** @type {string} */ id) => site.art?.levels.find((/** @type {any} */ l) => l.id === id)?.name ?? id;
  return {
    nextSlot: on("next-slot") ? { source: site.nextSlot.source, csvUrl: site.nextSlot.csvUrl, staleAfterMinutes: site.nextSlot.staleAfterMinutes } : null,
    buildSet: on("build-set") ? { message: site.buildSet.message, systems: site.buildSet.systems, lengths: site.buildSet.lengths, finishes: site.buildSet.finishes, art: (site.buildSet.art ?? []).map((/** @type {any} */ a) => ({ ...a, name: a.name ?? levelName(a.level) })) } : null,
    nailShades: on("build-set") ? site.shades.items.map((/** @type {any} */ s) => ({ id: s.id, no: s.no, name: s.name })) : null,
    bridal: on("nail-bridal-timeline") ? { message: site.bridal.message, steps: site.bridal.steps } : null,
    parties: on("party-booking") ? { message: site.parties.message } : null,
    infill: on("infill-reminder") ? { weeks: site.infill.weeks, defaultWeeks: site.infill.defaultWeeks } : null,
    usual: on("usual-set") ? { message: site.yourUsual.message } : null,
    place: [site.business.name, site.location.streetAddress, site.location.locality, site.location.postcode].filter(Boolean).join(", "),
    url: site.url,
  };
}

/**
 * Live data: simulated on a demo (src/demo), the client's published Google Sheet otherwise.
 * @type {import("../../features/registry.js").Provider[]}
 */
export const providers = [
  {
    key: "slot",
    on: (site, enabled) => enabled.has("next-slot"),
    simulated: (site) => site.nextSlot?.source === "simulated",
    demo: { from: "src/demo/slot-provider.js", name: "simulatedSlot" },
    live: { from: "src/kits/nails/features/next-slot/sheet-provider.js", name: "sheetSlot" },
  },
];

/**
 * What this kit adds to the site's Content-Security-Policy (src/core/lib/seo.js): `sheets` when it reads a published
 * Google Sheet, and any other sources.
 * @param {any} site @returns {import("../../features/registry.js").KitCsp}
 */
export function csp(site) {
  return { sheets: site.nextSlot?.source === "sheet" && site.features?.includes("next-slot") }; // the next free appointment
}
