// @ts-check
/** A gift's total from the house's own prices: the bottle, engraving if there are words, and wrapping if chosen. */

/** @param {number} bottle @param {number} engraving @param {number} wrap */
export function giftTotal(bottle, engraving, wrap) {
  return Math.round((bottle + engraving + wrap) * 100) / 100;
}
