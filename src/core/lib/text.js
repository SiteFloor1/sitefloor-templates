// @ts-check
/** Text helpers shared by templates and browser code. */

/** @param {unknown} value */
export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/**
 * Tiny, safe markup for headlines stored in site.json:
 *   *text*  → <em>text</em>     |  → line break
 * Everything else is escaped, so config can never inject HTML.
 * @param {string} value
 */
export function inlineMarkup(value) {
  return escapeHtml(value)
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\s*\|\s*/g, "<br>");
}

/** Plain-text version of inlineMarkup, for <title> and meta tags. @param {string} value */
export function plainText(value) {
  return String(value ?? "").replace(/\*/g, "").replace(/\s*\|\s*/g, " ").trim();
}

/** @param {number} pounds */
export function gbp(pounds) {
  return `£${pounds.toLocaleString("en-GB", Number.isInteger(pounds) ? {} : { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * "2026-10" or "2026-10-05" → "October 2026".
 * @param {string} isoDate
 * @returns {string}
 */
export function monthYear(isoDate) {
  const m = /^(\d{4})-(\d{2})/.exec(isoDate);
  if (!m || !MONTHS[Number(m[2]) - 1]) throw new Error(`not a YYYY-MM date: ${isoDate}`);
  return `${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

/**
 * Google Maps directions link for an address (used when no directionsUrl is set).
 * @param {{ streetAddress: string, locality: string, postcode: string }} l
 * @returns {string}
 */
export function mapsSearchUrl(l) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${l.streetAddress}, ${l.locality} ${l.postcode}`)}`;
}
