// @ts-check
/**
 * The gown diary: the last day to order first, then every step's date from the wedding date (steps already past
 * marked), how long is left, the whole diary as a calendar file (all-day events, so no time zone can move them) and
 * as a WhatsApp message. The date is chosen in a sheet and shared with the appointment request.
 */
import { diaryDates, diaryStatus, diaryIcs, ukDate } from "../../../../core/lib/diary.js";
import { weddingField } from "../../partials/date-field.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), cfg = data.diary;
  const q = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  const list = q("[data-gd-steps]"), away = q("[data-gd-away]"), late = q("[data-gd-late]"), dayCell = q("[data-gd-day]"), orderLine = q("[data-gd-order]");
  const ics = /** @type {HTMLButtonElement|null} */ (q("[data-gd-ics]")), send = /** @type {HTMLAnchorElement|null} */ (q("[data-gd-send]"));
  const pick = /** @type {HTMLButtonElement|null} */ (q("[data-gd-pick]")), sheet = /** @type {HTMLDialogElement|null} */ (q("[data-gd-sheet]"));
  const order = cfg?.steps.find((/** @type {any} */ s) => s.id === cfg.orderStep);
  if (!cfg || !list || !away || !late || !dayCell || !orderLine || !ics || !send || !pick || !sheet || !order || typeof sheet.showModal !== "function") throw new Error("gown diary markup missing");
  const plain = new Map([...list.querySelectorAll("[data-step]")].map((li) => [/** @type {HTMLElement} */ (li).dataset.step, li.querySelector("[data-when]")?.textContent ?? ""]));
  const plainOrder = orderLine.textContent;
  let wedding = "";

  /** @param {ReturnType<typeof diaryStatus>|null} st */
  const orderWords = (st) => (!st ? plainOrder : st.passed ? "That date has passed. Choose your wedding date."
    : st.late ? `${order.label} by ${ukDate(st.orderDate)}. That day has passed.` : `${order.label} by ${ukDate(st.orderDate)}.`);
  /** @param {ReturnType<typeof diaryStatus>} st */
  const awayWords = (st) => `${ukDate(wedding)} · ${st.weeks >= 1 ? `${st.weeks} ${st.weeks === 1 ? "week" : "weeks"} to go` : st.days === 0 ? "today" : `${st.days} ${st.days === 1 ? "day" : "days"} to go`}`;

  const render = () => {
    const today = ctx.now().date;
    const st = wedding ? diaryStatus(wedding, today, order.weeksBefore) : null;
    const ok = Boolean(st && !st.passed);
    const dates = ok ? diaryDates(wedding, cfg.steps, today) : [];
    for (const li of list.querySelectorAll("[data-step]")) {
      const el = /** @type {HTMLElement} */ (li), d = dates.find((x) => x.id === el.dataset.step);
      const when = el.querySelector("[data-when]");
      if (when) when.textContent = d ? ukDate(d.date) : plain.get(el.dataset.step) ?? "";
      el.toggleAttribute("data-past", Boolean(d?.past));
    }
    dayCell.textContent = ok ? ukDate(wedding) : "The day";
    orderLine.textContent = orderWords(st);
    away.hidden = !ok;
    if (st && ok) away.textContent = awayWords(st);
    late.hidden = !(st && st.late);
    pick.textContent = ok ? "Change the date" : "Choose your wedding date";
    ics.hidden = !ok;
    send.hidden = !ok;
    if (ok) send.href = ctx.bookHref([data.messages.general, "", `Wedding: ${ukDate(wedding)}`,
      ...dates.filter((d) => !d.past).map((d) => `${d.label}: ${ukDate(d.date)}`)].join("\n"));
  };

  pick.addEventListener("click", () => sheet.showModal());
  sheet.addEventListener("click", (e) => { if (e.target === sheet) sheet.close(); });
  sheet.addEventListener("close", () => pick.focus());
  ics.addEventListener("click", () => {
    if (!wedding) return;
    const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const file = diaryIcs({ wedding, dates: diaryDates(wedding, cfg.steps, ctx.now().date), salon: data.name, place: data.place, stamp: now });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([file], { type: "text/calendar" }));
    a.download = `gown-diary-${wedding}.ics`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  });
  weddingField(root, ctx, (ymd) => { wedding = ymd; render(); });
  render();
}
