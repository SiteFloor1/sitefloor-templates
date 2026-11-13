// @ts-check
/** The colour year: the next visits marked on twelve months from the colour and the day it was done; to the calendar. */
import { dateField } from "../../partials/date-field.js";
import { saveIcs } from "../../partials/save-ics.js";
import { upkeepVisits, monthShort, eventsIcs, icsStamp, bookText } from "../../lib/hair.js";
import { addDaysYmd, ukDate } from "../../../../core/lib/diary.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), cfg = data.upkeep;
  const kind = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-cy-kind]"));
  const field = root.querySelector("[data-date-field]"), year = root.querySelector("[data-cy-year]"), note = root.querySelector("[data-cy-note]");
  const ics = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-cy-ics]")), send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-cy-send]"));
  if (!cfg || !kind || !field || !year || !note || !ics || !send) throw new Error("colour-year markup missing");
  const date = dateField(field);
  let visits = /** @type {string[]} */ ([]);
  const item = () => cfg.items.find((/** @type {any} */ x) => x.id === kind.value) ?? cfg.items[0];
  const render = () => {
    const today = ctx.now().date, it = item(), chosen = date.get();
    const last = chosen && chosen <= today ? chosen : addDaysYmd(today, -21);
    visits = upkeepVisits(last, it.weeks, today);
    const [y, m] = today.split("-").map(Number);
    year.replaceChildren(...Array.from({ length: 12 }, (_, i) => {
      const key = new Date(Date.UTC(y, m - 1 + i, 1)).toISOString().slice(0, 7);
      const li = document.createElement("li"), mo = document.createElement("span");
      mo.textContent = monthShort(`${key}-01`);
      li.append(mo);
      if (i === 0) li.className = "hr-cy-now";
      const hit = visits.find((v) => v.startsWith(key));
      if (hit) { const b = document.createElement("b"); b.textContent = `${it.name} ${Number(hit.slice(8, 10))}`; li.append(b); }
      return li;
    }));
    note.textContent = chosen && chosen > today ? "Choose the day it was last done, not a day ahead."
      : chosen ? `Every ${it.weeks} weeks from ${ukDate(chosen, false)}, the salon's usual for ${it.name.toLowerCase()}.`
      : `Example: ${it.name.toLowerCase()} done three weeks ago. Every ${it.weeks} weeks is the salon's usual; yours may differ.`;
    ics.hidden = !(chosen && chosen <= today && visits.length);
    send.href = ctx.bookHref(bookText(cfg.message, { extra: [visits[0] && chosen ? `${it.name}, next due around ${ukDate(visits[0])}.` : `${it.name}.`] }));
  };
  ics.addEventListener("click", () => {
    const it = item();
    saveIcs(eventsIcs({ salon: data.name, place: data.place, stamp: icsStamp(), events: visits.map((d, i) => ({ id: `${it.id}-${i + 1}`, date: d, title: `${it.name} due`, note: "Message the salon to book." })) }), "colour-year");
  });
  kind.addEventListener("change", render);
  date.on(render);
  render();
}
