// @ts-check
/**
 * The viewfinder's film and timecode. The poster paints first; once the page has loaded, the film for this screen
 * (the smaller file on phones) starts muted. Never with reduced motion or Save-Data; stops for the Pause button
 * (core.js motionPause, "sf-motion") and while the tab is hidden. The timecode is the clip's own position at its frame
 * rate, so it never shows a number the film isn't at.
 */
import { timecode } from "../../lib/carfilm.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const vid = /** @type {HTMLVideoElement|null} */ (root.querySelector("[data-film]"));
  const tc = root.querySelector("[data-tc]");
  if (!vid || !tc) throw new Error("viewfinder markup missing");
  const fps = /** @type {any} */ (ctx.data).carfilm?.fps ?? 25;
  const nav = /** @type {Navigator & { connection?: { saveData?: boolean } }} */ (navigator);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || nav.connection?.saveData) return;
  const paused = () => document.documentElement.dataset.motion === "paused";
  const tick = () => { tc.textContent = timecode(vid.currentTime, fps); if (!vid.paused) requestAnimationFrame(tick); };
  vid.addEventListener("play", tick);
  vid.addEventListener("seeked", tick);
  const play = () => {
    if (document.hidden || paused()) return;
    if (!vid.src) vid.src = (matchMedia("(max-width: 760px)").matches && vid.dataset.small) || vid.dataset.src || "";
    vid.play().catch(() => { /* autoplay refused: the poster stays */ });
  };
  if (document.readyState === "complete") play(); else addEventListener("load", play, { once: true });
  document.addEventListener("visibilitychange", () => { if (document.hidden) vid.pause(); else if (vid.src) play(); });
  document.addEventListener("sf-motion", () => { if (paused()) { vid.pause(); tick(); } else play(); });
}
