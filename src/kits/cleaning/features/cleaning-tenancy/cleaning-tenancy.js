// @ts-check
/** The end-of-tenancy checklist: tick as you go; the count says how many are left. Nothing is stored or sent. */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const list = root.querySelector("[data-ten-list]"), count = /** @type {HTMLElement|null} */ (root.querySelector("[data-ten-count]"));
  if (!list || !count) throw new Error("tenancy checklist markup missing");
  const boxes = /** @type {HTMLInputElement[]} */ ([...list.querySelectorAll("input[type=checkbox]")]);
  const show = () => { const done = boxes.filter((b) => b.checked).length; count.textContent = done === boxes.length ? `All ${boxes.length} done.` : `${done} of ${boxes.length} done`; };
  list.addEventListener("change", show); show();
}
