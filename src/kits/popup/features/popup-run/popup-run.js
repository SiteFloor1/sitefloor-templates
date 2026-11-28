// @ts-check
/**
 * The run: works out the brand's stop for the visitor's day, fills the dates, the days left and the live line, keeps
 * the line current every minute, and makes the calendar file on the click. (Every page's open/closed chip already
 * counts only the stops' days: kit.js pageData, lib/popup.js runHours.)
 */
import { resolveStops, currentStop, runLine, stopState, stateWords, shortDate, stopIcs, slug, mapsHref } from "../../lib/popup.js";

/** @param {string} name @param {string} body */
export function download(name, body) {
  const url = URL.createObjectURL(new Blob([body], { type: "text/calendar" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data);
  const today = ctx.now().date;
  const stops = resolveStops(data.popup, today);
  const s = currentStop(stops, today);
  if (!s) return;
  /** @param {string} q @param {string} t */
  const set = (q, t) => { const el = root.querySelector(q); if (el) el.textContent = t; };
  set("[data-run-start]", shortDate(s.start));
  set("[data-run-end]", shortDate(s.end));
  set("[data-run-place]", `${s.place}, ${s.area}`);
  set("[data-run-left]", stateWords(stopState(s, today), s));
  const map = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-run-map]"));
  if (map) map.href = mapsHref(s);

  const paint = () => set("[data-run-line]", runLine(data.hours, s, ctx.now()));
  paint();
  ctx.everyMinute(paint);
  root.querySelector("[data-run-ics]")?.addEventListener("click", () => download(`${slug(data.name)}-${s.id}.ics`, stopIcs(s, data.name, Date.now())));
  ctx.share("popupStops", { stops, current: s });
}
