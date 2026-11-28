// @ts-check
/** Only here: marks pieces sold out from the brand's stock sheet (or the demo's simulation); an old or unreadable sheet marks nothing. */
/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx) => Promise<{ ok: true, soldOut: string[] } | { ok: false }> }} StockProvider */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  /** @type {StockProvider|null} */ const provider = ctx.providers.popupStock;
  if (!provider) throw new Error("stock provider missing");
  const state = root.querySelector("[data-stock-state]");
  const paint = (/** @type {string[]|null} */ out) => {
    for (const li of root.querySelectorAll("[data-piece]")) {
      const gone = !!out && out.includes(/** @type {HTMLElement} */ (li).dataset.piece ?? "");
      li.classList.toggle("is-out", gone);
      const tag = /** @type {HTMLElement|null} */ (li.querySelector("[data-sold-out]"));
      if (tag) tag.hidden = !gone;
    }
    if (state) state.textContent = out ? "" : "Ask us what's left today.";
  };
  provider.load(ctx).then((r) => paint(r.ok ? r.soldOut : null), () => paint(null));
}
