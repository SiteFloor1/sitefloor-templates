// @ts-check
/**
 * The wedding-day light: the date and place in the sentence change everything under it (sunset, golden and blue
 * hour, the day line, the portrait window, the message and the calendar file), worked out in the browser for that
 * day and place. A date chosen in the date check arrives here too (ctx.watch("wedding")).
 */
import { dayLight, portraitWindow, along, lightIcs, lightText } from "../../lib/sun.js";
import { ukDate, isYmd } from "../../../../core/lib/diary.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).weddingfilm;
  const date = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-lp-date]"));
  const place = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-lp-place]"));
  const dateText = root.querySelector("[data-lp-date-text]"), placeText = root.querySelector("[data-lp-place-text]");
  const set = root.querySelector("[data-lp-set]"), facts = root.querySelector("[data-lp-facts]"), track = root.querySelector("[data-lp-track]");
  const advice = root.querySelector("[data-lp-advice]");
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-lp-send]")), ics = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-lp-ics]"));
  if (!cfg?.planner || !cfg.places || !date || !place || !dateText || !placeText || !set || !facts || !track || !send || !ics) throw new Error("light planner markup missing");
  // Tapping the words opens the date picker where the browser can.
  date.addEventListener("click", () => { try { date.showPicker(); } catch { /* the native control opens anyway */ } });
  let url = "";

  const render = () => {
    const ymd = isYmd(date.value) ? date.value : cfg.planner.date;
    const p = cfg.places.find((/** @type {any} */ x) => x.id === place.value) ?? cfg.places[0];
    const l = dayLight(ymd, p.lat, p.lon, p.tz);
    const w = cfg.planner.portrait ? portraitWindow(l, cfg.planner.portrait.start, cfg.planner.portrait.length) : null;
    dateText.textContent = ukDate(ymd);
    placeText.textContent = p.name;
    set.textContent = l.sunset ?? "—";
    track.replaceChildren();
    if (!l.sunset || !l.goldenFrom || !l.goldenTo) {
      facts.textContent = "The sun doesn't set in the usual way there on that date. Send it to us and we'll plan it with you.";
      if (advice) advice.textContent = "";
    } else {
      facts.replaceChildren(`Golden hour ${l.goldenFrom} to ${l.goldenTo}`, Object.assign(document.createElement("span"), { textContent: l.blueTo ? `, then blue hour until ${l.blueTo}.` : "." }));
      const mark = (/** @type {string} */ cls, /** @type {string} */ from, /** @type {string} */ to) => { const s = document.createElement("span"); s.className = cls; s.style.left = `${along(from)}%`; s.style.width = `${along(to) - along(from)}%`; track.append(s); };
      const tick = (/** @type {string} */ t, /** @type {string} */ label, /** @type {string} */ cls) => {
        const k = document.createElement("span"); k.className = "wf-tick"; k.style.left = `${along(t)}%`;
        const b = document.createElement("span"); b.className = `wf-lbl ${cls}`; b.style.left = `${along(t)}%`; b.textContent = `${label} ${t}`;
        track.append(k, b);
      };
      mark("wf-band", l.goldenFrom, l.goldenTo);
      if (l.blueTo) mark("wf-band wf-blue", l.goldenTo, l.blueTo);
      if (l.sunrise) tick(l.sunrise, "Sunrise", "wf-minor");
      tick(l.sunset, "Sunset", "");
      if (advice) advice.textContent = w ? `We keep ${w.from} to ${w.to} free for your portraits.` : "";
    }
    send.href = ctx.bookHref(lightText(cfg.planner.message, { date: ukDate(ymd), placeName: p.name, light: l, portrait: w }));
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const file = lightIcs({ date: ymd, placeName: p.name, tz: p.tz, light: l, portrait: w, studio: ctx.data.name, stamp });
    if (url) URL.revokeObjectURL(url);
    url = "";
    ics.hidden = !file;
    if (file) { url = URL.createObjectURL(new Blob([file], { type: "text/calendar" })); ics.href = url; ics.download = `golden-hour-${ymd}.ics`; }
  };
  date.addEventListener("change", render);
  place.addEventListener("change", render);
  ctx.watch("wedding", (/** @type {string} */ ymd) => { if (isYmd(ymd) && ymd !== date.value) { date.value = ymd; render(); } });
  render();
}
