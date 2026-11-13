// @ts-check
/**
 * The drop line: when the drop opens and a small clock ticking down to it, on the brand's clock. The clock ticks once a
 * second (text only, no movement) and stops when the tab is hidden; once the drop is open it says "open now".
 */
import { untilDrop, opensWords, countdown } from "../../lib/drop.js";
import { liveOpens } from "../../browser/drop.js";

/** @param {HTMLElement} root @param {import("../../../../core/js/core.js").Ctx} ctx */
export function init(root, ctx) {
  const tz = root.dataset.tz ?? "Europe/London";
  const rolling = root.dataset.rollingDay ? { day: root.dataset.rollingDay, time: root.dataset.rollingTime ?? "10:00" } : null;
  const when = root.querySelector("[data-drop-when]");
  const left = root.querySelector("[data-drop-left]");
  let clock = root.querySelector("[data-drop-clock]");
  const paint = () => {
    const now = Date.now();
    const opens = liveOpens({ opens: root.dataset.opens ?? "", rolling }, tz, now);
    const u = untilDrop(opens, now, tz);
    root.dataset.phase = u.phase;
    if (when) when.textContent = u.phase === "open" ? "open now" : opensWords(opens, now, tz);
    if (left) left.textContent = u.phase === "open" ? "" : ` · ${u.words}`;
    const c = countdown(opens, now, tz);
    if (c && !clock) {
      clock = document.createElement("span");
      clock.className = "wr-clock";
      clock.setAttribute("aria-hidden", "true");
      clock.setAttribute("data-drop-clock", "");
      root.querySelector(".wr-drop-t")?.append(" ", clock);
    }
    if (clock) { clock.textContent = c ?? ""; /** @type {HTMLElement} */ (clock).hidden = !c; }
  };
  paint();
  ctx.everyMinute(paint);
  let timer = setInterval(paint, 1000);
  document.addEventListener("visibilitychange", () => {
    clearInterval(timer);
    if (!document.hidden) { paint(); timer = setInterval(paint, 1000); }
  });
}
