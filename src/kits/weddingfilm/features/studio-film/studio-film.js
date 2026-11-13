// @ts-check
/**
 * The hero film. The still (a <picture>, wide or tall) paints first; once the page has loaded, the film for this
 * screen (the wide cut, or the tall cut on phones) starts muted and fades in over its still. Never with reduced motion
 * or Save-Data; stops for the Pause button (core.js motionPause, "sf-motion") and while the tab is hidden. Other
 * features (the chapters) reach the same video through ctx.share("film").
 */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const vid = /** @type {HTMLVideoElement|null} */ (root.querySelector("video[data-wide]"));
  if (!vid) throw new Error("hero film markup missing");
  const nav = /** @type {Navigator & { connection?: { saveData?: boolean } }} */ (navigator);
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches || !!nav.connection?.saveData;
  const tall = matchMedia("(max-width: 640px)").matches;
  const paused = () => document.documentElement.dataset.motion === "paused";
  let loaded = false;
  const load = () => {
    if (loaded) return;
    loaded = true;
    vid.addEventListener("playing", () => vid.classList.add("on"), { once: true });
    vid.src = (tall ? vid.dataset.tall : vid.dataset.wide) ?? "";
  };
  /** Play when allowed; `asked` = the visitor pressed something (a chapter), which overrides reduced motion. @param {boolean} [asked] */
  const play = (asked = false) => {
    if (document.hidden || (!asked && (still || paused()))) return;
    load();
    vid.play().catch(() => { /* autoplay refused (low-power mode): the still stays */ });
  };
  ctx.share("film", { video: vid, play, load });
  if (still) return;
  if (document.readyState === "complete") play(); else addEventListener("load", () => play(), { once: true });
  document.addEventListener("visibilitychange", () => { if (document.hidden) vid.pause(); else if (loaded && !paused()) play(); });
  document.addEventListener("sf-motion", () => { if (paused()) vid.pause(); else play(); });
}
