// @ts-check
/** Getting ready: a print button where printing is possible. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const b = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-nu-print]"));
  if (!b || typeof window.print !== "function") return;
  b.hidden = false;
  b.addEventListener("click", () => window.print());
}
