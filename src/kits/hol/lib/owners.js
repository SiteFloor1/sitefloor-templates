// @ts-check
/**
 * The owner's side of the hol kit, with no DOM: the revenue review request written as one WhatsApp message (HOL-3),
 * the sample monthly statement checked so its sums add up (HOL-8), the changeover's times in order (HOL-5), and the
 * guidebook code (HOL-9). The guidebook code keeps a page out of casual reach; it is not security, and the page says
 * so: door codes and passwords never go in a guidebook.
 */
import { pounds } from "./money.js";

/**
 * @param {string} opening the company's own first line @param {Record<string, string>} f the owner's answers
 * @returns {string}
 */
export function reviewText(opening, f) {
  const parts = [opening.trim()];
  const add = (/** @type {string} */ label, /** @type {string|undefined} */ v) => { if (v && v.trim()) parts.push(`${label}: ${v.trim()}`); };
  add("Where", f.where); add("Bedrooms", f.beds); add("Sleeps", f.sleeps); add("How it's let now", f.now); add("When I'd like to start", f.when);
  add("Anything else", f.note);
  return parts.join("\n");
}

/**
 * The sample statement's sums: what guests paid, less the fee and each cost, is what was paid out; the fee is the
 * company's percentage of what guests paid. @param {any} s @param {number} percent @returns {string[]}
 */
export function statementProblems(s, percent) {
  const out = [];
  if (!s || !Array.isArray(s.costs)) return ["statement: { home, month, nights, guests, costs: [{ label, amount }], paid, paidOn }"];
  const fee = Math.round(s.guests * percent) / 100;
  const costs = s.costs.reduce((/** @type {number} */ n, /** @type {any} */ c) => n + (Number(c.amount) || 0), 0);
  const paid = Math.round((s.guests - fee - costs) * 100) / 100;
  if (Math.abs(paid - s.paid) > 0.005) out.push(`statement.paid: ${pounds(s.guests)} less the fee ${pounds(fee)} and costs ${pounds(costs)} is ${pounds(paid)}, not ${pounds(s.paid)}`);
  if (!Number.isInteger(s.nights) || s.nights < 0 || s.nights > 31) out.push("statement.nights: the nights let that month");
  return out;
}

/** @param {any} s @param {number} percent */
export const statementFee = (s, percent) => Math.round(s.guests * percent) / 100;

const HM = /^([01]\d|2[0-3]):[0-5]\d$/;
/** The changeover's times are real clock times, in order. @param {any[]} steps @returns {string[]} */
export function turnoverProblems(steps) {
  const out = [];
  if (!Array.isArray(steps) || steps.length < 3) return ["turnover.steps: at least three steps, each { time, title, detail, photo }"];
  steps.forEach((s, i) => {
    if (!HM.test(s?.time ?? "")) out.push(`turnover.steps[${i}].time: a time like 10:30`);
    if (i && HM.test(s?.time ?? "") && s.time <= steps[i - 1].time) out.push(`turnover.steps[${i}].time: after the step before`);
  });
  return out;
}

/** Hours between the first and last step, for "six hours". @param {any[]} steps */
export function turnoverHours(steps) {
  const m = (/** @type {string} */ t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
  return Math.round((m(steps[steps.length - 1].time) - m(steps[0].time)) / 60);
}

/** A guidebook code, tidied: letters and digits only, upper case. @param {string} v */
export const tidyCode = (v) => String(v).toUpperCase().replace(/[^A-Z0-9]/g, "");

/** FNV-1a, so the page carries a hash rather than the code itself (not security; see above). @param {string} code */
export function codeHash(code) {
  let h = 0x811c9dc5;
  for (const ch of tidyCode(code)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, "0");
}
