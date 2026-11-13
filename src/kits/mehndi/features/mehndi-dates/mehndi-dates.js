// @ts-check
/**
 * Is my date free? Reads the artist's diary once (the client's sheet, or a simulation on demos), then answers for the
 * chosen day. Anything uncertain asks the bride to message instead; nothing ever says booked.
 */
import { dayAnswer, dateText, ukDate } from "../../lib/mehndi.js";
import { dateField } from "../../partials/date-field.js";

/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx) => Promise<import("../../lib/mehndi.js").DatesResult> }} DatesProvider */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).dateCheck;
  /** @type {DatesProvider|null} */
  const provider = ctx.providers.dates;
  const out = /** @type {HTMLElement|null} */ (root.querySelector("[data-dc-out]"));
  const ask = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-dc-ask]"));
  if (!cfg || !provider || !out || !ask) throw new Error("date check markup or provider missing");
  /** @type {import("../../lib/mehndi.js").DatesResult|null} */
  let diary = null;
  let date = "";
  const paint = () => {
    const text = dateText(cfg.message, date);
    ask.href = ctx.bookHref(text);
    if (ask.dataset.waText !== undefined) ask.dataset.waText = text;
    if (!date) { out.dataset.state = "idle"; out.textContent = "Choose the day to see it in the diary."; return; }
    if (!diary && date >= ctx.now().date) { out.dataset.state = "loading"; out.textContent = "Checking the diary…"; return; }
    const a = dayAnswer(date, ctx.now().date, diary);
    out.dataset.state = a.state;
    out.replaceChildren(Object.assign(document.createElement("b"), { textContent: ukDate(date) }), document.createElement("br"), a.words);
  };
  dateField(root, ctx, "wedding", (ymd) => { date = ymd; paint(); });
  provider.load(ctx).then((r) => { diary = r; paint(); }, () => { diary = { ok: false }; paint(); });
}
