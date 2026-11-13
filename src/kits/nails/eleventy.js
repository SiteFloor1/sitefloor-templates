// @ts-check
/** Nails kit additions to the shared Eleventy setup: home sections, shades, the menu's words, dates in UK order. */
import { HOME_PARTS, onPagesProblem, homeOrderProblem } from "./home.js";
import { SYSTEMS, FINISHES, FAMILIES, shadeLine, isDarkShade } from "./lib/shade.js";
import { SHAPES, LENGTHS, timeWords, price, byMinutes } from "./lib/menu.js";
import { editLive, monthName, ukDate } from "./lib/dates.js";
import { shadeText } from "./lib/messages.js";
import { EDIT_KINDS } from "./config.js";

/** @param {any} eleventyConfig */
export default function nailsKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addGlobalData("nailWords", { systems: SYSTEMS, finishes: FINISHES, families: FAMILIES, shapes: SHAPES, lengths: LENGTHS, editKinds: EDIT_KINDS });
  eleventyConfig.addFilter("hostedBy", (/** @type {Record<string, string[]>|null} */ onPages) => {
    const problem = onPagesProblem(onPages ?? undefined);
    if (problem) throw new Error(problem);
    return Object.fromEntries(Object.entries(onPages ?? {}).flatMap(([page, parts]) => parts.map((part) => [part, page])));
  });
  eleventyConfig.addFilter("hosted", (/** @type {Record<string, string[]>|null} */ onPages, /** @type {string} */ page) => (onPages ?? {})[page] ?? []);
  eleventyConfig.addFilter("checkHomeOrder", (/** @type {unknown} */ order) => { const p = homeOrderProblem(order ?? undefined); if (p) throw new Error(p); return order; });
  eleventyConfig.addFilter("shade", (/** @type {any} */ shades, /** @type {string} */ id) => shades.items.find((/** @type {any} */ s) => s.id === id));
  eleventyConfig.addFilter("shadeLine", shadeLine);
  eleventyConfig.addFilter("darkShade", isDarkShade);
  eleventyConfig.addFilter("shadeText", (/** @type {string} */ opening, /** @type {any} */ s) => shadeText(opening, `${s.name} (No. ${s.no})`));
  // The rail: the shades the hand is photographed in first (Starter and Plus), then the rest of the salon's chosen rail.
  eleventyConfig.addFilter("railShades", (/** @type {any} */ shades, /** @type {any} */ hand) => {
    const shot = [hand.wearing, ...(hand.shots ?? []).map((/** @type {any} */ s) => s.shade)];
    const rest = (shades.rail ?? []).filter((/** @type {string} */ id) => !shot.includes(id));
    const find = (/** @type {string} */ id) => shades.items.find((/** @type {any} */ s) => s.id === id);
    return [...shot.map((id) => ({ shade: find(id), photo: true })), ...rest.map((/** @type {string} */ id) => ({ shade: find(id), photo: false }))].filter((x) => x.shade);
  });
  eleventyConfig.addFilter("shotOf", (/** @type {any} */ hand, /** @type {string} */ id) => (id === hand.wearing ? hand.src : (hand.shots ?? []).find((/** @type {any} */ s) => s.shade === id)?.src ?? ""));
  eleventyConfig.addFilter("families", (/** @type {any} */ shades) => Object.entries(FAMILIES).filter(([id]) => shades.items.some((/** @type {any} */ s) => s.family === id)).map(([id, label]) => ({ id, label })));
  eleventyConfig.addFilter("byNumber", (/** @type {any[]} */ items) => [...items].sort((a, b) => a.no - b.no));
  eleventyConfig.addFilter("byMinutes", byMinutes);
  eleventyConfig.addFilter("timeWords", timeWords);
  eleventyConfig.addFilter("price", (/** @type {number} */ n, /** @type {boolean} */ from) => price(n, Boolean(from)));
  eleventyConfig.addFilter("editLive", (/** @type {any} */ e, /** @type {string} */ today) => editLive(e.month, today));
  eleventyConfig.addFilter("monthName", monthName);
  eleventyConfig.addFilter("ukDate", (/** @type {string} */ d) => ukDate(d, false));
  eleventyConfig.addFilter("level", (/** @type {any} */ art, /** @type {string} */ id) => art.levels.find((/** @type {any} */ l) => l.id === id));
  eleventyConfig.addFilter("artItem", (/** @type {any} */ art, /** @type {string} */ id) => (art?.items ?? []).find((/** @type {any} */ x) => x.id === id));
  eleventyConfig.addFilter("usedShapes", (/** @type {any} */ art) => Object.entries(SHAPES).filter(([id]) => art.items.some((/** @type {any} */ x) => x.shape === id)).map(([id, label]) => ({ id, label })));
  eleventyConfig.addFilter("usedLengths", (/** @type {any} */ art) => Object.entries(LENGTHS).filter(([id]) => art.items.some((/** @type {any} */ x) => x.length === id)).map(([id, label]) => ({ id, label })));
  eleventyConfig.addFilter("menuItem", (/** @type {any} */ menu, /** @type {string} */ id) => menu.bands.flatMap((/** @type {any} */ b) => b.items).find((/** @type {any} */ x) => x.id === id));
  const N = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
  // The salon's days before, in words: "Six weeks before", "Ten days before", "The day before", "On the day".
  eleventyConfig.addFilter("daysWords", (/** @type {number} */ d) => {
    if (d === 0) return "On the day";
    if (d === 1) return "The day before";
    if (d % 7 === 0 && d / 7 <= 12) return `${N[d / 7]} week${d === 7 ? "" : "s"} before`;
    return `${d <= 12 ? N[d] : d} days before`;
  });
  eleventyConfig.addFilter("yearsFrom", (/** @type {string} */ today, /** @type {number} */ n) => { const y = Number(today.slice(0, 4)); return Array.from({ length: n }, (_, i) => y + i); });
}
