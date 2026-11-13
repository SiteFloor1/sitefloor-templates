// @ts-check
/**
 * The day planner: the date, place and ceremony time rebuild the day's filming timeline (lib/day.js) from the studio's
 * own block lengths, with the portraits in that evening's golden hour (lib/sun.js); the message and the calendar file
 * follow. A date chosen in the date check arrives here too (ctx.watch("wedding")).
 */
import { dayLight } from "../../lib/sun.js";
import { dayPlan, dayText, dayIcs, clampCeremony } from "../../lib/day.js";
import { ukDate, isYmd } from "../../../../core/lib/diary.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).weddingfilm;
  const date = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-dp-date]"));
  const place = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-dp-place]"));
  const time = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-dp-time]"));
  const venue = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-dp-venue]"));
  const note = root.querySelector("[data-dp-note]"), list = root.querySelector("[data-dp-list]"), hours = root.querySelector("[data-dp-hours]");
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-dp-send]")), ics = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-dp-ics]"));
  if (!cfg?.day || !cfg.places || !date || !place || !time || !venue || !note || !list || !hours || !send || !ics) throw new Error("day planner markup missing");
  const more = hours.querySelector("a");
  let url = "";
  const render = () => {
    const ymd = isYmd(date.value) ? date.value : cfg.day.date;
    // Kept between 09:00 and 18:00 (the field says so too); a time outside moves to the nearest end, shown in the field.
    const at = clampCeremony(/^\d{2}:\d{2}$/.test(time.value) ? time.value : cfg.day.ceremony);
    if (time.value !== at) time.value = at;
    const p = cfg.places.find((/** @type {any} */ x) => x.id === place.value) ?? cfg.places[0];
    const plan = dayPlan(at, dayLight(ymd, p.lat, p.lon, p.tz), cfg.day.blocks, cfg.day.portrait);
    note.textContent = plan.portraitNote;
    list.replaceChildren(...plan.moments.map((m) => {
      const li = document.createElement("li");
      li.dataset.id = m.id;
      if (m.light) li.dataset.light = "";
      const t = document.createElement("span"); t.className = "wf-day-time"; t.textContent = m.time;
      const w = document.createElement("span"); w.className = "wf-day-what"; w.textContent = m.label;
      li.append(t, w);
      if (m.note) { const n = document.createElement("span"); n.className = "wf-day-n"; n.textContent = m.note; li.append(n); }
      return li;
    }));
    hours.replaceChildren(`About ${plan.hours} hours of filming.`, ...(more ? [" ", more] : []));
    send.href = ctx.bookHref(dayText(cfg.day.message, { date: ukDate(ymd), place: p.name, venue: venue.value, ceremony: at, moments: plan.moments }));
    if (url) URL.revokeObjectURL(url);
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    url = URL.createObjectURL(new Blob([dayIcs({ date: ymd, tz: p.tz, place: venue.value.trim() || p.name, studio: ctx.data.name, stamp, moments: plan.moments })], { type: "text/calendar" }));
    ics.href = url; ics.download = `wedding-day-${ymd}.ics`; ics.hidden = false;
  };
  for (const el of [date, place, time]) el.addEventListener("change", render);
  venue.addEventListener("input", render);
  ctx.watch("wedding", (/** @type {string} */ ymd) => { if (isYmd(ymd) && ymd !== date.value) { date.value = ymd; render(); } });
  render();
}
