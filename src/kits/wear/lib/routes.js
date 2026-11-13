// @ts-check
/**
 * Run club route cards: a route's points (from the GPX file the club exports from its running app, as
 * [lat, lng, elevation]) drawn as one line, with its real distance and climb worked out from those points.
 */

const EARTH_M = 6_371_000;

/** @typedef {[number, number, number?]} RoutePoint lat, lng, metres above sea level (optional) */

/** Great-circle distance in metres. @param {RoutePoint} a @param {RoutePoint} b */
export function metresBetween(a, b) {
  const rad = (/** @type {number} */ d) => (d * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Distance (km, one decimal) and climb (metres, rounded; rises under 1 m between points are ignored as GPS noise).
 * @param {RoutePoint[]} points @returns {{ km: number, climb: number|null }}
 */
export function routeStats(points) {
  let m = 0;
  let climb = 0;
  const hasEle = points.length > 1 && points.every((p) => typeof p[2] === "number");
  let base = hasEle ? /** @type {number} */ (points[0][2]) : 0;
  for (let i = 1; i < points.length; i++) {
    m += metresBetween(points[i - 1], points[i]);
    if (hasEle) {
      const e = /** @type {number} */ (points[i][2]);
      if (e - base >= 1) { climb += e - base; base = e; } else if (e < base) base = e;
    }
  }
  return { km: Math.round(m / 100) / 10, climb: hasEle ? Math.round(climb) : null };
}

/**
 * The route as an SVG path inside a w×h box with `pad` around it, north up, keeping the true shape (longitude
 * shrunk by the cosine of the latitude). Also the start point, for the start dot.
 * @param {RoutePoint[]} points @param {number} w @param {number} h @param {number} pad
 * @returns {{ d: string, start: [number, number], end: [number, number] }}
 */
export function routePath(points, w, h, pad) {
  const lat0 = points.reduce((a, p) => a + p[0], 0) / points.length;
  const k = Math.cos((lat0 * Math.PI) / 180);
  const xs = points.map((p) => p[1] * k);
  const ys = points.map((p) => -p[0]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const scale = Math.min((w - 2 * pad) / (maxX - minX || 1), (h - 2 * pad) / (maxY - minY || 1));
  const ox = (w - (maxX - minX) * scale) / 2;
  const oy = (h - (maxY - minY) * scale) / 2;
  const at = (/** @type {number} */ i) => /** @type {[number, number]} */ ([+(ox + (xs[i] - minX) * scale).toFixed(1), +(oy + (ys[i] - minY) * scale).toFixed(1)]);
  const d = points.map((_, i) => `${i ? "L" : "M"}${at(i).join(" ")}`).join(" ");
  return { d, start: at(0), end: at(points.length - 1) };
}
