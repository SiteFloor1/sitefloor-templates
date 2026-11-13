// @ts-check
/**
 * The succession map: switch between the firm's illustrations and step through one a generation at a time. Arrows
 * and steps after the current one fade back; nothing moves with the scroll.
 */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const scs = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-sm]")]);
  if (!scs.length) throw new Error("succession map markup missing");
  /** @param {HTMLElement} sc @param {number} k */
  const step = (sc, k) => {
    const n = sc.querySelectorAll(".lw-sm-steps li").length;
    const at = Math.max(0, Math.min(n - 1, k));
    sc.dataset.upto = String(at);
    for (const el of /** @type {NodeListOf<HTMLElement>} */ (sc.querySelectorAll("[data-step]"))) {
      const s = Number(el.dataset.step);
      el.classList.toggle("is-later", s > at);
      el.classList.toggle("is-now", s === at);
    }
    /** @type {HTMLButtonElement} */ (sc.querySelector("[data-sm-back]")).disabled = at === 0;
    /** @type {HTMLButtonElement} */ (sc.querySelector("[data-sm-next]")).disabled = at === n - 1;
  };
  for (const sc of scs) {
    sc.querySelector("[data-sm-back]")?.addEventListener("click", () => step(sc, Number(sc.dataset.upto) - 1));
    sc.querySelector("[data-sm-next]")?.addEventListener("click", () => step(sc, Number(sc.dataset.upto) + 1));
    step(sc, 0);
  }
  const tabs = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-sm-tab]")]);
  /** @param {string} id */
  const pick = (id) => {
    for (const t of tabs) t.setAttribute("aria-selected", String(t.dataset.smTab === id));
    for (const sc of scs) sc.hidden = sc.dataset.sm !== id;
  };
  for (const t of tabs) t.addEventListener("click", () => pick(t.dataset.smTab ?? ""));
  if (tabs.length) pick(tabs[0].dataset.smTab ?? "");
  root.setAttribute("data-ready", "");
}
