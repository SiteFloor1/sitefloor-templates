// @ts-check
/** Can I work here? Today's laptop-friendly stretches and a strip of the day, from the café's own busyness numbers. */
import { laptopWindows, windowLabel, dayBars } from "../../lib/busy.js";
import { formatTime12 } from "../../../../core/lib/hours.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const busy = /** @type {any} */ (ctx.data).busy;
  const win = root.querySelector("[data-wh-win]"), strip = root.querySelector("[data-wh-strip]");
  if (!busy || !win || !strip) return; // no busyness numbers: the card stands on its own
  const paint = () => {
    const now = ctx.now();
    const w = laptopWindows(busy, now.weekday).filter((x) => x.to > now.minutes);
    const status = ctx.status();
    win.textContent = !status.open && !status.nextOpen ? "We're closed today." : w.length ? w.map(windowLabel).join(" and ") : "Not today: it's busy most of the day. Try a weekday morning.";
    const bars = dayBars(busy, now.weekday);
    strip.replaceChildren(...bars.map((b) => {
      const s = document.createElement("span");
      s.className = `wh-b wh-l${b.level}${now.minutes >= b.start && now.minutes < b.start + 60 && status.open ? " is-now" : ""}`;
      s.dataset.t = formatTime12(b.start);
      return s;
    }));
  };
  ctx.everyMinute(paint);
  paint();
}
