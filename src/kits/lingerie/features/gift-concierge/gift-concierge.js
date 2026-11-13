// @ts-check
/** Gift concierge: the chosen dates as a calendar file with yearly reminders, and the same list to the shop. */
import { conciergeIcs, nextOccurrence, isMonthDay } from "../../lib/gifts.js";
import { ukDate } from "../../../../core/lib/diary.js";
import { readData, must, saveIcs, icsStamp } from "../dom.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = readData(root);
  const sets = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-conc]")]);
  const send = /** @type {HTMLAnchorElement} */ (must(root, "[data-conc-send]"));
  const ics = /** @type {HTMLButtonElement} */ (must(root, "[data-conc-ics]"));
  const chosen = () => sets.flatMap((s) => {
    const on = /** @type {HTMLInputElement} */ (must(s, "[data-conc-on]")).checked;
    const day = /** @type {HTMLSelectElement|null} */ (s.querySelector("[data-conc-day]"));
    const month = /** @type {HTMLSelectElement|null} */ (s.querySelector("[data-conc-month]"));
    const md = s.dataset.md ?? (day && month ? `${month.value.padStart(2, "0")}-${day.value.padStart(2, "0")}` : "");
    const label = cfg.dates.find((/** @type {any} */ d) => d.id === s.dataset.conc)?.label ?? "";
    const next = s.querySelector("[data-conc-next]");
    const ok = isMonthDay(md);
    if (next) next.textContent = on && ok ? ukDate(nextOccurrence(md, ctx.now().date)) : on ? "That day doesn't exist" : "";
    return on && ok ? [{ id: s.dataset.conc ?? "", label, md }] : [];
  });
  const update = () => {
    const list = chosen();
    ics.disabled = !list.length;
    send.href = ctx.waHref([`Hello ${ctx.data.name}, could you help me plan ahead? I'd like to give her something for:`, ...list.map((d) => `· ${d.label}, ${ukDate(nextOccurrence(d.md, ctx.now().date))}`)].join("\n"));
  };
  ics.addEventListener("click", () => {
    const list = chosen();
    if (list.length) saveIcs(`${ctx.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-gift-dates.ics`, conciergeIcs({ business: ctx.data.name, link: cfg.link, stamp: icsStamp(), leads: cfg.leads, dates: list, today: ctx.now().date }));
  });
  root.addEventListener("change", update);
  update();
}
