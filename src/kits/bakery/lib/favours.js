// @ts-check
/**
 * Favours: boxes of chocolates for a wedding, a party or a company, by the dozen. The shop's price per box for each
 * size, less per box from a quantity it sets; the earliest date it can make them; the request on WhatsApp. On
 * Signature the boxes carry "your seal": the shop's seal redrawn with the couple's or company's initials and a line
 * around the ring. No DOM; the browser module uses these.
 */
import { gbp } from "../../../core/lib/text.js";
import { addDays } from "../../../core/lib/hours.js";

/** @typedef {{ id: string, name: string, price: number }} FavourOption */
/** @typedef {{ from: number, less: number }} FavourBreak buying `from` boxes or more takes `less` pounds off each */
/** @typedef {{ options: FavourOption[], minQty: number, maxQty: number, leadDays: number, breaks?: FavourBreak[] }} Favours */

/**
 * @param {Favours} f @param {{ option: string, qty: number }} ch
 * @returns {{ option: FavourOption, qty: number, per: number, total: number, saving: number, nextBreak: FavourBreak|null }}
 */
export function favourQuote(f, ch) {
  const option = f.options.find((o) => o.id === ch.option) ?? f.options[0];
  const qty = Math.min(f.maxQty, Math.max(f.minQty, Math.round(Number(ch.qty) || f.minQty)));
  const breaks = [...(f.breaks ?? [])].sort((a, b) => a.from - b.from);
  const less = breaks.filter((b) => qty >= b.from).pop()?.less ?? 0;
  const per = Math.round(Math.max(0, option.price - less) * 100) / 100;
  return {
    option, qty, per, total: Math.round(per * qty * 100) / 100, saving: Math.round(less * qty * 100) / 100,
    nextBreak: breaks.find((b) => b.from > qty) ?? null,
  };
}

/** The first day the shop can have them ready. @param {string} today YYYY-MM-DD @param {number} leadDays */
export const favourEarliest = (today, leadDays) => addDays(today, leadDays);

/**
 * The seal's two letters and its ring line, cleaned: letters only for the monogram (one each), the line to 30
 * characters, capitals like the shop's own seal.
 * @param {{ a: string, b: string, line: string }} s
 */
export function sealOf(s) {
  const letter = (/** @type {string} */ x) => (x.normalize("NFC").match(/\p{L}/u)?.[0] ?? "").toUpperCase();
  return { a: letter(s.a), b: letter(s.b), line: s.line.replace(/\s+/g, " ").trim().slice(0, 30).toUpperCase() };
}

/**
 * The request on WhatsApp, for the shop to confirm.
 * @param {ReturnType<typeof favourQuote>} q
 * @param {{ business: string, day: string, occasion: string, seal: ReturnType<typeof sealOf>|null }} o
 */
export function favourText(q, o) {
  return [
    `Hi ${o.business}, I'd like ${q.qty} favour boxes: ${q.option.name}.`,
    `Price on your site: ${gbp(q.per)} a box, ${gbp(q.total)} in all.`,
    ...(o.occasion.trim() ? [`For: ${o.occasion.trim()}`] : []),
    ...(o.seal && (o.seal.a || o.seal.b) ? [`Our seal: ${[o.seal.a, o.seal.b].filter(Boolean).join(" & ")}${o.seal.line ? `, "${o.seal.line}" around it` : ""}`] : []),
    `Needed by: ${o.day}`,
    "Please confirm.",
  ].join("\n");
}
