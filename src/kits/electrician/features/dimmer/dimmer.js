// @ts-check
/**
 * The dimmer: the fader cross-fades between the client's photographs (darkest first), so between two frames both are
 * partly seen, as a dimmer would. Only opacity changes; nothing is drawn or simulated.
 */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const frames = /** @type {HTMLImageElement[]} */ ([...root.querySelectorAll("[data-dim-frame]")]);
  const fader = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-dim-fader]"));
  const now = /** @type {HTMLElement|null} */ (root.querySelector("[data-dim-now]"));
  if (frames.length < 2 || !fader || !now) throw new Error("dimmer markup missing");
  const labels = frames.map((f) => f.dataset.label ?? "");
  const update = () => {
    const t = (Number(fader.value) / 100) * (frames.length - 1);
    // Each frame comes in over the middle of its step: a clean change, never two frames half-seen for long.
    const ease = (/** @type {number} */ x) => { const k = Math.max(0, Math.min(1, (x - 0.3) / 0.4)); return k * k * (3 - 2 * k); };
    frames.forEach((f, i) => { f.style.opacity = i === 0 ? "1" : String(ease(t - (i - 1))); });
    const label = labels[Math.round(t)];
    now.textContent = label;
    fader.setAttribute("aria-valuetext", label);
  };
  fader.addEventListener("input", update);
  update();
}
