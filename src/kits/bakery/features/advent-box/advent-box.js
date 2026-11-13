// @ts-check
/**
 * The advent box: which windows can open today (the shop's date, not the visitor's), opening them, and remembering
 * the opened ones on this device for the season.
 */
import { adventState, canOpen } from "../../lib/advent.js";

/** @param {number} n */
const nth = (n) => `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`;

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const a = /** @type {any} */ (ctx.data).advent;
  // The windows arrive as plain items (nothing to press without the script); make each one a button.
  const doors = [...root.querySelectorAll("[data-av]")].map((el) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = el.className; b.dataset.av = /** @type {HTMLElement} */ (el).dataset.av; b.dataset.name = /** @type {HTMLElement} */ (el).dataset.name;
    b.append(...el.childNodes);
    /** @type {HTMLImageElement} */ (b.querySelector("img")).alt = "";
    el.replaceWith(b);
    return b;
  });
  const state = /** @type {HTMLElement} */ (root.querySelector("[data-av-state]"));
  const picked = /** @type {HTMLElement} */ (root.querySelector("[data-av-picked]"));
  const key = `sf-advent-${a.year}`;
  /** @type {Set<number>} */ let opened = new Set();
  try { opened = new Set(JSON.parse(localStorage.getItem(key) ?? "[]").map(Number)); } catch { /* none kept */ }
  const save = () => { try { localStorage.setItem(key, JSON.stringify([...opened])); } catch { /* private window */ } };
  const render = () => {
    const s = adventState(ctx.now().date, a.year);
    state.textContent = s.mode === "preview" ? "Every window opens before December, so you can see inside." : s.mode === "live" ? `It's the ${nth(s.today)}: windows 1 to ${s.today} open.` : "Every window is open.";
    for (const d of doors) {
      const n = Number(d.dataset.av), ok = canOpen(s, n), open = ok && opened.has(n);
      d.classList.toggle("is-open", open);
      d.classList.toggle("is-today", s.mode === "live" && n === s.today);
      d.setAttribute("aria-expanded", String(open));
      d.toggleAttribute("aria-disabled", !ok);
      d.setAttribute("aria-label", open ? `Window ${n}: ${d.dataset.name}` : ok ? `Window ${n}, open it` : `Window ${n}, opens on the ${nth(n)}`);
    }
  };
  root.addEventListener("click", (e) => {
    const d = /** @type {HTMLButtonElement|null} */ (/** @type {HTMLElement} */ (e.target).closest("[data-av]"));
    if (!d) return;
    const n = Number(d.dataset.av), s = adventState(ctx.now().date, a.year);
    if (!canOpen(s, n)) { picked.textContent = `Window ${n} opens on the ${nth(n)} of December.`; return; }
    if (opened.has(n)) opened.delete(n); else { opened.add(n); picked.textContent = `Window ${n}: ${d.dataset.name}.`; }
    save(); render();
  });
  ctx.everyMinute(render);
  render();
  root.dataset.ready = "true";
}
