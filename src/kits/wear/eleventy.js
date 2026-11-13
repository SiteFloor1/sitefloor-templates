// @ts-check
/** Wear kit additions to the shared Eleventy setup: pieces, stock for the browser, drops, routes, runs and the lookbook. */
import { HOME_PARTS } from "./home.js";
import { opensAt, opensWords, pastDrops, untilDrop, countdown } from "./lib/drop.js";
import { nextRunDate, runWhen } from "./lib/club.js";
import { routePath, routeStats } from "./lib/routes.js";
import { fixedTable, pieceState, stockWords } from "./lib/stock.js";
import { wallTimeToUtc } from "../../core/lib/hours.js";
import { safeJson } from "../../core/lib/seo.js";

/**
 * When the drop opens, as "YYYY-MM-DDTHH:MM" on the brand's clock. A demo's drop can be "rolling" (always the next
 * one, e.g. next Saturday 10:00), worked out here from the build's date and again in the browser from today's.
 * @param {any} drop @param {string} today YYYY-MM-DD @param {string} timeZone
 */
export function dropOpens(drop, today, timeZone) {
  if (!drop.rolling) return drop.opens;
  const [y, m, d] = today.split("-").map(Number);
  const start = wallTimeToUtc({ year: y, month: m, day: d, hour: 0, minute: 1 }, timeZone);
  const date = nextRunDate({ id: "drop", day: drop.rolling.day, time: drop.rolling.time, minutes: 0, title: "", text: "", meet: "" }, start, timeZone);
  return `${date}T${drop.rolling.time}`;
}

/** @param {any} eleventyConfig */
export default function wearKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });

  /** @param {any} site @param {string} id */
  const pieceOf = (site, id) => site.pieces.find((/** @type {any} */ p) => p.id === id);
  eleventyConfig.addFilter("wearPiece", (/** @type {any} */ site, /** @type {string} */ id) => pieceOf(site, id));
  eleventyConfig.addFilter("wearPieces", (/** @type {any} */ site, /** @type {string[]} */ ids) => ids.map((id) => pieceOf(site, id)).filter(Boolean));
  eleventyConfig.addFilter("gbpWhole", (/** @type {number} */ n) => `£${Number.isInteger(n) ? n : n.toFixed(2)}`);

  /** The drop resolved for this build: when it opens and how the line says it. */
  eleventyConfig.addFilter("wearDrop", (/** @type {any} */ site, /** @type {string} */ today) => {
    const tz = site.hours.timezone;
    const opens = dropOpens(site.drop, today, tz);
    const now = wallTimeToUtc({ year: +today.slice(0, 4), month: +today.slice(5, 7), day: +today.slice(8, 10), hour: 12, minute: 0 }, tz);
    const u = untilDrop(opens, now, tz);
    return { ...site.drop, opens, words: u.phase === "open" ? "open now" : opensWords(opens, now, tz), left: u.phase === "open" ? "" : ` · ${u.words}`, clock: countdown(opens, now, tz) ?? "", past: pastDrops(site.drop.archive ?? [], Math.min(now, opensAt(opens, tz)), tz) };
  });

  /**
   * Everything the browser needs to show stock, in one object for a <script type="application/json">: the source,
   * the demo's numbers, and each piece's sizes and opening time (pieces in an unopened drop say "Saturday 10:00").
   */
  eleventyConfig.addFilter("wearStockJson", (/** @type {any} */ site, /** @type {string} */ today) => {
    const tz = site.hours.timezone;
    const opens = site.drop ? dropOpens(site.drop, today, tz) : null;
    const s = site.stock;
    return safeJson({
      tz, source: s.source, csvUrl: s.csvUrl, staleAfterHours: s.staleAfterHours, lowAt: s.lowAt, fixed: s.source === "fixed" ? s.fixed : undefined,
      drop: site.drop ? { opens, rolling: site.drop.rolling ?? null, pieces: site.drop.pieces } : null,
      pieces: site.pieces.map((/** @type {any} */ p) => ({ id: p.id, sizes: p.sizes })),
    });
  });

  /**
   * The words under a piece as the build sees it (the browser repaints them from the live sheet). Demo numbers only;
   * a sheet's are never guessed at build time, so a client's page starts quiet.
   */
  eleventyConfig.addFilter("wearStockWords", (/** @type {any} */ site, /** @type {any} */ piece, /** @type {string} */ today) => {
    const tz = site.hours.timezone;
    const opens = site.drop?.pieces.includes(piece.id) ? dropOpens(site.drop, today, tz) : null;
    const now = Date.parse(`${today}T12:00:00Z`);
    const table = site.stock.source === "fixed" ? fixedTable(site.stock.fixed) : new Map();
    const st = pieceState({ sizes: piece.sizes, opensAt: opens ? opensAt(opens, tz) : undefined }, table.get(piece.id), { now, lowAt: site.stock.lowAt });
    return { ...stockWords(st, piece.sizes, opens ? opensWords(opens, now, tz) : undefined), state: st.state };
  });

  eleventyConfig.addFilter("wearJson", (/** @type {any} */ v) => safeJson(v));
  eleventyConfig.addFilter("runWhen", runWhen);
  eleventyConfig.addFilter("wearRoute", (/** @type {any} */ route, /** @type {number} */ w, /** @type {number} */ h) => ({ ...routePath(route.points, w, h, 28), ...routeStats(route.points) }));
  eleventyConfig.addFilter("wearRouteOf", (/** @type {any} */ site, /** @type {string} */ id) => (site.club.routes ?? []).find((/** @type {any} */ r) => r.id === id));

  /** The lookbook as spreads: two portrait looks face each other; a landscape look takes a spread alone. */
  eleventyConfig.addFilter("lookSpreads", (/** @type {any[]} */ looks) => {
    /** @type {any[][]} */ const spreads = [];
    /** @type {any[]} */ let open = [];
    looks.forEach((l, i) => {
      const look = { ...l, n: i + 1 };
      if (l.photo.width > l.photo.height) { if (open.length) spreads.push(open); spreads.push([look]); open = []; return; }
      open.push(look);
      if (open.length === 2) { spreads.push(open); open = []; }
    });
    if (open.length) spreads.push(open);
    return spreads;
  });
  eleventyConfig.addFilter("looksWith", (/** @type {any} */ lookbook, /** @type {string} */ id) => (lookbook?.looks ?? []).map((/** @type {any} */ l, /** @type {number} */ i) => ({ ...l, n: i + 1 })).filter((/** @type {any} */ l) => (l.pieces ?? []).some((/** @type {any} */ p) => p.id === id)));
  eleventyConfig.addFilter("pad2", (/** @type {number} */ n) => String(n).padStart(2, "0"));
  eleventyConfig.addFilter("fitChest", (/** @type {any} */ fit) => fit.measures.find((/** @type {any} */ m) => m.id === (fit.chest ?? "chest"))?.values ?? {});
  eleventyConfig.addFilter("monthLong", (/** @type {string} */ opens) => new Date(`${opens.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }));
}
