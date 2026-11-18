// @ts-check
/**
 * The journey of the month: on load, the operator's pick for the real month opens (the build drew the build day's);
 * beneath, four journeys as a quiet index: this month's first, then the rest in the operator's order. Choosing one
 * shows its logbook in place (photograph, words, map); nothing moves on its own.
 */
import { MONTHS } from "../../lib/tourism.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data).tourism;
  const books = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-logbook]")]);
  const index = root.querySelector("[data-tm-index]");
  if (!books.length || !index) throw new Error("journey of the month markup missing");
  const month = Number(ctx.now().date.slice(5, 7));
  const pick = data.monthly?.[String(month)];
  const open = (/** @type {string} */ id, /** @type {boolean} */ focus) => {
    const book = books.find((b) => b.dataset.journey === id);
    if (!book) return;
    for (const b of books) b.hidden = b !== book;
    for (const img of book.querySelectorAll("img.on")) /** @type {HTMLImageElement} */ (img).loading = "eager";
    const label = book.querySelector("[data-lb-month]");
    if (label) label.innerHTML = id === pick ? `Journey of the month · <b>${MONTHS[month - 1]}</b>` : "From the logbook";
    for (const b of index.querySelectorAll("[data-tm-open]")) b.setAttribute("aria-current", String(/** @type {HTMLElement} */ (b).dataset.tmOpen === id));
    root.ownerDocument.dispatchEvent(new CustomEvent("lb-stop"));
    if (focus) /** @type {HTMLElement|null} */ (book.querySelector(".lb-name a, .lb-name"))?.focus?.();
  };
  // This month's pick leads the index; the order the build chose otherwise stays.
  const first = pick ? index.querySelector(`[data-tm-open="${pick}"]`) : null;
  if (first) index.prepend(first.closest("li") ?? first);
  index.querySelectorAll("[data-tm-when]").forEach((el) => {
    const id = /** @type {HTMLElement} */ (el).closest("[data-tm-open]")?.getAttribute("data-tm-open");
    if (id === pick) el.textContent = "this month";
    else el.textContent = /** @type {HTMLElement} */ (el).dataset.tmWhen ?? "";
  });
  index.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement|null} */ (/** @type {HTMLElement} */ (e.target).closest("[data-tm-open]"));
    if (b) open(b.dataset.tmOpen ?? "", false);
  });
  open(pick ?? data.fallback, false);
}
