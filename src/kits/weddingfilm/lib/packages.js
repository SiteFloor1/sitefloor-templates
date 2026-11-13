// @ts-check
/**
 * Packages and the package builder: the studio's own packages and extras, in whole pounds, added up as the couple
 * chooses. Nothing here sets a price; a package without one is "price on request" and the builder then shows no total.
 */

/** @typedef {{ id: string, name: string, price: number|null }} Pkg */
/** @typedef {{ id: string, name: string, price: number, per?: string, max?: number }} Extra */

/** £ in whole pounds, UK style. @param {number} n */
export const gbp = (n) => `£${n.toLocaleString("en-GB")}`;

/**
 * The total for a package and extras. `counts` holds how many of each extra (1 for a yes/no extra; more for one sold
 * per hour), clamped to the extra's max. Null when the package has no price.
 * @param {Pkg} pkg @param {Extra[]} extras @param {Record<string, number>} counts
 * @returns {{ total: number, lines: { name: string, amount: number }[] }|null}
 */
export function builderTotal(pkg, extras, counts) {
  if (pkg.price === null) return null;
  const lines = [{ name: pkg.name, amount: pkg.price }];
  for (const x of extras) {
    const n = Math.max(0, Math.min(x.max ?? 1, Math.floor(counts[x.id] ?? 0)));
    if (n) lines.push({ name: n > 1 ? `${x.name} × ${n}` : x.name, amount: x.price * n });
  }
  return { total: lines.reduce((s, l) => s + l.amount, 0), lines };
}

/**
 * The WhatsApp message for a built package. @param {string} opening
 * @param {{ pkg: Pkg, extras: Extra[], counts: Record<string, number>, date?: string, venue?: string }} o
 */
export function builderText(opening, o) {
  const t = builderTotal(o.pkg, o.extras, o.counts);
  const lines = [opening.trim(), "", `Package: ${o.pkg.name}`];
  for (const x of o.extras) {
    const n = Math.max(0, Math.min(x.max ?? 1, Math.floor(o.counts[x.id] ?? 0)));
    if (n) lines.push(`Add: ${n > 1 ? `${x.name} × ${n}` : x.name}`);
  }
  if (t) lines.push(`Total on your site: ${gbp(t.total)}`);
  if (o.date) lines.push(`Wedding: ${o.date}`);
  if (o.venue?.trim()) lines.push(`Venue: ${o.venue.trim()}`);
  return lines.join("\n");
}
