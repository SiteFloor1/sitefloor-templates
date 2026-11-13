// @ts-check
/** Aftercare page: each kind of work gets its own fitting date and calendar button. */
import { wireReminders } from "../aftercare-card/reminders.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const a = /** @type {any} */ (ctx.data).aftercare;
  if (!a) throw new Error("aftercare data missing");
  for (const box of root.querySelectorAll("[data-acp]")) {
    const s = a.services.find((/** @type {any} */ x) => x.id === /** @type {HTMLElement} */ (box).dataset.acp);
    if (s) wireReminders(/** @type {HTMLElement} */ (box), ctx, () => s)();
  }
}
