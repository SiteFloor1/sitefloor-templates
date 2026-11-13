// @ts-check
/**
 * Packages, extras and the package builder. Every price, size and length of job is the studio's own, from site.json;
 * prices are "from" prices for a car of that size, and nothing here adds a figure of its own. A package or extra with
 * no price for a size is left out of that size's total rather than guessed.
 */
import { gbp } from "../../../core/lib/text.js";
import { parseCsv } from "../../../core/lib/sheet.js";

/** @typedef {{ id: string, name: string }} Size */
/** @typedef {{ id: string, name: string, line?: string, days: number, prices: Record<string, number> }} Priced */

/** A package's or extra's "from" price for a size, or null when the studio hasn't priced that size. @param {Priced} item @param {string} size */
export function priceFor(item, size) {
  const p = item?.prices?.[size];
  return Number.isInteger(p) && p > 0 ? p : null;
}

/**
 * The builder's total: one package plus any extras, for one size. Extras the studio hasn't priced for that size are
 * listed in `unpriced` and left out of the sum, so the total never includes a guess.
 * @param {{ pkg: Priced, extras: Priced[], size: string }} o
 * @returns {{ total: number|null, days: number, lines: { name: string, price: number|null }[], unpriced: string[] }}
 */
export function buildTotal({ pkg, extras, size }) {
  const lines = [pkg, ...extras].map((x) => ({ name: x.name, price: priceFor(x, size) }));
  const unpriced = lines.filter((l) => l.price === null).map((l) => l.name);
  const base = priceFor(pkg, size);
  const total = base === null ? null : lines.reduce((sum, l) => sum + (l.price ?? 0), 0);
  // The package's days plus each extra's own days; an extra the studio does alongside the main work has days 0.
  const days = (pkg.days || 0) + extras.reduce((d, x) => d + (x.days || 0), 0);
  return { total, days, lines, unpriced };
}

/** "1 day", "3 days". @param {number} n */
export const daysLabel = (n) => `${n} ${n === 1 ? "day" : "days"}`;

/**
 * The WhatsApp message the builder sends: the studio's opening line, then the choices and the website's "from" total.
 * @param {{ opening: string, size: Size, pkg: Priced, extras: Priced[], car?: string }} o
 */
export function builderText({ opening, size, pkg, extras, car }) {
  const t = buildTotal({ pkg, extras, size: size.id });
  const lines = [
    opening,
    "",
    `Car: ${car?.trim() ? `${car.trim().slice(0, 60)} (${size.name})` : size.name}`,
    `Package: ${pkg.name}`,
    ...(extras.length ? [`Extras: ${extras.map((x) => x.name).join(", ")}`] : []),
    t.total === null ? "Price: please quote" : `Website price: from ${gbp(t.total)}${t.unpriced.length ? ` plus ${t.unpriced.join(", ")} (to quote)` : ""}`,
    `About ${daysLabel(t.days)} with you.`,
  ];
  return lines.join("\n");
}

/**
 * The paint condition request's message: what the visitor told us and the photos they'll send next in the chat
 * (a pre-filled message can't carry photos).
 * @param {{ opening: string, car: string, colour: string, concerns: string[], kept: string, note: string, photos: string[] }} o
 */
export function paintText({ opening, car, colour, concerns, kept, note, photos }) {
  const clean = (/** @type {string} */ s, /** @type {number} */ n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
  return [
    opening,
    "",
    `Car: ${clean(car, 60) || "not given"}${clean(colour, 30) ? `, ${clean(colour, 30)}` : ""}`,
    ...(concerns.length ? [`What bothers me: ${concerns.join(", ")}`] : []),
    ...(kept ? [`Kept: ${kept}`] : []),
    ...(clean(note, 280) ? [`Note: ${clean(note, 280)}`] : []),
    "",
    `I'll send ${photos.length} photos next:`,
    ...photos.map((p, i) => `${i + 1}. ${p}`),
  ].join("\n");
}

/** @typedef {{ ok: true, prices: Map<string, { price: number, days: number }> } | { ok: false }} FilmPrices keyed "package|body" */

/**
 * The studio's film price sheet: one row per package and car, `package` (a package id), `body` (hatch, saloon or suv),
 * `price` (whole pounds) and `days`. Rows for unknown packages or cars, or without a whole price, are skipped, so a
 * typo leaves that price out ("Ask us") rather than showing a wrong one.
 * @param {string} text @param {string[]} packages @param {string[]} bodies @returns {FilmPrices}
 */
export function filmPricesFromCsv(text, packages, bodies) {
  const rows = parseCsv(text);
  if (rows.length < 2) return { ok: false };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const [p, b, pr, d] = ["package", "body", "price", "days"].map((k) => head.indexOf(k));
  if (p < 0 || b < 0 || pr < 0) return { ok: false };
  /** @type {Map<string, { price: number, days: number }>} */ const prices = new Map();
  for (const r of rows.slice(1)) {
    const pkg = (r[p] ?? "").trim().toLowerCase(), body = (r[b] ?? "").trim().toLowerCase();
    const price = Number(String(r[pr] ?? "").replace(/[£,\s]/g, "")), days = d < 0 ? 0 : Number((r[d] ?? "").trim());
    if (!packages.includes(pkg) || !bodies.includes(body) || !Number.isInteger(price) || price < 1) continue;
    prices.set(`${pkg}|${body}`, { price, days: Number.isInteger(days) && days > 0 ? days : 0 });
  }
  return prices.size ? { ok: true, prices } : { ok: false };
}

/**
 * The film builder's WhatsApp message: the studio's opening line, the car, the package and the sheet's price (or a
 * request for one).
 * @param {{ opening: string, body: string, pkg: string, price: number|null, days: number|null }} o
 */
export function filmText({ opening, body, pkg, price, days }) {
  return [opening, "", `Car: ${body}`, `Film: ${pkg}`, price === null ? "Price: please quote" : `Website price: from ${gbp(price)}${days ? `, about ${daysLabel(days)}` : ""}`].join("\n");
}
