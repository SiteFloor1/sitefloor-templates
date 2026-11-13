// @ts-check
/**
 * The loft visualiser's arithmetic: the volume a rear dormer or a hip-to-gable adds to the model house's roof, worked
 * out from the same roof the 3D draws. It is arithmetic on a model, not a measured survey: the page says so, and the
 * allowance it is compared with lives in planning.js (GOV.UK, dated).
 *
 * The roof: ridge across the width, `rise` above the eaves, half the house's `depth` from the eaves to the ridge on
 * each side. A terrace's ends are party walls (gables). A semi is hipped at its outer end and a detached house at both;
 * the hips are equal-pitch, so each one runs in half the depth along the ridge.
 */
import { HOUSES, WALL } from "./extension.js";

/** The model house's roof, shared with house-3d.js so the drawing and the numbers are one roof. */
export const ROOF_MODEL = {
  depth: 8.5,       // front wall to back wall, metres
  rise: 2.4,        // eaves to ridge, metres
  dormerDrop: 0.1,  // a dormer's flat roof sits this far below the ridge
  eavesBack: 0.2,   // the dormer's face this far back from the eaves along the slope (planning.js LOFT.eaves)
};

/** How many hipped ends each house has before any work. */
export const HIPS = { terrace: 0, semi: 1, detached: 2 };

/** The conversions the loft page offers. */
export const LOFTS = {
  dormer: { label: "Rear dormer", said: "a rear dormer" },
  hip: { label: "Hip-to-gable", said: "a hip-to-gable" },
  both: { label: "Both", said: "a hip-to-gable and a rear dormer" },
};

/** @typedef {keyof typeof LOFTS} Loft @typedef {import("./extension.js").House} House */

const run = () => ROOF_MODEL.depth / 2;
const pitch = () => Math.atan2(ROOF_MODEL.rise, run());
const round1 = (/** @type {number} */ n) => Math.round(n * 10) / 10;

/** The cross-section a dormer adds, in m²: its box less the roof it replaces, from the ridge to its face. */
export function dormerSection() {
  const R = run(), r = ROOF_MODEL.rise, h = r - ROOF_MODEL.dormerDrop;
  const s0 = R * (1 - h / r);                                // where the dormer's roof meets the slope
  const a = R - ROOF_MODEL.eavesBack * Math.cos(pitch());    // the dormer's face, back from the eaves
  return (h - r) * (a - s0) + (r / (2 * R)) * (a * a - s0 * s0);
}

/** The volume one hip-to-gable adds, in m³: a gable end less the hipped end (a pyramid) it replaces. */
export function gableVolume() {
  const L = run();
  return (L * ROOF_MODEL.depth * ROOF_MODEL.rise) / 6;
}

/** @param {string} house */
const spec = (house) => HOUSES[/** @type {House} */ (house)] ?? HOUSES.terrace;
/** @param {string} house */
const hips = (house) => HIPS[/** @type {House} */ (house)] ?? 0;

/**
 * How wide a dormer can be on this roof: the ridge's length less the walls, with hips still in place unless the
 * conversion turns them into gables. Null when there is no room for one (under 1.2 m).
 * @param {string} house @param {string} loft
 * @returns {{ min: number, max: number, step: number } | null}
 */
export function dormerRange(house, loft) {
  if (loft === "hip") return null;
  const hipped = loft === "both" ? 0 : hips(house);
  const max = Math.floor((spec(house).width - 2 * WALL - hipped * run()) * 10) / 10;
  return max >= 1.2 ? { min: 1.2, max, step: 0.1 } : null;
}

/** The conversions this house can have on the model. @param {string} house @returns {Loft[]} */
export function loftsFor(house) {
  return /** @type {Loft[]} */ (Object.keys(LOFTS)).filter((k) => (k === "dormer" ? dormerRange(house, k) !== null : hips(house) > 0));
}

/**
 * The volume added by the chosen conversion, in m³ (unrounded; the words round it).
 * @param {string} house @param {string} loft @param {number} width the dormer's width, metres
 */
export function loftVolume(house, loft, width) {
  const range = dormerRange(house, loft);
  const w = range ? Math.min(range.max, Math.max(range.min, width)) : 0;
  const dormer = w * dormerSection();
  const gable = loft === "dormer" ? 0 : hips(house) * gableVolume();
  return { dormer, gable, total: dormer + gable, width: round1(w) };
}

/** A start the page and the model share: both conversions where the house allows them, the dormer at three quarters of its room. @param {string} house */
export function loftStart(house) {
  const can = loftsFor(house);
  const loft = can.includes("both") ? "both" : (can[0] ?? "dormer");
  const range = dormerRange(house, loft);
  return { house, loft, width: range ? round1(Math.max(range.min, range.max * 0.75)) : 0, show: "after" };
}

/** The meter under the loft guide runs to 1.6 times the allowance; the allowance sits at 62.5%. */
export const METER_SCALE = 1.6;
/** Where a volume sits on the meter, 0 to 100. @param {number} total @param {number} allowance */
export const meterAt = (total, allowance) => Math.round(Math.min(100, Math.max(0, (total / (allowance * METER_SCALE)) * 100)) * 10) / 10;
