// @ts-check
/**
 * This week's flowers: one row (in site.json, or live from the florist's Google Sheet) sets the arrangement, its
 * name, stems, prices, photo and a colour taken from the flowers. The colour frames the page (a pale wash, the
 * monogram's ring, the one button, the phone bar); it never replaces the photograph.
 */
import { contrast } from "../../../core/lib/brand.js";

const HEX = /^#[0-9a-f]{6}$/i;
export const isHex = (/** @type {unknown} */ v) => typeof v === "string" && HEX.test(v);

/** @param {string} hex */
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
/** @param {number[]} c */
const hex = (c) => `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
/** Mix a towards b by t (0–1), in sRGB. @param {string} a @param {string} b @param {number} t */
export const mix = (a, b, t) => { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * t)); };

/**
 * The deep colour: the week's colour, deepened just enough to pass WCAG AA (4.5:1) both ways: white text on it (the
 * button, the phone bar) and as text itself on the look's light backgrounds (the chosen size, chips).
 * @param {string} colour @param {string} ink the look's darkest text colour @param {string[]} [against] light backgrounds it sits on
 */
export function buttonColour(colour, ink, against = []) {
  // Lower the lightness and keep the hue and saturation, so a coral stays a coral rather than turning brown.
  const [h, sat, l] = toHsl(colour);
  for (let L = l; L >= 0.05; L -= 0.01) {
    const c = fromHsl(h, sat, L);
    if (["#FFFFFF", ...against].every((bg) => contrast(c, bg) >= 4.6)) return c;
  }
  return ink;
}

/** @param {string} c @returns {[number, number, number]} hue 0–1, saturation 0–1, lightness 0–1 */
function toHsl(c) {
  const [r, g, b] = rgb(c).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) / 6 : max === g ? ((b - r) / d + 2) / 6 : ((r - g) / d + 4) / 6;
  return [h, s, l];
}
/** @param {number} h @param {number} s @param {number} l */
function fromHsl(h, s, l) {
  const k = (/** @type {number} */ n) => (n + h * 12) % 12, a = s * Math.min(l, 1 - l);
  const f = (/** @type {number} */ n) => (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))) * 255;
  return hex([f(0), f(8), f(4)]);
}

/** The band's pale wash of the week's colour on the look's ground. @param {string} colour @param {string} ground @param {number} [amount] */
export const washColour = (colour, ground, amount = 0.13) => mix(ground, colour, amount);

/**
 * The three tokens a look needs from the week's colour.
 * @param {string} colour @param {{ ground: string, ink: string }} look
 */
export function weekTokens(colour, look) {
  const weekWash = washColour(colour, look.ground);
  return { week: colour, weekDeep: buttonColour(colour, look.ink, [look.ground, weekWash]), weekWash };
}

/**
 * @typedef {object} Size
 * @property {string} id
 * @property {string} label
 * @property {number} price whole pounds
 */
/**
 * @typedef {object} Week
 * @property {string} name
 * @property {string} stems
 * @property {string} colour
 * @property {string} colourName
 * @property {Size[]} sizes
 * @property {string} photo id of one of the week's photos
 */

/**
 * The week from a Sheet row, field by field: anything missing or unreadable keeps the built value, so a typo in
 * the Sheet can never show a wrong price or an unreadable button. Column names: name, stems, colour, colour_name,
 * photo, and price_<size id> (e.g. price_medium).
 * @param {Record<string, string>} row @param {Week} base @param {string[]} photoIds
 * @returns {Week}
 */
export function weekFromRow(row, base, photoIds) {
  const t = (/** @type {string} */ k, /** @type {number} */ max) => { const v = (row[k] ?? "").trim(); return v && v.length <= max ? v : null; };
  const colour = (row.colour ?? "").trim();
  const photo = (row.photo ?? "").trim();
  return {
    name: t("name", 80) ?? base.name,
    stems: t("stems", 220) ?? base.stems,
    colour: isHex(colour) ? colour.toUpperCase() : base.colour,
    colourName: t("colour_name", 30) ?? base.colourName,
    photo: photoIds.includes(photo) ? photo : base.photo,
    sizes: base.sizes.map((s) => {
      const raw = (row[`price_${s.id}`] ?? "").replace(/[£,\s]/g, "");
      const n = /^\d{1,4}$/.test(raw) ? Number(raw) : NaN;
      return Number.isFinite(n) && n > 0 ? { ...s, price: n } : s;
    }),
  };
}

/**
 * Rows of a published CSV as objects keyed by the header row (lower-cased, spaces to underscores).
 * @param {string[][]} rows
 * @returns {Record<string, string>[]}
 */
export function rowsToObjects(rows) {
  const [head, ...rest] = rows;
  if (!head) return [];
  const keys = head.map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return rest.map((r) => Object.fromEntries(keys.map((k, i) => [k, r[i] ?? ""])));
}

/**
 * @typedef {object} StemPoint
 * @property {number} x % from the left of the week photo
 * @property {number} y % from the top
 * @property {number} [px] on the phone photo
 * @property {number} [py]
 * @property {string} name
 * @property {string} [note]
 */
/**
 * Stems marked in the Sheet, one row each: "stem,<n>,62 40 55 48 | Coral garden rose | English-grown" (where on the
 * photo and the phone photo in %, then the name and an optional note). Unreadable rows are left out.
 * @param {Record<string, string>} rows key → value
 * @returns {StemPoint[]}
 */
export function stemsFromRows(rows) {
  /** @type {StemPoint[]} */
  const out = [];
  for (const key of Object.keys(rows).sort((a, b) => Number(a) - Number(b))) {
    const [where = "", name = "", note = ""] = rows[key].split("|").map((x) => x.trim());
    const n = where.split(/[\s,]+/).filter(Boolean).map(Number);
    const ok = (/** @type {number} */ v) => Number.isFinite(v) && v >= 0 && v <= 100;
    if ((n.length !== 2 && n.length !== 4) || !n.every(ok) || !name || name.length > 40 || note.length > 40) continue;
    out.push({ x: n[0], y: n[1], ...(n.length === 4 ? { px: n[2], py: n[3] } : {}), name, ...(note ? { note } : {}) });
  }
  return out.slice(0, 8);
}

/**
 * Where a point on a photo lands in an <img> drawn with object-fit: cover (centred).
 * @param {number} xPct @param {number} yPct @param {{ w: number, h: number, nw: number, nh: number }} box
 * @returns {{ left: number, top: number, inside: boolean }}
 */
export function coverPoint(xPct, yPct, box) {
  const s = Math.max(box.w / box.nw, box.h / box.nh);
  const dw = box.nw * s, dh = box.nh * s;
  const left = (box.w - dw) / 2 + (xPct / 100) * dw, top = (box.h - dh) / 2 + (yPct / 100) * dh;
  return { left, top, inside: left >= 8 && top >= 8 && left <= box.w - 8 && top <= box.h - 8 };
}
