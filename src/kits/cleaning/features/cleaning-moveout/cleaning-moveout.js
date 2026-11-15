// @ts-check
/** The move-out planner: check-out date → the clean and the day to book by (src/kits/cleaning/lib/plan.js). */
import { moveOut, cleanIcs, icsStamp } from "../../lib/plan.js";
import { ukDate } from "../../../../core/lib/diary.js";
import { saveIcs } from "../cleaning-schedule/save.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), cfg = data.cleaning?.tenancy;
  const q = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  const input = /** @type {HTMLInputElement|null} */ (q("[data-mo-date]")), out = q("[data-mo-out]"), clean = q("[data-mo-clean]"), book = q("[data-mo-book]"), note = q("[data-mo-note]");
  const ics = /** @type {HTMLButtonElement|null} */ (q("[data-mo-ics]")), send = /** @type {HTMLAnchorElement|null} */ (q("[data-mo-send]"));
  if (!cfg || !input || !out || !clean || !book || !note || !ics || !send) throw new Error("move-out planner markup or config missing");
  const plain = note.textContent ?? "";
  input.min = ctx.now().date;
  const render = () => {
    const day = input.value;
    if (!day) { out.hidden = ics.hidden = send.hidden = true; note.textContent = plain; return; }
    const m = moveOut(day, ctx.now().date, cfg);
    out.hidden = false; clean.textContent = ukDate(m.clean); book.textContent = ukDate(m.bookBy);
    note.textContent = m.past ? "That's too soon for us to fit in. Message us anyway: we'll say honestly if we can." : m.late ? "The usual book-by day has passed. Message us and we'll tell you what we can do." : m.daysLeft === 0 ? "Book today." : `${m.daysLeft} ${m.daysLeft === 1 ? "day" : "days"} to book.`;
    ics.hidden = send.hidden = m.past;
    send.href = ctx.bookHref([cfg.message, "", `Check-out: ${ukDate(day)}`, `Clean: ${ukDate(m.clean)}`].join("\n"));
  };
  input.addEventListener("change", render);
  ics.addEventListener("click", () => {
    if (!input.value) return;
    const m = moveOut(input.value, ctx.now().date, cfg);
    saveIcs(cleanIcs({ date: m.clean, start: 9 * 60, minutes: 0, every: 0, title: `End-of-tenancy clean · ${data.name}`, place: "", business: data.name, stamp: icsStamp(new Date()), note: `Book by ${ukDate(m.bookBy)}` }), `move-out-clean-${m.clean}.ics`);
  });
}
