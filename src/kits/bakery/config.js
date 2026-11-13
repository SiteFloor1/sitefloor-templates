// @ts-check
/**
 * Validation for the bakery kit (chocolatiers, gelaterias, dessert shops, bakeries, cake makers): the menu with allergens
 * and diet marks, today's sheet, the gelato wall, late opening, delivery apps, celebration orders, collection requests,
 * private hire, the flavour vote, the box and the tasting flight; and the shared Payment Links (any kit). Unknown keys are refused so a typo can't
 * silently switch something off; simulated data is refused on client sites, and fake Payment Links on either side.
 */
import { ALLERGEN_IDS, BAKERY_DIET_IDS } from "../../core/lib/allergens.js";
import { isTime } from "../../core/lib/hours.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @param {unknown} v @returns {v is string} */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
/** @param {unknown} v @returns {v is Record<string, any>} */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {unknown} v @param {number} min @param {number} max */
const isNum = (v, min, max) => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
/** @param {unknown} v @param {number} min @param {number} max */
const isInt = (v, min, max) => Number.isInteger(v) && isNum(v, min, max);
const SLUG = /^[a-z0-9-]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const HEX = /^#[0-9a-f]{6}$/i;
const HTTPS = /^https:\/\/[^\s]+$/;
const SHEET = /^https:\/\/docs\.google\.com\/spreadsheets\/.+output=csv/;
const STRIPE = /^https:\/\/buy\.stripe\.com\/[A-Za-z0-9_-]+$/;
const DELIVERY_APPS = ["Deliveroo", "Uber Eats", "Just Eat", "Our own delivery"];
const FORM = /^https:\/\/docs\.google\.com\/forms\/d\/e\/[A-Za-z0-9_-]+\/viewform$/;
/** Box sizes the builder can lay out, and the grid each one uses (columns × rows). */
export const BOX_GRIDS = { 4: [2, 2], 6: [3, 2], 9: [3, 3], 12: [4, 3], 16: [4, 4] };
export const FINISH_KINDS = ["mirror", "velvet", "buttercream", "fondant", "naked", "ganache"];
export const TOPPING_KINDS = ["raspberries", "blueberries", "cherries", "macarons", "gold-leaf", "shards", "rosettes", "pearls"];
const ANIMAL = ["milk", "eggs", "fish", "crustaceans", "molluscs"];

/** @param {Record<string, any>} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}

/**
 * A non-empty list of objects with ids unique in the list.
 * @param {any} list @param {string} at @param {Report} err @param {(item: any, at: string) => void} each @returns {Map<string, any>}
 */
function idList(list, at, err, each) {
  /** @type {Map<string, any>} */ const ids = new Map();
  if (!Array.isArray(list) || !list.length) { err(at, "a non-empty list"); return ids; }
  list.forEach((item, i) => {
    const p = `${at}[${i}]`;
    if (!isObj(item)) { err(p, "an object"); return; }
    if (!SLUG.test(item.id ?? "")) err(`${p}.id`, "lowercase letters, numbers and dashes");
    else if (ids.has(item.id)) err(`${p}.id`, `"${item.id}" is used twice`);
    else ids.set(item.id, item);
    each(item, p);
  });
  return ids;
}

/** @param {any} p @param {string} at @param {Report} err */
function photo(p, at, err) {
  if (!isObj(p)) { err(at, "{ src, width, height, alt }"); return; }
  onlyKeys(p, ["src", "width", "height", "alt"], at, err);
  if (!isStr(p.src) || !/^img\/.+\.(webp|jpe?g|png|avif)$/i.test(p.src)) err(`${at}.src`, "a photo in the site's img/ folder, e.g. img/kunafa.webp");
  if (!isInt(p.width, 1, 10000) || !isInt(p.height, 1, 10000)) err(at, "width and height in pixels");
  if (!isStr(p.alt)) err(`${at}.alt`, "what the photo shows, for people who can't see it");
}

/** Page copy: { kicker, title, intro?, description? }. @param {any} o @param {string} at @param {Report} err */
function pageCopy(o, at, err) {
  if (!isObj(o)) { err(at, "{ kicker, title, intro?, description? }"); return; }
  onlyKeys(o, ["kicker", "title", "intro", "description"], at, err);
  if (!isStr(o.kicker)) err(`${at}.kicker`, "the small line above the page title");
  if (!isStr(o.title)) err(`${at}.title`, "the page title");
  for (const k of ["intro", "description"]) if (o[k] !== undefined && !isStr(o[k])) err(`${at}.${k}`, "text");
}

/**
 * Allergens and diet marks, from the shop's own chart. A vegan item can't contain an animal allergen, an eggless one
 * can't contain eggs: the site refuses rather than shows a mark that contradicts the chart.
 * @param {any} x @param {string} at @param {Report} err
 */
function marks(x, at, err) {
  if (!Array.isArray(x.allergens) || x.allergens.some((/** @type {any} */ a) => !ALLERGEN_IDS.includes(a))) err(`${at}.allergens`, `from the shop's allergen chart; [] if none. One of: ${ALLERGEN_IDS.join(", ")}`);
  if (x.diets !== undefined && (!Array.isArray(x.diets) || x.diets.some((/** @type {any} */ d) => !BAKERY_DIET_IDS.includes(d)))) err(`${at}.diets`, `marks from the shop: ${BAKERY_DIET_IDS.join(", ")}`);
  const allergens = Array.isArray(x.allergens) ? x.allergens : [];
  const diets = Array.isArray(x.diets) ? x.diets : [];
  if (diets.includes("vegan") && allergens.some((/** @type {string} */ a) => ANIMAL.includes(a))) err(`${at}.diets`, "marked vegan but its allergens include milk, eggs, fish or shellfish; check the chart");
  if (diets.includes("eggless") && allergens.includes("eggs")) err(`${at}.diets`, "marked eggless but its allergens include eggs; check the chart");
}

/** @param {any} site @param {Report} err */
export function checkBakery(site, err) {
  if (site.payLinks !== undefined) checkPayLinks(site.payLinks, site.mode, err);
  if (site.kit !== "bakery") return;
  const items = site.desserts !== undefined ? checkDesserts(site.desserts, err) : new Map();
  const pay = new Set((site.payLinks?.items ?? []).map((/** @type {any} */ p) => p?.id));
  /** @param {any} id @param {string} at */
  const payRef = (id, at) => { if (id !== undefined && !pay.has(id)) err(at, `"${id}" isn't one of payLinks.items`); };
  if (site.bakes !== undefined) checkBakes(site.bakes, site.mode, err);
  if (site.lateNight !== undefined) checkLateNight(site.lateNight, err);
  if (site.delivery !== undefined) checkDelivery(site.delivery, err);
  if (site.cakes !== undefined) checkCakes(site.cakes, err, payRef);
  if (site.collect !== undefined) checkCollect(site.collect, items, err);
  if (site.parties !== undefined) checkParties(site.parties, err, payRef);
  if (site.box !== undefined) checkBox(site.box, items, err, payRef);
  if (site.flight !== undefined) checkFlight(site.flight, items, err, payRef);
  if (site.gelato !== undefined) checkGelato(site.gelato, err);
  if (site.vote !== undefined) checkVote(site.vote, site.mode, err);
  if (site.favours !== undefined) checkFavours(site.favours, err);
  if (site.advent !== undefined) checkAdvent(site.advent, items, err, payRef);
  if (site.post !== undefined) checkPost(site.post, err);
  if (site.tubs !== undefined) checkTubs(site.tubs, site.gelato, err);
  if (site.boxMonth !== undefined) checkBoxMonth(site.boxMonth, err, payRef);
  if (site.features?.includes("favour-seal") && !site.features.includes("favours")) err("features", '"favour-seal" draws on the favour boxes: turn "favours" on too');
  if (site.hero?.photo !== undefined) photo(site.hero.photo, "hero.photo", err);
  if (site.hero?.film !== undefined) checkFilm(site.hero.film, err);
  if (site.features?.includes("shop-film") && site.hero?.film === undefined) err("hero.film", "the shop film is on but hero.film is missing (see the shop-film README)");
  for (const k of ["cakesPage", "partiesPage", "menuPage", "boxPage"]) if (site[k] !== undefined) pageCopy(site[k], k, err);
}

/**
 * The menu: sections of items, each with a price, its allergens and marks.
 * @param {any} d @param {Report} err @returns {Map<string, any>} every item by id
 */
function checkDesserts(d, err) {
  /** @type {Map<string, any>} */ const all = new Map();
  if (!isObj(d)) { err("desserts", "{ statement, chartChecked, sections }"); return all; }
  onlyKeys(d, ["statement", "chartChecked", "sections"], "desserts", err);
  if (!isStr(d.statement)) err("desserts.statement", "the shop's own allergen statement: what the kitchen handles, and to tell staff about allergies");
  if (!DATE.test(d.chartChecked ?? "")) err("desserts.chartChecked", "when the shop last checked its allergen chart, YYYY-MM-DD");
  idList(d.sections, "desserts.sections", err, (s, at) => {
    onlyKeys(s, ["id", "name", "intro", "items"], at, err);
    if (!isStr(s.name)) err(`${at}.name`, 'what the shop calls it, e.g. "Waffles & crêpes"');
    if (s.intro !== undefined && !isStr(s.intro)) err(`${at}.intro`, "text");
    idList(s.items, `${at}.items`, err, (x, xat) => {
      onlyKeys(x, ["id", "name", "desc", "price", "allergens", "diets", "photo", "tile", "notes", "tasteOrder", "takeaway", "box", "counter", "signature"], xat, err);
      if (!isStr(x.name)) err(`${xat}.name`, "required");
      if (x.desc !== undefined && !isStr(x.desc)) err(`${xat}.desc`, "text");
      if (!isNum(x.price, 0.01, 5000)) err(`${xat}.price`, 'pounds as a number, e.g. 7.5 (not "£7.50")');
      marks(x, xat, err);
      if (x.photo !== undefined) photo(x.photo, `${xat}.photo`, err);
      for (const k of ["takeaway", "box", "counter", "signature"]) if (x[k] !== undefined && typeof x[k] !== "boolean") err(`${xat}.${k}`, "true or false");
      if (x.tile !== undefined) photo(x.tile, `${xat}.tile`, err);
      if (x.box && !x.tile) err(`${xat}.tile`, "a piece for the box needs its tile: a square photo of the piece from above, cut out (transparent around it)");
      if (x.notes !== undefined && !isStr(x.notes)) err(`${xat}.notes`, "one tasting line, in the shop's words");
      if (x.tasteOrder !== undefined && !isInt(x.tasteOrder, 1, 99)) err(`${xat}.tasteOrder`, "where it comes in a tasting, 1 first (lightest) to 99 last (darkest)");
      if (SLUG.test(x.id ?? "") && all.has(x.id)) err(`${xat}.id`, `"${x.id}" is already used in another section`);
      else if (SLUG.test(x.id ?? "")) all.set(x.id, x);
    });
  });
  return all;
}

/** Tonight's sheet. @param {any} b @param {string} mode @param {Report} err */
function checkBakes(b, mode, err) {
  if (!isObj(b)) { err("bakes", "{ source, csvUrl, staleAfterMinutes? }"); return; }
  onlyKeys(b, ["source", "csvUrl", "staleAfterMinutes"], "bakes", err);
  if (!["sheet", "simulated"].includes(b.source)) err("bakes.source", '"sheet" (the shop\'s Google Sheet) or "simulated" (demos only)');
  if (b.source === "simulated" && mode === "client") err("bakes.source", 'simulated data is only allowed on demo sites; use "sheet"');
  if (b.source === "sheet" && !SHEET.test(b.csvUrl ?? "")) err("bakes.csvUrl", "a published Google Sheet CSV link (File → Share → Publish to web → CSV)");
  if (b.staleAfterMinutes !== undefined && !isInt(b.staleAfterMinutes, 10, 240)) err("bakes.staleAfterMinutes", '10–240: after this, "a few left" and the seats line go quiet');
}

/** @param {any} l @param {Report} err */
function checkLateNight(l, err) {
  if (!isObj(l)) { err("lateNight", "{ lastOrders, dineIn?, note? }"); return; }
  onlyKeys(l, ["lastOrders", "dineIn", "note"], "lateNight", err);
  if (!isInt(l.lastOrders, 0, 120)) err("lateNight.lastOrders", "minutes before closing that the last orders are taken, 0–120");
  for (const k of ["dineIn", "note"]) if (l[k] !== undefined && !isStr(l[k])) err(`lateNight.${k}`, "text");
}

/** @param {any} d @param {Report} err */
function checkDelivery(d, err) {
  if (!isObj(d)) { err("delivery", "{ apps: [{ name, url }], collection?, lateUntil? }"); return; }
  onlyKeys(d, ["apps", "collection", "lateUntil"], "delivery", err);
  if (!Array.isArray(d.apps) || !d.apps.length) err("delivery.apps", "a non-empty list of { name, url }");
  else d.apps.forEach((/** @type {any} */ a, /** @type {number} */ i) => {
    if (!isObj(a)) { err(`delivery.apps[${i}]`, "{ name, url }"); return; }
    onlyKeys(a, ["name", "url"], `delivery.apps[${i}]`, err);
    if (!DELIVERY_APPS.includes(a.name)) err(`delivery.apps[${i}].name`, `one of ${DELIVERY_APPS.join(", ")}`);
    if (!HTTPS.test(a.url ?? "")) err(`delivery.apps[${i}].url`, "the shop's own page on that app, https://…");
  });
  if (d.collection !== undefined && !isStr(d.collection)) err("delivery.collection", "text");
  if (d.lateUntil !== undefined && !isTime(d.lateUntil)) err("delivery.lateUntil", 'when delivery stops, "HH:MM", if it differs from closing');
}

/**
 * Celebration cakes and the Cake Builder: sizes and prices, what can go in and on a cake, notice, message.
 * @param {any} c @param {Report} err @param {(id: any, at: string) => void} payRef
 */
function checkCakes(c, err, payRef) {
  if (!isObj(c)) { err("cakes", "{ leadDays, cutoff, sizes, stacks, sponges, fillings, finishes, colours, toppings, … }"); return; }
  onlyKeys(c, ["leadDays", "cutoff", "maxDaysAhead", "sizes", "stacks", "sponges", "fillings", "finishes", "colours", "toppings", "maxToppings", "message", "start", "depositLink", "photos", "howToOrder", "note"], "cakes", err);
  if (!isInt(c.leadDays, 0, 60)) err("cakes.leadDays", "whole days' notice the shop needs, 0–60");
  if (!isTime(c.cutoff)) err("cakes.cutoff", 'requests after this time count from the next day, "HH:MM"');
  if (!isInt(c.maxDaysAhead, 7, 365)) err("cakes.maxDaysAhead", "how far ahead the shop takes cake orders, 7–365 days");
  const sizes = idList(c.sizes, "cakes.sizes", err, (s, at) => {
    onlyKeys(s, ["id", "label", "inches", "servings", "price"], at, err);
    if (!isStr(s.label)) err(`${at}.label`, 'e.g. "8 inch"');
    if (!isNum(s.inches, 3, 16)) err(`${at}.inches`, "the tier's diameter in inches, 3–16");
    if (!isInt(s.servings, 1, 200)) err(`${at}.servings`, "how many portions the shop cuts it into");
    if (!isNum(s.price, 1, 5000)) err(`${at}.price`, "the shop's price for that tier, in pounds");
  });
  const stacks = idList(c.stacks, "cakes.stacks", err, (s, at) => {
    onlyKeys(s, ["id", "label", "sizes"], at, err);
    if (!isStr(s.label)) err(`${at}.label`, 'e.g. "Two tiers, 8 and 6 inch"');
    if (!Array.isArray(s.sizes) || s.sizes.length < 1 || s.sizes.length > 4) { err(`${at}.sizes`, "1–4 size ids, bottom tier first"); return; }
    s.sizes.forEach((/** @type {any} */ id, /** @type {number} */ i) => {
      if (!sizes.has(id)) err(`${at}.sizes[${i}]`, `"${id}" isn't one of cakes.sizes`);
      else if (i > 0 && sizes.get(id).inches >= sizes.get(s.sizes[i - 1])?.inches) err(`${at}.sizes[${i}]`, "each tier must be smaller than the one below it");
    });
  });
  const part = (/** @type {string[]} */ extra) => (/** @type {any} */ x, /** @type {string} */ at) => {
    onlyKeys(x, ["id", "name", "price", "allergens", "diets", ...extra], at, err);
    if (!isStr(x.name)) err(`${at}.name`, "required");
    if (x.price !== undefined && !isNum(x.price, 0, 1000)) err(`${at}.price`, "extra in pounds (per tier for sponges, fillings and finishes)");
    marks(x, at, err);
  };
  const colourOf = (/** @type {any} */ x, /** @type {string} */ at, /** @type {string} */ k) => { if (!HEX.test(x[k] ?? "")) err(`${at}.${k}`, "a colour for the drawing, #rrggbb"); };
  const sponges = idList(c.sponges, "cakes.sponges", err, (x, at) => { part(["colour"])(x, at); colourOf(x, at, "colour"); });
  const fillings = idList(c.fillings, "cakes.fillings", err, (x, at) => { part(["colour"])(x, at); colourOf(x, at, "colour"); });
  const finishes = idList(c.finishes, "cakes.finishes", err, (x, at) => {
    part(["kind", "coloured", "glaze"])(x, at);
    if (!FINISH_KINDS.includes(x.kind)) err(`${at}.kind`, `how it's drawn: ${FINISH_KINDS.join(", ")}`);
    if (x.coloured !== undefined && typeof x.coloured !== "boolean") err(`${at}.coloured`, "false when the colour choice doesn't apply (e.g. a naked cake)");
    if (x.kind === "ganache") colourOf(x, at, "glaze");
    else if (x.glaze !== undefined) err(`${at}.glaze`, "only for a ganache drip");
  });
  const colours = idList(c.colours, "cakes.colours", err, (x, at) => {
    onlyKeys(x, ["id", "name", "hex"], at, err);
    if (!isStr(x.name)) err(`${at}.name`, "required");
    colourOf(x, at, "hex");
  });
  const toppings = idList(c.toppings, "cakes.toppings", err, (x, at) => {
    part(["kind", "colour"])(x, at);
    if (!TOPPING_KINDS.includes(x.kind)) err(`${at}.kind`, `how it's drawn: ${TOPPING_KINDS.join(", ")}`);
    if (x.colour !== undefined) colourOf(x, at, "colour");
  });
  if (!isInt(c.maxToppings, 0, 6)) err("cakes.maxToppings", "most toppings on one cake, 0–6");
  if (!isObj(c.message)) err("cakes.message", "{ max, price }: the longest message on the plaque, and its price (0 if free)");
  else {
    onlyKeys(c.message, ["max", "price"], "cakes.message", err);
    if (!isInt(c.message.max, 4, 40)) err("cakes.message.max", "4–40 characters");
    if (!isNum(c.message.price, 0, 100)) err("cakes.message.price", "pounds, 0 if free");
  }
  if (!isObj(c.start)) err("cakes.start", "the cake the builder opens with: { stack, sponge, filling, finish, colour, toppings, message }");
  else {
    onlyKeys(c.start, ["stack", "sponge", "filling", "finish", "colour", "toppings", "message"], "cakes.start", err);
    /** @type {[string, Map<string, any>][]} */
    const refs = [["stack", stacks], ["sponge", sponges], ["filling", fillings], ["finish", finishes], ["colour", colours]];
    for (const [k, m] of refs) if (!m.has(c.start[k])) err(`cakes.start.${k}`, `one of cakes.${k === "stack" ? "stacks" : k === "colour" ? "colours" : `${k}s`}`);
    if (!Array.isArray(c.start.toppings) || c.start.toppings.some((/** @type {any} */ t) => !toppings.has(t))) err("cakes.start.toppings", "topping ids");
    else if (isInt(c.maxToppings, 0, 6) && c.start.toppings.length > c.maxToppings) err("cakes.start.toppings", "more than maxToppings");
    if (typeof c.start.message !== "string" || (isObj(c.message) && c.start.message.length > c.message.max)) err("cakes.start.message", "text, up to message.max characters ('' for none)");
  }
  payRef(c.depositLink, "cakes.depositLink");
  if (c.photos !== undefined) {
    if (!Array.isArray(c.photos) || !c.photos.length) err("cakes.photos", "the shop's own cakes: a list of photos");
    else c.photos.forEach((/** @type {any} */ p, /** @type {number} */ i) => {
      if (!isObj(p)) { err(`cakes.photos[${i}]`, "{ src, width, height, alt, caption? }"); return; }
      const { caption, ...rest } = p;
      photo(rest, `cakes.photos[${i}]`, err);
      if (caption !== undefined && !isStr(caption)) err(`cakes.photos[${i}].caption`, "text");
    });
  }
  if (c.howToOrder !== undefined && (!Array.isArray(c.howToOrder) || !c.howToOrder.length || c.howToOrder.some((/** @type {any} */ s) => !isStr(s)))) err("cakes.howToOrder", "the steps, in the shop's words");
  if (c.note !== undefined && !isStr(c.note)) err("cakes.note", "text");
}

/** Collection requests. @param {any} c @param {Map<string, any>} items @param {Report} err */
function checkCollect(c, items, err) {
  if (!isObj(c)) { err("collect", "{ prepMinutes, step, daysAhead, note? }"); return; }
  onlyKeys(c, ["prepMinutes", "step", "daysAhead", "note"], "collect", err);
  if (!isInt(c.prepMinutes, 5, 240)) err("collect.prepMinutes", "minutes the shop needs before the earliest collection, 5–240");
  if (!isInt(c.step, 5, 60)) err("collect.step", "minutes between collection times, 5–60");
  if (!isInt(c.daysAhead, 0, 14)) err("collect.daysAhead", "how many days ahead a collection can be asked for, 0–14");
  if (c.note !== undefined && !isStr(c.note)) err("collect.note", "text");
  if (![...items.values()].some((x) => x.takeaway)) err("desserts", 'collect is on but no item has "takeaway": true');
}

/** Parties and groups. @param {any} p @param {Report} err @param {(id: any, at: string) => void} payRef */
function checkParties(p, err, payRef) {
  if (!isObj(p)) { err("parties", "{ options, servings, maxGuests, note?, depositLink? }"); return; }
  onlyKeys(p, ["options", "servings", "maxGuests", "note", "depositLink"], "parties", err);
  idList(p.options, "parties.options", err, (o, at) => {
    onlyKeys(o, ["id", "name", "text", "perHead", "price", "minGuests", "notice", "photo"], at, err);
    if (!isStr(o.name)) err(`${at}.name`, "required");
    if (!isStr(o.text)) err(`${at}.text`, "what's included, in the shop's words");
    if (o.perHead !== undefined && !isNum(o.perHead, 0.5, 500)) err(`${at}.perHead`, "pounds a head");
    if (o.price !== undefined && !isNum(o.price, 1, 10000)) err(`${at}.price`, "pounds");
    if (o.minGuests !== undefined && !isInt(o.minGuests, 1, 500)) err(`${at}.minGuests`, "smallest group");
    if (o.notice !== undefined && !isInt(o.notice, 0, 60)) err(`${at}.notice`, "days' notice");
    if (o.photo !== undefined) photo(o.photo, `${at}.photo`, err);
  });
  idList(p.servings, "parties.servings", err, (s, at) => {
    onlyKeys(s, ["id", "name", "servings", "price"], at, err);
    if (!isStr(s.name)) err(`${at}.name`, 'e.g. "10 inch cake" or "Brownie tray"');
    if (!isInt(s.servings, 1, 500)) err(`${at}.servings`, "how many it serves, in the shop's portions");
    if (!isNum(s.price, 1, 5000)) err(`${at}.price`, "pounds");
  });
  if (!isInt(p.maxGuests, 5, 1000)) err("parties.maxGuests", "the largest party the calculator takes");
  if (p.note !== undefined && !isStr(p.note)) err("parties.note", "text");
  payRef(p.depositLink, "parties.depositLink");
}

/**
 * The box: sizes with the shop's own flat price (and optional Payment Link), the message card, gifts.
 * @param {any} b @param {Map<string, any>} items @param {Report} err @param {(id: any, at: string) => void} payRef
 */
function checkBox(b, items, err, payRef) {
  if (!isObj(b)) { err("box", "{ sizes, cardMax, start?, note? }"); return; }
  onlyKeys(b, ["sizes", "cardMax", "start", "note"], "box", err);
  const sizes = Array.isArray(b.sizes) ? b.sizes : [];
  if (!sizes.length) err("box.sizes", "a list of { n, price, payLink? }");
  const seen = new Set();
  sizes.forEach((/** @type {any} */ z, /** @type {number} */ i) => {
    const at = `box.sizes[${i}]`;
    if (!isObj(z)) { err(at, "{ n, price, payLink? }"); return; }
    onlyKeys(z, ["n", "price", "payLink"], at, err);
    if (!Object.keys(BOX_GRIDS).map(Number).includes(z.n)) err(`${at}.n`, `pieces in the box: ${Object.keys(BOX_GRIDS).join(", ")}`);
    else if (seen.has(z.n)) err(`${at}.n`, `a box of ${z.n} is listed twice`);
    seen.add(z.n);
    if (!isNum(z.price, 1, 500)) err(`${at}.price`, "the shop's price for this box, filled, in pounds");
    payRef(z.payLink, `${at}.payLink`);
  });
  if (!isInt(b.cardMax, 20, 300)) err("box.cardMax", "the longest message on the card, 20–300 characters");
  const box = [...items.values()].filter((x) => x.box);
  if (box.length < 3) err("desserts", 'the box needs at least three pieces with "box": true');
  if (b.start !== undefined && (!Array.isArray(b.start) || b.start.some((/** @type {any} */ id) => !items.get(id)?.box))) err("box.start", 'ids of pieces with "box": true, to fill the first box with');
  if (b.note !== undefined && !isStr(b.note)) err("box.note", "text");
}

/**
 * The tasting flight: a fixed number of pieces, put in tasting order with a line on each.
 * @param {any} f @param {Map<string, any>} items @param {Report} err @param {(id: any, at: string) => void} payRef
 */
function checkFlight(f, items, err, payRef) {
  if (!isObj(f)) { err("flight", "{ size, price, payLink?, note? }"); return; }
  onlyKeys(f, ["size", "price", "payLink", "note"], "flight", err);
  if (!isInt(f.size, 3, 8)) err("flight.size", "how many pieces in a flight, 3–8");
  if (!isNum(f.price, 1, 200)) err("flight.price", "pounds");
  payRef(f.payLink, "flight.payLink");
  if (f.note !== undefined && !isStr(f.note)) err("flight.note", "text");
  const ready = [...items.values()].filter((x) => x.box && x.notes && x.tasteOrder);
  if (isInt(f.size, 3, 8) && ready.length < f.size) err("desserts", `the tasting flight needs at least ${f.size} pieces with "box": true, "notes" and "tasteOrder"`);
}

/**
 * The gelato wall: the flavours the shop makes, each with its tub photo; today's state comes from the sheet.
 * @param {any} g @param {Report} err
 */
function checkGelato(g, err) {
  if (!isObj(g)) { err("gelato", "{ prices, flavours, note? }"); return; }
  onlyKeys(g, ["prices", "flavours", "note"], "gelato", err);
  if (!Array.isArray(g.prices) || !g.prices.length || g.prices.length > 4 || g.prices.some((/** @type {any} */ p, /** @type {number} */ i) => !isNum(p, 0.5, 50) || (i > 0 && p <= g.prices[i - 1]))) err("gelato.prices", "the price for 1, 2, 3 (up to 4) scoops, in pounds, each more than the last");
  idList(g.flavours, "gelato.flavours", err, (x, at) => {
    onlyKeys(x, ["id", "name", "note", "photo", "allergens", "diets"], at, err);
    if (!isStr(x.name)) err(`${at}.name`, "required");
    if (x.note !== undefined && !isStr(x.note)) err(`${at}.note`, 'a few words, e.g. "Sicilian" or "Sorbet"');
    photo(x.photo, `${at}.photo`, err);
    marks(x, at, err);
  });
  if (g.note !== undefined && !isStr(g.note)) err("gelato.note", "text");
}

/**
 * The flavour vote: a Google Form the shop already has, its results published from the Form's Sheet.
 * @param {any} v @param {string} mode @param {Report} err
 */
function checkVote(v, mode, err) {
  if (!isObj(v)) { err("vote", "{ question, formUrl, field, source, csvUrl?, closes, candidates }"); return; }
  onlyKeys(v, ["question", "formUrl", "field", "source", "csvUrl", "closes", "candidates"], "vote", err);
  if (!isStr(v.question)) err("vote.question", 'e.g. "Next week\'s gelato"');
  if (!FORM.test(v.formUrl ?? "")) err("vote.formUrl", "the Google Form's link, https://docs.google.com/forms/d/e/…/viewform");
  if (!/^entry\.\d+$/.test(v.field ?? "")) err("vote.field", 'the Form question\'s field, e.g. "entry.1234567" (from the Form\'s "Get pre-filled link")');
  if (!["sheet", "simulated"].includes(v.source)) err("vote.source", '"sheet" (the Form\'s results, published as CSV) or "simulated" (demos only)');
  if (v.source === "simulated" && mode === "client") err("vote.source", 'simulated votes are only allowed on demo sites; use "sheet"');
  if (v.source === "sheet" && !SHEET.test(v.csvUrl ?? "")) err("vote.csvUrl", "the results Sheet, published as CSV (File → Share → Publish to web → CSV)");
  if (!DATE.test(v.closes ?? "")) err("vote.closes", "the last day of voting, YYYY-MM-DD");
  idList(v.candidates, "vote.candidates", err, (c, at) => {
    onlyKeys(c, ["id", "name", "photo"], at, err);
    if (!isStr(c.name)) err(`${at}.name`, "exactly as it is written in the Form");
    photo(c.photo, `${at}.photo`, err);
  });
  if (Array.isArray(v.candidates) && (v.candidates.length < 2 || v.candidates.length > 8)) err("vote.candidates", "2–8 flavours to choose from");
}

/** The hero film: a short muted loop and its first frame as a picture. @param {any} f @param {Report} err */
function checkFilm(f, err) {
  if (!isObj(f)) { err("hero.film", "{ wide, tall, poster, posterTall, credit }"); return; }
  onlyKeys(f, ["wide", "tall", "poster", "posterTall", "credit"], "hero.film", err);
  for (const k of ["wide", "tall"]) if (!/^img\/.+\.mp4$/.test(f[k] ?? "")) err(`hero.film.${k}`, "an H.264 .mp4 in img/, muted, under 2 MB (see the look's README)");
  photo(f.poster, "hero.film.poster", err);
  photo(f.posterTall, "hero.film.posterTall", err);
  if (!isStr(f.credit)) err("hero.film.credit", "who made the film");
}

/** Payment Links (shared): the business's own Stripe links. @param {any} p @param {string} mode @param {Report} err */
export function checkPayLinks(p, mode, err) {
  if (!isObj(p)) { err("payLinks", "{ note, items: [{ id, label, amount, kind, url, for?, holds? }] }"); return; }
  onlyKeys(p, ["note", "items"], "payLinks", err);
  if (!isStr(p.note)) err("payLinks.note", "one line under the buttons, e.g. that payment is taken on Stripe's own page");
  idList(p.items, "payLinks.items", err, (x, at) => {
    onlyKeys(x, ["id", "label", "amount", "kind", "url", "for", "holds"], at, err);
    if (x.holds !== undefined && (x.holds !== "request" || x.kind !== "deposit")) err(`${at}.holds`, '"request" on a deposit: it holds a request the business confirms, never a booking');
    if (!isStr(x.label)) err(`${at}.label`, "what it pays for");
    if (!isNum(x.amount, 0.5, 10000)) err(`${at}.amount`, "pounds, exactly as set on the Stripe link");
    if (!["deposit", "full", "monthly"].includes(x.kind)) err(`${at}.kind`, '"deposit", "full" or "monthly" (a Stripe subscription link)');
    if (!STRIPE.test(x.url ?? "")) err(`${at}.url`, "a Stripe Payment Link, https://buy.stripe.com/…");
    else if (mode === "client" && /\/demo-/.test(x.url)) err(`${at}.url`, "is a demo link; use the business's own Payment Link");
    else if (mode === "demo" && !/\/demo-/.test(x.url)) err(`${at}.url`, 'demo sites use fake links starting https://buy.stripe.com/demo-');
    if (x.for !== undefined && !isStr(x.for)) err(`${at}.for`, "text");
  });
}

/** Favour boxes by quantity. @param {any} f @param {Report} err */
function checkFavours(f, err) {
  if (!isObj(f)) { err("favours", "{ options, minQty, maxQty, leadDays, breaks?, note? }"); return; }
  onlyKeys(f, ["options", "minQty", "maxQty", "leadDays", "breaks", "note"], "favours", err);
  idList(f.options, "favours.options", err, (o, at) => {
    onlyKeys(o, ["id", "name", "price"], at, err);
    if (!isStr(o.name)) err(`${at}.name`, 'what goes in each box, e.g. "Two chocolates"');
    if (!isNum(o.price, 0.5, 100)) err(`${at}.price`, "the shop's price per box, in pounds");
  });
  if (!isInt(f.minQty, 1, 1000)) err("favours.minQty", "the fewest boxes the shop makes, e.g. 20");
  if (!isInt(f.maxQty, 1, 5000) || (isInt(f.minQty, 1, 1000) && f.maxQty < f.minQty)) err("favours.maxQty", "the most boxes in one order, at least minQty");
  if (!isInt(f.leadDays, 1, 120)) err("favours.leadDays", "days' notice the shop needs, e.g. 14");
  if (f.breaks !== undefined) {
    if (!Array.isArray(f.breaks)) err("favours.breaks", "[{ from, less }]: from that many boxes, that many pounds less per box");
    else f.breaks.forEach((/** @type {any} */ b, /** @type {number} */ i) => {
      if (!isObj(b) || !isInt(b.from, 2, 5000) || !isNum(b.less, 0.01, 50)) err(`favours.breaks[${i}]`, "{ from: boxes, less: pounds off each box }");
      else onlyKeys(b, ["from", "less"], `favours.breaks[${i}]`, err);
    });
  }
  if (f.note !== undefined && !isStr(f.note)) err("favours.note", "text");
}

/** The advent box. @param {any} a @param {Map<string, any>} items @param {Report} err @param {(id: any, at: string) => void} payRef */
function checkAdvent(a, items, err, payRef) {
  if (!isObj(a)) { err("advent", "{ year, price, orderBy, collectFrom, windows?, payLink?, note? }"); return; }
  onlyKeys(a, ["year", "price", "orderBy", "collectFrom", "windows", "payLink", "note"], "advent", err);
  if (!isInt(a.year, 2024, 2100)) err("advent.year", "the December it's for, e.g. 2026");
  if (!isNum(a.price, 1, 500)) err("advent.price", "pounds");
  for (const k of ["orderBy", "collectFrom"]) if (!DATE.test(a[k] ?? "")) err(`advent.${k}`, "YYYY-MM-DD");
  const box = [...items.values()].filter((x) => x.box && x.tile);
  if (box.length < 3) err("desserts", 'the advent box needs at least three pieces with "box": true and a "tile"');
  if (a.windows !== undefined && (!Array.isArray(a.windows) || a.windows.length > 24 || a.windows.some((/** @type {any} */ id) => !items.get(id)?.tile))) err("advent.windows", "up to 24 ids of pieces with a tile, day 1 first");
  payRef(a.payLink, "advent.payLink");
  if (a.note !== undefined && !isStr(a.note)) err("advent.note", "text");
}

/** Posting a box. @param {any} p @param {Report} err */
function checkPost(p, err) {
  if (!isObj(p)) { err("post", "{ price, days, cutoff, boxes, note? }"); return; }
  onlyKeys(p, ["price", "days", "cutoff", "boxes", "service", "note"], "post", err);
  if (!isNum(p.price, 0, 50)) err("post.price", "what posting costs, in pounds");
  if (!Array.isArray(p.days) || !p.days.length || p.days.some((/** @type {any} */ d) => !["mon", "tue", "wed", "thu", "fri", "sat"].includes(d))) err("post.days", 'the days the shop posts: "mon"…"sat"');
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(p.cutoff ?? "")) err("post.cutoff", 'orders in by this time go that day, "HH:MM"');
  if (!Array.isArray(p.boxes) || !p.boxes.length || p.boxes.some((/** @type {any} */ b) => !isObj(b) || !isStr(b.name) || !isNum(b.price, 1, 500))) err("post.boxes", '[{ name, price }]: the boxes the shop posts, e.g. { "name": "A box of twelve", "price": 22 }');
  if (p.service !== undefined && !isStr(p.service)) err("post.service", 'the service the shop uses, e.g. "Royal Mail Tracked 24"');
  if (p.note !== undefined && !isStr(p.note)) err("post.note", "text");
}

/** Take-home gelato. @param {any} t @param {any} gelato @param {Report} err */
function checkTubs(t, gelato, err) {
  if (!isObj(t)) { err("tubs", "{ sizes, note? }"); return; }
  onlyKeys(t, ["sizes", "note"], "tubs", err);
  idList(t.sizes, "tubs.sizes", err, (z, at) => {
    onlyKeys(z, ["id", "name", "price", "flavours"], at, err);
    if (!isStr(z.name)) err(`${at}.name`, 'e.g. "500ml tub"');
    if (!isNum(z.price, 1, 100)) err(`${at}.price`, "pounds");
    if (!isInt(z.flavours, 1, 6)) err(`${at}.flavours`, "how many flavours fit, 1–6");
  });
  if (gelato === undefined) err("tubs", "take-home tubs use the gelato flavours: add gelato");
  if (t.note !== undefined && !isStr(t.note)) err("tubs.note", "text");
}

/** A box a month. @param {any} b @param {Report} err @param {(id: any, at: string) => void} payRef */
function checkBoxMonth(b, err, payRef) {
  if (!isObj(b)) { err("boxMonth", "{ price, payLink, what, note? }"); return; }
  onlyKeys(b, ["price", "payLink", "what", "note"], "boxMonth", err);
  if (!isNum(b.price, 1, 500)) err("boxMonth.price", "pounds a month, as set on the Stripe link");
  if (b.payLink === undefined) err("boxMonth.payLink", 'a payLinks item with "kind": "monthly"');
  payRef(b.payLink, "boxMonth.payLink");
  if (!isStr(b.what)) err("boxMonth.what", 'what arrives each month, e.g. "Twelve of the month\'s chocolates, ready to collect from the 1st"');
  if (b.note !== undefined && !isStr(b.note)) err("boxMonth.note", "text");
}
