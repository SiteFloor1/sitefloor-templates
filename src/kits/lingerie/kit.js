// @ts-check
/**
 * The lingerie kit (lingerie boutiques): everything the shared build needs to know about it, in one file.
 * src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so adding or changing this kit never
 * edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 */
import { checkLingerie } from "./config.js";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- lingerie (trade/lingerie) ---
  { id: "new-season", section: "newSeason", dir: "src/kits/lingerie/features/new-season", minPlan: "starter", kits: ["lingerie"], requires: ["collections", "pieces"], js: false,
    summary: "New season: the shop's newest pieces on models, each named collection · style · colour with its swatches and price." },
  { id: "category-doors", section: "doors", dir: "src/kits/lingerie/features/category-doors", minPlan: "starter", kits: ["lingerie"], requires: ["categories"], js: false,
    summary: "Shop by category: tall photographs of women wearing each category (bras, briefs, suspenders, bodies, nightwear, bridal)." },
  { id: "chapters", dir: "src/kits/lingerie/features/chapters", minPlan: "starter", kits: ["lingerie"], requires: ["chapters"], js: false,
    summary: "Chapter openers: a full-width close crop (a strap, a hip, a lace edge) with one line, the price and a link, between sections." },
  { id: "size-guide", section: "sizeGuide", dir: "src/kits/lingerie/features/size-guide", minPlan: "starter", kits: ["lingerie"], requires: ["sizeGuide"], js: false,
    summary: "Size guide: every band and cup the shop stocks or orders in, as a grid, and how its fitters measure; never works out a size." },
  { id: "private-fitting", section: "fitting", dir: "src/kits/lingerie/features/private-fitting", minPlan: "starter", kits: ["lingerie"], requires: ["fitting"], js: true,
    summary: "Private fitting request: what for, the day and time of day, guests, a name; sent on WhatsApp for the shop to confirm (a video fitting for online brands)." },
  { id: "gift-wrap", section: "wrap", dir: "src/kits/lingerie/features/gift-wrap", minPlan: "starter", kits: ["lingerie"], requires: ["giftWrap"], js: true,
    summary: "Gift wrap: how the shop wraps, and the card written on the page, sent on WhatsApp with the order." },
  { id: "discreet", dir: "src/kits/lingerie/features/discreet", minPlan: "starter", kits: ["lingerie"], requires: ["discreet"], js: false,
    summary: "Discreet packaging: the box, the plain outer box and the name on the bank statement, in the shop's own words, beside its packaging photograph." },
  { id: "services", section: "services", dir: "src/kits/lingerie/features/services", minPlan: "starter", kits: ["lingerie"], requires: ["asks"], js: false,
    summary: "Ask the shop: each service (fitting, bridal, personal shopping…) as one line that opens WhatsApp with its own message." },
  { id: "stockists", section: "stockists", dir: "src/kits/lingerie/features/stockists", minPlan: "starter", kits: ["lingerie"], requires: ["stockists"], js: false,
    summary: "Stockists (online brands): the shops that carry the brand, by city, with their links." },
  { id: "tell-us-about-her", section: "her", dir: "src/kits/lingerie/features/tell-us-about-her", minPlan: "plus", kits: ["lingerie"], requires: ["her"], js: true,
    summary: "Tell us about her: her size if he knows it, what she wears, the budget, the wrap and the card, sent as one WhatsApp message; the shop sets pieces aside." },
  { id: "fit-finder", section: "fitFinder", dir: "src/kits/lingerie/features/fit-finder", minPlan: "plus", kits: ["lingerie"], requires: ["fitFinder"], js: true,
    summary: "Fit finder: what's wrong with the bra she wears now (the band rides up, the cup gaps…), what the shop's fitters say that usually means, and what to ask at a fitting; never gives a size." },
  { id: "hint-sheet", dir: "src/kits/lingerie/features/hint-sheet", minPlan: "plus", kits: ["lingerie"], requires: ["pieces", "hint"], js: true,
    summary: "Drop a hint: on any piece, a WhatsApp message she sends to whoever she likes, with the piece, its price, her size if she adds it, and the link." },
  { id: "gift-takeover", dir: "src/kits/lingerie/features/gift-takeover", minPlan: "plus", kits: ["lingerie"], requires: ["takeovers", "pieces"], js: true,
    summary: "Gift takeover: for Valentine's and Christmas the home page opens on the shop's campaign, a countdown to its order-by (and collect-by) time, the edit to give, and the ways to buy for her; it starts and ends on its dates without a rebuild." },
  { id: "the-tray", dir: "src/kits/lingerie/features/the-tray", minPlan: "plus", kits: ["lingerie"], requires: ["pieces"], needs: ["private-fitting"], js: true,
    summary: "The tray: up to three pieces she'd like ready at her fitting, chosen on any piece and sent with the fitting request; the phone remembers them." },
  { id: "drop", section: "drop", dir: "src/kits/lingerie/features/drop", minPlan: "plus", kits: ["lingerie"], requires: ["drop"], js: true,
    summary: "The drop (online brands): a countdown to the next collection in the shop's time zone, the waitlist, then the link to shop it while it's live." },
  { id: "preorders", section: "preorders", dir: "src/kits/lingerie/features/preorders", minPlan: "plus", kits: ["lingerie"], requires: ["pieces", "payLinks"], js: false,
    summary: "Pre-orders (online brands): pieces not yet made, each with when it ships and the brand's own Stripe Payment Link." },
  { id: "under-the-dress", dir: "src/kits/lingerie/features/under-the-dress", minPlan: "plus", kits: ["lingerie"], requires: ["underDress", "guides"], page: "under-the-dress", js: true,
    summary: "Under the dress: pick the dress (backless, plunge, strapless, sheer) and see what the shop says works underneath, with its pieces; a guide and an editorial on one page." },
  { id: "fitting-page", dir: "src/kits/lingerie/features/fitting-page", minPlan: "plus", kits: ["lingerie"], requires: ["guides"], needs: ["private-fitting", "size-guide"], page: "fitting", js: false,
    summary: "The fitting: what happens, how a bra should fit, the size guide, the fit finder and the request, as a guide and an editorial." },
  { id: "bridal-page", dir: "src/kits/lingerie/features/bridal-page", minPlan: "plus", kits: ["lingerie"], requires: ["guides"], page: "bridal", js: false,
    summary: "Bridal: when to start, what to bring, the wedding-morning pieces; the wedding dates on Signature." },
  { id: "for-her-page", dir: "src/kits/lingerie/features/for-her-page", minPlan: "plus", kits: ["lingerie"], requires: ["guides"], needs: ["tell-us-about-her"], page: "for-her", js: false,
    summary: "Buying for her: Tell us about her, gift wrap, gift vouchers, and on Signature the fit passport and the gift concierge." },
  { id: "founder-page", dir: "src/kits/lingerie/features/founder-page", minPlan: "plus", kits: ["lingerie"], requires: ["guides"], page: "story", js: false,
    summary: "The founders' story (online brands), in their own words and photographs." },
  { id: "fit-passport", dir: "src/kits/lingerie/features/fit-passport", minPlan: "signature", kits: ["lingerie"], requires: ["passport"], page: "passport", unlisted: true, js: true,
    summary: "Fit passport: after a fitting she gets a private code; the page shows her sizes from the shop's sheet, and whoever she gives it to can ask the shop for pieces in them. No names on the sheet." },
  { id: "gift-concierge", section: "concierge", dir: "src/kits/lingerie/features/gift-concierge", minPlan: "signature", kits: ["lingerie"], requires: ["concierge"], js: true,
    summary: "Gift concierge: her birthday, your anniversary and Valentine's saved to his calendar, each with reminders weeks before, and a message to the shop to set something aside." },
  { id: "private-evening", section: "evening", dir: "src/kits/lingerie/features/private-evening", minPlan: "signature", kits: ["lingerie"], requires: ["evenings"], js: true,
    summary: "The private evening: the evenings the shop closes for one client, free or taken, from its sheet (hidden if the sheet is old); choose one and ask on WhatsApp, the deposit by the shop's Stripe link." },
  { id: "party-evening", section: "party", dir: "src/kits/lingerie/features/party-evening", minPlan: "signature", kits: ["lingerie"], requires: ["evenings", "bridalParty"], needs: ["private-evening"], js: true,
    summary: "Bridal party evening: the shop closes for the bride and her party on one of its free evenings (the private evening's sheet); she chooses the evening, how many, the wedding date and their names, and asks on WhatsApp." },
  { id: "lace-viewer", section: "lace", dir: "src/kits/lingerie/features/lace-viewer", minPlan: "signature", kits: ["lingerie"], requires: ["lace"], js: true,
    summary: "The lace, close: a large photograph of the lace with a loupe that follows the finger or the pointer, the shop's notes on how it's made." },
  { id: "bridal-timeline", section: "bridalDates", dir: "src/kits/lingerie/features/bridal-timeline", minPlan: "signature", kits: ["lingerie"], requires: ["bridalTimeline"], js: true,
    summary: "Wedding dates: one wedding date in, the shop's own steps out (first fitting, the fitting with the dress, collection), past ones marked, all in one calendar file." },
  { id: "collection-pages", dir: "src/kits/lingerie/features/collection-pages", minPlan: "signature", kits: ["lingerie"], requires: ["collections", "pieces"], page: "collection", js: false,
    summary: "A page for each collection: its own campaign of photographs, its story and every piece in it." },
  { id: "piece-detail", dir: "src/kits/lingerie/features/piece-detail", minPlan: "signature", kits: ["lingerie"], requires: ["collections", "pieces"], page: "piece-detail", js: false,
    summary: "A page for each piece: its photographs, colours, price, sizes and fit notes, and set aside in my size, the tray and the hint." },
  { id: "fuller-bust-page", dir: "src/kits/lingerie/features/fuller-bust-page", minPlan: "signature", kits: ["lingerie"], requires: ["guides"], page: "fuller-bust", js: false,
    summary: "Fuller bust: the shop's range, the shapes that hold, the fitters' notes, as a guide and an editorial." },
  { id: "stockings-page", dir: "src/kits/lingerie/features/stockings-page", minPlan: "signature", kits: ["lingerie"], requires: ["guides"], page: "stockings", js: false,
    summary: "Stockings and suspenders: sizes, a belt or hold-ups, how to fasten, care, as a guide and an editorial." },
  { id: "care-page", dir: "src/kits/lingerie/features/care-page", minPlan: "signature", kits: ["lingerie"], requires: ["guides"], page: "care", js: false,
    summary: "Care: washing and keeping silk and lace, in the shop's own words." },
  { id: "lace-page", dir: "src/kits/lingerie/features/lace-page", minPlan: "signature", kits: ["lingerie"], requires: ["guides"], page: "the-lace", js: false,
    summary: "The lace: the craft (how the shop's lace is made and where), with the lace close-up viewer." },
];

/** Top-level settings no feature lists: the shop itself (boutique or online brand, the strip, the shop link), checked in config.js. */
export const settings = ["shop"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkLingerie;

/**
 * What this kit adds to the site's Content-Security-Policy (src/core/lib/seo.js): `sheets` when it reads a published
 * Google Sheet, and any other sources.
 * @param {any} site @returns {import("../../features/registry.js").KitCsp}
 */
export function csp(site) {
  // The private evenings and the fit passport, each from the shop's own sheet.
  return { sheets: (site.features?.includes("private-evening") && site.evenings?.source === "sheet") || (site.features?.includes("fit-passport") && site.passport?.source === "sheet") };
}
