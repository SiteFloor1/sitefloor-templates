// @ts-check
/**
 * The wedding date fields (partials/date-field.njk): day, month and year selects in UK order. Every field on the
 * page shares one date ("wedding" in the shared store), so the appointment request, the order-by date and the
 * diary agree; the phone remembers it for next time (a convenience only: nothing breaks without storage).
 */
import { ymdOf } from "../../../core/lib/diary.js";

const KEY = "sf-wedding";

/**
 * @param {HTMLElement} root the feature @param {import("../../../core/js/core.js").Ctx} ctx
 * @param {(ymd: string) => void} onChange called with "YYYY-MM-DD", or "" while the date is incomplete or impossible
 */
export function weddingField(root, ctx, onChange) {
  const box = root.querySelector("[data-date-field]");
  if (!box) throw new Error("date field markup missing");
  const d = /** @type {HTMLSelectElement} */ (box.querySelector("[data-d]")), m = /** @type {HTMLSelectElement} */ (box.querySelector("[data-m]")), y = /** @type {HTMLSelectElement} */ (box.querySelector("[data-y]"));
  let current = "";
  const set = (/** @type {string} */ ymd) => {
    if (!ymd || ymd === current) return;
    const [yy, mm, dd] = ymd.split("-").map(Number);
    if (![...y.options].some((o) => o.value === String(yy))) return; // a remembered date outside the years offered
    y.value = String(yy); m.value = String(mm); d.value = String(dd);
    current = ymd; onChange(ymd);
  };
  const read = () => {
    const ymd = d.value && m.value && y.value ? ymdOf(Number(y.value), Number(m.value), Number(d.value)) : "";
    box.toggleAttribute("data-invalid", Boolean(d.value && m.value && y.value && !ymd));
    if (ymd === current) return;
    current = ymd; onChange(ymd);
    if (ymd) { ctx.share("wedding", ymd); try { localStorage.setItem(KEY, ymd); } catch { /* storage off: fine */ } }
  };
  box.addEventListener("change", read);
  ctx.watch("wedding", (/** @type {string} */ v) => set(v));
  let saved = "";
  try { saved = localStorage.getItem(KEY) ?? ""; } catch { /* storage off */ }
  if (/^\d{4}-\d{2}-\d{2}$/.test(saved) && saved >= ctx.now().date) set(saved);
  else onChange("");
}
