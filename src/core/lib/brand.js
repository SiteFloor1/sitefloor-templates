// @ts-check
/**
 * A client's own colours, type and logo on top of a look. The look decides
 * what can change and what it must stay readable against (look.json → "brand");
 * the client's choices go in site.json → "brand":
 *
 *   "brand": { "accent": "#3E8E7E", "type": "garamond", "logo": "img/logo.svg" }
 *
 * Every choice is checked at build time: an accent that can't be read on the
 * look's backgrounds, a type the look doesn't offer, or a logo file that is
 * missing, too big or contains script is refused.
 */

/**
 * @typedef {object} LookBrand
 * @property {{ default: string, against: string[], inks: string[], suggested?: { name: string, hex: string }[] }} accent
 *   against: the look's backgrounds the accent is used on (as text and buttons);
 *   inks: the look's dark and light text colours, one of which goes on top of the accent
 * @property {Record<string, { label: string, css?: string }>} types  "classic" is the look's own
 */

const HEX = /^#[0-9a-f]{6}$/i;
export const LOGO = /^img\/[a-z0-9-]+\.(svg|webp|png)$/;
export const LOGO_MAX_BYTES = 40 * 1024;
/** WCAG AA for normal text: the accent is used for small labels and links. */
export const MIN_CONTRAST = 4.5;

/** @param {string} hex */
function luminance(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/** WCAG contrast ratio, 1–21. @param {string} a @param {string} b */
export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** The look's ink that reads best on the accent (for button text). @param {string} accent @param {string[]} inks */
export function inkFor(accent, inks) {
  return [...inks].sort((a, b) => contrast(accent, b) - contrast(accent, a))[0];
}

/**
 * Problems with an accent on this look, as sentences; empty = fine.
 * @param {string} accent @param {LookBrand} lb
 */
export function accentProblems(accent, lb) {
  if (!HEX.test(accent)) return ['a colour like "#3E8E7E"'];
  const worst = Math.min(...lb.accent.against.map((bg) => contrast(accent, bg)));
  const ink = inkFor(accent, lb.accent.inks);
  /** @type {string[]} */
  const out = [];
  if (worst < MIN_CONTRAST) out.push(`too ${luminance(accent) > luminance(lb.accent.against[0]) ? "dark" : "light"} for this look's background (contrast ${worst.toFixed(1)}:1, needs ${MIN_CONTRAST}:1); try a ${luminance(lb.accent.against[0]) < 0.2 ? "lighter" : "darker"} shade`);
  if (contrast(accent, ink) < MIN_CONTRAST) out.push(`button text can't be read on it (contrast ${contrast(accent, ink).toFixed(1)}:1)`);
  return out;
}

/**
 * @param {any} site @param {LookBrand|undefined} lb the look's brand options
 * @param {(path: string, msg: string) => void} err
 * @param {{ size: (rel: string) => number|null, read: (rel: string) => string }} [files] for checking the logo
 */
export function checkBrand(site, lb, err, files) {
  const b = site.brand;
  if (b === undefined) return;
  if (b === null || typeof b !== "object" || Array.isArray(b)) { err("brand", '{ "accent": "#3E8E7E", "type": "classic", "logo": "img/logo.svg" }'); return; }
  for (const k of Object.keys(b)) if (!["accent", "type", "logo"].includes(k)) err(`brand.${k}`, "unknown setting; use accent, type or logo");
  if (!lb) { err("brand", `look "${site.look}" doesn't offer brand settings yet`); return; }
  if (b.accent !== undefined) for (const p of accentProblems(b.accent, lb)) err("brand.accent", p);
  if (b.type !== undefined && !lb.types[b.type]) err("brand.type", `one of ${Object.keys(lb.types).join(", ")}`);
  if (b.logo !== undefined) checkLogo(b.logo, err, files);
}

/** @param {any} logo @param {(path: string, msg: string) => void} err @param {{ size: (rel: string) => number|null, read: (rel: string) => string }} [files] */
function checkLogo(logo, err, files) {
  if (typeof logo !== "string" || !LOGO.test(logo)) { err("brand.logo", 'a file in img/: "img/logo.svg", .webp or .png'); return; }
  if (!files) return;
  const size = files.size(logo);
  if (size === null) { err("brand.logo", `file not found: ${logo}`); return; }
  if (size > LOGO_MAX_BYTES) err("brand.logo", `${Math.round(size / 1024)} KB; keep the logo under ${LOGO_MAX_BYTES / 1024} KB (use SVG, or a smaller WebP)`);
  if (logo.endsWith(".svg") && /<script|\son\w+\s*=|javascript:|<foreignObject/i.test(files.read(logo))) err("brand.logo", "the SVG contains script or event handlers; export a plain SVG");
}

/**
 * CSS for the client's accent, added after the look. Empty when the look's own accent is used.
 * @param {any} site @param {LookBrand|undefined} lb
 */
export function brandCss(site, lb) {
  const accent = site.brand?.accent;
  if (!lb || !accent) return "";
  const ink = inkFor(accent, lb.accent.inks);
  return `:root{--accent:${accent};--accent-2:color-mix(in srgb,${accent} 72%,${lb.accent.inks[lb.accent.inks.length - 1]});--on-accent:${ink}}`;
}
