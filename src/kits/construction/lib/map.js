// @ts-check
/**
 * The projects map, worked out when the site is built: which OpenStreetMap tiles cover the projects' postcode
 * districts and where each marker sits on them. The page shows the list first and loads the tiles only when the
 * visitor asks for the map. A district's centre is the builder's own figure, never a client's address.
 */

const TILE = 256;

/** Web Mercator: a longitude and latitude as tile coordinates (fractional) at zoom z. @param {number} lng @param {number} lat @param {number} z */
export function toTile(lng, lat, z) {
  const n = 2 ** z;
  const r = (lat * Math.PI) / 180;
  return { x: ((lng + 180) / 360) * n, y: ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n };
}

/**
 * The view: the largest zoom (up to maxZoom) at which every point fits a cols × rows grid of tiles with a margin,
 * the tiles to draw and each point's position as a percentage of the grid.
 * @param {{ lat: number, lng: number }[]} points @param {{ cols?: number, rows?: number, maxZoom?: number, margin?: number }} [o]
 */
export function mapView(points, o = {}) {
  const cols = o.cols ?? 4, rows = o.rows ?? 3, maxZoom = o.maxZoom ?? 15, margin = o.margin ?? 0.35;
  if (!points.length) return null;
  for (let z = maxZoom; z >= 8; z--) {
    const t = points.map((p) => toTile(p.lng, p.lat, z));
    const minX = Math.min(...t.map((p) => p.x)), maxX = Math.max(...t.map((p) => p.x));
    const minY = Math.min(...t.map((p) => p.y)), maxY = Math.max(...t.map((p) => p.y));
    if (maxX - minX + 2 * margin > cols || maxY - minY + 2 * margin > rows) continue;
    const x0 = Math.floor((minX + maxX) / 2 - cols / 2 + 0.5), y0 = Math.floor((minY + maxY) / 2 - rows / 2 + 0.5);
    const tiles = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) tiles.push({ x: x0 + i, y: y0 + j, z, src: `https://tile.openstreetmap.org/${z}/${x0 + i}/${y0 + j}.png` });
    const markers = t.map((p) => ({ left: Math.round(((p.x - x0) / cols) * 10000) / 100, top: Math.round(((p.y - y0) / rows) * 10000) / 100 }));
    return { z, cols, rows, tile: TILE, tiles, markers };
  }
  return null;
}
