// @ts-check
/**
 * The fragrance kit (perfume houses with a boutique and an online shop, and new brands launching): everything the
 * shared build needs to know about it, in one file. src/features/registry.js finds this file by itself (every
 * src/kits/<kit>/kit.js), so adding or changing this kit never edits a shared file. What each export is for:
 * docs/ARCHITECTURE.md, "A kit registers itself". Feature codes (FRAG-n): docs/VISION.md.
 */
import { checkFragrance } from "./config.js";
import { allNotes } from "./lib/fragrance.js";

const K = "src/kits/fragrance/features";
/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- perfume houses (trade/fragrance) ---
  { id: "fragrance-library", section: "library", dir: `${K}/fragrance-library`, minPlan: "starter", kits: ["fragrance"], requires: ["fragrances"], js: true,
    summary: "The fragrances (FRAG-1): each scent with its notes, the house's line, every size and price and the sample; buy by the house's own Stripe link for that size, or order on WhatsApp." },
  { id: "fragrance-sizes", dir: `${K}/fragrance-sizes`, minPlan: "starter", kits: ["fragrance"], requires: ["fragrances"], needs: ["fragrance-library"], js: false,
    summary: "Sizes side by side: every size drawn to scale from its millilitres, with the price for every 10 ml worked out from the house's own prices. No \"best value\" badge." },
  { id: "fragrance-launch", section: "launch", dir: `${K}/fragrance-launch`, minPlan: "starter", kits: ["fragrance"], requires: ["launch", "fragrances"], js: true,
    summary: "Launch mode, for a new house: before the day the hero says what is coming and when, takes names for the waiting list (the house's Google Form) and pre-orders (its Stripe links), with the founder's note; from the day the site is the shop by itself, and the launch scents are marked new for the house's weeks." },
  { id: "fragrance-pages", dir: `${K}/fragrance-pages`, minPlan: "plus", kits: ["fragrance"], requires: ["fragrances"], needs: ["fragrance-library"], page: "fragrances", js: false,
    summary: "The fragrances page: every scent large, its notes as one sentence, the house's words on its character, sizes, prices and the sample." },
  { id: "fragrance-organ", dir: `${K}/fragrance-organ`, minPlan: "plus", kits: ["fragrance"], requires: ["organ", "fragrances"], page: "scent-finder", js: true,
    summary: "The organ (FRAG-2): photographs of the house's real ingredients in black and white; choose up to three you love, they turn to colour and the scents that have them rise, most matches first. Only notes the house lists, never \"you'll love\"." },
  { id: "fragrance-discovery", dir: `${K}/fragrance-discovery`, minPlan: "plus", kits: ["fragrance"], requires: ["discovery", "fragrances"], page: "discovery-sets", js: true,
    summary: "Discovery sets (FRAG-3): choose the house's number of samples, see the set, pay by the house's Stripe link and send the choice, or order on WhatsApp; the discovery terms in the house's words." },
  { id: "fragrance-gifts", dir: `${K}/fragrance-gifts`, minPlan: "plus", kits: ["fragrance"], requires: ["gifts", "engraving", "fragrances"], page: "gifts", js: true,
    summary: "Gifts, engraving and wrapping (FRAG-4): choose the bottle and size, the words, the house's letter style, on the glass or the box, and wrapping; the total from the house's prices, sent as an order on WhatsApp." },
  { id: "fragrance-turntable", dir: `${K}/fragrance-turntable`, minPlan: "signature", kits: ["fragrance"], requires: ["turntable"], js: true,
    summary: "The turntable: the bottle turns as the visitor drags it (or with the arrow keys), from the house's own turntable photographs or a render; the first frame is the poster, the rest load only when the visitor reaches for it. No autoplay." },
  { id: "fragrance-notes", dir: `${K}/fragrance-notes`, minPlan: "signature", kits: ["fragrance"], requires: ["fragrances"], js: true,
    summary: "Notes on the bottle (FRAG-5): the notes as one sentence across the bottle, top at the neck, heart at the shoulder, base at the foot; tap a note to see which other scents in the house have it." },
  { id: "fragrance-engraving-desk", section: "engraving", dir: `${K}/fragrance-engraving-desk`, minPlan: "signature", kits: ["fragrance"], requires: ["engraving", "fragrances"], js: true,
    summary: "The engraving desk: type the words and see them on the bottle in the house's letter styles, within its letter limit; labelled a preview. Needs one front-on picture with the engravable area marked." },
  { id: "fragrance-choose", dir: `${K}/fragrance-choose`, minPlan: "signature", kits: ["fragrance"], requires: ["choose", "fragrances"], needs: ["fragrance-gifts"], js: true,
    summary: "Let them choose: pay an amount by the house's Stripe link and write the card; the one who receives it tries samples, then chooses the bottle and engraving and sends the code on WhatsApp for the house to check." },
];

// Reviews only ever come from the house's own Google reviews, so no demo shows them.
export const clientOnly = ["reviews"];
// Not for a perfume house: its photographs are the bottles (no feed, team or photo band), and Let them choose replaces vouchers.
export const refuses = ["work", "vouchers", "gallery", "team", "photo-band"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkFragrance;

/** Top-level keys only some of this kit's looks read. */
export const settings = ["turntable"];

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** @param {any} site */
export function pageData(site) {
  const on = (/** @type {string} */ id) => site.features.includes(id);
  const f = site.fragrances;
  const lite = (/** @type {any} */ x) => ({ id: x.id, name: x.name, notes: allNotes(x), sizes: x.sizes.map((/** @type {any} */ s) => ({ ml: s.ml, price: s.price, payLink: s.payLink ?? "" })), sample: x.sample ? { ml: x.sample.ml, price: x.sample.price, payLink: x.sample.payLink ?? "" } : null });
  const t = site.turntable;
  return {
    name: site.business.name,
    fragrances: f.items.map(lite),
    message: f.message,
    sampleMessage: f.sampleMessage ?? "",
    turntable: on("fragrance-turntable") && t ? { frames: t.frames, repeat: t.repeat ?? t.frames, width: t.width } : null,
    engraving: (on("fragrance-engraving-desk") || on("fragrance-gifts")) && site.engraving ? { price: site.engraving.price, max: site.engraving.maxLetters, message: site.engraving.message, fragrance: site.engraving.fragrance, ml: site.engraving.ml, payLink: site.engraving.payLink ?? "", area: site.engraving.area ?? null } : null,
    gifts: on("fragrance-gifts") ? { wrap: site.gifts.wrap ?? null, message: site.gifts.message } : null,
    discovery: on("fragrance-discovery") ? { pick: site.discovery.pick, price: site.discovery.price, message: site.discovery.message, payLink: site.discovery.payLink ?? "" } : null,
    organ: on("fragrance-organ") ? { max: site.organ.max ?? 3 } : null,
    choose: on("fragrance-choose") ? { amounts: site.choose.amounts.map((/** @type {any} */ a) => ({ amount: a.amount, payLink: a.payLink ?? "" })), message: site.choose.message, redeemMessage: site.choose.redeemMessage } : null,
    launch: on("fragrance-launch") ? { date: site.launch.date, newWeeks: site.launch.newWeeks ?? 0, scents: site.launch.scents, message: site.launch.message, preorder: site.launch.preorder ?? {}, formUrl: site.launch.waitlist?.formUrl ?? "", demo: site.mode === "demo" } : null,
  };
}
