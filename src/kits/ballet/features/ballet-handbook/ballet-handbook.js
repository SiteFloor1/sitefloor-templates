// @ts-check
/** The parent handbook: shows "Print the handbook" once the script can print. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const btn = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-hb-print]"));
  if (!btn) throw new Error("handbook print button missing");
  btn.hidden = false;
  btn.addEventListener("click", () => window.print());
}
