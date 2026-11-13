// @ts-check
/** A class's page: its next five times from the visitor's own clock, with places when the studio's sheet says. */
import { upcoming, shortDay, saidTime, dayName, placesWords, waitlistText } from "../../lib/classes.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), pl = data.pilates, id = root.dataset.class ?? "";
  const list = root.querySelector("[data-cp-times]");
  const c = pl?.classes[id];
  if (!list || !c) throw new Error("class page markup missing");
  /** @type {import("../../lib/places.js").Places} */
  let places = { ok: false };
  const render = () => {
    const now = ctx.now();
    const next = upcoming(pl, data.hours, now, 5, id);
    list.replaceChildren(...(next.length ? next.map((s) => {
      const left = places.ok && Object.hasOwn(places.left, s.key) ? places.left[s.key] : null;
      const words = { class: c.name, day: dayName(s.date), time: saidTime(s.time) };
      const li = document.createElement("li");
      const when = document.createElement("span");
      when.textContent = `${s.date === now.date ? "Today" : shortDay(s.date)}, ${saidTime(s.time)}${s.teacher ? ` · ${s.teacher}` : ""}${left === null ? "" : ` · ${placesWords(left)}`}`;
      const a = document.createElement("a");
      a.target = "_blank"; a.rel = "noopener";
      if (left === 0 && pl.waitlist) { a.href = ctx.waHref(waitlistText(pl.waitlist, words)); a.textContent = "Waitlist"; }
      else { a.href = ctx.bookHref(waitlistText(pl.book, words)); a.textContent = left === 0 ? "Full" : "Book"; }
      li.append(when, a);
      return li;
    }) : [Object.assign(document.createElement("li"), { textContent: "Not on the timetable in the next four weeks." })]));
  };
  ctx.watch("places", (p) => { places = p ?? { ok: false }; render(); });
  render();
  ctx.everyMinute(render);
}
