// @ts-check
/**
 * The probate cost estimator: an estimate from the firm's own published price range. The firm sets a starting fee
 * (the bottom of its range) and, for each answer, how much that adds to the low and high end. The estimator can never
 * go outside the published range (validation checks the worst and best cases). SRA guidance: a quote tool must give a
 * result without the visitor having to get in touch first.
 */

/** @typedef {{ label: string, low: number, high: number }} Option */
/** @typedef {{ id: string, label: string, options: Option[] }} Question */

/**
 * @param {number} from the published bottom of the range @param {Question[]} questions
 * @param {Record<string, number>} picked question id → option index
 * @returns {{ low: number, high: number }}
 */
export function estimate(from, questions, picked) {
  let low = from, high = from;
  for (const q of questions) {
    const o = q.options[picked[q.id] ?? 0];
    if (o) { low += o.low; high += o.high; }
  }
  return { low, high };
}

/** The cheapest and dearest answers possible. @param {number} from @param {Question[]} questions */
export function bounds(from, questions) {
  return {
    min: from + questions.reduce((s, q) => s + Math.min(...q.options.map((o) => o.low)), 0),
    max: from + questions.reduce((s, q) => s + Math.max(...q.options.map((o) => o.high)), 0),
  };
}

/** £ with VAT at 20%, to the pound. @param {number} n */
export const vat = (n) => Math.round(n * 1.2);
