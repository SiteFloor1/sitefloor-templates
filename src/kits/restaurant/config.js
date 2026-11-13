// @ts-check
/**
 * Validation for the restaurant settings: menu (sittings, sections, dishes with allergens), tonight's sheet,
 * table requests, delivery, takeaway orders, events, private dining, the dining room plan, The Table and
 * The Pass; and the café's counter, Your usual, busyness, Can I work here?, the seat finder and the brunch
 * builder. Unknown keys are refused so a typo can't silently switch something off; simulated data is
 * refused on client sites. Allergen ids and diet marks are the kit's fixed lists (src/core/lib/allergens.js).
 */
import { ALLERGEN_IDS, DIET_IDS } from "../../core/lib/allergens.js";
import { isTime, DAY_KEYS, toMinutes } from "../../core/lib/hours.js";

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
const HTTPS = /^https:\/\/[^\s]+$/;
const SHEET = /^https:\/\/docs\.google\.com\/spreadsheets\/.+output=csv/;
const ROOM_MARKS = ["window", "bar", "kitchen", "door", "terrace", "wall", "pass"];
const DELIVERY_APPS = ["Deliveroo", "Uber Eats", "Just Eat", "Our own delivery"];
/** What a café seat can have (the seat finder's list in src/kits/restaurant/lib/seats.js; a unit test keeps them equal). */
export const SEAT_HAS = ["socket", "window", "sofa", "quiet", "group", "dog", "buggy", "step-free", "outside"];
/** Topics "Can I work here?" answers. */
export const WORK_TOPICS = ["wifi", "sockets", "laptops", "dogs", "kids", "buggies", "step-free", "toilet", "accessible-toilet", "baby-change", "outside"];
const SEAT_SHAPES = ["round", "rect", "sofa", "bench", "stool"];
/** How Your usual draws each drink (src/kits/restaurant/features/your-usual/your-usual.js). */
const POURS = ["espresso", "long-black", "filter", "cortado", "flat-white", "latte", "cappuccino", "mocha", "chai", "hot-chocolate", "matcha"];

/** @param {Record<string, any>} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}

/**
 * A non-empty list of objects with ids unique in the list.
 * @param {any} list @param {string} at @param {Report} err @param {(item: any, at: string) => void} each @returns {Set<string>}
 */
function idList(list, at, err, each) {
  /** @type {Set<string>} */ const ids = new Set();
  if (!Array.isArray(list) || !list.length) { err(at, "a non-empty list"); return ids; }
  list.forEach((item, i) => {
    const p = `${at}[${i}]`;
    if (!isObj(item)) { err(p, "an object"); return; }
    if (!SLUG.test(item.id ?? "")) err(`${p}.id`, "lowercase letters, numbers and dashes");
    else if (ids.has(item.id)) err(`${p}.id`, `"${item.id}" is used twice`);
    else ids.add(item.id);
    each(item, p);
  });
  return ids;
}

/** @param {any} p @param {string} at @param {Report} err */
function photo(p, at, err) {
  if (!isObj(p)) { err(at, "{ src, width, height, alt }"); return; }
  onlyKeys(p, ["src", "width", "height", "alt"], at, err);
  if (!isStr(p.src) || !/^img\/.+\.(webp|jpe?g|png|avif)$/i.test(p.src)) err(`${at}.src`, "a photo in the site's img/ folder, e.g. img/lamb.webp");
  if (!isInt(p.width, 1, 10000) || !isInt(p.height, 1, 10000)) err(at, "width and height in pixels");
  if (!isStr(p.alt)) err(`${at}.alt`, "what the photo shows, for people who can't see it");
}

/** @param {any} site @param {Report} err */
export function checkRestaurant(site, err) {
  if (site.kit !== "restaurant") return;
  const { dishes, drinks } = checkMenuBlock(site.menu, err);
  if (site.menuPage !== undefined) pageCopy(site.menuPage, "menuPage", [], err);
  if (site.menuPdf !== undefined) {
    if (!isObj(site.menuPdf)) err("menuPdf", "{ file? }: the restaurant's own PDF, or {} to make it from the menu");
    else {
      onlyKeys(site.menuPdf, ["file"], "menuPdf", err);
      if (site.menuPdf.file !== undefined && !/^img\/[\w./-]+\.pdf$/.test(site.menuPdf.file)) err("menuPdf.file", "a PDF in the site's img/ folder, e.g. img/menu.pdf");
    }
  }
  checkShowpieces(site, err);
  if (site.tonight !== undefined) checkTonight(site.tonight, site.mode, err);
  if (site.tableRequest !== undefined) checkTableRequest(site.tableRequest, err, site.menu);
  if (site.delivery !== undefined) checkDelivery(site.delivery, err);
  if (site.order !== undefined) checkOrder(site.order, dishes, err, site.mode);
  if (site.events !== undefined) checkEvents(site.events, err);
  if (site.privateDining !== undefined) checkPrivateDining(site.privateDining, err);
  if (site.room !== undefined) checkRoom(site.room, err);
  if (site.table !== undefined) checkTable(site.table, err);
  if (site.pass !== undefined) checkPass(site.pass, dishes, drinks, err);
  if (site.features?.includes("pairings") && ![...dishes.values()].some((d) => d.pairs?.length)) err("menu", 'pairings is on but no dish has "pairs"');
  checkCafe(site, { dishes, drinks, sections: sectionsOf(site.menu) }, err);
}

/** The menu's sections by id. @param {any} menu @returns {Map<string, any>} */
const sectionsOf = (menu) => new Map((Array.isArray(menu?.sections) ? menu.sections : []).map((/** @type {any} */ sec) => [sec.id, sec]));

/** The Table's settings. @param {any} t @param {Report} err */
function checkTable(t, err) {
  if (!isObj(t)) { err("table", "{ maxGuests, note?, start? }"); return; }
  onlyKeys(t, ["maxGuests", "note", "start"], "table", err);
  if (!isInt(t.maxGuests, 2, 40)) err("table.maxGuests", "the largest group the planner takes, 2–40");
  if (t.note !== undefined && !isStr(t.note)) err("table.note", "text");
  if (t.start === undefined) return;
  if (!Array.isArray(t.start) || t.start.length > (t.maxGuests ?? 40)) { err("table.start", "the guests the planner opens with: [{ diets?, avoid? }]"); return; }
  t.start.forEach((/** @type {any} */ g, /** @type {number} */ i) => {
    const at = `table.start[${i}]`;
    if (!isObj(g)) { err(at, "{ diets?, avoid? }"); return; }
    onlyKeys(g, ["diets", "avoid"], at, err);
    if (g.diets !== undefined && (!Array.isArray(g.diets) || g.diets.some((/** @type {any} */ d) => !DIET_IDS.includes(d)))) err(`${at}.diets`, DIET_IDS.join(", "));
    if (g.avoid !== undefined && (!Array.isArray(g.avoid) || g.avoid.some((/** @type {any} */ x) => !ALLERGEN_IDS.includes(x)))) err(`${at}.avoid`, ALLERGEN_IDS.join(", "));
  });
}

/** The Pass: dishes with a photo, in order. @param {any} p @param {Map<string, any>} dishes @param {Map<string, any>} drinks @param {Report} err */
function checkPass(p, dishes, drinks, err) {
  if (!isObj(p) || !Array.isArray(p.dishes) || !p.dishes.length) { err("pass", '{ "dishes": [dish ids with a "pass" photo, in order] }'); return; }
  onlyKeys(p, ["dishes", "note"], "pass", err);
  if (p.note !== undefined && !isStr(p.note)) err("pass.note", "text under each plate, e.g. where the photos come from");
  p.dishes.forEach((/** @type {any} */ id, /** @type {number} */ i) => {
    const d = dishes.get(id) ?? drinks.get(id);
    if (!d) err(`pass.dishes[${i}]`, `"${id}" isn't a dish on the menu`);
    else if (!d.pass) err(`pass.dishes[${i}]`, `"${id}" has no "pass" photo`);
  });
}

/**
 * @param {any} m @param {Report} err
 * @returns {{ dishes: Map<string, any>, drinks: Map<string, any> }}
 */
function checkMenuBlock(m, err) {
  /** @type {Map<string, any>} */ const dishes = new Map();
  /** @type {Map<string, any>} */ const drinks = new Map();
  if (!isObj(m)) { err("menu", "required: { sittings, statement, chartChecked, sections }"); return { dishes, drinks }; }
  onlyKeys(m, ["sittings", "statement", "chartChecked", "sections"], "menu", err);
  const sittings = idList(m.sittings, "menu.sittings", err, (s, at) => {
    onlyKeys(s, ["id", "name", "days", "from", "to", "lastOrders", "mood"], at, err);
    if (!isStr(s.name)) err(`${at}.name`, 'what the restaurant calls it, e.g. "Dinner"');
    if (!Array.isArray(s.days) || !s.days.length || s.days.some((/** @type {any} */ d) => !DAY_KEYS.includes(d))) err(`${at}.days`, `days it's served: ${DAY_KEYS.join(", ")}`);
    if (!isTime(s.from) || !isTime(s.to) || toMinutes(s.to) <= toMinutes(s.from)) err(at, '"from" and "to" as "HH:MM", ending after it starts on the same day');
    if (s.lastOrders !== undefined && (!isTime(s.lastOrders) || (isTime(s.from) && isTime(s.to) && (toMinutes(s.lastOrders) <= toMinutes(s.from) || toMinutes(s.lastOrders) > toMinutes(s.to))))) err(`${at}.lastOrders`, '"HH:MM", between "from" and "to"');
    if (!["day", "evening"].includes(s.mood)) err(`${at}.mood`, '"day" or "evening": which colours the Carte look uses while it\'s served');
  });
  if (!isStr(m.statement)) err("menu.statement", "the restaurant's own allergen statement, e.g. what the kitchen handles and to tell staff about allergies");
  if (!DATE.test(m.chartChecked ?? "")) err("menu.chartChecked", "when the restaurant last checked its allergen chart, YYYY-MM-DD");
  /** @type {Map<string, string[]>} */ const pairsOf = new Map();
  idList(m.sections, "menu.sections", err, (sec, at) => {
    onlyKeys(sec, ["id", "name", "note", "sittings", "drinks", "dishes"], at, err);
    if (!isStr(sec.name)) err(`${at}.name`, 'e.g. "Off the coals"');
    if (!Array.isArray(sec.sittings) || !sec.sittings.length || sec.sittings.some((/** @type {any} */ s) => !sittings.has(s))) err(`${at}.sittings`, `which sittings serve it: ${[...sittings].join(", ")}`);
    if (sec.drinks !== undefined && typeof sec.drinks !== "boolean") err(`${at}.drinks`, "true for a drinks list");
    idList(sec.dishes, `${at}.dishes`, err, (d, dat) => {
      if (dishes.has(d.id) || drinks.has(d.id)) err(`${dat}.id`, `"${d.id}" is used in another section`);
      (sec.drinks ? drinks : dishes).set(d.id, d);
      if (d.pairs !== undefined && Array.isArray(d.pairs) && d.pairs.length) pairsOf.set(dat, d.pairs);
      checkDish(d, dat, err);
    });
  });
  for (const [at, ids] of pairsOf) ids.forEach((id, i) => { if (!drinks.has(id)) err(`${at}.pairs[${i}]`, `"${id}" isn't a drink in a drinks section`); });
  return { dishes, drinks };
}

/**
 * A page's heading copy plus its own settings.
 * @param {any} o @param {string} at @param {string[]} keys other allowed keys @param {Report} err
 */
function pageCopy(o, at, keys, err) {
  if (!isObj(o)) { err(at, "{ kicker, title, intro? }"); return; }
  onlyKeys(o, ["kicker", "title", "intro", ...keys], at, err);
  if (!isStr(o.kicker)) err(`${at}.kicker`, "the small line above the page title");
  if (!isStr(o.title)) err(`${at}.title`, "the page title");
  if (o.intro !== undefined && !isStr(o.intro)) err(`${at}.intro`, "text");
}

/** One dish or drink. @param {any} d @param {string} dat @param {Report} err */
function checkDish(d, dat, err) {
  onlyKeys(d, ["id", "name", "desc", "price", "diets", "allergens", "spice", "share", "takeaway", "pairs", "pass", "photo", "kids", "leadDays"], dat, err);
  if (d.leadDays !== undefined && !isInt(d.leadDays, 0, 21)) err(`${dat}.leadDays`, "how many days' notice the kitchen needs to make it, 0–21 (cakes to order)");
  if (!isStr(d.name)) err(`${dat}.name`, "required");
  if (!isNum(d.price, 0, 10000)) err(`${dat}.price`, 'pounds as a number, e.g. 14 or 6.5 (not "£14")');
  checkMarks(d, dat, err);
  if (d.spice !== undefined && !isInt(d.spice, 0, 3)) err(`${dat}.spice`, "0 (none) to 3 (hot)");
  for (const k of ["share", "takeaway", "kids"]) if (d[k] !== undefined && typeof d[k] !== "boolean") err(`${dat}.${k}`, "true or false");
  if (d.desc !== undefined && !isStr(d.desc)) err(`${dat}.desc`, "text");
  if (d.pairs !== undefined && (!Array.isArray(d.pairs) || !d.pairs.length)) err(`${dat}.pairs`, "drink ids from a drinks section");
  if (d.pass !== undefined) checkDishPass(d.pass, `${dat}.pass`, err);
  if (d.photo !== undefined) photo(d.photo, `${dat}.photo`, err);
}

/** A dish's allergens and diet marks. @param {any} d @param {string} dat @param {Report} err */
function checkMarks(d, dat, err) {
  if (!Array.isArray(d.allergens) || d.allergens.some((/** @type {any} */ a) => !ALLERGEN_IDS.includes(a))) err(`${dat}.allergens`, `from the restaurant's allergen chart; [] if none. One of: ${ALLERGEN_IDS.join(", ")}`);
  else if (new Set(d.allergens).size !== d.allergens.length) err(`${dat}.allergens`, "an allergen is listed twice");
  if (d.diets !== undefined && (!Array.isArray(d.diets) || d.diets.some((/** @type {any} */ x) => !DIET_IDS.includes(x)))) err(`${dat}.diets`, `marks from the restaurant: ${DIET_IDS.join(", ")}`);
  const animal = ["milk", "eggs", "fish", "crustaceans", "molluscs"];
  if (d.diets?.includes("vegan") && Array.isArray(d.allergens) && d.allergens.some((/** @type {string} */ a) => animal.includes(a))) err(`${dat}.diets`, "marked vegan but lists an animal allergen; check the allergen chart");
}

/** A dish's photo for The Pass, with its notes. @param {any} p @param {string} at @param {Report} err */
function checkDishPass(p, at, err) {
  if (!isObj(p)) { err(at, "{ src, thumb?, width, height, alt, notes }"); return; }
  onlyKeys(p, ["src", "thumb", "width", "height", "alt", "notes"], at, err);
  photo({ src: p.src, width: p.width, height: p.height, alt: p.alt }, at, err);
  if (p.thumb !== undefined && !/^img\/.+\.(webp|jpe?g|png|avif)$/i.test(p.thumb)) err(`${at}.thumb`, "a small square copy of the photo for the rail, e.g. img/lamb-s.webp");
  if (!Array.isArray(p.notes) || !p.notes.length || p.notes.length > 6) { err(`${at}.notes`, "1–6 notes on the photo: { x, y, text } with x and y from 0 to 1"); return; }
  p.notes.forEach((/** @type {any} */ n, /** @type {number} */ i) => {
    if (!isObj(n) || !isNum(n.x, 0, 1) || !isNum(n.y, 0, 1) || !isStr(n.text)) err(`${at}.notes[${i}]`, "{ x, y, text } with x and y from 0 to 1 across and down the photo");
    else onlyKeys(n, ["x", "y", "text"], `${at}.notes[${i}]`, err);
  });
}

/** The Menu Book: its cover, and the restaurant's own pages if it has a designed menu. @param {any} b @param {Report} err */
function checkMenuBook(b, err) {
  if (!isObj(b)) { err("menuBook", "{ cover?, pages? }"); return; }
  onlyKeys(b, ["cover", "pages"], "menuBook", err);
  if (b.cover !== undefined) {
    if (!isObj(b.cover)) err("menuBook.cover", "{ title?, subtitle? }");
    else {
      onlyKeys(b.cover, ["title", "subtitle"], "menuBook.cover", err);
      for (const k of ["title", "subtitle"]) if (b.cover[k] !== undefined && !isStr(b.cover[k])) err(`menuBook.cover.${k}`, "text");
    }
  }
  if (b.pages !== undefined) {
    if (!Array.isArray(b.pages) || b.pages.length < 2 || b.pages.length > 60) err("menuBook.pages", "2–60 pictures of the restaurant's own menu pages, in order");
    else b.pages.forEach((/** @type {any} */ p, /** @type {number} */ i) => photo(p, `menuBook.pages[${i}]`, err));
  }
}

/** The Menu Book and the hero film. @param {any} site @param {Report} err */
function checkShowpieces(site, err) {
  if (site.menuBook !== undefined) checkMenuBook(site.menuBook, err);
  if (site.heroFilm !== undefined) checkHeroFilm(site.heroFilm, err);
}

/** The hero film: the restaurant's own photos, or one short loop of its own footage. @param {any} f @param {Report} err */
function checkHeroFilm(f, err) {
  if (!isObj(f)) { err("heroFilm", "{ photos, seconds? } or { video }"); return; }
  onlyKeys(f, ["photos", "seconds", "video"], "heroFilm", err);
  if ((f.video === undefined) === (f.photos === undefined)) { err("heroFilm", "photos or video, not both"); return; }
  if (f.video !== undefined) { checkFilmVideo(f.video, err); return; }
  if (f.seconds !== undefined && !isInt(f.seconds, 4, 12)) err("heroFilm.seconds", "seconds each photo shows, 4–12");
  if (!Array.isArray(f.photos) || f.photos.length < 1 || f.photos.length > 6) { err("heroFilm.photos", "1–6 of the restaurant's own landscape photos"); return; }
  f.photos.forEach((/** @type {any} */ p, /** @type {number} */ i) => {
    const at = `heroFilm.photos[${i}]`;
    if (!isObj(p)) { err(at, "{ src, srcMobile?, width, height, alt }"); return; }
    const { srcMobile, ...rest } = p;
    photo(rest, at, err);
    if (srcMobile !== undefined && !/^img\/[\w./-]+\.(webp|jpe?g|png|avif)$/.test(srcMobile)) err(`${at}.srcMobile`, "a portrait crop for phones in img/, e.g. img/hero-1-m.webp");
  });
}

/** @param {any} v @param {Report} err */
function checkFilmVideo(v, err) {
  if (!isObj(v)) { err("heroFilm.video", "{ src, poster, width, height }"); return; }
  onlyKeys(v, ["src", "poster", "width", "height"], "heroFilm.video", err);
  if (!isStr(v.src) || !/^img\/[\w./-]+\.mp4$/.test(v.src)) err("heroFilm.video.src", "a short silent MP4 loop in img/, e.g. img/hero-grill.mp4");
  if (!isStr(v.poster) || !/^img\/[\w./-]+\.(webp|jpe?g)$/.test(v.poster)) err("heroFilm.video.poster", "the loop's first frame in img/, e.g. img/hero-grill.webp");
  if (!isInt(v.width, 1, 4000) || !isInt(v.height, 1, 4000)) err("heroFilm.video", "width and height in pixels");
}

/** @param {any} t @param {string} mode @param {Report} err */
function checkTonight(t, mode, err) {
  if (!isObj(t)) { err("tonight", "{ source, csvUrl, staleAfterMinutes? }"); return; }
  onlyKeys(t, ["source", "csvUrl", "staleAfterMinutes", "demo"], "tonight", err);
  if (t.demo !== undefined) {
    if (t.source !== "simulated") err("tonight.demo", "rows for the simulated sheet; only with \"source\": \"simulated\" on a demo");
    else if (!Array.isArray(t.demo) || !t.demo.length) err("tonight.demo", "a list of { kind, name, price?, note?, at? or ago? }");
    else t.demo.forEach((/** @type {any} */ r, /** @type {number} */ i) => {
      const at = `tonight.demo[${i}]`;
      if (!isObj(r)) { err(at, "{ kind, name, price?, note?, at? or ago? }"); return; }
      onlyKeys(r, ["kind", "name", "price", "note", "at", "ago"], at, err);
      if (!["special", "soldout", "tables", "fresh", "busy", "board"].includes(r.kind)) err(`${at}.kind`, "special, soldout, tables, fresh, busy or board");
      if (!isStr(r.name)) err(`${at}.name`, "required");
      if (r.price !== undefined && !isNum(r.price, 0, 1000)) err(`${at}.price`, "pounds");
      if (r.note !== undefined && typeof r.note !== "string") err(`${at}.note`, "text");
      if ((r.at === undefined) === (r.ago === undefined)) err(at, '"at" ("HH:MM" today) or "ago" (minutes before now), not both');
      else if (r.at !== undefined && !isTime(r.at)) err(`${at}.at`, '"HH:MM"');
      else if (r.ago !== undefined && !isInt(r.ago, 0, 10000)) err(`${at}.ago`, "whole minutes");
    });
  }
  if (!["sheet", "simulated"].includes(t.source)) err("tonight.source", '"sheet" (the restaurant\'s Google Sheet) or "simulated" (demos only)');
  if (t.source === "simulated" && mode === "client") err("tonight.source", 'simulated data is only allowed on demo sites; use "sheet"');
  if (t.source === "sheet" && !SHEET.test(t.csvUrl ?? "")) err("tonight.csvUrl", "a published Google Sheet CSV link (File → Share → Publish to web → CSV)");
  if (t.staleAfterMinutes !== undefined && !isInt(t.staleAfterMinutes, 10, 180)) err("tonight.staleAfterMinutes", "10–180: after this, the walk-in tables line hides");
}

/** @param {any} t @param {Report} err @param {any} menu */
function checkTableRequest(t, err, menu) {
  if (!isObj(t)) { err("tableRequest", "{ message, maxGuests, walkIns?, largeGroups?, daysAhead?, sittings? }"); return; }
  onlyKeys(t, ["message", "maxGuests", "walkIns", "largeGroups", "daysAhead", "sittings"], "tableRequest", err);
  if (t.sittings !== undefined) {
    const ids = (Array.isArray(menu?.sittings) ? menu.sittings : []).map((/** @type {any} */ x) => x.id);
    if (!Array.isArray(t.sittings) || !t.sittings.length || t.sittings.some((/** @type {any} */ x) => !ids.includes(x))) err("tableRequest.sittings", `the sittings people can ask to book, e.g. only ["brunch"]; leave out for all. Sittings: ${ids.join(", ")}`);
  }
  if (!isStr(t.message)) err("tableRequest.message", 'the WhatsApp opening line, e.g. "Hi, can I book a table?"');
  if (!isInt(t.maxGuests, 2, 40)) err("tableRequest.maxGuests", "the largest table the form offers, 2–40");
  if (t.daysAhead !== undefined && !isInt(t.daysAhead, 1, 120)) err("tableRequest.daysAhead", "how far ahead people can ask, 1–120 days");
  for (const k of ["walkIns", "largeGroups"]) if (t[k] !== undefined && !isStr(t[k])) err(`tableRequest.${k}`, "text");
}

/** @param {any} d @param {Report} err */
function checkDelivery(d, err) {
  if (!isObj(d)) { err("delivery", "{ apps: [{ name, url }], collection? }"); return; }
  onlyKeys(d, ["apps", "collection"], "delivery", err);
  if (!Array.isArray(d.apps) || !d.apps.length) err("delivery.apps", "a non-empty list of { name, url }");
  else d.apps.forEach((/** @type {any} */ a, /** @type {number} */ i) => {
    if (!isObj(a)) { err(`delivery.apps[${i}]`, "{ name, url }"); return; }
    onlyKeys(a, ["name", "url"], `delivery.apps[${i}]`, err);
    if (!DELIVERY_APPS.includes(a.name)) err(`delivery.apps[${i}].name`, `one of ${DELIVERY_APPS.join(", ")}`);
    if (!HTTPS.test(a.url ?? "")) err(`delivery.apps[${i}].url`, "the restaurant's own page on that app, https://…");
  });
  if (d.collection !== undefined && !isStr(d.collection)) err("delivery.collection", "text");
}

/** @param {any} o @param {Map<string, any>} dishes @param {Report} err @param {string} mode */
function checkOrder(o, dishes, err, mode) {
  if (!isObj(o)) { err("order", "{ kicker, title, intro?, message, readyMinutes, daysAhead?, deposit?, note? }"); return; }
  pageCopy(o, "order", ["message", "readyMinutes", "daysAhead", "deposit", "note"], err);
  if (o.daysAhead !== undefined && !isInt(o.daysAhead, 1, 60)) err("order.daysAhead", "how many days ahead people can choose to collect, 1–60 (for cakes to order)");
  if (o.deposit !== undefined) {
    if (!isObj(o.deposit)) err("order.deposit", "{ from, amount, link }");
    else {
      onlyKeys(o.deposit, ["from", "amount", "link"], "order.deposit", err);
      if (!isNum(o.deposit.from, 1, 10000)) err("order.deposit.from", "the order total (pounds) from which a deposit is asked");
      if (!isNum(o.deposit.amount, 1, 1000)) err("order.deposit.amount", "the deposit in pounds; the Stripe link must be set to this amount");
      stripeLink(o.deposit.link, "order.deposit.link", mode, err);
    }
  }
  if (!isStr(o.message)) err("order.message", 'the WhatsApp opening line, e.g. "Hi, I\'d like to order for collection"');
  if (!isInt(o.readyMinutes, 10, 120)) err("order.readyMinutes", "the soonest collection, in minutes from now, 10–120");
  if (o.note !== undefined && !isStr(o.note)) err("order.note", "text");
  if (![...dishes.values()].some((d) => d.takeaway)) err("order", 'no dish on the menu has "takeaway": true');
}

/** @param {any} e @param {Report} err */
function checkEvents(e, err) {
  if (!isObj(e)) { err("events", "{ kicker, title, intro?, items: [...] }"); return; }
  pageCopy(e, "events", ["items"], err);
  idList(e.items, "events.items", err, (x, at) => {
    onlyKeys(x, ["id", "title", "date", "start", "end", "price", "text", "photo", "book"], at, err);
    if (!isStr(x.title)) err(`${at}.title`, "required");
    if (!DATE.test(x.date ?? "") || Number.isNaN(Date.parse(`${x.date}T12:00:00Z`))) err(`${at}.date`, "YYYY-MM-DD");
    if (!isTime(x.start)) err(`${at}.start`, '"HH:MM"');
    if (x.end !== undefined && !isTime(x.end)) err(`${at}.end`, '"HH:MM"');
    if (x.price !== undefined && !isNum(x.price, 0, 10000)) err(`${at}.price`, "pounds per person as a number; leave out if free");
    if (!isStr(x.text)) err(`${at}.text`, "what it is, in a sentence or two");
    if (x.book !== undefined && typeof x.book !== "boolean") err(`${at}.book`, "true to show a Book button");
    if (x.photo !== undefined) photo(x.photo, `${at}.photo`, err);
  });
}

/** @param {any} p @param {Report} err */
function checkPrivateDining(p, err) {
  if (!isObj(p)) { err("privateDining", "{ kicker, title, intro, rooms, menus?, message }"); return; }
  pageCopy(p, "privateDining", ["rooms", "menus", "message", "note"], err);
  if (!isStr(p.intro)) err("privateDining.intro", "required");
  if (!isStr(p.message)) err("privateDining.message", 'the WhatsApp opening line, e.g. "Hi, we\'d like to book a private room"');
  idList(p.rooms, "privateDining.rooms", err, (r, at) => {
    onlyKeys(r, ["id", "name", "seats", "minSpend", "text", "photo"], at, err);
    if (!isStr(r.name)) err(`${at}.name`, "required");
    if (!Array.isArray(r.seats) || r.seats.length !== 2 || !isInt(r.seats[0], 1, 500) || !isInt(r.seats[1], 1, 500) || r.seats[0] > r.seats[1]) err(`${at}.seats`, "[fewest, most] guests, e.g. [10, 24]");
    if (r.minSpend !== undefined && !isNum(r.minSpend, 0, 100000)) err(`${at}.minSpend`, "pounds as a number");
    if (!isStr(r.text)) err(`${at}.text`, "required");
    if (r.photo !== undefined) photo(r.photo, `${at}.photo`, err);
  });
  if (p.menus !== undefined) idList(p.menus, "privateDining.menus", err, (m, at) => {
    onlyKeys(m, ["id", "name", "price", "courses"], at, err);
    if (!isStr(m.name)) err(`${at}.name`, "required");
    if (!isNum(m.price, 0, 10000)) err(`${at}.price`, "pounds per person as a number");
    if (!Array.isArray(m.courses) || !m.courses.length || m.courses.some((/** @type {any} */ c) => !isStr(c))) err(`${at}.courses`, "a list of lines");
  });
  if (p.note !== undefined && !isStr(p.note)) err("privateDining.note", "text");
}

/** @param {any} r @param {Report} err */
function checkRoom(r, err) {
  if (!isObj(r)) { err("room", "{ width, height, areas, tables, marks }"); return; }
  onlyKeys(r, ["width", "height", "areas", "tables", "marks", "note"], "room", err);
  if (!isInt(r.width, 20, 400) || !isInt(r.height, 20, 400)) err("room", "width and height of the plan, in the plan's own units (e.g. 100 × 60)");
  const W = r.width, H = r.height;
  /** @param {any} o @param {string} at */
  const inside = (o, at) => {
    if (![o.x, o.y, o.w, o.h].every((v) => isNum(v, 0, 400)) || o.w <= 0 || o.h <= 0) err(at, "x, y, w, h in the plan's units");
    else if (o.x + o.w > W || o.y + o.h > H) err(at, "reaches outside the room");
  };
  const areas = idList(r.areas, "room.areas", err, (a, at) => { onlyKeys(a, ["id", "name"], at, err); if (!isStr(a.name)) err(`${at}.name`, 'e.g. "By the window"'); });
  /** @type {{ x: number, y: number, w: number, h: number, at: string }[]} */ const boxes = [];
  idList(r.tables, "room.tables", err, (t, at) => {
    onlyKeys(t, ["id", "label", "x", "y", "w", "h", "shape", "seats", "area"], at, err);
    if (!isStr(t.label)) err(`${at}.label`, 'what staff call it, e.g. "Booth 3"');
    if (!["round", "rect", "booth"].includes(t.shape)) err(`${at}.shape`, '"round", "rect" or "booth"');
    if (!isInt(t.seats, 1, 30)) err(`${at}.seats`, "1–30");
    if (!areas.has(t.area)) err(`${at}.area`, `one of ${[...areas].join(", ")}`);
    inside(t, at);
    for (const b of boxes) if (t.x < b.x + b.w && b.x < t.x + t.w && t.y < b.y + b.h && b.y < t.y + t.h) err(at, `overlaps ${b.at}`);
    boxes.push({ x: t.x, y: t.y, w: t.w, h: t.h, at });
  });
  if (r.marks !== undefined) {
    if (!Array.isArray(r.marks)) err("room.marks", "a list");
    else r.marks.forEach((/** @type {any} */ m, /** @type {number} */ i) => {
      const at = `room.marks[${i}]`;
      if (!isObj(m)) { err(at, "an object"); return; }
      onlyKeys(m, ["kind", "x", "y", "w", "h", "label"], at, err);
      if (!ROOM_MARKS.includes(m.kind)) err(`${at}.kind`, ROOM_MARKS.join(", "));
      if (m.label !== undefined && !isStr(m.label)) err(`${at}.label`, "text");
      inside(m, at);
    });
  }
  if (r.note !== undefined && !isStr(r.note)) err("room.note", "text");
}

/* ---------------------------------------------------------------------------------------------------------
   Café settings (the Counter look's demo uses them all; every one is optional unless its feature is on).
   --------------------------------------------------------------------------------------------------------- */

/**
 * @param {any} site
 * @param {{ dishes: Map<string, any>, drinks: Map<string, any>, sections: Map<string, any> }} menu
 * @param {Report} err
 */
function checkCafe(site, menu, err) {
  const on = (/** @type {string} */ id) => Boolean(site.features?.includes(id));
  if (site.counter !== undefined) checkCounter(site.counter, menu, on("the-case"), err);
  if (on("the-case") && site.counter === undefined) err("counter", 'required by feature "the-case": { "sections": [the menu sections in the glass case] }');
  if (site.usual !== undefined) checkUsual(site.usual, err);
  if (site.busy !== undefined) checkBusy(site.busy, err);
  if (site.workHere !== undefined) checkWorkHere(site.workHere, err);
  if (site.seats !== undefined) checkSeats(site.seats, err);
  if (site.brunch !== undefined) checkBrunch(site.brunch, menu, err);
  checkTeaRoom(site, menu, err);
}

/** The grand café's settings: the tea room, music, dress code, the window, the salon plan and their pages. @param {any} site @param {{ dishes: Map<string, any>, drinks: Map<string, any>, sections: Map<string, any> }} menu @param {Report} err */
function checkTeaRoom(site, menu, err) {
  if (site.tea !== undefined) checkTea(site.tea, site.menu, menu, err);
  if (site.music !== undefined) checkMusic(site.music, err);
  if (site.dressCode !== undefined) checkDressCode(site.dressCode, err);
  if (site.stand !== undefined) checkStand(site.stand, site.tea, site.menu, err);
  if (site.features?.includes("your-table") && site.stand === undefined) err("stand", 'required by "your-table": { photos, maxGuests }');
  if (site.giveSitting !== undefined) checkGive(site.giveSitting, site.mode, err);
  if (site.hero?.room !== undefined) checkHeroRoom(site.hero.room, err);
  if (site.window !== undefined) checkWindow(site.window, menu, site.mode, err);
  if (site.salonPlan !== undefined) checkSalonPlan(site.salonPlan, err);
  if (site.features?.includes("seasonal-tea") && !site.tea?.seasons?.length) err("tea.seasons", 'required by "seasonal-tea": at least one seasonal stand');
  if (site.teaPage !== undefined) pageCopy(site.teaPage, "teaPage", [], err);
  if (site.giftsPage !== undefined) pageCopy(site.giftsPage, "giftsPage", [], err);
}

/** @param {any} c @param {{ dishes: Map<string, any>, drinks: Map<string, any>, sections: Map<string, any> }} menu @param {boolean} needPhotos @param {Report} err */
function checkCounter(c, menu, needPhotos, err) {
  if (!isObj(c)) { err("counter", "{ sections, freshForMinutes?, photo?, spots?, board?, hold?, note? }"); return; }
  onlyKeys(c, ["sections", "freshForMinutes", "photo", "spots", "board", "hold", "note"], "counter", err);
  /** @type {Set<string>} */ const bakes = new Set();
  if (!Array.isArray(c.sections) || !c.sections.length) err("counter.sections", "the ids of the menu sections in the glass case, e.g. [\"bakes\"]");
  else c.sections.forEach((/** @type {any} */ id, /** @type {number} */ i) => {
    const sec = menu.sections.get(id);
    if (!sec) { err(`counter.sections[${i}]`, `"${id}" isn't a menu section`); return; }
    if (sec.drinks) err(`counter.sections[${i}]`, `"${id}" is a drinks list; the counter is for bakes`);
    for (const d of sec.dishes ?? []) {
      bakes.add(d.id);
      if (needPhotos && !d.photo) err(`menu`, `"${d.id}" is in the glass case (the-case) but has no "photo"`);
    }
  });
  if (c.freshForMinutes !== undefined && !isInt(c.freshForMinutes, 10, 240)) err("counter.freshForMinutes", 'how long a tray counts as "fresh out", 10–240 minutes');
  if (c.photo !== undefined) {
    if (!isObj(c.photo)) err("counter.photo", "{ src, srcSmall?, srcSmallWidth?, width, height, alt }");
    else {
      const { srcSmall, srcSmallWidth, ...rest } = c.photo;
      photo(rest, "counter.photo", err);
      if (srcSmall !== undefined && !/^img\/[\w./-]+\.(webp|jpe?g|png|avif)$/.test(srcSmall)) err("counter.photo.srcSmall", "a smaller copy for phones in img/, e.g. img/counter-s.webp");
      if ((srcSmall === undefined) !== (srcSmallWidth === undefined) || (srcSmallWidth !== undefined && !isInt(srcSmallWidth, 100, 4000))) err("counter.photo", "srcSmall and srcSmallWidth (its width in pixels) go together");
    }
  }
  if (c.spots !== undefined) checkSpots(c, bakes, err);
  if (c.board !== undefined && !menu.sections.get(c.board)?.drinks) err("counter.board", "the id of a drinks section to show as the coffee board");
  for (const k of ["hold", "note"]) if (c[k] !== undefined && !isStr(c[k])) err(`counter.${k}`, "text");
}


/** Bakes marked on the counter photo. @param {any} c @param {Set<string>} bakes @param {Report} err */
function checkSpots(c, bakes, err) {
  if (c.photo === undefined) err("counter.spots", "spots mark bakes on the counter photo; add counter.photo");
  if (!Array.isArray(c.spots) || c.spots.length > 8) err("counter.spots", "up to 8 { dish, x, y }, with x and y from 0 to 1 across and down the photo");
  else c.spots.forEach((/** @type {any} */ sp, /** @type {number} */ i) => {
    const at = `counter.spots[${i}]`;
    if (!isObj(sp)) { err(at, "{ dish, x, y }"); return; }
    onlyKeys(sp, ["dish", "x", "y"], at, err);
    if (!bakes.has(sp.dish)) err(`${at}.dish`, `"${sp.dish}" isn't a bake in the counter sections`);
    if (!isNum(sp.x, 0, 1) || !isNum(sp.y, 0, 1)) err(at, "x and y from 0 to 1 across and down the photo");
  });
}

/** @param {any} u @param {Report} err */
function checkUsual(u, err) {
  if (!isObj(u)) { err("usual", "{ message, prepMinutes, sizes, drinks, milks, defaultMilk, extraShot, maxShots, syrups?, decaf?, ownCup?, note? }"); return; }
  onlyKeys(u, ["message", "prepMinutes", "sizes", "drinks", "milks", "defaultMilk", "extraShot", "maxShots", "syrups", "decaf", "ownCup", "note"], "usual", err);
  if (!isStr(u.message)) err("usual.message", 'the WhatsApp opening line, e.g. "Hi, I\'d like to order ahead for collection"');
  if (!isInt(u.prepMinutes, 2, 30)) err("usual.prepMinutes", "how long a drink takes you to make at a normal pace, 2–30 minutes (the ready time is now plus this)");
  const sizes = idList(u.sizes, "usual.sizes", err, (s, at) => {
    onlyKeys(s, ["id", "name", "ml"], at, err);
    if (!isStr(s.name)) err(`${at}.name`, 'e.g. "Regular"');
    if (!isInt(s.ml, 30, 1000)) err(`${at}.ml`, "the cup size in ml, e.g. 240");
  });
  idList(u.drinks, "usual.drinks", err, (d, at) => {
    onlyKeys(d, ["id", "name", "prices", "milk", "allergens", "desc", "diets", "pour"], at, err);
    if (d.pour !== undefined && !POURS.includes(d.pour)) err(`${at}.pour`, `how it's drawn in the glass: ${POURS.join(", ")}`);
    if (!isStr(d.name)) err(`${at}.name`, "required");
    if (!isObj(d.prices) || !Object.keys(d.prices).length) err(`${at}.prices`, '{ size id: pounds }, e.g. { "small": 3.2, "regular": 3.6 }');
    else for (const [k, v] of Object.entries(d.prices)) {
      if (!sizes.has(k)) err(`${at}.prices.${k}`, `not a size; sizes: ${[...sizes].join(", ")}`);
      else if (!isNum(v, 0, 100)) err(`${at}.prices.${k}`, "pounds as a number, e.g. 3.6");
    }
    if (d.milk !== undefined && typeof d.milk !== "boolean") err(`${at}.milk`, "true if the drink is made with milk (the milk choice shows)");
    if (d.desc !== undefined && !isStr(d.desc)) err(`${at}.desc`, "text");
    checkMarks(d, at, err);
  });
  const milks = idList(u.milks, "usual.milks", err, (m, at) => {
    onlyKeys(m, ["id", "name", "price", "allergens", "note", "diets", "shade"], at, err);
    if (m.shade !== undefined && !["white", "cream", "oat", "nut"].includes(m.shade)) err(`${at}.shade`, '"white", "cream", "oat" or "nut": its colour in the glass');
    if (!isStr(m.name)) err(`${at}.name`, 'e.g. "Oat milk"');
    if (!isNum(m.price, 0, 10)) err(`${at}.price`, "the extra it costs in pounds, 0 if none");
    if (m.note !== undefined && !isStr(m.note)) err(`${at}.note`, "text, e.g. which brand, from its label");
    checkMarks(m, at, err);
  });
  if (!milks.has(u.defaultMilk)) err("usual.defaultMilk", `the milk a drink comes with: ${[...milks].join(", ")}`);
  if (!isNum(u.extraShot, 0, 10)) err("usual.extraShot", "the price of an extra shot in pounds");
  if (!isInt(u.maxShots, 0, 4)) err("usual.maxShots", "the most extra shots, 0–4");
  if (u.syrups !== undefined) idList(u.syrups, "usual.syrups", err, (s, at) => {
    onlyKeys(s, ["id", "name", "price", "allergens"], at, err);
    if (!isStr(s.name)) err(`${at}.name`, "required");
    if (!isNum(s.price, 0, 10)) err(`${at}.price`, "pounds");
    checkMarks(s, at, err);
  });
  for (const k of ["decaf", "ownCup"]) if (u[k] !== undefined && !isNum(u[k], 0, 5)) err(`usual.${k}`, k === "decaf" ? "the extra for decaf in pounds (0 if free); leave out if you don't do decaf" : "the discount for bringing your own cup, in pounds; leave out if none");
  if (u.note !== undefined && !isStr(u.note)) err("usual.note", "text");
}

/** @param {any} b @param {Report} err */
function checkBusy(b, err) {
  if (!isObj(b)) { err("busy", "{ basis, from, week, laptopMax? }"); return; }
  onlyKeys(b, ["basis", "from", "week", "laptopMax"], "busy", err);
  if (!isStr(b.basis)) err("busy.basis", 'where the numbers come from, e.g. "From our till receipts, September–October 2026"');
  if (!isTime(b.from)) err("busy.from", '"HH:MM": the hour the first number in each day is for');
  if (!isObj(b.week) || !Object.keys(b.week).length) err("busy.week", "{ mon: [levels an hour], … } with 0 quiet, 1 steady, 2 busy, 3 queue at the door, null when closed");
  else for (const [k, v] of Object.entries(b.week)) {
    if (!DAY_KEYS.includes(/** @type {any} */ (k))) err(`busy.week.${k}`, `not a day: ${DAY_KEYS.join(", ")}`);
    else if (!Array.isArray(v) || !v.length || v.length > 18 || v.some((x) => x !== null && !isInt(x, 0, 3))) err(`busy.week.${k}`, "1–18 levels, one an hour from \"from\": 0 quiet, 1 steady, 2 busy, 3 queue at the door, or null for an hour you're closed");
  }
  if (b.laptopMax !== undefined && !isInt(b.laptopMax, 0, 2)) err("busy.laptopMax", "the busiest level that's still laptop-friendly, 0–2 (default 1)");
}

/** @param {any} w @param {Report} err */
function checkWorkHere(w, err) {
  if (!isObj(w)) { err("workHere", "{ answers, photos?, rules? }"); return; }
  onlyKeys(w, ["answers", "photos", "rules"], "workHere", err);
  if (!Array.isArray(w.answers) || !w.answers.length) err("workHere.answers", `a list of { topic, answer, note? }; topics: ${WORK_TOPICS.join(", ")}`);
  else {
    /** @type {Set<string>} */ const seen = new Set();
    w.answers.forEach((/** @type {any} */ a, /** @type {number} */ i) => {
      const at = `workHere.answers[${i}]`;
      if (!isObj(a)) { err(at, "{ topic, answer, note? }"); return; }
      onlyKeys(a, ["topic", "answer", "note"], at, err);
      if (!WORK_TOPICS.includes(a.topic)) err(`${at}.topic`, WORK_TOPICS.join(", "));
      else if (seen.has(a.topic)) err(`${at}.topic`, `"${a.topic}" is answered twice`);
      seen.add(a.topic);
      if (!["yes", "no", "some"].includes(a.answer)) err(`${at}.answer`, '"yes", "no" or "some" (then say which in the note)');
      if (a.note !== undefined && !isStr(a.note)) err(`${at}.note`, "text");
      if (a.answer === "some" && !isStr(a.note)) err(`${at}.note`, 'required when the answer is "some"');
    });
  }
  if (w.photos !== undefined) {
    if (!Array.isArray(w.photos) || w.photos.length > 3) err("workHere.photos", "up to 3 photos of the café's own tables, sockets or dog bowl");
    else w.photos.forEach((/** @type {any} */ p, /** @type {number} */ i) => photo(p, `workHere.photos[${i}]`, err));
  }
  if (w.rules !== undefined && (!Array.isArray(w.rules) || !w.rules.length || !w.rules.every(isStr))) err("workHere.rules", "the house rules as short lines");
}

/** @param {any} r @param {Report} err */
function checkSeats(r, err) {
  if (!isObj(r)) { err("seats", "{ width, height, places, marks?, note? }"); return; }
  onlyKeys(r, ["width", "height", "places", "marks", "note"], "seats", err);
  if (!isInt(r.width, 20, 400) || !isInt(r.height, 20, 400)) err("seats", "width and height of the plan, in the plan's own units (e.g. 100 × 60)");
  const W = r.width, H = r.height;
  /** @param {any} o @param {string} at */
  const inside = (o, at) => {
    if (![o.x, o.y, o.w, o.h].every((v) => isNum(v, 0, 400)) || o.w <= 0 || o.h <= 0) err(at, "x, y, w, h in the plan's units");
    else if (o.x + o.w > W || o.y + o.h > H) err(at, "reaches outside the room");
  };
  /** @type {{ x: number, y: number, w: number, h: number, at: string }[]} */ const boxes = [];
  idList(r.places, "seats.places", err, (t, at) => {
    onlyKeys(t, ["id", "label", "x", "y", "w", "h", "shape", "seats", "has"], at, err);
    if (!isStr(t.label)) err(`${at}.label`, 'what staff call it, e.g. "The window bench"');
    if (!SEAT_SHAPES.includes(t.shape)) err(`${at}.shape`, SEAT_SHAPES.join(", "));
    if (!isInt(t.seats, 1, 30)) err(`${at}.seats`, "1–30");
    if (!Array.isArray(t.has) || t.has.some((/** @type {any} */ h) => !SEAT_HAS.includes(h))) err(`${at}.has`, `what it has: ${SEAT_HAS.join(", ")}`);
    inside(t, at);
    for (const b of boxes) if (t.x < b.x + b.w && b.x < t.x + t.w && t.y < b.y + b.h && b.y < t.y + t.h) err(at, `overlaps ${b.at}`);
    boxes.push({ x: t.x, y: t.y, w: t.w, h: t.h, at });
  });
  if (r.marks !== undefined) {
    if (!Array.isArray(r.marks)) err("seats.marks", "a list");
    else r.marks.forEach((/** @type {any} */ m, /** @type {number} */ i) => {
      const at = `seats.marks[${i}]`;
      if (!isObj(m)) { err(at, "an object"); return; }
      onlyKeys(m, ["kind", "x", "y", "w", "h", "label"], at, err);
      if (![...ROOM_MARKS, "counter"].includes(m.kind)) err(`${at}.kind`, [...ROOM_MARKS, "counter"].join(", "));
      if (m.label !== undefined && !isStr(m.label)) err(`${at}.label`, "text");
      inside(m, at);
    });
  }
  if (r.note !== undefined && !isStr(r.note)) err("seats.note", "text");
}

/** @param {any} b @param {{ dishes: Map<string, any> }} menu @param {Report} err */
function checkBrunch(b, menu, err) {
  if (!isObj(b)) { err("brunch", "{ plates, sides, maxPlates, note? }"); return; }
  onlyKeys(b, ["plates", "sides", "maxPlates", "note"], "brunch", err);
  for (const k of ["plates", "sides"]) {
    if (!Array.isArray(b[k]) || !b[k].length) { err(`brunch.${k}`, `dish ids from the menu${k === "plates" ? " (with a photo)" : ""}`); continue; }
    b[k].forEach((/** @type {any} */ id, /** @type {number} */ i) => {
      const d = menu.dishes.get(id);
      if (!d) err(`brunch.${k}[${i}]`, `"${id}" isn't a dish on the menu`);
      else if (k === "plates" && !d.photo) err(`brunch.plates[${i}]`, `"${id}" has no "photo"`);
    });
  }
  if (!isInt(b.maxPlates, 1, 12)) err("brunch.maxPlates", "the most plates in one pre-order, 1–12");
  if (b.note !== undefined && !isStr(b.note)) err("brunch.note", "text");
}

/** Tea kinds and caffeine levels (src/kits/restaurant/lib/tearoom.js; a unit test keeps them equal). */
export const TEA_KINDS = ["black", "green", "oolong", "white", "dark", "herbal"];
export const CAFFEINE = ["none", "low", "medium", "high"];
export const STRENGTHS = ["light", "medium", "full"];

/**
 * Afternoon tea: the sitting it's served in, the menu sections on the stand, what a guest can have it as, and the library.
 * @param {any} t @param {any} rawMenu @param {{ sections: Map<string, any> }} menu @param {Report} err
 */
function checkTea(t, rawMenu, menu, err) {
  if (!isObj(t)) { err("tea", "{ sitting, tiers, services, swaps, library, note? }"); return; }
  onlyKeys(t, ["sitting", "tiers", "services", "swaps", "library", "seasons", "note"], "tea", err);
  if (t.seasons !== undefined) checkTeaSeasons(t.seasons, err);
  const sittings = (Array.isArray(rawMenu?.sittings) ? rawMenu.sittings : []).map((/** @type {any} */ x) => x.id);
  if (!sittings.includes(t.sitting)) err("tea.sitting", `the menu sitting afternoon tea is served in: ${sittings.join(", ")}`);
  if (!Array.isArray(t.tiers) || t.tiers.length < 2 || t.tiers.length > 4 || t.tiers.some((/** @type {any} */ id) => !menu.sections.has(id))) err("tea.tiers", "2–4 menu section ids, bottom tier first, e.g. sandwiches, scones, pastries");
  idList(t.services, "tea.services", err, (sv, at) => {
    onlyKeys(sv, ["id", "name", "price", "note"], at, err);
    if (!isStr(sv.name)) err(`${at}.name`, 'as on the menu, e.g. "Afternoon tea" or "With a glass of champagne"');
    if (!isNum(sv.price, 0.5, 1000)) err(`${at}.price`, "price per guest in pounds, from the menu");
    if (sv.note !== undefined && !isStr(sv.note)) err(`${at}.note`, "text");
  });
  if (typeof t.swaps !== "boolean") err("tea.swaps", "true if the kitchen makes the stand differently for diets and allergies on request, false if not");
  checkLibrary(t.library, err);
  if (t.note !== undefined && !isStr(t.note)) err("tea.note", "text");
}

/** @param {any} list @param {Report} err */
function checkLibrary(list, err) {
  idList(list, "tea.library", err, (x, at) => {
    onlyKeys(x, ["id", "name", "kind", "caffeine", "origin", "notes", "steep", "strength", "milk", "pairs"], at, err);
    if (x.strength !== undefined && !STRENGTHS.includes(x.strength)) err(`${at}.strength`, `how strong it drinks: ${STRENGTHS.join(", ")}`);
    if (x.milk !== undefined && typeof x.milk !== "boolean") err(`${at}.milk`, "true if it takes milk well");
    if (x.pairs !== undefined && !isStr(x.pairs)) err(`${at}.pairs`, 'what it goes with on the stand, e.g. "the scones"');
    if (!isStr(x.name)) err(`${at}.name`, "the tea's name");
    if (!TEA_KINDS.includes(x.kind)) err(`${at}.kind`, TEA_KINDS.join(", "));
    if (!CAFFEINE.includes(x.caffeine)) err(`${at}.caffeine`, `as the café states it: ${CAFFEINE.join(", ")}`);
    for (const k of ["origin", "notes"]) if (x[k] !== undefined && !isStr(x[k])) err(`${at}.${k}`, "text");
    if (x.steep !== undefined && (!isObj(x.steep) || !isInt(x.steep.minutes, 1, 15) || !isInt(x.steep.celsius, 60, 100) || Object.keys(x.steep).length !== 2)) err(`${at}.steep`, "{ minutes: 1–15, celsius: 60–100 }");
  });
}

/** Live music: sets on fixed days and times, from the café. @param {any} m @param {Report} err */
function checkMusic(m, err) {
  if (!isObj(m)) { err("music", "{ sets, note?, photo? }"); return; }
  onlyKeys(m, ["sets", "note", "photo"], "music", err);
  if (m.photo !== undefined) photo(m.photo, "music.photo", err);
  if (!Array.isArray(m.sets) || !m.sets.length) err("music.sets", "[{ days, from, to, who, what }]");
  else m.sets.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `music.sets[${i}]`;
    if (!isObj(x)) { err(at, "{ days, from, to, who, what }"); return; }
    onlyKeys(x, ["days", "from", "to", "who", "what"], at, err);
    if (!Array.isArray(x.days) || !x.days.length || x.days.some((/** @type {any} */ d) => !DAY_KEYS.includes(d))) err(`${at}.days`, DAY_KEYS.join(", "));
    if (!isTime(x.from) || !isTime(x.to) || toMinutes(x.to) <= toMinutes(x.from)) err(at, '"from" and "to" as "HH:MM", ending after it starts');
    if (!isStr(x.who)) err(`${at}.who`, 'the instrument or player, e.g. "Harp"');
    if (!isStr(x.what)) err(`${at}.what`, 'what they play, in a few words');
  });
  if (m.note !== undefined && !isStr(m.note)) err("music.note", "text");
}

/** The dress code and etiquette card, in the café's own words. @param {any} d @param {Report} err */
function checkDressCode(d, err) {
  if (!isObj(d)) { err("dressCode", "{ summary, rules, etiquette?, checked }"); return; }
  onlyKeys(d, ["summary", "rules", "etiquette", "checked"], "dressCode", err);
  if (!isStr(d.summary)) err("dressCode.summary", 'one line, e.g. "Smart casual. No sportswear."');
  for (const k of ["rules", "etiquette"]) {
    if (k === "etiquette" && d[k] === undefined) continue;
    if (!Array.isArray(d[k]) || !d[k].length || d[k].length > 8 || d[k].some((/** @type {any} */ x) => !isStr(x))) err(`dressCode.${k}`, "1–8 short lines");
  }
  if (!DATE.test(d.checked ?? "")) err("dressCode.checked", "when the café last checked it, YYYY-MM-DD");
}

/** @param {any} link @param {string} at @param {string} mode @param {Report} err */
function stripeLink(link, at, mode, err) {
  if (!/^https:\/\/buy\.stripe\.com\/[\w-]+$/.test(link ?? "")) err(at, "the shop's own Stripe Payment Link, https://buy.stripe.com/…");
  else if (mode === "demo" && !link.startsWith("https://buy.stripe.com/test_")) err(at, "demo sites must use a Stripe test-mode link (https://buy.stripe.com/test_…)");
  else if (mode === "client" && link.startsWith("https://buy.stripe.com/test_")) err(at, "is a Stripe test-mode link; client sites need the shop's live link");
}

/**
 * Your table: a photo for each tier of the stand, the most guests, and the champagne table (bottles from the drinks).
 * @param {any} st @param {any} tea @param {any} menu @param {Report} err
 */
function checkStand(st, tea, menu, err) {
  if (!isObj(st)) { err("stand", "{ photos, maxGuests, champagne?, note? }"); return; }
  onlyKeys(st, ["photos", "maxGuests", "champagne", "note"], "stand", err);
  const tiers = Array.isArray(tea?.tiers) ? tea.tiers : [];
  if (!tiers.length) err("stand", 'needs "tea" with its tiers');
  if (!isObj(st.photos)) err("stand.photos", "a photo for each tier: { \"<tea.tiers id>\": { src, width, height, alt } }");
  else {
    for (const id of tiers) if (st.photos[id] === undefined) err(`stand.photos.${id}`, "a photo of this tier is missing");
    for (const [id, ph] of Object.entries(st.photos)) { if (!tiers.includes(id)) err(`stand.photos.${id}`, "isn't one of tea.tiers"); else photo(ph, `stand.photos.${id}`, err); }
  }
  if (!isInt(st.maxGuests, 1, 8)) err("stand.maxGuests", "the most guests one request can set, 1–8");
  if (st.champagne !== undefined) checkChampagne(st.champagne, menu, err);
  if (st.note !== undefined && !isStr(st.note)) err("stand.note", "text");
}

/** The champagne table: bottles from the drinks list, opened and poured at the table. @param {any} c @param {any} menu @param {Report} err */
function checkChampagne(c, menu, err) {
  if (!isObj(c)) { err("stand.champagne", "{ bottles, photo?, note? }"); return; }
  onlyKeys(c, ["bottles", "photo", "note"], "stand.champagne", err);
  const drinks = new Set((Array.isArray(menu?.sections) ? menu.sections : []).filter((/** @type {any} */ x) => x.drinks).flatMap((/** @type {any} */ x) => (x.dishes ?? []).map((/** @type {any} */ d) => d.id)));
  if (!Array.isArray(c.bottles) || !c.bottles.length || c.bottles.some((/** @type {any} */ id) => !drinks.has(id))) err("stand.champagne.bottles", "drink ids from the menu's drinks sections");
  if (c.photo !== undefined) photo(c.photo, "stand.champagne.photo", err);
  if (c.note !== undefined && !isStr(c.note)) err("stand.champagne.note", "text");
}

/** Give a sitting: what can be given, each with the shop's Stripe Payment Link at that price. @param {any} g @param {string} mode @param {Report} err */
function checkGive(g, mode, err) {
  if (!isObj(g)) { err("giveSitting", "{ gifts, message, validMonths, terms, note? }"); return; }
  onlyKeys(g, ["gifts", "message", "validMonths", "terms", "note"], "giveSitting", err);
  idList(g.gifts, "giveSitting.gifts", err, (x, at) => {
    onlyKeys(x, ["id", "name", "price", "link"], at, err);
    if (!isStr(x.name)) err(`${at}.name`, 'e.g. "Afternoon tea for two"');
    if (!isNum(x.price, 1, 5000)) err(`${at}.price`, "pounds; the Stripe link must be set to this price");
    stripeLink(x.link, `${at}.link`, mode, err);
  });
  if (!isStr(g.message)) err("giveSitting.message", 'the WhatsApp opening line, e.g. "Hello, I\'d like to give a sitting"');
  if (!isInt(g.validMonths, 1, 36)) err("giveSitting.validMonths", "how long the gift lasts, in months");
  if (!isStr(g.terms)) err("giveSitting.terms", "one line of terms, in the shop's words");
  if (g.note !== undefined && !isStr(g.note)) err("giveSitting.note", "text");
}

/** The room by day and by candlelight (the Salon look's hero), each with a smaller crop for phones. @param {any} r @param {Report} err */
function checkHeroRoom(r, err) {
  if (!isObj(r)) { err("hero.room", "{ day, evening }: each { src, src2x?, srcSmall, srcSmall2x?, width, height, alt }"); return; }
  onlyKeys(r, ["day", "evening"], "hero.room", err);
  for (const k of ["day", "evening"]) {
    const p = r[k], at = `hero.room.${k}`;
    if (!isObj(p)) { err(at, "{ src, srcSmall, width, height, alt }"); continue; }
    const { srcSmall, src2x, srcSmall2x, ...rest } = p;
    photo(rest, at, err);
    const img = (/** @type {any} */ v) => isStr(v) && /^img\/.+\.(webp|jpe?g|png|avif)$/i.test(v);
    if (!img(srcSmall)) err(`${at}.srcSmall`, "a phone-sized crop in img/, e.g. img/room-s.webp");
    if (src2x !== undefined && !img(src2x)) err(`${at}.src2x`, "the same photo at twice the size, in img/");
    if (srcSmall2x !== undefined && !img(srcSmall2x)) err(`${at}.srcSmall2x`, "the phone crop at twice the size, in img/");
  }
}

/** Seasonal stands: name, dates, price and a line each; optional photo. @param {any} list @param {Report} err */
function checkTeaSeasons(list, err) {
  idList(list, "tea.seasons", err, (x, at) => {
    onlyKeys(x, ["id", "name", "from", "to", "price", "text", "photo"], at, err);
    if (!isStr(x.name)) err(`${at}.name`, 'e.g. "The Christmas tea"');
    if (!DATE.test(x.from ?? "") || !DATE.test(x.to ?? "") || x.to < x.from) err(at, '"from" and "to" as YYYY-MM-DD, ending on or after it starts');
    if (!isNum(x.price, 1, 1000)) err(`${at}.price`, "price per guest in pounds");
    if (!isStr(x.text)) err(`${at}.text`, "one line on what's on the stand");
    if (x.photo !== undefined) photo(x.photo, `${at}.photo`, err);
  });
}

/**
 * The pâtisserie window: the menu sections whose pieces are in it (each with a photo), the boxes with the shop's
 * Stripe Payment Link at each box's price, and the WhatsApp opening line.
 * @param {any} w @param {{ sections: Map<string, any> }} menu @param {string} mode @param {Report} err
 */
function checkWindow(w, menu, mode, err) {
  if (!isObj(w)) { err("window", "{ sections, boxes, message, photo?, note? }"); return; }
  onlyKeys(w, ["sections", "boxes", "message", "photo", "note"], "window", err);
  if (w.photo !== undefined) photo(w.photo, "window.photo", err);
  if (!Array.isArray(w.sections) || !w.sections.length) err("window.sections", "menu section ids whose pieces are in the window");
  else w.sections.forEach((/** @type {any} */ id, /** @type {number} */ i) => {
    const sec = menu.sections.get(id);
    if (!sec) err(`window.sections[${i}]`, `"${id}" isn't a menu section`);
    else if ((sec.dishes ?? []).some((/** @type {any} */ d) => !d.photo)) err(`window.sections[${i}]`, `every piece in "${id}" needs a "photo"`);
  });
  idList(w.boxes, "window.boxes", err, (b, at) => {
    onlyKeys(b, ["id", "name", "count", "price", "link"], at, err);
    if (!isStr(b.name)) err(`${at}.name`, 'e.g. "The Grenat box of six"');
    if (!isInt(b.count, 2, 24)) err(`${at}.count`, "how many pieces the box holds, 2–24");
    if (!isNum(b.price, 1, 1000)) err(`${at}.price`, "pounds; the Stripe link must be set to this price");
    stripeLink(b.link, `${at}.link`, mode, err);
  });
  if (!isStr(w.message)) err("window.message", "the WhatsApp opening line");
  if (w.note !== undefined && !isStr(w.note)) err("window.note", "text");
}

/** The salon plan: a photograph of the room and the places marked on it (percent from the left and top). @param {any} p @param {Report} err */
function checkSalonPlan(p, err) {
  if (!isObj(p)) { err("salonPlan", "{ photo, spots, note? }"); return; }
  onlyKeys(p, ["photo", "spots", "note"], "salonPlan", err);
  photo(p.photo, "salonPlan.photo", err);
  idList(p.spots, "salonPlan.spots", err, (x, at) => {
    onlyKeys(x, ["id", "label", "x", "y", "note"], at, err);
    if (!isStr(x.label)) err(`${at}.label`, 'where it is, e.g. "Under the glass roof"');
    if (!isNum(x.x, 0, 100) || !isNum(x.y, 0, 100)) err(at, '"x" and "y": where on the photo, as percent from the left and from the top');
    if (x.note !== undefined && !isStr(x.note)) err(`${at}.note`, "text");
  });
  if (p.note !== undefined && !isStr(p.note)) err("salonPlan.note", "text");
}
