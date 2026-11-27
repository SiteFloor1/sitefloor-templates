// @ts-check
/**
 * Validation for the carfilm kit (car videographers and photographers): the hero film, the roads for the light, the
 * delivery formats, packages, the showreel, the portfolio, booking and the shot list, turnaround, the listing set, the
 * planner, the forecast and the guide pages. Every price, timing, size and road is the studio's own; the checks make
 * sure it's complete and can't mislead (a price is the whole price, a format's size matches its shape).
 */
import { ratioOf } from "./lib/carfilm.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @typedef {((rel: string) => boolean)|undefined} Exists */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const ID = /^[a-z0-9-]{1,40}$/;
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export const GUIDES = ["dealers", "owners", "rolling", "social", "behind", "deliveries", "locations", "questions"];

/** @param {Report} err @param {string} path @param {any} v */
function text(err, path, v) { if (!isStr(v)) err(path, "required text is missing"); }
/** A misspelt setting is refused, not silently ignored. @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (isObj(o)) for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}
/** @param {Report} err @param {string} path @param {any} list @param {number} min @param {number} max @returns {any[]} */
function list(err, path, list, min, max) {
  if (!Array.isArray(list) || list.length < min || list.length > max) { err(path, `a list of ${min}–${max}`); return []; }
  return list;
}
/** @param {Report} err @param {string} path @param {any[]} items @returns {Set<string>} */
function ids(err, path, items) {
  const seen = new Set();
  items.forEach((x, i) => {
    if (!ID.test(x?.id ?? "")) err(`${path}[${i}].id`, "lowercase letters, numbers and dashes");
    else if (seen.has(x.id)) err(`${path}[${i}].id`, `"${x.id}" is used twice`);
    seen.add(x?.id);
  });
  return seen;
}
/** A file the site serves: present, and with its pixel size so the page doesn't jump. @param {Report} err @param {string} path @param {any} f @param {Exists} exists @param {string[]} keys */
function media(err, path, f, exists, keys) {
  if (!isObj(f)) { err(path, `{ ${keys.join(", ")} }`); return; }
  onlyKeys(f, keys, path, err);
  if (keys.includes("alt")) text(err, `${path}.alt`, f.alt);
  if (!Number.isInteger(f.width) || !Number.isInteger(f.height) || f.width < 1 || f.height < 1) err(path, "width and height in pixels");
  for (const k of ["src", "poster", "smallSrc"]) {
    if (!keys.includes(k) || (k === "smallSrc" && f[k] === undefined)) continue;
    if (!isStr(f[k])) err(`${path}.${k}`, "required");
    else if (exists && !exists(f[k])) err(`${path}.${k}`, `file not found: ${f[k]}`);
  }
}
/** @param {Report} err @param {string} path @param {any} s */
function sections(err, path, s) {
  list(err, path, s, 1, 8).forEach((x, i) => { onlyKeys(x, ["heading", "body"], `${path}[${i}]`, err); text(err, `${path}[${i}].heading`, x?.heading); text(err, `${path}[${i}].body`, x?.body); });
}

/** @param {any} site @param {Report} err @param {Exists} exists @param {(id: string) => boolean} _on */
function checkHero(site, err, exists, _on) {
  const h = site.hero;
  if (!isObj(h)) err("hero", "the hero: { kicker, title, intro, film }");
  else {
    onlyKeys(h, ["kicker", "title", "intro", "film"], "hero", err);
    for (const k of ["kicker", "title", "intro"]) text(err, `hero.${k}`, h[k]);
    media(err, "hero.film", h.film, exists, ["src", "smallSrc", "poster", "width", "height", "fps", "label"]);
    if (isObj(h.film)) {
      if (![24, 25, 30, 50, 60].includes(h.film.fps)) err("hero.film.fps", "the film's frame rate (24, 25, 30, 50 or 60): the timecode counts in it");
      text(err, "hero.film.label", h.film.label);
      if (isStr(h.film.src) && !/\.mp4$/.test(h.film.src)) err("hero.film.src", "an .mp4 file");
    }
  }
}

/** @param {any} site @param {Report} err @param {Exists} _exists @param {(id: string) => boolean} on @returns {Set<string>} */
function checkFormats(site, err, _exists, on) {
  if (site.formats === undefined) return new Set();
  onlyKeys(site.formats, ["items", "note"], "formats", err);
  const items = list(err, "formats.items", site.formats?.items, 1, 8);
  const formats = ids(err, "formats.items", items);
  items.forEach((f, i) => {
    const at = `formats.items[${i}]`;
    onlyKeys(f, ["id", "name", "ratio", "size", "use", "viewfinder"], at, err);
    text(err, `${at}.name`, f?.name); text(err, `${at}.use`, f?.use);
    const r = ratioOf(f?.ratio);
    if (!Number.isFinite(r) || r <= 0) err(`${at}.ratio`, 'a shape like "2.39:1", "16:9" or "9:16"');
    const m = /^(\d{3,5}) × (\d{3,5})$/.exec(f?.size ?? "");
    if (!m) err(`${at}.size`, 'the delivered size in pixels, "3840 × 2160" (with ×)');
    else if (Number.isFinite(r) && Math.abs(Number(m[1]) / Number(m[2]) / r - 1) > 0.02) err(`${at}.size`, `${f.size} isn't the shape ${f.ratio}`);
    if (f?.viewfinder !== undefined && typeof f.viewfinder !== "boolean") err(`${at}.viewfinder`, "true or false: shown in the viewfinder's switch");
  });
  const vf = items.filter((f) => f?.viewfinder).length;
  if (on("carfilm-formats") && (vf < 2 || vf > 5)) err("formats.items", "the viewfinder's switch needs 2–5 formats marked viewfinder: true");
  return formats;
}

/** @param {any} site @param {Report} err @param {Exists} _exists @param {(id: string) => boolean} _on @returns {Set<string>} */
function checkRoads(site, err, _exists, _on) {
  if (site.roads === undefined) return new Set();
  onlyKeys(site.roads, ["default", "items", "note"], "roads", err);
  const items = list(err, "roads.items", site.roads?.items, 1, 24);
  const roads = ids(err, "roads.items", items);
  items.forEach((r, i) => {
    const at = `roads.items[${i}]`;
    onlyKeys(r, ["id", "name", "area", "lat", "lon"], at, err);
    text(err, `${at}.name`, r?.name); text(err, `${at}.area`, r?.area);
    if (!(typeof r?.lat === "number" && r.lat >= 49 && r.lat <= 61)) err(`${at}.lat`, "latitude in degrees north, in the UK (49–61)");
    if (!(typeof r?.lon === "number" && r.lon >= -9 && r.lon <= 2.5)) err(`${at}.lon`, "longitude in degrees east, in the UK (−9 to 2.5)");
  });
  if (!roads.has(site.roads?.default)) err("roads.default", "the id of the road the readout opens on");
  return roads;
}

/** @param {any} site @param {Report} err @param {Exists} _exists @param {(id: string) => boolean} _on */
function checkPackages(site, err, _exists, _on) {
  if (site.packages === undefined) return;
  onlyKeys(site.packages, ["note", "items"], "packages", err);
  text(err, "packages.note", site.packages?.note);
  if (isStr(site.packages?.note) && !/includ/i.test(site.packages.note)) err("packages.note", "say what every price includes (travel, the edit, VAT…): the headline price is the whole price");
  const items = list(err, "packages.items", site.packages?.items, 1, 8);
  ids(err, "packages.items", items);
  items.forEach((p, i) => {
    const at = `packages.items[${i}]`;
    onlyKeys(p, ["id", "name", "for", "price", "includes", "photosDays", "filmDays"], at, err);
    text(err, `${at}.name`, p?.name);
    if (!["owners", "dealers", "both"].includes(p?.for)) err(`${at}.for`, '"owners", "dealers" or "both"');
    if (!(p?.price === null || (Number.isInteger(p?.price) && p.price > 0 && p.price < 100000))) err(`${at}.price`, "the whole price in pounds, every mandatory fee included; null shows \"Ask for a quote\"");
    list(err, `${at}.includes`, p?.includes, 1, 6).forEach((x, j) => text(err, `${at}.includes[${j}]`, x));
    for (const k of ["photosDays", "filmDays"]) if (p?.[k] !== undefined && p[k] !== null && !(Number.isInteger(p[k]) && p[k] >= 1 && p[k] <= 60)) err(`${at}.${k}`, "working days after the shoot, 1–60 (or null)");
  });
}

/** @param {any} site @param {Report} err @param {Exists} exists @param {(id: string) => boolean} _on */
function checkReel(site, err, exists, _on) {
  if (site.reel === undefined) return;
  onlyKeys(site.reel, ["items", "note"], "reel", err);
  const items = list(err, "reel.items", site.reel?.items, 1, 24);
  ids(err, "reel.items", items);
  items.forEach((f, i) => {
    const at = `reel.items[${i}]`;
    media(err, at, f, exists, ["id", "title", "kind", "car", "seconds", "src", "poster", "width", "height"]);
    for (const k of ["title", "kind", "car"]) text(err, `${at}.${k}`, f?.[k]);
    if (!(typeof f?.seconds === "number" && f.seconds > 0 && f.seconds <= 3600)) err(`${at}.seconds`, "the film's length in seconds (its runtime is shown)");
  });
}

/** @param {any} site @param {Report} err @param {Exists} exists @param {(id: string) => boolean} _on */
function checkPortfolio(site, err, exists, _on) {
  if (site.portfolio === undefined) return;
  const p = site.portfolio;
  onlyKeys(p, ["title", "intro", "groups", "items", "note"], "portfolio", err);
  text(err, "portfolio.title", p?.title); text(err, "portfolio.intro", p?.intro);
  const groups = ids(err, "portfolio.groups", list(err, "portfolio.groups", p?.groups, 1, 12));
  (p?.groups ?? []).forEach((/** @type {any} */ g, /** @type {number} */ i) => { onlyKeys(g, ["id", "label"], `portfolio.groups[${i}]`, err); text(err, `portfolio.groups[${i}].label`, g?.label); });
  list(err, "portfolio.items", p?.items, 1, 60).forEach((x, i) => {
    media(err, `portfolio.items[${i}]`, x, exists, ["src", "width", "height", "alt", "group", "caption"]);
    if (!groups.has(x?.group)) err(`portfolio.items[${i}].group`, "one of portfolio.groups");
  });
}

/** @param {any} site @param {Report} err @param {Exists} _exists @param {(id: string) => boolean} _on */
function checkBook(site, err, _exists, _on) {
  if (site.book === undefined) return;
  onlyKeys(site.book, ["title", "intro", "message", "steps"], "book", err);
  for (const k of ["title", "intro", "message"]) text(err, `book.${k}`, site.book?.[k]);
  sections(err, "book.steps", site.book?.steps);
}

/** @param {any} site @param {Report} err @param {Exists} exists @param {(id: string) => boolean} _on */
function checkShotList(site, err, exists, _on) {
  if (site.shotList === undefined) return;
  const s = site.shotList;
  onlyKeys(s, ["title", "intro", "message", "items"], "shotList", err);
  for (const k of ["title", "intro", "message"]) text(err, `shotList.${k}`, s?.[k]);
  if (isStr(s?.message) && !s.message.includes("{shots}")) err("shotList.message", "put {shots} where the list goes");
  const items = list(err, "shotList.items", s?.items, 2, 16);
  ids(err, "shotList.items", items);
  items.forEach((x, i) => {
    onlyKeys(x, ["id", "label", "photo", "on"], `shotList.items[${i}]`, err);
    text(err, `shotList.items[${i}].label`, x?.label);
    media(err, `shotList.items[${i}].photo`, x?.photo, exists, ["src", "width", "height"]);
    if (x?.on !== undefined && typeof x.on !== "boolean") err(`shotList.items[${i}].on`, "true or false: chosen when the page opens");
  });
}

/** @param {any} site @param {Report} err @param {Exists} _exists @param {(id: string) => boolean} on */
function checkTurnaround(site, err, _exists, on) {
  if (site.turnaround === undefined) return;
  onlyKeys(site.turnaround, ["workdays", "note"], "turnaround", err);
  const w = list(err, "turnaround.workdays", site.turnaround?.workdays, 1, 7);
  if (w.some((d) => !DAYS.includes(d)) || new Set(w).size !== w.length) err("turnaround.workdays", `the studio's working days, each once: ${DAYS.join(", ")}`);
  text(err, "turnaround.note", site.turnaround?.note);
  if (on("carfilm-turnaround") && !(site.packages?.items ?? []).some((/** @type {any} */ p) => p.photosDays || p.filmDays)) err("packages.items", "give at least one package photosDays or filmDays for the turnaround dates");
}

/** @param {any} site @param {Report} err @param {Exists} exists @param {(id: string) => boolean} on @param {Set<string>} [formats] */
function checkListing(site, err, exists, on, formats = new Set()) {
  if (site.listingSet === undefined) return;
  const l = site.listingSet;
  onlyKeys(l, ["title", "intro", "items", "format"], "listingSet", err);
  text(err, "listingSet.title", l?.title); text(err, "listingSet.intro", l?.intro);
  list(err, "listingSet.items", l?.items, 3, 30).forEach((x, i) => text(err, `listingSet.items[${i}]`, x));
  if (!formats.has(l?.format)) err("listingSet.format", "the id of the format the listing photographs arrive in (formats.items)");
}

/** @param {any} site @param {Report} err @param {Exists} _exists @param {(id: string) => boolean} _on */
function checkPlanner(site, err, _exists, _on) {
  if (site.planner === undefined) return;
  onlyKeys(site.planner, ["title", "intro", "message"], "planner", err);
  for (const k of ["title", "intro", "message"]) text(err, `planner.${k}`, site.planner?.[k]);
}

/** @param {any} site @param {Report} err @param {Exists} _exists @param {(id: string) => boolean} _on */
function checkForecast(site, err, _exists, _on) {
  if (site.forecast === undefined) return;
  onlyKeys(site.forecast, ["source"], "forecast", err);
  if (site.forecast?.source !== "met-norway") err("forecast.source", '"met-norway": MET Norway\'s free Locationforecast (commercial use allowed, credited on the page)');
}

/** @param {any} site @param {Report} err @param {Exists} exists @param {(id: string) => boolean} on */
function checkGuides(site, err, exists, on) {
  if (site.guides === undefined) return;
  const g = site.guides;
  onlyKeys(g, GUIDES, "guides", err);
  for (const k of GUIDES) {
    const x = g?.[k], at = `guides.${k}`;
    if (!isObj(x)) { if (on("carfilm-guides")) err(at, "the page's words: { title, description, intro, sections?, photo? }"); continue; }
    onlyKeys(x, ["title", "description", "intro", "sections", "photo"], at, err);
    for (const t of ["title", "description", "intro"]) text(err, `${at}.${t}`, x[t]);
    if (isStr(x.description) && x.description.length > 160) err(`${at}.description`, "the sentence Google shows, up to 160 characters");
    if (x.sections !== undefined) sections(err, `${at}.sections`, x.sections);
    if (x.photo !== undefined) media(err, `${at}.photo`, x.photo, exists, ["src", "width", "height", "alt"]);
  }
}

/** @param {any} site @param {Report} err @param {Exists} [exists] */
export function checkCarFilm(site, err, exists) {
  if (site.kit !== "carfilm") return;
  const on = (/** @type {string} */ id) => (site.features ?? []).includes(id);
  checkHero(site, err, exists, on);
  const formats = checkFormats(site, err, exists, on);
  const roads = checkRoads(site, err, exists, on);
  checkPackages(site, err, exists, on);
  checkReel(site, err, exists, on);
  checkPortfolio(site, err, exists, on);
  checkBook(site, err, exists, on);
  checkShotList(site, err, exists, on);
  checkTurnaround(site, err, exists, on);
  checkListing(site, err, exists, on, formats);
  checkPlanner(site, err, exists, on);
  checkForecast(site, err, exists, on);
  checkGuides(site, err, exists, on);
  if (on("carfilm-tonight") && !roads.size) err("roads", "tonight's light needs at least one road");
}
