// @ts-check
/**
 * UK ring sizes, as a guide. The letters with their inside circumference and diameter in millimetres are copied from
 * H. Samuel's published UK ring size chart (https://www.hsamuel.co.uk/services/ring-size-chart-guide), checked
 * 29 October 2026. It names no standard; UK sizes descend from British Standard 6820:1987, and jewellers' own sizers
 * differ by a fraction of a millimetre, so the page always says the size is confirmed at the appointment.
 *
 * Also the on-screen scale: a bank card is an ID-1 card, 85.60 mm wide (ISO/IEC 7810), so matching one on the screen
 * tells us how many pixels make a millimetre on this screen. Used by the ring sizer and "on a hand" at true scale.
 */

export const SIZES_CHECKED = "2026-10-29";
export const SIZES_SOURCE = "a published UK ring size chart";

/** @type {{ letter: string, circ: number, dia: number }[]} */
export const UK_SIZES = [
  ["H", 46.02, 14.65], ["I", 47.25, 15.04], ["J", 48.38, 15.40], ["K", 49.64, 15.80], ["L", 50.58, 16.10],
  ["M", 51.87, 16.51], ["N", 53.16, 16.92], ["O", 54.51, 17.35], ["P", 55.76, 17.75], ["Q", 57.15, 18.19],
  ["R", 58.47, 18.61], ["S", 60.00, 19.10], ["T", 61.29, 19.51], ["U", 62.89, 20.02], ["V", 63.84, 20.32],
  ["W", 65.22, 20.76], ["X", 66.54, 21.18], ["Y", 67.51, 21.49], ["Z", 68.77, 21.89],
].map(([letter, circ, dia]) => ({ letter: /** @type {string} */ (letter), circ: /** @type {number} */ (circ), dia: /** @type {number} */ (dia) }));

/** The width of a bank card (ID-1, ISO/IEC 7810), in millimetres. */
export const CARD_MM = 85.6;

/**
 * The nearest UK size to an inside circumference, or null when it is off the chart (more than half a size beyond H or Z).
 * @param {number} mm inside circumference in millimetres
 * @returns {{ letter: string, circ: number, dia: number, between: string|null }|null} between: the two letters it sits
 *   between when it is close to halfway, e.g. "M–N"
 */
export function sizeFromCircumference(mm) {
  if (!Number.isFinite(mm)) return null;
  const first = UK_SIZES[0], last = UK_SIZES[UK_SIZES.length - 1];
  const step = (last.circ - first.circ) / (UK_SIZES.length - 1);
  if (mm < first.circ - step / 2 || mm > last.circ + step / 2) return null;
  let best = 0;
  UK_SIZES.forEach((s, i) => { if (Math.abs(s.circ - mm) < Math.abs(UK_SIZES[best].circ - mm)) best = i; });
  const s = UK_SIZES[best];
  const other = mm > s.circ ? UK_SIZES[best + 1] : UK_SIZES[best - 1];
  const halfway = other && Math.abs(mm - s.circ) > Math.abs(other.circ - s.circ) * 0.35;
  const between = halfway ? (mm > s.circ ? `${s.letter}–${other.letter}` : `${other.letter}–${s.letter}`) : null;
  return { ...s, between };
}

/** @param {number} mm inside diameter in millimetres */
export function sizeFromDiameter(mm) {
  return sizeFromCircumference(mm * Math.PI);
}

/** @param {string} letter @returns {{ letter: string, circ: number, dia: number }|undefined} */
export function sizeOf(letter) {
  return UK_SIZES.find((s) => s.letter === String(letter).toUpperCase());
}

/**
 * Pixels per millimetre on this screen, from the width (in CSS pixels) the visitor matched to a bank card.
 * Refuses widths no real screen would give (a card is 6–20 cm of CSS pixels at any sane zoom).
 * @param {number} cardPx @returns {number|null}
 */
export function pxPerMm(cardPx) {
  if (!Number.isFinite(cardPx) || cardPx < 200 || cardPx > 900) return null;
  return cardPx / CARD_MM;
}
