// @ts-check
/** Projects: one kind of work at a time, or all of it. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const buttons = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll(".el-filter [data-type]")]);
  const items = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-proj-type]")]);
  const none = /** @type {HTMLElement|null} */ (root.querySelector("[data-proj-none]"));
  if (!buttons.length || !none) throw new Error("projects markup missing");
  /** @param {string} type */
  const show = (type) => {
    for (const b of buttons) b.setAttribute("aria-checked", String(b.dataset.type === type));
    let n = 0;
    for (const el of items) { el.hidden = !!type && el.dataset.projType !== type; if (!el.hidden) n++; }
    none.hidden = n > 0;
  };
  for (const b of root.querySelectorAll("[data-type]")) b.addEventListener("click", () => show(/** @type {HTMLElement} */ (b).dataset.type ?? ""));
}
