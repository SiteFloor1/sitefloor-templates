// @ts-check
/**
 * Which facial is right for me: one word at a time. The chosen word's card shows; the others hide. Every card,
 * its words and its message are already in the page (the clinic's own), so this only chooses which one is seen.
 */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const words = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-word]")]);
  const cards = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-card]")]);
  if (!words.length || words.length !== cards.length) throw new Error("finder markup missing");
  const choose = (/** @type {number} */ i) => {
    words.forEach((b, j) => b.setAttribute("aria-pressed", String(i === j)));
    cards.forEach((c, j) => { c.hidden = i !== j; });
  };
  words.forEach((b, i) => b.addEventListener("click", () => choose(i)));
  choose(Math.max(0, words.findIndex((b) => b.getAttribute("aria-pressed") === "true")));
}
