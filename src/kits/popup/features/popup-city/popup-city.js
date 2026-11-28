// @ts-check
/** Bring us to your city: puts the city into the brand's WhatsApp message and opens it. Nothing is stored or counted. */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).city;
  const input = /** @type {HTMLInputElement|null} */ (root.querySelector("input[name=city]"));
  if (!input) return; // the brand's own form: a plain link
  root.addEventListener("submit", (e) => {
    e.preventDefault();
    const city = input.value.trim().replace(/\s+/g, " ").slice(0, 40);
    if (!city) { input.focus(); return; }
    window.open(ctx.waHref(cfg.message.replaceAll("{city}", city)), "_blank", "noopener");
  });
}
