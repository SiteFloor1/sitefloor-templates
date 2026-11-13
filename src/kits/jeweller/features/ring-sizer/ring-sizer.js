// @ts-check
/**
 * Ring size as a guide: a measured length gives the nearest UK size; or, once the screen is matched to a bank card,
 * a circle sized in real millimetres is fitted inside a ring the visitor owns. The table row lights up.
 */
import { sizeFromCircumference, sizeFromDiameter, pxPerMm, CARD_MM } from "../../lib/sizes.js";
import { savedScale, SCALE_KEY } from "../on-a-hand/on-a-hand.js";

/** @param {ReturnType<typeof sizeFromCircumference>} s */
const words = (s) => (s ? `About a UK ${s.between ? `${s.between} (between ${s.between.replace("–", " and ")})` : s.letter}.` : "That's outside the sizes on our chart; we'll measure you at the appointment.");

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const q = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  const mm = /** @type {HTMLInputElement|null} */ (q("[data-rs-mm]"));
  const out = q("[data-rs-out]");
  const cal = q("[data-rs-cal]"), card = q("[data-cal-card]"), range = /** @type {HTMLInputElement|null} */ (q("[data-cal-range]"));
  const ring = q("[data-rs-ring]"), circle = q("[data-rs-circle]"), dia = /** @type {HTMLInputElement|null} */ (q("[data-rs-dia]"));
  const ringOut = q("[data-rs-ring-out]"), step1 = q("[data-rs-step1]");
  if (!mm || !out || !cal || !card || !range || !ring || !circle || !dia || !ringOut || !step1) throw new Error("ring sizer markup missing");

  const mark = (/** @type {string|undefined} */ letter) => { for (const r of root.querySelectorAll("tr[data-size]")) r.classList.toggle("is-hit", /** @type {HTMLElement} */ (r).dataset.size === letter); };
  mm.addEventListener("input", () => {
    const v = Number(mm.value);
    if (!mm.value) { out.textContent = ""; mark(undefined); return; }
    const s = sizeFromCircumference(v);
    out.textContent = words(s); mark(s?.letter);
  });

  let scale = savedScale();
  const drawCard = () => { card.style.width = `${range.value}px`; card.style.height = `${(Number(range.value) * 53.98) / CARD_MM}px`; };
  const drawRing = () => {
    if (!scale) return;
    const d = Number(dia.value);
    circle.style.width = circle.style.height = `${d * scale}px`;
    const s = sizeFromDiameter(d);
    ringOut.textContent = `${d.toFixed(1)} mm inside. ${words(s)}`; mark(s?.letter);
  };
  const phase = () => { cal.hidden = Boolean(scale); step1.hidden = Boolean(scale); ring.hidden = !scale; drawCard(); drawRing(); };
  range.addEventListener("input", drawCard);
  q("[data-cal-done]")?.addEventListener("click", () => {
    const s = pxPerMm(Number(range.value));
    if (!s) return;
    scale = s;
    try { localStorage.setItem(SCALE_KEY, String(s)); } catch { /* this view only */ }
    phase(); dia.focus();
  });
  q("[data-rs-recal]")?.addEventListener("click", () => { scale = null; phase(); range.focus(); });
  dia.addEventListener("input", drawRing);
  phase();
}
