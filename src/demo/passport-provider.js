// @ts-check
/**
 * DEMO ONLY. Simulated passports for the Pilates demo: the example code has a ten-class card part used, close to a
 * milestone; one other code has a membership. Updated forty minutes ago. Never bundled into client sites.
 */
import { passportFromCsv } from "../kits/pilates/lib/members.js";
import { zonedNow, addDays, formatTime24 } from "../core/lib/hours.js";

/** @type {import("../kits/pilates/features/class-passport/class-passport.js").PassportProvider} */
export const simulatedPassport = {
  async load(ctx, code) {
    const tz = ctx.data.hours.timezone, now = zonedNow(new Date(), tz), at = `${now.date} ${formatTime24(Math.max(0, now.minutes - 40))}`;
    const rows = [
      "code,card,left,expires,total,month,updated_at",
      `OTTO2412,Ten classes,4,${addDays(now.date, 41)},47,6,${at}`,
      `MEMBER12,Monthly membership,,,112,9,${at}`,
    ];
    return passportFromCsv(rows.join("\n"), code, Date.now(), tz, 48);
  },
};
