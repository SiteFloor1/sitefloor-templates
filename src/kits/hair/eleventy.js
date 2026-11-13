// @ts-check
/** Hair kit additions to the shared Eleventy setup: home sections, prices and times in words, lookups by id, UK dates. */
import { HOME_PARTS, onPagesProblem } from "./home.js";
import { money, hm, priceAt, minutesAt, byLength, fromPrice, fromWords, upkeepVisits, monthShort } from "./lib/hair.js";
import { addDaysYmd, ukDate } from "../../core/lib/diary.js";

/** @param {any[]} list @param {string} id */
const byId = (list, id) => (list ?? []).find((x) => x.id === id) ?? null;

/** @param {any} eleventyConfig */
export default function hairKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addFilter("hostedBy", (/** @type {Record<string, string[]>|null} */ onPages) => {
    const problem = onPagesProblem(onPages ?? undefined);
    if (problem) throw new Error(problem);
    return Object.fromEntries(Object.entries(onPages ?? {}).flatMap(([page, parts]) => parts.map((part) => [part, page])));
  });
  eleventyConfig.addFilter("hosted", (/** @type {Record<string, string[]>|null} */ onPages, /** @type {string} */ page) => (onPages ?? {})[page] ?? []);
  eleventyConfig.addFilter("money", money);
  eleventyConfig.addFilter("hm", hm);
  eleventyConfig.addFilter("fromWords", fromWords);
  eleventyConfig.addFilter("fromPrice", fromPrice);
  eleventyConfig.addFilter("byLength", byLength);
  // A cell of the price grid: "£92", or "–" when that level doesn't offer it.
  eleventyConfig.addFilter("cell", (/** @type {any} */ s, /** @type {string} */ level, /** @type {number} */ i) => { const p = priceAt(s, level, i); return p === null ? "–" : money(p); });
  eleventyConfig.addFilter("priceAt", priceAt);
  eleventyConfig.addFilter("minutesAt", minutesAt);
  eleventyConfig.addFilter("idOf", byId);
  eleventyConfig.addFilter("servicesIn", (/** @type {any} */ menu, /** @type {string} */ group) => menu.services.filter((/** @type {any} */ s) => s.group === group));
  eleventyConfig.addFilter("stylistsFor", (/** @type {any[]} */ items, /** @type {string[]} */ ids) => ids.map((id) => byId(items, id)).filter(Boolean));
  // "Marcus and Ada": the stylists' first names, in the order given.
  eleventyConfig.addFilter("firstNames", (/** @type {any[]} */ items, /** @type {string[]} */ ids) => {
    const n = ids.map((id) => byId(items, id)?.name.split(" ")[0]).filter(Boolean);
    return n.length < 2 ? n.join("") : `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`;
  });
  eleventyConfig.addFilter("namesList", (/** @type {string[]} */ names) => (names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`));
  // "about 1 hr" or "about 1 hr–1 hr 30 min" across the lengths.
  eleventyConfig.addFilter("timeRange", (/** @type {any} */ s) => {
    const m = Array.isArray(s.minutes) ? s.minutes : [s.minutes];
    const lo = Math.min(...m), hi = Math.max(...m);
    return lo === hi ? `about ${hm(lo)}` : `${hm(lo)} to ${hm(hi)}`;
  });
  // The colour year as it first paints: twelve months from this one, with the visits after a colour three weeks ago.
  eleventyConfig.addFilter("colourYear", (/** @type {string} */ today, /** @type {number} */ weeks) => {
    const visits = upkeepVisits(addDaysYmd(today, -21), weeks, today);
    const [y, m] = today.split("-").map(Number);
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(Date.UTC(y, m - 1 + i, 1)), key = d.toISOString().slice(0, 7);
      const hit = visits.find((v) => v.startsWith(key));
      return { month: monthShort(`${key}-01`), now: i === 0, day: hit ? Number(hit.slice(8, 10)) : null };
    });
  });
  eleventyConfig.addFilter("byWeeks", (/** @type {any[]} */ steps) => [...steps].sort((a, b) => b.weeksBefore - a.weeksBefore));
  eleventyConfig.addFilter("ukDay", (/** @type {string} */ d) => ukDate(d, false));
  eleventyConfig.addFilter("newestFirst", (/** @type {any[]} */ items) => [...items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)));
  eleventyConfig.addFilter("usedTags", (/** @type {any} */ looks) => looks.filters.filter((/** @type {any} */ f) => looks.items.some((/** @type {any} */ l) => l.tags.includes(f.id))));
  eleventyConfig.addFilter("yearsFrom", (/** @type {string} */ today, /** @type {number} */ n, /** @type {number} */ from = 0) => { const y = Number(today.slice(0, 4)) + from; return Array.from({ length: n }, (_, i) => y + i); });
}
