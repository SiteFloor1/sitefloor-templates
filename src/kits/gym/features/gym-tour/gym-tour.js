// @ts-check
/** The club, room by room: the index becomes tabs (arrow keys, Home and End move between rooms); one room shows at a time. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const tabs = /** @type {HTMLAnchorElement[]} */ ([...root.querySelectorAll('[role="tab"]')]);
  const panels = /** @type {HTMLElement[]} */ ([...root.querySelectorAll('[role="tabpanel"]')]);
  if (!tabs.length || tabs.length !== panels.length) return;
  const pick = (/** @type {number} */ i, /** @type {boolean} */ focus) => {
    tabs.forEach((t, j) => { t.setAttribute("aria-selected", String(i === j)); t.tabIndex = i === j ? 0 : -1; });
    panels.forEach((p, j) => { p.hidden = i !== j; });
    if (focus) tabs[i].focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", (e) => { e.preventDefault(); pick(i, false); });
    t.addEventListener("keydown", (e) => {
      const n = tabs.length;
      const to = e.key === "ArrowDown" || e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowUp" || e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
      if (to >= 0) { e.preventDefault(); pick(to, true); }
    });
  });
  pick(0, false);
}
