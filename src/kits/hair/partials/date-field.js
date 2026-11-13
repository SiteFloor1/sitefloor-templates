// @ts-check
/** Reads and sets a date-field.njk group (day, month, year selects). */
import { ymdOf, isYmd } from "../../../core/lib/diary.js";

/**
 * @param {Element} field the [data-date-field] fieldset
 * @returns {{ get: () => string, set: (ymd: string) => void, on: (fn: () => void) => void }}
 */
export function dateField(field) {
  const sel = (/** @type {string} */ s) => /** @type {HTMLSelectElement} */ (field.querySelector(s));
  const d = sel("[data-d]"), m = sel("[data-m]"), y = sel("[data-y]");
  return {
    get() {
      if (!d.value || !m.value || !y.value) return "";
      const v = ymdOf(Number(y.value), Number(m.value), Number(d.value));
      return isYmd(v) ? v : "";
    },
    set(ymd) {
      const [yy, mm, dd] = ymd.split("-").map(Number);
      if (![...y.options].some((o) => o.value === String(yy))) y.add(new globalThis.Option(String(yy), String(yy)), 1);
      y.value = String(yy); m.value = String(mm); d.value = String(dd);
    },
    on(fn) { for (const s of [d, m, y]) s.addEventListener("change", fn); },
  };
}
