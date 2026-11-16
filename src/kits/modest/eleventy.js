// @ts-check
/** Modest kit additions to the shared Eleventy setup: the home sections, pieces, inches and prices. */
import { HOME_PARTS } from "./home.js";
import { inches, pounds, hemAnswer } from "./lib/modest.js";

/** @param {any} eleventyConfig */
export default function modestKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addFilter("piece", (/** @type {any} */ pieces, /** @type {string} */ id) => (pieces?.items ?? []).find((/** @type {any} */ p) => p.id === id));
  eleventyConfig.addFilter("inPart", (/** @type {any} */ pieces, /** @type {string} */ part) => (pieces?.items ?? []).filter((/** @type {any} */ p) => p.category === part));
  eleventyConfig.addFilter("eidEdit", (/** @type {any} */ pieces) => (pieces?.items ?? []).filter((/** @type {any} */ p) => p.eid));
  eleventyConfig.addFilter("partsWithPages", (/** @type {any} */ pieces) => (pieces?.categories ?? []).filter((/** @type {any} */ c) => c.page));
  eleventyConfig.addFilter("inches", (/** @type {number} */ n) => `${inches(n)}″`);
  eleventyConfig.addFilter("gbp", (/** @type {number} */ n) => pounds(n));
  // "52, 54, 56 and 58"
  eleventyConfig.addFilter("lengthList", (/** @type {number[]} */ ls) => (ls.length > 1 ? `${ls.slice(0, -1).join(", ")} and ${ls[ls.length - 1]}` : String(ls[0] ?? "")));
  // A page name inside a sentence: "occasion wear", but "Eid orders" keeps its capital, as does any name whose second
  // letter is a capital (an acronym).
  eleventyConfig.addFilter("menuWord", (/** @type {string} */ w) => (/^Eid\b/.test(w) || /^.[A-Z]/.test(w) ? w : w.charAt(0).toLowerCase() + w.slice(1)));
  // The hem line's first answer, before any choice: the shop's starting measurement and shoes.
  /** @param {any} L */
  const start = (L) => hemAnswer({ lengths: L.sizes, clear: L.clear }, L.start.shoulderToFloor, L.shoes[L.start.shoe]);
  eleventyConfig.addFilter("startLength", (/** @type {any} */ L) => start(L).length ?? "to measure");
  eleventyConfig.addFilter("startAnswer", (/** @type {any} */ L) => start(L));
  // A look's items with their pieces, and its total before the optional pieces.
  eleventyConfig.addFilter("lookItems", (/** @type {any} */ set, /** @type {any} */ pieces) => set.items.map((/** @type {any} */ i) => ({ ...(pieces.items.find((/** @type {any} */ p) => p.id === i.piece)), optional: i.optional === true })));
  eleventyConfig.addFilter("lookBase", (/** @type {any[]} */ items) => items.filter((x) => !x.optional).reduce((s, x) => s + x.price, 0));
}
