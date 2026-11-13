// @ts-check
/** Cakes kit additions to the shared Eleventy setup: the home sections and the words for tiers, prices and seasons. */
import { HOME_PARTS, onPagesProblem } from "./home.js";
import { sizesWords, tiersWords, pounds, seasonWords, planCake, MONTHS } from "./lib/cakes.js";
import { allergenName, ALLERGENS, ALLERGEN_GUIDANCE } from "../../core/lib/allergens.js";
import { DIET_WORDS } from "./config.js";

/** @param {any} eleventyConfig */
export default function cakesKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addGlobalData("cakeAllergens", { list: ALLERGENS, guidance: ALLERGEN_GUIDANCE, months: MONTHS });
  eleventyConfig.addFilter("hostedBy", (/** @type {Record<string, string[]>|null} */ onPages) => {
    const problem = onPagesProblem(onPages ?? undefined);
    if (problem) throw new Error(problem);
    return Object.fromEntries(Object.entries(onPages ?? {}).flatMap(([page, parts]) => parts.map((part) => [part, page])));
  });
  eleventyConfig.addFilter("hosted", (/** @type {Record<string, string[]>|null} */ onPages, /** @type {string} */ page) => (onPages ?? {})[page] ?? []);
  eleventyConfig.addFilter("sizesWords", (/** @type {number[]} */ s) => sizesWords(s));
  eleventyConfig.addFilter("tiersWords", (/** @type {number} */ n) => tiersWords(n));
  eleventyConfig.addFilter("gbp", (/** @type {number} */ n) => pounds(n));
  eleventyConfig.addFilter("seasonWords", (/** @type {number[]|undefined} */ m) => seasonWords(m));
  eleventyConfig.addFilter("allergenWords", (/** @type {string[]} */ ids) => (ids.length ? ids.map(allergenName).join(", ") : "None of the 14"));
  eleventyConfig.addFilter("dietWords", (/** @type {string[]} */ d) => d.map((x) => /** @type {Record<string, string>} */ (DIET_WORDS)[x] ?? x).join("; "));
  // The home page shows three cakes (not the hero's), and links to the rest.
  eleventyConfig.addFilter("homePieces", (/** @type {any} */ site) => site.pieces.items.filter((/** @type {any} */ p) => p.id !== site.hero.piece).slice(0, 3));
  eleventyConfig.addFilter("pieceOf", (/** @type {any} */ site, /** @type {string} */ id) => site.pieces.items.find((/** @type {any} */ p) => p.id === id));
  eleventyConfig.addFilter("piecesOf", (/** @type {any} */ site, /** @type {string[]} */ kinds) => site.pieces.items.filter((/** @type {any} */ p) => p.kinds.some((/** @type {string} */ k) => kinds.includes(k))));
  eleventyConfig.addFilter("flavourNames", (/** @type {any} */ site, /** @type {string[]} */ ids) => (ids ?? []).map((id) => site.flavours.items.find((/** @type {any} */ f) => f.id === id)?.name).filter(Boolean));
  // The servings calculator as rendered before its script runs.
  eleventyConfig.addFilter("planFor", (/** @type {any} */ site, /** @type {number} */ guests, /** @type {"finger"|"dessert"} */ portion) => planCake(guests, portion, site.servings) ?? { sizes: [], portions: 0, from: null });
  eleventyConfig.addFilter("biggestCake", (/** @type {any} */ site, /** @type {"finger"|"dessert"} */ portion) => {
    const sorted = [...site.servings.tiers].sort((a, b) => b.size - a.size).slice(0, site.servings.maxTiers);
    return sorted.reduce((sum, t) => sum + t[portion], 0);
  });
  eleventyConfig.addFilter("pieceText", (/** @type {any} */ site, /** @type {any} */ p) => `Hello ${site.business.name}, I'd love a cake like No. ${p.no ?? ""} ${p.name}. Could we talk about it?`.replace("No.  ", ""));
}
