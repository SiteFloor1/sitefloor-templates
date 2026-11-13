// @ts-check
/**
 * The home menu: shows the sitting being served now, keeps the kitchen line current, filters by diet
 * and allergies, and marks today's sold-out dishes (shared by the specials feature as "tonight").
 * Picking another sitting's tab previews it, and the Carte look follows it into day or evening colours.
 */
import { kitchenLine, sittingToShow, moodNow } from "../../lib/sittings.js";
import { dishVisible, dishData } from "../../lib/filter.js";
import { isSoldOut } from "../../lib/tonight.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  /** @type {import("../../lib/sittings.js").Sitting[]} */
  const sittings = /** @type {any} */ (ctx.data).sittings ?? [];
  const kitchen = root.querySelector("[data-mn-kitchen]");
  const hiddenLine = root.querySelector("[data-mn-hidden]");
  const panels = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-mn-sitting]")]);
  const tabs = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-mn-tab]")]);
  const dishes = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-dish]")]);
  if (!kitchen || !panels.length) throw new Error("menu markup missing");
  let picked = false; // the visitor chose a sitting; stop following the clock

  /** @param {string} id @param {boolean} byHand */
  const show = (id, byHand) => {
    for (const p of panels) p.hidden = p.dataset.mnSitting !== id;
    document.documentElement.dataset.sitting = id;
    for (const t of tabs) { const on = t.dataset.mnTab === id; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; }
    const s = sittings.find((x) => x.id === id);
    if (byHand && s) document.documentElement.dataset.mood = s.mood;
  };
  const paint = () => {
    const now = ctx.now();
    const line = kitchenLine(sittings, now);
    kitchen.textContent = line.text;
    kitchen.setAttribute("data-state", line.state);
    if (!picked) {
      show(sittingToShow(sittings, now).id, false);
      document.documentElement.dataset.mood = moodNow(sittings, now);
    }
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => { picked = true; show(t.dataset.mnTab ?? "", true); });
    t.addEventListener("keydown", (e) => {
      const k = /** @type {KeyboardEvent} */ (e).key;
      if (k !== "ArrowRight" && k !== "ArrowLeft") return;
      const next = tabs[(i + (k === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      next.focus(); next.click();
    });
  });
  paint();
  ctx.everyMinute(paint);

  // Filters: one diet, any number of allergens to avoid.
  const filter = () => {
    const diet = /** @type {HTMLInputElement|null} */ (root.querySelector('input[name="mn-diet"]:checked'))?.value ?? "";
    const avoid = [...root.querySelectorAll('input[name="mn-avoid"]:checked')].map((i) => /** @type {HTMLInputElement} */ (i).value);
    let hidden = 0;
    for (const el of dishes) {
      const ok = dishVisible(dishData(el), diet, avoid);
      el.hidden = !ok;
      if (!ok && !el.closest("[data-mn-sitting]")?.hasAttribute("hidden")) hidden++;
    }
    for (const sec of root.querySelectorAll(".mn-sec")) {
      const none = sec.querySelector("[data-mn-none]");
      if (none) /** @type {HTMLElement} */ (none).hidden = [...sec.querySelectorAll("[data-dish]")].some((d) => !(/** @type {HTMLElement} */ (d).hidden));
    }
    if (hiddenLine) hiddenLine.textContent = diet || avoid.length ? `${hidden} dish${hidden === 1 ? "" : "es"} hidden on this menu.` : "";
  };
  root.addEventListener("change", (e) => { if (/** @type {HTMLElement} */ (e.target).matches('input[name="mn-diet"], input[name="mn-avoid"]')) filter(); });
  for (const t of tabs) t.addEventListener("click", filter);

  // Sold out today, from the restaurant's sheet.
  ctx.watch("tonight", (/** @type {import("../../lib/tonight.js").Tonight} */ r) => {
    const out = r.ok ? r.soldOut : [];
    for (const el of dishes) {
      const gone = isSoldOut(out, dishData(el));
      el.classList.toggle("is-out", gone);
      const tag = /** @type {HTMLElement|null} */ (el.querySelector("[data-out]"));
      if (tag) tag.hidden = !gone;
    }
  });
}
