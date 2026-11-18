// @ts-check
/** Prices (DRIVE-1): the manual/automatic switch shows one list, and tells the planner which prices to use. */
import { openable } from "../../lib/cards.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  openable(root);
  const buttons = [...root.querySelectorAll("[data-dp-g]")];
  const lists = [...root.querySelectorAll("[data-dp-list]")];
  const from = root.querySelector("[data-dp-from]");
  const cfg = /** @type {any} */ (ctx.data).driving.lessons;
  /** @param {string} g */
  const show = (g) => {
    lists.forEach((el) => { /** @type {HTMLElement} */ (el).hidden = el.getAttribute("data-dp-list") !== g; });
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.getAttribute("data-dp-g") === g)));
    if (from && cfg[g]) from.textContent = `£${cfg[g].hour}`;
    root.setAttribute("data-g", g);
    ctx.share("gearbox", g);
  };
  buttons.forEach((b) => b.addEventListener("click", () => show(/** @type {string} */ (b.getAttribute("data-dp-g")))));
  show(lists[0]?.getAttribute("data-dp-list") ?? "manual");
}
