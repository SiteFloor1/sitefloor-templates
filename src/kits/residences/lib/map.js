// @ts-check
/**
 * The neighbourhood map: the places the operator names, drawn around the building on rings of walking time. Where
 * the operator gives a place's walking minutes they are used as given; otherwise an estimate from the straight-line
 * distance (×1.3 for streets, at 80 metres a minute), always written "about".
 */
const WALK = 80; // metres a minute
const DETOUR = 1.3;
const RAD = Math.PI / 180;

/** Metres east and north of the centre. @param {{ lat: number, lng: number }} c @param {{ lat: number, lng: number }} p */
export function offset(c, p) {
  return { x: (p.lng - c.lng) * Math.cos(c.lat * RAD) * 111_320, y: (p.lat - c.lat) * 110_540 };
}

/** @param {{ lat: number, lng: number }} c @param {{ lat: number, lng: number, minutes?: number }} p */
export function walk(c, p) {
  if (Number.isInteger(p.minutes)) return { minutes: /** @type {number} */ (p.minutes), about: false };
  const { x, y } = offset(c, p);
  return { minutes: Math.max(1, Math.ceil((Math.hypot(x, y) * DETOUR) / WALK)), about: true };
}

/** "About 6 minutes' walk" / "4 minutes' walk". @param {{ minutes: number, about: boolean }} w */
export const walkText = (w) => `${w.about ? "About " : ""}${w.minutes} minute${w.minutes === 1 ? "" : "s"}' walk`;

/**
 * Places laid out in an SVG square of `size`, the building in the middle and the outer ring at `ringMinutes`.
 * @param {{ lat: number, lng: number }} c @param {{ name: string, lat: number, lng: number, minutes?: number }[]} places
 * @param {number} size @param {number} ringMinutes
 */
export function layout(c, places, size, ringMinutes) {
  const half = size / 2;
  const scale = (half * 0.92) / ((ringMinutes * WALK) / DETOUR); // a straight-line metre in px at the outer ring
  return places.map((p) => {
    const { x, y } = offset(c, p);
    const w = walk(c, p);
    return { ...p, ...w, cx: Math.round(half + x * scale), cy: Math.round(half - y * scale) };
  });
}

/** Ring radii in px for the given minutes. @param {number[]} minutes @param {number} size @param {number} ringMinutes */
export const rings = (minutes, size, ringMinutes) => minutes.map((m) => ({ minutes: m, r: Math.round(((size / 2) * 0.92 * m) / ringMinutes) }));
