// @ts-check
/** The day, month and year selects (partials/date-field.njk): "YYYY-MM-DD", or "" while incomplete or impossible. */
import { ymdOf } from "../../../core/lib/diary.js";

/** @param {HTMLElement} root @param {(ymd: string) => void} onChange */
export function dateField(root, onChange) {
  const box = root.querySelector("[data-date-field]");
  if (!box) throw new Error("date field markup missing");
  const d = /** @type {HTMLSelectElement} */ (box.querySelector("[data-d]")), m = /** @type {HTMLSelectElement} */ (box.querySelector("[data-m]")), y = /** @type {HTMLSelectElement} */ (box.querySelector("[data-y]"));
  box.addEventListener("change", () => {
    const ymd = d.value && m.value && y.value ? ymdOf(Number(y.value), Number(m.value), Number(d.value)) : "";
    box.toggleAttribute("data-invalid", Boolean(d.value && m.value && y.value && !ymd));
    onChange(ymd);
  });
}
