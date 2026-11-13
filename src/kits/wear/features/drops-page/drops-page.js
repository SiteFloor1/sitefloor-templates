// @ts-check
/** Drops page: when the next drop opens, and the stock words of its pieces. */
import { opensWords, untilDrop, countdown } from "../../lib/drop.js";
import { paintStock, stockConfig } from "../../browser/stock.js";
import { liveOpens } from "../../browser/drop.js";

/** @param {HTMLElement} root @param {import("../../../../core/js/core.js").Ctx} ctx */
export function init(root, ctx) {
  const when = root.querySelector("[data-drops-when]");
  const clock = /** @type {HTMLElement|null} */ (root.querySelector("[data-drops-clock]"));
  const tick = () => {
    const c = stockConfig();
    if (!c?.drop || !clock) return;
    const now = Date.now();
    const t = countdown(liveOpens(c.drop, c.tz, now), now, c.tz);
    clock.textContent = t ?? "";
    clock.hidden = !t;
  };
  const paint = () => {
    const c = stockConfig();
    if (c?.drop && when) {
      const now = Date.now();
      const opens = liveOpens(c.drop, c.tz, now);
      const u = untilDrop(opens, now, c.tz);
      when.textContent = u.phase === "open" ? "open now" : `${opensWords(opens, now, c.tz)} (${u.words})`;
    }
    paintStock(root);
  };
  paint();
  ctx.everyMinute(paint);
  if (clock) {
    let timer = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", () => { clearInterval(timer); if (!document.hidden) { tick(); timer = setInterval(tick, 1000); } });
  }
}
