// @ts-check
/**
 * WhatsApp click-to-chat links. Numbers are stored in E.164 without the "+"
 * (e.g. "447700900123"), which is what wa.me requires.
 */

const E164_DIGITS = /^[1-9]\d{7,14}$/;

/** @param {unknown} value */
export function isWhatsAppNumber(value) {
  return typeof value === "string" && E164_DIGITS.test(value);
}

/**
 * Accepts common UK formats ("07700 900123", "+44 7700 900123") and returns E.164 digits.
 * @param {string} input
 * @returns {string|null}
 */
export function normaliseUkNumber(input) {
  const digits = String(input).replace(/[^\d+]/g, "");
  let out;
  if (digits.startsWith("+")) out = digits.slice(1);
  else if (digits.startsWith("00")) out = digits.slice(2);
  else if (digits.startsWith("0")) out = `44${digits.slice(1)}`;
  else out = digits;
  return E164_DIGITS.test(out) ? out : null;
}

/**
 * @param {string} number E.164 digits
 * @param {string} [text] pre-filled message
 */
export function waUrl(number, text) {
  if (!isWhatsAppNumber(number)) throw new Error(`Invalid WhatsApp number "${number}"`);
  const base = `https://wa.me/${number}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/**
 * Ofcom reserves 07700 900000–900999 for drama/fiction. Demo sites use it;
 * client sites must never ship with it.
 * @param {string} number E.164 digits
 */
export function isFictionalUkNumber(number) {
  return /^447700900\d{3}$/.test(number);
}
