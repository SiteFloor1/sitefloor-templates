// @ts-check
/**
 * How busy is it now? Staff's word from the sheet while it's fresh (the sheet's busy row, hidden once older
 * than staleAfterMinutes); otherwise the café's usual level for this hour, said as "usually". Closed: says so.
 * Marks now on the week grid and says when it gets quieter today.
 */
import { usualAt, quieterFrom, LEVELS, LIVE_LEVEL } from "../../lib/busy.js";
import { ago } from "../../lib/tonight.js";
import { formatTime12, DAY_NAMES } from "../../../../core/lib/hours.js";

/** @typedef {{ src: string, word: string, line: string, level: number|null }} Say */

/** Closed: when it opens. @param {import("../../../../core/lib/hours.js").OpenStatus} status @param {import("../../../../core/lib/hours.js").ZonedNow} now @returns {Say} */
function closed(status, now) {
  const n = status.nextOpen;
  return { src: "Right now", word: "Closed", line: n ? `We open ${n.date === now.date ? "today" : "on " + DAY_NAMES[n.weekday]} at ${formatTime12(n.minutes)}.` : "", level: null };
}

/** Staff's own word from the sheet. @param {{ state: import("../../lib/tonight.js").BusyState, note: string, updatedAt: number }} b @returns {Say} */
function live(b) {
  const level = LIVE_LEVEL[b.state];
  return { src: "Right now, from the counter", word: LEVELS[level], line: [b.note, `Updated ${ago(Date.now() - b.updatedAt)}`].filter(Boolean).join(" · "), level };
}

/** The usual for this hour, from the café's numbers. @param {import("../../lib/busy.js").Busy} b @param {import("../../../../core/lib/hours.js").ZonedNow} now @returns {Say} */
function usual(b, now) {
  const level = usualAt(b, now.weekday, now.minutes);
  return { src: `Usually, on a ${DAY_NAMES[now.weekday]} at this time`, word: level === null ? "Not sure" : LEVELS[level], line: level === null ? "We don't have a number for this hour." : "From our own numbers, not a live count.", level };
}

/** "Usually quieter from 11am". @param {import("../../lib/busy.js").Busy} b @param {import("../../../../core/lib/hours.js").ZonedNow} now @param {number} level */
function quieterLine(b, now, level) {
  const q = quieterFrom(b, now.weekday, now.minutes, level);
  return q === null ? "It usually stays like this until we close." : `Usually quieter from ${formatTime12(q)}.`;
}

/** Today's row and, while open, this hour on the week grid. @param {HTMLElement} root @param {import("../../../../core/lib/hours.js").ZonedNow} now @param {boolean} open */
function markNow(root, now, open) {
  const row = root.querySelector(`[data-bz-day="${now.weekday}"]`);
  row?.classList.add("is-today");
  for (const c of open ? row?.querySelectorAll("[data-bz-at]") ?? [] : []) {
    const at = Number(/** @type {HTMLElement} */ (c).dataset.bzAt);
    if (now.minutes >= at && now.minutes < at + 60) c.classList.add("is-now");
  }
}

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  /** @type {import("../../lib/busy.js").Busy} */
  const busy = /** @type {any} */ (ctx.data).busy;
  const word = root.querySelector("[data-bz-word]"), line = root.querySelector("[data-bz-line]"), next = root.querySelector("[data-bz-next]"), src = root.querySelector("[data-bz-src]");
  const pips = [...root.querySelectorAll("[data-bz-pip]")];
  if (!busy || !word || !line || !next || !src) throw new Error("busy markup or data missing");
  /** @type {import("../../lib/tonight.js").Tonight|null} */ let sheet = null;

  const paint = () => {
    const now = ctx.now();
    const status = ctx.status();
    for (const c of root.querySelectorAll(".is-now")) c.classList.remove("is-now");
    for (const r of root.querySelectorAll(".is-today")) r.classList.remove("is-today");
    markNow(root, now, status.open);
    const say = !status.open ? closed(status, now) : sheet && sheet.ok && sheet.busy ? live(sheet.busy) : usual(busy, now);
    const level = say.level;
    src.textContent = say.src; word.textContent = say.word; line.textContent = say.line;
    root.dataset.level = level === null ? "" : String(level);
    pips.forEach((p, i) => p.classList.toggle("on", level !== null && i <= level));
    next.textContent = status.open && level ? quieterLine(busy, now, level) : "";
  };
  ctx.watch("tonight", (/** @type {any} */ r) => { sheet = r; paint(); });
  ctx.everyMinute(paint);
  paint();
}
