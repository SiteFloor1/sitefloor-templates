// @ts-check
/** Driving kit additions to the shared Eleventy setup: the home sections, gov.uk's fixed wording and price helpers. */
import { HOME_PARTS, HOSTS } from "./home.js";
import { READY, TEST_DAY, LINKS, CHECKED } from "./lib/govuk.js";
import { blockSaving, span, nextWeekdays, DVSA_HOURS, DVSA_PRACTICE, LEVELS } from "./lib/driving.js";
import { ukDate } from "../../core/lib/diary.js";

/** @param {any} eleventyConfig */
export default function drivingKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS, hosts: HOSTS });
  eleventyConfig.addGlobalData("govuk", { ready: READY, testDay: TEST_DAY, links: LINKS, checked: CHECKED, dvsaHours: DVSA_HOURS, dvsaPractice: DVSA_PRACTICE, levels: LEVELS });
  eleventyConfig.addFilter("hostedHere", (/** @type {string} */ page) => Object.keys(HOME_PARTS).filter((id) => /** @type {Record<string, string>} */ (HOSTS)[id] === page));
  // { perHour, saving } for a block or course against single hours
  eleventyConfig.addFilter("saving", (/** @type {any} */ g, /** @type {string} */ k) => blockSaving(g.hour, g[k].hours, g[k].price));
  eleventyConfig.addFilter("gbp", (/** @type {number} */ n) => `£${(Math.round(n * 100) / 100).toLocaleString("en-GB", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`);
  eleventyConfig.addFilter("ukDate", (/** @type {string} */ ymd, /** @type {boolean} */ weekday) => ukDate(ymd, weekday ?? false));
  eleventyConfig.addFilter("span", (/** @type {string} */ t, /** @type {number} */ h) => span(t, h));
  eleventyConfig.addFilter("articleOf", (/** @type {any} */ site, /** @type {string} */ slug) => (site.journal?.articles ?? []).find((/** @type {any} */ a) => a.slug === slug));
  eleventyConfig.addFilter("nextWeekdays", (/** @type {string} */ today, /** @type {number[]} */ w) => nextWeekdays(today, w));
}
