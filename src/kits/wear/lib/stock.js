// @ts-check
/**
 * Stock for a clothing brand: how many of each piece are left in each size, from a Google Sheet the brand updates on
 * its phone (or, on the demo only, numbers written into site.json). Old numbers are never shown as current: if the
 * sheet hasn't been touched within `staleAfterHours`, every stock word goes quiet and the site just links to the shop.
 *
 * Sheet columns (first row is the header, any order): piece, size, left, updated_at
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";

/** @typedef {Map<string, Map<string, number>>} StockTable piece id → size → number left */
/** @typedef {{ table: StockTable, updated: number }} StockRead */
/** @typedef {"in"|"few"|"out"|"soon"|"unknown"} StockState */

/**
 * Reads the sheet. Rows it can't read are skipped; a sheet with no readable rows, or whose newest row is older than
 * `staleAfterHours`, returns null (fail closed).
 * @param {string} csv @param {{ timeZone: string, now: number, staleAfterHours: number }} o
 * @returns {StockRead|null}
 */
export function readStockSheet(csv, o) {
  const rows = parseCsv(csv);
  if (rows.length < 2) return null;
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const col = (/** @type {string} */ name) => head.indexOf(name);
  const [ip, is, il, iu] = ["piece", "size", "left", "updated_at"].map(col);
  if (ip < 0 || is < 0 || il < 0 || iu < 0) return null;
  /** @type {StockTable} */
  const table = new Map();
  let updated = NaN;
  for (const r of rows.slice(1)) {
    const piece = (r[ip] ?? "").trim();
    const size = (r[is] ?? "").trim().toUpperCase();
    const left = Number((r[il] ?? "").trim());
    const at = parseSheetTime(r[iu] ?? "", o.timeZone);
    if (!piece || !size || !Number.isInteger(left) || left < 0 || Number.isNaN(at)) continue;
    if (!table.has(piece)) table.set(piece, new Map());
    table.get(piece)?.set(size, left);
    if (Number.isNaN(updated) || at > updated) updated = at;
  }
  if (!table.size || Number.isNaN(updated)) return null;
  if (o.now - updated > o.staleAfterHours * 3_600_000 || updated - o.now > 10 * 60_000) return null;
  return { table, updated };
}

/**
 * Numbers written into site.json (demo only): { pieceId: { S: 3, M: 0, … } }.
 * @param {Record<string, Record<string, number>>} fixed @returns {StockTable}
 */
export function fixedTable(fixed) {
  return new Map(Object.entries(fixed).map(([id, sizes]) => [id, new Map(Object.entries(sizes).map(([s, n]) => [s.toUpperCase(), n]))]));
}

/**
 * One piece's state across its sizes.
 * @param {{ sizes: string[], opensAt?: number }} piece
 * @param {Map<string, number>|undefined} counts sizes → left; undefined when the sheet has no row for it
 * @param {{ now: number, lowAt: number }} o
 * @returns {{ state: StockState, left: number, inSizes: string[] }}
 */
export function pieceState(piece, counts, o) {
  if (piece.opensAt !== undefined && o.now < piece.opensAt) return { state: "soon", left: 0, inSizes: [] };
  if (!counts) return { state: "unknown", left: 0, inSizes: [] };
  const inSizes = piece.sizes.filter((s) => (counts.get(s) ?? 0) > 0);
  const left = piece.sizes.reduce((a, s) => a + (counts.get(s) ?? 0), 0);
  if (left === 0) return { state: "out", left, inSizes };
  return { state: left <= o.lowAt ? "few" : "in", left, inSizes };
}

/**
 * Sizes as a reader would say them: "S to XL", "M and L only", "L only".
 * @param {string[]} inSizes in stock @param {string[]} all every size the piece comes in
 */
export function sizeWords(inSizes, all) {
  if (!inSizes.length) return "";
  if (inSizes.length === all.length) return all.length === 1 ? all[0] : `${all[0]} to ${all[all.length - 1]}`;
  const contiguous = inSizes.every((s, i) => i === 0 || all.indexOf(s) === all.indexOf(inSizes[i - 1]) + 1);
  if (inSizes.length === 1) return `${inSizes[0]} only`;
  if (inSizes.length === 2) return `${inSizes[0]} and ${inSizes[1]} only`;
  return contiguous ? `${inSizes[0]} to ${inSizes[inSizes.length - 1]} only` : `${inSizes.slice(0, -1).join(", ")} and ${inSizes[inSizes.length - 1]} only`;
}

/**
 * The words under a piece. `lead` is the strong part (shown in the accent); `rest` follows it.
 * @param {{ state: StockState, left: number, inSizes: string[] }} s @param {string[]} sizes @param {string} [opensWords] e.g. "Saturday 10:00"
 * @returns {{ lead: string, rest: string }}
 */
export function stockWords(s, sizes, opensWords) {
  switch (s.state) {
    case "soon": return { lead: opensWords ?? "Coming soon", rest: sizeWords(sizes, sizes) };
    case "out": return { lead: "", rest: "Sold out" };
    case "few": return { lead: `${s.left} left`, rest: sizeWords(s.inSizes, sizes) };
    case "in": return { lead: "", rest: `In stock · ${sizeWords(s.inSizes, sizes)}` };
    default: return { lead: "", rest: "" };
  }
}
