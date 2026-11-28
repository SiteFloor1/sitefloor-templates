// @ts-check
/**
 * The stalls kit (street-food and dessert stalls that trade at markets and pop-ups and take party bookings): everything
 * the shared build needs to know about it, in one file. src/features/registry.js finds this file by itself (every
 * src/kits/<kit>/kit.js), so adding or changing this kit never edits a shared file. What each export is for:
 * docs/ARCHITECTURE.md, "A kit registers itself".
 */
import { checkStalls } from "./config.js";

const K = "src/kits/stalls/features";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- stalls (trade/stalls) ---
  // Instagram- and TikTok-led stalls (bubble waffles, candy floss, churros, pancakes, bubble tea, loaded fries). Starter:
  // where to find us this week and the menu with prices and allergens; Plus: the menu, where-to-find-us, parties,
  // book-us and allergens pages, the latest posts, the pitch finder (client-only) and the rain check (sold as an
  // add-on); Signature: the next-stop countdown, sold out today, the board as a picture, the set-up card, drop alerts.
  { id: "stalls-where", section: "where", dir: `${K}/stalls-where`, minPlan: "starter", kits: ["stalls"], requires: ["stops"], js: true,
    summary: "Where to find us this week: the stall's stops from its own Google Sheet, soonest first, \"Here now\" while it trades, cancelled stops marked; Directions (a maps search) and Add to calendar on each. An old or unreadable sheet shows the usual week as \"usually\" and points to Instagram." },
  { id: "stalls-menu", section: "menu", dir: `${K}/stalls-menu`, minPlan: "starter", kits: ["stalls"], requires: ["menu"], js: false,
    summary: "The menu: each item with its price, a short line, the 14 allergens by code from the stall's own chart, and vegan marks." },
  { id: "stalls-menu-page", dir: `${K}/stalls-menu-page`, minPlan: "plus", kits: ["stalls"], requires: ["menu", "menuPage"], needs: ["stalls-menu"], page: "menu", js: false,
    summary: "Menu and packages page: the whole menu with photos and the party packages the stall offers, in its own words and prices." },
  { id: "stalls-find", dir: `${K}/stalls-find`, minPlan: "plus", kits: ["stalls"], requires: ["stops", "findPage"], needs: ["stalls-where"], page: "find-us", js: false,
    summary: "Where to find us page: the whole week from the sheet, then the regular markets with their usual days and a line on how to find the pitch." },
  { id: "stalls-pitch", dir: `${K}/stalls-pitch`, minPlan: "plus", kits: ["stalls"], requires: ["stops"], needs: ["stalls-find"], js: false,
    summary: "Pitch finder: on the Where to find us page, the stall's own photo of its pitch at each regular market with one line (\"Look for the pink awning by the clock\"). Needs the stall's own photographs, so it is client-only." },
  { id: "stalls-posts", section: "posts", dir: `${K}/stalls-posts`, minPlan: "plus", kits: ["stalls"], requires: ["posts"], js: false,
    summary: "The latest posts: the stall's chosen TikToks as linked covers (links, never embeds, so no TikTok scripts load) beside its Instagram, which the shared gallery shows through Behold." },
  { id: "stalls-book", section: "party", dir: `${K}/stalls-book`, minPlan: "plus", kits: ["stalls"], requires: ["party", "bookPage"], page: "book-us", js: true,
    summary: "Book us for your party: is the date free (from the stall's own sheet; never says booked), then the kind of party, guests and postcode sent as one WhatsApp message. A short version sits low on the home page." },
  { id: "stalls-parties", dir: `${K}/stalls-parties`, minPlan: "plus", kits: ["stalls"], requires: ["partiesPage"], page: "parties", js: false,
    summary: "Parties and private hire page: what the stall brings to a party, a school fair or an office, in its own words, with its packages and a way to book." },
  { id: "stalls-allergens", dir: `${K}/stalls-allergens`, minPlan: "plus", kits: ["stalls"], requires: ["allergensPage"], needs: ["stalls-menu"], page: "allergens", js: false,
    summary: "Allergens and food hygiene page: the full allergen chart for every item, how the stall handles cross-contact in its own words, and its food hygiene rating linked to the Food Standards Agency." },
  { id: "stalls-rain", dir: `${K}/stalls-rain`, minPlan: "plus", kits: ["stalls"], requires: ["rain"], needs: ["stalls-where"], js: true,
    summary: "Rain check (sold as an add-on): on a stop's day, MET Norway's forecast for that market, through the shared weather function (\"Rain forecast from 15:00\"). Only the stall's sheet ever cancels a stop." },
  { id: "stalls-next", dir: `${K}/stalls-next`, minPlan: "signature", kits: ["stalls"], requires: ["stops"], needs: ["stalls-where"], js: true,
    summary: "The next stop, in the hero: where and when, with a countdown that ticks once a minute (\"Opens in 1d 10h 52m\"), or \"Here now\" and the closing time; Directions and Add to calendar. Worked out from the same sheet." },
  { id: "stalls-sold-out", dir: `${K}/stalls-sold-out`, minPlan: "signature", kits: ["stalls"], requires: ["soldOut"], needs: ["stalls-menu"], js: true,
    summary: "Sold out today: the stall taps it into a Google Form on its phone; the menu strikes the item through with the time. Only today's rows count, so nothing carries over to tomorrow." },
  { id: "stalls-board", dir: `${K}/stalls-board`, minPlan: "signature", kits: ["stalls"], requires: ["menu"], needs: ["stalls-menu"], js: true,
    summary: "Today's board as a picture: the next stop and the menu, with today's sold-out lines and the allergen key, drawn as a 1080 × 1350 image to save and post." },
  { id: "stalls-setup", section: "setup", dir: `${K}/stalls-setup`, minPlan: "signature", kits: ["stalls"], requires: ["setup"], js: true,
    summary: "The set-up card: pitch size, power, cover, water and arrival time in the stall's own figures, copied or sent on WhatsApp to an organiser or venue." },
  { id: "stalls-drop", section: "drop", dir: `${K}/stalls-drop`, minPlan: "signature", kits: ["stalls"], requires: ["drop"], js: false,
    summary: "Drop alert: a one-off flavour or pop-up on its date, with \"Tell me\" that asks to join the stall's WhatsApp broadcast list. No promise of stock." },
];

/**
 * A stall moves, so the Where to find us page replaces Plan your visit; the board, the posts and the drop replace a
 * work page, seasonal banners, link pages, gift vouchers, a team page and photo bands.
 */
export const refuses = ["plan-visit", "seasonal", "work", "page-links", "vouchers", "team", "photo-band"];
/** The pitch finder needs the stall's own photo of each pitch; reviews only ever come from the stall's own Google reviews. */
export const clientOnly = ["stalls-pitch", "reviews"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkStalls;

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** @param {any} site */
export function pageData(site) {
  const on = (/** @type {string[]} */ ...ids) => ids.some((id) => site.features.includes(id));
  const S = site.stops;
  return {
    stops: on("stalls-where") ? {
      source: S.source, csvUrl: S.csvUrl, staleAfterDays: S.staleAfterDays ?? 10, pattern: S.usual,
      places: S.places.map((/** @type {any} */ p) => ({ id: p.id, name: p.name, market: p.market ?? "", postcode: p.postcode, lat: p.lat, lon: p.lon })),
    } : null,
    soldOut: on("stalls-sold-out") ? { source: site.soldOut.source, csvUrl: site.soldOut.csvUrl } : null,
    menu: on("stalls-board") ? { key: site.menu.key ?? "", items: site.menu.items.map((/** @type {any} */ i) => ({ name: i.name, price: i.price, allergens: i.allergens ?? "", vegan: i.vegan === true })) } : null,
    party: on("stalls-book") ? { source: site.party.source, csvUrl: site.party.csvUrl, staleAfterDays: site.party.staleAfterDays ?? 21, message: site.party.message, kinds: site.party.kinds } : null,
    setup: on("stalls-setup") ? { rows: site.setup.rows } : null,
    rain: on("stalls-rain") ? { source: site.rain.source } : null,
    name: site.business.name,
  };
}

/**
 * Live data: simulated on a demo (src/demo), the stall's own published Google Sheets otherwise. The rain check's
 * forecast comes from the shared weather function (src/core/js/weather.js), with the markets listed in `weather`.
 * @type {import("../../features/registry.js").Provider[]}
 */
export const providers = [
  {
    key: "stalls",
    on: (site, enabled) => enabled.has("stalls-where"),
    simulated: (site) => site.stops?.source === "simulated",
    demo: { from: "src/demo/stalls-stops-provider.js", name: "simulatedStops" },
    live: { from: "src/kits/stalls/features/stalls-where/sheet-provider.js", name: "sheetStops" },
  },
  {
    key: "stallsSoldOut",
    on: (site, enabled) => enabled.has("stalls-sold-out"),
    simulated: (site) => site.soldOut?.source === "simulated",
    demo: { from: "src/demo/stalls-sold-out-provider.js", name: "simulatedSoldOut" },
    live: { from: "src/kits/stalls/features/stalls-sold-out/sheet-provider.js", name: "sheetSoldOut" },
  },
  {
    key: "stallsParty",
    on: (site, enabled) => enabled.has("stalls-book"),
    simulated: (site) => site.party?.source === "simulated",
    demo: { from: "src/demo/stalls-party-provider.js", name: "simulatedPartyDates" },
    live: { from: "src/kits/stalls/features/stalls-book/sheet-provider.js", name: "sheetPartyDates" },
  },
];

/** The markets the rain check reads MET Norway's forecast for (src/core/lib/met.js). @param {any} site */
export function weather(site) {
  if (!(site.features ?? []).includes("stalls-rain")) return [];
  return (site.stops?.places ?? []).filter((/** @type {any} */ p) => typeof p.lat === "number" && typeof p.lon === "number").map((/** @type {any} */ p) => ({ id: p.id, lat: p.lat, lon: p.lon }));
}

/** What this kit adds to the security policy: the stall's published Google Sheets (the forecast is the site's own /weather). @param {any} site */
export function csp(site) {
  const f = site.features ?? [];
  const sheets = (f.includes("stalls-where") && site.stops?.source === "sheet")
    || (f.includes("stalls-sold-out") && site.soldOut?.source === "sheet")
    || (f.includes("stalls-book") && site.party?.source === "sheet");
  return { sheets, connect: [] };
}
