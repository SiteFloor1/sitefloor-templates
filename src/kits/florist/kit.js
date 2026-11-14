// @ts-check
/**
 * The florist kit (florists who deliver by hand and dress rooms): everything the shared build needs to know about it,
 * in one file. src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so adding or changing
 * this kit never edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 */
import { buildNow } from "../../core/lib/build-day.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { checkFlorist } from "./config.js";
import { checkLookFeatures } from "./looks.js";
import { bankHolidays, regionFromPostcode } from "../../core/lib/bank-holidays.js";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- florist (trade/florist) ---
  // Florists who deliver by hand and dress rooms. Starter: this week's flowers (which also set the site's colour), the
  // honest same-day line and postcode check, in the room / to your door, the wrap and shop by occasion. Plus: in season
  // now, the card composer, flowers every week, the care card by QR, rooms we dress and the guided sympathy order.
  // Signature: remember the date, the wedding and event planner, workshops with places left, gift a season, the bouquet builder.
  { id: "this-week", section: "week", dir: "src/kits/florist/features/this-week", minPlan: "starter", kits: ["florist"], requires: ["week"], optional: ["studioSheet"], js: true,
    summary: "This week's flowers: the arrangement large, its name, stems and prices by size, ordered on WhatsApp. One row (in the site or live from the florist's Google Sheet) sets them and the week's colour, which frames the page: the monogram, the band, the one button and the phone bar. A Sheet mistake keeps the last good values." },
  { id: "same-day", dir: "src/kits/florist/features/same-day", minPlan: "starter", kits: ["florist"], requires: ["delivery"], js: true,
    summary: "Same-day delivery, honestly: the florist's own cut-off for each day, closed days and postcode districts. Before the cut-off it counts down (\"Order in the next 2 h 14 min for delivery today\"); after it, it names the next delivery day. A postcode check answers yes, when, or collect instead. Never a guess." },
  { id: "two-ways", section: "twoWays", dir: "src/kits/florist/features/two-ways", minPlan: "starter", kits: ["florist"], requires: ["twoWays"], js: false,
    summary: "In the room / to your door: two tall photographs side by side, the florist's work in a room and a bouquet ready to send, each opening where it leads." },
  { id: "the-wrap", section: "wrap", dir: "src/kits/florist/features/the-wrap", minPlan: "starter", kits: ["florist"], requires: ["wrap"], js: false,
    summary: "The wrap: the bouquet handed over in the florist's own paper and ribbon, with their names as swatches, in the florist's words." },
  { id: "shop-by-occasion", section: "occasions", dir: "src/kits/florist/features/shop-by-occasion", minPlan: "starter", kits: ["florist"], requires: ["occasions"], js: true,
    summary: "Shop by occasion and price: birthday, thank you, love, new baby, sympathy, each with a photograph and a starting price; filter by what you want to spend. Each sends its own message on WhatsApp." },
  { id: "in-season", section: "season", dir: "src/kits/florist/features/in-season", minPlan: "plus", kits: ["florist"], requires: ["inSeason"], optional: ["studioSheet"], js: true,
    summary: "In season now: what's in the studio this week (just in, plenty, last week), from the florist's Google Sheet; old or broken data falls back to the list in the site, never to nothing." },
  { id: "card-composer", dir: "src/kits/florist/features/card-composer", minPlan: "plus", kits: ["florist"], requires: ["card"], needs: ["this-week"], js: true,
    summary: "The card: write the message and see it on the florist's card as it's typed, held to their length; it goes with the order on WhatsApp. A few starting lines for when words are hard." },
  { id: "every-week", dir: "src/kits/florist/features/every-week", minPlan: "plus", kits: ["florist"], requires: ["everyWeek"], page: "every-week", js: false,
    summary: "Flowers every week (or fortnight): the sizes and prices as the florist sets them, each paid by their own Stripe Payment Link, with how pausing, skipping and changing work in their words." },
  { id: "care-card", dir: "src/kits/florist/features/care-card", minPlan: "plus", kits: ["florist"], requires: ["care"], page: "flower-care", freePage: true, unlisted: true, js: false,
    summary: "The care card: a short page of the florist's own care advice, reached from a QR code printed on the card that goes with every bouquet (the code is made at build time for the florist to print). Kept out of search." },
  { id: "rooms-we-dress", section: "rooms", dir: "src/kits/florist/features/rooms-we-dress", minPlan: "plus", kits: ["florist"], requires: ["rooms"], js: true,
    summary: "Rooms we dress: homes, hotels, restaurants and events, one large photograph at a time (tabs on a computer, a sideways strip on a phone), each with one line." },
  { id: "sympathy-order", dir: "src/kits/florist/features/sympathy-order", minPlan: "plus", kits: ["florist"], requires: ["sympathy"], page: "sympathy", js: true,
    summary: "Sympathy flowers, gently: who they're for, where they go (the funeral director, the service or a home), the piece and the date, with plain words for the card; sent on WhatsApp so the florist can confirm by name. Plain wording, no countdowns or offers on this page." },
  { id: "remember-date", section: "remember", dir: "src/kits/florist/features/remember-date", minPlan: "signature", kits: ["florist"], requires: ["remember"], js: true,
    summary: "Remember the date: a birthday or anniversary goes into the customer's own calendar every year, with a reminder on the last day to order (.ics). Nothing is sent to the florist or stored." },
  { id: "weddings-planner", dir: "src/kits/florist/features/weddings-planner", minPlan: "signature", kits: ["florist"], requires: ["weddings"], page: "weddings", js: true,
    summary: "Weddings and events: the pieces in the florist's photographs with starting prices, a date check (dates the florist says are taken, or too soon), and a consultation request. Palette from a swatch: send a photo of the fabric on WhatsApp and the florist replies with stems for the month." },
  { id: "flower-workshops", dir: "src/kits/florist/features/flower-workshops", minPlan: "signature", kits: ["florist"], requires: ["workshops"], optional: ["studioSheet"], page: "workshops", js: true,
    summary: "Workshops: dates, what you make and take home, the price and places left (live from the florist's Sheet when set), each booked by its own Payment Link. Past dates drop off by themselves." },
  { id: "gift-a-season", section: "giftSeason", dir: "src/kits/florist/features/gift-a-season", minPlan: "signature", kits: ["florist"], requires: ["giftSeason"], js: true,
    summary: "Gift a season: four, eight or twelve weeks of flowers for someone else, the start date and the card, each length paid by the florist's own Payment Link; the details go on WhatsApp." },
  { id: "bouquet-builder", dir: "src/kits/florist/features/bouquet-builder", minPlan: "signature", kits: ["florist"], requires: ["builder"], page: "build", js: true,
    summary: "Build a bouquet from real stems: choose a palette and a size and see the florist's own photograph of that bouquet with its price (never a drawing), then order it on WhatsApp." },
  // Added after the first review: Starter gets the delivery day and the weekly note; Plus the gifts to add, pre-order
  // windows, occasion pages, delivery areas and funeral flowers; Signature names the stems, follows an order, the flower
  // calendar, the work as stories, and flowers for hotels, restaurants and offices with each client's private page.
  { id: "deliver-on", dir: "src/kits/florist/features/deliver-on", minPlan: "starter", kits: ["florist"], requires: ["delivery"], needs: ["this-week", "same-day"], js: true,
    summary: "Choose the day: a delivery date for later (a birthday next Friday), checked against the florist's own delivery days, cut-offs, closed dates and bank holidays before it goes on the order. A day they don't deliver says so, never a promise." },
  { id: "weekly-note", dir: "src/kits/florist/features/weekly-note", minPlan: "starter", kits: ["florist"], requires: ["note"], optional: ["studioSheet"], needs: ["this-week"], js: true,
    summary: "A short note from the florist with this week's flowers (what came in, what to look out for), signed with the studio's name or the florist's; one line in the Sheet changes it." },
  { id: "gifts-to-add", dir: "src/kits/florist/features/gifts-to-add", minPlan: "plus", kits: ["florist"], requires: ["gifts"], needs: ["this-week"], js: false,
    summary: "Something to go with it: the florist's own vases, candles and cards at their prices, ticked on the order and listed on the WhatsApp message." },
  { id: "pre-order", dir: "src/kits/florist/features/pre-order", minPlan: "plus", kits: ["florist"], requires: ["preorder"], js: true,
    summary: "Pre-order windows for the big days (Christmas, Valentine's Day, Mother's Day): a short menu with the florist's prices and their own order-by date, shown at the top of the home page only while the window is open." },
  { id: "occasion-pages", dir: "src/kits/florist/features/occasion-pages", minPlan: "plus", kits: ["florist"], requires: ["occasionPages"], page: "occasions", morePages: ["for"], collection: true, js: true,
    summary: "A page per occasion (birthday, anniversary, new baby, thank you, get well, Valentine's Day, Mother's Day): the florist's photographs and prices for it, the words for the card and its own WhatsApp message. One page on the plan's count." },
  { id: "delivery-areas", dir: "src/kits/florist/features/delivery-areas", minPlan: "plus", kits: ["florist"], requires: ["delivery", "deliveryAreas"], needs: ["same-day"], page: "delivery", morePages: ["delivery-area"], collection: true, js: false,
    summary: "Delivery areas: a page per postcode district with the florist's own cut-off and charge for it and the streets they know, plus how delivery works. The postcode check uses each area's own cut-off and charge. One page on the plan's count." },
  { id: "funeral-flowers", dir: "src/kits/florist/features/funeral-flowers", minPlan: "plus", kits: ["florist"], requires: ["funeral"], page: "funeral", js: false,
    summary: "Funeral flowers, in plain words: wreaths, sprays and tributes with the florist's prices, how much notice they need, delivery to the funeral director, and a quiet way to ask. No countdowns or offers." },
  { id: "name-the-stems", dir: "src/kits/florist/features/name-the-stems", minPlan: "signature", kits: ["florist"], requires: ["stemNames"], optional: ["studioSheet"], needs: ["this-week"], js: true,
    summary: "Name the stems: tap a flower in this week's photograph to see what it is (\"Coral garden rose · English-grown\"). The florist marks the stems once a week; with a different photo or none marked, nothing shows." },
  { id: "follow-order", dir: "src/kits/florist/features/follow-order", minPlan: "signature", kits: ["florist"], requires: ["orderTracker"], page: "your-order", unlisted: true, js: true,
    summary: "Follow your order: a private link (by reference, never a name) showing being made, on the van or delivered, with the florist's photograph of the actual bouquet before it left, from their Google Sheet." },
  { id: "flower-calendar", dir: "src/kits/florist/features/flower-calendar", minPlan: "signature", kits: ["florist"], requires: ["calendar"], page: "calendar", js: true,
    summary: "The flower calendar: twelve months, each with the florist's photograph and what's at its best, this month marked. Couples choose a wedding month from it, straight into the wedding enquiry or a palette from a swatch." },
  { id: "work-stories", dir: "src/kits/florist/features/work-stories", minPlan: "signature", kits: ["florist"], requires: ["stories"], page: "stories", morePages: ["story"], collection: true, js: false,
    summary: "Our work, as stories: a page per wedding or event with the brief, the palette, the stems, three or four photographs and the venue. One page on the plan's count." },
  { id: "for-business", dir: "src/kits/florist/features/for-business", minPlan: "signature", kits: ["florist"], requires: ["contract"], page: "for-business", js: false,
    summary: "Hotels, restaurants and offices: how contract flowers work, what changes each week, the sizes and the florist's prices, and an enquiry on WhatsApp." },
  { id: "business-flowers", dir: "src/kits/florist/features/business-flowers", minPlan: "signature", kits: ["florist"], requires: ["contract"], needs: ["for-business"], page: "your-flowers", unlisted: true, js: true,
    summary: "Your flowers this week, for each business client: a private link showing what's going where this week and when it changes next, from the florist's Sheet, with a way to ask for a change." },
  // Social-first florists (Instagram and TikTok): the home page as the florist's feed. Starter: today's bouquets with
  // what's left of each (from the Sheet) and the order written out for WhatsApp or an Instagram DM, and "can you make
  // this one?" from a post's link. Plus: the next LIVE sessions. Signature: the weekly drop.
  { id: "todays-bouquets", section: "bouquets", dir: "src/kits/florist/features/todays-bouquets", minPlan: "starter", kits: ["florist"], requires: ["bouquets"], optional: ["studioSheet"], js: true,
    summary: "Today's bouquets as the florist's own feed: one or more ranges (fresh, forever), a pinned post, each bouquet with its photo, price and what's left (\"2 left\", sold out) from the florist's Google Sheet. \"Ask for this one\" writes the order out with the card and any add-ons, for WhatsApp or, copied, for an Instagram DM." },
  { id: "make-this", section: "makeThis", dir: "src/kits/florist/features/make-this", minPlan: "starter", kits: ["florist"], requires: ["makeThis"], js: true,
    summary: "Can you make this one? Paste a TikTok, Instagram or Pinterest link (any other link is refused), choose a budget and a day, and one message goes to the florist with all three. Nothing is fetched or stored." },
  { id: "live-dates", section: "live", dir: "src/kits/florist/features/live-dates", minPlan: "plus", kits: ["florist"], requires: ["live"], js: true,
    summary: "The florist's next TikTok or Instagram LIVE sessions (pre-orders, new drops), each into the customer's own calendar with a reminder. Past sessions drop off by themselves." },
  { id: "the-drop", dir: "src/kits/florist/features/the-drop", minPlan: "signature", kits: ["florist"], requires: ["drop"], optional: ["studioSheet"], needs: ["todays-bouquets"], page: "drop", js: true,
    summary: "The weekly drop: a countdown to the florist's own day and time, then how many are left, read every minute from their Google Sheet while it's open. Sold out means sold out; a count the florist hasn't updated recently is never shown (it says check our Instagram instead). A calendar reminder for the next one." },
];

/**
 * Checks this kit's settings in site.json (runs for every site; it returns early for other kits), and that the look
 * lays out every florist feature the site turns on.
 * @type {NonNullable<import("../../features/registry.js").Kit["check"]>}
 */
export const check = (site, err, exists) => {
  checkFlorist(site, err, exists);
  checkLookFeatures(site, err, features.flatMap((f) => (typeof f === "string" ? [] : [f.id])));
};

/** What the week's colour is mixed with: the look's ground and ink (look.json "week"). @param {string} look */
function lookWeek(look) {
  try {
    const meta = JSON.parse(readFileSync(fileURLToPath(new URL(`../../looks/${look}/look.json`, import.meta.url)), "utf8"));
    return meta.week ?? { ground: "#F7F6F3", ink: "#1C1B19" };
  } catch {
    return { ground: "#F7F6F3", ink: "#1C1B19" };
  }
}

/** Values the templates read before the first paint: the look's mix for the week's colour (header), today's lead bouquet. @param {any} site */
export function buildData(site) {
  const b = site.bouquets, first = b?.ranges?.[0]?.id;
  // Today's bouquets: the first range's places in the feed before any script runs (the first sits beside the pinned
  // post), so nothing moves when the script takes over.
  /** @type {Record<string, number>} */ const bouquetPos = {};
  let n = 0;
  for (const x of b?.items ?? []) if (x.range === first && x.status !== "hidden") bouquetPos[x.id] = ++n;
  return { week: lookWeek(site.look), bouquetPos };
}

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** @param {any} site */
export function pageData(site) {
  const on = (/** @type {string[]} */ ...ids) => ids.some((id) => site.features.includes(id));
  const region = site.location.region ?? regionFromPostcode(site.location.postcode ?? "");
  const y = new Date(buildNow()).getUTCFullYear(); // bank holidays for this year and next, worked out at build time
  const t = site.orderTracker, acc = site.contract?.accounts;
  return {
    florist: {
      look: lookWeek(site.look),
      studio: site.studioSheet ?? null,
      week: on("this-week") ? { name: site.week.name, stems: site.week.stems, colour: site.week.colour, colourName: site.week.colourName, sizes: site.week.sizes, photo: site.week.photo, message: site.week.message, photos: site.week.photos.map((/** @type {any} */ p) => ({ id: p.id, src: p.src, alt: p.alt })) } : null,
      delivery: on("same-day") ? {
        zones: site.delivery.zones, cutoffs: site.delivery.cutoffs, closed: site.delivery.closed ?? [], dates: site.delivery.dates ?? {}, fee: site.delivery.fee,
        holidays: site.delivery.bankHolidays === "closed" ? [...bankHolidays(y, region), ...bankHolidays(y + 1, region)] : [],
        areas: (on("delivery-areas") ? site.deliveryAreas.areas : []).map((/** @type {any} */ a) => ({ district: a.district, fee: a.fee, cutoffs: a.cutoffs })),
      } : null,
      note: on("weekly-note") ? { text: site.note.text, from: site.note.from } : null,
      stems: on("name-the-stems") ? { photo: site.stemNames.photo, points: site.stemNames.points } : null,
      tracker: on("follow-order") ? { source: t.source, csvUrl: t.csvUrl, staleAfterHours: t.staleAfterHours ?? 24, stages: t.stages.map((/** @type {any} */ s) => s.id), example: t.example, demo: site.mode === "demo" ? t.demo ?? null : null } : null,
      accounts: on("business-flowers") ? { source: acc.source, csvUrl: acc.csvUrl, staleAfterDays: acc.staleAfterDays ?? 8, example: acc.example } : null,
      timeZone: site.hours?.timezone ?? "Europe/London",
      card: on("card-composer") ? { max: site.card.max, lines: site.card.lines } : null,
      remember: on("remember-date") ? { orderDaysBefore: site.remember.orderDaysBefore } : null,
      giftSeason: on("gift-a-season") ? { message: site.giftSeason.message, leadDays: site.giftSeason.leadDays } : null,
      sympathy: on("sympathy-order") ? { message: site.sympathy.message, leadDays: site.sympathy.leadDays } : null,
      weddings: on("weddings-planner") ? { taken: site.weddings.taken, minWeeks: site.weddings.minWeeks, consult: { message: site.weddings.consult.message } } : null,
      builder: on("bouquet-builder") ? { message: site.builder.message, palettes: site.builder.palettes, sizes: site.builder.sizes, bouquets: site.builder.bouquets.map((/** @type {any} */ b) => ({ id: b.id, palette: b.palette, size: b.size, photo: b.photo })) } : null,
      bouquets: on("todays-bouquets") ? { message: site.bouquets.message, instagram: site.bouquets.instagram ?? null, staleMinutes: site.bouquets.staleMinutes ?? 180, card: site.bouquets.card ?? null, addOns: site.bouquets.addOns ?? [],
        items: site.bouquets.items.map((/** @type {any} */ x) => ({ id: x.id, name: x.name, price: x.price, status: x.status, left: x.left })) } : null,
      makeThis: on("make-this") ? { message: site.makeThis.message } : null,
      live: on("live-dates") ? { sessions: site.live.sessions, links: site.live.links } : null,
      drop: on("the-drop") ? { name: site.drop.name, when: site.drop.when, made: site.drop.made, left: site.drop.left ?? null, staleMinutes: site.drop.staleMinutes ?? 10, demo: site.mode === "demo" } : null,
      url: site.url,
    },
  };
}

/**
 * Live data for the private pages (follow your order, your flowers this week): simulated on a demo (src/demo), the
 * florist's published Google Sheet otherwise.
 * @type {import("../../features/registry.js").Provider[]}
 */
export const providers = [
  {
    key: "florist",
    // A demo's drop count comes from the simulation too (a client's from their studio Sheet, see the-drop.js).
    on: (site, enabled) => enabled.has("follow-order") || enabled.has("business-flowers") || (site.mode === "demo" && enabled.has("the-drop")),
    simulated: (site) => site.orderTracker?.source === "simulated" || site.contract?.accounts?.source === "simulated" || (site.mode === "demo" && site.features?.includes("the-drop")),
    demo: { from: "src/demo/florist-provider.js", name: "simulatedFlorist" },
    live: { from: "src/kits/florist/features/follow-order/sheet-provider.js", name: "sheetFlorist" },
  },
];

/**
 * What this kit adds to the Content-Security-Policy: the florist's published Sheets (the week, the season, workshop
 * places, an order, a business client's flowers) and, for the private pages, photos kept in their Google Drive.
 * @param {any} site @returns {import("../../features/registry.js").KitCsp}
 */
export function csp(site) {
  const on = (/** @type {string} */ id) => site.features?.includes(id);
  const studio = site.studioSheet?.source === "sheet" && ["this-week", "in-season", "flower-workshops", "todays-bouquets", "the-drop"].some(on);
  const privatePages = (on("follow-order") && site.orderTracker?.source === "sheet") || (on("business-flowers") && site.contract?.accounts?.source === "sheet");
  return { sheets: studio || privatePages, img: privatePages ? ["https://*.googleusercontent.com"] : [] };
}
