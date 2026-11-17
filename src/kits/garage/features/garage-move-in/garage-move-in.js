// @ts-check
/**
 * Moving in: the client's steps, dated from the visitor's first day, as a calendar file made here in the browser.
 * Nothing leaves the page.
 */
import { moveInEvents, dayWords, icsFile } from "../../lib/garage.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data);
  const input = /** @type {HTMLInputElement|null} */ (root.querySelector("#mi-start"));
  const list = root.querySelector("[data-mi-steps]"), link = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-mi-ics]"));
  if (!data.moveIn || !input || !list || !link) return;
  const today = ctx.now().date;
  input.min = today;
  if (!input.value) input.value = today;
  let url = "";
  const draw = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.value)) return;
    const ev = moveInEvents(input.value, data.moveIn);
    list.replaceChildren(...ev.map((e) => {
      const li = document.createElement("li"), w = document.createElement("span");
      w.className = "gm-when"; w.textContent = dayWords(e.date);
      li.append(w, " ", e.title);
      return li;
    }));
    if (url) URL.revokeObjectURL(url);
    const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
    url = URL.createObjectURL(new Blob([icsFile(data.name, ev, stamp)], { type: "text/calendar" }));
    link.href = url;
    link.hidden = false;
  };
  input.addEventListener("change", draw);
  draw();
}
