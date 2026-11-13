// @ts-check
/**
 * The bakery kit (chocolatiers, gelaterias, dessert shops and cake makers): everything the shared build needs to know about it, in one file.
 * src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so adding or changing this kit never
 * edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 */
import { checkBakery } from "./config.js";
import { regionFromPostcode } from "../../core/lib/bank-holidays.js";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- bakery (trade/dessert) ---
  // Chocolatiers, gelaterias, dessert shops and cake makers. Starter: the counter, the gelato wall and the menu; Plus: orders, private hire, the vote; Signature: the box and the tasting flight.
  { id: "desserts", section: "desserts", dir: "src/kits/bakery/features/desserts", minPlan: "starter", kits: ["bakery"], requires: ["desserts"], js: true,
    summary: "The dessert menu: every item with its price and the 14 allergens from the shop's own chart, eggless, vegan and halal filters, \"hide anything containing…\", and tonight's sold-out items marked from the sheet." },
  { id: "bakes", section: "bakes", dir: "src/kits/bakery/features/bakes", minPlan: "starter", kits: ["bakery"], requires: ["bakes", "desserts"], needs: ["desserts"], js: true,
    summary: "Tonight's counter: what's on, running low or sold out, from a Google Sheet the shop updates on its phone; rows from another day never show and a stale \"a few left\" goes quiet." },
  { id: "late-night", section: "lateNight", dir: "src/kits/bakery/features/late-night", minPlan: "starter", kits: ["bakery"], requires: ["lateNight", "hours"], js: true,
    summary: "Open late: tonight's closing time and last orders (counting down in the final hour), whether there are seats inside now (from the sheet), and the delivery apps." },
  { id: "delivery-links", section: "delivery", dir: "src/kits/bakery/features/delivery-links", minPlan: "starter", kits: ["bakery"], requires: ["delivery"], js: false,
    summary: "Delivery and collection: links to the shop's own pages on the delivery apps it uses." },
  { id: "dessert-menu", dir: "src/kits/bakery/features/dessert-menu", minPlan: "plus", kits: ["bakery"], requires: ["desserts", "menuPage"], needs: ["desserts"], page: "desserts", js: true,
    summary: "Menu page: every section with photos, prices, allergens and marks, the filters, and the full allergen chart for every item." },
  { id: "celebration-cakes", dir: "src/kits/bakery/features/celebration-cakes", minPlan: "plus", kits: ["bakery"], requires: ["cakes", "cakesPage"], page: "cakes", js: true,
    summary: "Celebration cakes page: sizes with servings and prices, flavours and finishes, the earliest day one can be ready (notice, closed days and full days from the sheet), a request on WhatsApp with a name on the cake, the deposit link and \"remind me next year\"." },
  { id: "collect", section: "collect", dir: "src/kits/bakery/features/collect", minPlan: "plus", kits: ["bakery"], requires: ["collect", "desserts"], needs: ["desserts"], js: true,
    summary: "Collection request: pick desserts with a running total and their allergens, a day and a time within opening hours, and send it on WhatsApp for the shop to confirm." },
  { id: "parties", dir: "src/kits/bakery/features/parties", minPlan: "plus", kits: ["bakery"], requires: ["parties", "partiesPage"], page: "parties", js: true,
    summary: "Private hire and parties page: the shop's options with prices and notice, a calculator from the number of guests to the cakes or trays needed (from the shop's own sizes and prices), an enquiry on WhatsApp and the deposit link." },
  "pay-link", // the shared pay-link loads here, among the order features, on a bakery site
  { id: "shop-film", dir: "src/kits/bakery/features/shop-film", minPlan: "starter", kits: ["bakery"], requires: ["hero"], js: true,
    summary: "The shop's film at the top of the home page: a short muted loop of its own counter (its first frame shows at once, the film starts after the page has loaded, never with reduced motion), with a Pause button." },
  { id: "gelato-wall", section: "gelato", dir: "src/kits/bakery/features/gelato-wall", minPlan: "starter", kits: ["bakery"], requires: ["gelato"], js: true,
    summary: "The gelato wall: the shop's flavours as a row of tubs from its own photos, with the scoop prices; from the sheet, a flavour that's off today says \"Back tomorrow\" instead of vanishing." },
  { id: "flavour-vote", section: "vote", dir: "src/kits/bakery/features/flavour-vote", minPlan: "plus", kits: ["bakery"], requires: ["vote"], js: true,
    summary: "Flavour vote: customers pick next week's gelato on the shop's own Google Form; the running count from the Form's results, and a \"my vote\" card to share." },
  { id: "dessert-box", section: "box", dir: "src/kits/bakery/features/dessert-box", minPlan: "signature", kits: ["bakery"], requires: ["box", "desserts"], needs: ["desserts"], morePages: ["gift"], js: true,
    summary: "The box: choose a box of 6, 12 or 16, place the shop's chocolates one by one from its own photos, tie the ribbon, write the card; order for collection, or send it as a gift with a link that shows them their box." },
  { id: "kitchen-line", dir: "src/kits/bakery/features/kitchen-line", minPlan: "starter", kits: ["bakery"], requires: ["bakes"], needs: ["bakes"], js: true,
    summary: "From the kitchen today: one line the shop types into its sheet (\"Tempering raspberry, out at 4\"), shown with today's counter; it goes quiet after six hours." },
  { id: "gelato-tubs", section: "tubs", dir: "src/kits/bakery/features/gelato-tubs", minPlan: "plus", kits: ["bakery"], requires: ["tubs", "gelato"], needs: ["gelato-wall"], js: true,
    summary: "Take-home gelato: choose a tub, pick its flavours from today's wall (not ones that are off), and send it on WhatsApp for collection." },
  { id: "post-box", section: "post", dir: "src/kits/bakery/features/post-box", minPlan: "plus", kits: ["bakery"], requires: ["post"], js: true,
    summary: "Posted boxes: the boxes the shop posts and what it costs, with \"order by noon Thursday, there Friday\" worked out live from its posting days; the order and address on WhatsApp." },
  { id: "box-month", section: "boxMonth", dir: "src/kits/bakery/features/box-month", minPlan: "plus", kits: ["bakery"], requires: ["boxMonth", "payLinks"], needs: ["pay-link"], js: false,
    summary: "A box a month: a gift subscription paid through the shop's own Stripe subscription link." },
  { id: "favours", section: "favours", dir: "src/kits/bakery/features/favours", minPlan: "plus", kits: ["bakery"], requires: ["favours"], js: true,
    summary: "Favours: boxes for a wedding, a party or a company. Choose what goes in each and how many; the price per box falls at the shop's own quantities; the earliest date it can make them; the request on WhatsApp." },
  { id: "favour-seal", dir: "src/kits/bakery/features/favour-seal", minPlan: "signature", kits: ["bakery"], requires: ["favours"], needs: ["favours"], js: false,
    summary: "Your seal: the shop's seal redrawn live on the favour box lid with the couple's or company's initials and a line around the ring, sent with the request." },
  { id: "advent-box", section: "advent", dir: "src/kits/bakery/features/advent-box", minPlan: "signature", kits: ["bakery"], requires: ["advent", "desserts"], needs: ["desserts"], js: true,
    summary: "The advent box: 24 windows on the shop's lid, a chocolate behind each. Before December every window opens as a preview; in December one more opens each day; pre-order for collection." },
  { id: "tasting-flight", section: "flight", dir: "src/kits/bakery/features/tasting-flight", minPlan: "signature", kits: ["bakery"], requires: ["flight", "desserts"], needs: ["dessert-box"], js: true,
    summary: "The tasting flight: pick five chocolates; the page puts them in the order to taste them, with the shop's line on each, as a card to keep; order the flight for collection." },
];

/** Shared features only some trades offer: this one does. */
export const uses = ["pay-link"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkBakery;

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** Config the bakery scripts need, only what the enabled features use. Menu items travel in the HTML. @param {any} site */
export function pageData(site) {
  const on = (/** @type {string[]} */ ...ids) => ids.some((id) => site.features.includes(id));
  return {
    bakes: site.bakes && on("bakes", "desserts", "late-night", "celebration-cakes", "dessert-box", "tasting-flight", "gelato-wall", "gelato-tubs", "kitchen-line") ? { source: site.bakes.source, csvUrl: site.bakes.csvUrl, staleAfterMinutes: site.bakes.staleAfterMinutes } : null,
    lateNight: on("late-night") ? site.lateNight : null,
    cakes: on("celebration-cakes") ? { ...site.cakes, photos: undefined, howToOrder: undefined } : null,
    collect: on("collect") ? site.collect : null,
    parties: on("parties") ? { servings: site.parties.servings, maxGuests: site.parties.maxGuests } : null,
    box: on("dessert-box") ? { sizes: site.box.sizes.map((/** @type {any} */ z) => ({ n: z.n, price: z.price })), cardMax: site.box.cardMax, start: site.box.start ?? [] } : null,
    flight: on("tasting-flight") ? { size: site.flight.size, price: site.flight.price } : null,
    favours: on("favours") ? { options: site.favours.options, minQty: site.favours.minQty, maxQty: site.favours.maxQty, leadDays: site.favours.leadDays, breaks: site.favours.breaks ?? [] } : null,
    advent: on("advent-box") ? { year: site.advent.year, price: site.advent.price } : null,
    post: on("post-box") ? { price: site.post.price, days: site.post.days, cutoff: site.post.cutoff, region: site.location.region ?? regionFromPostcode(site.location.postcode ?? "") } : null,
    tubs: on("gelato-tubs") ? { sizes: site.tubs.sizes } : null,
    vote: on("flavour-vote") ? { source: site.vote.source, csvUrl: site.vote.csvUrl, closes: site.vote.closes, candidates: site.vote.candidates.map((/** @type {any} */ c) => ({ id: c.id, name: c.name })) } : null,
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
    key: "bakes",
    on: (site, _enabled) => site.kit === "bakery" && !!site.bakes,
    simulated: (site) => site.bakes.source === "simulated",
    demo: { from: "src/demo/bakes-provider.js", name: "simulatedBakes" },
    live: { from: "src/kits/bakery/features/bakes/sheet-provider.js", name: "sheetBakes" },
  },
  {
    key: "vote",
    on: (site, enabled) => enabled.has("flavour-vote"),
    simulated: (site) => site.vote?.source === "simulated",
    demo: { from: "src/demo/vote-provider.js", name: "simulatedVotes" },
    live: { from: "src/kits/bakery/features/flavour-vote/sheet-provider.js", name: "sheetVotes" },
  },
];

/**
 * What this kit adds to the site's Content-Security-Policy (src/core/lib/seo.js): `sheets` when it reads a published
 * Google Sheet, and any other sources.
 * @param {any} site @returns {import("../../features/registry.js").KitCsp}
 */
export function csp(site) {
  // Today's counter, the gelato wall, seats and full cake days from the shop's sheet; the flavour vote's count from its Form's results sheet.
  const reads = ["bakes", "celebration-cakes", "dessert-box", "tasting-flight", "late-night", "desserts", "gelato-wall"].some((id) => site.features?.includes(id));
  const votes = site.features?.includes("flavour-vote") && site.vote?.source === "sheet";
  return { sheets: (site.bakes?.source === "sheet" && reads) || votes };
}
