// @ts-check
/* global document */
/**
 * Stock in the browser, shared by every feature on the page: read once (the brand's sheet, or the demo's numbers),
 * then each piece's state. Fails closed: if the sheet can't be read or is old, every feature gets null and shows
 * only the price and the link to the shop.
 */
import { readStockSheet, fixedTable, pieceState, stockWords } from "../lib/stock.js";
import { opensAt, opensWords } from "../lib/drop.js";
import { liveOpens } from "./drop.js";

/** @typedef {{ tz: string, source: "sheet"|"fixed", csvUrl?: string, staleAfterHours: number, lowAt: number, fixed?: Record<string, Record<string, number>>, drop: { opens: string, rolling: { day: string, time: string }|null, pieces: string[] }|null, pieces: { id: string, sizes: string[] }[] }} StockConfig */

/** @type {Map<string, Promise<import("../lib/stock.js").StockTable|null>>} */
const loads = new Map();

/** The config the page carries, from the first <script data-wear-stock> found. @returns {StockConfig|null} */
export function stockConfig() {
  const el = document.querySelector("script[data-wear-stock]");
  try { return el ? JSON.parse(el.textContent ?? "") : null; } catch { return null; }
}

/** @param {StockConfig} c @returns {Promise<import("../lib/stock.js").StockTable|null>} */
export function loadStock(c) {
  const key = c.source === "sheet" ? c.csvUrl ?? "" : "fixed";
  if (!loads.has(key)) {
    loads.set(key, c.source === "fixed"
      ? Promise.resolve(fixedTable(c.fixed ?? {}))
      : fetch(/** @type {string} */ (c.csvUrl), { cache: "no-store" })
        .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
        .then((csv) => readStockSheet(csv, { timeZone: c.tz, now: Date.now(), staleAfterHours: c.staleAfterHours })?.table ?? null)
        .catch(() => null));
  }
  return /** @type {Promise<any>} */ (loads.get(key));
}

/**
 * The state and words for one piece, now.
 * @param {StockConfig} c @param {import("../lib/stock.js").StockTable|null} table @param {string} id
 */
export function pieceNow(c, table, id) {
  const piece = c.pieces.find((p) => p.id === id);
  if (!piece) return null;
  const now = Date.now();
  const inDrop = c.drop?.pieces.includes(id);
  const opens = inDrop && c.drop ? liveOpens(c.drop, c.tz, now) : null;
  const at = opens ? opensAt(opens, c.tz) : undefined;
  const st = table || (at !== undefined && now < at)
    ? pieceState({ sizes: piece.sizes, opensAt: at }, table?.get(id), { now, lowAt: c.lowAt })
    : { state: /** @type {const} */ ("unknown"), left: 0, inSizes: [] };
  return { ...st, words: stockWords(st, piece.sizes, opens ? opensWords(opens, now, c.tz) : undefined), sizes: piece.sizes, counts: table?.get(id) ?? null };
}

/**
 * Paints the words under every piece inside `root` that carries data-stock="<piece id>":
 * [data-stock-lead] gets the strong part, [data-stock-rest] the rest, and the element gets data-state.
 * @param {HTMLElement} root
 */
export async function paintStock(root) {
  const c = stockConfig();
  if (!c) return;
  const table = await loadStock(c);
  for (const el of /** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll("[data-stock]"))) {
    const p = pieceNow(c, table, el.dataset.stock ?? "");
    if (!p) continue;
    el.dataset.state = p.state;
    const lead = el.querySelector("[data-stock-lead]");
    const rest = el.querySelector("[data-stock-rest]");
    if (lead) lead.textContent = p.words.lead;
    if (rest) rest.textContent = p.words.rest;
  }
}
