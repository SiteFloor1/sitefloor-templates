// @ts-check
/**
 * The words that go into the florist's WhatsApp: built from what the customer chose, so the florist can reply with
 * a price confirmation and their own payment link. No order is taken or paid for by the site itself.
 */

/** £65, £1,250. @param {number} n */
export const pounds = (n) => `£${n.toLocaleString("en-GB")}`;

/**
 * @param {{ lead: string, item: string, size?: { label: string, price: number }, extras?: { name: string, price: number }[], card?: string, postcode?: string, when?: string }} o
 * @returns {string}
 */
export function orderMessage(o) {
  const lines = [o.lead, "", `${o.item}${o.size ? `, ${o.size.label} (${pounds(o.size.price)})` : ""}`];
  for (const x of o.extras ?? []) lines.push(`Add: ${x.name} (${pounds(x.price)})`);
  if (o.when) lines.push(`For: ${o.when}`);
  if (o.postcode) lines.push(`To: ${o.postcode}`);
  const card = (o.card ?? "").trim();
  if (card) lines.push("", "Card:", card);
  return lines.join("\n");
}

/**
 * The card as it will be written: trimmed, no more than `max` characters, at most `lines` lines.
 * @param {string} text @param {number} max @param {number} [lines]
 * @returns {{ text: string, left: number, over: boolean }}
 */
export function cardText(text, max, lines = 8) {
  const kept = String(text).replace(/\r/g, "").split("\n").slice(0, lines).join("\n");
  return { text: kept.slice(0, max), left: max - kept.length, over: kept.length > max };
}

/**
 * The bouquet the florist has photographed nearest to a choice: same palette and size first, then same palette.
 * @template {{ palette: string, size: string }} B
 * @param {B[]} bouquets @param {string} palette @param {string} size
 * @returns {B | null}
 */
export function nearestBouquet(bouquets, palette, size) {
  return bouquets.find((b) => b.palette === palette && b.size === size) ?? bouquets.find((b) => b.palette === palette) ?? null;
}

/**
 * Whether a wedding date can be asked about: in the future, with enough notice, and not one the florist has said
 * is taken. "Taken" is the florist's own list; anything else is "ask", never "free", because only they know.
 * @param {string} date YYYY-MM-DD @param {string} today YYYY-MM-DD @param {{ taken: string[], minWeeks: number }} w
 * @returns {{ state: "past"|"soon"|"taken"|"ask", weeks: number }}
 */
export function weddingDate(date, today, w) {
  const days = Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86400000);
  const weeks = Math.floor(days / 7);
  if (days < 0) return { state: "past", weeks };
  if (w.taken.includes(date)) return { state: "taken", weeks };
  if (weeks < w.minWeeks) return { state: "soon", weeks };
  return { state: "ask", weeks };
}

/**
 * Places left at a workshop, from the built count and an optional live count (the live one wins only if sane).
 * @param {number} places @param {number} built @param {string|undefined} live
 */
export function placesLeft(places, built, live) {
  const n = live !== undefined && /^\d{1,3}$/.test(live.trim()) ? Number(live.trim()) : built;
  return Math.max(0, Math.min(places, n));
}
