// @ts-check
/** The texture strip: one texture open at a time; its line shows under the strip. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const slices = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-tx]")]);
  const lines = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-tx-d]")]);
  if (!slices.length || slices.length !== lines.length) throw new Error("textures markup missing");
  root.dataset.txReady = "";
  const open = (/** @type {string} */ id) => {
    for (const b of slices) b.setAttribute("aria-pressed", String(b.dataset.tx === id));
    for (const d of lines) d.toggleAttribute("data-off", d.dataset.txD !== id);
  };
  for (const b of slices) b.addEventListener("click", () => open(b.dataset.tx ?? ""));
}
