// @ts-check
/**
 * "Will I make it?": can a customer fit a cut in before they need to be somewhere,
 * and if not, when should they come instead. Pure maths on the shop's own numbers:
 * travel minutes, the live queue's wait, how long the cut takes and when the shop closes.
 * Without a live number there is no wait to add: the page says "if there's no queue" and
 * gives the usual busyness as a word, never a guessed number of minutes.
 * All times are minutes after midnight.
 */

/**
 * @typedef {object} PlanInput
 * @property {number} now
 * @property {number} deadline when they need to be done (and back, if returning)
 * @property {number} travel minutes each way
 * @property {boolean} back whether they need to travel back before the deadline
 * @property {number} wait minutes before their cut starts
 * @property {number} cut minutes the cut takes
 * @property {number|null} closesAt shop closing time today, or null if closed
 */

/**
 * @param {PlanInput} p
 * @returns {{ arrive: number, inChair: number, done: number, finish: number, spare: number, fits: boolean, leaveBy: number, reason: "ok"|"deadline"|"closing"|"closed" }}
 */
export function planVisit(p) {
  const arrive = p.now + p.travel;
  const inChair = arrive + p.wait;
  const done = inChair + p.cut;
  const finish = done + (p.back ? p.travel : 0);
  const spare = p.deadline - finish;
  const leaveBy = p.now + spare; // the latest they can set off and still make it
  let reason = /** @type {"ok"|"deadline"|"closing"|"closed"} */ ("ok");
  if (p.closesAt === null) reason = "closed";
  else if (done > p.closesAt) reason = "closing";
  else if (spare < 0) reason = "deadline";
  return { arrive, inChair, done, finish, spare, fits: reason === "ok", leaveBy, reason };
}

/**
 * The best hour still to come today for a cut: the quietest by the shop's usual busyness
 * (earliest if several tie), starting at least 15 minutes from now, where the cut still
 * finishes before closing.
 * @param {{ hour: number, level: number }[]} day usual busyness for today
 * @param {{ now: number, cut: number, closesAt: number|null }} o
 * @returns {{ at: number, level: number } | null}
 */
export function bestTimeToday(day, o) {
  if (o.closesAt === null) return null;
  /** @type {{ at: number, level: number } | null} */
  let best = null;
  for (const h of day) {
    const at = Math.max(h.hour * 60, roundUp(o.now + 15, 15));
    if (at >= (h.hour + 1) * 60 || at + o.cut > o.closesAt) continue;
    if (!best || h.level < best.level) best = { at, level: h.level };
  }
  return best;
}

/**
 * A calendar reminder (.ics). Times are written in UTC ("Z"), which every calendar app reads the same way.
 * @param {{ startMs: number, minutes: number, title: string, place: string, note: string, uid: string, stamp: Date }} e
 */
export function reminderIcs(e) {
  const utc = (/** @type {number} */ ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (/** @type {string} */ s) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sitefloor//Fit a cut//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:${e.uid}`, `DTSTAMP:${utc(e.stamp.getTime())}`,
    `DTSTART:${utc(e.startMs)}`, `DTEND:${utc(e.startMs + e.minutes * 60_000)}`,
    `SUMMARY:${esc(e.title)}`, `LOCATION:${esc(e.place)}`, `DESCRIPTION:${esc(e.note)}`,
    "BEGIN:VALARM", "TRIGGER:-PT15M", "ACTION:DISPLAY", `DESCRIPTION:${esc(e.title)}`, "END:VALARM",
    "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
}

/** @param {number} m @param {number} step */
const roundUp = (m, step) => Math.ceil(m / step) * step;
