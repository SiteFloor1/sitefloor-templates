// @ts-check
/**
 * Validates a site.json before anything is built. A site that fails here
 * never reaches the build, so a missing phone number or a demo number on a
 * client site is caught on the developer's machine, not by a customer.
 *
 * Schema version 3. See docs/CONFIG.md for every field and the change log.
 */
import { PLANS, PAGE_LIMITS, planRank, getFeature, forKit, KITS, featuresFor } from "../../features/registry.js";
import { isWhatsAppNumber, isFictionalUkNumber } from "./whatsapp.js";
import { checkExtras } from "./config-extras.js";
import { isTime, DAY_KEYS } from "./hours.js";
import { checkBooking } from "./booking.js";
import { checkCopy, checkMenu, findText, isSafeHref, SCHEMA_TYPES } from "./config-content.js";
import { checkPriceList } from "./prices.js";
import { BEHOLD_FEED, INSTAGRAM_PROFILE } from "./feed.js";
import { checkSeasons } from "./seasons.js";
import { checkQuestions } from "./questions.js";
import { REGIONS } from "./bank-holidays.js";
import { checkBrand } from "./brand.js";
import { checkCustomPages } from "./custom-pages.js";

export const SCHEMA_VERSION = 4;

/**
 * Top-level settings every site may have, whatever its trade. Never put a trade's key here: a trade's keys come from
 * its own features (`requires` / `optional`) and its kit.js (`settings`), see topKeys().
 */
export const CORE_KEYS = ["schemaVersion", "id", "mode", "plan", "kit", "look", "url", "indexable", "lang", "business", "contact", "booking",
  "location", "hours", "nav", "features", "addons", "addonPages", "sections", "messages", "brand", "hero"];

/**
 * The top-level keys a site of this kit may carry: the core ones, those its features (shared and its own) list in
 * `requires` or `optional`, and any its kit.js lists in `settings`. A misspelt key, or another trade's, is refused
 * rather than silently ignored.
 * @param {string} kit @returns {Set<string>}
 */
export function topKeys(kit) {
  return new Set([
    ...CORE_KEYS,
    ...featuresFor(kit).flatMap((f) => [...f.requires, ...(f.optional ?? [])]),
    ...(KITS.find((k) => k.id === kit)?.settings ?? []),
  ]);
}
const PLACEHOLDER = /REPLACE_ME|TODO|lorem ipsum/i;

/** @typedef {(path: string, msg: string) => void} Report */
/** @typedef {{ kits: string[], looks: Record<string, { kits: string[], heroLineMax?: number, brand?: import("./brand.js").LookBrand }>, demoNames?: string[] }} Catalog what exists, from scripts/lib/catalog.js */
/** @typedef {{ catalog: Catalog, siteDir?: string, fileExists?: (rel: string) => boolean, fileSize?: (rel: string) => number|null, fileText?: (rel: string) => string }} ValidateOptions */

/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;

/**
 * @param {any} site parsed site.json
 * @param {ValidateOptions} opts
 * @returns {string[]} human-readable errors; empty means valid
 */
export function validateSite(site, opts) {
  if (!isObj(site)) return ["site: must be a JSON object"];
  /** @type {string[]} */
  const errors = [];
  /** @type {Report} */
  const err = (path, msg) => { errors.push(`${path}: ${msg}`); };
  const allowed = topKeys(site.kit);
  for (const k of Object.keys(site)) if (!allowed.has(k)) err(k, `unknown top-level setting for the ${site.kit} kit; check the spelling (allowed: the core keys in config.js, the keys this kit's features list in requires or optional, and the kit's own settings in its kit.js)`);
  checkIdentity(site, err, opts.catalog);
  checkBusiness(site, err);
  checkHours(site, err);
  checkFeatures(site, err);
  checkCopy(site, err);
  checkHeroLines(site, opts.catalog.looks[site.look]?.heroLineMax, err);
  checkNavPages(site, err);
  checkMenu(site, err);
  checkPriceList(site, err);
  checkContent(site, err, opts);
  checkBrand(site, opts.catalog.looks[site.look]?.brand, err, opts.fileSize && opts.fileText ? { size: opts.fileSize, read: opts.fileText } : undefined);
  const at = findText(site, PLACEHOLDER);
  if (at) err(at, `still has placeholder text ("${PLACEHOLDER.exec(JSON.stringify(site))?.[0]}"); replace it before building`);
  return errors;
}

/** @param {Report} err @param {string} path @param {any} v */
function required(err, path, v) {
  if (!isStr(v)) err(path, "required text is missing");
}

/** Identity, mode, plan, kit, look, URL, indexing. @param {any} site @param {Report} err @param {Catalog} catalog */
function checkIdentity(site, err, catalog) {
  if (site.schemaVersion !== SCHEMA_VERSION) err("schemaVersion", `must be ${SCHEMA_VERSION}`);
  if (!/^[a-z0-9-]+$/.test(site.id ?? "")) err("id", "lowercase letters, numbers and dashes only");
  if (!["demo", "client"].includes(site.mode)) err("mode", 'must be "demo" or "client"');
  if (!PLANS.includes(site.plan)) err("plan", `must be one of ${PLANS.join(", ")}`);
  if (!catalog.kits.includes(site.kit)) err("kit", `unknown kit "${site.kit}"; kits: ${catalog.kits.join(", ")}`);
  else if (!catalog.looks[site.look]?.kits.includes(site.kit)) err("look", `unknown look "${site.look}" for kit "${site.kit}"`);
  if (!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/i.test(site.url ?? "")) err("url", "must be https://domain with no trailing slash");
  if (typeof site.indexable !== "boolean") err("indexable", "must be true or false");
  if (site.mode === "demo" && site.indexable) err("indexable", "demo sites must never be indexable");
  required(err, "lang", site.lang);
}

/** Business details, contact details, address. @param {any} site @param {Report} err */
function checkBusiness(site, err) {
  if (!isObj(site.business)) err("business", "required");
  else {
    for (const k of ["name", "schemaType", "description"]) required(err, `business.${k}`, site.business[k]);
    if (isStr(site.business.schemaType) && !SCHEMA_TYPES.includes(site.business.schemaType)) {
      err("business.schemaType", `"${site.business.schemaType}" is not a known schema.org type; use one of ${SCHEMA_TYPES.slice(0, 6).join(", ")}… (see config-content.js)`);
    }
  }
  if (!isObj(site.contact)) err("contact", "required");
  else checkContact(site.contact, site.mode === "client", err);
  for (const e of checkBooking(site.booking)) err(e.slice(0, e.indexOf(": ")), e.slice(e.indexOf(": ") + 2));

  const l = site.location;
  if (!isObj(l)) { err("location", "required"); return; }
  for (const k of ["streetAddress", "locality", "postcode"]) required(err, `location.${k}`, l[k]);
  if (l.country !== "GB") err("location.country", 'must be "GB"');
  if (l.region !== undefined && !REGIONS.includes(l.region)) err("location.region", `bank-holiday region, one of ${REGIONS.join(", ")}; leave out to work it out from the postcode`);
  if (l.directionsUrl && !/^https:\/\//.test(l.directionsUrl)) err("location.directionsUrl", "must be an https URL");
  if (l.mapLabels !== undefined) err("location.mapLabels", "removed in schema 2 (the drawn map is gone); delete this key");
}

/** @param {any} c contact block @param {boolean} isClient @param {Report} err */
function checkContact(c, isClient, err) {
  if (!isWhatsAppNumber(c.whatsapp)) err("contact.whatsapp", "E.164 digits without +, e.g. 447700900123");
  if (!/^\+\d[\d ]{7,17}$/.test(c.phone ?? "")) err("contact.phone", 'international format, e.g. "+44 7700 900123"');
  if (c.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) err("contact.email", "not a valid email address");
  if (!isClient) return;
  if (isFictionalUkNumber(c.whatsapp ?? "")) err("contact.whatsapp", "is a fictional 07700 900xxx number; client sites need the real number");
  if (/^\+44 ?7700 ?900/.test(c.phone ?? "")) err("contact.phone", "is a fictional 07700 900xxx number");
  // E-Commerce Regulations 2002 (reg. 6): a business website must show an email address.
  if (!c.email) err("contact.email", "required on client sites (UK E-Commerce Regulations)");
}

/** Opening hours, exceptions and timezone. @param {any} site @param {Report} err */
function checkHours(site, err) {
  const h = site.hours;
  if (!isObj(h)) { err("hours", "required"); return; }
  required(err, "hours.timezone", h.timezone);
  try { new Intl.DateTimeFormat("en-GB", { timeZone: h.timezone }); } catch { err("hours.timezone", "not a valid IANA timezone"); }
  if (!isObj(h.weekly)) err("hours.weekly", "required");
  else for (const d of DAY_KEYS) checkRanges(`hours.weekly.${d}`, h.weekly[d], err);
  for (const [i, ex] of (h.exceptions ?? []).entries()) {
    if (!isCalendarDate(ex?.date)) err(`hours.exceptions[${i}].date`, "a real date, YYYY-MM-DD");
    checkRanges(`hours.exceptions[${i}].ranges`, ex?.ranges, err);
  }
}

/** Features exist, fit the kit and plan, and have their config. Demos show the whole kit. @param {any} site @param {Report} err */
function checkFeatures(site, err) {
  if (!Array.isArray(site.features)) { err("features", "must be a list"); return; }
  if (!site.features.includes("visit")) err("features", '"visit" is required: every site shows its opening hours and address');
  const addons = Array.isArray(site.addons) ? site.addons : [];
  if (site.addons !== undefined && !Array.isArray(site.addons)) err("addons", "a list of feature ids bought on top of the plan");
  checkAddonsAndPages(site, addons, err);
  for (const id of site.features) {
    const f = getFeature(id);
    if (!f) { err("features", `unknown feature "${id}"`); continue; }
    if (!forKit(f, site.kit)) err("features", `"${id}" is not available for kit "${site.kit}"`);
    if (PLANS.includes(site.plan) && planRank(f.minPlan) > planRank(site.plan) && !addons.includes(id)) {
      err("features", `"${id}" needs the ${f.minPlan} plan; site is on ${site.plan} (sell it as an add-on by listing it in "addons")`);
    }
    for (const key of f.requires) if (site[key] === undefined) err(key, `required by feature "${id}"`);
    for (const other of f.needs ?? []) if (!site.features.includes(other)) err("features", `"${id}" needs "${other}" to be on too`);
  }
}

/**
 * Add-ons are features above the site's plan, bought one at a time. Each plan
 * includes a number of pages; add-on pages don't count towards it.
 * @param {any} site @param {string[]} addons @param {Report} err
 */
function checkAddonsAndPages(site, addons, err) {
  for (const id of addons) {
    const f = getFeature(id);
    if (!site.features.includes(id)) err("addons", `"${id}" is an add-on but isn't in "features"`);
    else if (f && PLANS.includes(site.plan) && planRank(f.minPlan) <= planRank(site.plan)) err("addons", `"${id}" is already included in the ${site.plan} plan`);
  }
  if (!PLANS.includes(site.plan)) return;
  // A generated collection (a page with a page per item) is one feature, so it counts once; unlisted pages
  // (reached only by a link the business sends) are utilities and count like Plan your visit: not at all.
  const pages = 1 + site.features.filter((/** @type {string} */ id) => getFeature(id)?.page && !getFeature(id)?.freePage && !getFeature(id)?.unlisted && !addons.includes(id) && id !== "custom-pages").length
    + (site.features.includes("custom-pages") && Array.isArray(site.pages) ? site.pages.length : 0); // general pages always count, one by one
  const extra = site.addonPages ?? 0;
  if (!Number.isInteger(extra) || extra < 0) err("addonPages", "the number of extra pages sold on top of the plan, a whole number");
  const limit = PAGE_LIMITS[/** @type {"starter"|"plus"|"signature"} */ (site.plan)] + (Number.isInteger(extra) ? extra : 0);
  if (pages > limit) err("features", `${pages} pages, but the ${site.plan} plan includes ${limit}${extra ? ` (with ${extra} extra)` : ""}; remove a page or sell more with "addonPages"`);
}

/** Reviews, chair board, staff and gallery, plus demo-only content on client sites. @param {any} site @param {Report} err @param {ValidateOptions} opts */
function checkContent(site, err, opts) {
  checkDemoLeakage(site, err, opts.catalog.demoNames ?? []);
  checkReviewsAndBoard(site, err);
  checkStyleGuide(site.styleGuide, err);
  checkMedia(site, err, opts);
  checkExtras(site, err, opts.fileExists);
  // Each kit's own checks (src/kits/<kit>/kit.js → check). They run for every site and return early for other
  // kits, so a kit can also refuse its own settings on another trade's site.
  for (const k of KITS) k.check?.(site, err, opts.fileExists);
}

/**
 * The guide is written by Sitefloor, so it is published under the business's
 * name. Someone at the business is named only as having checked it, and only if they did.
 * @param {any} g @param {Report} err
 */
function checkStyleGuide(g, err) {
  if (g === undefined) return;
  required(err, "styleGuide.updated", g.updated);
  if (g.reviewedBy !== undefined) required(err, "styleGuide.reviewedBy", g.reviewedBy);
  for (const k of ["author", "authorInitial", "cutsPerYear"]) {
    if (g[k] !== undefined) err(`styleGuide.${k}`, 'removed in schema 2; use "reviewedBy" only if that person has read and approved the guide');
  }
}

/** Demo-only content must never appear on a client site. @param {any} site @param {Report} err @param {string[]} [demoNames] */
function checkDemoLeakage(site, err, demoNames = []) {
  if (site.mode !== "client") return;
  {
    if (site.reviews?.source === "sample") err("reviews.source", 'sample reviews are only allowed on demo sites; use "google"');
    if (site.chairBoard?.source === "simulated") err("chairBoard.source", 'simulated data is only allowed on demo sites; use "sheet"');
  }
  // A demo's business name in a client's words (a README example copied in, a card signed by the demo shop).
  const names = demoNames.filter((n) => n !== site.business?.name);
  if (!names.length) return;
  const re = new RegExp(`\\b(${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`);
  /** @param {any} v @param {string} at */
  const walk = (v, at) => {
    if (typeof v === "string") { const m = re.exec(v); if (m) err(at, `contains "${m[1]}", the name of a Sitefloor demo; use the client's own words`); }
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${at}[${i}]`));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, at ? `${at}.${k}` : k);
  };
  walk(site, "");
}

/** @param {any} site @param {Report} err */
function checkReviewsAndBoard(site, err) {
  if (site.reviews) {
    if (!["sample", "google"].includes(site.reviews.source)) err("reviews.source", 'must be "sample" or "google"');
    if (!Array.isArray(site.reviews.items) || site.reviews.items.length === 0) err("reviews.items", "at least one review");
    else site.reviews.items.forEach((/** @type {any} */ r, /** @type {number} */ i) => checkReview(r, `reviews.items[${i}]`, err));
  }
  if (site.chairBoard) {
    if (!["simulated", "sheet"].includes(site.chairBoard.source)) err("chairBoard.source", 'must be "simulated" or "sheet"');
    if (site.chairBoard.source === "sheet" && !/^https:\/\/docs\.google\.com\/spreadsheets\/.+output=csv/.test(site.chairBoard.csvUrl ?? "")) {
      err("chairBoard.csvUrl", "must be a published Google Sheet CSV link (File → Share → Publish to web → CSV)");
    }
  }
}

/**
 * A review is shown exactly as it appears on Google: its own star rating, the
 * reviewer's name and the month it was written. A relative date ("2 weeks ago")
 * goes stale on a static site, so it is not accepted.
 * @param {any} r @param {string} path @param {Report} err
 */
function checkReview(r, path, err) {
  required(err, `${path}.text`, r?.text);
  required(err, `${path}.author`, r?.author);
  if (!Number.isInteger(r?.rating) || r.rating < 1 || r.rating > 5) err(`${path}.rating`, "the review's own star rating, a whole number 1–5");
  if (!/^\d{4}-(0[1-9]|1[0-2])(-\d{2})?$/.test(r?.date ?? "")) err(`${path}.date`, 'when it was written, "YYYY-MM" or "YYYY-MM-DD"');
  if (r?.when !== undefined) err(`${path}.when`, 'replaced by "date" in schema 2');
}

/** Staff and gallery entries are complete and their image files exist. @param {any} site @param {Report} err @param {ValidateOptions} opts */
function checkMedia(site, err, opts) {
  const exists = opts.fileExists;
  for (const [i, s] of (site.staff ?? []).entries()) {
    required(err, `staff[${i}].name`, s?.name);
    if (s?.photo && exists && !exists(s.photo)) err(`staff[${i}].photo`, `file not found: ${s.photo}`);
  }
  if (site.gallery !== undefined) checkGallery(site.gallery, site.mode, err, exists);
  if (site.seasons !== undefined) checkSeasons(site.seasons, err, isSafeHref);
  checkQuestions(site, err);
  if (site.pages !== undefined) checkCustomPages(site.pages, err, exists);
}

/**
 * The look's headline is huge on a phone; a line longer than the look allows wraps
 * differently in the stand-in font and the real one, and the page jumps while it loads.
 * @param {any} site @param {number|undefined} max @param {Report} err
 */
function checkHeroLines(site, max, err) {
  if (!max || !isStr(site.hero?.title)) return;
  for (const line of site.hero.title.split("|")) {
    const text = line.replace(/\*/g, "").trim();
    if (text.length > max) err("hero.title", `the line "${text}" is ${text.length} characters; this look fits ${max} per line on a phone, so split it with |`);
  }
}

/** Menu links to pages must point at a page this site builds. @param {any} site @param {Report} err */
function checkNavPages(site, err) {
  if (!Array.isArray(site.nav) || !Array.isArray(site.features)) return;
  const built = new Set(["index", "privacy", ...site.features.map((/** @type {string} */ id) => getFeature(id)?.page).filter(Boolean)]);
  if (site.features.includes("custom-pages")) for (const p of site.pages ?? []) built.add(p?.slug);
  site.nav.forEach((/** @type {any} */ n, /** @type {number} */ i) => {
    if (!n?.page) return;
    const own = getFeature(n.feature ?? "")?.page === n.page || site.pages?.some((/** @type {any} */ p) => p?.slug === n.page);
    // A link tied to a feature is hidden (or swapped for its fallback) when that feature is off.
    if (!own && !built.has(n.page)) err(`nav[${i}].page`, `"${n.page}" isn't a page on this site; check the spelling, or add "feature" so it hides when that feature is off`);
  });
}

/** @param {any} v YYYY-MM-DD that exists on the calendar (no 30 February) */
function isCalendarDate(v) {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

/**
 * Gallery: the shop's Instagram through Behold, or photos stored with the site.
 * @param {any} g @param {string} mode @param {Report} err @param {((rel: string) => boolean)|undefined} exists
 */
function checkGallery(g, mode, err, exists) {
  if (!isObj(g)) { err("gallery", 'an object with "source" (schema 3); see src/features/gallery/README.md'); return; }
  if (!["behold", "photos"].includes(g.source)) err("gallery.source", '"behold" (the shop\'s Instagram) or "photos"');
  if (g.source === "behold" && !BEHOLD_FEED.test(g.feedUrl ?? "")) err("gallery.feedUrl", "the Behold JSON feed link, https://feeds.behold.so/…");
  if (g.source === "photos" && !(Array.isArray(g.photos) && g.photos.length)) err("gallery.photos", "at least one photo");
  if (g.profile !== undefined && !INSTAGRAM_PROFILE.test(g.profile)) err("gallery.profile", "https://www.instagram.com/<handle>");
  if (g.profile !== undefined && mode === "demo") err("gallery.profile", "demo sites are fictional and must not link to a real Instagram account");
  if (g.handle !== undefined && !/^[A-Za-z0-9._]{1,30}$/.test(g.handle)) err("gallery.handle", "the Instagram handle without @");
  (g.filters ?? []).forEach((/** @type {any} */ f, /** @type {number} */ i) => {
    if (!/^[a-z0-9_]+$/.test(f?.tag ?? "")) err(`gallery.filters[${i}].tag`, "a hashtag in lowercase without #, e.g. skinfade");
    required(err, `gallery.filters[${i}].label`, f?.label);
  });
  (g.photos ?? []).forEach((/** @type {any} */ p, /** @type {number} */ i) => {
    required(err, `gallery.photos[${i}].alt`, p?.alt);
    if (!Number.isInteger(p?.width) || !Number.isInteger(p?.height)) err(`gallery.photos[${i}]`, "width and height in pixels");
    if (exists && !exists(p?.src ?? "")) err(`gallery.photos[${i}].src`, `file not found: ${p?.src}`);
  });
}

/**
 * @param {string} path @param {any} ranges @param {(p: string, m: string) => void} err
 */
function checkRanges(path, ranges, err) {
  if (!Array.isArray(ranges)) { err(path, "must be a list of [open, close] pairs ([] = closed)"); return; }
  ranges.forEach((r, i) => {
    if (!Array.isArray(r) || r.length !== 2 || !isTime(r[0]) || !isTime(r[1])) err(`${path}[${i}]`, 'must be ["HH:MM","HH:MM"]');
    else if (r[0] === r[1]) err(`${path}[${i}]`, "open and close times are the same");
  });
}
