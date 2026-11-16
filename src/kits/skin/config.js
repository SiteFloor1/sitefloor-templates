// @ts-check
/**
 * Validation for the skin kit (facialists, skin clinics and hotel-style beauty salons). Every word, minute, price
 * and interval is the clinic's own; these checks make sure the site keeps the UK rules (src/kits/skin/lib/rules.js):
 * no medical claims, no promised or permanent results, no injectables, and every line of the "which facial" card
 * (afterwards, patch test, this evening) written by the clinic in site.json, never by the kit.
 */
import { claimProblem } from "./lib/rules.js";
import { allItems } from "./lib/skin.js";
import { isYmd } from "../../core/lib/diary.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @typedef {((rel: string) => boolean)|undefined} Exists */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const ID = /^[a-z0-9-]{1,40}$/;

/** @param {Report} err @param {string} path @param {any} v */
function text(err, path, v) { if (!isStr(v)) err(path, "required text is missing"); }

/** A misspelt setting is refused, not silently ignored. @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (isObj(o)) for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}

/** @param {Report} err @param {string} path @param {any} v @param {string} what @returns {v is any[]} */
function list(err, path, v, what) {
  if (Array.isArray(v) && v.length) return true;
  err(path, `at least one ${what}`);
  return false;
}

/** Unique ids. @param {Report} err @param {string} path @param {any[]} items @param {string} [key] */
function ids(err, path, items, key = "id") {
  const seen = new Set();
  items.forEach((x, i) => {
    if (!ID.test(x?.[key] ?? "")) err(`${path}[${i}].${key}`, "lowercase letters, numbers and dashes");
    else if (seen.has(x[key])) err(`${path}[${i}].${key}`, `"${x[key]}" is used twice`);
    seen.add(x?.[key]);
  });
}

/** @param {Report} err @param {string} path @param {any} v @param {number} lo @param {number} hi @param {string} what */
function int(err, path, v, lo, hi, what) { if (!Number.isInteger(v) || v < lo || v > hi) err(path, what); }

const PHOTO = ["src", "width", "height", "alt", "focus"];
/** @param {Report} err @param {string} path @param {any} p @param {Exists} exists */
function photo(err, path, p, exists) {
  if (!isObj(p)) { err(path, "a photo: { src, width, height, alt }"); return; }
  onlyKeys(p, PHOTO, path, err);
  text(err, `${path}.alt`, p.alt);
  if (!Number.isInteger(p.width) || !Number.isInteger(p.height)) err(path, "width and height in pixels");
  if (p.focus !== undefined && !/^\d{1,3}% \d{1,3}%$/.test(p.focus)) err(`${path}.focus`, 'where the subject sits, e.g. "50% 40%"');
  if (!isStr(p.src)) err(`${path}.src`, "required");
  else if (exists && !exists(p.src)) err(`${path}.src`, `file not found: ${p.src}`);
}

/** Headed paragraphs in the clinic's words. @param {Report} err @param {string} path @param {any} s */
function sections(err, path, s) {
  if (!list(err, path, s, "{ heading, text }")) return;
  s.forEach((/** @type {any} */ x, /** @type {number} */ i) => { onlyKeys(x, ["heading", "text"], `${path}[${i}]`, err); text(err, `${path}[${i}].heading`, x?.heading); text(err, `${path}[${i}].text`, x?.text); });
}

/** @param {Report} err @param {string} path @param {any} o @param {string[]} keys */
function page(err, path, o, keys) {
  if (!isObj(o)) { err(path, `{ ${["title", "intro", ...keys].join(", ")} }`); return false; }
  onlyKeys(o, ["title", "intro", ...keys], path, err);
  text(err, `${path}.title`, o.title);
  if (o.intro !== undefined) text(err, `${path}.intro`, o.intro);
  return true;
}

/** @param {any} site @param {Report} err @param {Exists} [exists] */
export function checkSkin(site, err, exists) {
  if (site.kit !== "skin") return;
  if (site.look === "palm") checkHero(site.hero, err, exists);
  const items = checkMenu(site.menu, err, exists);
  if ((site.features ?? []).includes("skin-category-pages")) (site.menu?.categories ?? []).forEach((/** @type {any} */ c, /** @type {number} */ i) => { if (!isObj(c?.page)) err(`menu.categories[${i}].page`, "with the category pages on, every part of the menu needs its page: { title, intro? }"); });
  if (site.finder !== undefined) checkFinder(site.finder, items, err);
  if (site.firstVisit !== undefined) checkFirstVisit(site.firstVisit, err);
  if (site.courses !== undefined) checkCourses(site.courses, items, err);
  if (site.rooms !== undefined) checkRooms(site.rooms, err, exists);
  if (site.rituals !== undefined) checkRituals(site.rituals, items, err);
  if (site.spaDays !== undefined) checkSpaDays(site.spaDays, site.mode, err);
  if (site.rhythm !== undefined) checkRhythm(site.rhythm, items, site.features ?? [], err);
  if (site.bridal !== undefined) checkBridal(site.bridal, err);
  if (site.journal !== undefined) checkJournal(site.journal, err);
  claims(site, err);
}

/** The Palm look's hero: one large photograph, credited, with where the face sits. @param {any} h @param {Report} err @param {Exists} exists */
function checkHero(h, err, exists) {
  if (!isObj(h)) { err("hero", "{ kicker, photo, phonePhoto?, credit }"); return; }
  onlyKeys(h, ["kicker", "title", "intro", "photo", "phonePhoto", "credit"], "hero", err);
  text(err, "hero.kicker", h.kicker);
  photo(err, "hero.photo", h.photo, exists);
  if (h.phonePhoto !== undefined) photo(err, "hero.phonePhoto", h.phonePhoto, exists);
  if (h.credit !== undefined) text(err, "hero.credit", h.credit);
}

const ITEM = ["id", "name", "minutes", "price", "from", "line", "concerns", "afterwards", "patch", "evening", "rhythm"];
/**
 * The menu: categories (facials, brows and lashes, body, waxing, men's) with their treatments, each with the
 * clinic's minutes, price and line; a category with `page` gets a page of its own.
 * @param {any} m @param {Report} err @param {Exists} exists @returns {Map<string, any>}
 */
function checkMenu(m, err, exists) {
  /** @type {Map<string, any>} */ const out = new Map();
  if (m === undefined) return out;
  if (!isObj(m) || !list(err, "menu.categories", m.categories, "category")) return out;
  onlyKeys(m, ["categories"], "menu", err);
  ids(err, "menu.categories", m.categories);
  const seen = new Set();
  m.categories.forEach((/** @type {any} */ c, /** @type {number} */ i) => {
    const at = `menu.categories[${i}]`;
    onlyKeys(c, ["id", "name", "line", "page", "items"], at, err);
    text(err, `${at}.name`, c?.name);
    if (c?.line !== undefined) text(err, `${at}.line`, c.line);
    if (c?.page !== undefined && page(err, `${at}.page`, c.page, ["photo", "sections"])) {
      if (c.page.photo !== undefined) photo(err, `${at}.page.photo`, c.page.photo, exists);
      if (c.page.sections !== undefined) sections(err, `${at}.page.sections`, c.page.sections);
    }
    if (!list(err, `${at}.items`, c?.items, "treatment")) return;
    c.items.forEach((/** @type {any} */ x, /** @type {number} */ j) => {
      const p = `${at}.items[${j}]`;
      onlyKeys(x, ITEM, p, err);
      if (!ID.test(x?.id ?? "")) err(`${p}.id`, "lowercase letters, numbers and dashes");
      else if (seen.has(x.id)) err(`${p}.id`, `"${x.id}" is used twice in the menu`);
      seen.add(x?.id);
      text(err, `${p}.name`, x?.name);
      text(err, `${p}.line`, x?.line);
      int(err, `${p}.minutes`, x?.minutes, 5, 480, "how long it takes, in minutes (5–480)");
      int(err, `${p}.price`, x?.price, 0, 5000, "the clinic's price in whole pounds");
      if (x?.from !== undefined && x.from !== true) err(`${p}.from`, 'true when the price is a "from" price');
      for (const k of ["afterwards", "patch", "evening"]) if (x?.[k] !== undefined) text(err, `${p}.${k}`, x[k]);
      if (x?.concerns !== undefined && (!Array.isArray(x.concerns) || !x.concerns.length || !x.concerns.every((/** @type {any} */ w) => isStr(w) && w.length <= 16 && !/[A-Z]/.test(w)))) err(`${p}.concerns`, 'the words a client uses for how their skin feels, e.g. ["tight", "tired"]');
      if (x?.rhythm !== undefined) checkItemRhythm(x.rhythm, `${p}.rhythm`, err);
      if (x?.id) out.set(x.id, x);
    });
  });
  return out;
}

/** The clinic's own spacing and reminders for one treatment. @param {any} r @param {string} at @param {Report} err */
function checkItemRhythm(r, at, err) {
  if (!isObj(r)) { err(at, "{ everyWeeks, reminders?: [{ id, afterDays, label, note? }] }"); return; }
  onlyKeys(r, ["everyWeeks", "reminders"], at, err);
  int(err, `${at}.everyWeeks`, r.everyWeeks, 1, 26, "weeks between visits, as the clinic advises (1–26)");
  if (r.reminders === undefined) return;
  if (!list(err, `${at}.reminders`, r.reminders, "reminder")) return;
  ids(err, `${at}.reminders`, r.reminders);
  r.reminders.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    onlyKeys(x, ["id", "afterDays", "label", "note"], `${at}.reminders[${i}]`, err);
    int(err, `${at}.reminders[${i}].afterDays`, x?.afterDays, 0, 90, "days after the visit (0 = that evening)");
    text(err, `${at}.reminders[${i}].label`, x?.label);
    if (x?.note !== undefined) text(err, `${at}.reminders[${i}].note`, x.note);
  });
}

/**
 * "Which facial is right for me?": two to six words for how skin feels today, each the clinic's choice of
 * treatment. The card shows only what the clinic wrote for that treatment, so each one needs its afterwards and
 * patch-test lines; "this evening" is shown only when the clinic wrote one.
 * @param {any} f @param {Map<string, any>} items @param {Report} err
 */
function checkFinder(f, items, err) {
  if (!page(err, "finder", f, ["words", "message", "note"])) return;
  text(err, "finder.message", f.message);
  text(err, "finder.note", f.note);
  if (!list(err, "finder.words", f.words, "word: { word, item }")) return;
  if (f.words.length < 2 || f.words.length > 6) err("finder.words", "two to six words");
  const seen = new Set();
  f.words.forEach((/** @type {any} */ w, /** @type {number} */ i) => {
    const at = `finder.words[${i}]`;
    onlyKeys(w, ["word", "item"], at, err);
    if (!isStr(w?.word) || w.word.length > 16 || /[A-Z]/.test(w.word)) err(`${at}.word`, "one or two lowercase words, as a client would say them");
    else if (seen.has(w.word)) err(`${at}.word`, `"${w.word}" is used twice`);
    seen.add(w?.word);
    const x = items.get(w?.item);
    if (!x) err(`${at}.item`, `the id of a treatment in the menu (${[...items.keys()].slice(0, 6).join(", ")}…)`);
    else for (const k of ["afterwards", "patch"]) if (!isStr(x[k])) err(`${at}.item`, `"${x.id}" has no "${k}" line; the card shows only the clinic's own words`);
  });
}

/** @param {any} f @param {Report} err */
function checkFirstVisit(f, err) {
  if (!page(err, "firstVisit", f, ["sections", "patch"])) return;
  sections(err, "firstVisit.sections", f.sections);
  const p = f.patch;
  if (!isObj(p)) { err("firstVisit.patch", "{ hoursBefore, line }: the clinic's patch-test rule"); return; }
  onlyKeys(p, ["hoursBefore", "line"], "firstVisit.patch", err);
  int(err, "firstVisit.patch.hoursBefore", p.hoursBefore, 24, 168, "hours before the appointment, 24–168 (48 is the usual rule)");
  text(err, "firstVisit.patch.line", p.line);
}

/** BEAU-4: courses (a treatment, how many, how far apart, the price) and memberships. @param {any} c @param {Map<string, any>} items @param {Report} err */
function checkCourses(c, items, err) {
  if (!page(err, "courses", c, ["courses", "memberships", "note"])) return;
  if (c.note !== undefined) text(err, "courses.note", c.note);
  if (list(err, "courses.courses", c.courses, "course")) {
    ids(err, "courses.courses", c.courses);
    c.courses.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
      const at = `courses.courses[${i}]`;
      onlyKeys(x, ["id", "item", "count", "everyWeeks", "price", "line"], at, err);
      if (!items.has(x?.item)) err(`${at}.item`, "the id of the treatment in the menu");
      int(err, `${at}.count`, x?.count, 2, 12, "how many treatments in the course (2–12)");
      int(err, `${at}.everyWeeks`, x?.everyWeeks, 1, 12, "weeks between them (1–12)");
      int(err, `${at}.price`, x?.price, 1, 10000, "the course price in whole pounds");
      text(err, `${at}.line`, x?.line);
    });
  }
  if (c.memberships !== undefined && list(err, "courses.memberships", c.memberships, "membership")) {
    ids(err, "courses.memberships", c.memberships);
    c.memberships.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
      const at = `courses.memberships[${i}]`;
      onlyKeys(x, ["id", "name", "monthly", "includes", "line"], at, err);
      text(err, `${at}.name`, x?.name);
      int(err, `${at}.monthly`, x?.monthly, 1, 2000, "the monthly price in whole pounds");
      if (!Array.isArray(x?.includes) || !x.includes.length || !x.includes.every(isStr)) err(`${at}.includes`, "what a month includes, line by line");
      text(err, `${at}.line`, x?.line);
    });
  }
}

/** BEAU-5: the rooms, each a photograph and a line. @param {any} r @param {Report} err @param {Exists} exists */
function checkRooms(r, err, exists) {
  if (!page(err, "rooms", r, ["rooms"])) return;
  if (list(err, "rooms.rooms", r.rooms, "room: { photo, name, text }")) r.rooms.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    onlyKeys(x, ["photo", "name", "text"], `rooms.rooms[${i}]`, err);
    photo(err, `rooms.rooms[${i}].photo`, x?.photo, exists);
    text(err, `rooms.rooms[${i}].name`, x?.name);
    text(err, `rooms.rooms[${i}].text`, x?.text);
  });
}

/** BEAU-6: the ritual builder: the treatments it starts from and the clinic's add-ons. @param {any} r @param {Map<string, any>} items @param {Report} err */
function checkRituals(r, items, err) {
  if (!page(err, "rituals", r, ["bases", "addOns", "message", "note"])) return;
  text(err, "rituals.message", r.message);
  text(err, "rituals.note", r.note);
  if (list(err, "rituals.bases", r.bases, "treatment id to start from")) r.bases.forEach((/** @type {any} */ id, /** @type {number} */ i) => { if (!items.has(id)) err(`rituals.bases[${i}]`, "the id of a treatment in the menu"); });
  if (list(err, "rituals.addOns", r.addOns, "add-on: { id, name, minutes, price, line }")) {
    ids(err, "rituals.addOns", r.addOns);
    if (r.addOns.length > 8) err("rituals.addOns", "eight add-ons at most");
    r.addOns.forEach((/** @type {any} */ a, /** @type {number} */ i) => {
      const at = `rituals.addOns[${i}]`;
      onlyKeys(a, ["id", "name", "minutes", "price", "line"], at, err);
      text(err, `${at}.name`, a?.name);
      text(err, `${at}.line`, a?.line);
      int(err, `${at}.minutes`, a?.minutes, 0, 120, "the minutes it adds (0–120)");
      int(err, `${at}.price`, a?.price, 0, 1000, "the price it adds, whole pounds");
    });
  }
}

const PAY = /^https:\/\/(buy\.stripe\.com|checkout\.stripe\.com|donate\.stripe\.com)\//;
/**
 * BEAU-7 and BEAU-9: spa days sold as a gift. Each day is the clinic's own (what it includes, minutes, price) and is
 * bought through the clinic's Stripe Payment Link, or on WhatsApp when there isn't one.
 * @param {any} s @param {string} mode @param {Report} err
 */
function checkSpaDays(s, mode, err) {
  if (!page(err, "spaDays", s, ["days", "message", "cardNote", "terms"])) return;
  text(err, "spaDays.message", s.message);
  text(err, "spaDays.terms", s.terms);
  if (s.cardNote !== undefined) text(err, "spaDays.cardNote", s.cardNote);
  if (!list(err, "spaDays.days", s.days, "spa day")) return;
  ids(err, "spaDays.days", s.days);
  s.days.forEach((/** @type {any} */ d, /** @type {number} */ i) => {
    const at = `spaDays.days[${i}]`;
    onlyKeys(d, ["id", "name", "line", "includes", "minutes", "price", "payLink"], at, err);
    text(err, `${at}.name`, d?.name);
    text(err, `${at}.line`, d?.line);
    int(err, `${at}.minutes`, d?.minutes, 30, 720, "how long the day lasts, in minutes");
    int(err, `${at}.price`, d?.price, 1, 10000, "the price in whole pounds");
    if (!Array.isArray(d?.includes) || !d.includes.length || !d.includes.every(isStr)) err(`${at}.includes`, "what the day includes, line by line");
    if (d?.payLink !== undefined) {
      if (mode === "demo") err(`${at}.payLink`, "a demo takes no payments; leave it out (the gift goes to WhatsApp)");
      else if (!PAY.test(d.payLink)) err(`${at}.payLink`, "the clinic's own Stripe Payment Link (https://buy.stripe.com/…)");
    }
  });
}

/**
 * BEAU-8: treatment rhythm reminders. The page offers every treatment that has the clinic's `rhythm` in the menu.
 * @param {any} r @param {Map<string, any>} items @param {string[]} features @param {Report} err
 */
function checkRhythm(r, items, features, err) {
  if (!page(err, "rhythm", r, ["message"])) return;
  text(err, "rhythm.message", r.message);
  if (features.includes("skin-rhythm") && ![...items.values()].some((x) => x.rhythm)) err("rhythm", "no treatment in the menu has a \"rhythm\" (the clinic's spacing and reminders)");
}

/** The bridal beauty timeline: steps the clinic books, weeks before the day. @param {any} b @param {Report} err */
function checkBridal(b, err) {
  if (!page(err, "bridal", b, ["steps", "late", "message"])) return;
  text(err, "bridal.late", b.late);
  text(err, "bridal.message", b.message);
  if (!list(err, "bridal.steps", b.steps, "step: { id, label, weeksBefore }")) return;
  ids(err, "bridal.steps", b.steps);
  b.steps.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    onlyKeys(s, ["id", "label", "weeksBefore", "note"], `bridal.steps[${i}]`, err);
    text(err, `bridal.steps[${i}].label`, s?.label);
    int(err, `bridal.steps[${i}].weeksBefore`, s?.weeksBefore, 0, 52, "weeks before the day, 0–52, from the clinic's own timings");
  });
}

/** @param {any} j @param {Report} err */
function checkJournal(j, err) {
  if (!page(err, "journal", j, ["items"])) return;
  if (!list(err, "journal.items", j.items, "piece")) return;
  ids(err, "journal.items", j.items, "slug");
  j.items.forEach((/** @type {any} */ a, /** @type {number} */ i) => {
    const at = `journal.items[${i}]`;
    onlyKeys(a, ["slug", "title", "date", "by", "intro", "sections"], at, err);
    text(err, `${at}.title`, a?.title);
    text(err, `${at}.intro`, a?.intro);
    text(err, `${at}.by`, a?.by);
    if (!isYmd(a?.date)) err(`${at}.date`, "the day it was written, YYYY-MM-DD");
    sections(err, `${at}.sections`, a?.sections);
  });
}

/**
 * The clinic's words never make a claim CAP says a cosmetic treatment can't: every string in site.json is checked
 * (file paths, links and ids aside).
 * @param {any} site @param {Report} err
 */
function claims(site, err) {
  const skip = new Set(["src", "url", "href", "image", "directionsUrl", "sameAs", "features", "id", "slug", "payLink", "item", "bases", "credit", "alt"]);
  /** @param {any} v @param {string} path */
  const walk = (v, path) => {
    if (typeof v === "string") { const why = claimProblem(v); if (why) err(path, why); }
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (isObj(v)) for (const [k, x] of Object.entries(v)) if (!skip.has(k)) walk(x, path ? `${path}.${k}` : k);
  };
  walk(site, "");
}

/** For tests and docs: every menu item. @param {any} site */
export const menuItems = (site) => (site.menu ? allItems(site.menu) : []);
