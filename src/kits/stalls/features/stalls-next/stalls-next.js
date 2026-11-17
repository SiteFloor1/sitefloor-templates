// @ts-check
/**
 * The next stop in the hero. Takes the week from stalls-where (shared as "stalls"), shows the chosen stop (or the next
 * one) with a countdown that ticks once a minute; "Here now" and the closing time while it trades.
 */
import { nextStop, dayWord, minutesUntil, untilWords, mapsHref } from "../../lib/stalls.js";
import { placeOf, calendarLink } from "../stalls-where/stalls-where.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).stops;
  const where = root.querySelector("[data-next-where]"), what = root.querySelector("[data-next-what]");
  const count = root.querySelector("[data-next-count]"), dir = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-next-dir]"));
  const cal = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-next-cal]"));
  if (!cfg || !where || !what || !count || !dir || !cal) return; // no stop in the usual week: the fallback line stays
  /** @type {any} */ let stop = null;
  let fresh = false;
  const paint = () => {
    if (!stop) return;
    const now = ctx.now(), p = placeOf(cfg, stop.place);
    where.textContent = stop.live ? `Here now in ${p.name}` : `${dayWord(stop.date, now.date)} in ${p.name}`;
    what.textContent = `${fresh ? "" : "Usually "}${p.market ? `${fresh ? p.market : p.market.toLowerCase()}, ` : ""}${p.postcode} · ${stop.open} till ${stop.close}, or until we sell out.`;
    const b = document.createElement("b");
    if (stop.live) { b.textContent = stop.close; count.replaceChildren("Until ", b); }
    else { b.textContent = untilWords(minutesUntil(stop, now)); count.replaceChildren("Opens in ", b); }
    dir.href = mapsHref(p);
    cal.hidden = false;
    calendarLink(cal, stop, p, /** @type {any} */ (ctx.data).name);
  };
  ctx.watch("stalls", (/** @type {{ ok: boolean, stops: any[] }} */ w) => { fresh = w.ok; stop = nextStop(w.stops, ctx.now()); paint(); });
  ctx.watch("stallsChosen", (/** @type {any} */ s) => { if (s && !s.cancelled) { stop = s; paint(); } });
  setInterval(paint, 60_000);
}
