// @ts-check
/** Settling in: dates the nursery's own sessions from the chosen first day; a calendar file and a WhatsApp message. */
import { settlingPlan, dateWords, timeWords, ics, icsStamp, ymdIn } from "../../lib/nursery.js";
import { addDaysYmd as addDays } from "../../../../core/lib/diary.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).nursery.settling;
  const data = /** @type {any} */ (ctx.data).nursery;
  if (!cfg) throw new Error("settling data missing");
  const input = /** @type {HTMLInputElement} */ (root.querySelector("[data-nu-start-day]"));
  const acts = /** @type {HTMLElement} */ (root.querySelector("[data-nu-settle-acts]"));
  const dates = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-nu-ses-date]")]);
  const send = /** @type {HTMLAnchorElement} */ (root.querySelector("[data-nu-settle-send]"));
  const today = ymdIn(Date.now(), ctx.data.hours.timezone);
  input.min = addDays(today, 1);
  /** @type {any[]} */
  let plan = [];
  const paint = () => {
    if (!input.value || input.value <= today) { acts.hidden = true; dates.forEach((d, i) => { d.textContent = `Day ${i + 1}`; }); return; }
    plan = settlingPlan(input.value, cfg.steps, cfg.closed);
    plan.forEach((s, i) => { if (dates[i]) dates[i].textContent = dateWords(s.date); });
    acts.hidden = false;
    send.href = ctx.bookHref(`${cfg.message} we'd like to start on ${dateWords(plan[0].date, "long")}. Settling in: ${plan.map((s) => `${dateWords(s.date)} ${timeWords(s.from)}`).join(", ")}. Does that work?`);
  };
  input.addEventListener("change", paint);
  root.querySelector("[data-nu-settle-ics]")?.addEventListener("click", () => {
    if (!plan.length) return;
    const file = ics({ name: data.name, place: data.place, stamp: icsStamp(Date.now()),
      items: plan.map((s, i) => ({ id: `settling-${i + 1}`, label: `Settling in: ${s.label}`, date: s.date, from: s.from, to: s.to })) });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([file], { type: "text/calendar" })), download: "settling-in.ics" });
    document.body.append(a); a.click(); a.remove();
  });
  paint();
}
