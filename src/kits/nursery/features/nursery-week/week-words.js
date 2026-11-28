// @ts-check
/** The week tool's words, shared by the page as first built and by the browser, so both say the same. */
import { pounds, hoursWords } from "../../lib/nursery.js";

export const SESSION_ORDER = ["am", "pm", "full"];
const SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri"];

/** The line about optional extras. @param {any[]} extras @param {number} daysOn */
export function weekOptional(extras, daysOn) {
  if (!daysOn) return "Tap a day to start.";
  if (!extras.length) return "";
  const end = (/** @type {string} */ s) => (/[.!?]$/.test(s) ? s : s + ".");
  return extras.map((x) => end(`${x.label} ${x.per === "one-off" ? "" : "is "}optional: ${pounds(x.price)}${x.per === "day" ? " a day" : x.per === "session" ? " a session" : x.per === "month" ? " a month" : ""}${x.instead ? `. ${x.instead}` : ""}`)).join(" ");
}

/** The bill's rows, as the page first shows them and as the browser repaints them.
 * @param {{ booked: number, funded: number, paid: number, termOnly: boolean, fullWeeks: number }} c @param {{ rate: number, weeksOpen: number }} cfg */
export function weekRows(c, cfg) {
  const h = hoursWords, term = c.termOnly ? " in term time" : "";
  return [
    ["Booked", `${h(c.booked)} hours a week`],
    ["Funded, free", `${h(c.funded)} hours a week${term}`],
    [`Paid, ${pounds(cfg.rate)} an hour`, `${h(c.paid)} hours a week${term}${c.termOnly && c.fullWeeks ? `; ${h(c.booked)} in the other ${c.fullWeeks} weeks` : ""}`],
    [`${cfg.weeksOpen} weeks a year`, "in 12 equal months"],
  ];
}

/** The quote the parent sends. @param {any} cfg @param {string[]} days @param {number} funded @param {number} month */
export function weekQuote(cfg, days, funded, month) {
  const booked = days.map((s, i) => (s === "off" ? "" : `${SHORT[i]} ${cfg.sessions[s].label.toLowerCase()}`)).filter(Boolean).join(", ");
  return `${cfg.message} could you check a quote? ${booked || "No days yet"}; ${funded ? `${funded} funded hours` : "no funded hours"}. Your website shows ${pounds(month)} a month.`;
}
