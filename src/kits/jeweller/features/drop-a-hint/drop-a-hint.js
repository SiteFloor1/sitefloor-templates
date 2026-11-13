// @ts-check
/**
 * Drop a hint: the phone's own share sheet when it has one (the person chooses who), otherwise WhatsApp with the hint
 * written and no number, so the customer picks the contact. Each "Drop a hint" button is its own root.
 */
import { hintText } from "../../lib/messages.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const b = /** @type {HTMLButtonElement} */ (root);
  b.hidden = false;
  b.addEventListener("click", async () => {
    const d = b.dataset;
    const text = hintText({ house: ctx.data.name, piece: d.hintName ?? "", price: d.hintPrice || undefined, url: d.hintUrl ?? "" });
    const nav = /** @type {any} */ (navigator);
    if (typeof nav.share === "function") {
      try { await nav.share({ title: d.hintName, text }); return; } catch (e) { if (/** @type {Error} */ (e).name === "AbortError") return; }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  });
}
