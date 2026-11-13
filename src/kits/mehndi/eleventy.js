// @ts-check
/** Mehndi kit additions to the shared Eleventy setup: home sections, the design library's words, dates and messages. */
import { HOME_PARTS, onPagesProblem, homeOrderProblem } from "./home.js";
import { STYLES, COVERAGE, FOR } from "./config.js";
import { NHS_PPD, ukDate, dateText, designText, personalText, plannerText, pounds, hoursWords, guestPlan, artistsWords, guestText } from "./lib/mehndi.js";

/** @param {any} eleventyConfig */
export default function mehndiKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addGlobalData("mehndiWords", { styles: STYLES, coverage: COVERAGE, for: FOR, nhs: NHS_PPD });
  eleventyConfig.addFilter("hostedBy", (/** @type {Record<string, string[]>|null} */ onPages) => {
    const problem = onPagesProblem(onPages ?? undefined);
    if (problem) throw new Error(problem);
    return Object.fromEntries(Object.entries(onPages ?? {}).flatMap(([page, parts]) => parts.map((part) => [part, page])));
  });
  eleventyConfig.addFilter("hosted", (/** @type {Record<string, string[]>|null} */ onPages, /** @type {string} */ page) => (onPages ?? {})[page] ?? []);
  eleventyConfig.addFilter("checkHomeOrder", (/** @type {unknown} */ order) => { const p = homeOrderProblem(order ?? undefined); if (p) throw new Error(p); return order; });
  eleventyConfig.addFilter("ukDay", (/** @type {string} */ d) => ukDate(d, true));
  eleventyConfig.addFilter("ukDate", (/** @type {string} */ d) => ukDate(d, false));
  eleventyConfig.addFilter("gbp", (/** @type {number} */ n, /** @type {boolean} */ from) => `${from ? "from " : ""}${pounds(n)}`);
  // "4 hrs", "1½ hrs", "45 min"
  eleventyConfig.addFilter("hrs", (/** @type {number} */ h) => (h < 1 ? hoursWords(Math.round(h * 60)) : `${Math.floor(h)}${h % 1 ? "½" : ""} hr${h > 1 ? "s" : ""}`));
  eleventyConfig.addFilter("dateText", (/** @type {string} */ opening) => dateText(opening, ""));
  eleventyConfig.addFilter("designText", designText);
  eleventyConfig.addFilter("hideText", (/** @type {string} */ opening) => personalText(opening, { kinds: [], details: "", where: "" }));
  eleventyConfig.addFilter("plannerText", (/** @type {string} */ opening) => plannerText(opening, ""));
  eleventyConfig.addFilter("usedStyles", (/** @type {any} */ d) => Object.entries(STYLES).filter(([id]) => d.items.some((/** @type {any} */ x) => x.style === id)).map(([id, label]) => ({ id, label })));
  eleventyConfig.addFilter("usedFor", (/** @type {any} */ d) => Object.entries(FOR).filter(([id]) => d.items.some((/** @type {any} */ x) => x.for === id)).map(([id, label]) => ({ id, label })));
  // The guest sum as the page first shows it (the script takes over): { size, guests, line, from, text }.
  eleventyConfig.addFilter("guestSum", (/** @type {any} */ g) => {
    const size = g.sizes.find((/** @type {any} */ x) => x.id === g.defaultSize) ?? g.sizes[0];
    const p = guestPlan(g.start, size.minutes, g.perArtistMinutes, g.artists);
    return { size, guests: g.start, artists: artistsWords(p.artists), hours: hoursWords(p.minutes), over: p.over, from: pounds(g.start * size.price),
      text: guestText(g.message, { guests: g.start, size: size.name, minutes: size.minutes, price: g.start * size.price }) };
  });
  const N = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
  // The artist's days before, in words: "Six weeks before", "Two days before", "The day before", "On the day".
  eleventyConfig.addFilter("daysWords", (/** @type {number} */ d) => {
    if (d === 0) return "On the day";
    if (d === 1) return "The day before";
    if (d % 7 === 0 && d / 7 <= 12) return `${N[d / 7]} week${d === 7 ? "" : "s"} before`;
    return `${d <= 12 ? N[d] : d} days before`;
  });
  eleventyConfig.addFilter("yearsFrom", (/** @type {string} */ today, /** @type {number} */ n) => { const y = Number(today.slice(0, 4)); return Array.from({ length: n }, (_, i) => y + i); });
}
