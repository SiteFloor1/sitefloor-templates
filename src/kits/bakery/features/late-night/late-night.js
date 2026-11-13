// @ts-check
/**
 * Open late: the closing time tonight from the shop's hours, last orders (counting down in the final hour), and the
 * seats line from the sheet when it's fresh. Updates every minute.
 */
import { formatTime12 } from "../../../../core/lib/hours.js";
import { SEATS_WORDS } from "../../lib/bakes.js";
import { startBakes } from "../bakes/sheet-provider.js";

/**
 * Words for tonight from the open status and last orders.
 * @param {import("../../../../core/lib/hours.js").OpenStatus} s @param {number} nowMin @param {number} lastBefore minutes
 */
export function lateWords(s, nowMin, lastBefore) {
  if (!s.open || s.closesAt === null) return { close: "Closed right now.", last: "" };
  const last = s.closesAt - lastBefore;
  const close = `Open until ${formatTime12(s.closesAt)} tonight.`;
  if (nowMin >= last) return { close, last: "Last orders have been taken. Takeaway from the counter until we close." };
  const left = last - nowMin;
  return { close, last: left <= 60 ? `Last orders in ${left} minute${left === 1 ? "" : "s"}, at ${formatTime12(last)}` : `Last orders ${formatTime12(last)}` };
}

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const close = root.querySelector("[data-ln-close]"), last = root.querySelector("[data-ln-last]");
  const seats = /** @type {HTMLElement|null} */ (root.querySelector("[data-ln-seats]"));
  if (!close || !last || !seats) throw new Error("late-night markup missing");
  const cfg = /** @type {any} */ (ctx.data).lateNight;
  const tick = () => {
    const now = ctx.now();
    const w = lateWords(ctx.status(), now.minutes, cfg.lastOrders);
    close.textContent = w.close;
    last.textContent = w.last;
  };
  tick();
  ctx.everyMinute(tick);
  startBakes(ctx);
  ctx.watch("bakes", (/** @type {import("../../lib/bakes.js").Bakes} */ b) => {
    const s = b.ok ? b.seats : null;
    seats.hidden = !s || !ctx.status().open;
    seats.dataset.state = s?.state ?? "";
    seats.textContent = s ? SEATS_WORDS[s.state] + (s.note ? `. ${s.note}` : "") : "";
  });
  root.dataset.ready = "true";
}
