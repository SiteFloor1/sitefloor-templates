// @ts-check
/** Nail art: shape and length chips narrow the sets. Every set shows without JavaScript. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const bar = /** @type {HTMLElement|null} */ (root.querySelector("[data-ar-filter]"));
  const none = /** @type {HTMLElement|null} */ (root.querySelector("[data-ar-none]"));
  if (!bar || !none) throw new Error("art filter markup missing");
  const items = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("li[data-shape]")]);
  /** @type {Record<string, string>} */ const pick = { shape: "", length: "" };
  bar.hidden = false;
  bar.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement|null} */ (/** @type {Element} */ (e.target).closest("[data-k]"));
    if (!b) return;
    const k = b.dataset.k ?? "";
    pick[k] = b.dataset.v ?? "";
    for (const x of bar.querySelectorAll(`[data-k="${k}"]`)) x.setAttribute("aria-pressed", String(x === b));
    let shown = 0;
    for (const li of items) { li.hidden = Boolean((pick.shape && li.dataset.shape !== pick.shape) || (pick.length && li.dataset.length !== pick.length)); if (!li.hidden) shown++; }
    none.hidden = shown > 0;
  });
}
