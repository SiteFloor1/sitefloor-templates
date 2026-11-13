// @ts-check
/** Bakery kit additions to the shared Eleventy setup: allergens and diet marks, menu items, cakes and prices. */
import { ALLERGENS, BAKERY_DIETS, ALLERGEN_GUIDANCE, allergenNames, hasDiet } from "../../core/lib/allergens.js";
import { quote, longDay } from "./lib/cake.js";
import { HOME_PARTS } from "./home.js";
import { voteLink } from "./lib/vote.js";
import { GRIDS, flightOrder } from "./lib/box.js";
import { doorOrder, behindDoors } from "./lib/advent.js";
import { toMinutes, formatTime12 } from "../../core/lib/hours.js";

/** @param {any} eleventyConfig */
export default function bakeryKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addGlobalData("sweets", { allergens: ALLERGENS, diets: BAKERY_DIETS, guidance: ALLERGEN_GUIDANCE });

  /** Every item, in menu order. @param {any} d */
  const itemsOf = (d) => d.sections.flatMap((/** @type {any} */ s) => s.items.map((/** @type {any} */ i) => ({ ...i, section: s.id })));
  eleventyConfig.addFilter("sweetItems", itemsOf);
  eleventyConfig.addFilter("sweetItem", (/** @type {any} */ d, /** @type {string} */ id) => itemsOf(d).find((/** @type {any} */ i) => i.id === id));
  eleventyConfig.addFilter("counterItems", (/** @type {any} */ d) => itemsOf(d).filter((/** @type {any} */ i) => i.counter));
  // The advent lid: the 24 days in their shuffled places, each with its piece (the shop's list, else its box pieces in turn).
  eleventyConfig.addFilter("adventDoors", (/** @type {any} */ d, /** @type {any} */ a) => {
    const behind = behindDoors(flightOrder(itemsOf(d).filter((/** @type {any} */ i) => i.box && i.tile)), a.windows ?? []);
    return doorOrder(a.year).map((day) => ({ day, piece: behind[day - 1] }));
  });
  eleventyConfig.addFilter("boxItems", (/** @type {any} */ d) => itemsOf(d).filter((/** @type {any} */ i) => i.box));
  eleventyConfig.addFilter("takeawayItems", (/** @type {any} */ d) => itemsOf(d).filter((/** @type {any} */ i) => i.takeaway));
  eleventyConfig.addFilter("signatureItems", (/** @type {any} */ d) => itemsOf(d).filter((/** @type {any} */ i) => i.signature && i.photo));
  eleventyConfig.addFilter("allergenNames", allergenNames);
  eleventyConfig.addFilter("sweetMarks", (/** @type {any} */ item) => BAKERY_DIETS.filter((d) => (item.diets ?? []).includes(d.id)));
  eleventyConfig.addFilter("hasDiet", hasDiet);
  eleventyConfig.addFilter("cakeQuote", (/** @type {any} */ cakes) => quote(cakes, cakes.start));
  eleventyConfig.addFilter("cakePart", (/** @type {any[]} */ list, /** @type {string} */ id) => list.find((x) => x.id === id));
  eleventyConfig.addFilter("cakeSize", (/** @type {any} */ cakes, /** @type {string} */ stack) => {
    const s = cakes.stacks.find((/** @type {any} */ x) => x.id === stack);
    const sizes = s.sizes.map((/** @type {string} */ id) => cakes.sizes.find((/** @type {any} */ z) => z.id === id));
    return { price: sizes.reduce((a, z) => a + z.price, 0), servings: sizes.reduce((a, z) => a + z.servings, 0), tiers: sizes.length };
  });
  eleventyConfig.addFilter("longDay", longDay);
  eleventyConfig.addFilter("voteLink", voteLink);
  eleventyConfig.addFilter("sealMonogram", (/** @type {string} */ name) => { const w = name.split(/\s+/).filter(Boolean); return [(w[0] ?? "")[0] ?? "", (w[1] ?? w[0] ?? "")[w[1] ? 0 : 1] ?? ""].map((c) => c.toUpperCase()); });
  eleventyConfig.addFilter("boxGrid", (/** @type {number} */ n) => GRIDS[n] ?? [n, 1]);
  eleventyConfig.addFilter("flightItems", (/** @type {any} */ d) => flightOrder(itemsOf(d).filter((/** @type {any} */ i) => i.box && i.notes && i.tasteOrder)));
  eleventyConfig.addFilter("shelves", (/** @type {any} */ d) => d.sections.map((/** @type {any} */ s) => ({ ...s, items: s.items.filter((/** @type {any} */ i) => i.counter && i.photo) })).filter((/** @type {any} */ s) => s.items.length));
  eleventyConfig.addFilter("t12", (/** @type {string} */ hm) => formatTime12(toMinutes(hm)));
  eleventyConfig.addFilter("longDate", (/** @type {string} */ d) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }));
  eleventyConfig.addFilter("price", (/** @type {number} */ n) => (Number.isInteger(n) ? String(n) : n.toFixed(2)));
}
