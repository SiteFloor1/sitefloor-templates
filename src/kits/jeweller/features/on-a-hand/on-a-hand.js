// @ts-check
/**
 * On a hand at true size. The visitor matches an outline to a bank card (85.60 mm wide) once; the result (pixels per
 * millimetre on this screen) is kept on this device and also used by the ring sizer. Then the photo is drawn at its
 * real width; it may be wider than a phone screen, so it scrolls sideways inside its frame, centred.
 */
import { pxPerMm, CARD_MM } from "../../lib/sizes.js";

export const SCALE_KEY = "jw-pxmm";

/** @returns {number|null} */
export function savedScale() {
  try { const v = Number(localStorage.getItem(SCALE_KEY)); return v > 2 && v < 11 ? v : null; } catch { return null; }
}

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const btn = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-hand-true]"));
  const cal = /** @type {HTMLElement|null} */ (root.querySelector("[data-cal]"));
  const card = /** @type {HTMLElement|null} */ (root.querySelector("[data-cal-card]"));
  const range = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-cal-range]"));
  const done = root.querySelector("[data-cal-done]");
  const say = root.querySelector("[data-hand-say]");
  const fig = /** @type {HTMLElement|null} */ (root.querySelector("[data-hand-fig]"));
  const img = /** @type {HTMLImageElement|null} */ (fig?.querySelector("img[data-width-mm]") ?? null);
  if (!btn || !cal || !card || !range || !done || !say || !fig || !img) return;
  const mm = Number(img.dataset.widthMm);

  const drawCard = () => { card.style.width = `${range.value}px`; card.style.height = `${(Number(range.value) * 53.98) / CARD_MM}px`; };
  /** @param {number|null} s */
  const trueSize = (s) => {
    const on = s !== null;
    fig.classList.toggle("is-true", on);
    img.style.width = on ? `${Math.round(mm * /** @type {number} */ (s))}px` : "";
    btn.setAttribute("aria-pressed", String(on));
    btn.textContent = on ? "Back to the photograph" : "Show it at true size";
    say.textContent = on ? "Shown at its real size on this screen. Scroll sideways inside the photo if it's wider than the screen." : "";
    if (on) requestAnimationFrame(() => { fig.scrollLeft = (fig.scrollWidth - fig.clientWidth) / 2; });
  };
  btn.addEventListener("click", () => {
    if (btn.getAttribute("aria-pressed") === "true") { trueSize(null); return; }
    const s = savedScale();
    if (s) { trueSize(s); return; }
    cal.hidden = false; drawCard(); range.focus();
  });
  range.addEventListener("input", drawCard);
  done.addEventListener("click", () => {
    const s = pxPerMm(Number(range.value));
    if (!s) { say.textContent = "That doesn't look like a card's width; try again."; return; }
    try { localStorage.setItem(SCALE_KEY, String(s)); } catch { /* kept for this view only */ }
    cal.hidden = true; trueSize(s); btn.focus();
  });
}
