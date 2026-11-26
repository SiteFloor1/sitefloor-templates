// @ts-check
/** What to wear: the class names act as tabs (arrow keys move between them); one list shows at a time. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const tabs = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll('[role="tab"]')]);
  if (!tabs.length) throw new Error("uniform tabs missing");
  /** @param {number} i @param {boolean} focus */
  const show = (i, focus) => {
    tabs.forEach((t, j) => {
      const on = i === j;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = root.querySelector(`#${t.getAttribute("aria-controls")}`);
      if (panel) /** @type {HTMLElement} */ (panel).hidden = !on;
    });
    if (focus) tabs[i].focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => show(i, false));
    t.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") show((i + 1) % tabs.length, true);
      if (e.key === "ArrowLeft") show((i - 1 + tabs.length) % tabs.length, true);
    });
  });
}
