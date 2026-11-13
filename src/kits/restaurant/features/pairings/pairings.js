// @ts-check
/** What to drink with it: shows the pairings for the picked dish (without JavaScript, every set shows). */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const sets = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-pr-for]")]);
  if (!sets.length) throw new Error("pairings markup missing");
  const show = () => {
    const id = /** @type {HTMLInputElement|null} */ (root.querySelector('input[name="pr-dish"]:checked'))?.value ?? sets[0].dataset.prFor;
    for (const s of sets) s.hidden = s.dataset.prFor !== id;
  };
  root.addEventListener("change", show);
  show();
}
