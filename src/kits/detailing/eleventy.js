// @ts-check
/** Detailing kit additions to the shared Eleventy setup: the home sections, prices by size, dates and the 3D car. */
import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { HOME_PARTS, onPagesProblem } from "./home.js";
import { priceFor, daysLabel } from "./lib/packages.js";
import { ukDate } from "../../core/lib/diary.js";
import { gbp } from "../../core/lib/text.js";
import { LEASE_ITEMS, LEASE_SOURCE } from "./lib/lease.js";

/**
 * The 3D cars a visitor picks from (the shared models in src/core/assets/cars), the SUV first, each with its download
 * size for the button. Credits as CC BY asks: the modeller, linked to their profile, and that it was adapted.
 */
const mb = (/** @type {string} */ f) => (statSync(fileURLToPath(new URL(`../../core/assets/cars/${f}`, import.meta.url))).size / 1048576).toFixed(1);
const CC = { licence: "CC BY 4.0", licenceUrl: "https://creativecommons.org/licenses/by/4.0/" };
export const BODIES = [
  { id: "suv", name: "SUV", model: "img/cars/car-suv.glb", mb: mb("car-suv.glb"), by: "Black Snow", url: "https://sketchfab.com/BlackSnow02" },
  { id: "saloon", name: "Saloon", model: "img/cars/car-saloon.glb", mb: mb("car-saloon.glb"), by: "lazercar", url: "https://sketchfab.com/lazercar" },
  { id: "hatch", name: "Hatch", model: "img/cars/car-hatch.glb", mb: mb("car-hatch.glb"), by: "Daniel Zhabotinsky", url: "https://sketchfab.com/DanielZhabotinsky" },
];
export const CARS3D = { bodies: BODIES, first: "suv", ...CC };

/** @param {any} eleventyConfig */
export default function detailingKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addGlobalData("detailCars", CARS3D);
  eleventyConfig.addGlobalData("detailLease", {
    source: LEASE_SOURCE,
    groups: [...new Set(LEASE_ITEMS.map((x) => x.group))].map((name) => ({ name, items: LEASE_ITEMS.filter((x) => x.group === name) })),
  });
  eleventyConfig.addFilter("hostedBy", (/** @type {Record<string, string[]>|null} */ onPages) => {
    const problem = onPagesProblem(onPages ?? undefined);
    if (problem) throw new Error(problem);
    return Object.fromEntries(Object.entries(onPages ?? {}).flatMap(([page, parts]) => parts.map((part) => [part, page])));
  });
  eleventyConfig.addFilter("hosted", (/** @type {Record<string, string[]>|null} */ onPages, /** @type {string} */ page) => (onPages ?? {})[page] ?? []);
  // A package's "from" price for a size, as words ("£450") or "" when the studio hasn't priced that size.
  eleventyConfig.addFilter("priceIn", (/** @type {any} */ item, /** @type {string} */ size) => { const p = priceFor(item, size); return p === null ? "" : gbp(p); });
  eleventyConfig.addFilter("pkgOf", (/** @type {any} */ site, /** @type {string} */ id) => (site.packages?.items ?? []).find((/** @type {any} */ p) => p.id === id));
  /** A service page's "from" prices by size: its own, or those of the package or extra it names. */
  eleventyConfig.addFilter("servicePrices", (/** @type {any} */ pg, /** @type {any} */ site) => {
    if (pg?.prices) return pg.prices;
    const from = pg?.priceFrom ?? {};
    const item = from.addOn ? (site.addOns ?? []).find((/** @type {any} */ x) => x.id === from.addOn) : from.package ? (site.packages?.items ?? []).find((/** @type {any} */ x) => x.id === from.package) : null;
    return item?.prices ?? null;
  });
  eleventyConfig.addFilter("daysLabel", (/** @type {number} */ n) => daysLabel(n));
  eleventyConfig.addFilter("ukDay", (/** @type {string} */ d) => ukDate(d));
  eleventyConfig.addFilter("ukDayShort", (/** @type {string} */ d) => ukDate(d, false));
  // The coverage shown first: full front if the studio offers it, else its first.
  eleventyConfig.addFilter("defaultCover", (/** @type {any[]} */ cs) => (cs.find((c) => c.area === "full-front") ?? cs[0]).id);
  eleventyConfig.addFilter("journalNewest", (/** @type {any[]} */ items) => [...items].sort((a, b) => (a.date < b.date ? 1 : -1)));
}
