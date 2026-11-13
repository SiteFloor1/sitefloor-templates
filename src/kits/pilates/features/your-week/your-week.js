// @ts-check
/**
 * Your week: the classes ticked in the timetable become one calendar file (.ics), each at the studio's time, with
 * the studio's address. Nothing is booked by this; the file is for the visitor's own calendar.
 */
import { weekIcs } from "../../lib/classes.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data);
  const section = root.closest("section"), count = root.querySelector("[data-yw-count]");
  const add = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-yw-add]"));
  if (!section || !count || !add) throw new Error("your week markup missing");
  const plain = count.textContent;
  const ticked = () => /** @type {HTMLInputElement[]} */ ([...section.querySelectorAll("[data-yw-pick]:checked")]);
  const update = () => {
    const n = ticked().length;
    count.textContent = n ? `${n} ${n === 1 ? "class" : "classes"} ticked.` : plain;
    add.disabled = n === 0;
  };
  section.addEventListener("change", (e) => { if (/** @type {HTMLElement} */ (e.target).matches("[data-yw-pick]")) update(); });
  section.addEventListener("tt:drawn", update);
  add.addEventListener("click", () => {
    const items = ticked().map((b) => ({ date: b.dataset.date ?? "", time: b.dataset.time ?? "", name: b.dataset.name ?? "", minutes: Number(b.dataset.minutes) || 50 }));
    if (!items.length) return;
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const file = weekIcs({ items, studio: data.name, place: data.pilates.place, tz: data.hours.timezone, stamp });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([file], { type: "text/calendar" }));
    a.download = `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-classes.ics`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  });
  update();
}
