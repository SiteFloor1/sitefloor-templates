// @ts-check
/**
 * The run: works out the brand's stop for the visitor's day, fills the dates, the days left and the live line, keeps
 * the line current every minute, and makes the calendar file on the click. Outside the run the shop is closed whatever
 * its usual week says, so the header's open/closed chip is told so too.
 */
import { resolveStops, currentStop, runLine, stopState, stateWords, shortDate, stopIcs, slug, mapsHref } from "../../lib/popup.js";
import { openStatus, statusLabel } from "../../../../core/lib/hours.js";

const CLOSED = { sun: [], mon: [], tue: [], wed: [], thu: [], fri: [], sat: [] };

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

  const paint = () => {
    const now = ctx.now();
    set("[data-run-line]", runLine(data.hours, s, now));
    if (stopState(s, now.date).kind !== "on" && data.hours.weekly !== CLOSED) {
      data.hours = { ...data.hours, weekly: CLOSED, exceptions: [] };
      const label = statusLabel(openStatus(data.hours, now), now);
      for (const el of document.querySelectorAll("[data-live-status]")) {
        el.classList.add("is-closed");
        const t = el.querySelector("[data-status-text]");
        if (t) t.textContent = label;
      }
    }
  };
  paint();
  ctx.everyMinute(paint);
  root.querySelector("[data-run-ics]")?.addEventListener("click", () => download(`${slug(data.name)}-${s.id}.ics`, stopIcs(s, data.name, Date.now())));
  ctx.share("popupStops", { stops, current: s });
}
