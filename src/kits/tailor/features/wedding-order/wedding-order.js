// @ts-check
/**
 * The wedding order-by: from one date, the last day to start, every step's date (steps already past marked), and the
 * whole list as a calendar file (all-day events, so no time zone can move them) and as a WhatsApp message.
 */
import { diaryDates, diaryStatus, diaryIcs, ukDate } from "../../../../core/lib/diary.js";
import { dateField } from "../../partials/date-field.js";
import { partyExtraWeeks, partySteps, partyText, withReminders } from "../../lib/tailor.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), cfg = data.weddingOrder;
  const q = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  const list = q("[data-wo-steps]"), first = q("[data-wo-first]"), late = q("[data-wo-late]"), day = q("[data-wo-day]");
  const ics = /** @type {HTMLButtonElement|null} */ (q("[data-wo-ics]")), send = /** @type {HTMLAnchorElement|null} */ (q("[data-wo-send]"));
  const start = cfg?.steps.find((/** @type {any} */ s) => s.id === cfg.orderStep);
  if (!cfg || !list || !first || !late || !day || !ics || !send || !start) throw new Error("wedding order markup missing");
  const plain = new Map([...list.querySelectorAll("[data-step]")].map((li) => [/** @type {HTMLElement} */ (li).dataset.step, li.querySelector("[data-when]")?.textContent ?? ""]));
  const plainFirst = first.textContent;
  const sizeSel = /** @type {HTMLSelectElement|null} */ (q("[data-wo-size]")), partyNote = q("[data-wo-party-note]");
  const size = () => Number(sizeSel?.value ?? 1);
  const cloth = () => /** @type {HTMLInputElement|null} */ (root.querySelector("input[name=wo-cloth]:checked"))?.value ?? "";
  const stepsNow = () => {
    const extra = cfg.party ? partyExtraWeeks(size(), cfg.party.rules) : 0;
    return { extra, steps: /** @type {import("../../../../core/lib/diary.js").DiaryStep[]} */ (partySteps(cfg.steps, cfg.orderStep, extra)) };
  };
  let wedding = "";
  /** @param {number} extra */
  const noteParty = (extra) => {
    if (!partyNote) return;
    partyNote.hidden = !extra;
    partyNote.textContent = extra ? `For ${size()} of you we start ${extra} ${extra === 1 ? "week" : "weeks"} earlier, to measure and cut everyone.` : "";
  };
  /** @param {ReturnType<typeof diaryStatus>|null} st */
  const firstWords = (st) => (!st ? plainFirst : st.passed ? "That date has passed."
    : st.late ? `${start.label} by ${ukDate(st.orderDate)}. That day has passed.` : `${start.label} by ${ukDate(st.orderDate)}.`);
  const render = () => {
    const today = ctx.now().date;
    const { extra, steps } = stepsNow();
    const startWeeks = start.weeksBefore + extra;
    const st = wedding ? diaryStatus(wedding, today, startWeeks) : null;
    const ok = Boolean(st && !st.passed);
    const dates = ok ? diaryDates(wedding, steps, today) : [];
    noteParty(extra);
    for (const li of /** @type {NodeListOf<HTMLElement>} */ (list.querySelectorAll("[data-step]"))) {
      const d = dates.find((x) => x.id === li.dataset.step), when = li.querySelector("[data-when]");
      if (when) when.textContent = d ? ukDate(d.date) : plain.get(li.dataset.step) ?? "";
      li.toggleAttribute("data-past", Boolean(d?.past));
    }
    day.textContent = ok ? ukDate(wedding) : "The day";
    first.textContent = firstWords(st);
    late.hidden = !(st && st.late && !st.passed);
    ics.hidden = !ok; send.hidden = !ok;
    const remind = root.querySelector("[data-wo-remind]");
    if (remind) /** @type {HTMLElement} */ (remind).hidden = !ok;
    if (ok) send.href = ctx.bookHref(partyText(data.garments?.message ?? data.messages.general, {
      wedding, size: size(), cloth: cloth(), lines: dates.filter((d) => !d.past).map((d) => `${d.label}: ${ukDate(d.date)}`),
    }));
  };
  ics.addEventListener("click", () => {
    if (!wedding) return;
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const plain = diaryIcs({ wedding, dates: diaryDates(wedding, stepsNow().steps, ctx.now().date), salon: data.name, place: data.place, stamp, title: "wedding party" });
    const r = cfg.reminder;
    const file = r ? withReminders(plain, r.steps, r, data.name) : plain;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([file], { type: "text/calendar" }));
    a.download = `wedding-party-${wedding}.ics`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  });
  dateField(root, (ymd) => { wedding = ymd; render(); });
  sizeSel?.addEventListener("change", render);
  root.querySelector(".tl-wo-cloth")?.addEventListener("change", render);
  render();
}
