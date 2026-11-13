// @ts-check
/**
 * Swatch library: picking a finish changes how light sits on every sample; picking a colour opens it large.
 * "See it on the car" carries the choice into the Showroom, when the site has one.
 */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const sw = /** @type {HTMLElement|null} */ (root.querySelector("[data-sw]"));
  const big = /** @type {HTMLElement|null} */ (root.querySelector("[data-sw-big]"));
  if (!sw || !big) throw new Error("swatch markup missing");
  const text = (/** @type {string} */ s, /** @type {string} */ v) => { const el = root.querySelector(s); if (el) el.textContent = v; };
  const checked = (/** @type {string} */ name) => /** @type {HTMLInputElement|null} */ (root.querySelector(`input[name="${name}"]:checked`));

  const show = () => {
    const f = checked("sw-finish"), c = checked("sw-colour");
    if (f) { sw.dataset.finish = f.value; text("[data-sw-fin]", f.dataset.name ?? ""); text("[data-sw-note]", f.dataset.note ?? ""); }
    if (c) { big.style.setProperty("--c", c.dataset.hex ?? ""); text("[data-sw-name]", c.dataset.name ?? ""); }
  };
  root.addEventListener("change", show);

  root.querySelector("[data-sw-try]")?.addEventListener("click", () => {
    const f = checked("sw-finish"), c = checked("sw-colour");
    for (const [name, value] of [["wrap", c?.value], ["finish", f?.value]]) {
      const input = /** @type {HTMLInputElement|null} */ (document.querySelector(`#showroom input[name="${name}"][value="${value}"]`));
      if (input && !input.checked) input.click();
    }
  });
  show();
}
