// @ts-check
/**
 * Your twelve weeks (PT-6): the visitor's choices → timeline() (lib) → the weeks drawn, the summary, the message and
 * the calendar file. Starts from the diary's earliest open hour when there is one, otherwise next Monday.
 */
import { timeline, weekdayIndex, sessionsIcs } from "../../lib/trainer.js";
import { addDaysYmd } from "../../../../core/lib/diary.js";
import { longDate } from "../trainer-diary/trainer-diary.js";
import { saveIcs, stamp } from "../trainer-month/ics.js";

const DAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "Mon 7 Dec" @param {string} ymd */
const short = (ymd) => `${DAY[weekdayIndex(ymd)]} ${Number(ymd.slice(8))} ${MON[Number(ymd.slice(5, 7)) - 1]}`;
/** @param {number} n */
const gbp = (n) => `£${n.toLocaleString("en-GB")}`;
const OFTEN = { 1: "once a week", 2: "twice a week", 3: "three times a week" };

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const tr = /** @type {any} */ (ctx.data).trainer, cfg = tr.timeline;
  const q = (/** @type {string} */ s) => /** @type {HTMLElement} */ (root.querySelector(s));
  const nGroup = q("[data-ttl-n]"), sum = q("[data-ttl-sum]");
  const date = /** @type {HTMLInputElement} */ (q("[data-ttl-date]")), time = /** @type {HTMLSelectElement} */ (q("[data-ttl-time]"));
  const ics = /** @type {HTMLButtonElement} */ (q("[data-ttl-ics]")), go = /** @type {HTMLAnchorElement} */ (q("[data-ttl-go]"));
  if (!nGroup || !date || !time || !go) throw new Error("timeline markup missing");
  const today = ctx.now().date;
  date.min = addDaysYmd(today, 1);
  const monday = addDaysYmd(today, 7 - weekdayIndex(today));
  date.value = monday;
  let per = Number(/** @type {HTMLElement|null} */ (nGroup.querySelector('[aria-pressed="true"]'))?.dataset.n ?? 2);
  let touched = false;
  /** @type {ReturnType<typeof timeline>|null} */
  let plan = null;

  const paint = () => {
    nGroup.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.n) === per)));
    const start = date.value && date.value > today ? date.value : monday;
    plan = timeline({ start, perWeek: per, postcode: cfg.postcode, closed: cfg.closed, phases: cfg.phases });
    for (const w of plan.weeks) {
      const ul = root.querySelector(`[data-ttl-week="${w.n}"]`);
      if (ul) ul.innerHTML = w.sessions.map((s) => s.holiday ? `<li class="off"><s>${short(s.date)}</s><small>closed</small></li>` : `<li>${short(s.date)}</li>`).join("");
    }
    const each = cfg.session[String(per)] ?? 0;
    const n = plan.booked.length;
    const off = plan.holidays.length ? ` ${plan.holidays.map(short).join(", ")} left out (bank holiday or closed).` : "";
    sum.innerHTML = `<b>${n} sessions</b>, ${OFTEN[/** @type {1|2|3} */ (per)]} at ${time.value}, ${short(plan.booked[0] ?? start)} to ${short(plan.finish)}. <b>${gbp(n * each)}</b> at ${gbp(each)} a session, paid as you go.${off}`;
    ics.hidden = !n;
    const text = `${cfg.message} ${OFTEN[/** @type {1|2|3} */ (per)]} at ${time.value}, starting ${longDate(plan.booked[0] ?? start)}: ${n} sessions to ${longDate(plan.finish)}.`;
    go.href = ctx.bookHref(text);
    if (go.dataset.waText !== undefined) go.dataset.waText = text;
  };

  nGroup.addEventListener("click", (e) => { const b = /** @type {HTMLElement} */ (e.target).closest("button"); if (!b) return; per = Number(b.dataset.n); paint(); });
  date.addEventListener("change", () => { touched = true; paint(); });
  time.addEventListener("change", () => { touched = true; paint(); });
  ics.addEventListener("click", () => {
    if (!plan) return;
    const sessions = plan.booked.map((d, i) => ({ date: d, time: time.value, title: `Session ${i + 1} of ${plan?.booked.length} · ${tr.name}` }));
    saveIcs(sessionsIcs({ sessions, minutes: cfg.minutes, name: tr.name, place: tr.place, tz: ctx.data.hours.timezone, stamp: stamp() }), "twelve-weeks.ics");
  });
  // Start from the diary's first open hour, until the visitor picks their own.
  ctx.watch("diary", (/** @type {any} */ d) => {
    const first = d?.ok && d.open.length ? d.open[0] : null;
    if (!first || touched) return;
    date.value = first.date;
    if ([...time.options].some((o) => o.value === first.time)) time.value = first.time;
    paint();
  });
  paint();
}
