// @ts-check
/**
 * Build-your-cut rules: price, duration and the WhatsApp order text.
 * Pure logic so it can be unit-tested and reused by the browser module.
 */

/**
 * @typedef {{ id: string, name: string, price: number, minutes: number, fade: boolean, kids?: boolean, buzz?: boolean }} Service
 * @typedef {{ id: string, name: string, price: number, minutes: number, adultOnly?: boolean }} Extra
 * @typedef {{ service: string, fade: "low"|"mid"|"high", length: number, extras: string[], barber: string }} Selection
 */

export const FADE_HEIGHTS = /** @type {const} */ ([["low", "Low"], ["mid", "Mid"], ["high", "High"]]);
export const LENGTHS = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "2cm", "4cm", "6cm"];

/**
 * Extras that apply to the chosen service (beard work is hidden for kids' cuts).
 * @param {Extra[]} extras @param {Service} service
 */
export function extrasFor(extras, service) {
  return extras.filter((e) => !(service.kids && e.adultOnly));
}

/**
 * @param {{ services: Service[], extras: Extra[] }} menu
 * @param {Selection} sel
 * @returns {{ service: Service, extras: Extra[], price: number, minutes: number }}
 */
export function priceCut(menu, sel) {
  const service = menu.services.find((s) => s.id === sel.service);
  if (!service) throw new Error(`Unknown service "${sel.service}"`);
  const allowed = extrasFor(menu.extras, service);
  const extras = allowed.filter((e) => sel.extras.includes(e.id));
  return {
    service,
    extras,
    price: service.price + extras.reduce((sum, e) => sum + e.price, 0),
    minutes: service.minutes + extras.reduce((sum, e) => sum + e.minutes, 0),
  };
}

/**
 * Human description of the length on top.
 * @param {Service} service @param {number} length index into LENGTHS
 */
export function lengthLabel(service, length) {
  return service.buzz ? "Grade 1 all over" : `${LENGTHS[length] ?? LENGTHS[3]} on top`;
}

/**
 * The message the customer sends on WhatsApp.
 * @param {ReturnType<typeof priceCut>} quote @param {Selection} sel @param {string} when e.g. "earliest 15:40 with Kofi"
 */
export function orderMessage(quote, sel, when) {
  const fade = quote.service.fade ? ` (${FADE_HEIGHTS.find((f) => f[0] === sel.fade)?.[1].toLowerCase()} fade)` : "";
  return [
    "Hi, I'd like to book:",
    `• ${quote.service.name}${fade}, ${lengthLabel(quote.service, sel.length).toLowerCase()}`,
    ...quote.extras.map((e) => `• ${e.name}`),
    `About ${quote.minutes} min · £${quote.price}`,
    sel.barber === "any" ? `Any barber, ${when}.` : `With ${sel.barber} if possible.`,
  ].join("\n");
}
