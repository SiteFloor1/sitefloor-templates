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

/**
 * Lays the empty-hall render over each free bay (clipped to the bay), so the picture always shows the bays free
 * today as empty and the let ones with their covered cars.
 * @param {Element} g @param {any} hall @param {any} d @param {{ viewBox: string, map: (x: number, y: number) => number[] }} m @param {string} href
 */
export function freePatches(g, hall, d, m, href) {
  const [, , w, h] = m.viewBox.split(" ").map(Number);
  const el = (/** @type {string} */ n, /** @type {Record<string, string|number>} */ a, /** @type {Element} */ p) => {
    const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, String(a[k])); p.append(e); return e;
  };
  const defs = el("defs", {}, g);
  const clip = el("clipPath", { id: `${g.closest("svg")?.getAttribute("data-clip") ?? "ga"}-free` }, defs);
  let any = false;
  for (const row of hall.rows) for (const b of row.bays) {
    if (!b.free) continue;
    const q = d.rects[b.n], a = m.map(q.x0 + 0.05, q.north ? hall.depth : hall.bayDepth), c = m.map(q.x1 - 0.05, q.north ? hall.depth - hall.bayDepth : 0);
    el("rect", { x: Math.min(a[0], c[0]), y: Math.min(a[1], c[1]), width: Math.abs(c[0] - a[0]), height: Math.abs(c[1] - a[1]) }, clip);
    any = true;
  }
  if (any) el("image", { href, x: 0, y: 0, width: w, height: h, preserveAspectRatio: "none", "clip-path": `url(#${clip.getAttribute("id")})` }, g);
}
