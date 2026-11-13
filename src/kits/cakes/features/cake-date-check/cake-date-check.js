// @ts-check
/**
 * Is our date free? Reads the studio's diary once (its sheet, or the demo's simulated diary) and answers for the date
 * picked: past, inside the studio's notice ("soon"), unknown (no diary), taken, one place left or free. The message
 * link then names the date.
 */
import { dateStatus, longDate } from "../../lib/cakes.js";

/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx) => Promise<import("../../lib/cakes.js").Dates> }} DatesProvider */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).cakes?.dates;
  const input = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-dc-input]"));
  const out = /** @type {HTMLElement|null} */ (root.querySelector("[data-dc-result]"));
  const go = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-dc-go]"));
  if (!cfg || !input || !out || !go) throw new Error("date check markup missing");
  const name = /** @type {any} */ (ctx.data).name ?? "";
  /** @type {import("../../lib/cakes.js").Dates} */
  let dates = { ok: false };
  input.min = ctx.now().date;
  const render = () => {
    const d = input.value;
    if (!d) return;
    const state = dateStatus(dates, d, ctx.now().date, cfg.minDays);
    const said = longDate(d);
    out.dataset.state = state;
    out.textContent = state === "past" ? "That date has passed." : String(cfg.words[state]).replaceAll("{date}", said);
    const text = state === "free" || state === "one" ? `Hello ${name}, we'd like to hold ${said} for a cake.` : `Hello ${name}, is ${said} free for a cake?`;
    go.href = ctx.waHref(text);
    go.textContent = state === "free" || state === "one" ? "Hold this date" : "Ask about this date";
  };
  input.addEventListener("change", render);
  /** @type {DatesProvider|null} */
  const provider = ctx.providers.cakeDates;
  if (provider) provider.load(ctx).then((r) => { dates = r; render(); }, () => { dates = { ok: false }; render(); });
}
