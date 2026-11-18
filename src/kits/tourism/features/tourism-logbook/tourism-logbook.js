// @ts-check
/**
 * The logbook: choose a stop and its words, its photograph and the local time swap in place, and the route draws
 * itself along the line to that stop (its share of the line, from the build). Nothing moves until a stop is chosen.
 */

/** @param {HTMLElement} book @param {number} i */
export function showStop(book, i) {
  const btns = /** @type {HTMLButtonElement[]} */ ([...book.querySelectorAll("[data-lb-stop]")]);
  const b = btns[i];
  if (!b) return;
  btns.forEach((x, k) => x.setAttribute("aria-current", String(k === i)));
  const set = (/** @type {string} */ sel, /** @type {string} */ v) => { const el = book.querySelector(sel); if (el) el.textContent = v; };
  const words = [book.querySelector("[data-lb-title]"), book.querySelector(".lb-text")];
  words.forEach((w) => w?.classList.add("lb-swap"));
  setTimeout(() => {
    set("[data-lb-title]", b.dataset.place ?? "");
    set("[data-lb-days]", b.dataset.days ?? "");
    set("[data-lb-text]", b.dataset.text ?? "");
    words.forEach((w) => w?.classList.remove("lb-swap"));
  }, 220);
  const photo = b.dataset.photo ?? "0";
  for (const img of book.querySelectorAll("[data-lb-photo]")) {
    const on = /** @type {HTMLElement} */ (img).dataset.lbPhoto === photo;
    if (on) /** @type {HTMLImageElement} */ (img).loading = "eager";
    img.classList.toggle("on", on);
  }
  set("[data-lb-cap]", `Photograph: ${b.dataset.cap ?? ""}`);
  const clock = /** @type {HTMLElement|null} */ (book.querySelector("[data-local-time]"));
  if (clock && b.dataset.tz) clock.dataset.tz = b.dataset.tz;
  const at = atOf(book)[i];
  const route = /** @type {SVGPathElement|null} */ (book.querySelector("[data-lb-route]"));
  if (route && at) route.style.strokeDashoffset = String(1 - at.share);
  for (const d of book.querySelectorAll("[data-lb-dot]")) d.classList.toggle("on", at !== undefined && /** @type {HTMLElement} */ (d).dataset.lbDot === String(at.point));
  book.dispatchEvent(new CustomEvent("lb-stop", { bubbles: true, detail: { stop: i } }));
}

/** @param {HTMLElement} book @returns {{ share: number, point: number }[]} */
function atOf(book) {
  try { return JSON.parse(book.querySelector("template[data-lb-at]")?.innerHTML ?? "[]"); } catch { return []; }
}

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const books = /** @type {HTMLElement[]} */ (root.matches("[data-logbook]") ? [root] : [...root.querySelectorAll("[data-logbook]")]);
  for (const book of books) {
    for (const b of book.querySelectorAll("[data-lb-stop]")) {
      b.addEventListener("click", () => showStop(book, Number(/** @type {HTMLElement} */ (b).dataset.lbStop)));
    }
  }
}
