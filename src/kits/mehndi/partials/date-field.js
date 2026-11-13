// @ts-check
/**
 * The day, month and year selects (partials/date-field.njk), in UK order. A field names its date in the shared store
 * (`key`, e.g. "wedding"), so every field on the page that shares the key agrees.
 */
import { ymdOf } from "../lib/mehndi.js";

/**
 * @param {HTMLElement} root @param {import("../../../core/js/core.js").Ctx} ctx @param {string} key shared-store key
 * @param {(ymd: string) => void} onChange "YYYY-MM-DD", or "" while incomplete or impossible
 */
export function dateField(root, ctx, key, onChange) {
  const box = root.querySelector("[data-date-field]");
  if (!box) throw new Error("date field markup missing");
  const d = /** @type {HTMLSelectElement} */ (box.querySelector("[data-d]")), m = /** @type {HTMLSelectElement} */ (box.querySelector("[data-m]")), y = /** @type {HTMLSelectElement} */ (box.querySelector("[data-y]"));
  let current = "";
  const read = () => {
    const ymd = d.value && m.value && y.value ? ymdOf(Number(y.value), Number(m.value), Number(d.value)) : "";
    box.toggleAttribute("data-invalid", Boolean(d.value && m.value && y.value && !ymd));
    if (ymd === current) return;
    current = ymd; onChange(ymd);
    if (ymd) ctx.share(key, ymd);
  };
  box.addEventListener("change", read);
  ctx.watch(key, (/** @type {string} */ v) => {
    if (!v || v === current) return;
    const [yy, mm, dd] = v.split("-").map(Number);
    if (![...y.options].some((o) => o.value === String(yy))) return;
    y.value = String(yy); m.value = String(mm); d.value = String(dd); current = v; onChange(v);
  });
  onChange("");
}
