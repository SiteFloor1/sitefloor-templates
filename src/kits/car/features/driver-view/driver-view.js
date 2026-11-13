// @ts-check
/**
 * How dark is dark: the shade picked for each window darkens that glass on the side photo and in the
 * driver's-seat view; the vehicle picks the side photo; day or night picks the inside photos. Pictures that
 * aren't shown yet load when they first are. The legal note covers every window at once.
 */
import { isLegal, minimumLight, WINDOW_NAMES } from "../../lib/legality.js";

/** How dark the film looks on the photo for each shade: an eye adjusts, so a 5% film still lets you see out. */
const VISIBLE = 0.85;

/**
 * The legal note for a window and shade.
 * @param {"fronts"|"rear"|"windscreen"} w @param {any} shade
 */
export function lawText(w, shade) {
  const min = minimumLight(w, false);
  if (min === null) return { ok: true, text: `${WINDOW_NAMES[w]}: no legal limit, so any shade we fit is allowed.` };
  if (!shade) return { ok: true, text: `${WINDOW_NAMES[w]}: no film.` };
  if (!isLegal(w, shade, false)) return { ok: false, text: `${WINDOW_NAMES[w]}: not legal. ${shade.name} is below the ${min}% the law needs, so we don't fit it there.` };
  const meter = w === "windscreen" ? ", and we check it with our meter on your car before we let it go" : "";
  return { ok: true, text: `${WINDOW_NAMES[w]}: legal. The law needs at least ${min}% of light through${meter}.` };
}

/** @param {ParentNode} el */
const reveal = (el) => { for (const img of el.querySelectorAll("img[data-src]")) { img.setAttribute("src", img.getAttribute("data-src") ?? ""); img.removeAttribute("data-src"); } };

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const t = /** @type {any} */ (ctx.data).tint;
  const dv = /** @type {HTMLElement|null} */ (root.querySelector("[data-dv]"));
  const law = root.querySelector("[data-dv-law]");
  if (!t || !dv || !law) throw new Error("driver view markup or data missing");
  const val = (/** @type {string} */ name) => /** @type {HTMLInputElement|null} */ (root.querySelector(`input[name="${name}"]:checked`))?.value ?? "";
  const rows = /** @type {("fronts"|"rear"|"windscreen")[]} */ ([...root.querySelectorAll("[data-dv-row]")].map((r) => /** @type {HTMLElement} */ (r).dataset.dvRow));

  const paint = () => {
    const body = val("dv-body");
    if (body) for (const f of root.querySelectorAll("[data-dv-body]")) { const on = /** @type {HTMLElement} */ (f).dataset.dvBody === body; /** @type {HTMLElement} */ (f).hidden = !on; if (on) reveal(f); }
    const time = val("dv-time") || "day";
    dv.dataset.time = time;
    for (const s of root.querySelectorAll(`.dv-shot[data-time="${time}"]`)) reveal(s);
    const notes = [];
    for (const w of rows) {
      const shade = t.shades.find((/** @type {any} */ s) => s.id === val(`dv-${w}`)) ?? null;
      dv.style.setProperty(`--f-${w}`, shade ? ((1 - shade.light / 100) * VISIBLE).toFixed(2) : "0");
      dv.style.setProperty(`--s-${w}`, shade?.sheen ?? "transparent");
      dv.classList.toggle(`sheen-${w}`, Boolean(shade?.sheen));
      const name = root.querySelector(`[data-dv-name="${w}"]`);
      if (name) name.textContent = shade ? shade.name : "no film";
      notes.push(lawText(w, shade));
    }
    law.replaceChildren(...notes.map((n) => Object.assign(document.createElement("p"), { textContent: n.text, className: n.ok ? "" : "no" })));
  };
  root.addEventListener("change", paint);
  paint();
}
