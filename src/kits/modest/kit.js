// @ts-check
/**
 * The modest kit (modest fashion and abaya boutiques): everything the shared build needs to know about it, in one file.
 * src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so adding or changing this kit never
 * edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 */
import { checkModest } from "./config.js";
import { PRESETS } from "../../core/lib/seasons.js";
import { buildNow } from "../../core/lib/build-day.js";

const K = "src/kits/modest/features";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- modest (trade/modest) ---
  // Abaya and modest wear boutiques that sell from a studio by appointment, online and on WhatsApp. Starter: the
  // collection with the model line, and the size guide by height; Plus: a page per part of the collection, the length
  // guide, Eid last order dates and private appointments; Signature: the hem line, complete the look, the Eid family
  // list and made to measure; the fabric library needs the shop's own close-ups, so it is client-only.
  { id: "modest-collection", section: "collection", dir: `${K}/modest-collection`, minPlan: "starter", kits: ["modest"], requires: ["pieces"], js: false,
    summary: "The collection (MOD-1, MOD-13): each piece large, with its one line, price and the lengths it comes in, and under each photograph what the model wears (\"Shown in the 58, in 2″ heels\")." },
  { id: "modest-size-guide", section: "sizeGuide", dir: `${K}/modest-size-guide`, minPlan: "starter", kits: ["modest"], requires: ["lengths"], js: false,
    summary: "The size guide by height (MOD-2): the shop's own chart, height to shoulder-to-floor to length. With the hem line on, it opens from \"Only know your height?\" inside it." },
  { id: "modest-hem-line", section: "hemLine", dir: `${K}/modest-hem-line`, minPlan: "signature", kits: ["modest"], requires: ["lengths", "hemLine"], js: true,
    summary: "The hem line (MOD-9): shoulder to floor and her shoes in one sentence; the shop's length that clears the floor, and a ruler beside a real hem photograph showing where each length stops and the gap to the floor, to scale." },
  { id: "modest-category-pages", dir: `${K}/modest-category-pages`, minPlan: "plus", kits: ["modest"], requires: ["pieces"], needs: ["modest-collection"], page: "category", collection: true, js: false,
    summary: "A page for each part of the collection (abayas, occasion wear, hijabs and accessories), every piece with its line, price, lengths and model line. Each part counts as a page of the plan." },
  { id: "modest-length", dir: `${K}/modest-length`, minPlan: "plus", kits: ["modest"], requires: ["lengths", "pieces"], page: "length", js: true,
    summary: "The size and length guide (MOD-3): how to measure shoulder to floor, then her measurement and shoes give the shop's length and the pieces that come in it; the height chart beneath." },
  { id: "modest-eid", section: "eid", dir: `${K}/modest-eid`, minPlan: "plus", kits: ["modest"], requires: ["eid"], js: true,
    summary: "Eid last order dates (MOD-5): the next Eid's expected window (it follows the moon sighting) and the shop's own cut-offs counted back from it, each with the days left; past cut-offs say closed. No Eid ahead in the calendar: nothing shows." },
  { id: "modest-appointment", dir: `${K}/modest-appointment`, minPlan: "plus", kits: ["modest"], requires: ["appointments"], page: "appointments", js: true,
    summary: "Private appointments (MOD-10): the shop's standing times on the coming dates, how many are coming and what for, sent as a request on WhatsApp; the shop confirms by message." },
  { id: "modest-look", dir: `${K}/modest-look`, minPlan: "signature", kits: ["modest"], requires: ["looks", "pieces"], page: "the-look", js: true,
    summary: "Complete the look (MOD-6): each of the shop's sets (abaya, hijab, inner), with her length and the optional pieces; one total in a quiet bar, sent on WhatsApp or paid through the shop's own Stripe link for the set. The bar shows the look on every page." },
  { id: "modest-family", dir: `${K}/modest-family`, minPlan: "signature", kits: ["modest"], requires: ["family", "pieces"], needs: ["modest-eid"], page: "eid", js: true,
    summary: "The Eid family list (MOD-11): one link the family fills in, each person's name, piece and length, with the total; the list lives only in the link (nothing stored) and goes to the shop as one WhatsApp order." },
  { id: "modest-made-to-measure", dir: `${K}/modest-made-to-measure`, minPlan: "signature", kits: ["modest"], requires: ["madeToMeasure"], page: "made-to-measure", js: false,
    summary: "Made to measure (MOD-7): the shop's steps, the measurements it takes, how long it takes and the price it starts from, with a close-up of the work." },
  { id: "modest-fabrics", dir: `${K}/modest-fabrics`, minPlan: "signature", kits: ["modest"], requires: ["fabrics"], page: "fabrics", js: false,
    summary: "The fabric library (MOD-8): the shop's own close-ups of each cloth, with its weight, how it falls and its care. Needs the shop's own photographs, so it is client-only." },
];

/** Shared features only some trades offer: this one does (a Stripe link per look). */
export const uses = ["pay-link"];
// The collection replaces a gallery; the studio shows the clothes, not the staff.
export const refuses = ["gallery", "work", "photo-band", "team"];
// The fabric library needs the shop's own close-ups; reviews only ever come from the shop's own Google reviews.
export const clientOnly = ["modest-fabrics", "reviews"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkModest;

/** A piece's card for the browser. @param {any} p */
const piece = (p) => ({ id: p.id, name: p.name, price: p.price, lengths: p.lengths ?? [] });

/**
 * Eid's expected windows for this year and the next three, from the shared lunar table (approximate: they follow
 * the moon sighting). The browser picks the next one; the demo and every client are rebuilt often enough.
 */
export function eidWindows(year = new Date(buildNow()).getUTCFullYear()) {
  /** @type {{ name: string, from: string, to: string }[]} */ const out = [];
  for (let y = year - 1; y <= year + 3; y++) for (const id of ["eid-al-fitr", "eid-al-adha"]) {
    const p = PRESETS.find((x) => x.id === id);
    const d = p?.dates(y);
    if (p && d) out.push({ name: p.name, from: d[0], to: d[1] });
  }
  return out;
}

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** @param {any} site */
export function pageData(site) {
  const on = (/** @type {string} */ id) => site.features.includes(id);
  const items = site.pieces?.items ?? [];
  const byId = (/** @type {string} */ id) => items.find((/** @type {any} */ x) => x.id === id);
  const L = site.lengths;
  return {
    lengths: on("modest-hem-line") || on("modest-length")
      ? { lengths: L.sizes, clear: L.clear ?? 0.5, rows: L.chart, shoes: L.shoes, start: L.start, pieces: items.filter((/** @type {any} */ p) => p.lengths?.length).map(piece) }
      : null,
    eid: on("modest-eid") ? { windows: eidWindows(), cutoffs: site.eid.cutoffs } : null,
    appointments: on("modest-appointment") ? { weekly: site.appointments.weekly, days: site.appointments.days ?? 21, closed: site.appointments.closed ?? [] } : null,
    looks: on("modest-look")
      ? { sets: site.looks.sets.map((/** @type {any} */ s) => ({ id: s.id, name: s.name, items: s.items.map((/** @type {any} */ i) => ({ ...piece(byId(i.piece)), optional: i.optional === true })) })) }
      : null,
    family: on("modest-family") ? { pieces: site.family.pieces.map((/** @type {string} */ id) => piece(byId(id))), max: site.family.max ?? 8 } : null,
    name: site.business.name,
  };
}
