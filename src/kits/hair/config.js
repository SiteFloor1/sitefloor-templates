// @ts-check
/**
 * Validation for the hair kit (hair salons): the cut photograph, the price grid by length and stylist level, the
 * stylists, textures, the colour year, the skin test, the look book, before and after pairs (consent only), the colour
 * consultation, products, the pages and the wedding planner. Every figure is the salon's own; the checks only make sure
 * it is complete and can't mislead.
 */
import { isYmd } from "../../core/lib/diary.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @typedef {((rel: string) => boolean)|undefined} Exists */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const ID = /^[a-z0-9-]{1,40}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TEXTURES = ["straight", "waves", "curls", "coils", "braids"];
const RESERVED = ["index", "privacy", "visit", "services", "colour", "stylists", "look-book", "curly-and-textured", "colour-consultation", "colour-upkeep", "products", "journal", "bridal-and-occasion", "gift-vouchers", "404"];

/** @param {Report} err @param {string} path @param {any} v */
function text(err, path, v) { if (!isStr(v)) err(path, "required text is missing"); }

/** A misspelt setting is refused, not silently ignored. @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (isObj(o)) for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}

/** @param {Report} err @param {string} path @param {any} p @param {Exists} exists @param {string[]} [more] */
function photo(err, path, p, exists, more = []) {
  if (!isObj(p)) { err(path, "a photo: { src, width, height, alt }"); return; }
  onlyKeys(p, ["src", "width", "height", "alt", ...more], path, err);
  text(err, `${path}.alt`, p.alt);
  if (!Number.isInteger(p.width) || !Number.isInteger(p.height)) err(path, "width and height in pixels");
  for (const k of ["src", ...more.filter((m) => m === "phone")]) {
    if (k === "phone" && p.phone === undefined) continue;
    if (!isStr(p[k])) err(`${path}.${k}`, "required");
    else if (exists && !exists(p[k])) err(`${path}.${k}`, `file not found: ${p[k]}`);
  }
}

/** Unique ids in a list. @param {Report} err @param {string} path @param {any[]} list @returns {string[]} */
function ids(err, path, list) {
  const seen = new Set();
  list.forEach((x, i) => {
    if (!ID.test(x?.id ?? "")) err(`${path}[${i}].id`, "lowercase letters, numbers and dashes");
    else if (seen.has(x.id)) err(`${path}[${i}].id`, `"${x.id}" is used twice`);
    seen.add(x?.id);
  });
  return [...seen].filter(Boolean);
}

/** @param {any} o @param {string} at @param {Report} err @param {Exists} exists */
function pageHead(o, at, err, exists) {
  if (!isObj(o)) { err(at, "{ title, intro }"); return; }
  onlyKeys(o, ["title", "intro", "description", "photo"], at, err);
  text(err, `${at}.title`, o.title);
  if (o.description !== undefined && (!isStr(o.description) || o.description.length > 160)) err(`${at}.description`, "one sentence for Google, up to 160 characters");
  if (o.photo !== undefined) photo(err, `${at}.photo`, o.photo, exists);
}

/** @param {any} site @param {Report} err @param {Exists} [exists] */
export function checkHair(site, err, exists) {
  if (site.kit !== "hair") return;
  const menu = site.menu !== undefined ? checkMenu(site.menu, err) : null;
  if (site.hero !== undefined) checkHero(site.hero, menu, err, exists);
  const stylists = site.stylists !== undefined && menu ? checkStylists(site.stylists, menu, site.mode, err, exists) : [];
  if (site.textures !== undefined) checkTextures(site.textures, menu, stylists, err, exists);
  if (site.upkeep !== undefined) checkUpkeep(site.upkeep, err, exists);
  if (site.skinTest !== undefined) checkSkinTest(site.skinTest, err);
  if (site.looks !== undefined) checkLooks(site.looks, menu, stylists, err, exists);
  if (site.pairs !== undefined) checkPairs(site.pairs, stylists, site.mode, err, exists);
  if (site.consultation !== undefined) checkConsultation(site.consultation, err, exists);
  if (site.products !== undefined) checkProducts(site.products, err, exists);
  if (site.groupPages !== undefined) checkGroupPages(site.groupPages, menu, err, exists);
  if (site.wedding !== undefined) checkWedding(site.wedding, err, exists);
  if (site.journal !== undefined) checkJournal(site.journal, err, exists);
  if (site.match !== undefined) { onlyKeys(site.match, ["doing"], "match", err); checkMatch(site.match, stylists.length ? site.stylists.items : [], err); }
  if (site.chairs !== undefined) checkChairs(site.chairs, menu, site.mode, err);
  if (site.pass !== undefined) checkPass(site.pass, menu, site.mode, err);
  for (const k of ["servicesPage", "colourPage", "stylistsPage", "texturedPage", "upkeepPage", "voucherPage"]) if (site[k] !== undefined) pageHead(site[k], k, err, exists);
}

/**
 * The price grid: lengths and levels in order, groups, and each service priced per level (one price, or one per length),
 * or null for "priced at a free consultation". Times are one number or one per length.
 * @param {any} m @param {Report} err @returns {{ lengths: string[], levels: string[], groups: string[], services: string[] }|null}
 */
function checkMenu(m, err) {
  if (!isObj(m)) { err("menu", "{ message, lengths, levels, groups, services }"); return null; }
  onlyKeys(m, ["message", "lengths", "levels", "groups", "services", "hero", "defaults", "note"], "menu", err);
  text(err, "menu.message", m.message);
  const list = (/** @type {string} */ k, /** @type {number} */ min, /** @type {string} */ eg) => {
    if (!Array.isArray(m[k]) || m[k].length < min) { err(`menu.${k}`, `at least ${min}, e.g. ${eg}`); return []; }
    const out = ids(err, `menu.${k}`, m[k]);
    m[k].forEach((/** @type {any} */ x, /** @type {number} */ i) => { onlyKeys(x, ["id", "name", "line"], `menu.${k}[${i}]`, err); text(err, `menu.${k}[${i}].name`, x?.name); });
    return out;
  };
  const lengths = list("lengths", 2, '{ "id": "short", "name": "Short", "line": "Above the jaw" }');
  const levels = list("levels", 1, '{ "id": "senior", "name": "Senior stylist" }');
  const groups = list("groups", 1, '{ "id": "cuts", "name": "Cuts and styling" }');
  if (!Array.isArray(m.services) || !m.services.length) { err("menu.services", "at least one service"); return null; }
  const services = ids(err, "menu.services", m.services);
  m.services.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    const at = `menu.services[${i}]`;
    onlyKeys(s, ["id", "name", "group", "text", "prices", "minutes", "skinTest"], at, err);
    text(err, `${at}.name`, s?.name);
    if (!groups.includes(s?.group)) err(`${at}.group`, `one of ${groups.join(", ")}`);
    const n = lengths.length;
    const okPrice = (/** @type {any} */ p) => Number.isInteger(p) && p > 0 && p < 5000;
    if (s?.prices !== null) {
      if (!isObj(s?.prices) || !Object.keys(s.prices).length) err(`${at}.prices`, "the salon's prices by level, e.g. { \"senior\": [74, 92, 100, 110] } (one per length) or { \"senior\": 45 }, or null to price it at a consultation");
      else for (const [lv, p] of Object.entries(s.prices)) {
        if (!levels.includes(lv)) err(`${at}.prices.${lv}`, `a level: ${levels.join(", ")}`);
        else if (Array.isArray(p) ? p.length !== n || !p.every(okPrice) : !okPrice(p)) err(`${at}.prices.${lv}`, `whole pounds: one price, or ${n} (one per length, shortest first)`);
      }
    }
    const okMin = (/** @type {any} */ x) => Number.isInteger(x) && x >= 10 && x <= 600;
    if (Array.isArray(s?.minutes) ? s.minutes.length !== n || !s.minutes.every(okMin) : !okMin(s?.minutes)) err(`${at}.minutes`, `minutes (10–600): one time, or ${n} (one per length)`);
    if (s?.skinTest !== undefined && typeof s.skinTest !== "boolean") err(`${at}.skinTest`, "true when this colour needs a skin test first");
  });
  if (m.hero !== undefined && (!Array.isArray(m.hero) || !m.hero.length || m.hero.length > 4 || !m.hero.every((/** @type {string} */ id) => services.includes(id)))) err("menu.hero", "one to four service ids shown on the price by length");
  if (m.defaults !== undefined) {
    onlyKeys(m.defaults, ["service", "level", "length"], "menu.defaults", err);
    if (m.defaults.service !== undefined && !(m.hero ?? services).includes(m.defaults.service)) err("menu.defaults.service", "a service on the price by length");
    if (m.defaults.level !== undefined && !levels.includes(m.defaults.level)) err("menu.defaults.level", `one of ${levels.join(", ")}`);
    if (m.defaults.length !== undefined && !lengths.includes(m.defaults.length)) err("menu.defaults.length", `one of ${lengths.join(", ")}`);
  }
  return { lengths, levels, groups, services };
}

/**
 * The cut photograph: the plate (the photograph with the hair below the shoulder taken out), the hair layer cut from
 * the same photograph, and where each length falls on it.
 * @param {any} h @param {ReturnType<typeof checkMenu>} menu @param {Report} err @param {Exists} exists
 */
function checkHero(h, menu, err, exists) {
  if (!isObj(h) || h.cut === undefined) return; // a hero from another look's settings is checked there
  onlyKeys(h, ["kicker", "title", "intro", "cut"], "hero", err);
  text(err, "hero.title", h.title);
  const c = h.cut;
  if (!isObj(c)) { err("hero.cut", "{ plate, hair, marks }"); return; }
  onlyKeys(c, ["plate", "hair", "marks", "focus"], "hero.cut", err);
  if (c.focus !== undefined && !(typeof c.focus === "number" && c.focus >= 0 && c.focus <= 1)) err("hero.cut.focus", "where the hair is across the photograph (0 left, 1 right), for phones");
  photo(err, "hero.cut.plate", c.plate, exists, ["phone"]);
  if (isObj(c.plate) && c.plate.width < c.plate.height * 1.3) err("hero.cut.plate", "a landscape photograph (about 3:2), with room on the left for the words");
  if (!isObj(c.hair)) err("hero.cut.hair", "{ src, phone, width, height, top }: the hair layer, cut from the same photograph");
  else {
    onlyKeys(c.hair, ["src", "phone", "width", "height", "top"], "hero.cut.hair", err);
    for (const k of ["src", "phone"]) if (c.hair[k] !== undefined && exists && !exists(c.hair[k])) err(`hero.cut.hair.${k}`, `file not found: ${c.hair[k]}`);
    if (!isStr(c.hair.src)) err("hero.cut.hair.src", "required");
    if (!(typeof c.hair.top === "number" && c.hair.top >= 0 && c.hair.top < 1)) err("hero.cut.hair.top", "where the layer starts, as a share of the photograph's height (0–1)");
  }
  if (!isObj(c.marks)) { err("hero.cut.marks", "where each length falls on the photograph, 0 (top) to 1"); return; }
  for (const id of menu?.lengths ?? []) if (!(typeof c.marks[id] === "number" && c.marks[id] > 0 && c.marks[id] <= 1)) err(`hero.cut.marks.${id}`, "a share of the photograph's height (0–1)");
  for (const id of Object.keys(c.marks)) if (menu && !menu.lengths.includes(id)) err(`hero.cut.marks.${id}`, `not a length: ${menu.lengths.join(", ")}`);
  const ys = (menu?.lengths ?? []).map((id) => c.marks[id]);
  if (ys.some((y, i) => i && !(y > ys[i - 1]))) err("hero.cut.marks", "lengths fall further down the photograph, shortest first");
}

const DOES = ["cuts", "colour", "textured", "extensions", "mens", "occasion", "treatments"];

/** @param {any} s @param {NonNullable<ReturnType<typeof checkMenu>>} menu @param {string} mode @param {Report} err @param {Exists} exists @returns {string[]} */
function checkStylists(s, menu, mode, err, exists) {
  if (!isObj(s) || !Array.isArray(s.items) || !s.items.length) { err("stylists.items", "at least one stylist"); return []; }
  onlyKeys(s, ["message", "items", "freeDays"], "stylists", err);
  text(err, "stylists.message", s.message);
  const out = ids(err, "stylists.items", s.items);
  s.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `stylists.items[${i}]`;
    onlyKeys(x, ["id", "name", "level", "line", "does", "textures", "work"], at, err);
    text(err, `${at}.name`, x?.name);
    text(err, `${at}.line`, x?.line);
    if (!menu.levels.includes(x?.level)) err(`${at}.level`, `one of ${menu.levels.join(", ")}`);
    if (!Array.isArray(x?.does) || !x.does.length || !x.does.every((/** @type {string} */ d) => DOES.includes(d))) err(`${at}.does`, `one or more of ${DOES.join(", ")}`);
    if (x?.textures !== undefined && (!Array.isArray(x.textures) || !x.textures.every((/** @type {string} */ t) => TEXTURES.includes(t)))) err(`${at}.textures`, `any of ${TEXTURES.join(", ")}`);
    if (x?.work !== undefined) photo(err, `${at}.work`, x.work, exists);
  });
  const f = s.freeDays;
  if (f !== undefined) {
    onlyKeys(f, ["source", "csvUrl", "staleAfterDays"], "stylists.freeDays", err);
    if (!["sheet", "simulated"].includes(f?.source)) err("stylists.freeDays.source", '"sheet" (the salon\'s published Google Sheet)');
    else if (f.source === "simulated" && mode !== "demo") err("stylists.freeDays.source", 'simulated next free days are only allowed on demo sites; use "sheet"');
    if (f?.source === "sheet" && !(isStr(f.csvUrl) && /^https:\/\/docs\.google\.com\/spreadsheets\/d\/e\/[^/]+\/pub\?.*output=csv/.test(f.csvUrl))) err("stylists.freeDays.csvUrl", "the sheet's \"Publish to the web\" CSV link (https://docs.google.com/spreadsheets/d/e/…/pub?…output=csv)");
    if (f?.staleAfterDays !== undefined && !(Number.isInteger(f.staleAfterDays) && f.staleAfterDays >= 1 && f.staleAfterDays <= 14)) err("stylists.freeDays.staleAfterDays", "1–14 days");
  }
  return out;
}

/** @param {any} t @param {ReturnType<typeof checkMenu>} menu @param {string[]} stylists @param {Report} err @param {Exists} exists */
function checkTextures(t, menu, stylists, err, exists) {
  if (!isObj(t) || !Array.isArray(t.items) || t.items.length < 2) { err("textures.items", "at least two textures"); return; }
  onlyKeys(t, ["items"], "textures", err);
  ids(err, "textures.items", t.items);
  t.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `textures.items[${i}]`;
    onlyKeys(x, ["id", "name", "photo", "stylists", "service", "arrive"], at, err);
    if (!TEXTURES.includes(x?.id)) err(`${at}.id`, `one of ${TEXTURES.join(", ")}`);
    text(err, `${at}.name`, x?.name);
    text(err, `${at}.arrive`, x?.arrive);
    photo(err, `${at}.photo`, x?.photo, exists);
    if (!Array.isArray(x?.stylists) || !x.stylists.length || !x.stylists.every((/** @type {string} */ s) => stylists.includes(s))) err(`${at}.stylists`, "one or more stylist ids");
    if (menu && !menu.services.includes(x?.service)) err(`${at}.service`, "a service id from the menu");
  });
}

/** @param {any} u @param {Report} err @param {Exists} exists */
function checkUpkeep(u, err, exists) {
  if (!isObj(u) || !Array.isArray(u.items) || !u.items.length) { err("upkeep.items", "at least one colour, e.g. { id: \"roots\", name: \"Root tint\", weeks: 6 }"); return; }
  onlyKeys(u, ["message", "items", "default", "photo"], "upkeep", err);
  text(err, "upkeep.message", u.message);
  const out = ids(err, "upkeep.items", u.items);
  u.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    onlyKeys(x, ["id", "name", "weeks", "text", "care"], `upkeep.items[${i}]`, err);
    text(err, `upkeep.items[${i}].name`, x?.name);
    if (!(Number.isInteger(x?.weeks) && x.weeks >= 2 && x.weeks <= 52)) err(`upkeep.items[${i}].weeks`, "the salon's usual weeks between visits (2–52)");
    if (x?.care !== undefined && (!Array.isArray(x.care) || !x.care.every(isStr))) err(`upkeep.items[${i}].care`, "a list of short lines");
  });
  if (u.default !== undefined && !out.includes(u.default)) err("upkeep.default", `one of ${out.join(", ")}`);
  if (u.photo !== undefined) photo(err, "upkeep.photo", u.photo, exists);
}

/** @param {any} s @param {Report} err */
function checkSkinTest(s, err) {
  if (!isObj(s)) { err("skinTest", "{ hoursBefore, who, walkIn, message }"); return; }
  onlyKeys(s, ["hoursBefore", "who", "walkIn", "message", "note"], "skinTest", err);
  if (!(Number.isInteger(s.hoursBefore) && s.hoursBefore >= 24 && s.hoursBefore <= 168)) err("skinTest.hoursBefore", "the salon's rule in hours before colour (24–168), e.g. 48");
  for (const k of ["who", "walkIn", "message"]) text(err, `skinTest.${k}`, s[k]);
}

/** @param {any} l @param {ReturnType<typeof checkMenu>} menu @param {string[]} stylists @param {Report} err @param {Exists} exists */
function checkLooks(l, menu, stylists, err, exists) {
  if (!isObj(l) || !Array.isArray(l.items) || l.items.length < 2) { err("looks.items", "at least two looks"); return; }
  onlyKeys(l, ["message", "filters", "items"], "looks", err);
  text(err, "looks.message", l.message);
  const filters = Array.isArray(l.filters) ? ids(err, "looks.filters", l.filters) : [];
  if (!filters.length) err("looks.filters", "at least one, e.g. { id: \"colour\", name: \"Colour\" }");
  (l.filters ?? []).forEach((/** @type {any} */ f, /** @type {number} */ i) => { onlyKeys(f, ["id", "name"], `looks.filters[${i}]`, err); text(err, `looks.filters[${i}].name`, f?.name); });
  ids(err, "looks.items", l.items);
  l.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `looks.items[${i}]`;
    onlyKeys(x, ["id", "name", "tags", "stylist", "service", "photo"], at, err);
    text(err, `${at}.name`, x?.name);
    if (!Array.isArray(x?.tags) || !x.tags.length || !x.tags.every((/** @type {string} */ t) => filters.includes(t))) err(`${at}.tags`, `one or more of ${filters.join(", ")}`);
    if (!stylists.includes(x?.stylist)) err(`${at}.stylist`, "the stylist who did it");
    if (x?.service !== undefined && menu && !menu.services.includes(x.service)) err(`${at}.service`, "a service id from the menu");
    photo(err, `${at}.photo`, x?.photo, exists);
  });
}

/**
 * Before and after: one client in one session, never two people; on a client site each pair needs the date the client
 * agreed in writing.
 * @param {any} p @param {string[]} stylists @param {string} mode @param {Report} err @param {Exists} exists
 */
function checkPairs(p, stylists, mode, err, exists) {
  if (!isObj(p) || !Array.isArray(p.items) || !p.items.length) { err("pairs.items", "at least one pair"); return; }
  onlyKeys(p, ["items", "note"], "pairs", err);
  ids(err, "pairs.items", p.items);
  p.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `pairs.items[${i}]`;
    onlyKeys(x, ["id", "before", "after", "beforeLabel", "afterLabel", "alt", "caption", "stylist", "consent"], at, err);
    for (const k of ["before", "after"]) {
      if (!isStr(x?.[k])) err(`${at}.${k}`, "a photo in img/ (the same client, ideally the same framing, 4:5)");
      else if (exists && !exists(x[k])) err(`${at}.${k}`, `file not found: ${x[k]}`);
    }
    text(err, `${at}.alt`, x?.alt);
    if (!stylists.includes(x?.stylist)) err(`${at}.stylist`, "the stylist who did it");
    if (mode === "client" && !isYmd(x?.consent)) err(`${at}.consent`, "the date the client agreed in writing (YYYY-MM-DD); without it the pair can't be shown");
    else if (x?.consent !== undefined && !isYmd(x.consent)) err(`${at}.consent`, "YYYY-MM-DD");
  });
}

/** @param {any} c @param {Report} err @param {Exists} exists */
function checkConsultation(c, err, exists) {
  if (!isObj(c)) { err("consultation", "{ message, title, wants, lastColour, steps }"); return; }
  onlyKeys(c, ["message", "title", "intro", "description", "photo", "wants", "lastColour", "steps", "note"], "consultation", err);
  for (const k of ["message", "title"]) text(err, `consultation.${k}`, c[k]);
  for (const k of ["wants", "lastColour"]) if (!Array.isArray(c[k]) || c[k].length < 2 || !c[k].every(isStr)) err(`consultation.${k}`, "a list of at least two choices");
  if (!Array.isArray(c.steps) || !c.steps.every(isStr)) err("consultation.steps", "the steps in order, a line each");
  if (c.photo !== undefined) photo(err, "consultation.photo", c.photo, exists);
}

/** @param {any} p @param {Report} err @param {Exists} exists */
function checkProducts(p, err, exists) {
  if (!isObj(p) || !Array.isArray(p.items) || !p.items.length) { err("products.items", "at least one product"); return; }
  onlyKeys(p, ["message", "title", "intro", "description", "items", "note"], "products", err);
  for (const k of ["message", "title"]) text(err, `products.${k}`, p[k]);
  ids(err, "products.items", p.items);
  p.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `products.items[${i}]`;
    onlyKeys(x, ["id", "name", "for", "price", "size", "photo"], at, err);
    text(err, `${at}.name`, x?.name);
    text(err, `${at}.for`, x?.for);
    if (x?.price !== undefined && !(typeof x.price === "number" && x.price > 0 && x.price < 1000)) err(`${at}.price`, "the shelf price in pounds");
    photo(err, `${at}.photo`, x?.photo, exists);
  });
}

/** @param {any} g @param {ReturnType<typeof checkMenu>} menu @param {Report} err @param {Exists} exists */
function checkGroupPages(g, menu, err, exists) {
  if (!isObj(g) || !Array.isArray(g.items) || !g.items.length) { err("groupPages.items", "at least one page"); return; }
  onlyKeys(g, ["items"], "groupPages", err);
  const seen = new Set();
  g.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `groupPages.items[${i}]`;
    onlyKeys(x, ["group", "slug", "title", "description", "intro", "photo", "notes"], at, err);
    if (menu && !menu.groups.includes(x?.group)) err(`${at}.group`, `one of ${menu.groups.join(", ")}`);
    if (!SLUG.test(x?.slug ?? "") || RESERVED.includes(x?.slug)) err(`${at}.slug`, "lowercase words with dashes, not a page the site already has");
    else if (seen.has(x.slug)) err(`${at}.slug`, "used twice");
    seen.add(x?.slug);
    text(err, `${at}.title`, x?.title);
    if (!isStr(x?.description) || x.description.length > 160) err(`${at}.description`, "one sentence for Google, up to 160 characters");
    photo(err, `${at}.photo`, x?.photo, exists);
    if (x?.notes !== undefined && (!Array.isArray(x.notes) || !x.notes.every(isStr))) err(`${at}.notes`, "a list of short lines");
  });
}

/** @param {any} w @param {Report} err @param {Exists} exists */
function checkWedding(w, err, exists) {
  if (!isObj(w)) { err("wedding", "{ message, title, steps }"); return; }
  onlyKeys(w, ["message", "title", "intro", "description", "photo", "steps", "note"], "wedding", err);
  for (const k of ["message", "title"]) text(err, `wedding.${k}`, w[k]);
  if (w.photo !== undefined) photo(err, "wedding.photo", w.photo, exists);
  if (!Array.isArray(w.steps) || w.steps.length < 2) { err("wedding.steps", "the salon's steps, e.g. { id: \"trial\", label: \"Trial\", weeksBefore: 8 }"); return; }
  ids(err, "wedding.steps", w.steps);
  w.steps.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    onlyKeys(s, ["id", "label", "weeksBefore", "note"], `wedding.steps[${i}]`, err);
    text(err, `wedding.steps[${i}].label`, s?.label);
    if (!(typeof s?.weeksBefore === "number" && s.weeksBefore >= 0 && s.weeksBefore <= 52)) err(`wedding.steps[${i}].weeksBefore`, "weeks before the wedding (0–52; 0.5 for a few days)");
  });
}

/** @param {any} j @param {Report} err @param {Exists} exists */
function checkJournal(j, err, exists) {
  if (!isObj(j) || !Array.isArray(j.items) || !j.items.length) { err("journal.items", "at least one article"); return; }
  onlyKeys(j, ["title", "intro", "items"], "journal", err);
  text(err, "journal.title", j.title);
  const seen = new Set();
  j.items.forEach((/** @type {any} */ a, /** @type {number} */ i) => {
    const at = `journal.items[${i}]`;
    onlyKeys(a, ["slug", "title", "date", "description", "photo", "body", "sources"], at, err);
    if (!SLUG.test(a?.slug ?? "") || RESERVED.includes(a?.slug)) err(`${at}.slug`, "lowercase words with dashes, not a page the site already has");
    else if (seen.has(a.slug)) err(`${at}.slug`, "used twice");
    seen.add(a?.slug);
    text(err, `${at}.title`, a?.title);
    if (!isYmd(a?.date)) err(`${at}.date`, "YYYY-MM-DD");
    if (!isStr(a?.description) || a.description.length > 160) err(`${at}.description`, "one sentence for Google, up to 160 characters");
    photo(err, `${at}.photo`, a?.photo, exists);
    if (!Array.isArray(a?.body) || !a.body.length || !a.body.every((/** @type {any} */ b) => isStr(b) || (isObj(b) && isStr(b.heading)))) err(`${at}.body`, "paragraphs, or { heading } between them");
    if (a?.sources !== undefined && (!Array.isArray(a.sources) || !a.sources.every((/** @type {any} */ s) => isStr(s?.name) && /^https:\/\//.test(s?.url ?? "")))) err(`${at}.sources`, "{ name, url } for every general fact");
  });
}

/** The match's first question: what we're doing, each answer something a stylist does. @param {any} m @param {any[]} stylists @param {Report} err */
function checkMatch(m, stylists, err) {
  if (!Array.isArray(m?.doing) || m.doing.length < 2) { err("match.doing", "at least two choices, e.g. { id: \"colour\", name: \"Colour\" }"); return; }
  m.doing.forEach((/** @type {any} */ d, /** @type {number} */ i) => {
    onlyKeys(d, ["id", "name"], `match.doing[${i}]`, err);
    text(err, `match.doing[${i}].name`, d?.name);
    if (!DOES.includes(d?.id)) err(`match.doing[${i}].id`, `one of ${DOES.join(", ")}`);
    else if (stylists.length && !stylists.some((s) => s.does?.includes(d.id))) err(`match.doing[${i}].id`, "no stylist does this");
  });
}

/**
 * Chairs free today: the salon's own slot types (each pointing at a menu service for the price) and its published sheet.
 * @param {any} c @param {ReturnType<typeof checkMenu>} menu @param {string} mode @param {Report} err
 */
function checkChairs(c, menu, mode, err) {
  if (!isObj(c)) { err("chairs", "{ message, source, csvUrl, services }"); return; }
  onlyKeys(c, ["message", "source", "csvUrl", "services", "note"], "chairs", err);
  text(err, "chairs.message", c.message);
  if (!["sheet", "simulated"].includes(c.source)) err("chairs.source", '"sheet" (the salon\'s published Google Sheet)');
  else if (c.source === "simulated" && mode !== "demo") err("chairs.source", 'simulated chairs are only allowed on demo sites; use "sheet"');
  if (c.source === "sheet" && !(isStr(c.csvUrl) && /^https:\/\/docs\.google\.com\/spreadsheets\/d\/e\/[^/]+\/pub\?.*output=csv/.test(c.csvUrl))) err("chairs.csvUrl", "the sheet's \"Publish to the web\" CSV link (https://docs.google.com/spreadsheets/d/e/…/pub?…output=csv)");
  if (!Array.isArray(c.services) || !c.services.length) { err("chairs.services", "at least one, e.g. { id: \"blow-dry\", name: \"Blow-dry\", service: \"blowdry\" }"); return; }
  ids(err, "chairs.services", c.services);
  c.services.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    onlyKeys(x, ["id", "name", "service"], `chairs.services[${i}]`, err);
    text(err, `chairs.services[${i}].name`, x?.name);
    if (menu && !menu.services.includes(x?.service)) err(`chairs.services[${i}].service`, "a service id from the menu (for the price)");
  });
}

/** The blow-dry pass: a menu service, how many visits, the salon's price, the Stripe Payment Link. @param {any} p @param {any} menu @param {string} mode @param {Report} err */
function checkPass(p, menu, mode, err) {
  if (!isObj(p)) { err("pass", "{ service, visits, price, for, stripeUrl }"); return; }
  onlyKeys(p, ["service", "name", "visits", "price", "months", "for", "stripeUrl", "note"], "pass", err);
  if (menu && !menu.services.includes(p.service)) err("pass.service", "a service id from the menu");
  if (!(Number.isInteger(p.visits) && p.visits >= 2 && p.visits <= 20)) err("pass.visits", "a whole number from 2 to 20");
  if (!(Number.isInteger(p.price) && p.price > 0)) err("pass.price", "whole pounds, the salon's own price");
  if (p.months !== undefined && !(Number.isInteger(p.months) && p.months >= 1 && p.months <= 24)) err("pass.months", "1 to 24, or leave it out");
  text(err, "pass.for", p.for);
  if (!(isStr(p.stripeUrl) && /^https:\/\/buy\.stripe\.com\/[A-Za-z0-9_]+$/.test(p.stripeUrl))) err("pass.stripeUrl", "the salon's Stripe Payment Link (https://buy.stripe.com/…)");
  else if (mode !== "demo" && p.stripeUrl.startsWith("https://buy.stripe.com/test_")) err("pass.stripeUrl", "a test link is only allowed on demo sites");
  else if (mode === "demo" && !p.stripeUrl.startsWith("https://buy.stripe.com/test_")) err("pass.stripeUrl", "a demo uses a test link (https://buy.stripe.com/test_…) so it can never take real money");
}
