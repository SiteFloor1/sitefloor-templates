// @ts-check
/** Fit and fabric: pick a size to see its measurements and fit note; a size from the chest from the brand's own table. */
import { sizeForChest, plausibleChest, findSize, feetToCm, stoneToKg } from "../../lib/fit.js";

/** @param {HTMLElement} root */
export function init(root) {
  const fits = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-fit]")]);
  const pickers = fits.map(bindFit);
  const sf = /** @type {HTMLElement|null} */ (root.querySelector("[data-size-finder]"));
  if (sf) bindFinder(sf, (s) => pickers.forEach((pick) => pick(s)));
}

/**
 * The size finder (partials/size-finder.njk): re-reads every answer on each change and says the size with its reasons.
 * The answer also turns each piece below to that size.
 * @param {HTMLElement} sec @param {(size: string) => void} onSize
 */
export function bindFinder(sec, onSize) {
  /** @type {any} */ let guide;
  try { guide = JSON.parse(sec.querySelector("[data-sf-guide]")?.textContent ?? ""); } catch { return; }
  const q = (/** @type {string} */ s) => /** @type {HTMLInputElement|null} */ (sec.querySelector(s));
  const num = (/** @type {string} */ s) => { const v = q(s)?.value; return v ? Number(v) : NaN; };
  const imperial = { h: false, w: false };
  const sizeOut = sec.querySelector("[data-sf-size]");
  const why = sec.querySelector("[data-sf-why]");
  const last = guide.sizes[guide.sizes.length - 1].size;
  const first = guide.sizes[0].size;
  const paint = () => {
    const height = imperial.h ? (Number.isFinite(num("[data-sf-ft]")) ? feetToCm(num("[data-sf-ft]"), num("[data-sf-in]") || 0) : NaN) : num("[data-sf-h]");
    const weight = imperial.w ? (Number.isFinite(num("[data-sf-st]")) ? stoneToKg(num("[data-sf-st]"), num("[data-sf-lb]") || 0) : NaN) : num("[data-sf-w]");
    const usual = q("[data-sf-usual]")?.value || undefined;
    const shift = Number(q("[data-sf-brand]")?.value ?? 0);
    const prefer = /** @type {any} */ (/** @type {HTMLInputElement|null} */ (sec.querySelector("[data-sf-prefer]:checked"))?.value ?? "regular");
    const r = findSize({ height, weight, chest: num("[data-sf-c]"), usual, shift, prefer }, guide);
    if (!sizeOut || !why) return;
    sec.dataset.state = r ? (r.size ? "size" : "beyond") : "";
    if (!r) { sizeOut.textContent = "Your answers, read against our chart."; why.replaceChildren(); return; }
    sizeOut.textContent = r.size ? `Try ${r.size}` : r.beyond === "above" ? `Larger than ${last}: ask us` : `Smaller than ${first}: ask us`;
    const lines = [...r.reasons];
    if (r.split) lines.push("Your answers point to different sizes, so check the flat measurements below.");
    why.replaceChildren(...lines.map((t) => { const li = document.createElement("li"); li.textContent = t; return li; }));
    if (r.size) onSize(r.size);
  };
  for (const b of /** @type {NodeListOf<HTMLButtonElement>} */ (sec.querySelectorAll("[data-sf-unit]"))) {
    b.addEventListener("click", () => {
      const k = /** @type {"h"|"w"} */ (b.dataset.sfUnit);
      imperial[k] = !imperial[k];
      b.setAttribute("aria-pressed", String(imperial[k]));
      b.textContent = k === "h" ? (imperial.h ? "cm" : "ft and in") : (imperial.w ? "kg" : "stone and lb");
      const fs = b.closest("fieldset");
      fs?.querySelector(k === "h" ? "[data-unit-cm]" : "[data-unit-kg]")?.toggleAttribute("hidden", imperial[k]);
      fs?.querySelector(k === "h" ? "[data-unit-ft]" : "[data-unit-st]")?.toggleAttribute("hidden", !imperial[k]);
      paint();
    });
  }
  sec.querySelector("[data-sf-form]")?.addEventListener("input", paint);
  sec.querySelector("[data-sf-form]")?.addEventListener("change", paint);
  sec.querySelector("[data-sf-form]")?.addEventListener("submit", (e) => e.preventDefault());
}

/** One piece's fit block (partials/fit-block.njk); returns its size picker. @param {HTMLElement} sec @returns {(size: string) => void} */
export function bindFit(sec) {
  {
    const sizes = (sec.dataset.sizes ?? "").split(",");
    const ease = Number(sec.dataset.ease ?? 14);
    const pick = (/** @type {string} */ s) => {
      for (const b of /** @type {NodeListOf<HTMLButtonElement>} */ (sec.querySelectorAll("[data-pick]"))) b.setAttribute("aria-pressed", String(b.dataset.pick === s));
      for (const el of /** @type {NodeListOf<HTMLElement>} */ (sec.querySelectorAll("[data-size]"))) el.hidden = el.dataset.size !== s;
    };
    sec.querySelectorAll("[data-pick]").forEach((b) => b.addEventListener("click", () => pick(/** @type {HTMLElement} */ (b).dataset.pick ?? "")));
    const form = /** @type {HTMLFormElement|null} */ (sec.querySelector("[data-finder]"));
    const input = /** @type {HTMLInputElement|null} */ (sec.querySelector("[data-chest-in]"));
    const out = sec.querySelector("[data-chest-out]");
    /** @type {Record<string, number>} */ let table = {};
    try { table = JSON.parse(sec.querySelector("[data-chest-table]")?.textContent ?? "{}"); } catch { /* no table, no finder */ }
    form?.addEventListener("submit", (e) => e.preventDefault());
    input?.addEventListener("input", () => {
      const c = Number(input.value);
      if (!out) return;
      if (!input.value) { out.textContent = ""; return; }
      if (!plausibleChest(c)) { out.textContent = "Check that measurement"; return; }
      const s = sizeForChest(c, sizes, table, ease);
      out.textContent = s ? `Try ${s}` : `Larger than ${sizes[sizes.length - 1]}: ask us`;
      if (s) pick(s);
    });
    return (/** @type {string} */ s) => { if (sizes.includes(s)) pick(s); };
  }
}
