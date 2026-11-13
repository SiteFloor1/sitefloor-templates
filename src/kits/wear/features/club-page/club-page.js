// @ts-check
/** Run club page: the next date of each run, and that run as a calendar file (times in UTC). */
import { nextRunDate, runIcs } from "../../lib/club.js";

/** @param {HTMLElement} root @param {import("../../../../core/js/core.js").Ctx} ctx */
export function init(root, ctx) {
  const tz = root.dataset.tz ?? "Europe/London";
  const paint = () => {
    for (const art of /** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll("[data-run]"))) {
      let run;
      try { run = JSON.parse(art.dataset.run ?? ""); } catch { continue; }
      const date = nextRunDate(run, Date.now(), tz);
      const next = art.querySelector("[data-next]");
      if (next) next.textContent = `Next: ${new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}.`;
      const btn = /** @type {HTMLButtonElement|null} */ (art.querySelector("[data-ics]"));
      if (!btn) continue;
      btn.hidden = false;
      btn.onclick = () => {
        const ics = runIcs({ run, date, place: root.dataset.place ?? "", business: root.dataset.business ?? "", timeZone: tz, stamp: new Date() });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
        a.download = `${run.id}-${date}.ics`;
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      };
    }
  };
  paint();
  ctx.everyMinute(paint);
}
