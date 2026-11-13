// @ts-check
/** Jeweller kit additions to the shared Eleventy setup: pieces, their facts and prices, dates and sizes. */
import { HOME_PARTS, HOME_ELSEWHERE } from "./home.js";
import { priceLabel, factLines, specLine, inCollection, countWords, shortlist } from "./lib/pieces.js";
import { regionFromPostcode } from "../../core/lib/bank-holidays.js";
import { occasionOrder, MONTHS, monthOf } from "./lib/calendar.js";
import { UK_SIZES, SIZES_CHECKED } from "./lib/sizes.js";
import { weeklyRows } from "../../core/lib/hours.js";
import { readFileSync, existsSync } from "node:fs";

/** @param {any} eleventyConfig */
export default function jewellerKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS, elsewhere: HOME_ELSEWHERE });
  // The sections a look puts on the Plan your visit page (look.json → "visitOrder"); render.js passes only homeOrder.
  eleventyConfig.addFilter("visitOrder", (/** @type {string} */ look) => {
    const f = new URL(`../../looks/${look}/look.json`, import.meta.url);
    return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")).visitOrder ?? [] : [];
  });
  eleventyConfig.addGlobalData("ringSizes", { sizes: UK_SIZES, checked: SIZES_CHECKED });

  // The house's initials for its monogram ("Aldous Marr" → "AM").
  eleventyConfig.addFilter("monogram", (/** @type {string} */ name) => name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w) && !/^(and|&|of|the)$/i.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join(""));
  // Opening days grouped where the hours repeat ("Tue–Wed 10am–6pm").
  eleventyConfig.addFilter("hoursGroups", (/** @type {any} */ hours) => {
    const rows = weeklyRows(hours);
    /** @type {{ days: string, label: string }[]} */ const out = [];
    /** @type {any[]} */ let run = [];
    const flush = () => { if (run.length) out.push({ days: run.length > 1 ? `${run[0].day.slice(0, 3)}–${run[run.length - 1].day.slice(0, 3)}` : run[0].day.slice(0, 3), label: run[0].label }); run = []; };
    for (const r of rows) { if (run.length && run[0].label !== r.label) flush(); run.push(r); }
    flush();
    return out;
  });
  eleventyConfig.addFilter("pieceById", (/** @type {any[]} */ items, /** @type {string} */ id) => (items ?? []).find((p) => p.id === id));
  eleventyConfig.addFilter("piecesById", (/** @type {any[]} */ items, /** @type {string[]} */ ids) => (ids ?? []).map((id) => items.find((p) => p.id === id)).filter(Boolean));
  eleventyConfig.addFilter("collectionById", (/** @type {any} */ pieces, /** @type {string} */ id) => pieces.collections.find((/** @type {any} */ c) => c.id === id));
  eleventyConfig.addFilter("priceLabel", (/** @type {any} */ p) => (p ? priceLabel(p) : ""));
  eleventyConfig.addFilter("factLines", factLines);
  eleventyConfig.addFilter("specLine", specLine);
  eleventyConfig.addFilter("inCollection", inCollection);
  eleventyConfig.addFilter("countWords", countWords);
  eleventyConfig.addFilter("piecesWith", (/** @type {any[]} */ items, /** @type {string} */ key) => items.filter((p) => p[key] !== undefined && p[key] !== false && !(Array.isArray(p[key]) && !p[key].length)));
  eleventyConfig.addFilter("inShape", (/** @type {any[]} */ items, /** @type {string} */ id) => items.filter((p) => p.shape === id));
  eleventyConfig.addFilter("forMonth", (/** @type {any[]} */ items, /** @type {number} */ m) => items.filter((p) => (p.months ?? []).includes(m)));
  eleventyConfig.addFilter("forOccasion", (/** @type {any[]} */ items, /** @type {any} */ o) => (o.pieces?.length ? o.pieces.map((/** @type {string} */ id) => items.find((p) => p.id === id)).filter(Boolean) : items.filter((p) => (p.occasions ?? []).includes(o.id))));
  eleventyConfig.addFilter("inBand", (/** @type {any[]} */ items, /** @type {any} */ b) => items.filter((p) => typeof p.price === "number" && p.gift && (b.min === undefined || p.price >= b.min) && (b.max === undefined || p.price <= b.max)));
  eleventyConfig.addFilter("occasionOrder", (/** @type {any[]} */ list, /** @type {string} */ today) => { const o = occasionOrder(list, today); return { ...o, all: o.lead ? [o.lead, ...o.rest] : [] }; });
  // Three within a price band for a gift (the occasion's own pieces first).
  eleventyConfig.addFilter("shortlist", (/** @type {any[]} */ items, /** @type {any} */ band, /** @type {string[]} */ prefer) => shortlist(items, band, prefer ?? []));
  eleventyConfig.addFilter("shortlistBands", (/** @type {any[]} */ items, /** @type {any[]} */ bands, /** @type {string[]} */ prefer) => (bands ?? []).map((b) => ({ label: b.label, picks: shortlist(items, b, prefer ?? []) })).filter((b) => b.picks.length));
  eleventyConfig.addFilter("occasionPage", (/** @type {any[]} */ pages, /** @type {string} */ id) => (pages ?? []).find((p) => p.id === id));
  // The shared date picker's rules from the house's appointment settings: one day, its notice, how far ahead, its times.
  eleventyConfig.addFilter("apptRules", (/** @type {any} */ A) => ({ single: true, horizonDays: A.horizon ?? 60, leadHours: (A.notice ?? 1) * 24, bankHolidays: A.bankHolidays, slots: A.slots, slotMinutes: A.minutes ?? 60 }));
  eleventyConfig.addFilter("region", (/** @type {any} */ loc) => loc.region ?? regionFromPostcode(loc.postcode ?? ""));
  eleventyConfig.addFilter("monthName", (/** @type {number} */ m) => MONTHS[m - 1]);
  eleventyConfig.addFilter("monthOf", monthOf);
  eleventyConfig.addFilter("longDate", (/** @type {string} */ d) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }));
  eleventyConfig.addFilter("shortRange", (/** @type {any} */ o) => {
    const f = (/** @type {string} */ d) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
    return o.from === o.to ? f(o.from) : `${f(o.from)} to ${f(o.to)}`;
  });
  // Cards use a smaller copy of each piece photo (img/c/…), so a page of many pieces stays light.
  eleventyConfig.addFilter("cardSrc", (/** @type {string} */ src) => src.replace(/^img\//, "img/c/"));
  eleventyConfig.addFilter("pieceHref", (/** @type {string} */ id) => `piece-${id}`);
}
