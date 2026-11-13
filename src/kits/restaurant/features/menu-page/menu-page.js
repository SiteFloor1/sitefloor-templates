// @ts-check
/** The menu page: tabs for each sitting, drinks and the allergen chart, and "hide dishes containing…" for lists and chart alike. */
import { dishVisible, dishData } from "../../lib/filter.js";
import { sittingToShow } from "../../lib/sittings.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const tabs = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-mp-tab]")]);
  const panels = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-mp-panel]")]);
  const hiddenLine = root.querySelector("[data-mp-hidden]");
  if (!tabs.length || !panels.length) throw new Error("menu page markup missing");
  const sittings = /** @type {any} */ (ctx.data).sittings ?? [];
  /** @param {string} id @param {boolean} byHand */
  const show = (id, byHand) => {
    for (const p of panels) p.hidden = p.dataset.mpPanel !== id;
    for (const t of tabs) { const on = t.dataset.mpTab === id; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; }
    const s = sittings.find((/** @type {any} */ x) => x.id === id);
    if (byHand && s) document.documentElement.dataset.mood = s.mood;
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => show(t.dataset.mpTab ?? "", true));
    t.addEventListener("keydown", (e) => {
      const k = /** @type {KeyboardEvent} */ (e).key;
      if (k !== "ArrowRight" && k !== "ArrowLeft") return;
      const next = tabs[(i + (k === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      next.focus(); next.click();
    });
  });
  // Open on the menu being served now, or the next one today.
  const first = location.hash === "#chart" ? "chart" : location.hash === "#drinks" ? "drinks" : sittingToShow(sittings, ctx.now()).id;
  show(first, false);

  const dishes = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-dish]")]);
  root.addEventListener("change", (e) => {
    if (!(/** @type {HTMLElement} */ (e.target).matches('input[name="mp-avoid"]'))) return;
    const avoid = [...root.querySelectorAll('input[name="mp-avoid"]:checked')].map((x) => /** @type {HTMLInputElement} */ (x).value);
    const gone = new Set();
    for (const el of dishes) { const ok = dishVisible(dishData(el), "", avoid); el.hidden = !ok; if (!ok) gone.add(el.dataset.dish); }
    if (hiddenLine) hiddenLine.textContent = avoid.length ? `${gone.size} dish${gone.size === 1 ? "" : "es"} and drinks hidden.` : "";
  });
}
