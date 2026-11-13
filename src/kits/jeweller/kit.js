// @ts-check
/**
 * The jeweller kit (fine jewellers and goldsmiths): everything the shared build needs to know about it, in one file.
 * src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so adding or changing this kit never
 * edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 */
import { checkJeweller } from "./config.js";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- jeweller (trade/jeweller) ---
  // Fine jewellers and goldsmiths. Starter: every piece shown large with only the client's facts, collections, a private
  // appointment request; Plus: the pages (pieces, bridal, bespoke, gifts…), the ring sizer, the tray; Signature: the piece in detail.
  { id: "collections", section: "collections", dir: "src/kits/jeweller/features/collections", minPlan: "starter", kits: ["jeweller"], requires: ["pieces"], js: false,
    summary: "The collections on the home page as doors: a tall photograph of a piece worn and the name; each opens its collection's page (or the pieces one at a time)." },
  { id: "piece-viewer", dir: "src/kits/jeweller/features/piece-viewer", minPlan: "starter", kits: ["jeweller"], requires: ["pieces"], needs: ["collections"], js: true,
    summary: "One piece at a time: tap any piece to see it full screen with its facts and price (only what the client gives), step to the next with a swipe or the arrow keys, and ask to see it in person." },
  { id: "appointment-request", section: "appointment", dir: "src/kits/jeweller/features/appointment-request", minPlan: "starter", kits: ["jeweller"], requires: ["appointments"], js: true,
    summary: "Visit and appointment: the address and opening hours beside the private appointment request (what it's for, when suits, the pieces to see, a name), sent on WhatsApp for the house to offer a time. A request, never a booking. A plain WhatsApp link without JavaScript." },
  { id: "drop-a-hint", dir: "src/kits/jeweller/features/drop-a-hint", minPlan: "starter", kits: ["jeweller"], requires: ["pieces"], needs: ["piece-viewer"], js: true,
    summary: "Drop a hint: send a piece, its price as the client sets it and its link to someone, on WhatsApp or the phone's own share sheet." },
  { id: "private-room", section: "room", dir: "src/kits/jeweller/features/private-room", minPlan: "starter", kits: ["jeweller"], requires: ["room"], js: false,
    summary: "The room: one photograph of the private room where pieces are shown, with the house's own line about it." },
  { id: "in-the-box", section: "box", dir: "src/kits/jeweller/features/in-the-box", minPlan: "starter", kits: ["jeweller"], requires: ["box"], js: false,
    summary: "In the box: one full-width band of the house's signature colour with the client's own box photographed and the monogram; what comes with every piece on piece pages, in the client's words." },
  { id: "visit-prepared", section: "prepared", dir: "src/kits/jeweller/features/visit-prepared", minPlan: "starter", kits: ["jeweller"], requires: ["prepared"], js: false,
    summary: "What happens at an appointment: the house's own steps (arrive, sit, see the pieces, take your time), how long it takes and what to bring." },
  { id: "jewel-pages", dir: "src/kits/jeweller/features/jewel-pages", minPlan: "plus", kits: ["jeweller"], requires: ["pieces", "piecesPage"], needs: ["collections"], page: "pieces", morePages: ["piece", "collection"], js: false,
    summary: "The pieces: every collection on one page, a page for each collection (the doors on the home page open them) and a page for each piece telling its story, with its facts, more photographs and the appointment. Counts as one page." },
  { id: "bridal", dir: "src/kits/jeweller/features/bridal", minPlan: "plus", kits: ["jeweller"], requires: ["pieces", "bridal"], page: "bridal", js: false,
    summary: "Bridal: engagement rings and wedding bands together, the client's words on how a ring is chosen, and the appointment." },
  { id: "engagement-guide", dir: "src/kits/jeweller/features/engagement-guide", minPlan: "plus", kits: ["jeweller"], requires: ["engagementGuide", "pieces"], page: "engagement", js: false,
    summary: "The engagement guide: shapes (in the client's own photographs), metals, sizing and settings, in the house's own words, each leading to its pieces." },
  { id: "wedding-bands", dir: "src/kits/jeweller/features/wedding-bands", minPlan: "plus", kits: ["jeweller"], requires: ["pieces", "weddingBands"], page: "wedding-bands", js: false,
    summary: "Wedding bands: the house's bands by width and finish, as the client describes them, with matching bands and engraving notes." },
  { id: "bespoke", dir: "src/kits/jeweller/features/bespoke", minPlan: "plus", kits: ["jeweller"], requires: ["bespoke"], page: "bespoke", js: true,
    summary: "Bespoke: the house's own process step by step with its timings, the commission deposit (the client's own Payment Link), and a brief sent on WhatsApp (piece, stone, metal, budget, date wanted, the story)." },
  { id: "family-pieces", dir: "src/kits/jeweller/features/family-pieces", minPlan: "plus", kits: ["jeweller"], requires: ["family"], page: "family-pieces", js: true,
    summary: "Family pieces: remodelling an inherited piece, before and after in the client's own photographs, what can be kept and how it starts." },
  { id: "gifts", dir: "src/kits/jeweller/features/gifts", minPlan: "plus", kits: ["jeweller"], requires: ["pieces", "gifts"], page: "gifts", js: false,
    summary: "Gifts: pieces by the price bands the client sets, gift vouchers, gift wrapping in the client's words, and a hint to send." },
  { id: "occasions", dir: "src/kits/jeweller/features/occasions", minPlan: "plus", kits: ["jeweller"], requires: ["occasions", "pieces"], page: "occasions", morePages: ["occasion"], js: true,
    summary: "Occasions: the next one leads (Valentine's, Mother's Day, Eid, Diwali, proposal season, anniversaries) with the client's pieces for it; past dates drop off by themselves. Occasions the client gives a photograph (anniversaries, birthdays, Valentine's…) get a page of their own." },
  { id: "bridal-party", dir: "src/kits/jeweller/features/bridal-party", minPlan: "plus", kits: ["jeweller"], requires: ["party", "pieces"], page: "bridal-party", js: true,
    summary: "Bridal party pieces: matching pieces for bridesmaids, mothers and the rest of the party, each role with its piece and how many, the wedding date and names for the boxes; what it comes to at the client's own prices, sent as a request on WhatsApp." },
  { id: "birthstone", section: "birthstone", dir: "src/kits/jeweller/features/birthstone", minPlan: "plus", kits: ["jeweller"], requires: ["birthstones", "pieces"], page: "birthstones", js: true,
    summary: "Birthstones: this month's stone on the home page with the client's piece for it, and a page month by month (the client's own list and pieces); this month is marked and it moves on by itself." },
  { id: "ring-sizer", dir: "src/kits/jeweller/features/ring-sizer", minPlan: "plus", kits: ["jeweller"], requires: ["ringSizer"], page: "ring-size", js: true,
    summary: "Ring size, as a guide: measure with string or match a ring you own on screen (scaled with a bank card) for a UK letter size from a dated chart; a free sizer by post on WhatsApp." },
  { id: "aftercare-reminder", dir: "src/kits/jeweller/features/aftercare-reminder", minPlan: "plus", kits: ["jeweller"], requires: ["aftercare"], page: "aftercare", js: true,
    summary: "Aftercare: cleaning, checks and repairs in the house's own words, and a yearly clean-and-check reminder for the customer's calendar (.ics, times in UTC)." },
  { id: "your-tray", dir: "src/kits/jeweller/features/your-tray", minPlan: "plus", kits: ["jeweller"], requires: ["pieces", "appointments"], needs: ["appointment-request"], js: true,
    summary: "Your tray: set aside up to three pieces as you browse; they go with the appointment request so they're ready on the tray when you arrive." },
  { id: "anniversary-reminder", section: "anniversary", dir: "src/kits/jeweller/features/anniversary-reminder", minPlan: "plus", kits: ["jeweller"], requires: ["anniversary"], js: true,
    summary: "Anniversary reminder: the date and a few weeks' notice go into the customer's calendar, every year (.ics, times in UTC)." },
  { id: "stone-guide", section: "stones", dir: "src/kits/jeweller/features/stone-guide", minPlan: "plus", kits: ["jeweller"], requires: ["stones", "pieces"], js: true,
    summary: "The stone guide: each shape the house sets, in its own macro photographs, with its words and the pieces in that shape." },
  { id: "the-piece", dir: "src/kits/jeweller/features/the-piece", minPlan: "signature", kits: ["jeweller"], requires: ["pieces"], needs: ["jewel-pages"], js: false,
    summary: "The piece in detail: on its own page, each piece in the house's macro photographs, very large: the stone, the claws, the shoulders, the band." },
  { id: "on-a-hand", dir: "src/kits/jeweller/features/on-a-hand", minPlan: "signature", kits: ["jeweller"], requires: ["pieces"], needs: ["jewel-pages"], js: true,
    summary: "See it on a hand: the piece worn, in the house's photograph; matched once to a bank card, it shows at true size on this screen." },
  { id: "pair-it", dir: "src/kits/jeweller/features/pair-it", minPlan: "signature", kits: ["jeweller"], requires: ["pieces"], needs: ["jewel-pages"], js: true,
    summary: "Pair it: an engagement ring beside each wedding band the house suggests for it, from its own photographs, to choose the pair." },
  { id: "sketch-to-ring", section: "stories", dir: "src/kits/jeweller/features/sketch-to-ring", minPlan: "signature", kits: ["jeweller"], requires: ["stories"], page: "stories", js: false,
    summary: "From sketch to ring: past commissions told in the house's own photographs, from the first drawing to the finished piece, each with its timings." },
  { id: "inside-the-band", dir: "src/kits/jeweller/features/inside-the-band", minPlan: "signature", kits: ["jeweller"], requires: ["engraving"], js: true,
    summary: "Inside the band: type the words and see them set inside a band, within the house's own letter limit and styles; sent with the request." },
  { id: "proposal-brief", section: "proposal", dir: "src/kits/jeweller/features/proposal-brief", minPlan: "signature", kits: ["jeweller"], requires: ["proposal"], js: true,
    summary: "Planning a proposal: the date, their size if known, what they wear and a budget, sent privately on WhatsApp so the house can help." },
  { id: "gift-shortlist", dir: "src/kits/jeweller/features/gift-shortlist", minPlan: "signature", kits: ["jeweller"], requires: ["gifts", "pieces"], needs: ["jewel-pages"], js: false,
    summary: "Three within your budget: on the anniversary reminder and each occasion's page, choose a price band and see three of the client's priced pieces for it; the reminder carries them in the calendar every year. Works without JavaScript." },
  { id: "vitrine", dir: "src/kits/jeweller/features/vitrine", minPlan: "signature", kits: ["jeweller"], requires: ["pieces"], needs: ["jewel-pages"], js: false,
    summary: "The vitrine: the pieces page as a cabinet of drawers, one per collection; open one and its pieces lie in a tray, each opening full screen. Native drawers, so it works without JavaScript." },
  { id: "the-card", dir: "src/kits/jeweller/features/the-card", minPlan: "signature", kits: ["jeweller"], requires: ["giftNote"], needs: ["occasions"], js: true,
    summary: "The gift, arranged: on an occasion's page, choose the piece, the day it's needed and write the card that goes in the box, shown on the house's card as it's typed; sent as a request on WhatsApp." },
];

/** Shared features only some trades offer: this one does. */
export const uses = ["date-range", "pay-link"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkJeweller;

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** Config the jeweller scripts need: where the house is, for calendar reminders. Pieces travel in the HTML. @param {any} site */
export function pageData(site) {
  return { place: [site.business.name, site.location.streetAddress, site.location.locality, site.location.postcode].filter(Boolean).join(", "), url: site.url };
}
