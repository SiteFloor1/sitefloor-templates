// @ts-check
/**
 * The studio's paint chart: one row per colour it wants to offer on the 3D car, `name`, `hex` (#RRGGBB) and an
 * optional `finish` (solid, metallic, pearl or matte; metallic when blank). Names are the studio's own. A row without
 * a name or a valid colour is skipped; a chart with none is unreadable, and the 3D car keeps the look's colour.
 */
import { parseCsv } from "../../../core/lib/sheet.js";

export const FINISHES = ["solid", "metallic", "pearl", "matte"];
/** How each finish is drawn on the 3D car: metalness, the paint's roughness and its clear coat. */
export const FINISH_LOOK = {
  solid: { metalness: 0.08, roughness: 0.18, clearcoat: 1 },
  metallic: { metalness: 0.55, roughness: 0.22, clearcoat: 1 },
  pearl: { metalness: 0.35, roughness: 0.2, clearcoat: 1 },
  matte: { metalness: 0.2, roughness: 0.55, clearcoat: 0 },
};
const MAX = 24;

/** @typedef {{ id: string, name: string, hex: string, finish: string }} Colour */
/** @typedef {{ ok: true, colours: Colour[] } | { ok: false }} Chart */

/** @param {string} text @returns {Chart} */
export function paintChartFromCsv(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) return { ok: false };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const [n, h, f] = ["name", "hex", "finish"].map((k) => head.indexOf(k));
  if (n < 0 || h < 0) return { ok: false };
  /** @type {Colour[]} */ const colours = [];
  const seen = new Set();
  for (const r of rows.slice(1)) {
    const name = String(r[n] ?? "").replace(/\s+/g, " ").trim().slice(0, 40);
    const raw = String(r[h] ?? "").trim();
    const hex = /^#?[0-9a-f]{6}$/i.test(raw) ? `#${raw.replace("#", "").toUpperCase()}` : "";
    const fin = f < 0 ? "" : String(r[f] ?? "").trim().toLowerCase();
    if (!name || !hex) continue;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || hex.slice(1).toLowerCase();
    if (seen.has(id)) continue;
    seen.add(id);
    colours.push({ id, name, hex, finish: FINISHES.includes(fin) ? fin : "metallic" });
    if (colours.length === MAX) break;
  }
  return colours.length ? { ok: true, colours } : { ok: false };
}
