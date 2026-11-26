// @ts-check
/**
 * Validation for the ballet kit (children's dance and ballet schools): the hero, the classes by age, the year's dates,
 * the trial class, the uniform, fees in the school's words, exams, places left, catch-up classes, shows and tickets,
 * the parent handbook, show day by code and the classes a dancer moves through. Every class, time, fee, date, rule and
 * exam board is the school's own; the checks only make sure it is complete and can't mislead. A misspelt setting is
 * refused rather than silently ignored, and simulated data is refused on a client site.
 */
import { DAYS, KINDS } from "./lib/ballet.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @typedef {((rel: string) => boolean)|undefined} Exists */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
/** @param {any} v @param {number} lo @param {number} hi */
const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const ID = /^[a-z0-9-]{1,40}$/;
const YMD = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const PHOTO = ["src", "width", "height", "alt"];
const PAGE_HEAD = ["kicker", "title", "intro"];
const HTTPS = /^https:\/\/[^\s]+$/;

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

/** @param {Report} err @param {string} p @param {any} v */
function ymd(err, p, v) {
  if (!YMD.test(v ?? "") || Number.isNaN(Date.parse(`${v}T12:00:00Z`))) err(p, "a date, YYYY-MM-DD");
}

/** @param {Report} err @param {string} k @param {any} v */
function pageHead(err, k, v) {
  if (!isObj(v)) { err(k, "{ kicker, title, intro }"); return; }
  onlyKeys(v, PAGE_HEAD, k, err);
  text(err, `${k}.title`, v.title);
}

/** @param {Report} err @param {string} p @param {any} v @param {number} lo @param {number} hi @param {string} what */
function list(err, p, v, lo, hi, what) {
  if (!Array.isArray(v) || v.length < lo || v.length > hi) { err(p, `${lo} to ${hi} ${what}`); return false; }
  return true;
}

/** A live sheet: { source, csvUrl, staleAfterDays? }. @param {Report} err @param {string} p @param {any} v @param {string} mode */
function sheet(err, p, v, mode) {
  if (v.source === "simulated") { if (mode !== "demo") err(`${p}.source`, "simulated data is for demos; a client site reads the school's own Google Sheet"); return; }
  if (v.source !== "sheet") { err(`${p}.source`, "\"sheet\" (the school's published Google Sheet)"); return; }
  if (!/^https:\/\/docs\.google\.com\/spreadsheets\/[^\s]+output=csv/.test(v.csvUrl ?? "")) err(`${p}.csvUrl`, "the sheet's published CSV address (File > Share > Publish to web > CSV)");
  if (v.staleAfterDays !== undefined && !isInt(v.staleAfterDays, 1, 60)) err(`${p}.staleAfterDays`, "1 to 60 days");
}

/** @param {any} site @param {Report} err @param {Exists} [exists] */
export function checkBallet(site, err, exists) {
  if (site.kit !== "ballet") return;
  // Every trial, catch-up, waiting-list and show-day request is a WhatsApp message to the school.
  if (site.booking?.provider !== "whatsapp") err("booking.provider", "\"whatsapp\": every trial, catch-up and waiting-list request on this kit is a WhatsApp message to the school");
  checkHero(site.hero, err, exists);
  const classIds = site.classes !== undefined ? checkClasses(site.classes, err) : new Set();
  if (site.year !== undefined) checkYear(site.year, err);
  if (site.trial !== undefined) checkTrial(site.trial, err, exists);
  if (site.uniform !== undefined) checkUniform(site.uniform, classIds, err, exists);
  if (site.fees !== undefined) checkFees(site.fees, err);
  if (site.exams !== undefined) checkExams(site.exams, classIds, err, exists);
  if (site.places !== undefined) checkPlaces(site.places, site.mode, err);
  checkWords(site, err);
  const showIds = site.shows !== undefined ? checkShows(site.shows, err, exists) : new Set();
  if (site.handbook !== undefined) checkHandbook(site.handbook, err);
  if (site.showDay !== undefined) checkShowDay(site.showDay, showIds, site.mode, err, exists);
  for (const k of ["classesPage", "timetablePage", "trialPage", "feesPage", "examsPage", "showsPage", "uniformPage", "handbookPage", "showDayPage"]) if (site[k] !== undefined) pageHead(err, k, site[k]);
}

/** The school's own words on catch-ups and on moving up. @param {any} site @param {Report} err */
function checkWords(site, err) {
  if (site.catchUp !== undefined) { onlyKeys(site.catchUp, ["text", "message"], "catchUp", err); text(err, "catchUp.text", site.catchUp?.text); text(err, "catchUp.message", site.catchUp?.message); }
  if (site.path !== undefined) { onlyKeys(site.path, ["text"], "path", err); text(err, "path.text", site.path?.text); }
}

/** @param {any} h @param {Report} err @param {Exists} exists */
function checkHero(h, err, exists) {
  if (!isObj(h)) return; // the shared check reports a missing hero
  onlyKeys(h, ["kicker", "title", "intro", "photo", "question"], "hero", err);
  photo(err, "hero.photo", h.photo, exists);
  if (h.question !== undefined) text(err, "hero.question", h.question);
}

/** @param {any} c @param {Report} err @returns {Set<string>} */
function checkClasses(c, err) {
  if (!isObj(c)) { err("classes", "{ message, items }"); return new Set(); }
  onlyKeys(c, ["message", "items", "note"], "classes", err);
  text(err, "classes.message", c.message);
  if (c.note !== undefined) text(err, "classes.note", c.note);
  if (!list(err, "classes.items", c.items, 1, 24, "classes, each { id, name, ages, level, minutes, sessions, text? }")) return new Set();
  const seen = ids(err, "classes.items", c.items);
  c.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `classes.items[${i}]`;
    onlyKeys(x, ["id", "name", "ages", "level", "minutes", "sessions", "text"], p, err);
    text(err, `${p}.name`, x?.name);
    if (!Array.isArray(x?.ages) || x.ages.length !== 2 || !isInt(x.ages[0], 1, 25) || !isInt(x.ages[1], 1, 25) || x.ages[0] > x.ages[1]) err(`${p}.ages`, "[youngest, oldest], e.g. [3, 4]");
    if (!isInt(x?.level, 0, 20)) err(`${p}.level`, "a number: classes with the same level can stand in for each other (catch-ups)");
    if (!isInt(x?.minutes, 15, 240)) err(`${p}.minutes`, "the class's length in minutes, 15 to 240");
    if (x?.text !== undefined) text(err, `${p}.text`, x.text);
    if (list(err, `${p}.sessions`, x?.sessions, 1, 7, "sessions, each { day, time }")) {
      x.sessions.forEach((/** @type {any} */ s, /** @type {number} */ j) => {
        onlyKeys(s, ["day", "time"], `${p}.sessions[${j}]`, err);
        if (!DAYS.includes(s?.day)) err(`${p}.sessions[${j}].day`, `one of ${DAYS.join(", ")}`);
        if (!HHMM.test(s?.time ?? "")) err(`${p}.sessions[${j}].time`, "24-hour time, HH:MM");
      });
    }
  });
  return seen;
}

/** @param {any} y @param {Report} err */
function checkYear(y, err) {
  if (!isObj(y)) { err("year", "{ items }"); return; }
  onlyKeys(y, ["items", "note"], "year", err);
  if (y.note !== undefined) text(err, "year.note", y.note);
  if (!list(err, "year.items", y.items, 1, 30, "dates, each { id, date, end?, label, kind }")) return;
  ids(err, "year.items", y.items);
  y.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `year.items[${i}]`;
    onlyKeys(x, ["id", "date", "end", "label", "kind"], p, err);
    ymd(err, `${p}.date`, x?.date);
    if (x?.end !== undefined) { ymd(err, `${p}.end`, x.end); if (x.end < x.date) err(`${p}.end`, "on or after the date"); }
    text(err, `${p}.label`, x?.label);
    if (!KINDS.includes(x?.kind)) err(`${p}.kind`, `one of ${KINDS.join(", ")}`);
  });
}

/** @param {any} t @param {Report} err @param {Exists} exists */
function checkTrial(t, err, exists) {
  if (!isObj(t)) { err("trial", "{ message, photo, steps }"); return; }
  onlyKeys(t, ["message", "photo", "steps", "price", "note"], "trial", err);
  text(err, "trial.message", t.message);
  photo(err, "trial.photo", t.photo, exists);
  for (const k of ["price", "note"]) if (t[k] !== undefined) text(err, `trial.${k}`, t[k]);
  if (list(err, "trial.steps", t.steps, 2, 6, "steps, each { label, text }")) t.steps.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    onlyKeys(s, ["label", "text"], `trial.steps[${i}]`, err); text(err, `trial.steps[${i}].label`, s?.label); text(err, `trial.steps[${i}].text`, s?.text);
  });
}

/** @param {any} u @param {Set<string>} classIds @param {Report} err @param {Exists} exists */
function checkUniform(u, classIds, err, exists) {
  if (!isObj(u)) { err("uniform", "{ photo, sets, shop? }"); return; }
  onlyKeys(u, ["photo", "sets", "shop", "note"], "uniform", err);
  photo(err, "uniform.photo", u.photo, exists);
  if (u.note !== undefined) text(err, "uniform.note", u.note);
  if (u.shop !== undefined) {
    onlyKeys(u.shop, ["label", "url"], "uniform.shop", err);
    text(err, "uniform.shop.label", u.shop?.label);
    if (!HTTPS.test(u.shop?.url ?? "")) err("uniform.shop.url", "the supplier's https address");
  }
  if (!list(err, "uniform.sets", u.sets, 1, 12, "sets, each { id, name, classes, items }")) return;
  ids(err, "uniform.sets", u.sets);
  u.sets.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    const p = `uniform.sets[${i}]`;
    onlyKeys(s, ["id", "name", "classes", "items"], p, err);
    text(err, `${p}.name`, s?.name);
    if (!Array.isArray(s?.classes)) err(`${p}.classes`, "the class ids this set is for (may be empty)");
    else s.classes.forEach((/** @type {any} */ c, /** @type {number} */ j) => { if (classIds.size && !classIds.has(c)) err(`${p}.classes[${j}]`, `no class "${c}"`); });
    if (list(err, `${p}.items`, s?.items, 1, 12, "items, each { name, note? }")) s.items.forEach((/** @type {any} */ x, /** @type {number} */ j) => {
      onlyKeys(x, ["name", "note"], `${p}.items[${j}]`, err); text(err, `${p}.items[${j}].name`, x?.name);
      if (x?.note !== undefined) text(err, `${p}.items[${j}].note`, x.note);
    });
  });
}

/** @param {any} f @param {Report} err */
function checkFees(f, err) {
  if (!isObj(f)) { err("fees", "{ items, terms }"); return; }
  onlyKeys(f, ["items", "terms", "note"], "fees", err);
  if (f.note !== undefined) text(err, "fees.note", f.note);
  if (list(err, "fees.items", f.items, 1, 16, "fees, each { label, text } in the school's own words")) f.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    onlyKeys(x, ["label", "text"], `fees.items[${i}]`, err); text(err, `fees.items[${i}].label`, x?.label); text(err, `fees.items[${i}].text`, x?.text);
  });
  if (list(err, "fees.terms", f.terms, 1, 12, "terms and conditions, one line each")) f.terms.forEach((/** @type {any} */ x, /** @type {number} */ i) => text(err, `fees.terms[${i}]`, x));
}

/** @param {any} e @param {Set<string>} classIds @param {Report} err @param {Exists} exists */
function checkExams(e, classIds, err, exists) {
  if (!isObj(e)) { err("exams", "{ text, items }"); return; }
  onlyKeys(e, ["board", "text", "items", "photo"], "exams", err);
  text(err, "exams.text", e.text);
  if (e.board !== undefined) text(err, "exams.board", e.board);
  if (e.photo !== undefined) photo(err, "exams.photo", e.photo, exists);
  if (!list(err, "exams.items", e.items, 1, 20, "exam dates, each { id, date, label, classes }")) return;
  ids(err, "exams.items", e.items);
  e.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `exams.items[${i}]`;
    onlyKeys(x, ["id", "date", "label", "classes"], p, err);
    ymd(err, `${p}.date`, x?.date);
    text(err, `${p}.label`, x?.label);
    if (!Array.isArray(x?.classes) || !x.classes.length) err(`${p}.classes`, "the class ids sitting it");
    else x.classes.forEach((/** @type {any} */ c, /** @type {number} */ j) => { if (classIds.size && !classIds.has(c)) err(`${p}.classes[${j}]`, `no class "${c}"`); });
  });
}

/** @param {any} p @param {string} mode @param {Report} err */
function checkPlaces(p, mode, err) {
  if (!isObj(p)) { err("places", "{ source, csvUrl, message }"); return; }
  onlyKeys(p, ["source", "csvUrl", "staleAfterDays", "message"], "places", err);
  text(err, "places.message", p.message);
  sheet(err, "places", p, mode);
}

/** @param {any} s @param {Report} err @param {Exists} exists @returns {Set<string>} */
function checkShows(s, err, exists) {
  if (!isObj(s)) { err("shows", "{ items, photo }"); return new Set(); }
  onlyKeys(s, ["items", "photo", "note"], "shows", err);
  photo(err, "shows.photo", s.photo, exists);
  if (s.note !== undefined) text(err, "shows.note", s.note);
  if (!list(err, "shows.items", s.items, 1, 8, "shows, each { id, name, date, time, venue, tickets, filming }")) return new Set();
  const seen = ids(err, "shows.items", s.items);
  s.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `shows.items[${i}]`;
    onlyKeys(x, ["id", "name", "date", "time", "venue", "address", "running", "tickets", "filming", "text"], p, err);
    text(err, `${p}.name`, x?.name);
    ymd(err, `${p}.date`, x?.date);
    if (!HHMM.test(x?.time ?? "")) err(`${p}.time`, "curtain up, 24-hour HH:MM");
    text(err, `${p}.venue`, x?.venue);
    text(err, `${p}.filming`, x?.filming);
    for (const k of ["address", "running", "text"]) if (x?.[k] !== undefined) text(err, `${p}.${k}`, x[k]);
    const t = x?.tickets;
    if (!isObj(t)) { err(`${p}.tickets`, "{ url, label?, opens? }: the school's own ticket page"); return; }
    onlyKeys(t, ["url", "label", "opens", "soldOut"], `${p}.tickets`, err);
    if (!HTTPS.test(t.url ?? "")) err(`${p}.tickets.url`, "the school's ticket page, https");
    if (t.label !== undefined) text(err, `${p}.tickets.label`, t.label);
    if (t.opens !== undefined) ymd(err, `${p}.tickets.opens`, t.opens);
    if (t.soldOut !== undefined && typeof t.soldOut !== "boolean") err(`${p}.tickets.soldOut`, "true only when the school says so");
  });
  return seen;
}

/** @param {any} h @param {Report} err */
function checkHandbook(h, err) {
  if (!isObj(h)) { err("handbook", "{ updated, sections }"); return; }
  onlyKeys(h, ["updated", "sections"], "handbook", err);
  if (!/^\d{4}-\d{2}$/.test(h.updated ?? "")) err("handbook.updated", "when the school last checked it, YYYY-MM");
  if (!list(err, "handbook.sections", h.sections, 2, 16, "sections, each { id, title, body }")) return;
  ids(err, "handbook.sections", h.sections);
  h.sections.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    onlyKeys(s, ["id", "title", "body"], `handbook.sections[${i}]`, err);
    text(err, `handbook.sections[${i}].title`, s?.title);
    text(err, `handbook.sections[${i}].body`, s?.body);
  });
}

/** @param {any} d @param {Set<string>} showIds @param {string} mode @param {Report} err @param {Exists} exists */
function checkShowDay(d, showIds, mode, err, exists) {
  if (!isObj(d)) { err("showDay", "{ source, csvUrl, text, message }"); return; }
  onlyKeys(d, ["source", "csvUrl", "staleAfterDays", "show", "text", "message", "photo"], "showDay", err);
  text(err, "showDay.text", d.text);
  text(err, "showDay.message", d.message);
  if (d.photo !== undefined) photo(err, "showDay.photo", d.photo, exists);
  if (d.show !== undefined && !showIds.has(d.show)) err("showDay.show", `no show "${d.show}"`);
  sheet(err, "showDay", d, mode);
}
