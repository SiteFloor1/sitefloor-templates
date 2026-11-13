// @ts-check
/**
 * The day's sittings: marks the one being served now (or next today) and says when the kitchen closes, from the
 * same rules as the menu's kitchen line (src/kits/restaurant/lib/sittings.js). Updates every minute.
 */
import { sittingState, kitchenLine } from "../../lib/sittings.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const sittings = /** @type {any} */ (ctx.data).sittings ?? [];
  const line = root.querySelector("[data-si-line]");
  const items = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-si]")]);
  if (!line || !items.length) throw new Error("sittings markup missing");
  const draw = () => {
    const now = ctx.now();
    const { current, next } = sittingState(sittings, now);
    const nextToday = !current && next && next.inDays === 0 ? next.sitting.id : "";
    for (const el of items) {
      const state = current?.id === el.dataset.si ? "now" : nextToday === el.dataset.si ? "next" : "";
      el.dataset.state = state;
      const tag = el.querySelector("[data-si-now]");
      if (tag) tag.textContent = state === "now" ? "Now" : state === "next" ? "Next" : "";
    }
    line.textContent = kitchenLine(sittings, now).text;
  };
  draw();
  ctx.everyMinute(draw);
}
