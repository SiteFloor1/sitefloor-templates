// @ts-check
/**
 * The request a customer sends (car page quote, Delivered tonight): how the car reaches them, and the WhatsApp message
 * with every part of the quote and a reference that matches the deposit. Pure; the pages call it.
 */
import { zoneFor } from "./rules.js";
import { money } from "./quote.js";
import { longDate } from "./words.js";

/**
 * How the car reaches the customer, from their choice and the client's zones and airports.
 * @param {{ kind: "collect"|"deliver"|"airport", postcode?: string, airport?: string }} choice
 * @param {{ zones: { name: string, fee: number, districts: string[] }[], airports?: { id: string, name: string, fee: number }[] | null }} cfg
 * @returns {{ ok: true, handover: { label: string, fee: number, words: string } | null } | { ok: false, reason: string }}
 */
export function handoverFor(choice, cfg) {
  if (choice.kind === "collect") return { ok: true, handover: null };
  if (choice.kind === "airport") {
    const a = (cfg.airports ?? []).find((x) => x.id === choice.airport);
    return a ? { ok: true, handover: { label: `Meet and greet, ${a.name}`, fee: a.fee, words: `meet and greet at ${a.name}` } } : { ok: false, reason: "Choose an airport." };
  }
  const z = zoneFor(choice.postcode ?? "", cfg.zones);
  if (!z.ok) return { ok: false, reason: "Add your postcode for the delivery fee, like SW11 4NQ." };
  if (!z.zone) return { ok: false, reason: `${z.district} is outside our delivery zones. Collect from us, or ask and we'll see what we can do.` };
  return { ok: true, handover: { label: `Delivery and collection, ${z.zone.name}`, fee: z.zone.fee, words: `delivery to ${String(choice.postcode).toUpperCase().trim()}` } };
}

/**
 * The WhatsApp message: dated in full, every part with its price, the deposit apart, the reference, and that it's a
 * request until the business confirms.
 * @param {object} o
 * @param {string} o.business
 * @param {string} o.car
 * @param {{ from: string, to: string, selection?: { fromTime?: string, toTime?: string } }} o.range
 * @param {string} o.handover words, e.g. "delivery to SW11 4NQ" or "collection"
 * @param {{ ok: boolean, parts?: { label: string, amount: number }[], total?: number, deposit?: number|null }} o.quote
 * @param {string} o.ref
 */
export function requestMessage({ business, car, range, handover, quote, ref }) {
  const at = (/** @type {string|undefined} */ t) => (t ? ` at ${t}` : "");
  const lines = [
    `Hello ${business}, I'd like to request the ${car}.`,
    `From ${longDate(range.from)}${at(range.selection?.fromTime)} to ${longDate(range.to)}${at(range.selection?.toTime)}, ${handover}.`,
  ];
  if (quote.ok && quote.parts) {
    lines.push("", "Your quote as I see it:");
    for (const p of quote.parts) lines.push(`${p.label}: ${money(p.amount)}`);
    lines.push(`Total: ${money(quote.total ?? 0)}`);
    if (quote.deposit) lines.push(`Deposit (returned): ${money(quote.deposit)}`);
  }
  lines.push("", `Reference: ${ref}`, "I understand this is a request until you confirm.");
  return lines.join("\n");
}
