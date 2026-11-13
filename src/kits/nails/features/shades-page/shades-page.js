// @ts-check
/** House shades: the family chips show one family at a time. Every shade shows without JavaScript. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const bar = /** @type {HTMLElement|null} */ (root.querySelector("[data-sl-filter]"));
  if (!bar) throw new Error("shades filter markup missing");
  const items = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("li[data-family]")]);
  bar.hidden = false;
  bar.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement|null} */ (/** @type {Element} */ (e.target).closest("[data-family]"));
    if (!b) return;
    for (const x of bar.querySelectorAll("[data-family]")) x.setAttribute("aria-pressed", String(x === b));
    const fam = b.dataset.family ?? "";
    for (const li of items) li.hidden = Boolean(fam) && li.dataset.family !== fam;
  });
}
