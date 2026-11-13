// @ts-check
/** Will review reminder: any tick → review now; none → a calendar reminder in the firm's chosen number of years. */
import { addDaysYmd, remindersIcs } from "../../lib/matter.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const evs = /** @type {HTMLInputElement[]} */ ([...root.querySelectorAll("[data-wr-ev]")]);
  const yes = /** @type {HTMLElement|null} */ (root.querySelector("[data-wr-yes]"));
  const no = /** @type {HTMLElement|null} */ (root.querySelector("[data-wr-no]"));
  if (!evs.length || !yes || !no) throw new Error("will reminder markup missing");
  const sync = () => { const any = evs.some((e) => e.checked); yes.hidden = !any; no.hidden = any; };
  for (const e of evs) e.addEventListener("change", sync);
  root.querySelector("[data-wr-ics]")?.addEventListener("click", () => {
    const years = Number(root.dataset.years ?? 3);
    const date = addDaysYmd(ctx.now().date, Math.round(years * 365.25));
    const ics = remindersIcs([{ id: "will-review", date, title: `Review my will (${ctx.data.name})`, text: "Has anything changed: a marriage, a child, a house, a business, a move abroad?" }], "WillReminder", new Date());
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "review-my-will.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  sync();
  root.setAttribute("data-ready", "");
}
