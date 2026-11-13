// @ts-check
/**
 * Shows the season covering today (in the shop's timezone) and tints the page
 * for it; hides the rest. Runs once on load and again whenever the date changes.
 */
import { activeSeason } from "../../core/lib/seasons.js";

/** @type {import("../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const items = /** @type {HTMLElement[]} */ ([...root.querySelectorAll(".season")]);
  const seasons = items.map((el) => ({ from: el.dataset.from ?? "", to: el.dataset.to ?? "", name: "", banner: "" }));
  let day = "";
  const paint = () => {
    const today = ctx.now().date;
    if (today === day) return;
    day = today;
    const on = activeSeason(seasons, today);
    items.forEach((el, i) => { el.hidden = i !== on; });
    const tint = on === -1 ? "" : items[on].dataset.tint ?? "";
    if (tint) document.documentElement.dataset.season = tint;
    else delete document.documentElement.dataset.season;
  };
  paint();
  ctx.everyMinute(paint);
}
