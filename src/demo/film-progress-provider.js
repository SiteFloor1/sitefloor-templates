// @ts-check
/**
 * DEMO ONLY. One example couple for the wedding-film demo (code LARCH0619): married three and a half weeks ago, the
 * film in colour, the trailer delivered, the photographs due soon. Updated forty minutes ago (never in the future: the page refuses a sheet stamped ahead). Never bundled into client sites.
 */
import { progressFromCsv } from "../kits/weddingfilm/lib/couples.js";
import { zonedNow, addDays, formatTime24 } from "../core/lib/hours.js";

/** @type {import("../kits/weddingfilm/features/film-progress/film-progress.js").ProgressProvider} */
export const simulatedProgress = {
  async load(ctx, code) {
    const tz = ctx.data.hours.timezone, now = zonedNow(new Date(), tz);
    const rows = [
      "code,wedding,stage,trailer,photographs,note,updated_at",
      `LARCH0619,${addDays(now.date, -24)},colour,delivered,${addDays(now.date, 9)},"Your trailer is in your inbox.",${now.date} ${formatTime24(Math.max(0, now.minutes - 40))}`,
    ];
    return progressFromCsv(rows.join("\n"), code, Date.now(), tz, 72);
  },
};
