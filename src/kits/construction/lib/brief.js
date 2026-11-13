// @ts-check
/**
 * "Start a project": the visitor's answers as one WhatsApp message the builder can reply to. Only the first half of
 * the postcode is asked for (the district, e.g. N5), never a full address; the rest is in the visitor's own words.
 */

/** The first half of a UK postcode ("N5", "SW11", "EC1A"), cleaned, or "" if it isn't one. @param {string} s */
export function outwardCode(s) {
  const c = String(s ?? "").trim().toUpperCase().replace(/\s+/g, " ").split(" ")[0];
  return /^[A-Z]{1,2}\d[A-Z\d]?$/.test(c) ? c : "";
}

/**
 * @param {string} opening the builder's own first line
 * @param {{ what?: string, where?: string, when?: string, budget?: string, words?: string }} a
 * @returns {string}
 */
export function briefMessage(opening, a) {
  const lines = [
    a.what ? `What: ${a.what}` : "",
    a.where ? `Where: ${a.where}` : "",
    a.when ? `When: ${a.when}` : "",
    a.budget ? `Budget: ${a.budget}` : "",
  ].filter(Boolean);
  const words = String(a.words ?? "").trim().slice(0, 600);
  return [opening, lines.join("\n"), words].filter(Boolean).join("\n\n");
}

/**
 * How long a build runs from the builder's own stage lengths, or null unless every stage has one.
 * @param {{ weeks?: [number, number] }[]} stages @returns {[number, number] | null}
 */
export function totalWeeks(stages) {
  if (!stages.length || stages.some((s) => !Array.isArray(s.weeks))) return null;
  return stages.reduce((sum, s) => /** @type {[number, number]} */ ([sum[0] + (s.weeks?.[0] ?? 0), sum[1] + (s.weeks?.[1] ?? 0)]), /** @type {[number, number]} */ ([0, 0]));
}

/** "2 to 3 weeks", "1 week", "6 weeks" @param {[number, number]} w */
export function weeksWords(w) {
  const unit = (/** @type {number} */ n) => (n === 1 ? "week" : "weeks");
  return w[0] === w[1] ? `${w[0]} ${unit(w[0])}` : `${w[0]} to ${w[1]} ${unit(w[1])}`;
}
