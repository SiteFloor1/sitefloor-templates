// @ts-check
/**
 * The wedding week planner: the wedding date gives each step its day (the artist's days before), UK order; one calendar
 * file, the week for the family on WhatsApp, and "hold my mehndi day" to the artist.
 */
import { planDates, ukDate, weekIcs, icsStamp, plannerText, familyText } from "../../lib/mehndi.js";
import { dateField } from "../../partials/date-field.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data);
  const cfg = data.planner;
  const list = root.querySelector("[data-wp-list]"), late = /** @type {HTMLElement|null} */ (root.querySelector("[data-wp-late]"));
  const ask = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-wp-ask]")), ics = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-wp-ics]"));
  const family = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-wp-family]")), day = root.querySelector("[data-wp-wedding]");
  if (!cfg || !list || !late || !ask || !ics || !family || !day) throw new Error("week planner markup missing");
  const words = new Map([...list.querySelectorAll("li[data-step]")].map((li) => [/** @type {HTMLElement} */ (li).dataset.step, li.querySelector("[data-wp-date]")?.textContent ?? ""]));
  let url = "";
  dateField(root, ctx, "wedding", (wedding) => {
    if (url) { URL.revokeObjectURL(url); url = ""; }
    const today = ctx.now().date;
    const dates = wedding && wedding >= today ? planDates(wedding, cfg.steps, today) : [];
    const mehndi = dates.find((d) => d.mehndi && !d.past)?.date;
    ask.href = ctx.bookHref(plannerText(cfg.message, wedding >= today ? wedding : "", mehndi));
    for (const li of list.querySelectorAll("li[data-step]")) {
      const id = /** @type {HTMLElement} */ (li).dataset.step ?? "";
      const d = dates.find((x) => x.id === id);
      const out = li.querySelector("[data-wp-date]");
      if (out) out.textContent = d ? ukDate(d.date) : words.get(id) ?? "";
      li.classList.toggle("past", Boolean(d?.past));
    }
    day.textContent = dates.length ? ukDate(wedding) : "On the day";
    late.hidden = !dates.some((d) => d.past);
    const ahead = dates.filter((d) => !d.past);
    if (!dates.length) { ics.hidden = true; family.hidden = true; return; }
    const file = weekIcs({ artist: data.name, place: data.place, stamp: icsStamp(new Date()), events: [
      ...ahead.map((d) => ({ id: d.id, date: d.date, title: `${d.label} · ${data.name}`, note: d.text ?? "" })),
      { id: "wedding", date: wedding, title: "The wedding" },
    ] });
    url = URL.createObjectURL(new Blob([file], { type: "text/calendar" }));
    ics.href = url; ics.hidden = false;
    family.href = `https://wa.me/?text=${encodeURIComponent(familyText(data.name, ahead, wedding))}`;
    family.hidden = false;
  });
}
