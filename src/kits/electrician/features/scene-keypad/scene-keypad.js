// @ts-check
/**
 * The scene keypad: a key fades the hero to that scene's photograph and changes the line beneath the headline. The
 * other scenes' photographs are fetched after the page has loaded (or as soon as a key is pressed), so the first view
 * only downloads one. The chosen scene is shared, so the house in 3D opens in it.
 */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const hero = /** @type {HTMLElement|null} */ (root.closest("[data-hero]"));
  const keys = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-key]")]);
  const line = /** @type {HTMLElement|null} */ (hero?.querySelector("[data-scene-line]") ?? null);
  if (!hero || !keys.length || !line) throw new Error("scene keypad markup missing");
  const pics = /** @type {HTMLElement[]} */ ([...hero.querySelectorAll("[data-scene-pic]")]);
  let fetched = false;
  const fetchAll = () => {
    if (fetched) return;
    fetched = true;
    for (const p of pics) {
      for (const s of p.querySelectorAll("source[data-srcset]")) { const el = /** @type {HTMLSourceElement} */ (s); el.srcset = el.dataset.srcset ?? ""; }
      const img = /** @type {HTMLImageElement|null} */ (p.querySelector("img[data-src]"));
      if (img) img.src = img.dataset.src ?? "";
    }
  };
  if (document.readyState === "complete") setTimeout(fetchAll, 1200);
  else addEventListener("load", () => setTimeout(fetchAll, 1200), { once: true });
  /** @param {HTMLButtonElement} k */
  const choose = (k) => {
    fetchAll();
    const id = k.dataset.key ?? "";
    for (const x of keys) x.setAttribute("aria-pressed", String(x === k));
    for (const p of pics) p.classList.toggle("on", p.dataset.scenePic === id);
    line.textContent = k.dataset.line ?? "";
    ctx.share("scene", id);
  };
  for (const k of keys) {
    k.addEventListener("click", () => choose(k));
    k.addEventListener("pointerenter", fetchAll, { once: true });
    k.addEventListener("focus", fetchAll, { once: true });
  }
}
