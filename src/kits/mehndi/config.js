// @ts-check
/**
 * Validation for the mehndi kit (bridal and event mehndi artists): the palm in the hero and where its name is hidden,
 * the bridal packages, the date check and its sheet, the darkest-day lead, natural henna, the guest sum, the design
 * library, aftercare, the bridal page, the wedding week planner and the personal details request. Every price, hour
 * and rule is the artist's own; the checks only make sure it is complete and can't mislead. A misspelt setting is
 * refused rather than silently ignored, and simulated data is refused on a client site.
 */

/** @typedef {(path: string, msg: string) => void} Report */
/** @typedef {((rel: string) => boolean)|undefined} Exists */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
/** @param {any} v @param {number} lo @param {number} hi */
const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const ID = /^[a-z0-9-]{1,40}$/;
const PHOTO = ["src", "width", "height", "alt"];
const PAGE_HEAD = ["kicker", "title", "intro"];
export const STYLES = { traditional: "Traditional", arabic: "Arabic", "indo-arabic": "Indo-Arabic", contemporary: "Contemporary" };
export const COVERAGE = { palms: "Palms", wrist: "To the wrist", "mid-arm": "To mid-arm", elbow: "To the elbow", feet: "Feet", "back-hand": "Back of the hand" };
export const FOR = { bridal: "Bridal", guest: "Guests" };

/** @param {Report} err @param {string} path @param {any} v */
function text(err, path, v) { if (!isStr(v)) err(path, "required text is missing"); }

/** @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (isObj(o)) for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}

/** @param {Report} err @param {string} path @param {any} p @param {Exists} exists */
function photo(err, path, p, exists) {
  if (!isObj(p)) { err(path, "a photo: { src, width, height, alt }"); return; }
  onlyKeys(p, PHOTO, path, err);
  text(err, `${path}.alt`, p.alt);
  if (!isInt(p.width, 1, 10000) || !isInt(p.height, 1, 10000)) err(path, "width and height in pixels");
  if (!isStr(p.src)) err(`${path}.src`, "required");
  else if (exists && !exists(p.src)) err(`${path}.src`, `file not found: ${p.src}`);
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

/** @param {Report} err @param {string} p @param {any} x */
function price(err, p, x) {
  if (!isInt(x?.price, 1, 10000)) err(`${p}.price`, "the artist's price in whole pounds");
  if (x?.from !== undefined && typeof x.from !== "boolean") err(`${p}.from`, "true when the price is a starting price");
}

/** @param {Report} err @param {string} k @param {any} v @param {string[]} [more] */
function pageHead(err, k, v, more = []) {
  if (!isObj(v)) { err(k, "{ kicker, title, intro }"); return; }
  onlyKeys(v, [...PAGE_HEAD, ...more], k, err);
  text(err, `${k}.title`, v.title);
}

/** @param {any} site @param {Report} err @param {Exists} [exists] */
export function checkMehndi(site, err, exists) {
  if (site.kit !== "mehndi") return;
  checkHero(site.hero, err, exists);
  if (site.packages !== undefined) checkPackages(site.packages, err, exists);
  if (site.dateCheck !== undefined) checkDates(site.dateCheck, site.mode, err);
  if (site.darkest !== undefined) checkDarkest(site.darkest, err);
  if (site.natural !== undefined) checkNatural(site.natural, err);
  if (site.guests !== undefined) checkGuests(site.guests, err, exists);
  if (site.stainDays !== undefined) checkStainDays(site.stainDays, err, exists);
  if (site.designs !== undefined) checkDesigns(site.designs, err, exists);
  if (site.aftercare !== undefined) checkAftercare(site.aftercare, err, exists);
  if (site.planner !== undefined) checkPlanner(site.planner, err);
  if (site.personal !== undefined) checkPersonal(site.personal, err);
  for (const k of ["designsPage", "aftercarePage", "plannerPage", "personalPage"]) if (site[k] !== undefined) pageHead(err, k, site[k]);
  if (site.bridalPage !== undefined) checkBridalPage(site.bridalPage, err, exists);
}

/** @param {any} d @param {Report} err */
function checkDarkest(d, err) {
  onlyKeys(d, ["daysBefore", "when", "text"], "darkest", err);
  if (!isInt(d?.daysBefore, 1, 4)) err("darkest.daysBefore", "how many days before the wedding the artist suggests the mehndi, 1 to 4");
  if (d?.when !== undefined) text(err, "darkest.when", d.when);
  text(err, "darkest.text", d?.text);
}

/** @param {any} n @param {Report} err */
function checkNatural(n, err) {
  onlyKeys(n, ["paste", "stain", "patch"], "natural", err);
  text(err, "natural.paste", n?.paste);
  text(err, "natural.stain", n?.stain);
  if (n?.patch !== undefined) text(err, "natural.patch", n.patch);
}

/**
 * The palm in the hero, and where the name sits in it (percent across and down the photo, and how wide the ring is).
 * @param {any} h @param {Report} err @param {Exists} exists
 */
function checkHero(h, err, exists) {
  if (!isObj(h)) return; // the shared check reports a missing hero
  onlyKeys(h, ["kicker", "title", "intro", "palm", "find"], "hero", err);
  photo(err, "hero.palm", h.palm, exists);
  const f = h.find;
  if (!isObj(f)) { err("hero.find", "where the name is in the photo: { x, y, width, line } (x, y and width in percent)"); return; }
  onlyKeys(f, ["x", "y", "width", "line"], "hero.find", err);
  for (const k of ["x", "y"]) if (!isInt(f[k], 5, 95)) err(`hero.find.${k}`, "percent across (x) or down (y) the photo, 5 to 95");
  if (!isInt(f.width, 10, 60)) err("hero.find.width", "the ring's width, percent of the photo, 10 to 60");
  text(err, "hero.find.line", f.line);
}

/** @param {any} p @param {Report} err @param {Exists} exists */
function checkPackages(p, err, exists) {
  if (!isObj(p)) { err("packages", "{ message, items, photos }"); return; }
  onlyKeys(p, ["message", "label", "items", "photos", "wide", "note"], "packages", err);
  text(err, "packages.message", p.message);
  if (p.label !== undefined) text(err, "packages.label", p.label);
  if (!Array.isArray(p.items) || p.items.length < 1 || p.items.length > 6) err("packages.items", "1 to 6 bridal packages, each { id, name, text, hours, price, from? }");
  else {
    ids(err, "packages.items", p.items);
    p.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
      const q = `packages.items[${i}]`;
      onlyKeys(x, ["id", "name", "text", "hours", "price", "from"], q, err);
      text(err, `${q}.name`, x?.name);
      text(err, `${q}.text`, x?.text);
      if (typeof x?.hours !== "number" || x.hours < 0.5 || x.hours > 12 || (x.hours * 2) % 1) err(`${q}.hours`, "how long it takes, in hours (halves allowed), as the artist says");
      price(err, q, x);
    });
  }
  if (!Array.isArray(p.photos) || p.photos.length < 1 || p.photos.length > 2) err("packages.photos", "one or two tall photos of bridal mehndi");
  else p.photos.forEach((/** @type {any} */ x, /** @type {number} */ i) => photo(err, `packages.photos[${i}]`, x, exists));
  if (p.wide !== undefined) photo(err, "packages.wide", p.wide, exists);
  if (p.note !== undefined) text(err, "packages.note", p.note);
}

/** @param {any} d @param {string} mode @param {Report} err */
function checkDates(d, mode, err) {
  if (!isObj(d)) { err("dateCheck", "{ source, csvUrl, message, lead }"); return; }
  onlyKeys(d, ["source", "csvUrl", "staleAfterDays", "message", "lead"], "dateCheck", err);
  if (!["sheet", "simulated"].includes(d.source)) err("dateCheck.source", 'must be "sheet" (or "simulated" on demo sites)');
  if (d.source === "simulated" && mode !== "demo") err("dateCheck.source", 'simulated data is only allowed on demo sites; use "sheet"');
  if (d.source === "sheet" && !/^https:\/\/docs\.google\.com\/spreadsheets\/.+output=csv/.test(d.csvUrl ?? "")) err("dateCheck.csvUrl", "must be a published Google Sheet CSV link (File → Share → Publish to web → CSV)");
  if (d.staleAfterDays !== undefined && !isInt(d.staleAfterDays, 1, 90)) err("dateCheck.staleAfterDays", "whole days, 1–90: older than this, the page asks the bride to message instead");
  text(err, "dateCheck.message", d.message);
  if (d.lead !== undefined) text(err, "dateCheck.lead", d.lead);
}

/** @param {any} g @param {Report} err @param {Exists} exists */
function checkGuests(g, err, exists) {
  if (!isObj(g)) { err("guests", "{ message, sizes, perArtistMinutes, artists }"); return; }
  onlyKeys(g, ["message", "text", "sizes", "defaultSize", "start", "max", "perArtistMinutes", "artists", "note"], "guests", err);
  text(err, "guests.message", g.message);
  if (g.text !== undefined) text(err, "guests.text", g.text);
  if (g.note !== undefined) text(err, "guests.note", g.note);
  if (!Array.isArray(g.sizes) || g.sizes.length < 2 || g.sizes.length > 4) err("guests.sizes", "2 to 4 design sizes, each { id, name, minutes, price, photo }");
  else {
    ids(err, "guests.sizes", g.sizes);
    g.sizes.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
      const q = `guests.sizes[${i}]`;
      onlyKeys(x, ["id", "name", "minutes", "price", "photo"], q, err);
      text(err, `${q}.name`, x?.name);
      if (!isInt(x?.minutes, 2, 120)) err(`${q}.minutes`, "the artist's minutes per guest for this design");
      if (!isInt(x?.price, 1, 500)) err(`${q}.price`, "the artist's price per guest in whole pounds");
      photo(err, `${q}.photo`, x?.photo, exists);
    });
    if (g.defaultSize !== undefined && !g.sizes.some((/** @type {any} */ x) => x?.id === g.defaultSize)) err("guests.defaultSize", "one of the sizes' ids (the one chosen first)");
  }
  if (!isInt(g.max, 2, 400)) err("guests.max", "the most guests the quote counts to");
  if (!isInt(g.start, 1, 400) || (isInt(g.max, 2, 400) && g.start > g.max)) err("guests.start", "the number shown first, no more than max");
  if (!isInt(g.perArtistMinutes, 60, 480)) err("guests.perArtistMinutes", "how long one artist works on a night, in minutes");
  if (!isInt(g.artists, 1, 8)) err("guests.artists", "the most artists the business can bring");
}

/**
 * One stain photographed day by day from the mehndi evening (day 0). The days must rise, so the last is the darkest.
 * @param {any} sd @param {Report} err @param {Exists} exists
 */
function checkStainDays(sd, err, exists) {
  if (!isObj(sd)) { err("stainDays", "{ stages, text? }"); return; }
  onlyKeys(sd, ["stages", "text"], "stainDays", err);
  if (sd.text !== undefined) text(err, "stainDays.text", sd.text);
  if (!Array.isArray(sd.stages) || sd.stages.length < 2 || sd.stages.length > 4) { err("stainDays.stages", "2 to 4 photographs of one stain, each { day, label, text, photo }"); return; }
  sd.stages.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    const q = `stainDays.stages[${i}]`;
    onlyKeys(s, ["day", "label", "text", "photo"], q, err);
    if (!isInt(s?.day, 0, 4) || (i > 0 && !(s.day > sd.stages[i - 1]?.day))) err(`${q}.day`, "days from the mehndi evening (0 to 4), rising");
    text(err, `${q}.label`, s?.label);
    text(err, `${q}.text`, s?.text);
    photo(err, `${q}.photo`, s?.photo, exists);
  });
}

/** @param {any} d @param {Report} err @param {Exists} exists */
function checkDesigns(d, err, exists) {
  if (!isObj(d) || !Array.isArray(d.items) || d.items.length < 2) { err("designs.items", "at least two designs, each { id, name, style, coverage, for, hours, price, photo }"); return; }
  onlyKeys(d, ["message", "items"], "designs", err);
  text(err, "designs.message", d.message);
  ids(err, "designs.items", d.items);
  d.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const q = `designs.items[${i}]`;
    onlyKeys(x, ["id", "name", "style", "coverage", "for", "hours", "price", "from", "photo"], q, err);
    text(err, `${q}.name`, x?.name);
    if (!(x?.style in STYLES)) err(`${q}.style`, `one of ${Object.keys(STYLES).join(", ")}`);
    if (!(x?.coverage in COVERAGE)) err(`${q}.coverage`, `one of ${Object.keys(COVERAGE).join(", ")}`);
    if (!(x?.for in FOR)) err(`${q}.for`, `one of ${Object.keys(FOR).join(", ")}`);
    if (typeof x?.hours !== "number" || x.hours < 0.25 || x.hours > 12) err(`${q}.hours`, "how long it takes, in hours");
    price(err, q, x);
    photo(err, `${q}.photo`, x?.photo, exists);
  });
}

/** @param {any} a @param {Report} err @param {Exists} exists */
function checkAftercare(a, err, exists) {
  if (!isObj(a)) { err("aftercare", "{ stages, steps, lasts }"); return; }
  onlyKeys(a, ["stages", "steps", "lasts"], "aftercare", err);
  if (!Array.isArray(a.stages) || a.stages.length < 2 || a.stages.length > 5) err("aftercare.stages", "2 to 5 stages of the stain, each { when, label, text, photo? }");
  else a.stages.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    const q = `aftercare.stages[${i}]`;
    onlyKeys(s, ["when", "label", "text", "photo"], q, err);
    for (const k of ["when", "label", "text"]) text(err, `${q}.${k}`, s?.[k]);
    if (s?.photo !== undefined) photo(err, `${q}.photo`, s.photo, exists);
  });
  if (!Array.isArray(a.steps) || !a.steps.length || a.steps.some((/** @type {any} */ s) => !isStr(s))) err("aftercare.steps", "the artist's aftercare, one line each");
  text(err, "aftercare.lasts", a.lasts);
}

/** @param {any} p @param {Report} err */
function checkPlanner(p, err) {
  if (!isObj(p)) { err("planner", "{ message, steps }"); return; }
  onlyKeys(p, ["message", "steps"], "planner", err);
  text(err, "planner.message", p.message);
  if (!Array.isArray(p.steps) || p.steps.length < 2 || p.steps.length > 10) { err("planner.steps", "2 to 10 steps, each { id, label, daysBefore, text? }"); return; }
  ids(err, "planner.steps", p.steps);
  p.steps.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    const q = `planner.steps[${i}]`;
    onlyKeys(s, ["id", "label", "daysBefore", "text", "mehndi"], q, err);
    text(err, `${q}.label`, s?.label);
    if (!isInt(s?.daysBefore, 0, 365)) err(`${q}.daysBefore`, "days before the wedding, 0 to 365");
    if (s?.text !== undefined) text(err, `${q}.text`, s.text);
    if (s?.mehndi !== undefined && s.mehndi !== true) err(`${q}.mehndi`, "true on the step that is the bridal mehndi itself");
  });
  if (p.steps.filter((/** @type {any} */ s) => s?.mehndi === true).length !== 1) err("planner.steps", "mark exactly one step as the mehndi itself (\"mehndi\": true)");
}

/** @param {any} p @param {Report} err */
function checkPersonal(p, err) {
  if (!isObj(p)) { err("personal", "{ message, kinds, places }"); return; }
  onlyKeys(p, ["message", "kinds", "places", "text"], "personal", err);
  text(err, "personal.message", p.message);
  if (p.text !== undefined) text(err, "personal.text", p.text);
  for (const k of ["kinds", "places"]) {
    if (!Array.isArray(p[k]) || p[k].length < 2 || p[k].length > 8 || p[k].some((/** @type {any} */ s) => !isStr(s))) err(`personal.${k}`, k === "kinds" ? "2 to 8 things to hide, e.g. \"Our names\"" : "2 to 8 places to hide them, e.g. \"The palm\"");
  }
}

/** @param {any} b @param {Report} err @param {Exists} exists */
function checkBridalPage(b, err, exists) {
  pageHead(err, "bridalPage", b, ["photo", "trial", "before", "travel"]);
  if (!isObj(b)) return;
  photo(err, "bridalPage.photo", b.photo, exists);
  text(err, "bridalPage.trial", b.trial);
  if (!Array.isArray(b.before) || !b.before.length || b.before.some((/** @type {any} */ s) => !isStr(s))) err("bridalPage.before", "what the bride does before the artist arrives, one line each");
  text(err, "bridalPage.travel", b.travel);
}
