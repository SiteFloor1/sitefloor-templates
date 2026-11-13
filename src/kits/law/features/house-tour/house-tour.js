// @ts-check
/** The house, room by room: choosing a room cross-fades its photograph; arrow keys move through the rooms. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const tabs = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-ht]")]);
  const figs = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-ht-fig]")]);
  if (!tabs.length) throw new Error("house tour markup missing");
  /** @param {number} i @param {boolean} [focus] */
  const pick = (i, focus) => {
    const id = tabs[i].dataset.ht;
    tabs.forEach((t, k) => { t.setAttribute("aria-selected", String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    for (const f of figs) f.classList.toggle("is-on", f.dataset.htFig === id);
    if (focus) tabs[i].focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => pick(i));
    t.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); pick((i + 1) % tabs.length, true); }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); pick((i - 1 + tabs.length) % tabs.length, true); }
    });
  });
  pick(0);
  root.setAttribute("data-ready", "");
}
