// @ts-check
/** Darkest on the day: the wedding date (shared by the date check) names the day for the mehndi. */
import { mehndiDay, ukDate } from "../../lib/mehndi.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).darkest;
  const out = /** @type {HTMLElement|null} */ (root.querySelector("[data-dd-out]"));
  if (!cfg || !out) throw new Error("darkest-day markup missing");
  ctx.watch("wedding", (/** @type {string} */ wedding) => {
    if (!wedding) return;
    if (wedding < ctx.now().date) { out.textContent = "That date has gone."; return; }
    const day = mehndiDay(wedding, cfg.daysBefore);
    out.replaceChildren("Have your mehndi on ", Object.assign(document.createElement("b"), { textContent: ukDate(day) }), `${cfg.when ? `, ${cfg.when}` : ""}.`);
  });
}
