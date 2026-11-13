// @ts-check
/**
 * Where the sun falls: a rectangular back garden behind a house, with a fence or wall on the other three sides. For a
 * month, it works out how many hours of direct sun each square metre gets on the 21st, and at a chosen time which parts
 * are in shadow. The house and boundaries are the only things that cast shade (no trees, no neighbours' buildings), and
 * the page says so. The sun's position is the shared NOAA calculation (src/core/lib/sun.js).
 *
 * Garden coordinates, in metres: x runs across the garden (0 = left looking out from the house), y runs away from the
 * house (0 = the back wall of the house, `length` = the far boundary). The garden "faces" the bearing you look along from
 * the house into the garden, so a south-facing garden has y pointing south.
 */
import { sunPosition } from "../../../core/lib/sun.js";
import { wallTimeToUtc } from "../../../core/lib/hours.js";

const RAD = Math.PI / 180;
/** The eight ways a garden can face, as bearings. */
export const FACINGS = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };
const POINTS = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
/** The sun counts once it is this high: lower than that, a fence two gardens away hides it. */
const LOW = 3;
/** How deep the house is behind its back wall (only its shadow matters). */
const HOUSE_DEPTH = 9;

/** "south-west" for a bearing. @param {number} az */
export const compass = (az) => POINTS[Math.round((((az % 360) + 360) % 360) / 45) % 8];

/**
 * @typedef {{ width: number, length: number, house: number, fence: number }} Garden metres
 * @typedef {[number, number]} Pt
 */

/** Which way shadows run across the garden (a unit vector in garden coordinates). @param {number} azimuth @param {number} facing */
export function shadowDir(azimuth, facing) {
  const rel = (azimuth - facing) * RAD;
  return /** @type {Pt} */ ([-Math.sin(rel), -Math.cos(rel)]);
}

/** The tops of everything that casts shade: the house as a box, the three boundaries as lines. @param {Garden} g */
export function casters(g) {
  const { width: w, length: l } = g;
  return [
    { pts: /** @type {Pt[]} */ ([[0, -HOUSE_DEPTH], [w, -HOUSE_DEPTH], [w, 0], [0, 0]]), h: g.house },
    { pts: /** @type {Pt[]} */ ([[0, 0], [0, l]]), h: g.fence },
    { pts: /** @type {Pt[]} */ ([[w, 0], [w, l]]), h: g.fence },
    { pts: /** @type {Pt[]} */ ([[0, l], [w, l]]), h: g.fence },
  ];
}

/** Convex hull, anticlockwise (Andrew's monotone chain). @param {Pt[]} pts @returns {Pt[]} */
export function hull(pts) {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (/** @type {Pt} */ o, /** @type {Pt} */ a, /** @type {Pt} */ b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  /** @type {Pt[]} */ const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}

/**
 * The ground shadows at one moment: one convex polygon per caster (the caster's top and its copy slid along the
 * shadow by height ÷ tan(elevation)). Empty when the sun is too low to count, which callers treat as all shade.
 * @param {{ elevation: number, azimuth: number }} sun @param {number} facing @param {Garden} g @returns {Pt[][]}
 */
export function shadows(sun, facing, g) {
  if (sun.elevation <= LOW) return [];
  const [dx, dy] = shadowDir(sun.azimuth, facing);
  const k = 1 / Math.tan(sun.elevation * RAD);
  return casters(g).map((c) => hull([...c.pts, ...c.pts.map(([x, y]) => /** @type {Pt} */ ([x + dx * c.h * k, y + dy * c.h * k]))]));
}

/** Inside a convex anticlockwise polygon (edges count as inside). @param {Pt} p @param {Pt[]} poly */
export function inside(p, poly) {
  if (poly.length < 3) return false;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    if ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) < -1e-9) return false;
  }
  return true;
}

/** Is a point of the garden in sun? @param {Pt} p @param {{ elevation: number }} sun @param {Pt[][]} shade */
export const lit = (p, sun, shade) => sun.elevation > LOW && !shade.some((s) => inside(p, s));

/**
 * The garden as a grid of cells about a metre square, sampled at their centres.
 * @param {Garden} g @returns {{ nx: number, ny: number, cw: number, ch: number, centre: (i: number, j: number) => Pt }}
 */
export function grid(g) {
  const nx = Math.max(4, Math.min(24, Math.round(g.width))), ny = Math.max(4, Math.min(40, Math.round(g.length)));
  const cw = g.width / nx, ch = g.length / ny;
  return { nx, ny, cw, ch, centre: (i, j) => [(i + 0.5) * cw, (j + 0.5) * ch] };
}

/**
 * Hours of direct sun for every cell on the 21st of a month, in the studio's time zone, sampled every `step` minutes.
 * @param {Garden} g @param {number} facing @param {{ lat: number, lng: number, tz: string }} at @param {number} year @param {number} month 1–12
 * @param {number} [step] minutes
 * @returns {{ nx: number, ny: number, hours: number[] }} hours[j * nx + i], j = 0 by the house
 */
export function sunHours(g, facing, at, year, month, step = 20) {
  const gr = grid(g);
  const hours = new Array(gr.nx * gr.ny).fill(0);
  for (let min = 4 * 60; min <= 22 * 60; min += step) {
    const sun = sunPosition(wallTimeToUtc({ year, month, day: 21, hour: Math.floor(min / 60), minute: min % 60 }, at.tz), at.lat, at.lng);
    if (sun.elevation <= LOW) continue;
    const sh = shadows(sun, facing, g);
    for (let j = 0; j < gr.ny; j++) for (let i = 0; i < gr.nx; i++) if (lit(gr.centre(i, j), sun, sh)) hours[j * gr.nx + i] += step / 60;
  }
  return { nx: gr.nx, ny: gr.ny, hours: hours.map((h) => Math.round(h * 10) / 10) };
}

/** Full sun is six hours or more on a summer's day, part shade three to six, shade under three (the RHS's terms). @param {number} h */
export const lightOf = (h) => (h >= 6 ? "sun" : h >= 3 ? "part" : "shade");

/**
 * The garden in thirds: by the house, the middle, the far end; and the left and right edges. Average hours each.
 * @param {{ nx: number, ny: number, hours: number[] }} s
 */
export function parts(s) {
  const avg = (/** @type {(i: number, j: number) => boolean} */ f) => {
    let t = 0, n = 0;
    for (let j = 0; j < s.ny; j++) for (let i = 0; i < s.nx; i++) if (f(i, j)) { t += s.hours[j * s.nx + i]; n++; }
    return n ? Math.round((t / n) * 2) / 2 : 0;
  };
  const third = s.ny / 3, side = Math.max(1, Math.floor(s.nx / 4));
  return {
    near: avg((i, j) => j < third), middle: avg((i, j) => j >= third && j < 2 * third), far: avg((i, j) => j >= 2 * third),
    left: avg((i) => i < side), right: avg((i) => i >= s.nx - side),
  };
}

/** "about 7 hours", "about half an hour", "no direct sun". @param {number} h */
export function hoursWords(h) {
  if (h < 0.25) return "no direct sun";
  if (h < 0.75) return "about half an hour";
  const r = Math.round(h * 2) / 2;
  return `about ${Number.isInteger(r) ? r : r.toFixed(1)} ${r === 1 ? "hour" : "hours"}`;
}

/**
 * The plain answer under the plan: where the sun falls on the 21st of that month.
 * @param {ReturnType<typeof parts>} p @param {string} monthName
 */
export function dayWords(p, monthName) {
  const ends = p.far >= p.near
    ? `On 21 ${monthName} the far end gets ${hoursWords(p.far)} of sun, the part by the house ${hoursWords(p.near)}.`
    : `On 21 ${monthName} the part by the house gets ${hoursWords(p.near)} of sun, the far end ${hoursWords(p.far)}.`;
  const diff = Math.abs(p.left - p.right);
  const side = diff >= 1 ? ` The ${p.left > p.right ? "left" : "right"}-hand border gets ${hoursWords(diff)} more.` : "";
  return ends + side;
}

/** At one moment: where the sun is and how much of the garden is in it. @param {{ elevation: number, azimuth: number }} sun @param {number} share 0–1 */
export function momentWords(sun, share) {
  if (sun.elevation <= 0) return "The sun has set.";
  if (sun.elevation <= LOW) return `The sun is on the horizon in the ${compass(sun.azimuth)}; the garden is in shade.`;
  const pct = Math.round(share * 10) * 10;
  return `The sun is ${Math.round(sun.elevation)}° up in the ${compass(sun.azimuth)}. ${pct === 0 ? "The whole garden is in shade" : pct === 100 ? "The whole garden is in sun" : `About ${pct}% of the garden is in sun`}.`;
}

/** Share of the garden in sun at one moment. @param {Garden} g @param {{ elevation: number, azimuth: number }} sun @param {number} facing */
export function sunnyShare(g, sun, facing) {
  const gr = grid(g), sh = shadows(sun, facing, g);
  let n = 0;
  for (let j = 0; j < gr.ny; j++) for (let i = 0; i < gr.nx; i++) if (lit(gr.centre(i, j), sun, sh)) n++;
  return n / (gr.nx * gr.ny);
}

/** The sun at a time on the 21st. @param {{ lat: number, lng: number, tz: string }} at @param {number} year @param {number} month @param {number} minutes */
export function sunAt(at, year, month, minutes) {
  return sunPosition(wallTimeToUtc({ year, month, day: 21, hour: Math.floor(minutes / 60), minute: minutes % 60 }, at.tz), at.lat, at.lng);
}

/**
 * Two ways to draw the same garden: from above (the plan) and from above and behind the house at an angle (the 3D view,
 * a fixed axonometric, so it needs no 3D library). Returns a function from garden metres and height to drawing units.
 * @param {"plan"|"3d"} view @param {Garden} g @returns {(x: number, y: number, z?: number) => Pt}
 */
export function projector(view, g) {
  if (view === "plan") return (x, y) => [x, g.length - y];
  // an oblique view from above and behind the house: the garden runs up and slightly right, heights rise straight up
  return (x, y, z = 0) => [x + y * 0.42, (g.length - y) * 0.6 - z];
}

/** "6 am", "1:30 pm" @param {number} minutes */
export function clock(minutes) {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return `${((h + 11) % 12) + 1}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "am" : "pm"}`;
}
