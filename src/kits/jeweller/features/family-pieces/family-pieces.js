// @ts-check
/** Family pieces: each before/after is stacked and the slider fades from before to after. */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  for (const sec of root.querySelectorAll("section")) {
    const box = /** @type {HTMLElement|null} */ (sec.querySelector("[data-dc]"));
    const range = /** @type {HTMLInputElement|null} */ (sec.querySelector("[data-dc-range]"));
    if (!box || !range) continue;
    box.classList.add("is-stacked");
    const paint = () => box.style.setProperty("--dc", String(Number(range.value) / 100));
    range.addEventListener("input", paint);
    paint();
  }
}
