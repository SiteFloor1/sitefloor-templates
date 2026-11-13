// @ts-check
/** The drop in the browser: a demo's "rolling" drop is always the next one from today, on the brand's clock. */
import { nextRunDate } from "../lib/club.js";

/**
 * @param {{ opens: string, rolling: { day: string, time: string }|null }} drop @param {string} tz @param {number} now
 * @returns {string} "YYYY-MM-DDTHH:MM"
 */
export function liveOpens(drop, tz, now) {
  if (!drop.rolling) return drop.opens;
  const date = nextRunDate({ id: "drop", day: drop.rolling.day, time: drop.rolling.time, minutes: 0, title: "", text: "", meet: "" }, now, tz);
  // nextRunDate moves on once the time has passed; a drop that opened today stays today until midnight.
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(now));
  const dayIdx = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].indexOf(drop.rolling.day);
  const todayIdx = new Date(`${today}T12:00:00Z`).getUTCDay();
  return `${dayIdx === todayIdx ? today : date}T${drop.rolling.time}`;
}
