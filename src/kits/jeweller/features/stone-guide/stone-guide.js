// @ts-check
/** The stone guide: tabs (arrow keys move) show one shape at a time on wide screens. */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const list = /** @type {HTMLElement|null} */ (root.querySelector("[data-stone-tabs]"));
  const tabs = /** @type {HTMLButtonElement[]} */ ([...(list?.querySelectorAll('[role="tab"]') ?? [])]);
  const panels = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-stone-panel]")]);
  if (!list || tabs.length < 2) return;
  list.hidden = false;
  root.classList.add("is-tabbed");
  /** @param {number} i @param {boolean} [focus] */
  const pick = (i, focus) => {
    tabs.forEach((t, j) => { t.setAttribute("aria-selected", String(j === i)); t.tabIndex = j === i ? 0 : -1; });
    panels.forEach((p, j) => { p.hidden = j !== i; });
    if (focus) tabs[i].focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => pick(i));
    t.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") pick((i + 1) % tabs.length, true);
      if (e.key === "ArrowLeft") pick((i - 1 + tabs.length) % tabs.length, true);
    });
  });
  pick(0);
}
