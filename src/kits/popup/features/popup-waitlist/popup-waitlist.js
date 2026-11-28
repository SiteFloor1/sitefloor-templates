// @ts-check
/** The opening countdown: the days until the next stop opens, for the visitor's day, and its calendar file. */
import { resolveStops, nextOpening, daysBetween, longDate, stopIcs, slug } from "../../lib/popup.js";
import { download } from "../popup-run/popup-run.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data);
  const today = ctx.now().date;
  const nx = nextOpening(resolveStops(data.popup, today), today);
  const count = /** @type {HTMLElement|null} */ (root.querySelector("[data-wait-count]"));
  const head = root.querySelector("[data-wait-head]"), where = root.querySelector("[data-wait-where]");
  if (!nx || !count || !head) { if (count) count.hidden = true; return; }
  const k = daysBetween(today, nx.start);
  count.hidden = false;
  count.textContent = String(k);
  head.textContent = k === 1 ? `Tomorrow in ${nx.city}` : `days until ${nx.city}`;
  if (where) where.textContent = `${nx.place}, from ${longDate(nx.start)}.`;
  root.querySelector("[data-wait-ics]")?.addEventListener("click", () => download(`${slug(data.name)}-${nx.id}.ics`, stopIcs(nx, data.name, Date.now())));
}
