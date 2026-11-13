// @ts-check
/**
 * The florist's studio sheet in the browser: one published Google Sheet (CSV) read once per page and shared as
 * "studio" for this week's flowers, the season and workshop places. Rows: kind,key,value (e.g. "week,colour,#E0725C",
 * "season,dahlias,last-week", "workshop,wreath-dec,3",
 * "note,text,…", "stem,1,62 40 55 48 Coral garden rose · English-grown", "bouquet,blush-sage,few:2",
 * "drop,left,12", "drop,updated,2026-11-06 19:20"). Fails closed: on any error the page keeps what was built,
 * so a broken Sheet never shows a wrong price or an empty list. A demo (source "site") never fetches anything.
 */
import { parseCsv } from "../../../core/lib/sheet.js";

const TIMEOUT_MS = 6000;

/** @typedef {{ ok: boolean, week: Record<string, string>, season: Record<string, string>, workshop: Record<string, string>, note: Record<string, string>, stem: Record<string, string>, bouquet: Record<string, string>, drop: Record<string, string> }} Studio */
const KINDS = ["week", "season", "workshop", "note", "stem", "bouquet", "drop"];

/** Rows to the three groups. @param {string} csv @returns {Studio} */
export function studioFromCsv(csv) {
  /** @type {Studio} */
  const out = { ok: true, week: {}, season: {}, workshop: {}, note: {}, stem: {}, bouquet: {}, drop: {} };
  const rows = parseCsv(csv);
  const start = rows[0]?.[0]?.trim().toLowerCase() === "kind" ? 1 : 0;
  for (const r of rows.slice(start)) {
    const kind = (r[0] ?? "").trim().toLowerCase(), key = (r[1] ?? "").trim().toLowerCase(), value = (r[2] ?? "").trim();
    if (!key) continue;
    if (KINDS.includes(kind)) /** @type {any} */ (out)[kind][key] = value;
  }
  return out;
}

/** @param {import("../../../core/js/core.js").Ctx} ctx */
export function startStudio(ctx) {
  const w = /** @type {any} */ (globalThis);
  if (w.__sfStudio) return;
  w.__sfStudio = true;
  const cfg = /** @type {any} */ (ctx.data).florist?.studio;
  if (!cfg || cfg.source !== "sheet" || !cfg.csvUrl) { ctx.share("studio", { ok: false }); return; }
  (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      ctx.share("studio", res.ok ? studioFromCsv(await res.text()) : { ok: false });
    } catch {
      ctx.share("studio", { ok: false });
    } finally {
      clearTimeout(timer);
    }
  })();
}
