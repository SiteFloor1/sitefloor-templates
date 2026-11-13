// @ts-check
/**
 * Next free bay: asks the provider (the studio's sheet on client sites, a simulation on demos) for the next
 * drop-off day. Anything uncertain shows "message us" instead of a date.
 */
import { dayWords } from "../../lib/bay.js";

/**
 * @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx) => Promise<{ ok: true, date: string, updatedAt: number } | { ok: false }> }} BayProvider
 */

/** @param {number} ms */
const ago = (ms) => {
  const m = Math.max(1, Math.round(ms / 60_000));
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} hour${h === 1 ? "" : "s"} ago` : `${Math.round(h / 24)} day${Math.round(h / 24) === 1 ? "" : "s"} ago`;
};

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  /** @type {BayProvider|null} */
  const provider = ctx.providers.bay;
  const date = root.querySelector("[data-nb-date]"), upd = root.querySelector("[data-nb-upd]"), off = root.querySelector("[data-nb-off]");
  const book = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-nb-book]")), ask = root.querySelector("[data-nb-ask]");
  if (!provider || !date || !upd || !off || !book || !ask) throw new Error("next bay markup or provider missing");
  const fail = () => { date.textContent = ""; upd.textContent = ""; off.classList.add("on"); };
  provider.load(ctx).then((r) => {
    if (!r.ok) { fail(); return; }
    const words = dayWords(r.date, ctx.now().date);
    date.textContent = words;
    upd.textContent = `Diary updated ${ago(Date.now() - r.updatedAt)}`;
    const soon = words === "Today" || words === "Tomorrow";
    ask.textContent = `Ask for ${soon ? words.toLowerCase() : words.split(" ")[0]}`;
    book.href = ctx.waHref(`Hi, can I book in for ${soon ? words.toLowerCase() : words}?`);
  }, fail);
}
