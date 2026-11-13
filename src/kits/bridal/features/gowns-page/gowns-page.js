// @ts-check
/**
 * The gown finder: narrows the rail by silhouette, neckline, sleeve and designer. Choices that would leave nothing
 * are disabled, so the rail is never empty by accident. A link ending #<designer id> opens with that designer chosen.
 */
import { filterGowns, liveChoices } from "../../lib/gowns.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const gowns = /** @type {any} */ (ctx.data).gowns?.items ?? [];
  const form = root.querySelector("[data-gf-form]"), count = root.querySelector("[data-gf-count]");
  const none = /** @type {HTMLElement|null} */ (root.querySelector("[data-gf-none]")), reset = root.querySelector("[data-gf-reset]");
  if (!form || !count || !none || !reset || !gowns.length) throw new Error("gown finder markup missing");
  const selects = /** @type {HTMLSelectElement[]} */ ([...form.querySelectorAll("[data-gf]")]);
  const cards = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-gown]")]);
  const chosen = () => Object.fromEntries(selects.map((s) => [s.dataset.gf, s.value]));

  const apply = () => {
    const f = chosen();
    const shown = new Set(filterGowns(gowns, f).map((/** @type {any} */ g) => g.id));
    for (const c of cards) c.hidden = !shown.has(c.dataset.gown);
    for (const s of selects) {
      const live = liveChoices(gowns, f, /** @type {any} */ (s.dataset.gf));
      for (const o of s.options) if (o.value) o.disabled = !live.has(o.value);
    }
    count.textContent = `${shown.size} ${shown.size === 1 ? "gown" : "gowns"}`;
    none.hidden = shown.size > 0;
  };
  const fromHash = () => {
    const id = location.hash.slice(1);
    const house = selects.find((s) => s.dataset.gf === "house");
    if (house && [...house.options].some((o) => o.value === id && id)) { for (const s of selects) s.value = ""; house.value = id; apply(); }
  };
  form.addEventListener("change", apply);
  reset.addEventListener("click", () => { for (const s of selects) s.value = ""; apply(); });
  window.addEventListener("hashchange", fromHash);
  apply();
  fromHash();
  void ctx;
}
