// @ts-check
/** The set-up card's Copy button: the card as plain text, ready to paste into an email to a venue or organiser. */
import { setupText } from "../../lib/stalls.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).setup, btn = root.querySelector("[data-su-copy]"), out = root.querySelector("[data-su-out]");
  if (!cfg || !btn || !out) throw new Error("set-up card markup missing");
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(setupText(/** @type {any} */ (ctx.data).name, cfg.rows));
      out.textContent = "Copied. Paste it into your email to the venue.";
    } catch {
      out.textContent = "Copy isn't allowed here; select the card's text instead.";
    }
  });
}
