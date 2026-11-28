// @ts-check
/** HOL-5: choosing a time opens its line and fades to its photograph. */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const btns = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-st-step]")]);
  const imgs = /** @type {HTMLImageElement[]} */ ([...root.querySelectorAll("[data-st-photo]")]);
  root.classList.add("st-turn-js");
  for (const b of btns) b.addEventListener("click", () => {
    const i = Number(b.dataset.stStep);
    for (const x of btns) x.setAttribute("aria-pressed", String(x === b));
    imgs.forEach((im, j) => { im.classList.toggle("on", j === i); if (j === i) im.loading = "eager"; });
  });
}
