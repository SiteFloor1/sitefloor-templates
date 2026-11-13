// @ts-check
/** Car hire kit additions to the shared Eleventy setup: the fleet, prices and rules in words, and fleet page addresses. */
import { HOME_PARTS } from "./home.js";
import { classesOf, leadingClass, fromPrice, carName, filterFlags, sorted, pick, SEAT_STEPS, POWER_STEPS, BUDGET_STEPS } from "./lib/fleet.js";
import { money } from "./lib/quote.js";
import { driverLine } from "./lib/rules.js";

/**
 * A fleet page's file and address. Pretty links (Cloudflare) keep folders: /fleet/suv, /cars/bmw-m5. File previews
 * (--links html) flatten them (fleet-suv.html) so every page sits beside the assets and relative links still work.
 * @param {"fleet"|"cars"} kind @param {string} id @param {"pretty"|"html"} links
 */
export const fleetFile = (kind, id, links) => (links === "html" ? `${kind}-${id}.html` : `${kind}/${id}.html`);
/** @param {"fleet"|"cars"} kind @param {string} id @param {"pretty"|"html"} links */
export const fleetUrl = (kind, id, links) => (links === "html" ? `${kind}-${id}.html` : `/${kind}/${id}`);

/** @param {any} eleventyConfig */
export default function hireKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addGlobalData("fleetSteps", { seats: SEAT_STEPS, power: POWER_STEPS, budget: BUDGET_STEPS });

  eleventyConfig.addFilter("carFile", (/** @type {string} */ id, /** @type {any} */ links) => fleetFile("cars", id, links));
  eleventyConfig.addFilter("carUrl", (/** @type {string} */ id, /** @type {any} */ links) => fleetUrl("cars", id, links));
  eleventyConfig.addFilter("classFile", (/** @type {string} */ id, /** @type {any} */ links) => fleetFile("fleet", id, links));
  eleventyConfig.addFilter("classUrl", (/** @type {string} */ id, /** @type {any} */ links) => fleetUrl("fleet", id, links));

  eleventyConfig.addFilter("fleetClasses", classesOf);
  eleventyConfig.addFilter("leadClass", leadingClass);
  eleventyConfig.addFilter("classCars", (/** @type {any} */ fleet, /** @type {string} */ id) => sorted(fleet.cars.filter((/** @type {any} */ c) => c.class === id)));
  eleventyConfig.addFilter("className", (/** @type {any} */ fleet, /** @type {string} */ id) => fleet.classes.find((/** @type {any} */ k) => k.id === id)?.name ?? id);
  eleventyConfig.addFilter("fleetSorted", (/** @type {any[]} */ cars) => sorted(cars));
  eleventyConfig.addFilter("pickCars", (/** @type {any} */ fleet, /** @type {string[]} */ ids) => pick(fleet.cars, ids));
  eleventyConfig.addFilter("selfDrive", (/** @type {any[]} */ cars) => cars.filter((c) => !c.chauffeurOnly));
  eleventyConfig.addFilter("withChauffeur", (/** @type {any[]} */ cars) => cars.filter((c) => c.chauffeur));
  eleventyConfig.addFilter("withMonth", (/** @type {any[]} */ cars) => sorted(cars.filter((c) => c.rates?.month !== undefined)));
  eleventyConfig.addFilter("carName", carName);
  eleventyConfig.addFilter("carFlags", (/** @type {any} */ c) => filterFlags(c).join(" "));
  eleventyConfig.addFilter("fromAmount", (/** @type {any} */ c) => fromPrice(c)?.amount ?? "");
  eleventyConfig.addFilter("fromLine", (/** @type {any} */ c) => {
    const p = fromPrice(c);
    return p ? `From ${money(p.amount)} ${p.per === "hour" ? "an hour" : "a day"}` : "Ask us";
  });
  eleventyConfig.addFilter("money", money);
  eleventyConfig.addFilter("driverLine", driverLine);
  /** The car's trim line: year, trim, seats. */
  eleventyConfig.addFilter("trimLine", (/** @type {any} */ c) => [c.year, c.trim, c.seats === 1 ? "one seat" : `${words(c.seats)} seats`].filter(Boolean).join(" · "));
  eleventyConfig.addFilter("mileLine", (/** @type {any} */ c) => (c.miles?.perDay === "unlimited" ? "Unlimited miles" : `${c.miles.perDay} miles a day, then ${money(c.miles.extra)} a mile`));
  eleventyConfig.addFilter("excessLine", (/** @type {any} */ c) => `${c.insurance.cover}, ${money(c.insurance.excess)} excess`);
  eleventyConfig.addFilter("reductionLine", (/** @type {any} */ c) => {
    const r = c.insurance?.reduction;
    return r ? `Reduce the excess to ${money(r.to)} for ${money(r.price)} ${r.per === "day" ? "a day" : "a hire"}` : "No excess reduction on this car";
  });
  /** Delivery for one car in a line: the cheapest and dearest zone fee, or collection only. */
  eleventyConfig.addFilter("deliveryLine", (/** @type {any} */ c, /** @type {any} */ hire) => {
    if (c.chauffeurOnly) return "With a chauffeur, to your door";
    const zones = hire.delivery.zones;
    if (!c.delivery || !zones.length) return hire.delivery.collect;
    const fees = zones.map((/** @type {any} */ z) => z.fee);
    const lo = Math.min(...fees); const hi = Math.max(...fees);
    return lo === hi ? `To your door ${lo ? money(lo) : "free"}` : `To your door from ${lo ? money(lo) : "free"} to ${money(hi)}`;
  });
  eleventyConfig.addFilter("words", words);
  /** Cars Delivered tonight can bring: self-drive cars that can be delivered, with what the quote needs. */
  eleventyConfig.addFilter("tonightCars", (/** @type {any[]} */ cars) => sorted(cars.filter((c) => !c.chauffeurOnly && c.delivery)).map((c) => ({
    id: c.id, name: carName(c), rates: c.rates, deposit: c.deposit, miles: c.miles, payLink: c.payLink ?? null,
    photo: c.photos.arrival ?? c.photos.card, arrival: Boolean(c.photos.arrival),
  })));
  eleventyConfig.addFilter("checkCars", (/** @type {any[]} */ cars) => sorted(cars).map((c) => ({ id: c.id, name: carName(c), photo: c.photos.small ?? c.photos.card })));
  eleventyConfig.addFilter("uniquePayLinks", (/** @type {any[]} */ cars) => [...new Set(cars.map((c) => c.payLink).filter(Boolean))]);
  /** Each car's comparable lines, for "compare" (the client's figures only; missing ones stay null). */
  eleventyConfig.addFilter("compareRows", (/** @type {any[]} */ cars) => cars.map((c) => {
    const p = fromPrice(c);
    return {
      id: c.id, name: carName(c), from: p ? `${money(p.amount)} ${p.per === "hour" ? "an hour" : "a day"}` : null, power: c.power ?? null,
      zero: c.zeroToSixtyTwo ?? null, seats: c.seats, boot: c.boot ?? null, gearbox: c.gearbox ?? null, deposit: c.chauffeurOnly ? null : c.deposit ?? null,
      excess: c.insurance?.excess ?? null, driver: c.driver ? driverLine(c.driver) : null,
      miles: c.miles ? (c.miles.perDay === "unlimited" ? "Unlimited" : `${c.miles.perDay} a day, then ${money(c.miles.extra)}`) : null,
    };
  }));
  eleventyConfig.addFilter("longDate", (/** @type {string} */ d) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }));
}

/** Small numbers as words, as a luxury copywriter would. @param {number} n */
function words(n) {
  return ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][n] ?? String(n);
}
