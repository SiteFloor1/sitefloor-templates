// @ts-check
/** Your matter, step by step: one stage's words at a time; arrow keys move along the line. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const tabs = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-ms]")]);
  const panels = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-msp]")]);
  if (!tabs.length || tabs.length !== panels.length) throw new Error("matter steps markup missing");
  /** @param {number} i @param {boolean} [focus] */
  const pick = (i, focus) => {
    tabs.forEach((t, k) => { t.setAttribute("aria-selected", String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    panels.forEach((p, k) => { p.hidden = k !== i; });
    if (focus) tabs[i].focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => pick(i));
    t.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); pick(Math.min(tabs.length - 1, i + 1), true); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); pick(Math.max(0, i - 1), true); }
    });
  });
  pick(0);
  root.setAttribute("data-ready", "");
}
