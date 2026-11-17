// @ts-check
/**
 * Validation for the stalls kit (street-food and dessert stalls). Every stop, price, allergen, figure and rating is the
 * stall's own; these checks keep them whole and consistent, refuse unknown settings rather than ignore them, and refuse
 * simulated data on a client site.
 */
import { ALLERGENS, DAYS } from "./lib/stalls.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @typedef {((rel: string) => boolean)|undefined} Exists */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
/** @param {any} v @param {number} lo @param {number} hi */
const isNum = (v, lo, hi) => typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi;
const ID = /^[a-z0-9-]{1,40}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const YMD = /^\d{4}-\d{2}-\d{2}$/;
const SHEET = /^https:\/\/docs\.google\.com\/spreadsheets\/.+output=csv/;
const POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?( \d[A-Z]{2})?$/i;

/** @param {Report} err @param {string} path @param {any} v */
function text(err, path, v) { if (!isStr(v)) err(path, "required text is missing"); }
/** @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (isObj(o)) for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}
/** @param {Report} err @param {string} path @param {any} v @param {string} what @returns {v is any[]} */
function list(err, path, v, what) {
  if (Array.isArray(v) && v.length) return true;
  err(path, `at least one ${what}`);
  return false;
}
/** @param {Report} err @param {string} path @param {any[]} items */
function ids(err, path, items) {
  const seen = new Set();
  items.forEach((x, i) => {
    if (!ID.test(x?.id ?? "")) err(`${path}[${i}].id`, "lowercase letters, numbers and dashes");
    else if (seen.has(x.id)) err(`${path}[${i}].id`, `"${x.id}" is used twice`);
    seen.add(x?.id);
  });
}
/** @param {Report} err @param {string} path @param {any} p @param {Exists} exists */
function photo(err, path, p, exists) {
  if (!isObj(p)) { err(path, "a photo: { src, width, height, alt }"); return; }
  onlyKeys(p, ["src", "width", "height", "alt", "focus", "small"], path, err);
  text(err, `${path}.alt`, p.alt);
  if (!Number.isInteger(p.width) || !Number.isInteger(p.height)) err(path, "width and height in pixels");
  if (p.focus !== undefined && !/^\d{1,3}% \d{1,3}%$/.test(p.focus)) err(`${path}.focus`, 'where the subject sits, e.g. "50% 30%"');
  for (const [k, v] of [["src", p.src], ["small.src", p.small?.src]]) {
    if (k === "small.src" && p.small === undefined) continue;
    if (!isStr(v) || !/^img\/[\w./-]+\.(webp|jpe?g|png)$/.test(v)) err(`${path}.${k}`, "a file in img/ (webp, jpg or png)");
    else if (exists && !exists(v)) err(`${path}.${k}`, `file not found: ${v}`);
  }
  if (p.small !== undefined) {
    onlyKeys(p.small, ["src", "width"], `${path}.small`, err);
    if (!Number.isInteger(p.small?.width) || !(p.small.width < p.width)) err(`${path}.small.width`, "the copy's width in pixels, smaller than the photo's");
  }
}
/** @param {Report} err @param {string} path @param {any} o @param {string[]} [keys] */
function pageHead(err, path, o, keys = []) {
  if (!isObj(o)) { err(path, `{ ${["title", "intro", ...keys].join(", ")} }`); return false; }
  onlyKeys(o, ["title", "intro", ...keys], path, err);
  text(err, `${path}.title`, o.title);
  if (o.intro !== undefined) text(err, `${path}.intro`, o.intro);
  return true;
}
/** A live-data source: the stall's published sheet, or the demo's simulation. @param {Report} err @param {string} at @param {any} o @param {string} mode */
function source(err, at, o, mode) {
  if (!["sheet", "simulated"].includes(o?.source)) err(`${at}.source`, 'must be "sheet" (or "simulated" on demo sites)');
  if (o?.source === "simulated" && mode !== "demo") err(`${at}.source`, 'simulated data is only allowed on demo sites; use "sheet"');
  if (o?.source === "sheet" && !SHEET.test(o.csvUrl ?? "")) err(`${at}.csvUrl`, "must be a published Google Sheet CSV link (File → Share → Publish to web → CSV)");
  if (o?.source === "simulated" && o.csvUrl !== undefined) err(`${at}.csvUrl`, "a simulated source has no sheet");
}

/** @param {any} site @param {Report} err @param {Exists} [exists] */
export function checkStalls(site, err, exists) {
  if (site.kit !== "stalls") return;
  const features = /** @type {string[]} */ (Array.isArray(site.features) ? site.features : []);
  if (site.look === "spun") checkHero(site.hero, err, exists);
  if (site.stops !== undefined) checkStops(site.stops, site.mode, features, err, exists);
  if (site.menu !== undefined) checkMenu(site.menu, err, exists);
  if (site.menuPage !== undefined) pageHead(err, "menuPage", site.menuPage, ["packages"]) && checkPackages(site.menuPage.packages, err);
  if (site.findPage !== undefined) pageHead(err, "findPage", site.findPage);
  if (site.posts !== undefined) checkPosts(site.posts, site.mode, err, exists);
  if (site.party !== undefined) checkParty(site.party, site.mode, err);
  if (site.bookPage !== undefined) pageHead(err, "bookPage", site.bookPage);
  if (site.partiesPage !== undefined) checkPartiesPage(site.partiesPage, err, exists);
  if (site.allergensPage !== undefined) checkAllergensPage(site.allergensPage, err);
  if (site.soldOut !== undefined) { onlyKeys(site.soldOut, ["source", "csvUrl"], "soldOut", err); source(err, "soldOut", site.soldOut, site.mode); }
  if (site.rain !== undefined) {
    onlyKeys(site.rain, ["source"], "rain", err);
    if (!["forecast", "simulated"].includes(site.rain?.source)) err("rain.source", 'must be "forecast" (or "simulated" on demo sites)');
    if (site.rain?.source === "simulated" && site.mode !== "demo") err("rain.source", 'simulated data is only allowed on demo sites; use "forecast"');
    if (features.includes("stalls-rain") && !(site.stops?.places ?? []).some((/** @type {any} */ p) => isNum(p?.lat, 49, 61) && isNum(p?.lon, -9, 2.5))) err("stops.places", "the rain check needs lat and lon on each market it forecasts");
  }
  if (site.setup !== undefined) checkSetup(site.setup, err);
  if (site.drop !== undefined) checkDrop(site.drop, err, exists);
}

/** The Spun hero: one short line, the stall in action, credited. @param {any} h @param {Report} err @param {Exists} exists */
function checkHero(h, err, exists) {
  if (!isObj(h)) return; // the core check reports it
  onlyKeys(h, ["kicker", "title", "intro", "photo", "credit"], "hero", err);
  text(err, "hero.intro", h.intro);
  photo(err, "hero.photo", h.photo, exists);
  if (h.credit !== undefined) text(err, "hero.credit", h.credit);
}

/** @param {any} s @param {string} mode @param {string[]} features @param {Report} err @param {Exists} exists */
function checkStops(s, mode, features, err, exists) {
  if (!isObj(s)) { err("stops", "{ source, csvUrl, places, usual, fallback }"); return; }
  onlyKeys(s, ["source", "csvUrl", "staleAfterDays", "places", "usual", "fallback"], "stops", err);
  source(err, "stops", s, mode);
  if (s.staleAfterDays !== undefined && !(Number.isInteger(s.staleAfterDays) && s.staleAfterDays >= 1 && s.staleAfterDays <= 60)) err("stops.staleAfterDays", "days after which an unchanged sheet stops showing as this week's: 1 to 60");
  text(err, "stops.fallback", s.fallback);
  const places = list(err, "stops.places", s.places, "place: { id, name, market?, postcode, lat?, lon?, usual?, pitch? }") ? s.places : [];
  ids(err, "stops.places", places);
  places.forEach((/** @type {any} */ p, /** @type {number} */ i) => {
    const at = `stops.places[${i}]`;
    onlyKeys(p, ["id", "name", "market", "postcode", "lat", "lon", "usual", "pitch"], at, err);
    text(err, `${at}.name`, p?.name);
    if (p?.market !== undefined) text(err, `${at}.market`, p.market);
    if (!POSTCODE.test(p?.postcode ?? "")) err(`${at}.postcode`, "a UK postcode or its district, e.g. \"E8\" or \"E8 4QJ\"");
    if ((p?.lat === undefined) !== (p?.lon === undefined)) err(at, "lat and lon go together");
    if (p?.lat !== undefined && (!isNum(p.lat, 49, 61) || !isNum(p.lon, -9, 2.5))) err(at, "lat and lon in the UK");
    if (p?.usual !== undefined) text(err, `${at}.usual`, p.usual);
    if (p?.pitch !== undefined) {
      onlyKeys(p.pitch, ["photo", "line"], `${at}.pitch`, err);
      photo(err, `${at}.pitch.photo`, p.pitch?.photo, exists);
      text(err, `${at}.pitch.line`, p.pitch?.line);
    }
  });
  if (features.includes("stalls-pitch") && !places.some((/** @type {any} */ p) => p?.pitch)) err("stops.places", "the pitch finder needs a pitch { photo, line } on at least one place");
  const known = new Set(places.map((/** @type {any} */ p) => p?.id));
  if (list(err, "stops.usual", s.usual, "usual stop: { day, place, open, close }")) s.usual.forEach((/** @type {any} */ u, /** @type {number} */ i) => {
    const at = `stops.usual[${i}]`;
    onlyKeys(u, ["day", "place", "open", "close"], at, err);
    if (!DAYS.includes(u?.day)) err(`${at}.day`, `one of ${DAYS.join(", ")}`);
    if (!known.has(u?.place)) err(`${at}.place`, "the id of one of stops.places");
    if (!TIME.test(u?.open ?? "") || !TIME.test(u?.close ?? "")) err(at, 'open and close as "HH:MM"');
    else if (u.close <= u.open) err(`${at}.close`, "after it opens (a stop that runs past midnight closes at 23:59)");
  });
}

/** @param {any} m @param {Report} err @param {Exists} exists */
function checkMenu(m, err, exists) {
  if (!isObj(m)) { err("menu", "{ items, note? }"); return; }
  onlyKeys(m, ["items", "note", "key", "photo"], "menu", err);
  if (m.photo !== undefined) photo(err, "menu.photo", m.photo, exists);
  if (m.note !== undefined) text(err, "menu.note", m.note);
  if (m.key !== undefined) text(err, "menu.key", m.key);
  const items = list(err, "menu.items", m.items, "item: { id, name, line, price, allergens }") ? m.items : [];
  ids(err, "menu.items", items);
  const names = new Set();
  items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `menu.items[${i}]`;
    onlyKeys(x, ["id", "name", "line", "price", "allergens", "vegan", "photo"], at, err);
    text(err, `${at}.name`, x?.name);
    if (names.has(String(x?.name).toLowerCase())) err(`${at}.name`, "two items share this name; sold-out lines match by name");
    names.add(String(x?.name).toLowerCase());
    if (x?.line !== undefined) text(err, `${at}.line`, x.line);
    if (!isNum(x?.price, 0.5, 200)) err(`${at}.price`, "the price in pounds");
    if (typeof x?.allergens !== "string") err(`${at}.allergens`, `the allergen codes from the stall's chart, e.g. "G E M" (${Object.keys(ALLERGENS).join(" ")}), or "" for none`);
    else for (const c of x.allergens.split(/\s+/).filter(Boolean)) if (!(c in ALLERGENS)) err(`${at}.allergens`, `"${c}" isn't one of ${Object.keys(ALLERGENS).join(" ")}`);
    if (x?.vegan !== undefined && typeof x.vegan !== "boolean") err(`${at}.vegan`, "true or false");
    if (x?.photo !== undefined) photo(err, `${at}.photo`, x.photo, exists);
  });
}

/** @param {any} p @param {Report} err */
function checkPackages(p, err) {
  if (p === undefined) return;
  if (!list(err, "menuPage.packages", p, "package: { name, line, price }")) return;
  p.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    onlyKeys(x, ["name", "line", "price", "from"], `menuPage.packages[${i}]`, err);
    text(err, `menuPage.packages[${i}].name`, x?.name);
    text(err, `menuPage.packages[${i}].line`, x?.line);
    if (!isNum(x?.price, 1, 20000)) err(`menuPage.packages[${i}].price`, "the price in pounds");
    if (x?.from !== undefined && typeof x.from !== "boolean") err(`menuPage.packages[${i}].from`, "true when the price is a starting price");
  });
}

/** @param {any} p @param {string} mode @param {Report} err @param {Exists} exists */
function checkPosts(p, mode, err, exists) {
  if (!isObj(p)) { err("posts", "{ tiktok, tiktokProfile }"); return; }
  onlyKeys(p, ["tiktok", "tiktokProfile", "instagramProfile"], "posts", err);
  const tiktok = /^https:\/\/(www\.)?tiktok\.com\/@[\w.]+(\/video\/\d+)?\/?$/;
  // A demo is fictional: it links to no real account, so its covers show without links.
  const demo = mode === "demo";
  if (demo && (p.tiktokProfile !== undefined || p.instagramProfile !== undefined || (p.tiktok ?? []).some((/** @type {any} */ t) => t?.href !== undefined))) err("posts", "demo sites are fictional and must not link to a real TikTok or Instagram account; leave out the links");
  if (!demo && !tiktok.test(p.tiktokProfile ?? "")) err("posts.tiktokProfile", "the stall's TikTok profile link, https://www.tiktok.com/@name");
  if (p.instagramProfile !== undefined && !/^https:\/\/(www\.)?instagram\.com\/[\w.]+\/?$/.test(p.instagramProfile)) err("posts.instagramProfile", "https://www.instagram.com/name");
  if (list(err, "posts.tiktok", p.tiktok, "TikTok: { href, line, cover }")) p.tiktok.forEach((/** @type {any} */ t, /** @type {number} */ i) => {
    onlyKeys(t, ["href", "line", "cover"], `posts.tiktok[${i}]`, err);
    if (!demo && !tiktok.test(t?.href ?? "")) err(`posts.tiktok[${i}].href`, "a TikTok link: https://www.tiktok.com/@name/video/123");
    text(err, `posts.tiktok[${i}].line`, t?.line);
    photo(err, `posts.tiktok[${i}].cover`, t?.cover, exists);
  });
}

/** @param {any} p @param {string} mode @param {Report} err */
function checkParty(p, mode, err) {
  if (!isObj(p)) { err("party", "{ source, csvUrl, message, kinds, lead? }"); return; }
  onlyKeys(p, ["source", "csvUrl", "staleAfterDays", "message", "kinds", "lead"], "party", err);
  source(err, "party", p, mode);
  if (p.staleAfterDays !== undefined && !(Number.isInteger(p.staleAfterDays) && p.staleAfterDays >= 1 && p.staleAfterDays <= 90)) err("party.staleAfterDays", "1 to 90");
  text(err, "party.message", p.message);
  if (p.lead !== undefined) text(err, "party.lead", p.lead);
  if (list(err, "party.kinds", p.kinds, "kind of party, e.g. \"Birthday\"")) p.kinds.forEach((/** @type {any} */ k, /** @type {number} */ i) => text(err, `party.kinds[${i}]`, k));
}

/** @param {any} o @param {Report} err @param {Exists} exists */
function checkPartiesPage(o, err, exists) {
  if (!pageHead(err, "partiesPage", o, ["blocks", "photo"])) return;
  if (o.photo !== undefined) photo(err, "partiesPage.photo", o.photo, exists);
  if (list(err, "partiesPage.blocks", o.blocks, "block: { title, text }")) o.blocks.forEach((/** @type {any} */ b, /** @type {number} */ i) => {
    onlyKeys(b, ["title", "text"], `partiesPage.blocks[${i}]`, err);
    text(err, `partiesPage.blocks[${i}].title`, b?.title);
    text(err, `partiesPage.blocks[${i}].text`, b?.text);
  });
}

/** The food hygiene rating is the stall's own, linked to its listing, with the month it was checked. @param {any} o @param {Report} err */
function checkAllergensPage(o, err) {
  if (!pageHead(err, "allergensPage", o, ["crossContact", "hygiene"])) return;
  text(err, "allergensPage.crossContact", o.crossContact);
  const h = o.hygiene;
  if (!isObj(h)) { err("allergensPage.hygiene", "{ rating, url, checked }"); return; }
  onlyKeys(h, ["rating", "url", "checked"], "allergensPage.hygiene", err);
  // England, Wales and Northern Ireland rate 0 to 5; Scotland's scheme (FHIS) shows "Pass" or "Improvement Required".
  if (!(Number.isInteger(h.rating) && h.rating >= 0 && h.rating <= 5) && !["awaiting", "pass", "improvement required"].includes(h.rating)) err("allergensPage.hygiene.rating", 'the rating on the stall\'s listing: 0 to 5, "awaiting", or in Scotland "pass" or "improvement required"');
  if (!/^https:\/\/ratings\.food\.gov\.uk\//.test(h.url ?? "")) err("allergensPage.hygiene.url", "the stall's own listing on ratings.food.gov.uk");
  if (!/^\d{4}-\d{2}$/.test(h.checked ?? "")) err("allergensPage.hygiene.checked", 'the month it was checked, "YYYY-MM"');
}

/** @param {any} s @param {Report} err */
function checkSetup(s, err) {
  if (!isObj(s)) { err("setup", "{ rows, intro? }"); return; }
  onlyKeys(s, ["rows", "intro"], "setup", err);
  if (s.intro !== undefined) text(err, "setup.intro", s.intro);
  if (list(err, "setup.rows", s.rows, "row: { label, value }")) s.rows.forEach((/** @type {any} */ r, /** @type {number} */ i) => {
    onlyKeys(r, ["label", "value"], `setup.rows[${i}]`, err);
    text(err, `setup.rows[${i}].label`, r?.label);
    text(err, `setup.rows[${i}].value`, r?.value);
  });
}

/** @param {any} d @param {Report} err @param {Exists} exists */
function checkDrop(d, err, exists) {
  if (!isObj(d)) { err("drop", "{ title, at, line, message, photo? }"); return; }
  onlyKeys(d, ["title", "at", "line", "message", "photo"], "drop", err);
  text(err, "drop.title", d.title);
  text(err, "drop.line", d.line);
  text(err, "drop.message", d.message);
  if (!YMD.test(d.at ?? "")) err("drop.at", 'the day of the drop, "YYYY-MM-DD"');
  if (d.photo !== undefined) photo(err, "drop.photo", d.photo, exists);
}
