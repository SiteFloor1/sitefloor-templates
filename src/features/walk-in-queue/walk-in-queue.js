// @ts-check
/**
 * Walk-in queue: people waiting now, the estimated wait, a little line of people with
 * "you" at the end, and the usual-busyness heatmap with today and this hour marked.
 * The heatmap is built into the page and works without JavaScript; this adds the live part.
 */
import { waitMinutes, waitWords, busyHours, quietestAhead, hourWord, BUSY_WORDS } from "../../core/lib/queue.js";
import { formatTime12, DAY_KEYS } from "../../core/lib/hours.js";

/**
 * @typedef {{ ok: true, waiting: number, updatedAt: number } | { ok: false }} QueueState
 * @typedef {{ load: (ctx: import("../../core/js/core.js").Ctx) => Promise<QueueState>, intervalMs: number }} QueueProvider
 */

const MAX_FIGURES = 12;

/** @type {import("../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  /** @type {QueueProvider|null} */
  const provider = ctx.providers.queue;
  const cfg = ctx.data.queue;
  const $ = (/** @type {string} */ s) => /** @type {HTMLElement} */ (root.querySelector(s));
  const live = $("[data-q-live]"), off = $("[data-q-fallback]");
  if (!provider || !cfg || !live || !off) throw new Error("walk-in queue markup or provider missing");
  off.hidden = true; // shown without JavaScript; from here on only when the live number can't be used

  const markWeek = () => {
    const now = ctx.now();
    const day = DAY_KEYS[now.weekday];
    for (const row of root.querySelectorAll("[data-q-day]")) {
      const isToday = Number(/** @type {HTMLElement} */ (row).dataset.qDay) === now.weekday;
      row.classList.toggle("today", isToday);
      for (const c of row.querySelectorAll("[data-q-hour]")) c.classList.toggle("now", isToday && Number(/** @type {HTMLElement} */ (c).dataset.qHour) === Math.floor(now.minutes / 60));
    }
    const best = quietestAhead(busyHours(cfg.busyness, ctx.data.hours, day), now.minutes);
    $("[data-q-best]").textContent = ctx.status().open && best ? `· quietest left today: ${hourWord(best.hour)} (${BUSY_WORDS[best.level].toLowerCase()})` : "";
  };

  /** @param {QueueState} state */
  const render = (state) => {
    markWeek();
    const status = ctx.status();
    ctx.share("queue", state.ok ? { ok: true, waiting: state.waiting, updatedAt: state.updatedAt } : { ok: false });
    live.hidden = status.open && !state.ok; // closed: the live card says so; open with no data: the fallback
    off.hidden = !live.hidden;
    const num = $("[data-q-waiting]"), line = $("[data-q-line]"), wait = $("[data-q-wait]"), upd = $("[data-q-updated]");
    const hero = /** @type {HTMLElement|null} */ (document.querySelector("[data-q-hero]"));
    if (!status.open) {
      num.textContent = "0"; $("[data-q-unit]").textContent = "waiting";
      line.replaceChildren();
      wait.textContent = "We're closed right now. The queue starts again when we open.";
      upd.textContent = "";
      if (hero) hero.hidden = true;
      return;
    }
    if (!state.ok) { if (hero) hero.hidden = true; return; }
    const mins = waitMinutes(state.waiting, cfg.chairs, cfg.minutesPerCut);
    num.textContent = String(state.waiting);
    $("[data-q-unit]").textContent = state.waiting === 1 ? "person waiting" : "waiting";
    const figures = Array.from({ length: Math.min(state.waiting, MAX_FIGURES) }, () => document.createElement("li"));
    const you = document.createElement("li"); you.className = "you"; you.title = "You";
    line.replaceChildren(...figures, you);
    const seen = ctx.now().minutes + mins;
    wait.textContent = mins === 0 ? "No wait: walk straight in." : `Wait ${waitWords(mins)}. Walk in now and you're in the chair by about ${formatTime12(seen)}.`;
    const ago = Math.max(0, Math.round((Date.now() - state.updatedAt) / 60_000));
    upd.textContent = `Updated ${ago === 0 ? "just now" : `${ago} min ago`} by the shop`;
    if (hero) {
      hero.hidden = false;
      hero.textContent = `${state.waiting} waiting · ${mins === 0 ? "no wait" : waitWords(mins)}`;
    }
  };

  /** @type {QueueState} */
  let last = { ok: false };
  let loadedAt = 0;
  const refresh = async () => {
    if (Date.now() - loadedAt >= provider.intervalMs) {
      loadedAt = Date.now();
      try { last = await provider.load(ctx); } catch (err) {
        console.error("[walk-in-queue] could not load data", err);
        last = { ok: false };
      }
    }
    render(last);
  };
  refresh();
  ctx.everyMinute(refresh);
}
