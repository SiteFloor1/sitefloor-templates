// @ts-check
/**
 * The bill: follows the strip's visit (`cleaningVisit`) line for line and sends its extras back (`cleaningExtras`),
 * so the strip, the bill and the message always show the same minutes and the same price.
 */
import { hm, gbp, oftenWords } from "../../lib/visit.js";

/** @param {string} s */
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).cleaning?.visit;
  const q = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  const lines = q("[data-bill-lines]"), per = q("[data-bill-per]"), price = q("[data-bill-price]"), send = /** @type {HTMLAnchorElement|null} */ (q("[data-bill-send]"));
  const extras = q("[data-bill-extras]");
  if (!cfg || !lines || !per || !price || !send) throw new Error("bill markup or config missing");
  ctx.watch("cleaningVisit", (/** @type {any} */ s) => {
    const v = s.visit, cap = lines.querySelector("caption")?.outerHTML ?? "";
    lines.innerHTML = cap + [...v.rooms, ...v.extras].map((/** @type {any} */ r) => `<tr${r.extra ? ' class="cl-ex"' : ""}><th scope="row">${esc(r.name)}</th><td>${hm(r.min)}</td></tr>`).join("")
      + `<tr class="cl-sum"><th scope="row">Time on site</th><td>${hm(v.work)}</td></tr>`
      + (v.charged > v.work ? `<tr><th scope="row">Shortest visit we book</th><td>${hm(cfg.minimum)}</td></tr>` : "")
      + `<tr><th scope="row">Rate${v.deep ? ", deep clean" : ""}</th><td>${gbp(v.rate)} an hour</td></tr>`;
    per.textContent = v.deep ? "One deep clean" : `A visit, ${oftenWords(s.choice.freq)}`;
    price.textContent = gbp(v.price);
    send.href = ctx.bookHref(s.words.message);
    if (send.dataset.waText !== undefined) send.dataset.waText = s.words.message;
  });
  extras?.addEventListener("change", () => {
    ctx.share("cleaningExtras", [...extras.querySelectorAll("input:checked")].map((i) => /** @type {HTMLInputElement} */ (i).value));
  });
}
