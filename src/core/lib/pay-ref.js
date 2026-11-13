// @ts-check
/**
 * A reference for a Stripe Payment Link, so a deposit can be matched to the request it goes with. Stripe takes it as the
 * `client_reference_id` URL parameter and records it with the payment: letters, digits, dashes and underscores, up to
 * 200 characters; anything else is silently dropped by Stripe (docs.stripe.com/payment-links/url-parameters, checked
 * 29 Oct 2026). Never put personal details in it: the link can be shared.
 */

/**
 * Joins parts ("911-turbo", "2026-11-06", "2026-11-09") into a reference Stripe accepts.
 * @param {(string|number|undefined|null)[]} parts
 * @returns {string}
 */
export function payRef(parts) {
  return parts.filter((p) => p !== undefined && p !== null && String(p).trim() !== "")
    .map((p) => String(p).trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, ""))
    .filter(Boolean).join("_").slice(0, 200);
}

/**
 * The Payment Link with the reference added (or removed when empty). Other query parameters are kept.
 * @param {string} url a https://buy.stripe.com/… link
 * @param {string} ref from payRef
 */
export function withRef(url, ref) {
  const u = new URL(url);
  if (ref) u.searchParams.set("client_reference_id", ref);
  else u.searchParams.delete("client_reference_id");
  return u.toString();
}
