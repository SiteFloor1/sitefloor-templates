// @ts-check
/**
 * Validation for the weddingfilm kit (wedding videographers and photographers): the hero film and its chapters, the
 * packages and the builder's extras, the diary sheet, the places for the light, the delivery timings, the films and
 * photographs, and the couples' sheet. Every price, timing and link is the studio's own; the checks only make sure it
 * is complete and can't mislead (a demo can't take money, a client site can't show simulated data).
 */
import { isYmd } from "../../core/lib/diary.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @typedef {((rel: string) => boolean)|undefined} Exists */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const ID = /^[a-z0-9-]{1,40}$/;
const PAGE_HEAD = ["kicker", "title", "intro"];

/** @param {Report} err @param {string} path @param {any} v */
function text(err, path, v) { if (!isStr(v)) err(path, "required text is missing"); }

/** A misspelt setting is refused, not silently ignored. @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (isObj(o)) for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}

/** @param {Report} err @param {string} path @param {any[]} list */
function ids(err, path, list) {
  const seen = new Set();
  list.forEach((x, i) => {
    if (!ID.test(x?.id ?? "")) err(`${path}[${i}].id`, "lowercase letters, numbers and dashes");
    else if (seen.has(x.id)) err(`${path}[${i}].id`, `"${x.id}" is used twice`);
    seen.add(x?.id);
  });
}

/** @param {Report} err @param {string} path @param {any} f @param {Exists} exists @param {string[]} keys @param {string} [kind] */
function file(err, path, f, exists, keys, kind = "photo") {
  if (!isObj(f)) { err(path, `a ${kind}: { ${keys.join(", ")} }`); return; }
  onlyKeys(f, keys, path, err);
  if (keys.includes("alt")) text(err, `${path}.alt`, f.alt);
  if (!Number.isInteger(f.width) || !Number.isInteger(f.height)) err(path, "width and height in pixels");
  for (const k of ["src", "poster"]) {
    if (!keys.includes(k)) continue;
    if (!isStr(f[k])) err(`${path}.${k}`, "required");
    else if (exists && !exists(f[k])) err(`${path}.${k}`, `file not found: ${f[k]}`);
  }
}

const PHOTO = ["src", "width", "height", "alt", "caption"];

/** A live source: the studio's published sheet, or simulated data on a demo only. @param {any} p @param {string} at @param {string} mode @param {Report} err */
function source(p, at, mode, err) {
  if (!["sheet", "simulated"].includes(p?.source)) err(`${at}.source`, 'must be "sheet" or "simulated"');
  if (p?.source === "simulated" && mode === "client") err(`${at}.source`, "simulated data is for demos only; client sites read the studio's Google Sheet");
  if (p?.source === "sheet" && !/^https:\/\/docs\.google\.com\/spreadsheets\/.+output=csv/.test(p?.csvUrl ?? "")) err(`${at}.csvUrl`, "the studio's sheet published as CSV (File → Share → Publish to web → CSV)");
  if (p?.staleAfterHours !== undefined && !(Number.isInteger(p.staleAfterHours) && p.staleAfterHours >= 1 && p.staleAfterHours <= 720)) err(`${at}.staleAfterHours`, "whole hours, 1–720: after this the page stops trusting the sheet");
}

/** The studio's own Stripe Payment Link: test mode on a demo, live on a client site. @param {any} link @param {string} at @param {string} mode @param {Report} err */
function stripeLink(link, at, mode, err) {
  if (!/^https:\/\/buy\.stripe\.com\/[\w-]+$/.test(link ?? "")) err(at, "the studio's own Stripe Payment Link, https://buy.stripe.com/…");
  else if (mode === "demo" && !link.startsWith("https://buy.stripe.com/test_")) err(at, "demo sites must use a Stripe test-mode link (https://buy.stripe.com/test_…)");
  else if (mode === "client" && link.startsWith("https://buy.stripe.com/test_")) err(at, "is a Stripe test-mode link; client sites need the studio's live link");
}

/** @param {any} site @param {Report} err @param {Exists} [exists] */
export function checkWeddingFilm(site, err, exists) {
  if (site.kit !== "weddingfilm") return;
  checkHero(site.hero, err, exists);
  const pkgs = site.packages !== undefined ? checkPackages(site.packages, err) : new Set();
  if (site.dateCheck !== undefined) checkDates(site.dateCheck, site.mode, err);
  const places = site.places !== undefined ? checkPlaces(site.places, err) : new Set();
  if (site.delivery !== undefined) checkDelivery(site.delivery, err);
  if (site.builder !== undefined) checkBuilder(site.builder, site.mode, err);
  if (site.chapters !== undefined) checkChapters(site.chapters, err);
  const venues = site.venues !== undefined ? checkVenues(site.venues, err, exists) : new Set();
  if (site.films !== undefined) checkFilms(site.films, venues, err, exists);
  if (site.photographs !== undefined) checkPhotographs(site.photographs, err, exists);
  if (site.lightPlanner !== undefined) checkPlanner(site.lightPlanner, places, err, exists);
  if (site.progress !== undefined) checkProgress(site.progress, site.mode, err);
  if (site.dayPlanner !== undefined) checkDay(site.dayPlanner, err, exists);
  if (site.musicPage !== undefined) checkArticle(site.musicPage, "musicPage", err, exists);
  for (const k of ["filmsPage", "photographsPage", "packagesPage", "faqPage"]) if (site[k] !== undefined) { onlyKeys(site[k], PAGE_HEAD, k, err); text(err, `${k}.title`, site[k]?.title); }
  if (site.features?.includes("wf-builder") && !pkgs.size) err("packages.items", "the builder needs at least one package");
}

/** @param {any} d @param {string} mode @param {Report} err */
function checkDates(d, mode, err) {
  onlyKeys(d, ["source", "csvUrl", "staleAfterHours", "message"], "dateCheck", err);
  source(d, "dateCheck", mode, err);
  text(err, "dateCheck.message", d?.message);
}

/** @param {any} c @param {string} mode @param {Report} err */
function checkProgress(c, mode, err) {
  onlyKeys(c, ["source", "csvUrl", "staleAfterHours", "example", "title", "intro"], "progress", err);
  source(c, "progress", mode, err);
  text(err, "progress.title", c?.title);
  if (c?.example !== undefined && mode !== "demo") err("progress.example", "an example code is for demos only");
}

/** A source for a fact: what it is, the https link, the month it was checked. @param {any} s @param {string} at @param {Report} err */
function sourceLink(s, at, err) {
  onlyKeys(s, ["label", "url", "checked"], at, err);
  text(err, `${at}.label`, s?.label);
  if (!/^https:\/\/[^\s]+$/.test(s?.url ?? "")) err(`${at}.url`, "an https link to the source");
  if (!/^\d{4}-\d{2}$/.test(s?.checked ?? "")) err(`${at}.checked`, "the month the fact was checked, YYYY-MM");
}

/** An explainer page: sections in the studio's words, every fact with a source. @param {any} a @param {string} at @param {Report} err @param {Exists} exists */
function checkArticle(a, at, err, exists) {
  if (!isObj(a)) { err(at, "{ kicker, title, intro, sections, sources }"); return; }
  onlyKeys(a, [...PAGE_HEAD, "sections", "sources", "photo"], at, err);
  text(err, `${at}.title`, a.title);
  if (!Array.isArray(a.sections) || !a.sections.length) err(`${at}.sections`, "at least one { heading, body }");
  else a.sections.forEach((/** @type {any} */ x, /** @type {number} */ i) => { onlyKeys(x, ["heading", "body", "sources"], `${at}.sections[${i}]`, err); text(err, `${at}.sections[${i}].heading`, x?.heading); text(err, `${at}.sections[${i}].body`, x?.body); if (x?.sources !== undefined && !(Array.isArray(x.sources) && x.sources.every((/** @type {any} */ n) => Number.isInteger(n) && n >= 1 && n <= (a.sources?.length ?? 0)))) err(`${at}.sections[${i}].sources`, "numbers of the sources below (1, 2, …)"); });
  if (!Array.isArray(a.sources) || !a.sources.length) err(`${at}.sources`, "where each fact comes from: { label, url, checked }");
  else a.sources.forEach((/** @type {any} */ x, /** @type {number} */ i) => sourceLink(x, `${at}.sources[${i}]`, err));
  if (a.photo !== undefined) file(err, `${at}.photo`, a.photo, exists, PHOTO);
}

/** The day planner: the studio's block lengths and the day explained. @param {any} d @param {Report} err @param {Exists} exists */
function checkDay(d, err, exists) {
  if (!isObj(d)) { err("dayPlanner", "{ message, ceremony, blocks, explained }"); return; }
  onlyKeys(d, [...PAGE_HEAD, "message", "ceremony", "blocks", "explained", "photo"], "dayPlanner", err);
  text(err, "dayPlanner.title", d.title);
  text(err, "dayPlanner.message", d.message);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.ceremony ?? "") || d.ceremony < "09:00" || d.ceremony > "18:00") err("dayPlanner.ceremony", "the ceremony time the planner opens on, HH:MM between 09:00 and 18:00");
  const B = ["prep", "ceremony", "drinks", "meal", "speeches", "danceAfter", "after"];
  if (!isObj(d.blocks)) err("dayPlanner.blocks", `the studio's lengths in minutes: ${B.join(", ")}`);
  else { onlyKeys(d.blocks, B, "dayPlanner.blocks", err); for (const k of B) if (!Number.isInteger(d.blocks[k]) || d.blocks[k] < 0 || d.blocks[k] > 300) err(`dayPlanner.blocks.${k}`, "whole minutes, 0–300, the studio's own"); }
  if (!Array.isArray(d.explained) || !d.explained.length) err("dayPlanner.explained", "the day in the studio's words: { heading, body }");
  else d.explained.forEach((/** @type {any} */ x, /** @type {number} */ i) => { onlyKeys(x, ["heading", "body", "photo"], `dayPlanner.explained[${i}]`, err); text(err, `dayPlanner.explained[${i}].heading`, x?.heading); text(err, `dayPlanner.explained[${i}].body`, x?.body); if (x?.photo !== undefined) file(err, `dayPlanner.explained[${i}].photo`, x.photo, exists, PHOTO); });
  if (d.photo !== undefined) file(err, "dayPlanner.photo", d.photo, exists, PHOTO);
}

/** Venues the studio has filmed: where, the light there, the venue's own drone rule. @param {any} v @param {Report} err @param {Exists} exists @returns {Set<string>} */
function checkVenues(v, err, exists) {
  /** @type {Set<string>} */ const out = new Set();
  if (!isObj(v) || !Array.isArray(v.items) || !v.items.length) { err("venues.items", "at least one venue: { id, name, area, lat, lon }"); return out; }
  onlyKeys(v, [...PAGE_HEAD, "items", "drone", "sources"], "venues", err);
  ids(err, "venues.items", v.items);
  v.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `venues.items[${i}]`;
    onlyKeys(x, ["id", "name", "area", "lat", "lon", "tz", "text", "drone", "photo"], at, err);
    text(err, `${at}.name`, x?.name); text(err, `${at}.area`, x?.area);
    if (typeof x?.lat !== "number" || x.lat < -66 || x.lat > 66) err(`${at}.lat`, "latitude in degrees, −66 to 66");
    if (typeof x?.lon !== "number" || x.lon < -180 || x.lon > 180) err(`${at}.lon`, "longitude in degrees east");
    if (x?.tz !== undefined && !validTz(x.tz)) err(`${at}.tz`, "an IANA time zone, e.g. Europe/Rome");
    if (x?.drone !== undefined) text(err, `${at}.drone`, x.drone);
    if (x?.photo !== undefined) file(err, `${at}.photo`, x.photo, exists, PHOTO);
    if (x?.id) out.add(x.id);
  });
  if (v.drone !== undefined) text(err, "venues.drone", v.drone);
  if (v.sources !== undefined) { if (!Array.isArray(v.sources)) err("venues.sources", "a list of { label, url, checked }"); else v.sources.forEach((/** @type {any} */ x, /** @type {number} */ i) => sourceLink(x, `venues.sources[${i}]`, err)); }
  if (v.drone !== undefined && !v.sources?.length) err("venues.sources", "the drone rules need their sources: { label, url, checked }");
  return out;
}

/** The film across the top: one wide cut for large screens, one tall cut for phones, each with its still. @param {any} h @param {Report} err @param {Exists} exists */
function checkHero(h, err, exists) {
  if (!isObj(h)) return;
  if (h.film === undefined) { err("hero.film", "the studio's film: { label, wide: { src, poster, width, height }, tall: { … } }"); return; }
  const f = h.film;
  if (!isObj(f)) { err("hero.film", "{ label, wide, tall }"); return; }
  onlyKeys(f, ["label", "wide", "tall"], "hero.film", err);
  text(err, "hero.film.label", f.label);
  file(err, "hero.film.wide", f.wide, exists, ["src", "poster", "width", "height"], "film");
  file(err, "hero.film.tall", f.tall, exists, ["src", "poster", "width", "height"], "film");
  if (isObj(f.wide) && !/\.mp4$/.test(f.wide.src ?? "")) err("hero.film.wide.src", "an .mp4 (H.264), so every phone can play it");
  if (isObj(f.tall) && !/\.mp4$/.test(f.tall.src ?? "")) err("hero.film.tall.src", "an .mp4 (H.264), so every phone can play it");
}

/** @param {any} p @param {Report} err @returns {Set<string>} */
function checkPackages(p, err) {
  /** @type {Set<string>} */ const out = new Set();
  if (!isObj(p) || !Array.isArray(p.items) || !p.items.length) { err("packages.items", "at least one package"); return out; }
  onlyKeys(p, ["items", "deposit", "note"], "packages", err);
  ids(err, "packages.items", p.items);
  p.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `packages.items[${i}]`;
    onlyKeys(x, ["id", "name", "price", "hours", "films", "photographs", "text"], at, err);
    text(err, `${at}.name`, x?.name);
    text(err, `${at}.hours`, x?.hours);
    if (x?.price !== null && !(Number.isInteger(x?.price) && x.price > 0)) err(`${at}.price`, "the studio's price in whole pounds, or null for \"price on request\"");
    if (!Array.isArray(x?.films) || !x.films.every(isStr)) err(`${at}.films`, "what films come with it, e.g. [\"A five-minute film\"] (or [] for photographs only)");
    if (x?.photographs !== undefined && !isStr(x.photographs)) err(`${at}.photographs`, "the photographs in the studio's words, or leave it out");
    if (x?.id) out.add(x.id);
  });
  text(err, "packages.deposit", p.deposit);
  return out;
}

/** @param {any} p @param {Report} err @returns {Set<string>} */
function checkPlaces(p, err) {
  /** @type {Set<string>} */ const out = new Set();
  if (!isObj(p) || !Array.isArray(p.items) || !p.items.length) { err("places.items", "at least one place: { id, name, lat, lon }"); return out; }
  onlyKeys(p, ["items"], "places", err);
  ids(err, "places.items", p.items);
  p.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `places.items[${i}]`;
    onlyKeys(x, ["id", "name", "lat", "lon", "tz"], at, err);
    text(err, `${at}.name`, x?.name);
    if (typeof x?.lat !== "number" || x.lat < -66 || x.lat > 66) err(`${at}.lat`, "latitude in degrees, −66 to 66 (nearer the poles the sun's hours don't fit one evening)");
    if (typeof x?.lon !== "number" || x.lon < -180 || x.lon > 180) err(`${at}.lon`, "longitude in degrees east, −180 to 180");
    if (x?.tz !== undefined && !validTz(x.tz)) err(`${at}.tz`, "an IANA time zone, e.g. Europe/Rome");
    if (x?.id) out.add(x.id);
  });
  return out;
}

/** @param {unknown} tz */
function validTz(tz) {
  if (typeof tz !== "string") return false;
  try { new Intl.DateTimeFormat("en-GB", { timeZone: tz }); return true; } catch { return false; }
}

/** @param {any} d @param {Report} err */
function checkDelivery(d, err) {
  if (!isObj(d) || !Array.isArray(d.steps) || !d.steps.length) { err("delivery.steps", "the studio's timings, e.g. { id: \"trailer\", label: \"Your trailer\", weeksAfter: 2 }"); return; }
  onlyKeys(d, ["steps", "note"], "delivery", err);
  ids(err, "delivery.steps", d.steps);
  d.steps.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    onlyKeys(s, ["id", "label", "weeksAfter", "text"], `delivery.steps[${i}]`, err);
    text(err, `delivery.steps[${i}].label`, s?.label);
    if (!Number.isInteger(s?.weeksAfter) || s.weeksAfter < 0 || s.weeksAfter > 104) err(`delivery.steps[${i}].weeksAfter`, "whole weeks after the wedding, 0–104");
  });
}

/** @param {any} b @param {string} mode @param {Report} err */
function checkBuilder(b, mode, err) {
  if (!isObj(b)) { err("builder", "{ message, extras, depositLink }"); return; }
  onlyKeys(b, ["message", "extras", "depositLink", "depositText"], "builder", err);
  text(err, "builder.message", b.message);
  if (!Array.isArray(b.extras)) { err("builder.extras", "a list (it may be empty)"); return; }
  ids(err, "builder.extras", b.extras);
  b.extras.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `builder.extras[${i}]`;
    onlyKeys(x, ["id", "name", "price", "text", "per", "max"], at, err);
    text(err, `${at}.name`, x?.name);
    if (!(Number.isInteger(x?.price) && x.price > 0)) err(`${at}.price`, "the studio's price in whole pounds");
    if (x?.per !== undefined && !isStr(x.per)) err(`${at}.per`, "what one is, e.g. \"hour\"");
    if (x?.max !== undefined && !(Number.isInteger(x.max) && x.max >= 1 && x.max <= 12)) err(`${at}.max`, "how many can be added, 1–12");
  });
  if (b.depositLink !== undefined) { stripeLink(b.depositLink, "builder.depositLink", mode, err); text(err, "builder.depositText", b.depositText); }
}

/** @param {any} c @param {Report} err */
function checkChapters(c, err) {
  if (!isObj(c) || !Array.isArray(c.items) || c.items.length < 2 || c.items.length > 6) { err("chapters.items", "two to six chapters: { title, at } (at = seconds into the film)"); return; }
  onlyKeys(c, ["length", "items"], "chapters", err);
  if (typeof c.length !== "number" || c.length <= 0) err("chapters.length", "the film's length in seconds");
  let last = -1;
  c.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    onlyKeys(x, ["title", "at"], `chapters.items[${i}]`, err);
    text(err, `chapters.items[${i}].title`, x?.title);
    if (typeof x?.at !== "number" || x.at <= last || (typeof c.length === "number" && x.at >= c.length)) err(`chapters.items[${i}].at`, "seconds into the film, each later than the last and before the end");
    last = x?.at ?? last;
  });
  if (c.items[0]?.at !== 0) err("chapters.items[0].at", "the first chapter starts at 0");
}

/** @param {any} f @param {Set<string>} venues @param {Report} err @param {Exists} exists */
function checkFilms(f, venues, err, exists) {
  if (!isObj(f) || !Array.isArray(f.items) || !f.items.length) { err("films.items", "at least one film"); return; }
  onlyKeys(f, ["items", "message"], "films", err);
  text(err, "films.message", f.message);
  ids(err, "films.items", f.items);
  f.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `films.items[${i}]`;
    onlyKeys(x, ["id", "title", "venue", "season", "date", "text", "story", "poster", "clip", "watch", "photographs"], at, err);
    text(err, `${at}.title`, x?.title);
    text(err, `${at}.season`, x?.season);
    text(err, `${at}.text`, x?.text);
    if (!venues.has(x?.venue)) err(`${at}.venue`, "one of the venues ids");
    if (x?.date !== undefined && !isYmd(x.date)) err(`${at}.date`, "the wedding's date, YYYY-MM-DD (it gives the light that evening)");
    if (x?.story !== undefined && (!Array.isArray(x.story) || !x.story.every(isStr))) err(`${at}.story`, "a few short paragraphs, in the studio's words");
    if (x?.photographs !== undefined && !isStr(x.photographs)) err(`${at}.photographs`, "the id of this wedding on the photographs page");
    file(err, `${at}.poster`, x?.poster, exists, ["src", "width", "height", "alt"]);
    file(err, `${at}.clip`, x?.clip, exists, ["src", "width", "height"], "clip");
    if (x?.watch !== undefined && !/^https:\/\/(vimeo\.com|www\.youtube\.com|youtu\.be)\//.test(x.watch)) err(`${at}.watch`, "the full film on the studio's Vimeo or YouTube");
  });
}

/** @param {any} p @param {Report} err @param {Exists} exists */
function checkPhotographs(p, err, exists) {
  if (!isObj(p) || !Array.isArray(p.weddings) || !p.weddings.length) { err("photographs.weddings", "at least one wedding: { id, title, venue, photos }"); return; }
  onlyKeys(p, ["weddings"], "photographs", err);
  ids(err, "photographs.weddings", p.weddings);
  p.weddings.forEach((/** @type {any} */ w, /** @type {number} */ i) => {
    const at = `photographs.weddings[${i}]`;
    onlyKeys(w, ["id", "title", "venue", "photos"], at, err);
    text(err, `${at}.title`, w?.title);
    text(err, `${at}.venue`, w?.venue);
    if (!Array.isArray(w?.photos) || w.photos.length < 2) err(`${at}.photos`, "two or more photographs from the wedding");
    else w.photos.forEach((/** @type {any} */ ph, /** @type {number} */ j) => file(err, `${at}.photos[${j}]`, ph, exists, PHOTO));
  });
}

/** @param {any} l @param {Set<string>} places @param {Report} err @param {Exists} exists */
function checkPlanner(l, places, err, exists) {
  if (!isObj(l)) { err("lightPlanner", "{ message, date, place, portrait }"); return; }
  onlyKeys(l, ["message", "date", "place", "portrait", "photo"], "lightPlanner", err);
  if (l.photo !== undefined) file(err, "lightPlanner.photo", l.photo, exists, PHOTO);
  text(err, "lightPlanner.message", l.message);
  if (!isYmd(l.date)) err("lightPlanner.date", "the date the sentence opens on, YYYY-MM-DD (a summer Saturday shows the long evening)");
  if (!places.has(l.place)) err("lightPlanner.place", "one of the places ids");
  if (l.portrait !== undefined) {
    onlyKeys(l.portrait, ["start", "length"], "lightPlanner.portrait", err);
    if (!Number.isInteger(l.portrait?.start) || l.portrait.start < 0 || l.portrait.start > 90) err("lightPlanner.portrait.start", "minutes after golden hour begins that the studio starts portraits, 0–90");
    if (!Number.isInteger(l.portrait?.length) || l.portrait.length < 10 || l.portrait.length > 90) err("lightPlanner.portrait.length", "how long the studio keeps for portraits, in minutes, 10–90");
  }
}
