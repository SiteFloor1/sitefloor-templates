// @ts-check
/**
 * Your first month: reads the diary's earliest open hour (shared as "diary") and the visitor's choices, then sets out
 * the dates, the cost, the WhatsApp message and the calendar file, all from the trainer's own prices.
 */
import { firstMonth, sessionsIcs } from "../../lib/trainer.js";
import { longDate, tab } from "../trainer-diary/trainer-diary.js";
import { saveIcs, stamp } from "./ics.js";

const SHORT_DAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SHORT_MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "Wed, 18 Nov" @param {string} ymd */
const shortDate = (ymd) => { const [y, m, d] = ymd.split("-").map(Number); return `${SHORT_DAY[(new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7]}, ${d} ${SHORT_MON[m - 1]}`; };
/** @param {number} n */
const gbp = (n) => `£${n.toLocaleString("en-GB")}`;
const OFTEN_WORDS = { 1: "once a week", 2: "twice a week", 3: "three times a week" };

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const tr = /** @type {any} */ (ctx.data).trainer, cfg = tr.month;
  const q = (/** @type {string} */ s) => /** @type {HTMLElement} */ (root.querySelector(s));
  const where = q("[data-tm-where]"), often = q("[data-tm-often]"), when = q("[data-tm-when]"), placeText = q("[data-tm-place]");
  const then = q("[data-tm-then]"), count = q("[data-tm-count]"), list = q("[data-tm-dates]"), cost = q("[data-tm-cost]"), total = q("[data-tm-total]");
  const ics = /** @type {HTMLButtonElement} */ (q("[data-tm-ics]")), go = /** @type {HTMLAnchorElement} */ (q("[data-tm-go]"));
  if (!where || !often || !cost || !go) throw new Error("first month markup missing");
  const fixed = [...cost.querySelectorAll("li")].slice(1).map((li) => li.outerHTML).join("");
  let place = cfg.places[0];
  let per = Number(/** @type {HTMLElement|null} */ (often.querySelector('[aria-pressed="true"]'))?.dataset.n ?? cfg.often[0].perWeek);
  /** @type {{ date: string, time: string }|null} */
  let first = null;
  /** @type {ReturnType<typeof firstMonth>|null} */
  let plan = null;

  const paint = () => {
    where.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === place.id)));
    often.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.n) === per)));
    placeText.textContent = place.text;
    const prices = cfg.prices, travel = place.away ? prices.travel ?? 0 : 0;
    const each = (prices.session[String(per)] ?? 0) + travel;
    const lines = [
      `<li><span>The first session</span><b>${gbp(prices.first + travel)}</b></li>`,
      `<li><span>Then, ${OFTEN_WORDS[/** @type {1|2|3} */ (per)]}</span><b>${gbp(each)} a session</b></li>`,
      travel ? "<li><span>Coming to you</span><b>travel included</b></li>" : "",
    ];
    cost.innerHTML = lines.join("") + fixed;
    plan = first ? firstMonth(first, per, prices, !!place.away) : null;
    then.hidden = !plan;
    ics.hidden = !plan;
    if (plan && first) {
      when.innerHTML = `${shortDate(first.date)}, ${tab(first.time)} · one hour`;
      count.textContent = `${plan.dates.length} more in the four weeks after`;
      list.innerHTML = plan.dates.map((d) => `<li>${shortDate(d)} · ${tab(/** @type {any} */ (first).time)}</li>`).join("");
      total.innerHTML = `${gbp(plan.total)}<small>for the first month, ${plan.sessions} sessions, paid as you go</small>`;
      const text = `${cfg.message} ${longDate(first.date)} at ${first.time}, ${place.away ? "at my home" : "at the studio"}, then ${OFTEN_WORDS[/** @type {1|2|3} */ (per)]}.`;
      go.href = ctx.bookHref(text);
      if (go.dataset.waText !== undefined) go.dataset.waText = text;
    } else {
      when.textContent = "";
      total.innerHTML = `${gbp(each)}<small>a session, ${OFTEN_WORDS[/** @type {1|2|3} */ (per)]}, once we've agreed the first hour</small>`;
      go.href = ctx.bookHref(cfg.message);
    }
  };

  where.addEventListener("click", (e) => { const b = /** @type {HTMLElement} */ (e.target).closest("button"); if (!b) return; place = cfg.places.find((/** @type {any} */ p) => p.id === b.dataset.id) ?? place; paint(); });
  often.addEventListener("click", (e) => { const b = /** @type {HTMLElement} */ (e.target).closest("button"); if (!b) return; per = Number(b.dataset.n); paint(); });
  ics.addEventListener("click", () => {
    if (!plan || !first) return;
    const sessions = [{ date: first.date, time: first.time, title: `First session · ${tr.name}` }, ...plan.dates.map((d) => ({ date: d, time: /** @type {any} */ (first).time, title: `Session · ${tr.name}` }))];
    saveIcs(sessionsIcs({ sessions, minutes: tr.diary?.minutes ?? 60, name: tr.name, place: place.away ? "At home" : tr.place, tz: ctx.data.hours.timezone, stamp: stamp() }), "first-month.ics");
  });
  ctx.watch("diary", (/** @type {any} */ d) => { first = d?.ok && d.open.length ? d.open[0] : null; paint(); });
  paint();
}
