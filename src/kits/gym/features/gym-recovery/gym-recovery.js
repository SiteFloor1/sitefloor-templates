// @ts-check
/** Heat and cold: the visitor's next four slots (today, then tomorrow), with places left only while fresh. */
import { zonedNow, toMinutes, DAY_KEYS } from "../../../../core/lib/hours.js";
import { addDaysYmd } from "../../../../core/lib/diary.js";
import { placesWords } from "../../lib/gym.js";

/** @param {string} s */
const esc = (s) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const g = /** @type {any} */ (ctx.data).gym, list = root.querySelector("[data-gr-list]");
  if (!g.recovery || !list) return;
  /** @type {any} */
  let places = { ok: false };
  const paint = () => {
    const now = zonedNow(new Date(), ctx.data.hours.timezone);
    /** @type {{ date: string, time: string, s: any }[]} */
    const next = [];
    for (let i = 0; i < 2 && next.length < 4; i++) {
      const date = addDaysYmd(now.date, i), day = DAY_KEYS[(now.weekday + i) % 7];
      const closed = (ctx.data.hours.exceptions ?? []).some((/** @type {any} */ e) => e.date === date && !e.ranges.length);
      if (closed) continue;
      g.recovery.filter((/** @type {any} */ s) => s.days.includes(day))
        .flatMap((/** @type {any} */ s) => s.times.map((/** @type {string} */ time) => ({ date, time, s })))
        .filter((/** @type {any} */ x) => i > 0 || toMinutes(x.time) > now.minutes)
        .sort((/** @type {any} */ a, /** @type {any} */ b) => (a.time < b.time ? -1 : 1))
        .forEach((/** @type {any} */ x) => { if (next.length < 4) next.push(x); });
    }
    list.innerHTML = next.map(({ date, time, s }) => {
      const key = `${date} ${time} ${s.id}`, n = places.ok ? places.left[key] : undefined;
      return `<li class="gr-s" data-key="${esc(key)}"><time>${i18nDay(date, now.date)}${time}</time><div><p class="gr-n">${esc(s.name)}</p><p>${s.minutes} minutes${s.with ? `, with ${esc(s.with)}` : ""}</p></div>`
        + `<span class="gr-left" data-left${n === undefined ? " hidden" : ""}>${n === undefined ? "" : placesWords(n)}</span>`
        + `<a class="gy-book" href="${esc(s.url || g.app.url)}" target="_blank" rel="noopener">Book in the app</a></li>`;
    }).join("");
  };
  ctx.watch("gymPlaces", (/** @type {any} */ p) => { places = p?.ok ? p : { ok: false }; paint(); });
  paint();
  ctx.everyMinute(paint);
}

/** "Tomorrow " before a time that isn't today. @param {string} date @param {string} today */
function i18nDay(date, today) { return date === today ? "" : '<span class="gr-tm">Tomorrow</span> '; }
