// @ts-check
/**
 * Validation for the wear kit (clothing brands with a showroom or pop-ups): the pieces with their sizes, fit and
 * fabric, stock from the brand's sheet, drops, the detail photographs, the run club and its routes, the weather
 * kit, the lookbook and the drop-day line. Unknown keys are refused so a typo can't silently switch something off.
 * Numbers written into site.json for stock and the line are allowed on demos only; a client's come from its sheet.
 */
import { DAY_KEYS, isTime } from "../../core/lib/hours.js";

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
const HTTPS = /^https:\/\/[^\s]+$/;
const SHEET = /^https:\/\/docs\.google\.com\/spreadsheets\/.+output=csv/;
const FORM = /^https:\/\/docs\.google\.com\/forms\/d\/e\/[A-Za-z0-9_-]+\/viewform$/;
const OPENS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const SIZE = /^[A-Z0-9]{1,4}$/;
/** Well-known clothing brands a size finder's "kind of brand" must not name. A short list, not a guarantee: labels are also checked in review. */
const BRAND_NAMES = /\b(nike|adidas|puma|reebok|asics|new balance|under armou?r|lululemon|arc'?teryx|patagonia|north face|hoka|salomon|saucony|brooks|mizuno|uniqlo|zara|h&m|levi'?s|ralph lauren|gucci|prada|dior|balenciaga|stone island|c\.?p\.? company|represent|satisfy|on running|gymshark|castore|nobull|asos|primark|boohoo|superdry|jack wills|hollister|abercrombie|tommy hilfiger|calvin klein|hugo boss|ted baker|allsaints|cos|arket|fila|umbro|berghaus|rab|montane|mountain warehouse)\b/i;

/** Page names a piece id must not take (each piece gets a page named after its id). */
const RESERVED = ["index", "privacy", "visit", "work", "team", "shells", "fit", "club", "drops", "lookbook", "404"];

/** @param {Record<string, any>} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}

/** @param {any} p @param {string} at @param {Report} err */
function photo(p, at, err) {
  if (!isObj(p)) { err(at, "{ src, width, height, alt }"); return; }
  onlyKeys(p, ["src", "width", "height", "alt"], at, err);
  if (!isStr(p.src) || !/^img\/.+\.(webp|jpe?g|png|avif)$/i.test(p.src)) err(`${at}.src`, "a photo in the site's img/ folder, e.g. img/shell-black.webp");
  if (!isInt(p.width, 1, 10000) || !isInt(p.height, 1, 10000)) err(at, "width and height in pixels");
  if (!isStr(p.alt)) err(`${at}.alt`, "what the photo shows, for people who can't see it");
}

/** @param {any} o @param {string} at @param {Report} err */
function pageCopy(o, at, err) {
  if (!isObj(o)) { err(at, "{ kicker, title, intro?, description? }"); return; }
  onlyKeys(o, ["kicker", "title", "intro", "description"], at, err);
  if (!isStr(o.kicker)) err(`${at}.kicker`, "the small line above the page title");
  if (!isStr(o.title)) err(`${at}.title`, "the page title");
  for (const k of ["intro", "description"]) if (o[k] !== undefined && !isStr(o[k])) err(`${at}.${k}`, "text");
}

/** @param {any} v @param {string} at @param {Report} err @param {string} what */
function lines(v, at, err, what) {
  if (v !== undefined && (!Array.isArray(v) || !v.length || !v.every(isStr))) err(at, `a list of short lines: ${what}`);
}

/** @param {any} site @param {Report} err */
export function checkWear(site, err) {
  if (site.kit !== "wear") return;
  const demo = site.mode === "demo";
  const pieces = site.pieces !== undefined ? checkPieces(site.pieces, err) : new Map();
  /** @param {any} id @param {string} at */
  const pieceRef = (id, at) => { if (!pieces.has(id)) err(at, `"${id}" isn't one of pieces`); };
  if (site.shop !== undefined) checkShop(site.shop, demo, err);
  if (site.stock !== undefined) checkStock(site.stock, pieces, demo, err);
  if (site.drop !== undefined) checkDrop(site.drop, demo, err, pieceRef);
  if (site.details !== undefined) checkDetails(site.details, err);
  if (site.club !== undefined) checkClub(site.club, err);
  if (site.weather !== undefined) checkWeather(site.weather, demo, err, pieceRef);
  if (site.lookbook !== undefined) checkLookbook(site.lookbook, err, pieceRef);
  if (site.dropQueue !== undefined) checkDropQueue(site.dropQueue, demo, err);
  if (site.hero !== undefined) checkHero(site.hero, err);
  if (site.sizeGuide !== undefined) checkSizeGuide(site.sizeGuide, err);
  for (const k of ["shellsPage", "fitPage", "clubPage", "dropsPage", "lookbookPage"]) if (site[k] !== undefined) pageCopy(site[k], k, err);
}

/**
 * The size finder's chart: for each size, in order, the height and weight (and optionally chest) it's cut for, in cm
 * and kg, from the brand. `brands` are kinds of brand, never real names ("Brands that run small"), each with how many
 * sizes to move from the size the customer wears there.
 * @param {any} g @param {Report} err
 */
function checkSizeGuide(g, err) {
  if (!isObj(g)) return err("sizeGuide", "an object with sizes and brands");
  onlyKeys(g, ["sizes", "brands", "note"], "sizeGuide", err);
  if (!Array.isArray(g.sizes) || g.sizes.length < 2) err("sizeGuide.sizes", "at least two sizes, smallest first");
  else {
    const chests = g.sizes.filter((/** @type {any} */ r) => r?.chest !== undefined).length;
    if (chests && chests !== g.sizes.length) err("sizeGuide.sizes", "give chest for every size or none");
    g.sizes.forEach((/** @type {any} */ r, /** @type {number} */ i) => {
      const at = `sizeGuide.sizes[${i}]`;
      if (!isObj(r)) return err(at, "{ size, height, weight }");
      onlyKeys(r, ["size", "height", "weight", "chest"], at, err);
      if (!SIZE.test(r.size ?? "")) err(`${at}.size`, "a size label like M or XL");
      /** @type {[string, number, number][]} */ const want = [["height", 120, 230], ["weight", 35, 200], ["chest", 60, 160]];
      for (const [k, lo, hi] of want) {
        if (k === "chest" && r.chest === undefined) continue;
        const v = r[k];
        if (!Array.isArray(v) || v.length !== 2 || !isNum(v[0], lo, hi) || !isNum(v[1], lo, hi) || v[0] >= v[1]) err(`${at}.${k}`, `[from, to] between ${lo} and ${hi}`);
        else if (i > 0 && Array.isArray(g.sizes[i - 1]?.[k]) && v[0] < g.sizes[i - 1][k][0]) err(`${at}.${k}`, "each size starts at or above the one before");
      }
    });
  }
  if (!Array.isArray(g.brands) || !g.brands.length) err("sizeGuide.brands", "at least one kind of brand, e.g. { label: \"Most high-street brands\", shift: 0 }");
  else g.brands.forEach((/** @type {any} */ b, /** @type {number} */ i) => {
    const at = `sizeGuide.brands[${i}]`;
    if (!isObj(b)) return err(at, "{ label, shift }");
    onlyKeys(b, ["label", "shift"], at, err);
    if (!isStr(b.label) || b.label.length > 60) err(`${at}.label`, "a kind of brand in a few words, never a real brand's name");
    else if (BRAND_NAMES.test(b.label)) err(`${at}.label`, "a kind of brand (\"Brands that run small\"), never a real brand's name");
    if (!isInt(b.shift, -2, 2)) err(`${at}.shift`, "sizes to move from the size they wear there, -2 to 2");
  });
  if (g.note !== undefined && (!isStr(g.note) || g.note.length > 200)) err("sizeGuide.note", "one short sentence");
}

/** @param {any} h @param {Report} err */
function checkHero(h, err) {
  if (h.photo !== undefined) photo(h.photo, "hero.photo", err);
  if (h.photoTall !== undefined) photo(h.photoTall, "hero.photoTall", err);
  if (h.piece !== undefined && !SLUG.test(h.piece)) err("hero.piece", "the id of the piece the hero shows");
}

/**
 * Pieces: each with a price, its sizes in order, photographs, and (optionally) its fit table, fit notes, fabric and care.
 * @param {any} list @param {Report} err @returns {Map<string, any>}
 */
function checkPieces(list, err) {
  /** @type {Map<string, any>} */ const ids = new Map();
  if (!Array.isArray(list) || !list.length) { err("pieces", "a non-empty list"); return ids; }
  list.forEach((p, i) => {
    const at = `pieces[${i}]`;
    if (!isObj(p)) { err(at, "an object"); return; }
    onlyKeys(p, ["id", "name", "colour", "price", "line", "sizes", "photos", "fit", "fabric", "care", "kind", "buy"], at, err);
    if (p.buy !== undefined && !HTTPS.test(p.buy)) err(`${at}.buy`, "the piece's own page on the brand's shop, an https link");
    if (RESERVED.includes(p.id)) err(`${at}.id`, `"${p.id}" is the name of a page; choose another id`);
    if (!SLUG.test(p.id ?? "")) err(`${at}.id`, "lowercase letters, numbers and dashes");
    else if (ids.has(p.id)) err(`${at}.id`, `"${p.id}" is used twice`);
    else ids.set(p.id, p);
    if (!isStr(p.name)) err(`${at}.name`, "the piece's name, e.g. Shell 04");
    if (p.colour !== undefined && !isStr(p.colour)) err(`${at}.colour`, "the colour's name");
    if (!isNum(p.price, 1, 5000)) err(`${at}.price`, "the price in pounds, from the brand");
    if (p.line !== undefined && !isStr(p.line)) err(`${at}.line`, "one short line about the piece");
    if (p.kind !== undefined && !isStr(p.kind)) err(`${at}.kind`, 'what it is, e.g. "Rain shell"');
    if (!Array.isArray(p.sizes) || !p.sizes.length || !p.sizes.every((/** @type {any} */ s) => SIZE.test(s)) || new Set(p.sizes).size !== p.sizes.length) err(`${at}.sizes`, 'sizes in order, smallest first, e.g. ["S","M","L","XL"]');
    if (!Array.isArray(p.photos) || !p.photos.length) err(`${at}.photos`, "at least one photograph of the piece, worn");
    else p.photos.forEach((/** @type {any} */ ph, /** @type {number} */ j) => photo(ph, `${at}.photos[${j}]`, err));
    if (p.fit !== undefined) checkFit(p.fit, Array.isArray(p.sizes) ? p.sizes : [], `${at}.fit`, err);
    lines(p.fabric, `${at}.fabric`, err, "what it's made of, in the brand's words; only claims the brand can show from the mill's spec");
    lines(p.care, `${at}.care`, err, "how to wash and look after it");
  });
  return ids;
}

/** @param {any} f @param {string[]} sizes @param {string} at @param {Report} err */
function checkFit(f, sizes, at, err) {
  if (!isObj(f)) { err(at, "{ ease, measures, notes }"); return; }
  onlyKeys(f, ["ease", "measures", "notes", "chest"], at, err);
  if (!isInt(f.ease, 0, 60)) err(`${at}.ease`, "the room the brand wants over the chest, in cm (used by the size finder)");
  if (f.chest !== undefined && !SLUG.test(f.chest)) err(`${at}.chest`, "the id of the flat chest measure");
  if (!Array.isArray(f.measures) || !f.measures.length) err(`${at}.measures`, '[{ id, label, values: { "S": 55, … } }]');
  else f.measures.forEach((/** @type {any} */ m, /** @type {number} */ i) => {
    const mp = `${at}.measures[${i}]`;
    if (!isObj(m)) { err(mp, "an object"); return; }
    onlyKeys(m, ["id", "label", "values"], mp, err);
    if (!SLUG.test(m.id ?? "")) err(`${mp}.id`, "lowercase id, e.g. chest");
    if (!isStr(m.label)) err(`${mp}.label`, 'how it is measured, e.g. "Chest, armpit to armpit"');
    if (!isObj(m.values) || sizes.some((s) => !isNum(m.values[s], 1, 300))) err(`${mp}.values`, `a measurement in cm for every size (${sizes.join(", ")})`);
  });
  const chestId = f.chest ?? "chest";
  if (Array.isArray(f.measures) && !f.measures.some((/** @type {any} */ m) => m?.id === chestId)) err(`${at}.measures`, `needs the flat chest ("${chestId}") for the size finder`);
  if (f.notes !== undefined && (!isObj(f.notes) || sizes.some((s) => !isStr(f.notes[s])))) err(`${at}.notes`, "how it sits, one line for every size");
}

/** @param {any} s @param {boolean} demo @param {Report} err */
function checkShop(s, demo, err) {
  if (!isObj(s)) { err("shop", "{ url, name }"); return; }
  onlyKeys(s, ["url", "name", "note"], "shop", err);
  if (!HTTPS.test(s.url ?? "")) err("shop.url", "the brand's own online shop, an https link");
  else if (demo && !/^https:\/\/[^/]+\.example(\/|$)/.test(s.url)) err("shop.url", "a demo's shop must be a .example address so it never points at a real shop");
  else if (!demo && /\.example(\/|$)/.test(s.url)) err("shop.url", "is a demo address; use the brand's own shop");
  if (!isStr(s.name)) err("shop.name", 'what the buy button says it opens, e.g. "Shop"');
}

/**
 * @param {any} s @param {Map<string, any>} pieces @param {boolean} demo @param {Report} err
 */
function checkStock(s, pieces, demo, err) {
  if (!isObj(s)) { err("stock", "{ source, csvUrl, staleAfterHours, lowAt }"); return; }
  onlyKeys(s, ["source", "csvUrl", "staleAfterHours", "lowAt", "fixed"], "stock", err);
  if (!["sheet", "fixed"].includes(s.source)) err("stock.source", '"sheet" (the brand\'s Google Sheet) or "fixed" (demo only)');
  if (s.source === "fixed" && !demo) err("stock.source", "fixed numbers would go out of date on a real site; use the brand's sheet");
  if (s.source === "sheet" && !SHEET.test(s.csvUrl ?? "")) err("stock.csvUrl", "a published Google Sheet CSV link (File → Share → Publish to web → CSV)");
  if (!isInt(s.staleAfterHours, 1, 168)) err("stock.staleAfterHours", "after how many hours without an update the stock goes quiet");
  if (!isInt(s.lowAt, 1, 500)) err("stock.lowAt", 'at or below how many left a piece says "n left"');
  if (s.source === "fixed") {
    if (!isObj(s.fixed)) err("stock.fixed", "{ pieceId: { size: number left } } for the demo");
    else for (const [id, sizes] of Object.entries(s.fixed)) {
      const p = pieces.get(id);
      if (!p) { err(`stock.fixed.${id}`, `"${id}" isn't one of pieces`); continue; }
      if (!isObj(sizes) || !p.sizes.every((/** @type {string} */ z) => isInt(sizes[z], 0, 9999))) err(`stock.fixed.${id}`, `a number left for every size (${p.sizes.join(", ")})`);
    }
  } else if (s.fixed !== undefined) err("stock.fixed", "only for demos");
}

/** @param {any} d @param {boolean} demo @param {Report} err @param {(id: any, at: string) => void} pieceRef */
function checkDrop(d, demo, err, pieceRef) {
  if (!isObj(d)) { err("drop", "{ name, opens, pieces, remindForm, … }"); return; }
  onlyKeys(d, ["name", "title", "opens", "rolling", "where", "pieces", "remindForm", "restockForm", "text", "archive"], "drop", err);
  if (!isStr(d.name)) err("drop.name", 'e.g. "Drop 04"');
  if (d.title !== undefined && !isStr(d.title)) err("drop.title", "its name, e.g. Wind");
  if (d.rolling !== undefined) {
    if (!demo) err("drop.rolling", "demo only: a real drop has a real date in drop.opens");
    else if (!isObj(d.rolling) || !DAY_KEYS.includes(d.rolling.day) || !isTime(d.rolling.time)) err("drop.rolling", '{ day: "sat", time: "10:00" }: the demo\'s drop is always the next one');
  } else if (!OPENS.test(d.opens ?? "")) err("drop.opens", 'when it opens on the brand\'s clock, "YYYY-MM-DDTHH:MM"');
  if (!isStr(d.where)) err("drop.where", 'where it opens, e.g. "Online and at the showroom"');
  if (!Array.isArray(d.pieces) || !d.pieces.length) err("drop.pieces", "the ids of the pieces in this drop");
  else d.pieces.forEach((/** @type {any} */ id, /** @type {number} */ i) => pieceRef(id, `drop.pieces[${i}]`));
  for (const k of ["remindForm", "restockForm"]) {
    if (d[k] === undefined) continue;
    if (!FORM.test(d[k])) err(`drop.${k}`, "the brand's Google Form link (…/viewform)");
    else if (demo !== /demo/i.test(d[k])) err(`drop.${k}`, demo ? "a demo form link must say demo in it, so it can never be mistaken for a real one" : "is a demo link; use the brand's own Form");
  }
  if (d.text !== undefined && !isStr(d.text)) err("drop.text", "one line about the drop");
  (d.archive ?? []).forEach((/** @type {any} */ a, /** @type {number} */ i) => {
    const at = `drop.archive[${i}]`;
    if (!isObj(a)) { err(at, "an object"); return; }
    onlyKeys(a, ["name", "title", "opens", "pieces", "photos", "text"], at, err);
    if (!isStr(a.name)) err(`${at}.name`, "e.g. Drop 03");
    if (!OPENS.test(a.opens ?? "")) err(`${at}.opens`, '"YYYY-MM-DDTHH:MM"');
    if (!Array.isArray(a.photos) || !a.photos.length) err(`${at}.photos`, "its campaign photographs");
    else a.photos.forEach((/** @type {any} */ p, /** @type {number} */ j) => photo(p, `${at}.photos[${j}]`, err));
    (a.pieces ?? []).forEach((/** @type {any} */ id, /** @type {number} */ j) => pieceRef(id, `${at}.pieces[${j}]`));
    if (a.text !== undefined && !isStr(a.text)) err(`${at}.text`, "one line");
  });
}

/** @param {any} d @param {Report} err */
function checkDetails(d, err) {
  if (!isObj(d)) { err("details", "{ items }"); return; }
  onlyKeys(d, ["items"], "details", err);
  if (!Array.isArray(d.items) || d.items.length < 2) { err("details.items", "two or more close-up photographs, each { photo, line }"); return; }
  d.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `details.items[${i}]`;
    if (!isObj(x)) { err(at, "{ photo, line }"); return; }
    onlyKeys(x, ["photo", "line"], at, err);
    photo(x.photo, `${at}.photo`, err);
    if (!isStr(x.line)) err(`${at}.line`, "one short line; no claim the brand can't back up");
  });
}

/** @param {any} c @param {Report} err */
function checkClub(c, err) {
  if (!isObj(c)) { err("club", "{ runs, note, photo, routes }"); return; }
  onlyKeys(c, ["runs", "note", "photo", "photoTall", "photos", "routes", "rsvp"], "club", err);
  if (c.note !== undefined && !isStr(c.note)) err("club.note", "one line, e.g. free, every week");
  for (const k of ["photo", "photoTall"]) if (c[k] !== undefined) photo(c[k], `club.${k}`, err);
  (c.photos ?? []).forEach((/** @type {any} */ p, /** @type {number} */ i) => photo(p, `club.photos[${i}]`, err));
  if (c.rsvp !== undefined && !isStr(c.rsvp)) err("club.rsvp", "the WhatsApp message, with {run} where the run goes");
  const routes = new Set();
  (c.routes ?? []).forEach((/** @type {any} */ r, /** @type {number} */ i) => {
    const at = `club.routes[${i}]`;
    if (!isObj(r)) { err(at, "{ id, name, points }"); return; }
    onlyKeys(r, ["id", "name", "points", "note"], at, err);
    if (!SLUG.test(r.id ?? "")) err(`${at}.id`, "lowercase id");
    else routes.add(r.id);
    if (!isStr(r.name)) err(`${at}.name`, "the route's name");
    if (r.note !== undefined && !isStr(r.note)) err(`${at}.note`, "one line");
    const ok = Array.isArray(r.points) && r.points.length >= 4 && r.points.every((/** @type {any} */ p) => Array.isArray(p) && (p.length === 2 || p.length === 3)
      && isNum(p[0], 49, 61) && isNum(p[1], -9, 2.5) && (p.length === 2 || isNum(p[2], -50, 1400)));
    if (!ok) err(`${at}.points`, "four or more [lat, lng] or [lat, lng, metres] points in the UK, from the route's GPX file");
  });
  if (!Array.isArray(c.runs) || !c.runs.length) { err("club.runs", "the club's weekly runs"); return; }
  const seen = new Set();
  c.runs.forEach((/** @type {any} */ r, /** @type {number} */ i) => {
    const at = `club.runs[${i}]`;
    if (!isObj(r)) { err(at, "an object"); return; }
    onlyKeys(r, ["id", "day", "time", "minutes", "title", "text", "meet", "route", "km"], at, err);
    if (!SLUG.test(r.id ?? "") || seen.has(r.id)) err(`${at}.id`, "a unique lowercase id");
    seen.add(r.id);
    if (!DAY_KEYS.includes(r.day)) err(`${at}.day`, `one of ${DAY_KEYS.join(", ")}`);
    if (!isTime(r.time)) err(`${at}.time`, '"HH:MM" on the brand\'s clock');
    if (!isInt(r.minutes, 10, 480)) err(`${at}.minutes`, "roughly how long it takes, in minutes (for the calendar)");
    if (!isStr(r.title)) err(`${at}.title`, "e.g. Park loop");
    if (!isStr(r.text)) err(`${at}.text`, "distance and pace, in a line");
    if (!isStr(r.meet)) err(`${at}.meet`, "where to meet");
    if (r.km !== undefined && !isNum(r.km, 1, 100)) err(`${at}.km`, "distance in km");
    if (r.route !== undefined && !routes.has(r.route)) err(`${at}.route`, `"${r.route}" isn't one of club.routes`);
  });
}

/** @param {any} w @param {boolean} demo @param {Report} err @param {(id: any, at: string) => void} pieceRef */
function checkWeather(w, demo, err, pieceRef) {
  if (!isObj(w)) { err("weather", "{ place, lat, lng, looks }"); return; }
  onlyKeys(w, ["place", "lat", "lng", "looks", "apiKey"], "weather", err);
  // Open-Meteo's free API is non-commercial only: a brand's site needs its own paid plan's key; a demo makes no call.
  if (demo && w.apiKey !== undefined) err("weather.apiKey", "a demo shows its example forecast and calls nothing; remove the key");
  if (!demo && !/^[A-Za-z0-9]{8,64}$/.test(w.apiKey ?? "")) err("weather.apiKey", "the key of the brand's own paid Open-Meteo plan (the free API is for non-commercial use only)");
  if (!isStr(w.place)) err("weather.place", "the city the forecast is for, e.g. London");
  if (!isNum(w.lat, 49, 61) || !isNum(w.lng, -9, 2.5)) err("weather", "lat and lng of the brand's city, in the UK");
  if (!isObj(w.looks)) { err("weather.looks", "{ wet, windy, cold, mild }: each { say, pieces }"); return; }
  onlyKeys(w.looks, ["wet", "windy", "cold", "mild"], "weather.looks", err);
  for (const k of ["wet", "windy", "cold", "mild"]) {
    const l = w.looks[k];
    const at = `weather.looks.${k}`;
    if (!isObj(l)) { err(at, "{ say, pieces }"); continue; }
    onlyKeys(l, ["say", "pieces", "with"], at, err);
    if (!isStr(l.say)) err(`${at}.say`, 'what to wear, in a short sentence, e.g. "Wear the shell, hood up."');
    if (!Array.isArray(l.pieces) || !l.pieces.length) err(`${at}.pieces`, "one or more piece ids");
    else l.pieces.forEach((/** @type {any} */ id, /** @type {number} */ i) => pieceRef(id, `${at}.pieces[${i}]`));
    if (l.with !== undefined && (!Array.isArray(l.with) || !l.with.every(isStr))) err(`${at}.with`, "other things to wear, as words");
  }
}

/** @param {any} lb @param {Report} err @param {(id: any, at: string) => void} pieceRef */
function checkLookbook(lb, err, pieceRef) {
  if (!isObj(lb)) { err("lookbook", "{ title, season, looks }"); return; }
  onlyKeys(lb, ["title", "season", "credit", "looks"], "lookbook", err);
  if (!isStr(lb.title)) err("lookbook.title", "the book's title, e.g. In weather");
  if (!isStr(lb.season)) err("lookbook.season", "e.g. Autumn and winter 2026");
  if (lb.credit !== undefined && !isStr(lb.credit)) err("lookbook.credit", "who shot it");
  if (!Array.isArray(lb.looks) || lb.looks.length < 4) { err("lookbook.looks", "four or more looks"); return; }
  lb.looks.forEach((/** @type {any} */ l, /** @type {number} */ i) => {
    const at = `lookbook.looks[${i}]`;
    if (!isObj(l)) { err(at, "an object"); return; }
    onlyKeys(l, ["photo", "caption", "pieces"], at, err);
    photo(l.photo, `${at}.photo`, err);
    if (l.caption !== undefined && !isStr(l.caption)) err(`${at}.caption`, "a few words");
    (l.pieces ?? []).forEach((/** @type {any} */ p, /** @type {number} */ j) => {
      const pp = `${at}.pieces[${j}]`;
      if (!isObj(p)) { err(pp, "{ id, x, y }"); return; }
      onlyKeys(p, ["id", "x", "y"], pp, err);
      pieceRef(p.id, `${pp}.id`);
      if (!isNum(p.x, 0, 100) || !isNum(p.y, 0, 100)) err(pp, "x and y: where the piece is in the photo, in % from the top left");
    });
  });
}

/** @param {any} q @param {boolean} demo @param {Report} err */
function checkDropQueue(q, demo, err) {
  if (!isObj(q)) { err("dropQueue", "{ source, csvUrl, staleAfterMinutes, minutesEach }"); return; }
  onlyKeys(q, ["source", "csvUrl", "staleAfterMinutes", "minutesEach", "fixed", "how"], "dropQueue", err);
  if (!["sheet", "fixed"].includes(q.source)) err("dropQueue.source", '"sheet" or "fixed" (demo only)');
  if (q.source === "fixed" && !demo) err("dropQueue.source", "fixed numbers are for demos; use the staff's sheet");
  if (q.source === "sheet" && !SHEET.test(q.csvUrl ?? "")) err("dropQueue.csvUrl", "a published Google Sheet CSV link");
  if (!isInt(q.staleAfterMinutes, 5, 120)) err("dropQueue.staleAfterMinutes", "after how many minutes without an update the line goes quiet");
  if (!isNum(q.minutesEach, 0.5, 30)) err("dropQueue.minutesEach", "roughly how many minutes each person takes at the door, from the brand");
  if (!isStr(q.how)) err("dropQueue.how", "how tickets work, in a line");
  if (q.source === "fixed" && (!isObj(q.fixed) || !isInt(q.fixed.serving, 0, 9999) || !isInt(q.fixed.given, q.fixed.serving ?? 0, 9999))) err("dropQueue.fixed", "{ serving, given, note? } for the demo");
}
