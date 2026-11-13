// @ts-check
/** The home request: writes the car, the dates and where into a WhatsApp message (a request, never a booking). */
import { longDate } from "../../lib/words.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-rq-form]"));
  if (!form) return;
  const val = (/** @type {string} */ s) => /** @type {HTMLInputElement} */ (form.querySelector(s))?.value.trim() ?? "";
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = requestText({ car: val("[data-rq-car]"), from: val("[data-rq-from]"), to: val("[data-rq-to]"), where: val("[data-rq-where]") }, ctx.data.name);
    const a = document.createElement("a");
    a.href = ctx.bookHref(text); a.target = "_blank"; a.rel = "noopener"; a.dataset.waText = text;
    root.append(a); a.click(); a.remove();
  });
}

/**
 * The message, plain and dated (never "this weekend": a forwarded message must still make sense).
 * @param {{ car: string, from: string, to: string, where: string }} r @param {string} name
 */
export function requestText(r, name) {
  const lines = [`Hello ${name}, I'd like to request ${r.car ? `the ${r.car}` : "a car"}.`];
  if (r.from) lines.push(`From ${longDate(r.from)}${r.to ? ` to ${longDate(r.to)}` : ""}.`);
  if (r.where) lines.push(`Delivery or collection: ${r.where}.`);
  lines.push("I understand this is a request until you confirm.");
  return lines.join("\n");
}
