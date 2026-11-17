// @ts-check
/**
 * How busy it is: the club's usual count for this hour of this weekday, said as "usually"; replaced by the live door
 * count (shared as "gymCount" by gym-live) only while it is fresh. Redrawn every minute.
 */
import { usualAt, compareWords, quietWords, hourWords, agoWords } from "../../lib/gym.js";
import { zonedNow, DAY_NAMES } from "../../../../core/lib/hours.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const busy = /** @type {any} */ (ctx.data).gym.busy;
  const n = /** @type {HTMLElement} */ (root.querySelector("[data-gc-n]")), sr = /** @type {HTMLElement} */ (root.querySelector("[data-gc-sr]"));
  const line = /** @type {HTMLElement} */ (root.querySelector("[data-gc-line]")), say = /** @type {HTMLElement} */ (root.querySelector("[data-gc-say]"));
  if (!busy || !n || !line || !say) return;
  /** @type {import("../../lib/gym.js").LiveCount} */
  let live = { ok: false };
  const paint = () => {
    const now = zonedNow(new Date(), ctx.data.hours.timezone);
    const h = Math.floor(now.minutes / 60), day = DAY_NAMES[now.weekday];
    const usual = usualAt(busy, now.weekday, h);
    let count, l, s;
    if (live.ok) {
      count = live.count;
      l = `in the club, ${agoWords(Math.max(0, Math.floor((Date.now() - live.at) / 60_000)))}.`;
      s = compareWords(live.count, usual, day);
    } else if (usual !== null) {
      count = usual;
      l = `usually in the club on a ${day} at ${hourWords(h)}.`;
      s = quietWords(busy, now.weekday, h);
    } else {
      // Closed now: the usual count when the club next opens, today or tomorrow.
      let wd = now.weekday, hh = h, v = null;
      for (let i = 0; i < 48 && v === null; i++) {
        hh++;
        if (hh > 23) { hh = 0; wd = (wd + 1) % 7; }
        v = usualAt(busy, wd, hh);
      }
      count = v ?? 0;
      l = `usually in the club at ${hourWords(hh)}, when we open${wd === now.weekday ? "" : ` on ${DAY_NAMES[wd]}`}.`;
      s = "";
    }
    n.textContent = String(count);
    if (sr) sr.textContent = `${count} `;
    line.textContent = l;
    say.textContent = s;
  };
  ctx.watch("gymCount", (/** @type {any} */ v) => { live = v?.ok ? v : { ok: false }; paint(); });
  paint();
  ctx.everyMinute(paint);
}
