// @ts-check
/**
 * The hero film (Signature): the client's own car, muted, looping over the still. It loads only after the page has
 * finished loading, never under reduced motion or data saver, and stops with the shared Pause button.
 */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const video = /** @type {HTMLVideoElement|null} */ (root.querySelector("[data-hire-film]"));
  if (!video) return;
  const conn = /** @type {any} */ (navigator).connection;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || conn?.saveData) return;
  const start = () => {
    video.src = video.dataset.src ?? "";
    video.addEventListener("playing", () => { video.hidden = false; root.dataset.film = "on"; }, { once: true });
    if (document.documentElement.dataset.motion !== "paused") video.play().catch(() => {});
  };
  document.addEventListener("sf-motion", (e) => {
    const paused = /** @type {CustomEvent} */ (e).detail.paused;
    if (paused) video.pause(); else if (video.src) video.play().catch(() => {}); else start();
  });
  if (document.readyState === "complete") setTimeout(start, 300); else addEventListener("load", () => setTimeout(start, 300), { once: true });
}
