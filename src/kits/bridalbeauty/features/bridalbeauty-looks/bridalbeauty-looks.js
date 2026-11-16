// @ts-check
/** The look library's filters: all, by finish or by hair; one at a time, so a bride never filters herself to nothing. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const buttons = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-lk-f]")]);
  const items = /** @type {HTMLElement[]} */ ([...root.querySelectorAll(".bb-lk-grid > li")]);
  const count = root.querySelector("[data-lk-count]");
  root.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement} */ (e.target).closest("[data-lk-f]");
    if (!b) return;
    const [kind, id] = (/** @type {HTMLElement} */ (b).dataset.lkF ?? "all").split(":");
    for (const x of buttons) x.setAttribute("aria-pressed", String(x === b));
    let shown = 0;
    for (const li of items) { const on = kind === "all" || li.dataset[kind] === id; li.hidden = !on; if (on) shown++; }
    if (count) count.textContent = `${shown} ${shown === 1 ? "look" : "looks"}`;
  });
}
