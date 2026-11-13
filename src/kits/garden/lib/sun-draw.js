// @ts-check
/**
 * Draws the sun study as SVG markup, from above (the plan) or in 3D (a fixed oblique view: no 3D library). Pure: the
 * same function draws the no-JavaScript picture at build time and the live one in the browser. Colours come from
 * classes only (gd-ss-*), so the look decides them.
 */
import { projector, grid, shadows, compass } from "./sun-study.js";

/** @typedef {import("./sun-study.js").Garden} Garden @typedef {import("./sun-study.js").Pt} Pt */

const HOUSE_DEPTH = 6; // drawn depth of the house (its shadow uses the full box in sun-study.js)
/** Hours of sun → one of seven tones. @param {number} h */
export const tone = (h) => (h < 1 ? 0 : h < 2 ? 1 : h < 3 ? 2 : h < 4.5 ? 3 : h < 6 ? 4 : h < 8 ? 5 : 6);
const f = (/** @type {number} */ n) => Math.round(n * 100) / 100;
const pts = (/** @type {Pt[]} */ p) => p.map(([x, y]) => `${f(x)},${f(y)}`).join(" ");

/** Back from a point on the drawing to the garden (on the ground). @param {"plan"|"3d"} view @param {Garden} g @param {Pt} p @returns {Pt} */
export function unproject(view, g, [X, Y]) {
  if (view === "plan") return [X, g.length - Y];
  const y = g.length - Y / 0.6;
  return [X - 0.42 * y, y];
}

/**
 * @param {{ g: Garden, facing: number, view: "plan"|"3d", hours: { nx: number, ny: number, hours: number[] },
 *   sun: { elevation: number, azimuth: number }|null, spot?: Pt|null, id?: string }} o
 * @returns {{ svg: string, viewBox: string }}
 */
export function drawGarden(o) {
  const { g, view } = o;
  const P = projector(view, g);
  const gr = grid(g);
  const id = o.id ?? "ss";
  /** @type {string[]} */ const out = [];
  /** @param {Pt[]} p3 */
  const poly = (p3, cls, z = 0) => `<polygon class="${cls}" points="${pts(p3.map(([x, y]) => P(x, y, z)))}"/>`;
  const W = g.width, L = g.length;
  // the garden's outline, used to clip shadows to the garden
  out.push(`<defs><clipPath id="${id}-clip"><polygon points="${pts([[0, 0], [W, 0], [W, L], [0, L]].map(([x, y]) => P(x, y)))}"/></clipPath></defs>`);
  // hours of sun, cell by cell
  out.push(`<g class="gd-ss-cells">`);
  for (let j = 0; j < gr.ny; j++) for (let i = 0; i < gr.nx; i++) {
    const x0 = i * gr.cw, y0 = j * gr.ch, h = o.hours.hours[j * gr.nx + i] ?? 0;
    out.push(poly([[x0, y0], [x0 + gr.cw, y0], [x0 + gr.cw, y0 + gr.ch], [x0, y0 + gr.ch]], `gd-ss-h${tone(h)}`));
  }
  out.push(`</g>`);
  // the shadows at the chosen hour
  if (o.sun) {
    const sh = o.sun.elevation > 3 ? shadows(o.sun, o.facing, g) : null;
    out.push(`<g class="gd-ss-shades" clip-path="url(#${id}-clip)">`);
    if (!sh) out.push(poly([[0, 0], [W, 0], [W, L], [0, L]], "gd-ss-shade"));
    else for (const s of sh) out.push(poly(s, "gd-ss-shade"));
    out.push(`</g>`);
  }
  // boundaries: lines from above, standing panels in 3D
  const fence = /** @type {[Pt, Pt][]} */ ([[[0, 0], [0, L]], [[0, L], [W, L]], [[W, L], [W, 0]]]);
  if (view === "plan") {
    out.push(`<polyline class="gd-ss-fence" points="${pts(fence.flat().map(([x, y]) => P(x, y)))}"/>`);
    out.push(poly([[0, -HOUSE_DEPTH], [W, -HOUSE_DEPTH], [W, 0], [0, 0]], "gd-ss-house"));
    out.push(`<text class="gd-ss-label" x="${f(W / 2)}" y="${f(L + HOUSE_DEPTH / 2)}" text-anchor="middle" dominant-baseline="middle">House</text>`);
  } else {
    // far fence first, then the sides, then the house in front: painter's order for this view
    for (const [a, b] of [fence[1], fence[0], fence[2]]) {
      const [p, q] = [a, b];
      out.push(`<polygon class="gd-ss-fence3" points="${pts([P(p[0], p[1], 0), P(q[0], q[1], 0), P(q[0], q[1], g.fence), P(p[0], p[1], g.fence)])}"/>`);
    }
    // the house is seen from behind and above, so it is drawn see-through: the garden by it stays visible
    const H = g.house, D = -HOUSE_DEPTH;
    out.push(`<polygon class="gd-ss-house-side" points="${pts([P(0, D, 0), P(W, D, 0), P(W, D, H), P(0, D, H)])}"/>`);
    out.push(`<polygon class="gd-ss-house-top" points="${pts([P(0, 0, H), P(W, 0, H), P(W, D, H), P(0, D, H)])}"/>`);
    out.push(`<polyline class="gd-ss-house-edge" points="${pts([P(0, 0, H), P(0, 0, 0), P(W, 0, 0), P(W, 0, H)])}"/>`);
  }
  // north, as the garden is turned: an arrow in the corner
  const rel = (-o.facing) * Math.PI / 180; // north in garden coordinates
  const nx = Math.sin(rel), ny = Math.cos(rel);
  const c = P(W + 2.2, L - 1.5);
  const tip = view === "plan" ? [c[0] + nx * 1.4, c[1] - ny * 1.4] : [c[0] + (nx + ny * 0.42) * 1.2, c[1] - ny * 0.6 * 1.2];
  out.push(`<g class="gd-ss-north"><line x1="${f(c[0])}" y1="${f(c[1])}" x2="${f(tip[0])}" y2="${f(tip[1])}"/><text x="${f(tip[0] + (tip[0] - c[0]) * 0.6)}" y="${f(tip[1] + (tip[1] - c[1]) * 0.6)}" text-anchor="middle" dominant-baseline="middle">N</text></g>`);
  if (o.spot) { const s = P(o.spot[0], o.spot[1]); out.push(`<circle class="gd-ss-spot" cx="${f(s[0])}" cy="${f(s[1])}" r="0.55"/>`); }
  // the drawing's bounds: the garden, the house and the north arrow, with a margin
  const corners = [[0, 0, 0], [W, 0, 0], [W, L, 0], [0, L, 0], [0, -HOUSE_DEPTH, 0], [W, -HOUSE_DEPTH, 0], [0, -HOUSE_DEPTH, g.house], [W, 0, g.house], [W, L, g.fence], [0, L, g.fence]]
    .map(([x, y, z]) => P(x, y, view === "3d" ? z : 0));
  corners.push([c[0] + 2, c[1] - 2], [c[0] + 2, c[1] + 2]);
  const xs = corners.map((p) => p[0]), ys = corners.map((p) => p[1]);
  const m = 1;
  const viewBox = `${f(Math.min(...xs) - m)} ${f(Math.min(...ys) - m)} ${f(Math.max(...xs) - Math.min(...xs) + 2 * m)} ${f(Math.max(...ys) - Math.min(...ys) + 2 * m)}`;
  return { svg: out.join(""), viewBox };
}

/** "Facing south-west" for the drawing's label. @param {number} facing */
export const facingLabel = (facing) => `Facing ${compass(facing)}`;
