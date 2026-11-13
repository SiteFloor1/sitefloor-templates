// @ts-check
/**
 * A jeweller's pieces: what the page may say about each one. Every fact comes from the client's site.json; a field
 * left empty shows nothing, and the price is shown only as the client sets it (a price, "from £…" or "Price on request").
 */

/** The facts a piece can carry, in the order they are read out. Labels are what the page shows beside each. */
export const FACTS = /** @type {const} */ ([
  ["metal", "Metal"],
  ["stones", "Stones"],
  ["carat", "Carat"],
  ["cut", "Cut"],
  ["setting", "Setting"],
  ["size", "Size"],
  ["dimensions", "Dimensions"],
  ["hallmark", "Hallmark"],
  ["certificate", "Certificate"],
  ["sourcing", "Sourcing"],
]);
export const FACT_KEYS = FACTS.map(([k]) => k);
/** Facts a demo may never carry: hallmarks, certificates and sourcing are only ever the client's own words. */
export const CLIENT_ONLY_FACTS = ["hallmark", "certificate", "sourcing"];

/**
 * Claims that need proof. They may appear only in the matching fact field, filled by the client; anywhere else in a
 * piece (its name, story, alt text) the build refuses them, so a stray word in a description can't make a claim.
 */
export const CLAIM_WORDS = [
  { re: /\b(hallmark(ed|s)?|assay(ed)?|sponsor'?s mark)\b/i, field: "hallmark" },
  { re: /\b(GIA|IGI|HRD|AGS|EGL|certificat(e|ed|ion)|certified|graded by)\b/i, field: "certificate" },
  { re: /\b(ethical(ly)?|conflict[- ]free|recycled|lab[- ]grown|lab[- ]created|fair ?trade|fairmined|responsibly sourced|traceable|Kimberley)\b/i, field: "sourcing" },
  { re: /\b(guarantee(d)?|warrant(y|ied)|lifetime)\b/i, field: "aftercare" },
];

/** @param {string} text @returns {string|null} the field such a claim belongs in, or null */
export function claimIn(text) {
  for (const c of CLAIM_WORDS) if (c.re.test(text)) return c.field;
  return null;
}

/**
 * The price line under a piece, exactly as the client set it.
 * @param {{ price?: number, priceFrom?: boolean, onRequest?: boolean }} p
 * @returns {string} empty when the client gave nothing
 */
export function priceLabel(p) {
  if (p.onRequest) return "Price on request";
  if (typeof p.price !== "number") return "";
  const n = p.price.toLocaleString("en-GB", { maximumFractionDigits: 0 });
  return p.priceFrom ? `From £${n}` : `£${n}`;
}

/**
 * The piece's facts as [label, value] pairs, only those the client filled.
 * @param {{ facts?: Record<string, string> }} p
 * @returns {[string, string][]}
 */
export function factLines(p) {
  const f = p.facts ?? {};
  return FACTS.filter(([k]) => typeof f[k] === "string" && f[k].trim()).map(([k, label]) => [label, f[k].trim()]);
}

/**
 * One short spec line ("Platinum · 5.02 ct · Round brilliant"), from metal, carat and cut.
 * @param {{ facts?: Record<string, string> }} p
 */
export function specLine(p) {
  const f = p.facts ?? {};
  return ["metal", "carat", "cut"].map((k) => f[k]).filter((v) => typeof v === "string" && v.trim()).join(" · ");
}

/**
 * Pieces of a collection, in the client's order.
 * @template {{ collection: string }} T @param {T[]} items @param {string} id @returns {T[]}
 */
export function inCollection(items, id) {
  return items.filter((p) => p.collection === id);
}

/** The words for a count of pieces ("One piece", "Three pieces", "12 pieces"). @param {number} n */
export function countWords(n) {
  const words = ["No pieces", "One piece", "Two pieces", "Three pieces", "Four pieces", "Five pieces", "Six pieces", "Seven pieces", "Eight pieces", "Nine pieces", "Ten pieces"];
  return words[n] ?? `${n} pieces`;
}

/**
 * Three within a price band, for a gift: only pieces the client has priced (never "on request") and has chosen for the
 * occasion or marked as gifts; the occasion's own first, the dearest first within each.
 * @template {{ id: string, price?: number, onRequest?: boolean, gift?: boolean }} T
 * @param {T[]} items @param {{ min?: number, max?: number }} band @param {string[]} [prefer] @param {number} [n]
 * @returns {T[]}
 */
export function shortlist(items, band, prefer = [], n = 3) {
  const rank = (/** @type {T} */ p) => (prefer.includes(p.id) ? 0 : 1);
  return items
    .filter((p) => (prefer.includes(p.id) || p.gift) && typeof p.price === "number" && !p.onRequest && p.price >= (band.min ?? 0) && p.price <= (band.max ?? Infinity))
    .sort((a, b) => rank(a) - rank(b) || /** @type {number} */ (b.price) - /** @type {number} */ (a.price))
    .slice(0, n);
}

/**
 * What a bridal party order comes to at the client's own prices, before engraving; null if a chosen piece has no price.
 * @param {{ n: number, price?: number, onRequest?: boolean }[]} rows
 * @returns {{ count: number, total: number|null }}
 */
export function partyTotal(rows) {
  const on = rows.filter((r) => r.n > 0);
  const count = on.reduce((s, r) => s + r.n, 0);
  const priced = on.every((r) => typeof r.price === "number" && !r.onRequest);
  return { count, total: priced && count ? on.reduce((s, r) => s + r.n * /** @type {number} */ (r.price), 0) : null };
}
