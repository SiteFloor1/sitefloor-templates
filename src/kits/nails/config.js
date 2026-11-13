// @ts-check
/**
 * Validation for the nails kit (nail salons): the hands and their masks, the house shades, the menu by the hour, the
 * next free slot, nail art, shapes, the monthly edit, build your set, bridal, parties, infills and the finishes. Every
 * price, time and shade is the salon's own; the checks only make sure it is complete and can't mislead. A misspelt
 * setting is refused rather than silently ignored, and simulated data is refused on a client site.
 */
import { SYSTEMS, FINISHES, FAMILIES } from "./lib/shade.js";
import { SHAPES, LENGTHS } from "./lib/menu.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @typedef {((rel: string) => boolean)|undefined} Exists */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
/** @param {any} v @param {number} lo @param {number} hi */
const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const ID = /^[a-z0-9-]{1,40}$/;
const HEX = /^#[0-9A-Fa-f]{6}$/;
const PHOTO = ["src", "width", "height", "alt"];
const PAGE_HEAD = ["kicker", "title", "intro"];
export const EDIT_KINDS = { art: "Nail art", chrome: "Chrome", french: "French", colour: "Colour", ombre: "Ombré", gems: "Gems" };

/** @param {Report} err @param {string} path @param {any} v */
function text(err, path, v) { if (!isStr(v)) err(path, "required text is missing"); }

/** @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (isObj(o)) for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}

/** @param {Report} err @param {string} path @param {any} p @param {Exists} exists @param {string[]} [keys] */
function photo(err, path, p, exists, keys = PHOTO) {
  if (!isObj(p)) { err(path, "a photo: { src, width, height, alt }"); return; }
  onlyKeys(p, keys, path, err);
  text(err, `${path}.alt`, p.alt);
  if (!isInt(p.width, 1, 10000) || !isInt(p.height, 1, 10000)) err(path, "width and height in pixels");
  file(err, `${path}.src`, p.src, exists);
}

/** @param {Report} err @param {string} path @param {any} src @param {Exists} exists */
function file(err, path, src, exists) {
  if (!isStr(src)) err(path, "required");
  else if (exists && !exists(src)) err(path, `file not found: ${src}`);
}

/** Unique ids in a list. @param {Report} err @param {string} path @param {any[]} list @returns {Set<string>} */
function ids(err, path, list) {
  /** @type {Set<string>} */ const seen = new Set();
  list.forEach((x, i) => {
    if (!ID.test(x?.id ?? "")) err(`${path}[${i}].id`, "lowercase letters, numbers and dashes");
    else if (seen.has(x.id)) err(`${path}[${i}].id`, `"${x.id}" is used twice`);
    seen.add(x?.id);
  });
  return seen;
}

/** A price in whole pounds, and a time in minutes (5 to 300, in fives). @param {Report} err @param {string} p @param {any} x */
function priceAndTime(err, p, x) {
  if (!isInt(x?.price, 1, 5000)) err(`${p}.price`, "the salon's price in whole pounds");
  if (!isInt(x?.minutes, 5, 300) || x.minutes % 5) err(`${p}.minutes`, "how long it takes, in minutes (a multiple of 5)");
  if (x?.from !== undefined && typeof x.from !== "boolean") err(`${p}.from`, "true when the price is a starting price");
}

/** @param {any} site @param {Report} err @param {Exists} [exists] */
export function checkNails(site, err, exists) {
  if (site.kit !== "nails") return;
  const on = (/** @type {string} */ id) => Array.isArray(site.features) && site.features.includes(id);
  const shades = checkShades(site.shades, err);
  checkHero(site.hero, shades, on("shade-on-hand"), err, exists);
  if (site.nextSlot !== undefined) checkSlot(site.nextSlot, site.mode, err);
  const menuItems = site.menu !== undefined ? checkMenu(site.menu, err, exists) : new Set();
  for (const k of ["menuPage", "shadesPage", "artPage", "shapesPage", "bridalPage", "giftPage"]) if (site[k] !== undefined) {
    onlyKeys(site[k], [...PAGE_HEAD, ...(k === "menuPage" ? ["policies"] : [])], k, err); text(err, `${k}.title`, site[k]?.title);
  }
  (site.menuPage?.policies ?? []).forEach((/** @type {any} */ p, /** @type {number} */ i) => { onlyKeys(p, ["title", "text"], `menuPage.policies[${i}]`, err); text(err, `menuPage.policies[${i}].title`, p?.title); text(err, `menuPage.policies[${i}].text`, p?.text); });
  if (site.gelBiab !== undefined) checkGelBiab(site.gelBiab, err);
  if (site.salon !== undefined) { onlyKeys(site.salon, ["wall", "detail", "caption"], "salon", err); photo(err, "salon.wall", site.salon?.wall, exists); photo(err, "salon.detail", site.salon?.detail, exists); text(err, "salon.caption", site.salon?.caption); }
  if (site.edit !== undefined) checkEdit(site.edit, err, exists);
  const levels = site.art !== undefined ? checkArt(site.art, err, exists) : new Set();
  if (site.shapes !== undefined) checkShapes(site.shapes, site.art, err);
  if (site.buildSet !== undefined) checkBuild(site.buildSet, levels, err);
  if (site.bridal !== undefined) checkBridal(site.bridal, err, exists);
  if (site.parties !== undefined) checkParties(site.parties, menuItems, err);
  if (site.infill !== undefined) checkInfill(site.infill, err);
  if (site.yourUsual !== undefined) { onlyKeys(site.yourUsual, ["message"], "yourUsual", err); text(err, "yourUsual.message", site.yourUsual?.message); }
  if (site.finishes !== undefined) checkFinishes(site.finishes, err, exists);
}

/** @param {any} s @param {Report} err @returns {Set<string>} the shades' ids */
function checkShades(s, err) {
  if (s === undefined) return new Set();
  if (!isObj(s) || !Array.isArray(s.items) || !s.items.length) { err("shades.items", "the salon's shades, e.g. { id, no, name, hex, system, finish, family }"); return new Set(); }
  onlyKeys(s, ["items", "rail"], "shades", err);
  const out = ids(err, "shades.items", s.items);
  /** @type {Set<number>} */ const nos = new Set();
  s.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `shades.items[${i}]`;
    onlyKeys(x, ["id", "no", "name", "hex", "system", "finish", "family", "note"], p, err);
    text(err, `${p}.name`, x?.name);
    if (!isInt(x?.no, 1, 9999)) err(`${p}.no`, "the shade's number in the salon's range");
    else if (nos.has(x.no)) err(`${p}.no`, `No. ${x.no} is used twice`); else nos.add(x.no);
    if (!HEX.test(x?.hex ?? "")) err(`${p}.hex`, 'the shade\'s colour as "#RRGGBB", matched to the bottle in daylight');
    for (const [k, words] of /** @type {[string, Record<string, string>][]} */ ([["system", SYSTEMS], ["finish", FINISHES], ["family", FAMILIES]])) if (!(x?.[k] in words)) err(`${p}.${k}`, `one of ${Object.keys(words).join(", ")}`);
    if (x?.note !== undefined) text(err, `${p}.note`, x.note);
  });
  if (s.rail !== undefined) {
    if (!Array.isArray(s.rail) || s.rail.length < 3 || s.rail.length > 14) err("shades.rail", "3 to 14 shade ids, the order they sit on the home page");
    else s.rail.forEach((/** @type {any} */ id, /** @type {number} */ i) => { if (!out.has(id)) err(`shades.rail[${i}]`, `"${id}" isn't one of the shades`); });
  }
  return out;
}

/**
 * The hands in the hero. Starter and Plus fade between real photos of one hand in a few shades (`shots`); Signature
 * lays any shade into the nails of each hand from a hand-drawn mask.
 * @param {any} h @param {Set<string>} shades @param {boolean} masks @param {Report} err @param {Exists} exists
 */
function checkHero(h, shades, masks, err, exists) {
  if (!isObj(h)) { err("hero", "{ kicker, title, hands }"); return; }
  onlyKeys(h, ["kicker", "title", "intro", "hands"], "hero", err);
  text(err, "hero.kicker", h.kicker);
  text(err, "hero.title", h.title);
  if (!Array.isArray(h.hands) || !h.hands.length || h.hands.length > 4) { err("hero.hands", "1 to 4 hands, each { id, label, src, width, height, alt, wearing }"); return; }
  ids(err, "hero.hands", h.hands);
  h.hands.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `hero.hands[${i}]`;
    photo(err, p, x, exists, ["id", "label", "src", "width", "height", "alt", "wearing", "mask", "shots"]);
    text(err, `${p}.label`, x?.label);
    if (!shades.has(x?.wearing)) err(`${p}.wearing`, "the id of the shade this hand is wearing in the photo");
    if (masks) file(err, `${p}.mask`, x?.mask, exists);
    else if (x?.mask !== undefined) file(err, `${p}.mask`, x.mask, exists);
    if (x?.shots !== undefined) {
      if (!Array.isArray(x.shots) || x.shots.length < 2 || x.shots.length > 5) err(`${p}.shots`, "2 to 5 more photos of this hand, each in another shade: { shade, src }");
      else x.shots.forEach((/** @type {any} */ s, /** @type {number} */ j) => { onlyKeys(s, ["shade", "src"], `${p}.shots[${j}]`, err); if (!shades.has(s?.shade)) err(`${p}.shots[${j}].shade`, "one of the shades' ids"); file(err, `${p}.shots[${j}].src`, s?.src, exists); });
    }
  });
  if (!masks && !Array.isArray(h.hands[0]?.shots)) err("hero.hands[0].shots", "Starter and Plus fade between photos of this hand in other shades: add 2 to 5 { shade, src }");
}

/** @param {any} n @param {string} mode @param {Report} err */
function checkSlot(n, mode, err) {
  if (!isObj(n)) { err("nextSlot", "{ source, csvUrl, staleAfterMinutes }"); return; }
  onlyKeys(n, ["source", "csvUrl", "staleAfterMinutes"], "nextSlot", err);
  if (!["sheet", "simulated"].includes(n.source)) err("nextSlot.source", 'must be "sheet" (or "simulated" on demo sites)');
  if (n.source === "simulated" && mode !== "demo") err("nextSlot.source", 'simulated data is only allowed on demo sites; use "sheet"');
  if (n.source === "sheet" && !/^https:\/\/docs\.google\.com\/spreadsheets\/.+output=csv/.test(n.csvUrl ?? "")) err("nextSlot.csvUrl", "must be a published Google Sheet CSV link (File → Share → Publish to web → CSV)");
  if (n.staleAfterMinutes !== undefined && !isInt(n.staleAfterMinutes, 15, 1440)) err("nextSlot.staleAfterMinutes", "whole minutes, 15–1440");
}

/** @param {any} m @param {Report} err @param {Exists} exists @returns {Set<string>} the menu items' ids */
function checkMenu(m, err, exists) {
  /** @type {Set<string>} */ const out = new Set();
  if (!isObj(m) || !Array.isArray(m.bands) || !m.bands.length) { err("menu.bands", "the menu by the hour: [{ minutes, items: [{ id, name, price }] }]"); return out; }
  onlyKeys(m, ["message", "bands", "note"], "menu", err);
  text(err, "menu.message", m.message);
  /** @type {Set<number>} */ const mins = new Set();
  m.bands.forEach((/** @type {any} */ b, /** @type {number} */ i) => {
    const p = `menu.bands[${i}]`;
    onlyKeys(b, ["minutes", "photo", "items"], p, err);
    if (!isInt(b?.minutes, 5, 300) || b.minutes % 5) err(`${p}.minutes`, "the band's length in minutes, a multiple of 5");
    else if (mins.has(b.minutes)) err(`${p}.minutes`, `two bands of ${b.minutes} minutes`); else mins.add(b.minutes);
    if (b?.photo !== undefined) photo(err, `${p}.photo`, b.photo, exists);
    if (!Array.isArray(b?.items) || !b.items.length) { err(`${p}.items`, "at least one treatment"); return; }
    b.items.forEach((/** @type {any} */ x, /** @type {number} */ j) => {
      const q = `${p}.items[${j}]`;
      onlyKeys(x, ["id", "name", "text", "price", "from"], q, err);
      if (!ID.test(x?.id ?? "")) err(`${q}.id`, "lowercase letters, numbers and dashes");
      else if (out.has(x.id)) err(`${q}.id`, `"${x.id}" is used twice`); else out.add(x.id);
      text(err, `${q}.name`, x?.name);
      if (!isInt(x?.price, 1, 5000)) err(`${q}.price`, "the salon's price in whole pounds");
      if (x?.from !== undefined && typeof x.from !== "boolean") err(`${q}.from`, "true when the price is a starting price");
    });
  });
  return out;
}

/** @param {any} g @param {Report} err */
function checkGelBiab(g, err) {
  if (!isObj(g)) { err("gelBiab", "{ options, rows, note? }"); return; }
  onlyKeys(g, ["options", "rows", "note"], "gelBiab", err);
  if (!Array.isArray(g.options) || g.options.length < 2 || g.options.length > 4) { err("gelBiab.options", "2 to 4 manicures to compare, e.g. { id: \"gel\", name: \"Gel\" }"); return; }
  const opts = ids(err, "gelBiab.options", g.options);
  g.options.forEach((/** @type {any} */ o, /** @type {number} */ i) => { onlyKeys(o, ["id", "name"], `gelBiab.options[${i}]`, err); text(err, `gelBiab.options[${i}].name`, o?.name); });
  if (!Array.isArray(g.rows) || !g.rows.length) err("gelBiab.rows", "what each is like: { label, values: { gel: \"…\", biab: \"…\" } }");
  else g.rows.forEach((/** @type {any} */ r, /** @type {number} */ i) => {
    onlyKeys(r, ["label", "values"], `gelBiab.rows[${i}]`, err);
    text(err, `gelBiab.rows[${i}].label`, r?.label);
    for (const id of opts) text(err, `gelBiab.rows[${i}].values.${id}`, r?.values?.[id]);
    if (isObj(r?.values)) for (const k of Object.keys(r.values)) if (!opts.has(k)) err(`gelBiab.rows[${i}].values.${k}`, "not one of the options");
  });
  if (g.note !== undefined) text(err, "gelBiab.note", g.note);
}

/** @param {any} e @param {Report} err @param {Exists} exists */
function checkEdit(e, err, exists) {
  if (!isObj(e)) { err("edit", "{ month, message, sets }"); return; }
  onlyKeys(e, ["month", "message", "sets"], "edit", err);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(e.month ?? "")) err("edit.month", '"YYYY-MM"; the edit shows from a month before until two weeks after');
  text(err, "edit.message", e.message);
  if (!Array.isArray(e.sets) || e.sets.length < 3 || e.sets.length > 4) { err("edit.sets", "three or four sets, each { id, name, kind, minutes, price, photo }"); return; }
  ids(err, "edit.sets", e.sets);
  e.sets.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `edit.sets[${i}]`;
    onlyKeys(x, ["id", "name", "kind", "text", "minutes", "price", "from", "photo"], p, err);
    text(err, `${p}.name`, x?.name);
    if (!(x?.kind in EDIT_KINDS)) err(`${p}.kind`, `one of ${Object.keys(EDIT_KINDS).join(", ")}`);
    priceAndTime(err, p, x);
    photo(err, `${p}.photo`, x?.photo, exists);
  });
}

/** @param {any} a @param {Report} err @param {Exists} exists @returns {Set<string>} the art levels' ids */
function checkArt(a, err, exists) {
  if (!isObj(a) || !Array.isArray(a.levels) || !a.levels.length) { err("art.levels", "the salon's art levels, e.g. { id: \"one\", name: \"Level one\", text }"); return new Set(); }
  onlyKeys(a, ["message", "levels", "items"], "art", err);
  text(err, "art.message", a.message);
  const levels = ids(err, "art.levels", a.levels);
  a.levels.forEach((/** @type {any} */ l, /** @type {number} */ i) => { onlyKeys(l, ["id", "name", "text"], `art.levels[${i}]`, err); text(err, `art.levels[${i}].name`, l?.name); text(err, `art.levels[${i}].text`, l?.text); });
  if (!Array.isArray(a.items) || !a.items.length) { err("art.items", "at least one set"); return levels; }
  ids(err, "art.items", a.items);
  a.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `art.items[${i}]`;
    onlyKeys(x, ["id", "name", "level", "shape", "length", "minutes", "price", "from", "photo"], p, err);
    text(err, `${p}.name`, x?.name);
    if (!levels.has(x?.level)) err(`${p}.level`, "one of the art levels' ids");
    if (!(x?.shape in SHAPES)) err(`${p}.shape`, `one of ${Object.keys(SHAPES).join(", ")}`);
    if (!(x?.length in LENGTHS)) err(`${p}.length`, `one of ${Object.keys(LENGTHS).join(", ")}`);
    priceAndTime(err, p, x);
    photo(err, `${p}.photo`, x?.photo, exists);
  });
  return levels;
}

/** @param {any} s @param {any} art @param {Report} err */
function checkShapes(s, art, err) {
  if (!isObj(s) || !Array.isArray(s.items) || !s.items.length) { err("shapes.items", "the shapes the salon files: { shape, text, suits, art? }"); return; }
  onlyKeys(s, ["items"], "shapes", err);
  const artIds = new Set((art?.items ?? []).map((/** @type {any} */ x) => x.id));
  /** @type {Set<string>} */ const seen = new Set();
  s.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `shapes.items[${i}]`;
    onlyKeys(x, ["shape", "text", "suits", "art"], p, err);
    if (!(x?.shape in SHAPES)) err(`${p}.shape`, `one of ${Object.keys(SHAPES).join(", ")}`);
    else if (seen.has(x.shape)) err(`${p}.shape`, `"${x.shape}" is listed twice`); else seen.add(x.shape);
    text(err, `${p}.text`, x?.text);
    text(err, `${p}.suits`, x?.suits);
    if (x?.art !== undefined && !artIds.has(x.art)) err(`${p}.art`, "the id of a nail-art set in this shape, shown as its photo");
  });
}

/** @param {any} b @param {Set<string>} levels @param {Report} err */
function checkBuild(b, levels, err) {
  if (!isObj(b)) { err("buildSet", "{ message, systems, lengths, finishes, art }"); return; }
  onlyKeys(b, ["message", "systems", "lengths", "finishes", "art"], "buildSet", err);
  text(err, "buildSet.message", b.message);
  const list = (/** @type {string} */ k, /** @type {string[]} */ keys, /** @type {(x: any, p: string) => void} */ each) => {
    if (!Array.isArray(b[k]) || !b[k].length) { err(`buildSet.${k}`, "at least one choice"); return; }
    b[k].forEach((/** @type {any} */ x, /** @type {number} */ i) => { onlyKeys(x, keys, `buildSet.${k}[${i}]`, err); each(x, `buildSet.${k}[${i}]`); });
  };
  list("systems", ["id", "name", "minutes", "price"], (x, p) => { text(err, `${p}.name`, x?.name); priceAndTime(err, p, x); });
  if (Array.isArray(b.systems)) ids(err, "buildSet.systems", b.systems);
  const add = (/** @type {any} */ x, /** @type {string} */ p) => {
    if (!isInt(x?.addMinutes, 0, 180) || x.addMinutes % 5) err(`${p}.addMinutes`, "minutes it adds, 0–180, a multiple of 5");
    if (!isInt(x?.addPrice, 0, 1000)) err(`${p}.addPrice`, "pounds it adds, 0–1000");
  };
  list("lengths", ["length", "addMinutes", "addPrice"], (x, p) => { if (!(x?.length in LENGTHS)) err(`${p}.length`, `one of ${Object.keys(LENGTHS).join(", ")}`); add(x, p); });
  list("finishes", ["id", "name", "addMinutes", "addPrice"], (x, p) => { text(err, `${p}.name`, x?.name); add(x, p); });
  if (Array.isArray(b.finishes)) ids(err, "buildSet.finishes", b.finishes);
  if (b.art !== undefined) {
    if (!Array.isArray(b.art)) err("buildSet.art", "a list of { level, name, addMinutes, addPrice }");
    else b.art.forEach((/** @type {any} */ x, /** @type {number} */ i) => { const p = `buildSet.art[${i}]`; onlyKeys(x, ["level", "name", "addMinutes", "addPrice"], p, err); if (!levels.has(x?.level)) err(`${p}.level`, "one of art.levels' ids"); text(err, `${p}.name`, x?.name); add(x, p); });
  }
}

/** @param {any} b @param {Report} err @param {Exists} exists */
function checkBridal(b, err, exists) {
  if (!isObj(b)) { err("bridal", "{ message, text, steps, photo? }"); return; }
  onlyKeys(b, ["message", "text", "steps", "photo"], "bridal", err);
  text(err, "bridal.message", b.message);
  text(err, "bridal.text", b.text);
  if (b.photo !== undefined) photo(err, "bridal.photo", b.photo, exists);
  if (!Array.isArray(b.steps) || !b.steps.length) { err("bridal.steps", "the salon's timings, e.g. { id: \"trial\", label: \"Your trial\", daysBefore: 42 }"); return; }
  ids(err, "bridal.steps", b.steps);
  b.steps.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    onlyKeys(s, ["id", "label", "daysBefore", "text"], `bridal.steps[${i}]`, err);
    text(err, `bridal.steps[${i}].label`, s?.label);
    if (!isInt(s?.daysBefore, 0, 365)) err(`bridal.steps[${i}].daysBefore`, "whole days before the wedding, 0–365");
  });
}

/** @param {any} p @param {Set<string>} menuItems @param {Report} err */
function checkParties(p, menuItems, err) {
  if (!isObj(p)) { err("parties", "{ message, occasions, min, max, treatments }"); return; }
  onlyKeys(p, ["message", "occasions", "min", "max", "treatments", "text"], "parties", err);
  text(err, "parties.message", p.message);
  text(err, "parties.text", p.text);
  if (!Array.isArray(p.occasions) || !p.occasions.length || !p.occasions.every(isStr)) err("parties.occasions", 'e.g. ["Hen party", "Bridal party"]');
  if (!isInt(p.min, 2, 50) || !isInt(p.max, 2, 50) || p.max < p.min) err("parties", "min and max people, 2–50, max at least min");
  if (!Array.isArray(p.treatments) || !p.treatments.length) err("parties.treatments", "ids of menu treatments a party can choose");
  else p.treatments.forEach((/** @type {any} */ id, /** @type {number} */ i) => { if (!menuItems.has(id)) err(`parties.treatments[${i}]`, `"${id}" isn't on the menu`); });
}

/** @param {any} f @param {Report} err */
function checkInfill(f, err) {
  if (!isObj(f)) { err("infill", "{ weeks, defaultWeeks, text }"); return; }
  onlyKeys(f, ["weeks", "defaultWeeks", "text"], "infill", err);
  text(err, "infill.text", f.text);
  if (!Array.isArray(f.weeks) || !f.weeks.length || !f.weeks.every((/** @type {any} */ w) => isInt(w, 1, 8))) err("infill.weeks", "the gaps the salon recommends, whole weeks, e.g. [2, 3, 4]");
  else if (!f.weeks.includes(f.defaultWeeks)) err("infill.defaultWeeks", "one of infill.weeks");
}

/** @param {any} f @param {Report} err @param {Exists} exists */
function checkFinishes(f, err, exists) {
  if (!isObj(f) || !Array.isArray(f.items) || !f.items.length) { err("finishes.items", "each finish: { id, name, text, still, clip? }"); return; }
  onlyKeys(f, ["items"], "finishes", err);
  ids(err, "finishes.items", f.items);
  f.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `finishes.items[${i}]`;
    onlyKeys(x, ["id", "name", "text", "still", "clip"], p, err);
    text(err, `${p}.name`, x?.name);
    text(err, `${p}.text`, x?.text);
    photo(err, `${p}.still`, x?.still, exists);
    if (x?.clip !== undefined) checkClip(x.clip, `${p}.clip`, err, exists);
  });
}

/** A finish's clip: a short silent macro clip, as .mp4 and/or .webm. @param {any} c @param {string} p @param {Report} err @param {Exists} exists */
function checkClip(c, p, err, exists) {
  onlyKeys(c, ["mp4", "webm"], p, err);
  if (!isObj(c) || (!c.mp4 && !c.webm)) { err(p, "a short silent macro clip: { mp4?, webm? }"); return; }
  for (const k of ["mp4", "webm"]) {
    if (c[k] === undefined) continue;
    if (!String(c[k]).endsWith(`.${k}`)) err(`${p}.${k}`, `a .${k} file`);
    file(err, `${p}.${k}`, c[k], exists);
  }
}
