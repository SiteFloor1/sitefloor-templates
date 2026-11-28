// @ts-check
/**
 * Timed entry: lays out the days left in the run for the visitor's day, and the entry times for the chosen day; each
 * time is a link to the brand's own booking page. It never says booked or few left: only the booking page knows.
 * The chosen time is shared, for the invitation.
 */
import { resolveStops, currentStop, runDays, entryTimes, slotHref, shortDay, dayOfMonth, formatTime12 } from "../../lib/popup.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), cfg = data.slots;
  const days = root.querySelector("[data-slot-days]"), times = root.querySelector("[data-slot-times]");
  if (!cfg || !days || !times) throw new Error("timed-entry markup missing");
  const now = ctx.now();
  const s = currentStop(resolveStops(data.popup, now.date), now.date);
  if (!s) return;
  const list = runDays(data.hours, s, now.date);
  const showDay = (/** @type {string} */ ymd) => {
    days.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.day === ymd)));
    const t = entryTimes(data.hours, s, ymd, ctx.now(), cfg.every, cfg.lastBefore);
    if (!t.length) {
      times.replaceChildren(Object.assign(document.createElement("p"), { className: "psl-none", textContent: ymd === ctx.now().date ? "No more times today. Try another day." : "Closed that day." }));
      return;
    }
    times.replaceChildren(...t.map((m) => {
      const a = Object.assign(document.createElement("a"), { href: slotHref(cfg.url, ymd, m), textContent: formatTime12(m), target: "_blank", rel: "noopener" });
      a.dataset.time = String(m);
      a.addEventListener("click", () => ctx.share("popupSlot", { stop: s, date: ymd, minutes: m }));
      return a;
    }));
  };
  days.replaceChildren(...list.map((d) => {
    const b = Object.assign(document.createElement("button"), { type: "button", className: "psl-day", disabled: !d.open });
    b.dataset.day = d.date;
    b.append(shortDay(d.date), Object.assign(document.createElement("b"), { textContent: String(dayOfMonth(d.date)) }));
    b.addEventListener("click", () => showDay(d.date));
    return b;
  }));
  const first = list.find((d) => entryTimes(data.hours, s, d.date, ctx.now(), cfg.every, cfg.lastBefore).length) ?? list[0];
  if (first) showDay(first.date);
}
