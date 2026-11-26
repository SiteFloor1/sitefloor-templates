// @ts-check
/**
 * The year: keeps "Next" current on the day (a page built days ago may name a date that has passed), and builds one
 * calendar file of every date still to come.
 */
import { yearItems, nextItem, dateWords, yearIcs, icsStamp } from "../../lib/ballet.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data);
  const btn = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-bt-ics]"));
  const next = root.querySelector("[data-bt-next]");
  const done = /** @type {HTMLElement|null} */ (root.querySelector("[data-bt-done]"));
  if (!data.year || !btn || !done) throw new Error("year markup or data missing");
  const upcoming = () => yearItems(data.year.items, [], [], ctx.now().date);
  const nx = nextItem(upcoming(), ctx.now().date);
  if (next && nx) next.textContent = `${nx.label}, ${dateWords(nx.date, "long")}`;
  btn.addEventListener("click", () => {
    const items = upcoming();
    const ics = yearIcs({ items, school: data.school, place: data.place, stamp: icsStamp(Date.now()) });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([ics], { type: "text/calendar" })), download: `${data.school.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-dates.ics` });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    done.hidden = false;
    done.textContent = `${items.length} dates, ready to open in your calendar.`;
  });
}
