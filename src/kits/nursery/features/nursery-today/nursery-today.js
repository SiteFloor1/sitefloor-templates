// @ts-check
/**
 * Today at nursery: asks the provider for today's line (the nursery's sheet, or the demo's) and shows it; nothing at
 * all when there's no line for today or the sheet can't be read.
 */
import { ymdIn, dateWords } from "../../lib/nursery.js";

/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx, today: string) => Promise<string> }} TodayProvider */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  /** @type {TodayProvider|null} */
  const provider = ctx.providers.nurseryToday;
  if (!provider) throw new Error("today provider missing");
  const today = ymdIn(Date.now(), ctx.data.hours.timezone);
  provider.load(ctx, today).then((text) => {
    if (!text) return;
    const day = root.querySelector("[data-nu-today-day]"), line = root.querySelector("[data-nu-today]");
    if (day) day.textContent = `Today, ${dateWords(today)}:`;
    if (line) line.textContent = text;
    root.hidden = false;
  }, () => {});
}
