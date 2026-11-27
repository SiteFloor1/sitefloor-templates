// @ts-check
/** The week tool's words, shared by the page as first built and by the browser, so both say the same. */
import { pounds } from "../../lib/nursery.js";

export const SESSION_ORDER = ["am", "pm", "full"];
const SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri"];

/** The line about optional extras. @param {any[]} extras @param {number} daysOn */
export function weekOptional(extras, daysOn) {
  if (!daysOn) return "Tap a day to start.";
  if (!extras.length) return "";
  return extras.map((x) => `${x.label} ${x.per === "one-off" ? "" : "is "}optional: ${pounds(x.price)}${x.per === "day" ? " a day" : x.per === "session" ? " a session" : x.per === "month" ? " a month" : ""}${x.instead ? `. ${x.instead}` : ""}`).join(" ") + ".";
}

/** The quote the parent sends. @param {any} cfg @param {string[]} days @param {number} funded @param {number} month */
export function weekQuote(cfg, days, funded, month) {
  const booked = days.map((s, i) => (s === "off" ? "" : `${SHORT[i]} ${cfg.sessions[s].label.toLowerCase()}`)).filter(Boolean).join(", ");
  return `${cfg.message} could you check a quote? ${booked || "No days yet"}; ${funded ? `${funded} funded hours` : "no funded hours"}. Your website shows ${pounds(month)} a month.`;
}
