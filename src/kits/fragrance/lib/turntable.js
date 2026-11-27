// @ts-check
/** The turntable's arithmetic, with no DOM: which frame a drag reaches, and each frame's file. */

/**
 * The frame a drag has reached: one frame for every 1/90 of the stage's width (at least 8 px), dragging right turns
 * the bottle back, as a hand turns a real bottle; it wraps round past the last frame.
 * @param {number} from frame number when the drag began (1-based) @param {number} dx pixels dragged
 * @param {number} width the stage's width @param {number} frames how many frames make the turn
 */
export function frameFor(from, dx, width, frames) {
  const step = Math.max(8, width / 90);
  const n = from - Math.round(dx / step);
  return (((n - 1) % frames) + frames) % frames + 1;
}

/**
 * A frame's file: the pattern's {n} as two digits. With `repeat` (a symmetric bottle), frame repeat + 1 is frame 1 again.
 * @param {string} pattern e.g. "img/turn/d-{n}.webp" @param {number} n 1-based @param {number} [repeat]
 */
export function frameFile(pattern, n, repeat) {
  const u = repeat ? ((n - 1) % repeat) + 1 : n;
  return pattern.replace("{n}", String(u).padStart(2, "0"));
}

/** The frames' pattern from frame 1's file: "img/turn/d-01.webp" → "img/turn/d-{n}.webp". @param {string} first */
export function patternOf(first) {
  return first.replace(/01(\.[a-z0-9]+)$/i, "{n}$1");
}
