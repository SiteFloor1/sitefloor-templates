// @ts-check
/**
 * Where hall metres land on the aerial render. The desktop render runs west to east with the forecourt on the left;
 * the phone render is turned a quarter, so the gate sits at the bottom. Both are straight down (orthographic), so a
 * metre is the same size everywhere in a render.
 */
export const NS = "http://www.w3.org/2000/svg";

/** @param {any} d page data (hall, aerial) @param {boolean} phone */
export function frameMap(d, phone) {
  const a = d.aerial;
  if (phone) {
    const f = a.phoneFrame;
    return { viewBox: `0 0 ${+(f.top - f.bottom).toFixed(3)} ${f.height}`, map: (/** @type {number} */ x, /** @type {number} */ y) => [f.top - y, f.x - x], startX: f.x - f.height + 1 };
  }
  const f = a.frame;
  return { viewBox: `0 0 ${f.width} ${+(f.top - f.bottom).toFixed(3)}`, map: (/** @type {number} */ x, /** @type {number} */ y) => [x - f.x, f.top - y], startX: -5.5 };
}
