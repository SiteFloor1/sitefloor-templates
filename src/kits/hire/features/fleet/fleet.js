// @ts-check
/** "Free this weekend?" on each car: free or taken from the client's Sheet; "ask us" when it can't be read or is old. */
import { startAvailability } from "./sheet-provider.js";
import { thisWeekend, weekendState } from "../../lib/sheet.js";

const WORDS = { free: "free on our calendar", taken: "taken", ask: "ask us, we couldn't check our calendar just now" };

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  startAvailability(ctx);
  ctx.watch("hire:availability", (a) => {
    const weekend = thisWeekend(ctx.now());
    for (const el of root.querySelectorAll("[data-weekend]")) {
      const state = weekendState(a, /** @type {HTMLElement} */ (el).dataset.weekend ?? "", weekend);
      /** @type {HTMLElement} */ (el).dataset.state = state;
      const out = el.querySelector("[data-weekend-state]");
      if (out) out.textContent = WORDS[state];
    }
  });
}
