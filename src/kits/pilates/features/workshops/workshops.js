// @ts-check
/** Workshops: hide finished ones; each one into the phone's calendar at the studio's time, in one tap. */
import { workshopIcs } from "../../lib/members.js";
import { toMinutes } from "../../../../core/lib/hours.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data);
  const none = /** @type {HTMLElement|null} */ (root.querySelector("[data-ws-none]"));
  if (!none) throw new Error("workshops markup missing");
  const items = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-ws]")]);
  const tidy = () => {
    const now = ctx.now();
    let left = 0;
    for (const li of items) {
      const d = li.dataset.date ?? "", done = d < now.date || (d === now.date && toMinutes(li.dataset.to ?? "00:00") <= now.minutes);
      li.hidden = done;
      if (!done) left++;
    }
    none.hidden = left > 0;
  };
  root.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement} */ (e.target).closest("[data-ws-ics]");
    const li = /** @type {HTMLElement|null} */ (b?.closest("[data-ws]") ?? null);
    if (!li) return;
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const file = workshopIcs({ id: li.dataset.ws ?? "", title: li.dataset.title ?? "", date: li.dataset.date ?? "", from: li.dataset.from ?? "", to: li.dataset.to ?? "", studio: data.name, place: data.pilates.place, tz: data.hours.timezone, stamp });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([file], { type: "text/calendar" }));
    a.download = `${li.dataset.ws}.ics`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  });
  tidy();
  ctx.everyMinute(tidy);
}
