// @ts-check
/** The planting palette's month and light choices: show only plants at their best that month, for that light. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const filters = /** @type {HTMLElement|null} */ (root.querySelector("[data-pp-filters]"));
  const items = /** @type {HTMLElement[]} */ ([...root.querySelectorAll(".gd-pp-i")]);
  const none = /** @type {HTMLElement|null} */ (root.querySelector("[data-pp-none]"));
  if (!filters || !items.length) throw new Error("planting-palette markup missing");
  filters.removeAttribute("data-wait");
  let month = "0", light = "";
  const apply = () => {
    let shown = 0;
    for (const el of items) {
      const ok = (month === "0" || (el.dataset.months ?? "").split(" ").includes(month)) && (!light || (el.dataset.light ?? "").split(" ").includes(light));
      el.hidden = !ok; if (ok) shown++;
    }
    if (none) none.hidden = shown > 0;
  };
  filters.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement} */ (e.target).closest("button");
    if (!b) return;
    const group = b.parentElement;
    group?.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    if (b.dataset.ppMonth !== undefined) month = b.dataset.ppMonth;
    if (b.dataset.ppLight !== undefined) light = b.dataset.ppLight;
    apply();
  });
}
