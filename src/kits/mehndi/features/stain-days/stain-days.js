// @ts-check
/** Your stain, day by day: the wedding date (shared by the date check) dates each photograph and names the darkest day. */
import { mehndiDay, addDaysYmd, ukDate } from "../../lib/mehndi.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).darkest;
  const line = root.querySelector("[data-sd-line]");
  const slots = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-sd-date]")]);
  if (!cfg || !line || !slots.length) throw new Error("stain-days markup missing");
  const words = slots.map((s) => s.textContent ?? "");
  const idle = line.textContent ?? "";
  ctx.watch("wedding", (/** @type {string} */ wedding) => {
    if (!wedding || wedding < ctx.now().date) {
      slots.forEach((s, i) => { s.textContent = words[i]; });
      line.textContent = idle;
      return;
    }
    const start = mehndiDay(wedding, cfg.daysBefore);
    const dates = slots.map((s) => addDaysYmd(start, Number(s.dataset.sdDate)));
    slots.forEach((s, i) => { s.textContent = `${words[i]} · ${ukDate(dates[i]).replace(/ \d{4}$/, "")}`; });
    const last = dates[dates.length - 1];
    line.replaceChildren("Darkest on ", Object.assign(document.createElement("b"), { textContent: ukDate(last) }), last === wedding ? ", your wedding day." : ".");
  });
}
