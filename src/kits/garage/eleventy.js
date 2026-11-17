// @ts-check
/** Garage kit additions to the shared Eleventy setup: the home sections, the drawn plan and the words built from the hall. */
import { HOME_PARTS } from "./home.js";
import { CARS, allBays, pickBay, answer, planSvg, chargerWords, chargedBy, pounds, reserveMessage, careCardMessage, metres, nightBayLine } from "./lib/garage.js";

/** @param {any} eleventyConfig */
export default function garageKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addGlobalData("garageCars", CARS);
  eleventyConfig.addFilter("gbp", (/** @type {number} */ n) => pounds(n));
  eleventyConfig.addFilter("metres", (/** @type {number} */ n) => metres(n));
  eleventyConfig.addFilter("bays", (/** @type {any} */ hall) => (hall ? allBays(hall) : []));
  eleventyConfig.addFilter("freeBays", (/** @type {any} */ hall) => (hall ? allBays(hall).filter((b) => b.free) : []));
  eleventyConfig.addFilter("chargerBays", (/** @type {any} */ hall) => (hall ? allBays(hall).filter((b) => b.charger) : []));
  // The price range of the bays, "£240 to £320", or one price.
  eleventyConfig.addFilter("priceRange", (/** @type {any} */ hall) => {
    const p = allBays(hall).map((b) => b.price).filter((x) => typeof x === "number");
    if (!p.length) return "";
    const lo = Math.min(...p), hi = Math.max(...p);
    return lo === hi ? pounds(lo) : `${pounds(lo)} to ${pounds(hi)}`;
  });
  eleventyConfig.addFilter("plan", (/** @type {any} */ hall, /** @type {any} */ cameras) => planSvg(hall, { cameras: cameras ?? [] }));
  eleventyConfig.addFilter("chargerWords", (/** @type {any} */ hall) => chargerWords(hall));
  eleventyConfig.addFilter("chargedBy", (/** @type {any} */ c) => chargedBy(c));
  // The picker's first answer, before any choice, for the car the look starts on.
  eleventyConfig.addFilter("firstAnswer", (/** @type {any} */ hall, /** @type {string} */ key) => {
    const car = CARS[/** @type {keyof typeof CARS} */ (key)];
    return answer(car, pickBay(hall, car), hall.bayDepth);
  });
  eleventyConfig.addFilter("reserveText", (/** @type {any} */ hall, /** @type {string} */ shop, /** @type {string} */ key) => {
    const car = CARS[/** @type {keyof typeof CARS} */ (key)];
    return reserveMessage(shop, car, pickBay(hall, car));
  });
  eleventyConfig.addFilter("nightLine", (/** @type {any} */ hall, /** @type {string} */ key) => {
    const car = CARS[/** @type {keyof typeof CARS} */ (key)];
    return nightBayLine(car, pickBay(hall, car));
  });
  eleventyConfig.addFilter("careText", (/** @type {string} */ shop) => careCardMessage(shop, "…"));
}
