// @ts-check
/**
 * DEMO ONLY. The detailing demo's example car: a green coupé on the film stage, updated forty minutes ago, its photo
 * from the demo's own folder. Any other code is unknown. Never bundled into client sites.
 */
import { carFromCsv } from "../kits/detailing/lib/progress.js";
import { zonedNow, formatTime24 } from "../core/lib/hours.js";

/** @type {import("../kits/detailing/features/car-progress/car-progress.js").ProgressProvider} */
export const simulatedProgress = {
  async load(ctx, code) {
    const tz = ctx.data.hours.timezone, now = zonedNow(new Date(), tz), cfg = /** @type {any} */ (ctx.data).detailing.progress;
    const at = `${now.date} ${formatTime24(Math.max(0, now.minutes - 40))}`;
    const rows = [
      "code,car,work,stage,stage_name,note,photo,handover,updated_at",
      `${cfg.example},Green coupé,"Two-stage correction, full-front film",protection,Film,"Bonnet and both wings are filmed. Bumper tomorrow, then it cures overnight.",,"Friday, 4pm",${at}`,
    ];
    const r = carFromCsv(rows.join("\n"), code, Date.now(), tz, 48, cfg.stages);
    // The demo's photo is in its own folder, not on Google Drive.
    if (r.ok) r.car.photo = new URL("img/in-the-bay.webp", document.baseURI).href;
    return r;
  },
};
