// @ts-check
/** Letting kit additions to the shared Eleventy setup: the home sections, the Tenant Fees rules and money formats. */
import { HOME_PARTS } from "./home.js";
import { RULES, pounds, pence, tenantSide, ownerSide } from "./lib/fees.js";

const ukDate = (/** @type {string} */ ymd) => new Date(`${ymd}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** @param {any} eleventyConfig */
export default function lettingKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addGlobalData("tenantRules", { ...RULES, updatedText: ukDate(RULES.updated), checkedText: ukDate(RULES.checked) });
  eleventyConfig.addFilter("pounds", pounds);
  eleventyConfig.addFilter("pence", pence);
  eleventyConfig.addFilter("tenantSide", (/** @type {number} */ rent, /** @type {any} */ tenant) => tenantSide(rent, tenant));
  eleventyConfig.addFilter("ownerSide", (/** @type {number} */ rent, /** @type {any} */ service) => ownerSide(rent, service));
  eleventyConfig.addFilter("thousands", (/** @type {number} */ n) => n.toLocaleString("en-GB"));
  eleventyConfig.addFilter("building", (/** @type {any} */ homes, /** @type {string} */ id) => (homes?.buildings ?? []).find((/** @type {any} */ b) => b.id === id));
  // floors from the top down, across every building: 6 … 1, G, LG
  const rank = (/** @type {string} */ id) => (id === "G" ? 0 : id === "LG" ? -1 : id === "B" ? -2 : /^\d+$/.test(id) ? Number(id) : 0.5);
  eleventyConfig.addFilter("floorRows", (/** @type {any[]} */ bs) => [...new Set(bs.flatMap((b) => b.floors.map((/** @type {any} */ f) => f.id)))].sort((a, b) => rank(b) - rank(a)));
  eleventyConfig.addFilter("floorOf", (/** @type {any} */ b, /** @type {string} */ id) => b.floors.find((/** @type {any} */ f) => f.id === id));
  eleventyConfig.addFilter("lines", (/** @type {string} */ t) => String(t).split("|"));
  eleventyConfig.addFilter("demoTag", (/** @type {string} */ mode) => (mode === "demo" ? " (demo)" : ""));
}
