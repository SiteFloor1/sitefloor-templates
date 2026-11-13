// @ts-check
/**
 * Validation for the cakes kit (celebration cake designers): the numbered cakes, the portion chart and "from" prices,
 * the flavours and their allergens, the diary sheet, the tasting box (the studio's own Stripe link), delivery areas,
 * the consultation, the commission steps, the range pages and the page headings. Every cake, portion, price, date and
 * area is the studio's own; these checks only make sure it is complete and can't mislead. A simulated diary is refused
 * on client sites. A misspelt setting is refused, never silently ignored.
 */
import { ALLERGEN_IDS } from "../../core/lib/allergens.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
/** @param {any} v @param {number} lo @param {number} hi */
const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const ID = /^[a-z0-9-]{1,40}$/;
const PHOTO = ["src", "width", "height", "alt", "caption"];
const HEAD = ["title", "intro"];
/** Diets a flavour can be made for on request, and how the site says them. No free-from claims: "gluten-free" is
 * reserved in UK law for food at 20 ppm of gluten or less (retained Regulation 828/2014), which a shared kitchen
 * can't promise; the site says what is swapped instead. */
export const DIET_WORDS = { "vegan": "vegan on request", "gluten-free-flour": "made with gluten-free flour on request (not for coeliacs)" };
const DIETS = Object.keys(DIET_WORDS);
/** Free-from and safety claims the studio's own words may not make (the templates never do): an allergen claim needs
 * the studio's own controls behind it, and on a site it reads as a promise. Covers the 14 allergens and their common
 * words, "free from", "free of", "safe for", "suitable for coeliacs" and "-friendly". Honest warnings pass: a "not",
 * "can't", "cannot", "never", "isn't" or "won't" up to four words before the phrase ("not safe for nut allergies", "we
 * cannot make a cake free from nuts"). "Gluten-free flour" names an ingredient; "free of charge" isn't a claim. */
const ALLERGEN_WORDS = "allerg(?:en|ens|y|ies)|nuts?|tree[- ]nuts?|peanuts?|dairy|milk|lactose|eggs?|soya?|sesame|wheat|sulph?ites?|sulfites?|celery|mustard|fish|lupin|crustaceans?|shellfish|molluscs?|coeliacs?|celiacs?";
const NOT = String.raw`(?<!\b(?:not|cannot|can['’]t|never|isn['’]t|aren['’]t|won['’]t)(?:\s+\S+){0,4}\s+)`;
const CLAIMS = new RegExp([
  String.raw`${NOT}\b(?:${ALLERGEN_WORDS})[- ](?:free|friendly)\b`,
  String.raw`${NOT}\bgluten[- ](?:free(?![- ]flour)|friendly)\b`,
  String.raw`${NOT}\bfree[- ](?:from|of(?!\s+charge))\b`,
  String.raw`${NOT}\bsafe for\b`,
  String.raw`${NOT}\bsuitable for (?:coeliacs?|celiacs?|allerg\w*|people with)\b`,
].join("|"), "i");
const KINDS = ["wedding", "celebration", "corporate", "dessert-table"];
const PAGES = ["order", "flavours", "allergens", "servings", "tasting", "delivery", "care", "process", "commissions"];
const RANGES = { "weddings-page": "weddings", "celebrations-page": "celebrations", "corporate-page": "corporate", "dessert-tables-page": "dessertTables" };

/** @param {Report} err @param {string} path @param {any} v */
function text(err, path, v) { if (!isStr(v)) err(path, "required text is missing"); }

/** @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (!isObj(o)) { err(at, `an object with: ${keys.join(", ")}`); return false; }
  for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
  return true;
}

/** @param {Report} err @param {string} path @param {any} p @param {((rel: string) => boolean)|undefined} exists */
function photo(err, path, p, exists) {
  if (!onlyKeys(p, PHOTO, path, err)) return;
  text(err, `${path}.alt`, p.alt);
  if (!Number.isInteger(p.width) || !Number.isInteger(p.height)) err(path, "width and height in pixels");
  if (!isStr(p.src)) err(`${path}.src`, "required");
  else if (exists && !exists(p.src)) err(`${path}.src`, `file not found: ${p.src}`);
}

/** @param {Report} err @param {string} path @param {any} list @param {number} min */
function list(err, path, list, min = 1) {
  if (!Array.isArray(list) || list.length < min) { err(path, `a list of at least ${min}`); return []; }
  return list;
}

/** Unique ids in a list. @param {Report} err @param {string} path @param {any[]} items */
function ids(err, path, items) {
  const seen = new Set();
  items.forEach((x, i) => {
    if (!ID.test(x?.id ?? "")) err(`${path}[${i}].id`, "lowercase letters, numbers and dashes");
    else if (seen.has(x.id)) err(`${path}[${i}].id`, `"${x.id}" is used twice`);
    seen.add(x?.id);
  });
  return seen;
}

/** The studio's own price in whole pounds. @param {any} v @param {string} at @param {Report} err */
function price(v, at, err) { if (!isInt(v, 1, 100000)) err(at, "the studio's own price in whole pounds, e.g. 650"); }

/**
 * The studio's own Stripe Payment Link: test mode on a demo (nothing is ever charged), the live link on a client site.
 * @param {any} link @param {string} at @param {string} mode @param {Report} err
 */
function stripeLink(link, at, mode, err) {
  if (!/^https:\/\/buy\.stripe\.com\/[\w-]+$/.test(link ?? "")) err(at, "the studio's own Stripe Payment Link, https://buy.stripe.com/…");
  else if (mode === "demo" && !link.startsWith("https://buy.stripe.com/test_")) err(at, "demo sites must use a Stripe test-mode link (https://buy.stripe.com/test_…)");
  else if (mode === "client" && link.startsWith("https://buy.stripe.com/test_")) err(at, "is a Stripe test-mode link; client sites need the studio's live link");
}

/** @param {any} site @param {Report} err @param {((rel: string) => boolean)|undefined} [exists] */
export function checkCakes(site, err, exists) {
  if (site.kit !== "cakes") return;
  checkClaims(site, err);
  const flavourIds = site.flavours !== undefined ? checkFlavours(site.flavours, err, exists) : new Set();
  if (site.pieces !== undefined) checkPieces(site.pieces, flavourIds, err, exists);
  if (site.leadTime !== undefined) checkRows(site.leadTime, "leadTime", err);
  if (site.dates !== undefined) checkDates(site.dates, site.mode, err);
  if (site.allergens !== undefined) checkAllergens(site.allergens, err);
  if (site.servings !== undefined) checkServings(site.servings, err);
  if (site.tasting !== undefined) checkTasting(site.tasting, site.mode, err, exists);
  if (site.care !== undefined) checkSteps(site.care, "care", ["steps", "keep"], err);
  if (site.process !== undefined) checkSteps(site.process, "process", ["steps", "terms"], err);
  if (site.consultation !== undefined) checkConsultation(site.consultation, err);
  if (site.delivery !== undefined) checkDelivery(site.delivery, err);
  if (site.brief !== undefined) checkBrief(site.brief, err);
  checkPagesAndHero(site, err, exists);
}

/**
 * Every piece of the studio's own text the site shows: refuse free-from and safety claims (CLAIMS).
 * @param {any} site @param {Report} err
 */
function checkClaims(site, err) {
  /** @param {any} v @param {string} at */
  const walk = (v, at) => {
    if (typeof v === "string") { const m = v.match(CLAIMS); if (m) err(at, `says "${m[0]}": a free-from or safety claim the site can't stand behind; say what's in it, or what's swapped, instead`); }
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${at}[${i}]`));
    else if (isObj(v)) for (const [k, x] of Object.entries(v)) if (!["src", "csvUrl", "payLink", "id", "diets"].includes(k)) walk(x, `${at}.${k}`);
  };
  for (const key of ["hero", "sections", "questions", "pieces", "flavours", "allergens", "leadTime", "dates", "servings", "tasting", "care", "process", "consultation", "delivery", "brief", "cakePages", "ranges", "messages", "visitInfo", "pageLinks", "seasons", "business"]) walk(site[key], key);
}

/**
 * The page headings each page feature needs, the range pages, and the hero's cake.
 * @param {any} site @param {Report} err @param {((rel: string) => boolean)|undefined} exists
 */
function checkPagesAndHero(site, err, exists) {
  const on = (/** @type {string} */ id) => Array.isArray(site.features) && site.features.includes(id);
  if (site.cakePages !== undefined) checkPages(site.cakePages, err);
  if (site.ranges !== undefined) checkRanges(site.ranges, site.pieces, err, exists);
  for (const [feature, key] of Object.entries(RANGES)) if (on(feature) && !isObj(site.ranges?.[key])) err(`ranges.${key}`, `${feature} is on: give its page (title, intro, kinds, prices)`);
  const pageFor = { "brief-builder": "order", "flavours-page": "flavours", "allergens-page": "allergens", "servings-page": "servings", "tasting-page": "tasting", "delivery-page": "delivery", "cake-care-page": "care", "how-it-works-page": "process", "commission-pages": "commissions" };
  for (const [feature, key] of Object.entries(pageFor)) if (on(feature) && !isObj(site.cakePages?.[key])) err(`cakePages.${key}`, `${feature} is on: give the page a title (and an intro)`);
  if (site.hero?.piece !== undefined && !(site.pieces?.items ?? []).some((/** @type {any} */ p) => p.id === site.hero.piece)) err("hero.piece", "the id of one of the studio's cakes in pieces.items");
  if (site.hero?.phonePhoto !== undefined) photo(err, "hero.phonePhoto", site.hero.phonePhoto, exists);
}

/** @param {any} p @param {Set<string>} flavourIds @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkPieces(p, flavourIds, err, exists) {
  if (!onlyKeys(p, ["items"], "pieces", err)) return;
  const items = list(err, "pieces.items", p.items, 1);
  ids(err, "pieces.items", items);
  items.forEach((x, i) => {
    const at = `pieces.items[${i}]`;
    if (!onlyKeys(x, ["id", "no", "name", "kinds", "sizes", "serves", "from", "made", "flavours", "photo"], at, err)) return;
    text(err, `${at}.name`, x.name);
    text(err, `${at}.made`, x.made);
    if (x.no !== undefined && !isInt(x.no, 1, 9999)) err(`${at}.no`, "the studio's own number for the cake, e.g. 14");
    if (!Array.isArray(x.kinds) || !x.kinds.length || x.kinds.some((/** @type {any} */ k) => !KINDS.includes(k))) err(`${at}.kinds`, `one or more of: ${KINDS.join(", ")}`);
    if (!Array.isArray(x.sizes) || !x.sizes.length || x.sizes.some((/** @type {any} */ s) => !isInt(s, 3, 20))) err(`${at}.sizes`, "the tier diameters in inches, top to bottom, e.g. [6, 8, 10]");
    if (!isInt(x.serves, 1, 2000)) err(`${at}.serves`, "how many it served, a whole number");
    price(x.from, `${at}.from`, err);
    if (x.flavours !== undefined && (!Array.isArray(x.flavours) || x.flavours.some((/** @type {any} */ f) => !flavourIds.has(f)))) err(`${at}.flavours`, "ids from flavours.items");
    photo(err, `${at}.photo`, x.photo, exists);
  });
}

/** @param {any} f @param {Report} err @param {((rel: string) => boolean)|undefined} exists @returns {Set<string>} */
function checkFlavours(f, err, exists) {
  if (!onlyKeys(f, ["photo", "items", "note"], "flavours", err)) return new Set();
  if (f.photo !== undefined) photo(err, "flavours.photo", f.photo, exists);
  const items = list(err, "flavours.items", f.items, 1);
  const seen = ids(err, "flavours.items", items);
  items.forEach((x, i) => {
    const at = `flavours.items[${i}]`;
    if (!onlyKeys(x, ["id", "name", "what", "months", "allergens", "diets", "layer"], at, err)) return;
    text(err, `${at}.name`, x.name);
    text(err, `${at}.what`, x.what);
    if (x.months !== undefined && (!Array.isArray(x.months) || !x.months.length || x.months.some((/** @type {any} */ m) => !isInt(m, 1, 12)))) err(`${at}.months`, "the months it's on, 1–12 (leave out for all year)");
    if (!Array.isArray(x.allergens) || x.allergens.some((/** @type {any} */ a) => !ALLERGEN_IDS.includes(a))) err(`${at}.allergens`, `from the studio's own allergen chart, using: ${ALLERGEN_IDS.join(", ")} ([] when it has none of the 14)`);
    if (x.diets !== undefined && (!Array.isArray(x.diets) || x.diets.some((/** @type {any} */ d) => !DIETS.includes(d)))) err(`${at}.diets`, `${DIETS.join(" and/or ")}, only if the studio makes it that way on request ("gluten-free" is reserved in law for food tested to 20 ppm, so the site says what is swapped instead)`);
    if (x.layer !== undefined) {
      if (!onlyKeys(x.layer, ["top", "height"], `${at}.layer`, err)) return;
      if (!(x.layer.top >= 0 && x.layer.top < 100 && x.layer.height > 0 && x.layer.top + x.layer.height <= 100)) err(`${at}.layer`, "where its slice sits in flavours.photo, as percentages of the photo's height: { top, height }");
      if (f.photo === undefined) err(`${at}.layer`, "needs flavours.photo");
    }
  });
  return seen;
}

/** @param {any} o @param {string} at @param {Report} err */
function checkRows(o, at, err) {
  if (!onlyKeys(o, ["rows", "note"], at, err)) return;
  list(err, `${at}.rows`, o.rows, 1).forEach((r, i) => { if (onlyKeys(r, ["label", "value"], `${at}.rows[${i}]`, err)) { text(err, `${at}.rows[${i}].label`, r.label); text(err, `${at}.rows[${i}].value`, r.value); } });
}

/** @param {any} d @param {string} mode @param {Report} err */
function checkDates(d, mode, err) {
  if (!onlyKeys(d, ["source", "csvUrl", "staleAfterDays", "minDays", "words"], "dates", err)) return;
  if (!["sheet", "simulated"].includes(d.source)) err("dates.source", "\"sheet\" (the studio's Google Sheet) or \"simulated\" (demos only)");
  if (d.source === "simulated" && mode !== "demo") err("dates.source", "a client site reads the studio's own sheet, never simulated dates");
  if (d.source === "sheet" && !/^https:\/\/docs\.google\.com\/spreadsheets\/d\/e\/[\w-]+\/pub\?(.+&)?output=csv/.test(d.csvUrl ?? "")) err("dates.csvUrl", "the sheet published to the web as CSV (https://docs.google.com/spreadsheets/d/e/…/pub?output=csv)");
  if (!isInt(d.staleAfterDays, 1, 60)) err("dates.staleAfterDays", "after how many days without an update the diary is treated as unknown, e.g. 7");
  if (!isInt(d.minDays, 0, 730)) err("dates.minDays", "the studio's shortest notice in days; dates sooner say \"ask us\"");
  if (!onlyKeys(d.words, ["free", "one", "booked", "soon", "unknown"], "dates.words", err)) return;
  for (const k of ["free", "one", "booked", "soon", "unknown"]) text(err, `dates.words.${k}`, d.words[k]);
}

/** @param {any} a @param {Report} err */
function checkAllergens(a, err) {
  if (!onlyKeys(a, ["kitchen", "severe", "ingredients"], "allergens", err)) return;
  if (!Array.isArray(a.kitchen) || a.kitchen.some((/** @type {any} */ x) => !ALLERGEN_IDS.includes(x))) err("allergens.kitchen", `the allergens handled in the studio's kitchen, using: ${ALLERGEN_IDS.join(", ")}`);
  text(err, "allergens.severe", a.severe);
  text(err, "allergens.ingredients", a.ingredients);
}

/** @param {any} s @param {Report} err */
function checkServings(s, err) {
  if (!onlyKeys(s, ["tiers", "maxTiers", "prices", "height", "note"], "servings", err)) return;
  const tiers = list(err, "servings.tiers", s.tiers, 1);
  const sizes = new Set();
  tiers.forEach((t, i) => {
    const at = `servings.tiers[${i}]`;
    if (!onlyKeys(t, ["size", "finger", "dessert"], at, err)) return;
    if (!isInt(t.size, 3, 20)) err(`${at}.size`, "the tier's diameter in inches");
    else if (sizes.has(t.size)) err(`${at}.size`, `${t.size} in is listed twice`);
    sizes.add(t.size);
    if (!isInt(t.finger, 1, 500) || !isInt(t.dessert, 1, 500)) err(at, "finger and dessert portions from the studio's own chart");
    else if (t.dessert > t.finger) err(at, "a dessert portion is bigger than a finger portion, so there are fewer of them");
  });
  if (!isInt(s.maxTiers, 1, 8)) err("servings.maxTiers", "the most tiers the studio stacks");
  const prices = list(err, "servings.prices", s.prices, 1);
  prices.forEach((p, i) => { if (onlyKeys(p, ["tiers", "from"], `servings.prices[${i}]`, err)) { if (!isInt(p.tiers, 1, 8)) err(`servings.prices[${i}].tiers`, "number of tiers"); price(p.from, `servings.prices[${i}].from`, err); } });
  text(err, "servings.height", s.height);
}

/** @param {any} t @param {string} mode @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkTasting(t, mode, err, exists) {
  if (!onlyKeys(t, ["name", "contents", "price", "payLink", "posting", "note", "photo"], "tasting", err)) return;
  text(err, "tasting.name", t.name);
  list(err, "tasting.contents", t.contents, 1).forEach((c, i) => text(err, `tasting.contents[${i}]`, c));
  price(t.price, "tasting.price", err);
  stripeLink(t.payLink, "tasting.payLink", mode, err);
  text(err, "tasting.posting", t.posting);
  if (t.photo !== undefined) photo(err, "tasting.photo", t.photo, exists);
}

/** @param {any} o @param {string} at @param {string[]} keys @param {Report} err */
function checkSteps(o, at, keys, err) {
  if (!onlyKeys(o, keys, at, err)) return;
  list(err, `${at}.steps`, o.steps, 2).forEach((s, i) => { if (onlyKeys(s, ["title", "text"], `${at}.steps[${i}]`, err)) { text(err, `${at}.steps[${i}].title`, s.title); text(err, `${at}.steps[${i}].text`, s.text); } });
  for (const k of keys.slice(1)) if (o[k] !== undefined) text(err, `${at}.${k}`, o[k]);
}

/** @param {any} c @param {Report} err */
function checkConsultation(c, err) {
  if (!onlyKeys(c, ["kinds", "message", "note"], "consultation", err)) return;
  const kinds = list(err, "consultation.kinds", c.kinds, 1);
  ids(err, "consultation.kinds", kinds);
  kinds.forEach((k, i) => { if (onlyKeys(k, ["id", "name", "minutes", "text"], `consultation.kinds[${i}]`, err)) { text(err, `consultation.kinds[${i}].name`, k.name); text(err, `consultation.kinds[${i}].text`, k.text); if (!isInt(k.minutes, 10, 240)) err(`consultation.kinds[${i}].minutes`, "how long, in minutes"); } });
  text(err, "consultation.message", c.message);
}

/** @param {any} d @param {Report} err */
function checkDelivery(d, err) {
  if (!onlyKeys(d, ["areas", "unknown", "day", "stands", "marquee", "after"], "delivery", err)) return;
  const seen = new Set();
  list(err, "delivery.areas", d.areas, 1).forEach((a, i) => {
    const at = `delivery.areas[${i}]`;
    if (!onlyKeys(a, ["name", "districts", "from", "arrive"], at, err)) return;
    text(err, `${at}.name`, a.name);
    text(err, `${at}.arrive`, a.arrive);
    price(a.from, `${at}.from`, err);
    if (!Array.isArray(a.districts) || !a.districts.length) err(`${at}.districts`, "postcode areas (\"SW\") or districts (\"RG9\")");
    else for (const x of a.districts) {
      if (!/^[A-Z]{1,2}(\d[A-Z\d]?)?$/.test(x)) err(`${at}.districts`, `"${x}" isn't a postcode area or district`);
      else if (seen.has(x)) err(`${at}.districts`, `"${x}" is in two areas`);
      seen.add(x);
    }
  });
  text(err, "delivery.unknown", d.unknown);
  if (d.day !== undefined) list(err, "delivery.day", d.day, 1).forEach((x, i) => text(err, `delivery.day[${i}]`, x));
  for (const k of ["stands", "marquee", "after"]) if (d[k] !== undefined) text(err, `delivery.${k}`, d[k]);
}

/** @param {any} b @param {Report} err */
function checkBrief(b, err) {
  if (!onlyKeys(b, ["intro", "finishes"], "brief", err)) return;
  text(err, "brief.intro", b.intro);
  list(err, "brief.finishes", b.finishes, 1).forEach((f, i) => text(err, `brief.finishes[${i}]`, f));
}

/** @param {any} p @param {Report} err */
function checkPages(p, err) {
  if (!onlyKeys(p, PAGES, "cakePages", err)) return;
  for (const k of Object.keys(p)) if (onlyKeys(p[k], HEAD, `cakePages.${k}`, err)) text(err, `cakePages.${k}.title`, p[k].title);
}

/** @param {any} r @param {any} pieces @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkRanges(r, pieces, err, exists) {
  if (!onlyKeys(r, Object.values(RANGES), "ranges", err)) return;
  const all = pieces?.items ?? [];
  for (const [k, v] of Object.entries(r)) {
    const at = `ranges.${k}`;
    if (!onlyKeys(v, ["title", "intro", "kinds", "prices", "notes", "photo", "topic"], at, err)) continue;
    text(err, `${at}.title`, v.title);
    text(err, `${at}.intro`, v.intro);
    if (!Array.isArray(v.kinds) || v.kinds.some((/** @type {any} */ x) => !KINDS.includes(x))) err(`${at}.kinds`, `which cakes it shows: ${KINDS.join(", ")}`);
    else if (!all.some((/** @type {any} */ p) => p.kinds.some((/** @type {string} */ x) => v.kinds.includes(x))) && v.photo === undefined) err(`${at}.kinds`, "no cake in pieces.items is of these kinds; add one, or a photo");
    list(err, `${at}.prices`, v.prices, 1).forEach((p, i) => { if (onlyKeys(p, ["label", "from"], `${at}.prices[${i}]`, err)) { text(err, `${at}.prices[${i}].label`, p.label); price(p.from, `${at}.prices[${i}].from`, err); } });
    if (v.notes !== undefined) list(err, `${at}.notes`, v.notes, 1).forEach((n, i) => text(err, `${at}.notes[${i}]`, n));
    if (v.photo !== undefined) photo(err, `${at}.photo`, v.photo, exists);
    if (v.topic !== undefined) text(err, `${at}.topic`, v.topic);
  }
}

