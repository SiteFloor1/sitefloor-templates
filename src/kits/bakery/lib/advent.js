// @ts-check
/**
 * The advent box: 24 windows, one chocolate behind each. In December, windows up to today open and the rest stay shut
 * until their day; before December the box is a preview (every window opens, so customers can see inside before they
 * order); after the 24th they all open. The doors are laid out in a fixed shuffled order, the same every year for a
 * shop, like a printed calendar. No DOM.
 */

/** @typedef {{ mode: "preview"|"live"|"after", today: number }} AdventState today: the day of December, or 0 */

/** @param {string} date YYYY-MM-DD, the shop's today @param {number} year the calendar's year @returns {AdventState} */
export function adventState(date, year) {
  const [y, m, d] = date.split("-").map(Number);
  if (y < year || (y === year && m < 12)) return { mode: "preview", today: 0 };
  if (y === year && m === 12 && d <= 24) return { mode: "live", today: d };
  return { mode: "after", today: 0 };
}

/** Can window `n` be opened now? @param {AdventState} s @param {number} n */
export const canOpen = (s, n) => s.mode !== "live" || n <= s.today;

/** The 24 days in their places on the lid: shuffled, but the same every time for a given seed. @param {number} seed */
export function doorOrder(seed) {
  const days = Array.from({ length: 24 }, (_, i) => i + 1);
  let x = (seed * 2654435761) >>> 0 || 1;
  for (let i = days.length - 1; i > 0; i--) {
    x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0;
    const j = x % (i + 1); [days[i], days[j]] = [days[j], days[i]];
  }
  return days;
}

/**
 * Which piece is behind each day: the shop's list if it gives one, else its box pieces in turn.
 * @template T @param {T[]} pieces @param {(string|undefined)[]} [chosen] ids by day (1–24) @param {(p: T) => string} [idOf]
 * @returns {T[]} 24 pieces, day 1 first
 */
export function behindDoors(pieces, chosen = [], idOf = (/** @type {any} */ p) => p.id) {
  return Array.from({ length: 24 }, (_, i) => pieces.find((p) => idOf(p) === chosen[i]) ?? pieces[i % pieces.length]);
}
