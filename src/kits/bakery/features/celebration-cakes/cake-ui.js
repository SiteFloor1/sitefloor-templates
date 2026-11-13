// @ts-check
/**
 * Browser helpers shared by the Cake Builder and the celebration cakes page: the earliest day from the shop's notice
 * and tonight's sheet, the request link, and the "remind me next year" calendar file.
 */
import { earliestDate, longDay, reminderIcs } from "../../lib/cake.js";
import { allergenName } from "../../../../core/lib/allergens.js";
import { startBakes } from "../bakes/sheet-provider.js";

/**
 * Calls back with the earliest day (YYYY-MM-DD or null) and the full days, now and whenever the sheet updates.
 * Without the sheet (or if it fails) the notice and opening days still apply; full days are then unknown.
 * @param {import("../../../../core/js/core.js").Ctx} ctx @param {(earliest: string|null, fullDays: string[]) => void} fn
 */
export function watchEarliest(ctx, fn) {
  const cakes = /** @type {any} */ (ctx.data).cakes;
  let full = /** @type {string[]} */ ([]);
  const run = () => fn(earliestDate(cakes, ctx.now(), ctx.data.hours, full), full);
  run();
  startBakes(ctx);
  ctx.watch("bakes", (/** @type {import("../../lib/bakes.js").Bakes} */ b) => { full = b.ok ? b.fullDays : []; run(); });
  ctx.everyMinute(run);
}

/** Allergen names from ids. @param {string[]} ids */
export const allergenList = (ids) => ids.map(allergenName);

/**
 * Downloads the reminder for the same day next year.
 * @param {import("../../../../core/js/core.js").Ctx} ctx @param {string} day @param {string} occasion
 */
export function downloadReminder(ctx, day, occasion) {
  const d = /** @type {any} */ (ctx.data);
  const ics = reminderIcs({ day, occasion, business: d.name, leadDays: d.cakes.leadDays, url: d.url, stamp: new Date() });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = "cake-reminder.ics";
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export { longDay };
