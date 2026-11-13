// @ts-check
/** The salon plan: one place at a time; the choice is shared with the table request as "seat". */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const spots = /** @type {any} */ (ctx.data).salonPlan?.spots;
  const now = root.querySelector("[data-spl-now]");
  const btns = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-spl]")]);
  if (!spots || !now) throw new Error("salon plan markup or data missing");
  const first = now.textContent;
  root.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement} */ (e.target).closest("[data-spl]");
    if (!b) return;
    const on = b.getAttribute("aria-pressed") !== "true";
    for (const x of btns) x.setAttribute("aria-pressed", String(on && x === b));
    const s = on ? spots.find((/** @type {any} */ x) => x.id === b.getAttribute("data-spl")) : null;
    now.textContent = s ? `${s.label}${s.note ? `: ${s.note}` : ""}. It goes with your request; we'll do our best.` : first;
    ctx.share("seat", s ? { label: s.label } : null);
  });
}
