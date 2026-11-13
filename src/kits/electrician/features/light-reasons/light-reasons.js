// @ts-check
/** Every light has a reason: a number on the photo and the same number in the list choose the light shown in the card. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const items = /** @type {any[]} */ (/** @type {any} */ (ctx.data).fittings);
  const buttons = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-light]")]);
  const $ = (/** @type {string} */ s) => /** @type {HTMLElement} */ (root.querySelector(s));
  if (!items || !buttons.length || !root.querySelector("[data-fit]")) throw new Error("light-reasons markup missing");
  /** @param {number} i */
  const show = (i) => {
    const f = items[i];
    for (const b of buttons) b.setAttribute("aria-pressed", String(Number(b.dataset.light) === i));
    $("[data-fit-n]").textContent = String(i + 1);
    $("[data-fit-name]").textContent = f.name;
    $("[data-fit-why]").textContent = f.why;
    $("[data-fit-scene]").textContent = f.scene;
    $("[data-fit-colour]").textContent = f.colour;
    $("[data-fit-control]").textContent = f.control;
  };
  for (const b of buttons) b.addEventListener("click", () => show(Number(b.dataset.light)));
}
