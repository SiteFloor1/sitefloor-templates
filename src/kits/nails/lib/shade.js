// @ts-check
/**
 * The salon's shades and "Shade on your hand". Every shade (number, name, colour, system, finish) is the salon's own,
 * from site.json; nothing here invents one. The recolour keeps the photograph's own light: each nail pixel takes the
 * new colour at the brightness the photo had there, and the gloss highlights stay white. The same sum builds the demo's
 * pre-made shades (sitefloor-internal/docs/design/verrall-photos/build.py), so a recoloured photo and a pre-made one match.
 */

export const SYSTEMS = /** @type {const} */ ({ gel: "Gel", biab: "BIAB", polish: "Polish" });
export const FINISHES = /** @type {const} */ ({ cream: "cream", sheer: "sheer gloss", gloss: "high gloss", shimmer: "shimmer", chrome: "chrome", "cat-eye": "cat-eye", velvet: "velvet", matte: "matte", glitter: "glitter" });
export const FAMILIES = /** @type {const} */ ({ nude: "Nudes", pink: "Pinks", red: "Reds", berry: "Berries", brown: "Browns", dark: "Darks", pastel: "Pastels", white: "Whites", metallic: "Metallics" });

/** @typedef {{ id: string, no: number, name: string, hex: string, system: keyof typeof SYSTEMS, finish: keyof typeof FINISHES, family: keyof typeof FAMILIES, note?: string }} Shade */

/** "#E2B4AE" → [226, 180, 174], or null. @param {string} hex @returns {[number, number, number]|null} */
export function hexToRgb(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex ?? "");
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}

/** WCAG relative luminance, 0–1. @param {string} hex */
export function luminance(hex) {
  const c = hexToRgb(hex);
  if (!c) return 0;
  const [r, g, b] = c.map((v) => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The chip's two inks: near-black and white. For any colour one of them reaches 4.5:1. */
const INK_DARK = "#120E0B", INK_LIGHT = "#FFFFFF";

/** WCAG contrast ratio. @param {string} a @param {string} b */
export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Whether the Book chip in this shade takes white words (else near-black): whichever reads better. @param {string} hex */
export function isDarkShade(hex) {
  return contrast(hex, INK_LIGHT) > contrast(hex, INK_DARK);
}

/** The card's line, in the salon's words: "Gel, sheer gloss. Two coats, about three weeks." @param {Shade} s */
export function shadeLine(s) {
  return `${SYSTEMS[s.system]}, ${FINISHES[s.finish]}.${s.note ? ` ${s.note}` : ""}`;
}

/** "Petal (No. 14)" @param {Shade} s */
export function shadeName(s) {
  return `${s.name} (No. ${s.no})`;
}

/**
 * The median brightness of the nails in a photo (0–1), from a 256-step histogram so a phone does it in one pass.
 * @param {Uint8ClampedArray} px RGBA @param {Uint8ClampedArray} mask RGBA; the mask's red channel is the nail (255 = nail)
 */
export function nailBase(px, mask) {
  const hist = new Uint32Array(256);
  let n = 0;
  for (let i = 0; i < px.length; i += 4) {
    if (mask[i] < 128) continue;
    hist[Math.round(0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2])]++;
    n++;
  }
  if (!n) return 0.5;
  let seen = 0;
  for (let v = 0; v < 256; v++) { seen += hist[v]; if (seen >= n / 2) return Math.max(v, 8) / 255; }
  return 0.5;
}

/** How much of the nail's broad light is evened out (a French tip, an ombré, a shimmer band); fine shading and gloss stay. */
export const FLATTEN = 0.8;
/** The blur radius of the broad light, in pixels of a 1200-wide photo (three box passes ≈ a Gaussian). */
export const TONE_RADIUS = 16;

/**
 * The broad light across each nail: the photo's brightness blurred inside the mask only (so skin never bleeds in).
 * Worked out once per photo; recolour() divides it out so the new shade reads as one opaque lacquer.
 * @param {Uint8ClampedArray} px RGBA @param {Uint8ClampedArray} mask RGBA, same size @param {number} w @param {number} h
 * @param {number} [radius]
 * @returns {Float32Array} one value per pixel (0 outside the nails)
 */
export function nailTone(px, mask, w, h, radius = TONE_RADIUS) {
  // Only the box around the nails (plus the blur's reach) is worked: a few hundred thousand pixels, not the whole photo.
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[(y * w + x) * 4] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const tone = new Float32Array(w * h);
  if (x1 < 0) return tone;
  const pad = 3 * radius;
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1, n = bw * bh;
  const lm = new Float32Array(n), m = new Float32Array(n), tmp = new Float32Array(n);
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    const i = ((y + y0) * w + x + x0) * 4, a = mask[i] / 255;
    m[y * bw + x] = a;
    lm[y * bw + x] = a * (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255;
  }
  /** One separable box pass, in place (edges clamped). @param {Float32Array} v */
  const box = (v) => {
    const r = radius, span = 2 * r + 1;
    for (let y = 0; y < bh; y++) {
      const row = y * bw; let s = 0;
      for (let x = -r; x <= r; x++) s += v[row + Math.min(Math.max(x, 0), bw - 1)];
      for (let x = 0; x < bw; x++) {
        tmp[row + x] = s / span;
        s += v[row + Math.min(x + r + 1, bw - 1)] - v[row + Math.max(x - r, 0)];
      }
    }
    for (let x = 0; x < bw; x++) {
      let s = 0;
      for (let y = -r; y <= r; y++) s += tmp[Math.min(Math.max(y, 0), bh - 1) * bw + x];
      for (let y = 0; y < bh; y++) {
        v[y * bw + x] = s / span;
        s += tmp[Math.min(y + r + 1, bh - 1) * bw + x] - tmp[Math.max(y - r, 0) * bw + x];
      }
    }
  };
  for (let k = 0; k < 3; k++) { box(lm); box(m); }
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    const q = y * bw + x, p = (y + y0) * w + x + x0;
    tone[p] = m[q] > 1e-3 && mask[p * 4] > 0 ? lm[q] / m[q] : 0;
  }
  return tone;
}

/**
 * Lays a shade into the nails of a photo, in place. `src` is the untouched photo, `out` receives the result.
 * @param {Uint8ClampedArray} src RGBA @param {Uint8ClampedArray} mask RGBA, same size @param {Uint8ClampedArray} out RGBA
 * @param {string} hex @param {number} base nailBase() of this photo
 * @param {Float32Array} [tone] nailTone() of this photo: evens out the broad light of the old polish
 */
export function recolour(src, mask, out, hex, base, tone) {
  const c = hexToRgb(hex);
  if (!c) throw new Error(`not a colour: ${hex}`);
  const [cr, cg, cb] = c.map((v) => v / 255);
  const hiFrom = Math.min(base * 1.22, 0.96), hiSpan = Math.max(1e-6, 1 - hiFrom);
  for (let i = 0; i < src.length; i += 4) {
    const a = mask[i] / 255;
    if (a <= 0) { out[i] = src[i]; out[i + 1] = src[i + 1]; out[i + 2] = src[i + 2]; out[i + 3] = 255; continue; }
    const r = src[i] / 255, g = src[i + 1] / 255, b = src[i + 2] / 255;
    const L0 = 0.299 * r + 0.587 * g + 0.114 * b;
    const t = tone ? tone[i >> 2] : 0;
    const L = t > 0.02 ? L0 * (base / t) ** FLATTEN : L0;
    const k = Math.min(L / base, 1.6) ** 0.85; // the photo's own light and shadow
    const hi = Math.min(Math.max((L - hiFrom) / hiSpan, 0), 1) ** 1.6; // only the true gloss stays white
    const nr = Math.min(cr * k, 1) * (1 - hi) + hi, ng = Math.min(cg * k, 1) * (1 - hi) + hi, nb = Math.min(cb * k, 1) * (1 - hi) + hi;
    out[i] = Math.round((r * (1 - a) + nr * a) * 255);
    out[i + 1] = Math.round((g * (1 - a) + ng * a) * 255);
    out[i + 2] = Math.round((b * (1 - a) + nb * a) * 255);
    out[i + 3] = 255;
  }
}
