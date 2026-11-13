// @ts-check
/** The projects map: on "Show the map", the tiles (worked out at build time) are put on the page and load. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const btn = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-map-show]"));
  const tpl = /** @type {HTMLTemplateElement|null} */ (root.querySelector("[data-map-tiles]"));
  if (!btn || !tpl) return;
  btn.addEventListener("click", () => {
    const frame = /** @type {HTMLElement} */ (btn.parentElement);
    for (const img of tpl.content.querySelectorAll("img")) img.removeAttribute("loading");
    frame.append(tpl.content.cloneNode(true));
    btn.remove();
    frame.dataset.shown = "";
  });
}
