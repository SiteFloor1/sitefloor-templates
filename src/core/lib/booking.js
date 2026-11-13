// @ts-check
/**
 * Where "Book" buttons go. Most shops already take bookings in an app
 * (Booksy, Fresha), so the site sends customers there instead of competing
 * with it. We link out; we never embed a provider's widget, because that
 * would add third-party scripts and cookies to the client's site.
 *
 *   "booking": { "provider": "booksy", "url": "https://booksy.com/en-gb/…" }
 *
 * provider: whatsapp (default when booking is absent) | booksy | fresha | other | phone
 * url:      required for booksy, fresha and other (https; booksy/fresha must be their own domain)
 * name:     required for other, e.g. "Treatwell"
 */
import { waUrl } from "./whatsapp.js";

/** @typedef {{ provider: "whatsapp"|"booksy"|"fresha"|"other"|"phone", url?: string, name?: string }} Booking */

/** @type {Record<string, { name: string, host?: RegExp }>} */
export const PROVIDERS = {
  whatsapp: { name: "WhatsApp" },
  booksy: { name: "Booksy", host: /^(www\.)?booksy\.com$/ },
  fresha: { name: "Fresha", host: /^(www\.)?fresha\.com$/ },
  other: { name: "" },
  phone: { name: "phone" },
};

/** @param {Booking|undefined} b @returns {Booking} */
export const bookingOf = (b) => b ?? { provider: "whatsapp" };

/**
 * Link for a Book button. For WhatsApp the message is pre-filled; other
 * providers can't take a message, so it is dropped.
 * @param {Booking|undefined} booking @param {{ whatsapp: string, phone: string }} contact @param {string} message
 * @returns {string}
 */
export function bookingHref(booking, contact, message) {
  const b = bookingOf(booking);
  if (b.provider === "whatsapp") return waUrl(contact.whatsapp, message);
  if (b.provider === "phone") return `tel:${contact.phone.replace(/\s/g, "")}`;
  return /** @type {string} */ (b.url);
}

/** Button text, e.g. "Book on Booksy". @param {Booking|undefined} booking @returns {string} */
export function bookingLabel(booking) {
  const b = bookingOf(booking);
  if (b.provider === "phone") return "Call to book";
  return `Book on ${b.provider === "other" ? b.name : PROVIDERS[b.provider].name}`;
}

/**
 * @param {any} b the booking block from site.json (may be undefined)
 * @returns {string[]} errors as "field: message"
 */
export function checkBooking(b) {
  if (b === undefined) return [];
  if (b === null || typeof b !== "object") return ["booking: must be an object"];
  if (!Object.hasOwn(PROVIDERS, b.provider)) return [`booking.provider: one of ${Object.keys(PROVIDERS).join(", ")}`];
  if (b.provider === "whatsapp" || b.provider === "phone") return b.url ? ["booking.url: not used for this provider; remove it"] : [];
  /** @type {string[]} */
  const errors = [];
  let url = null;
  try { url = new URL(b.url ?? ""); } catch { errors.push("booking.url: the shop's booking page, an https link"); }
  if (url && url.protocol !== "https:") errors.push("booking.url: must be https");
  const host = PROVIDERS[b.provider].host;
  if (url && host && !host.test(url.hostname)) errors.push(`booking.url: must be a ${PROVIDERS[b.provider].name} link (${url.hostname} is not)`);
  if (b.provider === "other" && !(typeof b.name === "string" && b.name.trim())) errors.push('booking.name: the booking service\'s name, e.g. "Treatwell"');
  return errors;
}
