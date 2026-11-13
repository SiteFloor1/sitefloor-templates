// @ts-check
/**
 * Your treatment, visit by visit: one treatment shown at a time; with a first date, every visit is dated (UK order)
 * and the visits can go to the calendar as all-day events.
 */
import { visitDates, dayEventsIcs } from "../../lib/smile.js";
import { ukDate } from "../../../../core/lib/diary.js";
import { saveIcs, stamp } from "./ics.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), list = data.journey;
  const start = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-jy-start]"));
  const ics = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-jy-ics]"));
  const picks = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-jy]")]);
  if (!list || !start || !ics || !picks.length) throw new Error("journey markup missing");
  start.min = ctx.now().date;
  const plain = new Map([...root.querySelectorAll("[data-when]")].map((el) => [el, el.textContent ?? ""]));
  let id = picks[0].dataset.jy;

  const render = () => {
    const t = list.find((/** @type {any} */ x) => x.id === id);
    picks.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.jy === id)));
    root.querySelectorAll("[data-jy-t]").forEach((s) => { /** @type {HTMLElement} */ (s).hidden = /** @type {HTMLElement} */ (s).dataset.jyT !== id; });
    const dated = start.value && start.value >= ctx.now().date ? visitDates(t.visits, start.value) : null;
    root.querySelector(`[data-jy-t="${id}"]`)?.querySelectorAll("[data-v]").forEach((li) => {
      const when = li.querySelector("[data-when]"), i = Number(/** @type {HTMLElement} */ (li).dataset.v);
      if (when) when.textContent = dated ? ukDate(dated[i].date) : plain.get(when) ?? "";
    });
    ics.hidden = !dated;
  };
  picks.forEach((b) => b.addEventListener("click", () => { id = b.dataset.jy; render(); }));
  start.addEventListener("change", render);
  ics.addEventListener("click", () => {
    const t = list.find((/** @type {any} */ x) => x.id === id);
    if (!start.value) return;
    const events = visitDates(t.visits, start.value).map((v, i) => ({ id: `${t.id}-${i}`, date: v.date, title: `${v.label}, ${data.name ?? ""}`.replace(/, $/, "") }));
    saveIcs(dayEventsIcs({ events, studio: data.name ?? "studio", place: data.place, stamp: stamp() }), `${t.id}-visits.ics`);
  });
  render();
}

