// @ts-check
/**
 * Fit: the brand's own flat measurements per size, and a size from a body measurement. Only the brand's numbers are
 * used; the site never guesses a measurement it wasn't given.
 */

/** @typedef {{ id: string, label: string, values: Record<string, number> }} Measure one row of the size table, e.g. chest */

/**
 * The smallest size whose garment chest (measured flat, so doubled) leaves at least `ease` cm over the body.
 * @param {number} chestCm the visitor's chest, measured round
 * @param {string[]} sizes in order, smallest first
 * @param {Record<string, number>} flatChest size → flat chest in cm
 * @param {number} ease room the brand wants over the body, in cm
 * @returns {string|null} null when even the largest is too small
 */
export function sizeForChest(chestCm, sizes, flatChest, ease) {
  if (!Number.isFinite(chestCm) || chestCm <= 0) return null;
  return sizes.find((s) => Number.isFinite(flatChest[s]) && flatChest[s] * 2 - ease >= chestCm) ?? null;
}

/**
 * Whether a body measurement is believable (60–160 cm round the chest); anything else gets a gentle "check that".
 * @param {number} chestCm
 */
export function plausibleChest(chestCm) {
  return Number.isFinite(chestCm) && chestCm >= 60 && chestCm <= 160;
}

/**
 * Where a value falls on the brand's chart, as a position between sizes: 0 is the middle of the first size's range,
 * 1 the middle of the second's, 1.4 most of the way from the second to the third. Below the chart -1, above it n.
 * @param {number} v @param {[number, number][]} ranges in size order @returns {number}
 */
export function chartPosition(v, ranges) {
  const n = ranges.length;
  if (v < ranges[0][0] - (ranges[0][1] - ranges[0][0]) / 2) return -1;
  if (v > ranges[n - 1][1] + (ranges[n - 1][1] - ranges[n - 1][0]) / 2) return n;
  for (let i = 0; i < n; i++) {
    const [lo, hi] = ranges[i];
    // A value inside a size's own range stays that size: the top of the last range is still the last size, not "above".
    if (v <= hi) return Math.max(i - 0.5, Math.min(i + (i === n - 1 ? 0.49 : 0.5), i + (v - lo) / (hi - lo || 1) - 0.5));
    if (i === n - 1) return i + 0.5;
  }
  return n;
}

/** "5 ft 11" → cm, "11 st 8" → kg. @param {number} ft @param {number} inch */
export const feetToCm = (ft, inch) => Math.round((ft * 12 + (inch || 0)) * 2.54);
/** @param {number} st @param {number} lb */
export const stoneToKg = (st, lb) => Math.round((st * 14 + (lb || 0)) * 0.4536);

/**
 * A size from what the customer knows: height, weight, the size they wear in a kind of brand, how they like it to
 * sit, and their chest if they have a tape. Uses only the brand's own chart (`site.sizeGuide`); every reason it gives
 * is one of those answers read against that chart.
 * @param {{ height?: number, weight?: number, chest?: number, usual?: string, shift?: number, prefer?: "close"|"regular"|"roomy" }} a
 * @param {{ sizes: { size: string, height: [number, number], weight: [number, number], chest?: [number, number] }[] }} guide
 * @returns {{ size: string|null, beyond: "below"|"above"|null, reasons: string[], split: boolean } | null}
 */
export function findSize(a, guide) {
  const rows = guide.sizes;
  const names = rows.map((r) => r.size);
  const n = rows.length;
  const at = (/** @type {number} */ x) => names[Math.max(0, Math.min(n - 1, Math.round(x)))];
  /** @type {{ pos: number, w: number, say: string }[]} */ const sig = [];
  const ok = (/** @type {any} */ v, lo = 0, hi = Infinity) => Number.isFinite(v) && v >= lo && v <= hi;
  if (ok(a.height, 120, 230)) { const p = chartPosition(/** @type {number} */ (a.height), rows.map((r) => r.height)); sig.push({ pos: p, w: 1, say: `Height ${a.height} cm: ${posWords(p, names)}` }); }
  if (ok(a.weight, 35, 200)) { const p = chartPosition(/** @type {number} */ (a.weight), rows.map((r) => r.weight)); sig.push({ pos: p, w: 1, say: `Weight ${a.weight} kg: ${posWords(p, names)}` }); }
  if (ok(a.chest, 60, 160) && rows.every((r) => r.chest)) { const p = chartPosition(/** @type {number} */ (a.chest), rows.map((r) => /** @type {[number, number]} */ (r.chest))); sig.push({ pos: p, w: 3, say: `Chest ${a.chest} cm: ${posWords(p, names)}` }); }
  const ui = a.usual ? names.indexOf(a.usual) : -1;
  if (ui >= 0) { const p = ui + (a.shift ?? 0); sig.push({ pos: p, w: 1.5, say: a.shift ? `You wear ${a.usual} there, which is ${p < 0 ? `smaller than ${names[0]}` : p >= n ? `larger than ${names[n - 1]}` : names[p]} here` : `You wear ${a.usual} there, which is ${a.usual} here too` }); }
  if (!sig.length) return null;
  const avg = sig.reduce((t, s) => t + s.pos * s.w, 0) / sig.reduce((t, s) => t + s.w, 0);
  const nudge = a.prefer === "close" ? -0.3 : a.prefer === "roomy" ? 0.3 : 0;
  const x = Math.round(avg + nudge);
  const reasons = sig.map((s) => s.say);
  if (nudge && Math.round(avg) !== x) reasons.push(a.prefer === "close" ? "You like it closer, so the smaller of the two" : "You like room over a layer, so the larger of the two");
  const rounded = sig.map((s) => Math.round(s.pos));
  const split = Math.max(...rounded) - Math.min(...rounded) >= 2;
  if (x < 0) return { size: null, beyond: "below", reasons, split };
  if (x >= n) return { size: null, beyond: "above", reasons, split };
  return { size: at(x), beyond: null, reasons, split };
}

/** @param {number} p @param {string[]} names */
function posWords(p, names) {
  if (p < 0) return `below ${names[0]} on our chart`;
  if (p >= names.length) return `above ${names[names.length - 1]} on our chart`;
  const lo = Math.floor(p + 0.0001), f = p - lo;
  if (f > 0.35 && f < 0.65 && lo + 1 < names.length) return `between ${names[lo]} and ${names[lo + 1]}`;
  const at = Math.round(p);
  if (at >= names.length) return `above ${names[names.length - 1]} on our chart`;
  return `${names[Math.max(0, at)]} on our chart`;
}
