// @ts-check
/** The chauffeur quote request: pick-up, drop-off, date and time, hours, passengers and car, written into WhatsApp. */
import { longDate } from "../../lib/words.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-ch-form]"));
  const hire = /** @type {any} */ (ctx.data).hire;
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    /** @type {Record<string, string>} */ const v = {};
    for (const el of form.querySelectorAll("[data-ch]")) v[/** @type {HTMLElement} */ (el).dataset.ch ?? ""] = /** @type {HTMLInputElement} */ (el).value.trim();
    const text = chauffeurText(hire.chauffeur.message, v);
    const a = document.createElement("a");
    a.href = ctx.bookHref(text); a.target = "_blank"; a.rel = "noopener"; a.dataset.waText = text;
    root.append(a); a.click(); a.remove();
  });
}

/** @param {string} opening @param {Record<string, string>} v */
export function chauffeurText(opening, v) {
  return [
    opening,
    v.from && `Pick-up: ${v.from}`, v.to && `Drop-off: ${v.to}`,
    v.date && `Date: ${longDate(v.date)}${v.time ? ` at ${v.time}` : ""}`,
    v.hours && `Hours: ${v.hours}`, v.pax && `Passengers: ${v.pax}`, v.car && `Car: ${v.car}`,
    "I understand this is a request until you confirm.",
  ].filter(Boolean).join("\n");
}
