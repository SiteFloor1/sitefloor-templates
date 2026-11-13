// @ts-check
/** The skin test: the colour day gives the last day for the test (the salon's hours before), to the calendar or WhatsApp. */
import { dateField } from "../../partials/date-field.js";
import { saveIcs } from "../../partials/save-ics.js";
import { skinTestDay, eventsIcs, icsStamp, bookText } from "../../lib/hair.js";
import { ukDate } from "../../../../core/lib/diary.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), hours = data.skinTest?.hoursBefore;
  const field = root.querySelector("[data-date-field]"), out = root.querySelector("[data-sk-out]");
  const ics = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-sk-ics]")), send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-sk-send]"));
  if (!hours || !field || !out || !ics || !send) throw new Error("skin-test markup missing");
  const date = dateField(field), opening = send.href;
  let test = "";
  const render = () => {
    const colour = date.get(), today = ctx.now().date;
    test = colour ? skinTestDay(colour, hours) : "";
    const late = Boolean(test) && test < today;
    out.textContent = !colour ? "Choose the day of your colour."
      : colour < today ? "That day has passed."
      : late ? `The test needed to be by ${ukDate(test)}. Message us and we'll find a new colour day.`
      : `Walk in for your skin test by ${ukDate(test)}.`;
    ics.hidden = !test || late || colour < today;
    send.href = colour && colour >= today ? ctx.bookHref(bookText(data.skinTest.message, { extra: [`My colour is on ${ukDate(colour)}. I'll come in for a skin test by ${ukDate(test)}.`] })) : opening;
  };
  ics.addEventListener("click", () => {
    if (!test) return;
    saveIcs(eventsIcs({ salon: data.name, place: data.place, stamp: icsStamp(), events: [{ id: "skin-test", date: test, title: "Skin test", note: `Walk in any time the salon is open, at least ${hours} hours before your colour.` }] }), "skin-test");
  });
  date.on(render);
  render();
}
