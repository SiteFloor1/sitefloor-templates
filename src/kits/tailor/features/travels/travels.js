// @ts-check
/** Trunk shows: a show that finishes after the build drops off in the browser; each one to the calendar as all-day events. */
import { travelIcs } from "../../lib/tailor.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const none = /** @type {HTMLElement|null} */ (root.querySelector("[data-tv-none]"));
  if (!none) throw new Error("travels markup missing");
  const today = ctx.now().date;
  const rows = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-tv]")]);
  for (const r of rows) if ((r.dataset.to ?? "") < today) r.remove();
  none.hidden = rows.some((r) => r.isConnected);
  for (const b of root.querySelectorAll("[data-tv-ics]")) b.addEventListener("click", () => {
    const r = /** @type {HTMLElement} */ (b.closest("[data-tv]")), d = r.dataset;
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const file = travelIcs({ id: d.tv ?? "", city: d.city ?? "", venue: d.venue ?? "", from: d.from ?? "", to: d.to ?? "" }, ctx.data.name, stamp);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([file], { type: "text/calendar" }));
    a.download = `${d.tv}.ics`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  });
}
