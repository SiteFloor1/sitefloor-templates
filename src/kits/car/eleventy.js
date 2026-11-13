// @ts-check
/** Car studio kit additions to the shared Eleventy setup: the 3D studio car and photos, prices per vehicle, legality and aftercare. */
import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { BODY, SALOON, CARS, PANEL_SHAPES, POV, SALOON_GLASS, polyPath } from "./lib/bodies.js";
import { hoursText, jobById, priceBuild } from "./lib/pricing.js";
import { ruleText, minimumLight, darkestLegal, RULES_URL, RULES_CHECKED, LAMPS_URL } from "./lib/legality.js";
import { stages, dayLabel } from "./lib/aftercare.js";
import { fromPrice } from "../../core/lib/prices.js";
import { HOME_PARTS } from "./home.js";

const SHORT = { windscreen: "Windscreen", fronts: "Front sides", rear: "Rear" };

/** @param {any} eleventyConfig */
export default function carKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addGlobalData("tintLaw", { url: RULES_URL, checked: RULES_CHECKED, lampsUrl: LAMPS_URL });
  // Each 3D car's download size, shown on the button that loads it.
  const mb = (/** @type {string} */ f) => (statSync(fileURLToPath(new URL(f.startsWith("img/cars/") ? `../../core/assets/cars/${f.slice(9)}` : `./assets/${f.replace("img/kit/", "")}`, import.meta.url))).size / 1048576).toFixed(1);
  const cars = Object.fromEntries(Object.entries(CARS).map(([k, c]) => [k, { ...c, mb: mb(c.model) }]));
  eleventyConfig.addGlobalData("carKit", { POV, BODY, panels: PANEL_SHAPES, saloonGlass: SALOON_GLASS, saloon: SALOON, cars, car: cars.supercar });
  // The 3D car for a vehicle size (the concept supercar for any size without its own).
  eleventyConfig.addFilter("setKey", (/** @type {Record<string, any>} */ o, /** @type {string} */ k, /** @type {any} */ v) => { o[k] = v; return o; });
  eleventyConfig.addFilter("carFor", (/** @type {string} */ body) => cars[/** @type {keyof typeof cars} */ (body)] ?? cars.supercar);
  eleventyConfig.addFilter("polyPath", polyPath);
  eleventyConfig.addFilter("money", (/** @type {number} */ n) => `£${n.toLocaleString("en-GB")}`);
  eleventyConfig.addFilter("hoursText", hoursText);
  eleventyConfig.addFilter("job", (/** @type {any[]} */ jobs, /** @type {string} */ id) => jobById(jobs, id));
  eleventyConfig.addFilter("fromPrice", fromPrice);
  eleventyConfig.addFilter("minHours", (/** @type {any} */ job) => Math.min(...Object.values(/** @type {Record<string, number>} */ (job.hours))));
  eleventyConfig.addFilter("ruleText", ruleText);
  eleventyConfig.addFilter("startBuild", startBuild);
  eleventyConfig.addFilter("windowShort", (/** @type {keyof typeof SHORT} */ w) => SHORT[w]);
  eleventyConfig.addFilter("minLight", minimumLight);
  eleventyConfig.addFilter("darkestLegal", (/** @type {any[]} */ shades, /** @type {any} */ w) => darkestLegal(w, shades.filter((s) => !s.sheen), false));
  // The vehicle sizes that have a side photo, in the studio's order (a supercar has the 3D Showroom instead).
  eleventyConfig.addFilter("photoBodies", (/** @type {any[]} */ vehicles) => [...new Set(vehicles.map((v) => v.body))].filter((b) => b in BODY));
  eleventyConfig.addFilter("bodyName", (/** @type {string} */ b) => ({ hatch: "Hatchback", saloon: "Saloon", suv: "SUV", van: "Van" })[/** @type {"hatch"} */ (b)] ?? b);
  eleventyConfig.addFilter("plainShades", (/** @type {any[]} */ shades) => shades.filter((s) => !s.sheen)); // all but chameleon films
  eleventyConfig.addFilter("aftercareStages", stages);
  eleventyConfig.addFilter("dayLabel", dayLabel);
}

/**
 * The Showroom's first build (site.showroom.start), priced the same way the browser prices it.
 * @param {any} site
 */
export function startBuild(site) {
  const st = site.showroom?.start ?? {};
  const vehicle = site.vehicles.find((/** @type {any} */ v) => v.id === st.vehicle) ?? site.vehicles[0];
  const b = { vehicle: vehicle.id, before1985: false, tint: st.tint ?? {}, wrap: st.wrap ?? null, wheels: st.wheels ?? null, dechrome: Boolean(st.dechrome) };
  const priced = priceBuild(b, { jobs: site.jobs, tint: site.tint, wrap: site.wrap, showroom: site.showroom });
  return { ...b, vehicle, finish: b.wrap?.finish ?? "gloss", ...priced };
}
