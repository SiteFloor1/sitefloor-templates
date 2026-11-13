// @ts-check
/**
 * Sittings: when the kitchen serves each menu (lunch, dinner, brunch). Drives "what's on now", the
 * kitchen line ("kitchen open until 10pm") and the Carte look's day or evening colours.
 */
import { DAY_KEYS, toMinutes, formatTime12 } from "../../../core/lib/hours.js";

/** @typedef {{ id: string, name: string, days: string[], from: string, to: string, lastOrders?: string, mood: "day"|"evening" }} Sitting */
/** @typedef {{ weekday: number, minutes: number }} Now */

/**
 * The sitting being served now, and the next one (today or on a later day, up to a week away).
 * @param {Sitting[]} sittings @param {Now} now
 * @returns {{ current: Sitting|null, next: { sitting: Sitting, inDays: number }|null }}
 */
export function sittingState(sittings, now) {
  const today = DAY_KEYS[now.weekday];
  const current = sittings.find((s) => s.days.includes(today) && now.minutes >= toMinutes(s.from) && now.minutes < toMinutes(s.to)) ?? null;
  /** @type {{ sitting: Sitting, inDays: number }|null} */
  let next = null;
  for (let d = 0; d < 8 && !next; d++) {
    const day = DAY_KEYS[(now.weekday + d) % 7];
    const later = sittings
      .filter((s) => s.days.includes(day) && (d > 0 || toMinutes(s.from) > now.minutes))
      .sort((a, b) => toMinutes(a.from) - toMinutes(b.from));
    if (later[0]) next = { sitting: later[0], inDays: d };
  }
  return { current, next };
}

/** @param {number} m minutes after midnight */
const t12 = (m) => formatTime12(m);

/**
 * One line about the kitchen right now.
 * @param {Sitting[]} sittings @param {Now} now
 * @returns {{ text: string, state: "open"|"last"|"closed" }}
 */
export function kitchenLine(sittings, now) {
  const { current, next } = sittingState(sittings, now);
  if (current) {
    const last = toMinutes(current.lastOrders ?? current.to);
    const left = last - now.minutes;
    if (left <= 0) return { text: `${current.name} · last orders have gone${next && next.inDays === 0 ? `; ${next.sitting.name.toLowerCase()} from ${t12(toMinutes(next.sitting.from))}` : ""}`, state: "closed" };
    if (left <= 45) return { text: `${current.name} · last orders in ${left} min`, state: "last" };
    return { text: `${current.name} · kitchen open until ${t12(last)}`, state: "open" };
  }
  if (!next) return { text: "Kitchen closed", state: "closed" };
  const when = next.inDays === 0 ? `from ${t12(toMinutes(next.sitting.from))}` : next.inDays === 1 ? `tomorrow from ${t12(toMinutes(next.sitting.from))}` : `${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][(now.weekday + next.inDays) % 7]} from ${t12(toMinutes(next.sitting.from))}`;
  return { text: `Kitchen closed · ${next.sitting.name.toLowerCase()} ${when}`, state: "closed" };
}

/**
 * Day or evening colours: the sitting being served, else the last one that started earlier today
 * (after dinner the room stays in its evening light), else the next one if it's before 6am, else day.
 * @param {Sitting[]} sittings @param {Now} now @returns {"day"|"evening"}
 */
export function moodNow(sittings, now) {
  const { current } = sittingState(sittings, now);
  if (current) return current.mood;
  const today = DAY_KEYS[now.weekday];
  const earlier = sittings.filter((s) => s.days.includes(today) && toMinutes(s.from) <= now.minutes).sort((a, b) => toMinutes(b.from) - toMinutes(a.from));
  if (earlier[0]) return earlier[0].mood;
  if (now.minutes < 6 * 60) {
    const yesterday = DAY_KEYS[(now.weekday + 6) % 7];
    const last = sittings.filter((s) => s.days.includes(yesterday)).sort((a, b) => toMinutes(b.from) - toMinutes(a.from))[0];
    if (last) return last.mood;
  }
  return "day";
}

/**
 * The sitting to show first: the one being served, else the next one today, else the first of the day.
 * @param {Sitting[]} sittings @param {Now} now @returns {Sitting}
 */
export function sittingToShow(sittings, now) {
  const { current, next } = sittingState(sittings, now);
  if (current) return current;
  if (next && next.inDays === 0) return next.sitting;
  const today = DAY_KEYS[now.weekday];
  return sittings.find((s) => s.days.includes(today)) ?? sittings[0];
}
