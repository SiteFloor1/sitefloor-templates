// @ts-check
/**
 * The Pass: one plate at a time, picked from the rail; pins on the photo and lines on the ticket light up
 * together; with The Table's group, the ticket says who can eat the dish.
 */
import { dishData } from "../../lib/filter.js";
import { canEat, reasons } from "../../lib/group.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const tabs = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-ps-tab]")]);
  const dishes = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-ps-dish]")]);
  if (!tabs.length || !dishes.length) throw new Error("the pass markup missing");
  /** @param {string} id */
  const show = (id) => {
    for (const d of dishes) {
      const on = d.dataset.psDish === id;
      d.hidden = !on;
      if (!on) continue;
      // Only the first plate's photo loads with the page; the others load when picked.
      const img = /** @type {HTMLImageElement|null} */ (d.querySelector("img[data-src]"));
      if (img && !img.getAttribute("src")) img.src = img.dataset.src ?? "";
      d.classList.remove("in"); void d.offsetWidth; d.classList.add("in");
    }
    for (const t of tabs) { const on = t.dataset.psTab === id; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; }
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => show(t.dataset.psTab ?? ""));
    t.addEventListener("keydown", (e) => {
      const k = /** @type {KeyboardEvent} */ (e).key;
      if (k !== "ArrowRight" && k !== "ArrowLeft") return;
      const next = tabs[(i + (k === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      next.focus(); next.click();
    });
  });
  show(tabs[0].dataset.psTab ?? "");

  // On a phone the plates are stories: a bar per plate, swipe or tap the plate's edge for the next.
  const bars = [...root.querySelectorAll("[data-ps-bar]")];
  const ids = tabs.map((t) => t.dataset.psTab ?? "");
  let cur = 0;
  const stories = matchMedia("(max-width: 760px)");
  const mark = () => bars.forEach((b, i) => { b.classList.toggle("done", i < cur); b.classList.toggle("on", i === cur); });
  root.addEventListener("click", (e) => { const t = /** @type {HTMLElement} */ (e.target).closest("[data-ps-tab]"); if (t) { cur = ids.indexOf(/** @type {HTMLElement} */ (t).dataset.psTab ?? ""); mark(); } });
  /** @param {number} dir */
  const go = (dir) => { const n = cur + dir; if (n < 0 || n >= ids.length) return; cur = n; show(ids[n]); mark(); };
  mark();
  for (const d of dishes) {
    const plate = /** @type {HTMLElement|null} */ (d.querySelector(".ps-plate"));
    if (!plate) continue;
    /** @type {{ x: number, y: number }|null} */ let start = null;
    let swiped = false;
    plate.addEventListener("pointerdown", (e) => { start = { x: e.clientX, y: e.clientY }; swiped = false; });
    plate.addEventListener("pointerup", (e) => {
      if (!start) return;
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      start = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { swiped = true; go(dx < 0 ? 1 : -1); }
    });
    plate.addEventListener("click", (e) => {
      if (swiped || !stories.matches || /** @type {HTMLElement} */ (e.target).closest("[data-ps-pin]")) return;
      const r = plate.getBoundingClientRect();
      const fx = (e.clientX - r.left) / r.width;
      if (fx > 0.7) go(1); else if (fx < 0.3) go(-1);
    });
  }

  // Pin and ticket line light up together.
  /** @param {HTMLElement} dish @param {string|null} n */
  const light = (dish, n) => {
    for (const el of dish.querySelectorAll("[data-ps-pin], [data-ps-note]")) {
      const k = /** @type {HTMLElement} */ (el).dataset.psPin ?? /** @type {HTMLElement} */ (el).dataset.psNote;
      el.classList.toggle("on", k === n);
    }
  };
  for (const d of dishes) {
    for (const ev of ["pointerover", "focusin", "click"]) d.addEventListener(ev, (e) => {
      const hit = /** @type {HTMLElement} */ (e.target).closest("[data-ps-pin], [data-ps-note]");
      if (hit) light(d, /** @type {HTMLElement} */ (hit).dataset.psPin ?? /** @type {HTMLElement} */ (hit).dataset.psNote ?? null);
    });
    d.addEventListener("pointerleave", () => light(d, null));
  }

  // Who at the table can eat it (from The Table).
  ctx.watch("guests", (/** @type {import("../../lib/group.js").Guest[]} */ guests) => {
    for (const d of dishes) {
      const who = /** @type {HTMLElement|null} */ (d.querySelector("[data-ps-who]"));
      if (!who) continue;
      if (!guests?.length) { who.hidden = true; continue; }
      const dish = dishData(d);
      const cant = guests.flatMap((g, i) => (canEat(g, dish) ? [] : [`guest ${i + 1} (${reasons(g, dish).join(", ")})`]));
      who.hidden = false;
      who.textContent = cant.length ? `At your table: ${guests.length - cant.length} of ${guests.length} can eat this. Not for ${cant.join("; ")}.` : `At your table: all ${guests.length} can eat this.`;
      who.classList.toggle("all", !cant.length);
    }
  });
}
