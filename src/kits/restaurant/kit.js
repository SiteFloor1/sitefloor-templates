// @ts-check
/**
 * The restaurant kit (restaurants, cafés and grand cafés): everything the shared build needs to know about it, in one file.
 * src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so adding or changing this kit never
 * edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 */
import { checkRestaurant } from "./config.js";
import { createHash } from "node:crypto";
import { daypartMeta, DAYPART_SCRIPT } from "../../core/lib/daypart.js";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // Restaurant kit. Starter and Plus carry most of it; Signature keeps the three showpieces.
  { id: "menu", section: "menu", dir: "src/kits/restaurant/features/menu", minPlan: "starter", kits: ["restaurant"], requires: ["menu"], js: true,
    summary: "The menu on the home page: the sitting being served now (lunch, dinner…) with \"kitchen open until…\", diet filters, and the 14 allergens on every dish from the restaurant's own chart." },
  { id: "specials", section: "specials", dir: "src/kits/restaurant/features/specials", minPlan: "starter", kits: ["restaurant"], requires: ["tonight", "menu"], js: true,
    summary: "Today's specials and sold-out dishes from a Google Sheet the restaurant updates; only today's rows show, and sold-out dishes are marked on the menu." },
  { id: "table-request", section: "tableRequest", dir: "src/kits/restaurant/features/table-request", minPlan: "starter", kits: ["restaurant"], requires: ["tableRequest", "menu"], js: true,
    summary: "Table request: party size, day, a time within the sittings and notes, sent on WhatsApp as one message (a request the restaurant confirms). A plain WhatsApp link without JavaScript." },
  { id: "delivery", section: "delivery", dir: "src/kits/restaurant/features/delivery", minPlan: "starter", kits: ["restaurant"], requires: ["delivery"], js: false,
    summary: "Delivery and collection: links to the restaurant's own pages on the delivery apps it uses." },
  { id: "hero-film", dir: "src/kits/restaurant/features/hero-film", minPlan: "starter", kits: ["restaurant"], requires: ["heroFilm"], js: true,
    summary: "Hero film: the restaurant's own photos full screen behind the headline, crossfading slowly with a gentle push-in; only the first loads with the page, still with reduced motion." },
  { id: "menu-pdf", dir: "src/kits/restaurant/features/menu-pdf", minPlan: "starter", kits: ["restaurant"], requires: ["menu"], needs: ["menu"], js: false,
    summary: "Download the menu: a printed A4 menu (PDF) made from the site's own menu at every build, in the look's typefaces, with the allergen chart; or the restaurant's own PDF." },
  { id: "menu-book", section: "menuBook", dir: "src/kits/restaurant/features/menu-book", minPlan: "plus", kits: ["restaurant"], requires: ["menu", "menuBook"], needs: ["menu"], js: true,
    summary: "The Menu Book: a leather-bound menu that opens full screen and turns its pages (drag, swipe, arrows); pages set from the menu or the restaurant's own designed menu, today's specials on a slip inside the cover." },
  { id: "menu-page", dir: "src/kits/restaurant/features/menu-page", minPlan: "plus", kits: ["restaurant"], requires: ["menu"], optional: ["menuPage"], needs: ["menu"], page: "menu", js: true,
    summary: "Menu page: every sitting and the drinks, each dish with its allergens and diet marks, and the full allergen chart with \"hide dishes containing…\"." },
  { id: "tonight", section: "tonight", dir: "src/kits/restaurant/features/tonight", minPlan: "plus", kits: ["restaurant"], requires: ["tonight", "menu"], needs: ["specials"], js: true,
    summary: "Tonight: walk-in tables now (free, a few, full, bar seats only) from the restaurant's sheet, hidden when out of date; the kitchen's last orders; today's specials and what's sold out." },
  { id: "order", dir: "src/kits/restaurant/features/order", minPlan: "plus", kits: ["restaurant"], requires: ["order", "menu"], page: "takeaway", js: true,
    summary: "Takeaway page: build an order from the dishes marked for takeaway with a running total and the allergens in it, pick a collection time, send it on WhatsApp; plus the delivery apps." },
  { id: "pairings", section: "pairings", dir: "src/kits/restaurant/features/pairings", minPlan: "plus", kits: ["restaurant"], requires: ["menu"], js: true,
    summary: "What to drink with it: pick a dish and see the drinks from the restaurant's own list that go with it, with prices." },
  { id: "events", dir: "src/kits/restaurant/features/events", minPlan: "plus", kits: ["restaurant"], requires: ["events"], page: "events", js: true,
    summary: "Events page: upcoming dated events (past ones drop off by themselves), add to calendar (times in UTC), book on WhatsApp." },
  { id: "private-dining", dir: "src/kits/restaurant/features/private-dining", minPlan: "plus", kits: ["restaurant"], requires: ["privateDining"], page: "private-dining", js: true,
    summary: "Private dining page: rooms with guest numbers and minimum spend, set menus per head with a total for the group, and an enquiry on WhatsApp." },
  { id: "the-table", section: "theTable", dir: "src/kits/restaurant/features/the-table", minPlan: "signature", kits: ["restaurant"], requires: ["menu", "table"], needs: ["table-request"], js: true,
    summary: "The Table: add each guest's diet and allergies; the menu shows who can eat each dish and the dishes the whole table can share, then the table request carries the group's needs." },
  { id: "the-room", section: "theRoom", dir: "src/kits/restaurant/features/the-room", minPlan: "signature", kits: ["restaurant"], requires: ["room"], needs: ["table-request"], js: true,
    summary: "The Room: the dining room drawn from the restaurant's own layout; pick an area or a table as a preference for the request (never a guarantee)." },
  { id: "the-pass", section: "thePass", dir: "src/kits/restaurant/features/the-pass", minPlan: "signature", kits: ["restaurant"], requires: ["menu", "pass"], js: true,
    summary: "The Pass: the restaurant's own photos of its plates up close, with what's on the plate marked, the allergens, spice, what to drink with it and who at your table can eat it." },
  // --- café (trade/cafe) ---
  { id: "work-here", section: "workHere", dir: "src/kits/restaurant/features/work-here", minPlan: "plus", kits: ["restaurant"], requires: ["workHere"], js: true,
    summary: "Can I work here? Wifi, sockets, laptops, dogs, kids, buggies, step-free and toilets answered yes, no or which, and today's quiet hours from the café's own numbers, with the laptop-friendly stretches marked." },
  { id: "regulars-board", section: "board", dir: "src/kits/restaurant/features/regulars-board", minPlan: "plus", kits: ["restaurant"], requires: ["tonight", "menu"], needs: ["specials"], js: true,
    summary: "The regulars' board: the guest roaster, what's playing, the dog of the week, whatever the café pins on its sheet; each card shows since when and drops off after a week." },
  { id: "your-usual", section: "usual", dir: "src/kits/restaurant/features/your-usual", minPlan: "signature", kits: ["restaurant"], requires: ["usual", "menu"], js: true,
    summary: "Your usual: a cup that fills as you choose the drink, size, milk, shots, syrup, decaf and extra hot; the price from the café's own list, each milk's allergens from its chart, a ready time from its own prep time; remembered on the phone and ordered ahead on WhatsApp, with bakes from the counter." },
  { id: "the-case", section: "theCase", dir: "src/kits/restaurant/features/the-case", minPlan: "signature", kits: ["restaurant"], requires: ["menu", "counter"], needs: ["specials"], js: true,
    summary: "The glass case: the day's bakes on the café's counter, each lit up when a tray comes out (\"Fresh out 8:10am\") or marked sold out, from its sheet; tap one for its allergens and to ask for one to be put aside." },
  { id: "busy-now", section: "busy", dir: "src/kits/restaurant/features/busy-now", minPlan: "signature", kits: ["restaurant"], requires: ["busy", "tonight", "menu"], needs: ["specials"], js: true,
    summary: "How busy is it now? Staff's own word from the sheet when it's fresh, otherwise how busy the café usually is at this hour from its own numbers, said as usual; when it gets quieter today; the day hour by hour." },
  { id: "seat-finder", section: "seats", dir: "src/kits/restaurant/features/seat-finder", minPlan: "signature", kits: ["restaurant"], requires: ["seats"], js: true,
    summary: "Seat finder: the café drawn from its own layout; pick what you need (a socket, the window, a sofa, room for a dog or buggy) and the seats that have it light up; the choice goes with an order or a table request as a preference." },
  { id: "brunch-builder", section: "brunch", dir: "src/kits/restaurant/features/brunch-builder", minPlan: "signature", kits: ["restaurant"], requires: ["menu", "brunch", "tableRequest"], needs: ["table-request"], js: true,
    summary: "Brunch builder: a plate for each person from the café's brunch dishes with the sides they want, a running total and the allergens, sent as a pre-order with the table request." },
  // --- grand café (trade/grand-cafe) ---
  { id: "sittings", section: "sittings", dir: "src/kits/restaurant/features/sittings", minPlan: "starter", kits: ["restaurant"], requires: ["menu"], js: true,
    summary: "The day's sittings (breakfast, lunch, afternoon tea, candlelit) with their times, the one being served now marked and when the kitchen closes." },
  { id: "music", section: "music", dir: "src/kits/restaurant/features/music", minPlan: "plus", kits: ["restaurant"], requires: ["music"], js: true,
    summary: "Live music: the café's regular sets, and who is playing now or who is next and when." },
  { id: "dress-code", section: "dressCode", dir: "src/kits/restaurant/features/dress-code", minPlan: "plus", kits: ["restaurant"], requires: ["dressCode"], js: false,
    summary: "The dress code and etiquette card, in the café's own words, with the date it was last checked." },
  { id: "your-table", section: "yourTable", dir: "src/kits/restaurant/features/your-table", minPlan: "signature", kits: ["restaurant"], requires: ["menu", "tea", "stand", "tableRequest"], needs: ["table-request"], js: true,
    summary: "Your table: afternoon tea set guest by guest. Each guest's stand from the kitchen's own photos, every piece that isn't right for them marked with why and whether it's made differently, how each takes tea, and an occasion with the words for the plate shown on it; sent as one table request." },
  { id: "tea-sommelier", section: "sommelier", dir: "src/kits/restaurant/features/tea-sommelier", minPlan: "signature", kits: ["restaurant"], requires: ["tea"], js: true,
    summary: "The tea sommelier: three questions and one tea from the café's own library, set like a menu card with where it's from, how it's brewed and what it goes with on the stand." },
  { id: "give-a-sitting", section: "giveSitting", dir: "src/kits/restaurant/features/give-a-sitting", minPlan: "signature", kits: ["restaurant"], requires: ["giveSitting"], js: true,
    summary: "Give a sitting: choose the gift, write the names and a line, and the card is set in the house style as you type; paid by the shop's own Stripe Payment Link, the names sent on WhatsApp." },
  { id: "the-window", section: "window", dir: "src/kits/restaurant/features/the-window", minPlan: "signature", kits: ["restaurant"], requires: ["menu", "window"], needs: ["specials"], js: true,
    summary: "The pâtisserie window: the day's pieces photographed large, sold-out ones marked from the sheet; fill the house box piece by piece, pay by the shop's own Stripe link and send it on WhatsApp to collect." },
  { id: "salon-plan", section: "salonPlan", dir: "src/kits/restaurant/features/salon-plan", minPlan: "signature", kits: ["restaurant"], requires: ["salonPlan", "tableRequest"], needs: ["table-request"], js: true,
    summary: "The salon plan: a photograph of the room with its tables marked (by the window, under the chandelier, beside the piano); the guest's choice goes with the table request as a preference." },
  { id: "seasonal-tea", section: "seasonalTea", dir: "src/kits/restaurant/features/seasonal-tea", minPlan: "plus", kits: ["restaurant"], requires: ["tea"], js: true,
    summary: "Seasonal stands: the Christmas, Valentine's and Mother's Day teas with their dates, prices and photographs; the one being served, or the next, leads." },
  { id: "tea-page", dir: "src/kits/restaurant/features/tea-page", minPlan: "plus", kits: ["restaurant"], requires: ["tea", "tableRequest", "teaPage"], needs: ["table-request"], page: "afternoon-tea", js: false,
    summary: "The afternoon tea page: the spread and the request, then (as the plan allows) Your table, the salon plan, the seasonal stands and the tea sommelier with the whole library." },
  { id: "gifts-page", dir: "src/kits/restaurant/features/gifts-page", minPlan: "plus", kits: ["restaurant"], requires: ["giftsPage"], page: "gifts", js: false,
    summary: "The gifts page: Give a sitting, gift vouchers and the house box in one place." },
];

/** Shared features only some trades offer: this one does. */
export const uses = ["loyalty"];

/** Top-level settings no feature lists: the menu as a PDF (checked in config.js; made from the menu, or the restaurant's own). */
export const settings = ["menuPdf"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkRestaurant;

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** Config the restaurant scripts need, only what the enabled features use. Dishes travel in the HTML (data attributes). @param {any} site */
export function pageData(site) {
  const on = (/** @type {string[]} */ ...ids) => ids.some((id) => site.features.includes(id));
  const dishes = new Map(site.menu.sections.flatMap((/** @type {any} */ s) => s.dishes).map((/** @type {any} */ d) => [d.id, d]));
  const lite = (/** @type {any} */ d) => ({ id: d.id, name: d.name, price: d.price, allergens: d.allergens });
  return {
    sittings: site.menu.sittings,
    tonight: on("specials", "tonight") ? { source: site.tonight.source, csvUrl: site.tonight.csvUrl, staleAfterMinutes: site.tonight.staleAfterMinutes, demo: site.tonight.demo } : null,
    tableRequest: on("table-request") ? site.tableRequest : null,
    order: on("order") ? site.order : null,
    events: on("events") ? site.events.items.map((/** @type {any} */ e) => ({ id: e.id, title: e.title, date: e.date, start: e.start, end: e.end, text: e.text })) : null,
    privateDining: on("private-dining") ? { message: site.privateDining.message } : null,
    place: [site.business.name, site.location.streetAddress, site.location.locality, site.location.postcode].filter(Boolean).join(", "),
    // The café features (the counter, Your usual, busyness, seats, brunch): only what their scripts use.
    counter: on("specials") && site.counter ? {
      freshForMinutes: site.counter.freshForMinutes ?? 60, hold: site.counter.hold ?? null,
      bakes: site.menu.sections.filter((/** @type {any} */ s) => site.counter.sections.includes(s.id)).flatMap((/** @type {any} */ s) => s.dishes.map(lite)),
    } : null,
    usual: on("your-usual") ? { ...site.usual, note: undefined } : null,
    busy: on("busy-now", "work-here") && site.busy ? site.busy : null,
    seats: on("seat-finder") ? site.seats.places.map((/** @type {any} */ p) => ({ id: p.id, label: p.label, has: p.has, seats: p.seats })) : null,
    brunch: on("brunch-builder") ? { maxPlates: site.brunch.maxPlates, dishes: [...site.brunch.plates, ...site.brunch.sides].map((/** @type {string} */ id) => lite(dishes.get(id))) } : null,
    ...teaRoomData(site, on),
  };
}

/**
 * The tea room (Your table, the tea sommelier, Give a sitting, live music, the window, the seasons, the salon plan):
 * only what their scripts use.
 * @param {any} site @param {(...ids: string[]) => boolean} on
 */
function teaRoomData(site, on) {
  const section = (/** @type {string} */ id) => site.menu.sections.find((/** @type {any} */ x) => x.id === id);
  return {
    tea: on("your-table", "tea-sommelier") && site.tea ? {
      services: site.tea.services, swaps: site.tea.swaps, library: site.tea.library, maxGuests: site.stand?.maxGuests ?? 6,
      bottles: (site.stand?.champagne?.bottles ?? []).map((/** @type {string} */ id) => { const d = site.menu.sections.flatMap((/** @type {any} */ x) => x.dishes).find((/** @type {any} */ x) => x.id === id); return { id, name: d.name, price: d.price }; }),
      tiers: site.tea.tiers.map((/** @type {string} */ id) => ({ id, name: section(id).name, dishes: section(id).dishes.map((/** @type {any} */ d) => ({ id: d.id, name: d.name, diets: d.diets ?? [], allergens: d.allergens })) })),
    } : null,
    giveSitting: on("give-a-sitting") ? { gifts: site.giveSitting.gifts, message: site.giveSitting.message } : null,
    music: on("music") ? site.music.sets : null,
    window: on("the-window") ? { boxes: site.window.boxes, message: site.window.message, pieces: site.window.sections.flatMap((/** @type {string} */ id) => section(id).dishes.map((/** @type {any} */ d) => ({ id: d.id, name: d.name, price: d.price }))) } : null,
    seasons: on("seasonal-tea") ? site.tea.seasons ?? [] : null,
    salonPlan: on("salon-plan") ? { spots: site.salonPlan.spots } : null,
  };
}

/** Day or evening colours from the sittings, set before the first paint (src/core/lib/daypart.js). @param {any} site */
export function buildData(site) {
  return { daypart: daypartMeta(site.hours, site.menu.sittings, site.features.includes("seasonal") ? site.seasons ?? [] : []), daypartScript: DAYPART_SCRIPT };
}

/**
 * Live data: simulated on a demo (src/demo), the client's published Google Sheet otherwise.
 * @type {import("../../features/registry.js").Provider[]}
 */
export const providers = [
  {
    key: "tonight",
    on: (site, enabled) => enabled.has("specials") || enabled.has("tonight"),
    simulated: (site) => site.tonight?.source === "simulated",
    demo: { from: "src/demo/tonight-provider.js", name: "simulatedTonight" },
    live: { from: "src/kits/restaurant/features/specials/sheet-provider.js", name: "sheetTonight" },
  },
];

/**
 * What this kit adds to the site's Content-Security-Policy (src/core/lib/seo.js): `sheets` when it reads a published
 * Google Sheet, and any other sources.
 * @param {any} site @returns {import("../../features/registry.js").KitCsp}
 */
export function csp(site) {
  // Tonight's sheet (specials, sold-out dishes, walk-in tables), and the one fixed inline script that sets day or
  // evening colours from the sittings before the first paint, allowed by its hash.
  return {
    sheets: site.tonight?.source === "sheet" && (site.features?.includes("specials") || site.features?.includes("tonight")),
    script: [`'sha256-${createHash("sha256").update(DAYPART_SCRIPT).digest("base64")}'`],
  };
}

/** A dish or drink on the menu: what the loyalty card's savings example compares against (cafés have no services). */
const menuItemOf = (/** @type {any} */ site, /** @type {string} */ id) => (Array.isArray(site.menu?.sections) ? site.menu.sections : []).flatMap((/** @type {any} */ s) => (Array.isArray(s.dishes) ? s.dishes : [])).find((/** @type {any} */ d) => d.id === id);

export const savingsItem = { find: menuItemOf, hint: "id of the menu item used for the savings example, e.g. a flat white from the menu" };
