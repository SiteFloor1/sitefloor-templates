// @ts-check
/**
 * The hero film. A video: after the page has loaded, starts the loop and fades it in over its still.
 * Both stop for the hero's Pause button (core.js motionPause).
 * Photos: after the page has loaded, fetches the other photos one by one and crossfades to the next every
 * few seconds. Stops while the tab is hidden; with "prefers reduced motion" it stays on the first photo.
 */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const vid = /** @type {HTMLVideoElement|null} */ (root.querySelector("video[data-src]"));
  if (vid) { video(vid); return; }
  const shots = /** @type {HTMLElement[]} */ ([...root.querySelectorAll(".hf-shot")]);
  if (!shots.length) throw new Error("hero film markup missing");
  if (shots.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const seconds = Number(root.dataset.seconds) || 7;
  const mobile = matchMedia("(max-width: 760px)").matches;
  /** @param {HTMLElement} shot @returns {Promise<void>} */
  const load = (shot) => new Promise((res) => {
    const img = /** @type {HTMLImageElement|null} */ (shot.querySelector("img[data-src]"));
    if (!img) { res(); return; }
    img.onload = () => res(); img.onerror = () => res();
    img.src = (mobile && img.dataset.srcMobile) || img.dataset.src || "";
    img.removeAttribute("data-src");
  });
  let i = 0;
  const step = async () => {
    if (document.hidden || document.documentElement.dataset.motion === "paused") return;
    const next = (i + 1) % shots.length;
    await load(shots[next]);
    shots[i].classList.remove("on");
    shots[next].classList.add("on");
    i = next;
  };
  const start = () => { load(shots[1]); setInterval(step, seconds * 1000); };
  if (document.readyState === "complete") start(); else addEventListener("load", start, { once: true });
}

/** @param {HTMLVideoElement} vid */
function video(vid) {
  const nav = /** @type {Navigator & { connection?: { saveData?: boolean } }} */ (navigator);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || nav.connection?.saveData) return;
  const paused = () => document.documentElement.dataset.motion === "paused"; // the hero's Pause button (core.js)
  let loaded = false;
  const play = () => {
    if (paused() || document.hidden) return;
    if (!loaded) {
      loaded = true;
      vid.addEventListener("playing", () => vid.classList.add("on"), { once: true });
      vid.src = vid.dataset.src ?? "";
    }
    vid.play().catch(() => { /* autoplay refused (e.g. low-power mode): the still stays */ });
  };
  if (document.readyState === "complete") play(); else addEventListener("load", play, { once: true });
  document.addEventListener("visibilitychange", () => { if (document.hidden) vid.pause(); else if (loaded) play(); });
  document.addEventListener("sf-motion", () => { if (paused()) vid.pause(); else if (document.readyState === "complete") play(); });
}
