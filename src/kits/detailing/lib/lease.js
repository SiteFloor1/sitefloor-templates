// @ts-check
/**
 * The lease-return check: what an end-of-lease inspection usually looks at on a car, in plain words, from the BVRLA
 * Fair Wear & Tear Standard for Cars (updated December 2022) as UK lease companies publish it. Checked 5 November
 * 2026; sources in src/kits/detailing/features/lease-return/README.md. Only limits two or more published summaries
 * agree on are given; each lease company's own guide and inspector decide. Prices are only the studio's, from its
 * sheet; an item the studio doesn't price says "Ask us", and items a detailer doesn't fix (keys, papers, tyres) carry
 * no price at all.
 */
import { parseCsv } from "../../../core/lib/sheet.js";
import { gbp } from "../../../core/lib/text.js";

export const LEASE_SOURCE = {
  name: "BVRLA Fair Wear & Tear Standard for Cars",
  edition: "updated December 2022",
  checked: "2026-11-05",
  url: "https://www.bvrla.co.uk/resource/bvrla-s-fair-wear-tear-standard-for-cars-updated.html",
};

/**
 * `fix`: whether a detailing studio can usually put it right (only those can carry a price).
 * @typedef {{ id: string, group: string, name: string, looks: string, fix: boolean }} LeaseItem
 * @type {LeaseItem[]}
 */
export const LEASE_ITEMS = [
  { id: "scratches", group: "Paint and body", name: "Scratches", looks: "A scratch longer than 25mm, or one through to the primer or bare metal.", fix: true },
  { id: "chips", group: "Paint and body", name: "Stone chips", looks: "Several chips on one panel, or chips through to bare metal.", fix: true },
  { id: "dents", group: "Paint and body", name: "Dents", looks: "Dents where the paint is broken, more than two on a panel, or any on the roof or a swage line.", fix: true },
  { id: "bumpers", group: "Paint and body", name: "Bumper scuffs", looks: "Scuffs and scratches that need repainting; cracks.", fix: true },
  { id: "wheels", group: "Wheels and tyres", name: "Alloy wheel scuffs", looks: "Kerbing of more than 50mm in all around the rim, or damage to a spoke or the hub.", fix: true },
  { id: "tyres", group: "Wheels and tyres", name: "Tyres", looks: "Damage to the tread or sidewall, or tread below the legal limit.", fix: false },
  { id: "lights", group: "Glass and lights", name: "Headlight lenses", looks: "Scratches on a lens beyond light scuffs; a crack or hole means a new lamp.", fix: true },
  { id: "glass", group: "Glass and lights", name: "Windscreen chips", looks: "Chips or cracks in the driver's view.", fix: false },
  { id: "mirrors", group: "Glass and lights", name: "Mirrors", looks: "Cracked or missing mirror glass or casings.", fix: false },
  { id: "stains", group: "Inside", name: "Stains and marks", looks: "Staining on seats, carpets and trim.", fix: true },
  { id: "tears", group: "Inside", name: "Burns and tears", looks: "Burns, tears or holes in seats, carpets and trim.", fix: false },
  { id: "papers", group: "Keys and papers", name: "Keys, papers and service history", looks: "Every key, the V5C, the handbook and a stamped service record; on an electric car, its charging cables.", fix: false },
];

/** @typedef {{ ok: true, prices: Map<string, number> } | { ok: false }} LeasePrices */

/**
 * The studio's lease-return prices: one row per item it fixes, `item` (an id above) and `price` ("from", whole
 * pounds). Unknown items, items a detailer doesn't fix and prices that aren't whole pounds are skipped.
 * @param {string} text @returns {LeasePrices}
 */
export function leasePricesFromCsv(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) return { ok: false };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const [i, p] = ["item", "price"].map((k) => head.indexOf(k));
  if (i < 0 || p < 0) return { ok: false };
  const fixable = new Set(LEASE_ITEMS.filter((x) => x.fix).map((x) => x.id));
  /** @type {Map<string, number>} */ const prices = new Map();
  for (const r of rows.slice(1)) {
    const id = String(r[i] ?? "").trim().toLowerCase(), price = Number(String(r[p] ?? "").replace(/[£,\s]/g, ""));
    if (fixable.has(id) && Number.isInteger(price) && price > 0) prices.set(id, price);
  }
  return prices.size ? { ok: true, prices } : { ok: false };
}

/**
 * What the visitor ticked: the priced items' "from" total, the items to ask about, and the ones that aren't ours.
 * @param {string[]} ticked @param {Map<string, number>} prices
 */
export function leaseTotal(ticked, prices) {
  const items = LEASE_ITEMS.filter((x) => ticked.includes(x.id));
  const priced = items.filter((x) => x.fix && prices.has(x.id));
  return {
    total: priced.reduce((s, x) => s + /** @type {number} */ (prices.get(x.id)), 0),
    priced: priced.map((x) => ({ name: x.name, price: /** @type {number} */ (prices.get(x.id)) })),
    ask: items.filter((x) => x.fix && !prices.has(x.id)).map((x) => x.name),
    notOurs: items.filter((x) => !x.fix).map((x) => x.name),
  };
}

/** The WhatsApp message: the studio's opening, the return date if given, and what was ticked. */
export function leaseText(/** @type {{ opening: string, ticked: string[], prices: Map<string, number>, returnBy?: string }} */ o) {
  const t = leaseTotal(o.ticked, o.prices);
  return [
    o.opening, "",
    ...(o.returnBy ? [`Car goes back: ${o.returnBy.split("-").reverse().join("/")}`] : []),
    ...t.priced.map((x) => `${x.name}: from ${gbp(x.price)}`),
    ...(t.ask.length ? [`Please quote: ${t.ask.join(", ")}`] : []),
    ...(t.priced.length ? [`Website total: from ${gbp(t.total)}`] : []),
  ].join("\n");
}
