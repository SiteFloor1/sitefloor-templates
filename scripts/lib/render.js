// @ts-check
/**
 * Renders a site's pages with Eleventy. All template helpers (filters) live
 * here so templates stay free of logic and every helper is in one place.
 */
import { rm, cp } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import Eleventy from "@11ty/eleventy";
import { FEATURES, KITS, forKit, getFeature, planRank } from "../../src/features/registry.js";
import { localBusinessJsonLd, safeJson } from "../../src/core/lib/seo.js";
import { waUrl } from "../../src/core/lib/whatsapp.js";
import { bookingHref, bookingLabel, bookingOf } from "../../src/core/lib/booking.js";
import { inlineMarkup, plainText, monthYear, mapsSearchUrl } from "../../src/core/lib/text.js";
import { resolvePriceItem } from "../../src/core/lib/prices.js";
import { postsFromPhotos } from "../../src/core/lib/feed.js";
import { activeSeason } from "../../src/core/lib/seasons.js";
import { homeQuestions, questionTopics } from "../../src/core/lib/questions.js";
import { MODE_WORDS, directionsUrl, boardTime, parkingSummary, checkedText } from "../../src/core/lib/arrival.js";
import { regionFromPostcode } from "../../src/core/lib/bank-holidays.js";
import { paragraphs } from "../../src/core/lib/custom-pages.js";
import { loadCatalog } from "./catalog.js";
import { buildIncludes } from "./look-layout.js";
import { busyGrid, BUSY_WORDS } from "../../src/core/lib/queue.js";
import { pounds, loyaltyYear, compareMemberships } from "../../src/core/lib/savings.js";
import { weeklyRows, addDays, toMinutes, formatTime12 } from "../../src/core/lib/hours.js";

const EXCEPTION_WINDOW_DAYS = 60;

/**
 * @typedef {object} RenderOptions
 * @property {string} root repo root
 * @property {string} work per-site work folder
 * @property {string} outDir
 * @property {Record<string, string>} assets hashed asset paths
 * @property {"pretty"|"html"} links
 * @property {"production"|"preview"} env
 * @property {boolean} indexable
 * @property {string} today YYYY-MM-DD
 */

/** @param {any} site @param {RenderOptions} o */
export async function renderPages(site, o) {
  const kitDir = path.join(o.root, "src", "kits", site.kit);
  // Eleventy ignores everything inside its includes folder (src/), so the kit's
  // page templates are copied to the work folder and rendered from there.
  const pagesIn = path.join(o.work, "pages");
  await rm(pagesIn, { recursive: true, force: true });
  await cp(path.join(o.root, "src", "core", "pages"), pagesIn, { recursive: true }); // pages every site gets (privacy)
  await cp(path.join(kitDir, "pages"), pagesIn, { recursive: true }); // a kit page with the same name wins
  // Templates are included from a copy of src/ with the look's own header, footer, phone bar, section heads and
  // feature markup laid over the shared ones (scripts/lib/look-layout.js).
  const includes = path.join(o.work, "includes");
  await buildIncludes({ root: o.root, out: includes, look: site.look, features: FEATURES });

  const elev = new Eleventy(path.relative(o.root, pagesIn), path.relative(o.root, o.outDir), {
    quietMode: true,
    config: async (/** @type {any} */ cfg) => {
      cfg.setUseGitIgnore(false); // the work folder (.build/) is git-ignored
      cfg.setIncludesDirectory(path.relative(pagesIn, includes));
      cfg.setNunjucksEnvironmentOptions({ throwOnUndefined: false, autoescape: true });
      const enabled = new Set(site.features);
      // A page belonging to a feature is built only when a feature that brings it is on. Two kits may use the same
      // page name (two trades' /aftercare): the enabled one wins.
      const wanted = new Set(FEATURES.filter((f) => enabled.has(f.id)).flatMap((f) => [f.page, ...(f.morePages ?? [])]));
      for (const f of FEATURES) for (const pg of [f.page, ...(f.morePages ?? [])]) if (pg && !wanted.has(pg)) cfg.ignores.add(path.join(path.relative(o.root, pagesIn), `${pg}.njk`));
      addData(cfg, site, o);
      addFilters(cfg, site, o, enabled);
      const kitHook = path.join(kitDir, "eleventy.js");
      if (existsSync(kitHook)) (await import(pathToFileURL(kitHook).href)).default(cfg);
    },
  });
  await elev.write();
}

/** The look's theme colour, brand options and home section order. @param {any} site @param {RenderOptions} o */
function lookData(site, o) {
  const look = loadCatalog(o.root).looks[site.look];
  const demoFile = path.join(o.root, "src", "kits", site.kit, "demo.json"); // the plan switcher's words for this trade
  const kitDemo = site.mode === "demo" && existsSync(demoFile) ? JSON.parse(readFileSync(demoFile, "utf8")) : { plans: {}, gate: {} };
  return { themeColor: look.themeColor, lookBrand: look.brand ?? null, homeOrder: look.homeOrder ?? null, heroParts: look.heroParts ?? [], onPages: look.onPages ?? null, kitDemo };
}

/** Config the queue, loyalty, memberships and vouchers scripts need, only when on. @param {any} site */
function offerData(site) {
  /** @param {string} id @param {string} key */
  const when = (id, key) => (site.features.includes(id) ? site[key] : null);
  return { queue: when("walk-in-queue", "queue"), loyalty: when("loyalty", "loyalty"), memberships: when("memberships", "memberships"), vouchers: when("vouchers", "vouchers") };
}

/** This site's kit (src/kits/<kit>/kit.js). @param {any} site */
const kitOf = (site) => KITS.find((k) => k.id === site.kit);

/** @param {any} cfg @param {any} site @param {RenderOptions} o */
function addData(cfg, site, o) {
  cfg.addGlobalData("site", site);
  cfg.addGlobalData("build", {
    env: o.env, indexable: o.indexable, links: o.links, today: o.today,
    ...lookData(site, o),
    seasonIndex: site.features.includes("seasonal") ? activeSeason(site.seasons, o.today) : -1,
    seasonTint: site.features.includes("seasonal") ? site.seasons[activeSeason(site.seasons, o.today)]?.tint ?? "" : "",
    ...(kitOf(site)?.buildData?.(site) ?? {}),
    booking: { provider: bookingOf(site.booking).provider, label: bookingLabel(site.booking), whatsapp: bookingOf(site.booking).provider === "whatsapp" },
  });
  cfg.addGlobalData("jsonLd", safeJson(localBusinessJsonLd(site, site.photoBand ? `${site.url}/${site.photoBand.src}` : undefined)));
  // The browser only receives what its scripts need, not the whole site.json.
  cfg.addGlobalData("clientData", safeJson({
    mode: site.mode, name: site.business.name, whatsapp: site.contact.whatsapp, phone: site.contact.phone, booking: bookingOf(site.booking), hours: site.hours, messages: site.messages,
    staff: (site.staff ?? []).map((/** @type {any} */ s) => s.name),
    services: site.services ?? [], extras: site.extras ?? [], chairBoard: site.chairBoard ?? null,
    ...offerData(site),
    ...(kitOf(site)?.pageData?.(site) ?? {}), // what this kit's scripts need
    gallery: site.gallery ? {
      source: site.gallery.source, feedUrl: site.gallery.feedUrl, profile: site.gallery.profile, filters: site.gallery.filters ?? [],
      photos: postsFromPhotos(site.gallery.photos ?? [], (src) => `${o.links === "html" ? "" : "/"}${src}`),
      workHref: site.features.includes("work") ? (o.links === "html" ? "work.html" : "/work") : undefined,
    } : null,
    visit: site.features.includes("plan-visit") ? {
      parking: site.visitInfo.parking ?? [],
      region: site.location.region ?? regionFromPostcode(site.location.postcode ?? ""),
      journeys: (site.visitInfo.journeys ?? []).map((/** @type {any} */ j) => ({ from: j.from, minutes: j.minutes, mode: j.mode, stop: j.stop })),
    } : null,
  }));
}

/** @param {any} cfg @param {any} site @param {RenderOptions} o @param {Set<string>} enabled */
function addFilters(cfg, site, o, enabled) {
  const pagePath = (/** @type {string} */ id) => (id === "index" ? "/" : `/${id}`);
  const href = (/** @type {string} */ id) => (o.links === "html" ? `${id}.html` : pagePath(id));
  const prefix = o.links === "html" ? "" : "/";

  cfg.addFilter("markup", inlineMarkup);
  cfg.addFilter("plain", plainText);
  cfg.addFilter("wa", (/** @type {string} */ text) => waUrl(site.contact.whatsapp, text));
  cfg.addFilter("book", (/** @type {string} */ text) => bookingHref(site.booking, site.contact, text));
  cfg.addFilter("href", href);
  cfg.addFilter("canonical", (/** @type {string} */ id) => `${site.url}${pagePath(id)}`);
  cfg.addFilter("asset", (/** @type {string} */ name) => `${prefix}${o.assets[name]}`);
  cfg.addFilter("img", (/** @type {string} */ src) => `${prefix}${src}`);
  cfg.addFilter("enabled", (/** @type {string} */ id) => enabled.has(id));
  cfg.addFilter("slug", (/** @type {string} */ s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));

  // Demo sites mark plan-gated parts so the plan switcher can hide them.
  cfg.addFilter("tierAttr", (/** @type {string|undefined} */ id) => {
    const f = id && site.mode === "demo" ? getFeature(id) : undefined;
    return f && planRank(f.minPlan) > 1 ? ` data-tier="${f.minPlan}"` : "";
  });
  cfg.addFilter("minPlan", (/** @type {string} */ id) => getFeature(id)?.minPlan ?? "starter");

  // A nav item whose feature is off disappears, or falls back to a home-page anchor
  // ("Prices" → "#prices" on a one-page site) when it gives a "fallback".
  cfg.addFilter("navItems", (/** @type {any[]} */ nav, /** @type {string} */ pageId) => nav
    .map((n) => (!n.feature || enabled.has(n.feature) ? n : n.fallback ? { label: n.label, href: n.fallback } : null))
    .filter(Boolean)
    .map((n) => ({ ...n, url: n.page ? href(n.page) : pageId === "index" ? n.href : `${href("index")}${n.href}` })));
  // Several trades have a page of the same name (/gifts, /menu…): look only at this kit's features for it.
  cfg.addFilter("enabledLinks", (/** @type {any[]} */ links) => (links ?? []).filter((l) => {
    const f = FEATURES.find((x) => x.page === l.page && forKit(x, site.kit));
    return !f || enabled.has(f.id);
  }));

  cfg.addFilter("hoursRows", weeklyRows);
  cfg.addFilter("monthYear", monthYear);
  cfg.addFilter("homeQuestions", homeQuestions);
  cfg.addFilter("modeWords", (/** @type {keyof typeof MODE_WORDS} */ mode) => MODE_WORDS[mode]);
  cfg.addFilter("directionsFor", (/** @type {any} */ j) => directionsUrl(site.location, j));
  cfg.addFilter("boardTime", boardTime);
  cfg.addFilter("parkingSummary", parkingSummary);
  cfg.addFilter("checkedText", checkedText);
  cfg.addFilter("paragraphs", paragraphs);
  cfg.addFilter("busyGrid", (/** @type {any} */ q) => busyGrid(q.busyness, site.hours));
  cfg.addFilter("busyWord", (/** @type {number} */ level) => BUSY_WORDS[level] ?? "");
  cfg.addFilter("pounds", pounds);
  cfg.addFilter("loyaltyYear", (/** @type {number} */ weeks, /** @type {any} */ l, /** @type {number} */ price) => loyaltyYear(weeks, l.stamps, price));
  cfg.addFilter("compareMemberships", (/** @type {number} */ weeks, /** @type {any} */ m, /** @type {number} */ price) => compareMemberships(m.plans, weeks, price));
  cfg.addFilter("service", (/** @type {string} */ id) => (site.services ?? []).find((/** @type {any} */ s) => s.id === id));
  cfg.addFilter("withTags", (/** @type {{ tag: string }[]|undefined} */ filters, /** @type {string[]|undefined} */ tags) => (filters ?? []).filter((f) => (tags ?? []).includes(f.tag)));
  cfg.addFilter("questionTopics", questionTopics);
  cfg.addFilter("priceItem", (/** @type {any} */ item) => resolvePriceItem(item, site));
  cfg.addFilter("directions", (/** @type {any} */ l) => l.directionsUrl || mapsSearchUrl(l));
  cfg.addFilter("stars", (/** @type {number} */ n) => "★".repeat(n) + "☆".repeat(5 - n));
  cfg.addFilter("upcomingExceptions", (/** @type {any} */ hours, /** @type {string} */ from) => (hours.exceptions ?? [])
    .filter((/** @type {any} */ e) => e.date >= from && e.date <= addDays(from, EXCEPTION_WINDOW_DAYS))
    .map((/** @type {any} */ e) => ({
      ...e,
      dateLabel: new Date(`${e.date}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }),
      label: e.ranges.length ? e.ranges.map((/** @type {string[]} */ r) => `${formatTime12(toMinutes(r[0]))} – ${formatTime12(toMinutes(r[1]))}`).join(", ") : "Closed",
    })));
}
