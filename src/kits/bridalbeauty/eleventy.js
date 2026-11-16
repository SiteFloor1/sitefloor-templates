// @ts-check
/** Bridalbeauty kit additions to the shared Eleventy setup: home sections, the look library's words, times and messages. */
import { HOME_PARTS, onPagesProblem, homeOrderProblem } from "./home.js";
import { FINISH, HAIR } from "./config.js";
import { pounds, hoursWords, clockWords, minutesOf, morningPlan, numberWord, dateText, lookText, trialText, travelText, skinText, quoteTotal, travelFor } from "./lib/bridalbeauty.js";

/** @param {any} eleventyConfig */
export default function bridalBeautyKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addGlobalData("bbWords", { finish: FINISH, hair: HAIR });
  eleventyConfig.addFilter("hostedBy", (/** @type {Record<string, string[]>|null} */ onPages) => {
    const problem = onPagesProblem(onPages ?? undefined);
    if (problem) throw new Error(problem);
    return Object.fromEntries(Object.entries(onPages ?? {}).flatMap(([page, parts]) => parts.map((part) => [part, page])));
  });
  eleventyConfig.addFilter("hosted", (/** @type {Record<string, string[]>|null} */ onPages, /** @type {string} */ page) => (onPages ?? {})[page] ?? []);
  eleventyConfig.addFilter("checkHomeOrder", (/** @type {unknown} */ order) => { const p = homeOrderProblem(order ?? undefined); if (p) throw new Error(p); return order; });
  eleventyConfig.addFilter("gbp", (/** @type {number} */ n, /** @type {boolean} */ from) => `${from ? "from " : ""}${pounds(n)}`);
  eleventyConfig.addFilter("mins", (/** @type {number} */ m) => hoursWords(m));
  eleventyConfig.addFilter("clockWords", (/** @type {string} */ hm) => clockWords(minutesOf(hm)));
  eleventyConfig.addFilter("numberWord", numberWord);
  eleventyConfig.addFilter("dateText", (/** @type {string} */ opening, /** @type {string} */ service) => dateText(opening, "", service ?? ""));
  eleventyConfig.addFilter("lookText", lookText);
  eleventyConfig.addFilter("trialText", (/** @type {string} */ opening) => trialText(opening, { wedding: "", where: "", guests: "" }));
  eleventyConfig.addFilter("travelText", (/** @type {string} */ opening) => travelText(opening, ""));
  eleventyConfig.addFilter("skinText", (/** @type {string} */ opening) => skinText(opening, ""));
  eleventyConfig.addFilter("usedFinish", (/** @type {any[]} */ items) => Object.entries(FINISH).filter(([id]) => items.some((x) => x.finish === id)).map(([id, label]) => ({ id, label })));
  eleventyConfig.addFilter("usedHair", (/** @type {any[]} */ items) => Object.entries(HAIR).filter(([id]) => items.some((x) => x.hair === id)).map(([id, label]) => ({ id, label })));
  // A worked example on a guide page: every line points at a price stated once elsewhere (a package or extra, the
  // second artist's fee, a travel district), so a guide can never quote what the bridal page doesn't.
  eleventyConfig.addFilter("guideQuote", (/** @type {any} */ b, /** @type {any} */ site) => {
    const pk = site.packages ?? {};
    const lines = b.lines.map((/** @type {any} */ l) => {
      const count = l.count ?? 1;
      /** @type {{ name: string, price: number }|undefined} */ let x;
      if (l.package) {
        const [kind, id] = String(l.package).split(":");
        const list = { bride: pk.bride, party: pk.party, extra: pk.extras }[/** @type {"bride"} */ (kind)] ?? [];
        const y = list.find((/** @type {any} */ z) => z.id === id);
        x = y && { name: count > 1 || !y.one ? y.name : y.one, price: y.price };
      } else if (l.second) x = { name: "A second artist", price: site.morning.secondArtist.fee };
      else if (l.travel) { const t = travelFor(String(l.travel), site.travel); x = { name: `Travel to ${t.district}`, price: t.fee ?? 0 }; }
      if (!x) throw new Error(`guide quote: can't price ${JSON.stringify(l)}`);
      return { name: x.name, count, price: x.price, sum: x.price * count };
    });
    return { lines, total: lines.reduce((/** @type {number} */ t, /** @type {any} */ l) => t + l.sum, 0) };
  });
  // The menu's pages after the site's own links: each guide page, then the journal.
  eleventyConfig.addFilter("bbMenu", (/** @type {any} */ site, /** @type {string} */ pageId) => [
    ...(site.features.includes("bridalbeauty-guides") ? site.guides ?? [] : []).map((/** @type {any} */ g) => ({ slug: g.slug, label: g.menu, current: g.slug === pageId })),
    ...(site.features.includes("bridalbeauty-journal") && site.journal ? [{ slug: "journal", label: site.journal.title, current: pageId === "journal" || pageId.startsWith("journal-") }] : []),
  ]);
  eleventyConfig.addFilter("byIds", (/** @type {any[]} */ items, /** @type {string[]} */ ids) => ids.map((id) => items.find((x) => x.id === id)).filter(Boolean));
  // The morning as the page first shows it, before the script takes over: the default ceremony, the party the quote
  // starts with, one artist. { start, ready, dressAt, leave, people, early } in words.
  eleventyConfig.addFilter("firstMorning", (/** @type {any} */ site) => {
    const m = site.morning, bride = site.packages.bride[0];
    const guests = site.packages.party.flatMap((/** @type {any} */ p) => Array.from({ length: site.party?.start?.[p.id] ?? 0 }, () => ({ label: p.one, minutes: p.minutes })));
    const plan = morningPlan({ ceremony: minutesOf(m.ceremony.default), bride: bride.minutes, guests, travel: m.travelMinutes, dress: m.dressMinutes, buffer: m.bufferMinutes, artists: 1 });
    const early = plan.start < minutesOf(m.earlyStart.before) && m.earlyStart.fee > 0;
    const lines = site.packages.party.map((/** @type {any} */ p) => ({ price: p.price, count: site.party?.start?.[p.id] ?? 0 }));
    return { start: clockWords(plan.start), ready: clockWords(plan.ready), dressAt: clockWords(plan.dressAt), leave: clockWords(plan.leave),
      people: numberWord(guests.length + 1), early, ceremony: clockWords(minutesOf(m.ceremony.default)),
      total: pounds(quoteTotal({ bride: bride.price, lines, early: early ? m.earlyStart.fee : 0, second: 0 })) };
  });
  const N = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
  // The artist's days before, in words: "Twelve weeks before", "Two days before", "The night before", "On the morning".
  eleventyConfig.addFilter("daysWords", (/** @type {number} */ d) => {
    if (d === 0) return "On the morning";
    if (d === 1) return "The night before";
    if (d % 7 === 0 && d / 7 <= 12) return `${N[d / 7]} week${d === 7 ? "" : "s"} before`;
    return `${d <= 12 ? N[d] : d} days before`;
  });
  eleventyConfig.addFilter("yearsFrom", (/** @type {string} */ today, /** @type {number} */ n) => { const y = Number(today.slice(0, 4)); return Array.from({ length: n }, (_, i) => y + i); });
}
