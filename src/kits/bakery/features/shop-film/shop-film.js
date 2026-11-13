// @ts-check
/**
 * The shop's film in the hero: a short muted loop that starts after the page has loaded (its first frame is already
 * on screen as a picture, so nothing changes when it swaps), the tall cut on phones. Never with reduced motion or
 * data saver; stops with the shared Pause button and when the tab is hidden.
 */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const v = /** @type {HTMLVideoElement|null} */ (root.querySelector("[data-shop-film]"));
  root.dataset.ready = "true";
  const saver = /** @type {any} */ (navigator).connection?.saveData;
  if (!v || saver || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const start = () => {
    if (document.documentElement.dataset.motion === "paused") return;
    if (!v.src) v.src = matchMedia("(max-width: 759px)").matches ? v.dataset.tall ?? "" : v.dataset.wide ?? "";
    v.play().catch(() => {});
  };
  v.addEventListener("playing", () => { v.hidden = false; }, { once: true });
  document.addEventListener("sf-motion", (e) => { if (/** @type {CustomEvent} */ (e).detail.paused) v.pause(); else start(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) v.pause(); else if (v.src) start(); });
  if (document.readyState === "complete") start(); else addEventListener("load", start, { once: true });
}
