// @ts-check
/**
 * Local time and the gap to London: every [data-local-time] line on the page shows the time now in its data-tz zone
 * ("Local time 22:08 · 3 hours behind London"), from the browser's own time-zone data, and stays current. Other
 * scripts change data-tz when the place on show changes and say so with an "lb-stop" event; the line redraws then.
 */
import { localLine } from "../../lib/tourism.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const lines = () => /** @type {HTMLElement[]} */ ([...root.ownerDocument.querySelectorAll("[data-local-time]")]);
  const draw = () => {
    for (const el of lines()) {
      const tz = el.dataset.tz;
      if (!tz) continue;
      try { el.textContent = localLine(tz, Date.now()); } catch { el.hidden = true; }
    }
  };
  draw();
  root.ownerDocument.addEventListener("lb-stop", draw);
  ctx.everyMinute(draw);
}
