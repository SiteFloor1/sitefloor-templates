// @ts-check
/** Today's counter: marks each piece from the shop's sheet (shared with the menu, the box, the flight and the cake date). */
import { stateOf, leftWords, ago } from "../../lib/bakes.js";
import { startBakes } from "./sheet-provider.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const pieces = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-item]")]);
  const upd = root.querySelector("[data-bk-upd]");
  const off = /** @type {HTMLElement|null} */ (root.querySelector("[data-bk-off]"));
  startBakes(ctx);
  ctx.watch("bakes", (/** @type {import("../../lib/bakes.js").Bakes} */ b) => {
    if (off) off.hidden = b.ok;
    if (upd) upd.textContent = b.ok && b.updatedAt ? `Counter updated ${ago(Date.now() - b.updatedAt)}` : "";
    for (const el of pieces) {
      const s = stateOf(b, { id: el.dataset.item ?? "", name: el.dataset.name ?? "" });
      const tag = /** @type {HTMLElement} */ (el.querySelector("[data-item-status]"));
      el.dataset.status = s?.status ?? "";
      tag.hidden = !s;
      tag.textContent = s ? leftWords(s) : "";
      const note = /** @type {HTMLElement|null} */ (el.querySelector("[data-item-note]"));
      if (note) { note.hidden = !s?.note; note.textContent = s?.note ?? ""; }
    }
  });
  for (const day of document.querySelectorAll("[data-today]")) day.textContent = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: ctx.data.hours.timezone });
  root.dataset.ready = "true";
}
