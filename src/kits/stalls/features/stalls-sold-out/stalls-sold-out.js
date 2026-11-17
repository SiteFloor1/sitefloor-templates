// @ts-check
/**
 * Sold out today: reads the stall's Form responses (its sheet, or the demo's simulation) and strikes through today's
 * sold-out items on every menu on the page, with the time. Rows from another day never count; a failure changes nothing.
 */

/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx) => Promise<{ ok: true, out: Record<string, string> } | { ok: false }> }} SoldOutProvider */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  /** @type {SoldOutProvider|null} */ const provider = ctx.providers.stallsSoldOut;
  if (!provider) throw new Error("sold-out provider missing");
  provider.load(ctx).then((r) => {
    if (!r.ok) return;
    const names = Object.keys(r.out);
    for (const li of document.querySelectorAll("[data-item]")) {
      const t = r.out[/** @type {HTMLElement} */ (li).dataset.item ?? ""];
      if (!t) continue;
      li.classList.add("out");
      const line = li.querySelector("[data-item-line]");
      if (line) line.textContent = `Sold out today at ${t}. Back next stop.`;
    }
    root.textContent = names.length ? `${names.length === 1 ? "One thing has" : `${names.length} things have`} sold out today.` : "";
    ctx.share("stallsSoldOut", r.out);
  }, () => {});
}
