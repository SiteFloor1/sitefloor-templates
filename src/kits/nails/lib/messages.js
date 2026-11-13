// @ts-check
/**
 * The WhatsApp messages the nail kit writes for a visitor. Each starts with the salon's own opening line from
 * site.json and adds only what the visitor chose.
 */
import { ukDate } from "./dates.js";

/** Book a shade from the hero: "Hello Verrall, I'd like to book in Petal (No. 14)." @param {string} opening @param {string} shadeName */
export function shadeText(opening, shadeName) {
  return `${opening} I'd like to book in ${shadeName}.`;
}

/**
 * "Your usual": the set this phone last asked for, sent again.
 * @param {string} opening @param {string} usual the set as it was worded, e.g. "BIAB, almond, medium, Petal (No. 14)"
 */
export function usualText(opening, usual) {
  return `${opening} I'd like my usual again: ${usual}.`;
}

/**
 * A hen or bridal party.
 * @param {{ opening: string, occasion: string, date: string, people: number, treatments: string[], notes: string }} o date YYYY-MM-DD or ""
 */
export function partyText(o) {
  const parts = [`${o.opening} I'd like to book for a ${o.occasion.toLowerCase()}: ${o.people} of us`];
  if (o.date) parts.push(`on ${ukDate(o.date)}`);
  let text = `${parts.join(" ")}.`;
  if (o.treatments.length) text += ` We'd like: ${o.treatments.join("; ")}.`;
  if (o.notes) text += ` ${o.notes}`;
  return text;
}

/** The bridal trial request with the wedding date in UK order. @param {string} opening @param {string} wedding YYYY-MM-DD or "" */
export function bridalText(opening, wedding) {
  return wedding ? `${opening} my wedding is on ${ukDate(wedding)}, and I'd like to book my trial.` : `${opening} I'd like to book a bridal trial.`;
}
