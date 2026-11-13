// @ts-check
/** Lingerie kit additions to the shared Eleventy setup: pieces and collections, the size grid, guides, the shop's mode. */
import { HOME_PARTS, ON_PAGES } from "./home.js";
import { pieceName, swatches, piecesWhere, collectionOf, colourOf } from "./lib/pieces.js";
import { sizeGrid } from "./lib/fit.js";
import { activeTakeover, takeoverPhase, wallLabel } from "./lib/takeover.js";
import { setAsideText } from "./lib/pieces.js";
import { FEATURES } from "../../features/registry.js";

/** @param {any} eleventyConfig */
export default function lingerieKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS, onPages: ON_PAGES });
  eleventyConfig.addFilter("pieceName", (/** @type {any} */ p, /** @type {any} */ site, /** @type {string} */ colour) => pieceName(site.collections, p, colour));
  eleventyConfig.addFilter("swatches", (/** @type {any} */ p, /** @type {any} */ site) => swatches(site.collections, p));
  eleventyConfig.addFilter("colourOf", (/** @type {any} */ p, /** @type {any} */ site) => colourOf(site.collections, p));
  eleventyConfig.addFilter("collectionOf", (/** @type {any} */ site, /** @type {string} */ id) => collectionOf(site.collections, id));
  eleventyConfig.addFilter("piecesWhere", (/** @type {any[]} */ pieces, /** @type {any} */ f) => piecesWhere(pieces, f));
  // A page shows each photograph once: piece rows skip pieces whose photo the page has already shown.
  eleventyConfig.addFilter("guidePhotos", (/** @type {any} */ g) => [g?.opener?.src, ...(g?.sections ?? []).map((/** @type {any} */ s) => s.photo?.src)].filter(Boolean));
  eleventyConfig.addFilter("notShown", (/** @type {any[]} */ pieces, /** @type {string[]} */ srcs) => pieces.filter((p) => !srcs.includes(p.photo?.src)));
  eleventyConfig.addFilter("concat", (/** @type {any[]} */ a, /** @type {any[]} */ b) => [...(a ?? []), ...(b ?? [])]);
  eleventyConfig.addFilter("srcs", (/** @type {any[]} */ photos) => (photos ?? []).map((ph) => ph.src));
  eleventyConfig.addFilter("pieceIn", (/** @type {any[]} */ pieces, /** @type {string} */ src) => pieces.find((p) => p.photo?.src === src) ?? null);
  eleventyConfig.addFilter("sizeGrid", sizeGrid);
  // Gift takeovers: the one on when the site is built (the script corrects it on the day), and what the script needs.
  eleventyConfig.addFilter("takeoverOn", (/** @type {any[]} */ list, /** @type {any} */ site) => {
    const tz = site.hours?.timezone ?? "Europe/London";
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const i = activeTakeover(list ?? [], today);
    return i !== -1 && takeoverPhase(list[i], tz, Date.now()).phase !== "over" ? i : -1;
  });
  eleventyConfig.addFilter("takeoverData", (/** @type {any[]} */ list) => (list ?? []).map((t) => ({ from: t.from, to: t.to, orderBy: t.orderBy, collectBy: t.collectBy })));
  eleventyConfig.addFilter("wallLabel", wallLabel);
  eleventyConfig.addFilter("payLinkOf", (/** @type {any} */ site, /** @type {string} */ id) => (site.payLinks?.items ?? []).find((/** @type {any} */ l) => l.id === id) ?? null);
  // Is a link's page built on this site? Collection and piece pages come from their features; others from the registry.
  eleventyConfig.addFilter("linkOn", (/** @type {any} */ l, /** @type {any} */ site) => {
    if (!l) return false;
    if (l.href) return true;
    const page = String(l.page ?? "");
    const by = page.startsWith("collection-") ? "collection-pages" : page.startsWith("piece-") ? "piece-detail" : FEATURES.find((f) => f.page === page)?.id;
    return page === "index" || (by !== undefined && site.features.includes(by));
  });
  eleventyConfig.addFilter("setAside", (/** @type {any} */ p, /** @type {any} */ site) => setAsideText({ business: site.business.name, piece: pieceName(site.collections, p), price: p.price }));
  // Data a feature's script reads, written into the page as JSON; "<" is escaped so no text can close the script tag.
  eleventyConfig.addFilter("jsonData", (/** @type {unknown} */ v) => JSON.stringify(v).replace(/</g, "\\u003c"));
  eleventyConfig.addFilter("longDate", (/** @type {string} */ d) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }));
}
