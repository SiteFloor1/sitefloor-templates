// @ts-check
/** Choose by the slice: picking a flavour outlines its layer in the photograph and says what's in it. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const items = /** @type {any[]|null} */ (/** @type {any} */ (ctx.data).cakes?.flavours);
  const now = root.querySelector("[data-fl-now]");
  const band = /** @type {HTMLElement|null} */ (root.querySelector("[data-fl-band]"));
  if (!items || !now) throw new Error("flavours markup missing");
  const buttons = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-fl]")]);
  /** @param {HTMLButtonElement} b */
  const show = (b) => {
    const f = items.find((x) => x.id === b.dataset.fl);
    if (!f) return;
    buttons.forEach((x) => { x.closest("li")?.classList.toggle("on", x === b); x.setAttribute("aria-pressed", String(x === b)); });
    const name = document.createElement("b");
    name.textContent = `${f.name}.`;
    now.replaceChildren(name, ` ${f.what}`);
    if (band) {
      band.hidden = !f.layer;
      if (f.layer) { band.style.top = `${f.layer.top}%`; band.style.height = `${f.layer.height}%`; }
    }
  };
  buttons.forEach((b) => {
    b.addEventListener("click", () => show(b));
    b.addEventListener("mouseenter", () => show(b));
    b.addEventListener("focus", () => show(b));
  });
  if (buttons[0]) show(buttons[0]);
}
