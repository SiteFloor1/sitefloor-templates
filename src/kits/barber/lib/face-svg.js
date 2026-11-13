// @ts-check
/**
 * Front-view face-shape diagrams for the style guide (rendered at build time).
 * Colours come from the look through CSS classes (dg-* in core.css, tokens --face-*),
 * so the diagrams work on dark and light looks alike. No colour values live here.
 */

/**
 * @typedef {object} FaceShape
 * @property {number} forehead  width at the forehead
 * @property {number} cheeks    width at the cheekbones
 * @property {number} jaw       width at the jaw
 * @property {number} length    face length
 * @property {number} chin      chin width
 * @property {"crop"|"quiff"|"part"|"fringe"|"textured"} hair
 */

/**
 * Smooth closed curve through points (Catmull-Rom converted to cubic Béziers).
 * @param {[number, number][]} pts
 */
export function smoothClosedPath(pts) {
  const n = pts.length;
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return `${d}Z`;
}

const HAIR_HEIGHT = { crop: 20, quiff: 42, part: 16, fringe: 12, textured: 26 };

/**
 * @param {FaceShape} s
 * @param {string} name accessible name, e.g. "Oval face"
 */
export function faceSVG(s, name) {
  const cx = 100, top = 24, yForehead = 64, yCheek = 112;
  const yJaw = top + s.length * 0.78, yChin = top + s.length;
  /** @type {[number, number][]} */
  const right = [[cx + s.forehead / 2, yForehead], [cx + s.cheeks / 2, yCheek], [cx + s.jaw / 2, yJaw], [cx + s.chin / 2, yChin - 4]];
  /** @type {[number, number][]} */
  const left = right.map(([x, y]) => /** @type {[number, number]} */ ([2 * cx - x, y])).reverse();
  const outline = smoothClosedPath([[cx, top], ...right, [cx, yChin], ...left]);

  const h = HAIR_HEIGHT[s.hair];
  const fl = cx - s.forehead / 2, fr = cx + s.forehead / 2;
  let hair = `M${fl - 6} ${yForehead + 18} C${fl - 10} ${top - h * 0.4} ${cx - 30} ${top - h} ${cx} ${top - h} C${cx + 30} ${top - h} ${fr + 10} ${top - h * 0.4} ${fr + 6} ${yForehead + 18} C${fr - 2} ${yForehead - 2} ${cx + 20} ${top + 8} ${cx} ${top + 10} C${cx - 20} ${top + 8} ${fl + 2} ${yForehead - 2} ${fl - 6} ${yForehead + 18}Z`;
  if (s.hair === "fringe" || s.hair === "textured") {
    hair += ` M${fl + 4} ${yForehead - 6} C${cx - 20} ${yForehead + 14} ${cx + 10} ${yForehead + 10} ${fr - 6} ${yForehead - 4} L${fr - 10} ${top + 14} C${cx} ${top + 4} ${cx - 24} ${top + 8} ${fl + 8} ${top + 18}Z`;
  }
  if (s.hair === "part") hair += ` M${cx - 18} ${top - 2} L${cx - 14} ${top + 14}`;

  const guide = (/** @type {number} */ y, /** @type {number} */ w, /** @type {string} */ label) =>
    `<line x1="${cx - w / 2}" x2="${cx + w / 2}" y1="${y}" y2="${y}" class="dg-face-guide" stroke-width="1" stroke-dasharray="3 4" opacity=".7"/>`
    + `<text x="${cx + s.cheeks / 2 + 14}" y="${y + 3.5}" class="dg-face-label" font-size="9" font-weight="700">${label}</text>`;

  return `<svg class="face" viewBox="-12 -24 250 290" role="img" aria-label="${name.replace(/[<>&"]/g, "")}">`
    + `<path d="${outline}" class="dg-face" stroke-width="1.6" stroke-linejoin="round"/>`
    + `<ellipse cx="${cx - s.cheeks / 2 - 3}" cy="${yCheek - 6}" rx="7" ry="15" class="dg-cheek" stroke-width="1.4"/>`
    + `<ellipse cx="${cx + s.cheeks / 2 + 3}" cy="${yCheek - 6}" rx="7" ry="15" class="dg-cheek" stroke-width="1.4"/>`
    + `<path d="${hair}" class="dg-hair" fill-opacity=".9" stroke-width="1.2"/>`
    + guide(yForehead + 6, s.forehead, "Forehead") + guide(yCheek, s.cheeks, "Cheeks") + guide(yJaw, s.jaw, "Jaw")
    + `<line x1="${cx}" x2="${cx}" y1="${top}" y2="${yChin}" class="dg-axis" stroke-width=".8" stroke-dasharray="2 4"/>`
    + "</svg>";
}
