// @ts-check
/**
 * The gelato wall, live: today's state of each flavour from the shop's sheet ("gelato" rows). Off today: the tub stays
 * on the wall, dimmed, with "Back tomorrow"; a few left: says so. An unreadable sheet marks nothing.
 */
import { stateOf } from "../../lib/bakes.js";
import { startBakes } from "../bakes/sheet-provider.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const tubs = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-flavour]")]);
  startBakes(ctx);
  ctx.watch("bakes", (/** @type {import("../../lib/bakes.js").Bakes} */ b) => {
    for (const t of tubs) {
      const s = stateOf(b, { id: t.dataset.flavour ?? "", name: t.dataset.name ?? "" });
      const tag = /** @type {HTMLElement} */ (t.querySelector("[data-gw-state]"));
      const off = s?.status === "sold out";
      t.classList.toggle("is-off", off);
      tag.textContent = off ? "Back tomorrow" : s?.status === "low" ? "A few left" : "";
      tag.hidden = !tag.textContent;
    }
  });
  for (const day of document.querySelectorAll("[data-today]")) day.textContent = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: ctx.data.hours.timezone });
  root.dataset.ready = "true";
}
