// @ts-check
/**
 * Treatment rhythm: the clinic's reminders after a visit and the next visits at its spacing, from the day of the
 * visit. Only days still ahead are listed and saved; with none ahead, nothing is offered.
 */
import { daysBetween } from "../../../../core/lib/diary.js";
import { dayEventsIcs, fill, longDay, rhythmEvents, shortDay } from "../../lib/skin.js";
import { saveIcs, stamp } from "../../lib/save.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), cfg = data.rhythm;
  const sel = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-rh-item]"));
  const input = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-rh-date]"));
  const list = root.querySelector("[data-rh-list]"), ics = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-rh-ics]"));
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-rh-send]"));
  if (!cfg || !sel || !input || !list || !ics || !send) throw new Error("rhythm markup missing");
  input.value = ctx.now().date;
  const ahead = () => {
    const item = cfg.items.find((/** @type {any} */ x) => x.id === sel.value);
    if (!item || !input.value) return { item, events: [] };
    return { item, events: rhythmEvents(item, input.value).filter((e) => daysBetween(ctx.now().date, e.date) >= 0) };
  };
  const render = () => {
    const { item, events } = ahead();
    list.replaceChildren(...events.map((e) => {
      const li = document.createElement("li");
      li.append(Object.assign(document.createElement("span"), { className: "sk-rh-d", textContent: shortDay(e.date) }), Object.assign(document.createElement("span"), { textContent: e.title }));
      return li;
    }));
    ics.hidden = !events.length;
    const next = events.find((e) => e.id.includes("-next-"));
    send.hidden = !next;
    if (item && next) send.href = ctx.bookHref(fill(cfg.message, { name: data.name, treatment: item.name, date: longDay(next.date) }));
  };
  sel.addEventListener("change", render);
  input.addEventListener("change", render);
  ics.addEventListener("click", () => {
    const { item, events } = ahead();
    if (item && events.length) saveIcs(dayEventsIcs({ events, clinic: data.name, place: data.place, stamp: stamp() }), `${item.id}-rhythm.ics`);
  });
  render();
}
