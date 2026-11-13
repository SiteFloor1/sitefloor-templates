// @ts-check
/**
 * Barber-chart head diagrams: a side profile (facing right) drawn as ink line
 * art, with hair, fade, beard and labels. Returns an SVG string built only from
 * numbers and fixed labels; no user text is interpolated.
 *
 * Coordinates are in a 240-unit-wide viewBox. Geometry is kept in named
 * objects (ADULT, CHILD) so the drawing can be adjusted without touching logic.
 */

// Colours come from the look through CSS classes (dg-* in core.css, tokens --chart-*),
// so the same diagram suits a dark or a light look. No colour values live here.
const STOP_INK = 'class="dg-stop-ink"';
const STOP_TAN = 'class="dg-stop-tan"'; // stubble where a fade blends to skin

/** @typedef {"none"|"line"|"taper"|"burst"|"drop"} FadeType */
/**
 * @typedef {object} ProfileOptions
 * @property {string} id            unique per page (used for gradient ids)
 * @property {FadeType} [fade]
 * @property {number} [fadeTop]     y where a "line" fade starts
 * @property {number} [length]      hair thickness on top, in viewBox units
 * @property {boolean} [kid]
 * @property {boolean} [buzz]       stubble all over instead of solid hair
 * @property {boolean} [beard]
 * @property {boolean} [towel]      hot-towel shave: beard drawn as a dashed outline
 * @property {boolean} [showFadeLine]
 * @property {string} [lengthLabel]
 * @property {string} [label]       accessible name
 */

/** @param {number} L hair length */
const ADULT = (L) => ({
  head: "M62 182 C44 160 34 128 38 100 C42 58 78 30 120 28 C156 26 178 44 184 70 C189 88 193 102 192 112 C191 118 186 120 186 124 C190 136 204 146 214 156 C217 160 212 166 204 166 C200 166 197 166 196 168 C197 172 200 176 199 180 C198 183 194 184 194 186 C197 188 199 192 196 196 C193 199 189 200 190 204 C194 210 198 218 194 226 C190 232 182 234 174 233",
  skinClose: " C168 233 162 231 158 230 C160 248 166 266 170 290 L64 290 C66 252 66 214 62 182 Z",
  hair: `M183 62 C178 ${40 - L * 0.5} 156 ${24 - L} 120 ${24 - L} C76 ${26 - L} ${36 - L * 0.6} ${56 - L * 0.4} ${32 - L * 0.6} 100 C${30 - L * 0.4} 130 40 160 56 184 L68 186 C80 182 88 172 92 160 C94 140 96 124 104 118 C112 112 122 114 126 122 L128 152 L138 152 C138 130 142 110 152 98 C162 86 174 76 183 62 Z`,
  jaw: "M174 233 C158 230 138 224 126 214 C120 206 118 196 118 186",
  neck: "M158 230 C160 248 166 266 170 290 M62 182 C66 214 66 252 64 290",
  ear: "M118 124 C104 116 94 126 96 142 C98 158 106 168 118 168 C122 168 124 164 122 160 M112 134 C106 136 106 148 112 152",
  brow: "M166 113 C174 109 183 109 190 112",
  eye: "M172 128 C176 126 180 126 184 128",
  nose: "M199 158 C203 157 206 160 204 163",
  beard: "M128 150 L140 150 C150 170 166 184 186 186 C190 186 196 187 197 190 C198 194 194 198 190 202 C194 210 198 218 194 226 C190 232 182 235 174 234 C158 231 138 224 126 214 C120 204 118 190 118 180 C120 166 124 156 128 150 Z",
  crown: { x: 120, y: 28 },
  burst: { x: 110, y: 148 },
  drop: { x1: 140, y1: 86, x2: 70, y2: 186 },
  height: 300,
  browWidth: 3.6,
});

/** @param {number} L hair length */
const CHILD = (L) => ({
  head: "M70 180 C50 162 40 136 42 110 C44 66 76 38 118 36 C156 34 178 56 182 86 C184 100 184 112 184 120 C188 126 190 132 192 138 C196 144 198 148 197 151 C195 154 190 155 186 155 C187 158 189 161 188 164 C187 167 184 168 184 170 C186 172 187 175 185 178 C183 181 182 184 182 188 C181 194 176 198 168 199",
  skinClose: " C162 199 158 199 156 199 C156 220 158 240 160 268 L70 268 C72 236 72 206 70 180 Z",
  hair: `M187 108 C190 84 178 ${48 - L} 142 ${32 - L} C110 ${24 - L} 70 ${32 - L} ${48 - L * 0.5} 74 C${36 - L * 0.4} 98 38 140 58 176 L72 180 C82 176 90 168 94 158 C96 144 100 132 108 128 C116 124 124 128 126 134 L128 150 L136 150 C136 132 140 118 150 110 C158 101 168 98 177 101 C182 103 185 105 187 108 Z`,
  jaw: "M168 199 C154 200 140 198 130 192 C126 186 124 178 124 170",
  neck: "M156 199 C156 220 158 240 160 268 M70 180 C72 206 72 236 70 268",
  ear: "M122 134 C110 128 102 136 103 148 C104 160 110 166 120 165 C123 165 124 162 123 160 M116 142 C111 144 111 152 115 155",
  brow: "M162 122 C168 119 175 119 180 121",
  eye: "M166 134 C169 132 173 132 176 134",
  nose: "M188 148 C191 147 193 149 192 151",
  beard: "",
  crown: { x: 118, y: 36 },
  burst: { x: 112, y: 148 },
  drop: { x1: 140, y1: 96, x2: 72, y2: 184 },
  height: 280,
  browWidth: 2.8,
});

/** Fade heights in viewBox units, per head type. */
export const FADE_TOP = {
  adult: { low: 130, mid: 108, high: 84 },
  child: { low: 138, mid: 120, high: 100 },
};

/** @param {number} n */
const r3 = (n) => n.toFixed(3);

/**
 * @param {string} gid @param {FadeType} fade @param {number} top @param {ReturnType<typeof ADULT>} G @param {boolean} buzz
 */
function hairFill(gid, fade, top, G, buzz) {
  if (buzz) return `<linearGradient id="${gid}"><stop offset="0" class="dg-stop-buzz" stop-opacity=".55"/></linearGradient>`;
  if (fade === "none") return `<linearGradient id="${gid}"><stop offset="0" ${STOP_INK}/></linearGradient>`;
  if (fade === "line") {
    return `<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="200" gradientUnits="userSpaceOnUse">`
      + `<stop offset="${r3((top - 4) / 200)}" ${STOP_INK}/>`
      + `<stop offset="${r3((top + 14) / 200)}" ${STOP_TAN} stop-opacity=".8"/>`
      + `<stop offset="${r3(Math.min(1, (top + 40) / 200))}" ${STOP_TAN} stop-opacity="0"/></linearGradient>`;
  }
  if (fade === "taper") {
    return `<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="200" gradientUnits="userSpaceOnUse">`
      + `<stop offset=".72" ${STOP_INK}/><stop offset=".82" ${STOP_TAN} stop-opacity=".8"/><stop offset=".94" ${STOP_TAN} stop-opacity=".1"/></linearGradient>`;
  }
  if (fade === "burst") {
    return `<radialGradient id="${gid}" cx="${G.burst.x}" cy="${G.burst.y}" r="62" gradientUnits="userSpaceOnUse">`
      + `<stop offset=".32" ${STOP_TAN} stop-opacity="0"/><stop offset=".62" ${STOP_TAN} stop-opacity=".8"/><stop offset=".82" ${STOP_INK}/></radialGradient>`;
  }
  return `<linearGradient id="${gid}" x1="${G.drop.x1}" y1="${G.drop.y1}" x2="${G.drop.x2}" y2="${G.drop.y2}" gradientUnits="userSpaceOnUse">`
    + `<stop offset=".3" ${STOP_INK}/><stop offset=".55" ${STOP_TAN} stop-opacity=".8"/><stop offset=".85" ${STOP_TAN} stop-opacity="0"/></linearGradient>`;
}

/** @param {string} text */
const clean = (text) => text.replace(/[<>&"]/g, "");

/** Stubble dots where hair fades to skin (or everywhere, for a buzz cut). @param {FadeType} fade @param {boolean} buzz @param {number} top @param {string} sid @param {string} cid */
function stubbleLayer(fade, buzz, top, sid, cid) {
  if (fade === "none" && !buzz) return "";
  const y = buzz ? 0 : fade === "line" ? top + 2 : 90;
  return `<g clip-path="url(#${cid})"><rect x="0" y="${y}" width="240" height="${buzz ? 220 : 110}" fill="url(#${sid})" opacity="${buzz ? 0.9 : 0.5}"/></g>`;
}

/** Solid beard, or a dashed outline for a hot-towel shave. @param {string} d @param {boolean} towel */
function beardLayer(d, towel) {
  return towel
    ? `<path d="${d}" class="dg-line" fill="none" stroke-width="1.8" stroke-dasharray="3 4" opacity=".55"/>`
    : `<path d="${d}" class="dg-ink" opacity=".9"/>`;
}

/** @param {number} top */
function fadeLineLayer(top) {
  return `<line x1="14" x2="226" y1="${top}" y2="${top}" class="dg-guide" stroke-width="1.6" stroke-dasharray="5 5"/><text x="14" y="${top - 7}" class="dg-label">FADE LINE</text>`;
}

/** Vertical marker on the crown showing length on top. @param {{x:number,y:number}} crown @param {number} L @param {string} label */
function lengthLayer(crown, L, label) {
  const lift = Math.max(L, 0);
  return `<line x1="${crown.x}" x2="${crown.x}" y1="${crown.y + 2}" y2="${crown.y - 6 - lift}" class="dg-guide" stroke-width="1.6"/><text x="${crown.x + 8}" y="${crown.y - 10 - lift}" class="dg-label">${clean(label)}</text>`;
}

/**
 * @param {ProfileOptions} o
 * @returns {string} an <svg> element
 */
export function profileSVG(o) {
  const kid = Boolean(o.kid);
  const buzz = Boolean(o.buzz);
  const L = buzz ? -3 : Math.max(0, o.length ?? 8);
  const fade = buzz ? "none" : (o.fade ?? "line");
  const top = o.fadeTop ?? FADE_TOP[kid ? "child" : "adult"].mid;
  const G = kid ? CHILD(L) : ADULT(L);
  const gid = `g-${o.id}`, sid = `s-${o.id}`, cid = `c-${o.id}`;
  const stroke = (/** @type {string} */ d, w = 3.4) => `<path d="${d}" class="dg-line" fill="none" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

  const stubble = stubbleLayer(fade, buzz, top, sid, cid);
  const beard = o.beard && !kid ? beardLayer(G.beard, Boolean(o.towel)) : "";
  const fadeLine = fade === "line" && o.showFadeLine !== false ? fadeLineLayer(top) : "";
  const lengthMark = o.lengthLabel ? lengthLayer(G.crown, L, o.lengthLabel) : "";
  const viewTop = -Math.max(L, 6) - 22;

  return `<svg class="diagram" viewBox="0 ${viewTop} 240 ${G.height - viewTop}" role="img" aria-label="${clean(o.label ?? "Haircut diagram")}">`
    + `<defs>${hairFill(gid, fade, top, G, buzz)}`
    + `<pattern id="${sid}" width="3" height="3" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="${buzz ? 0.75 : 0.6}" class="dg-ink" opacity="${buzz ? 0.75 : 0.5}"/></pattern>`
    + `<clipPath id="${cid}"><path d="${G.hair}"/></clipPath></defs>`
    + `<path d="${G.head}${G.skinClose}" class="dg-skin"/>`
    + `<path d="${G.hair}" fill="url(#${gid})"/>`
    + stubble + beard
    + stroke(G.head) + stroke(G.jaw) + stroke(G.neck)
    + `<path d="${G.ear}" class="dg-skin dg-line" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
    + stroke(G.brow, G.browWidth) + stroke(G.eye, 2.6) + stroke(G.nose, 2)
    + fadeLine + lengthMark
    + "</svg>";
}
