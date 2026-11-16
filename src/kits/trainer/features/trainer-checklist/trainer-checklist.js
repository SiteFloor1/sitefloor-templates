// @ts-check
/** Before your session (PT-8): counts the ticks; nothing leaves the page or is kept. */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const count = /** @type {HTMLElement} */ (root.querySelector("[data-tcl-count]"));
  const ticks = /** @type {HTMLInputElement[]} */ ([...root.querySelectorAll("[data-tcl-tick]")]);
  const paint = () => {
    const done = ticks.filter((t) => t.checked).length;
    count.textContent = done === ticks.length ? "All set. See you there." : `${done} of ${ticks.length} ready`;
  };
  root.addEventListener("change", paint);
  paint();
}
