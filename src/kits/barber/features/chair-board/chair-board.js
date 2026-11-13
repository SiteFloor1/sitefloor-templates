// @ts-check
/**
 * Live chair board. Data comes from a provider chosen at build time:
 *   client sites → sheet-provider.js (the shop's Google Sheet)
 *   demo sites   → src/demo/chair-provider.js (simulated)
 * If the provider fails or the data is stale, the board hides and a fallback
 * message is shown. Times are never shown unless they are current.
 */
import { formatTime24 } from "../../../../core/lib/hours.js";

/**
 * @typedef {{ barber: string, status: "free"|"busy"|"off"|"unknown", freeAtMinutes: number|null, updatedAt?: number|null, progress?: number, cut?: string }} Chair
 * @typedef {{ ok: true, chairs: Chair[], updatedMinutes: number } | { ok: false }} BoardState
 * @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx) => Promise<BoardState>, intervalMs: number }} ChairProvider
 */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  /** @type {ChairProvider|null} */
  const provider = ctx.providers.chairBoard;
  const board = /** @type {HTMLElement} */ (root.querySelector("[data-board]"));
  const fallback = /** @type {HTMLElement} */ (root.querySelector("[data-board-fallback]"));
  const updated = root.querySelector("[data-board-updated]");
  if (!provider || !board || !fallback) throw new Error("chair board markup or provider missing");

  /** @param {BoardState} state */
  const render = (state) => {
    const open = ctx.status().open;
    const nowMinutes = ctx.now().minutes;
    board.hidden = !state.ok;
    fallback.hidden = state.ok;
    if (!state.ok) { ctx.share("board", null); return; }
    if (updated) updated.textContent = formatTime24(state.updatedMinutes);
    for (const card of board.querySelectorAll("[data-chair]")) {
      const el = /** @type {HTMLElement} */ (card);
      const name = el.dataset.chair ?? "";
      const chair = current(state.chairs.find((c) => c.barber === name), name, nowMinutes);
      paintChair(el, chair, open, ctx);
    }
    ctx.share("board", open ? state.chairs.map((c) => current(c, c.barber, nowMinutes)) : null);
  };

  /** @type {BoardState} */
  let last = { ok: false };
  let loadedAt = 0;
  const refresh = async () => {
    if (Date.now() - loadedAt >= provider.intervalMs) {
      loadedAt = Date.now();
      try { last = await provider.load(ctx); } catch (err) {
        console.error("[chair-board] could not load data", err);
        last = { ok: false };
      }
    }
    render(last);
  };
  refresh();
  ctx.everyMinute(refresh); // re-render on every tick (open/closed can change); reload only when the provider's interval has passed
}

/**
 * Status line and "next free" value for one card.
 * @param {Chair} c @param {boolean} shopOpen @param {boolean} free @param {boolean} busy
 * @returns {[string, string]}
 */
function chairText(c, shopOpen, free, busy) {
  if (!shopOpen) return ["Shop closed", "–"];
  if (c.status === "off") return ["Not in today", "–"];
  if (c.status === "unknown") return ["No live update", "Ask"];
  if (free) return ["Chair free", "Now"];
  return [c.cut ? `In the chair · ${c.cut}` : "With a customer", busy ? formatTime24(/** @type {number} */ (c.freeAtMinutes)) : "–"];
}

/**
 * "Updated just now", "Updated 12 min ago", or the clock time after an hour.
 * @param {number} agoMs @param {import("../../../../core/js/core.js").Ctx} ctx
 */
function updatedText(agoMs, ctx) {
  const mins = Math.max(0, Math.floor(agoMs / 60_000));
  if (mins < 1) return "Updated just now";
  if (mins < 60) return `Updated ${mins} min ago`;
  const shopMinutes = ctx.now().minutes - mins; // same day: off rows and busy rows are only live today
  return `Updated at ${formatTime24(shopMinutes)}`;
}

/**
 * A barber missing from the data, or a "busy until" time that has now passed
 * (the page may have been open a while), is shown as unknown: no time offered.
 * @param {Chair|undefined} c @param {string} name @param {number} nowMinutes @returns {Chair}
 */
function current(c, name, nowMinutes) {
  if (!c) return { barber: name, status: "unknown", freeAtMinutes: null };
  if (c.status === "busy" && (c.freeAtMinutes === null || c.freeAtMinutes <= nowMinutes)) return { ...c, status: "unknown", freeAtMinutes: null };
  return c;
}

/**
 * @param {HTMLElement} el @param {Chair} c @param {boolean} shopOpen
 * @param {import("../../../../core/js/core.js").Ctx} ctx
 */
function paintChair(el, c, shopOpen, ctx) {
  const status = /** @type {HTMLElement} */ (el.querySelector("[data-chair-status]"));
  const time = /** @type {HTMLElement} */ (el.querySelector("[data-chair-time]"));
  const take = /** @type {HTMLAnchorElement} */ (el.querySelector("[data-chair-take]"));
  const bar = /** @type {HTMLElement} */ (el.querySelector(".bar"));
  const upd = el.querySelector("[data-chair-updated]");
  if (upd) upd.textContent = shopOpen && c.status !== "unknown" && c.updatedAt ? updatedText(Date.now() - c.updatedAt, ctx) : "";
  const free = shopOpen && c.status === "free";
  const busy = shopOpen && c.status === "busy" && c.freeAtMinutes !== null;
  el.classList.toggle("free", free);
  el.classList.toggle("off", !shopOpen || c.status === "off" || c.status === "unknown");
  bar.style.width = `${Math.round((free ? 1 : c.progress ?? 0) * 100)}%`;

  [status.textContent, time.textContent] = chairText(c, shopOpen, free, busy);

  const message = free
    ? `Hi, is ${c.barber}'s chair still free? I can be there in 10 minutes.`
    : busy ? `Hi, can I take the ${formatTime24(/** @type {number} */ (c.freeAtMinutes))} slot with ${c.barber} today?`
      : `Hi, can I book in with ${c.barber}?`;
  take.href = ctx.waHref(message);
  take.textContent = free ? `Walk in now with ${c.barber}` : busy ? `Take ${formatTime24(/** @type {number} */ (c.freeAtMinutes))} with ${c.barber}` : `Message ${c.barber}`;
}
