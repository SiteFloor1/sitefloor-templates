// @ts-check
/**
 * The turntable: drag (or use the arrow keys) to turn the bottle frame by frame. The frames load quietly after the
 * page; until a frame has loaded, the one before stays on screen, so nothing ever flashes empty.
 */
import { frameFor, frameFile, patternOf } from "../../lib/turntable.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const t = /** @type {any} */ (ctx.data).turntable;
  const img = /** @type {HTMLImageElement|null} */ (root.querySelector("img"));
  const source = /** @type {HTMLSourceElement|null} */ (root.querySelector("source"));
  const hint = root.querySelector(".fr-turn-hint");
  if (!t || !img) throw new Error("turntable markup missing");
  // The markup carries frame 1 of each set; the frames differ only in the number before the extension.
  const src = patternOf(root.dataset.src ?? ""), wide = patternOf(root.dataset.wide ?? ""), ph = patternOf(root.dataset.phone ?? "");
  const phone = () => !!source && matchMedia(source.media).matches;
  const set = (/** @type {number} */ n) => {
    const d = frameFile(src, n, t.repeat);
    return { src: phone() ? frameFile(ph, n, t.repeat) : d, srcset: !phone() && wide ? `${d} ${t.width}w, ${frameFile(wide, n, t.repeat)} ${Math.round(t.width * 1.5)}w` : "" };
  };
  /** @type {Set<string>} */ const ready = new Set();
  let loaded = false;
  const preload = () => {
    if (loaded) return; loaded = true;
    for (let n = 2; n <= t.repeat; n++) { const f = set(n), im = new Image(); im.decoding = "async"; if (f.srcset) { im.sizes = "100vw"; im.srcset = f.srcset; } im.src = f.src; im.onload = () => ready.add(String(n)); }
  };
  let cur = 1;
  const show = (/** @type {number} */ n) => {
    cur = ((n - 1) % t.frames + t.frames) % t.frames + 1;
    const u = ((cur - 1) % t.repeat) + 1, f = set(u);
    if (source) source.srcset = frameFile(ph, u, t.repeat);
    if (f.srcset) img.srcset = f.srcset;
    img.src = f.src;
    root.setAttribute("aria-valuenow", String(cur));
    root.setAttribute("aria-valuetext", cur === 1 ? "Front" : `Turned ${Math.round(((cur - 1) * 360) / t.frames)} degrees`);
    hint?.classList.add("gone");
  };
  let x0 = /** @type {number|null} */ (null), f0 = 1;
  root.addEventListener("pointerdown", (e) => { preload(); x0 = e.clientX; f0 = cur; root.setPointerCapture(e.pointerId); root.classList.add("is-dragging"); });
  root.addEventListener("pointermove", (e) => { if (x0 === null) return; const n = frameFor(f0, e.clientX - x0, root.clientWidth, t.frames); if (n !== cur) show(n); });
  const end = () => { x0 = null; root.classList.remove("is-dragging"); };
  root.addEventListener("pointerup", end);
  root.addEventListener("pointercancel", end);
  root.addEventListener("keydown", (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1, Home: 1 - cur, End: t.frames - cur }[e.key];
    if (step === undefined) return;
    e.preventDefault(); preload(); show(cur + step);
  });
  const later = /** @type {any} */ (window).requestIdleCallback ?? ((/** @type {() => void} */ fn) => setTimeout(fn, 1500));
  if (document.readyState === "complete") later(preload); else addEventListener("load", () => later(preload));
}
