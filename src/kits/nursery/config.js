// @ts-check
/**
 * Validation for the nursery kit (day nurseries and pre-schools): the work on the walls, rooms and places, today's
 * notice, fees and funding, the visit request, a day here, food, the Ofsted report, term dates, settling in, the work
 * page and getting ready. Every rate, room, ratio, time, menu, date and Ofsted word is the nursery's own; the checks
 * only make sure it is complete and can't mislead (a price that hides a compulsory extra, a ratio we'd have to guess,
 * an Ofsted link that isn't Ofsted's). A misspelt setting is refused rather than ignored, and simulated data is refused
 * on a client site.
 */
import { DAYS } from "./lib/nursery.js";
import { isYmd } from "../../core/lib/diary.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @typedef {((rel: string) => boolean)|undefined} Exists */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
/** @param {any} v @param {number} lo @param {number} hi */
const isNum = (v, lo, hi) => typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi;
/** @param {any} v @param {number} lo @param {number} hi */
const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const ID = /^[a-z0-9-]{1,40}$/;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const PHOTO = ["src", "width", "height", "alt"];
const PAGE_HEAD = ["kicker", "title", "intro"];
const PAGES = ["roomsPage", "feesPage", "visitPage", "dayPage", "foodPage", "ofstedPage", "termsPage", "settlingPage", "workPage", "readyPage"];
const SHEET = /^https:\/\/docs\.google\.com\/spreadsheets\/[^\s]+output=csv/;
const EYFS = ["Communication and language", "Physical development", "Personal, social and emotional development", "Literacy",
  "Mathematics", "Understanding the world", "Expressive arts and design"];

/** @param {Report} err @param {string} path @param {any} v */
function text(err, path, v) { if (!isStr(v)) err(path, "required text is missing"); }

/** @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (isObj(o)) for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}

/** @param {Report} err @param {string} p @param {any} v @param {string[]} keys @returns {boolean} */
function obj(err, p, v, keys) {
  if (!isObj(v)) { err(p, `{ ${keys.join(", ")} }`); return false; }
  onlyKeys(v, keys, p, err);
  return true;
}

/** @param {Report} err @param {string} path @param {any} p @param {Exists} exists */
function photo(err, path, p, exists) {
  if (!obj(err, path, p, PHOTO)) return;
  text(err, `${path}.alt`, p.alt);
  if (!isInt(p.width, 1, 10000) || !isInt(p.height, 1, 10000)) err(path, "width and height in pixels");
  if (!isStr(p.src)) err(`${path}.src`, "required");
  else if (exists && !exists(p.src)) err(`${path}.src`, `file not found: ${p.src}`);
}

/** @param {Report} err @param {string} p @param {any} v @param {number} lo @param {number} hi @param {string} what */
function list(err, p, v, lo, hi, what) {
  if (!Array.isArray(v) || v.length < lo || v.length > hi) { err(p, `${lo} to ${hi} ${what}`); return false; }
  return true;
}

/** Unique ids in a list. @param {Report} err @param {string} path @param {any[]} items */
function ids(err, path, items) {
  /** @type {Set<string>} */ const seen = new Set();
  items.forEach((x, i) => {
    if (!ID.test(x?.id ?? "")) err(`${path}[${i}].id`, "lowercase letters, numbers and dashes");
    else if (seen.has(x.id)) err(`${path}[${i}].id`, `"${x.id}" is used twice`);
    seen.add(x?.id);
  });
  return seen;
}

/** A live sheet, or the demo's simulation. @param {Report} err @param {string} p @param {any} v @param {string} mode */
function source(err, p, v, mode) {
  if (v.source === "simulated") { if (mode !== "demo") err(`${p}.source`, "simulated data is for demos; a client site reads the nursery's own Google Sheet"); return; }
  if (v.source !== "sheet") { err(`${p}.source`, "\"sheet\" (the nursery's published Google Sheet)"); return; }
  if (!SHEET.test(v.csvUrl ?? "")) err(`${p}.csvUrl`, "the sheet's published CSV address (File > Share > Publish to web > CSV)");
}

/** @param {any} site @param {Report} err @param {Exists} [exists] */
export function checkNursery(site, err, exists) {
  if (site.kit !== "nursery") return;
  if (site.booking?.provider !== "whatsapp") err("booking.provider", "\"whatsapp\": every place, visit and quote question on this kit is a WhatsApp message to the nursery");
  checkHero(site.hero, err, exists);
  const rooms = site.rooms !== undefined ? checkRooms(site.rooms, err, exists) : new Set();
  checkLive(site, err);
  if (site.fees !== undefined) checkFees(site.fees, err);
  if (site.funding !== undefined) checkFunding(site.funding, err);
  if (site.week !== undefined && obj(err, "week", site.week, ["message"])) text(err, "week.message", site.week.message);
  if (site.visit !== undefined) checkVisit(site.visit, err);
  if (site.day !== undefined) checkDay(site.day, err, exists);
  if (site.menu !== undefined) checkMenu(site.menu, err);
  if (site.ofsted !== undefined) checkOfsted(site.ofsted, err);
  checkSignature(site, rooms, err, exists);
  for (const k of PAGES) if (site[k] !== undefined && obj(err, k, site[k], PAGE_HEAD)) text(err, `${k}.title`, site[k].title);
}

/** Term dates, settling in, the work and getting ready. @param {any} site @param {Set<string>} rooms @param {Report} err @param {Exists} exists */
function checkSignature(site, rooms, err, exists) {
  if (site.terms !== undefined) checkTerms(site.terms, err);
  if (site.settling !== undefined) checkSettling(site.settling, err);
  if (site.work !== undefined && obj(err, "work", site.work, ["items", "note"])) checkWorks(err, "work.items", site.work.items, rooms, 2, 40, exists);
  if (site.ready !== undefined) checkReady(site.ready, rooms, err);
}

/** The live sheets: places by room and today's notice. @param {any} site @param {Report} err */
function checkLive(site, err) {
  const p = site.places;
  if (p !== undefined && obj(err, "places", p, ["source", "csvUrl", "staleAfterDays", "months"])) {
    source(err, "places", p, site.mode);
    if (p.staleAfterDays !== undefined && !isInt(p.staleAfterDays, 1, 60)) err("places.staleAfterDays", "1 to 60 days");
    if (p.months !== undefined && !isInt(p.months, 3, 12)) err("places.months", "3 to 12 months ahead");
  }
  if (site.today !== undefined && obj(err, "today", site.today, ["source", "csvUrl"])) source(err, "today", site.today, site.mode);
}

/** Funded hours in the nursery's words, with the day they were checked against gov.uk. @param {any} f @param {Report} err */
function checkFunding(f, err) {
  if (!obj(err, "funding", f, ["checked", "text", "stretched"])) return;
  if (!isYmd(f.checked)) err("funding.checked", "the day the nursery's funding words were checked against gov.uk, YYYY-MM-DD");
  text(err, "funding.text", f.text);
  if (typeof f.stretched !== "boolean") err("funding.stretched", "true if funded hours can be spread over the weeks the nursery is open, false if term-time only");
}

/** The hero: the line, and the pieces of work it shows (one to six). @param {any} h @param {Report} err @param {Exists} exists */
function checkHero(h, err, exists) {
  if (!isObj(h)) return; // the shared check reports a missing hero
  onlyKeys(h, ["kicker", "title", "intro", "photo", "exhibits"], "hero", err);
  photo(err, "hero.photo", h.photo, exists);
  checkWorks(err, "hero.exhibits", h.exhibits, null, 1, 6, exists);
}

/** Pieces of work with their gallery caption. @param {Report} err @param {string} p @param {any} items @param {Set<string>|null} rooms @param {number} lo @param {number} hi @param {Exists} exists */
function checkWorks(err, p, items, rooms, lo, hi, exists) {
  if (!list(err, p, items, lo, hi, "pieces, each { photo, title, room, area, text? }")) return;
  items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    if (!obj(err, `${p}[${i}]`, x, ["photo", "title", "room", "area", "text"])) return;
    photo(err, `${p}[${i}].photo`, x.photo, exists);
    text(err, `${p}[${i}].title`, x.title);
    text(err, `${p}[${i}].room`, x.room);
    if (!EYFS.includes(x.area)) err(`${p}[${i}].area`, `one of the EYFS areas of learning: ${EYFS.join("; ")}`);
    if (x.text !== undefined) text(err, `${p}[${i}].text`, x.text);
  });
}

/** @param {any} r @param {Report} err @param {Exists} exists @returns {Set<string>} */
function checkRooms(r, err, exists) {
  if (!obj(err, "rooms", r, ["items", "picker", "message", "note"])) return new Set();
  text(err, "rooms.message", r.message);
  if (r.note !== undefined) text(err, "rooms.note", r.note);
  if (!list(err, "rooms.items", r.items, 1, 8, "rooms, each { id, name, ages, photo, text?, ratio? }")) return new Set();
  const seen = ids(err, "rooms.items", r.items);
  r.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `rooms.items[${i}]`;
    if (!obj(err, p, x, ["id", "name", "ages", "photo", "text", "ratio"])) return;
    text(err, `${p}.name`, x.name);
    text(err, `${p}.ages`, x.ages);
    photo(err, `${p}.photo`, x.photo, exists);
    if (x.text !== undefined) text(err, `${p}.text`, x.text);
    // A ratio is the nursery's own statement, in its words ("One adult to three children"): never a number we'd format.
    if (x.ratio !== undefined && !isStr(x.ratio)) err(`${p}.ratio`, "the nursery's own words for its ratio, e.g. \"One adult to every three children\"");
  });
  if (list(err, "rooms.picker", r.picker, 2, 10, "age buttons, each { label, room }")) {
    r.picker.forEach((/** @type {any} */ b, /** @type {number} */ i) => {
      if (!obj(err, `rooms.picker[${i}]`, b, ["label", "room"])) return;
      text(err, `rooms.picker[${i}].label`, b.label);
      if (!seen.has(b.room)) err(`rooms.picker[${i}].room`, `one of the rooms: ${[...seen].join(", ")}`);
    });
  }
  return seen;
}

/** Fees: the headline rates include everything compulsory (CMA); every extra is optional (DfE). @param {any} f @param {Report} err */
function checkFees(f, err) {
  if (!obj(err, "fees", f, ["rate", "weeksOpen", "sessions", "items", "includes", "extras", "note", "checked"])) return;
  if (!isNum(f.rate, 1, 50)) err("fees.rate", "the hourly rate in pounds, everything compulsory included, e.g. 9.5");
  if (!isInt(f.weeksOpen, 38, 52)) err("fees.weeksOpen", "the weeks a year the nursery is open, 38 to 52");
  if (obj(err, "fees.sessions", f.sessions, ["full", "am", "pm"])) {
    if (!f.sessions.full) err("fees.sessions.full", "the full day: { label, from, to, hours }");
    for (const [k, s] of Object.entries(f.sessions)) {
      const p = `fees.sessions.${k}`;
      if (!obj(err, p, s, ["label", "from", "to", "hours"])) continue;
      text(err, `${p}.label`, s.label);
      if (!HHMM.test(s.from ?? "") || !HHMM.test(s.to ?? "") || s.from >= s.to) err(p, "from and to, HH:MM, from before to");
      if (!isNum(s.hours, 1, 12)) err(`${p}.hours`, "the hours the session is charged for, 1 to 12");
    }
  }
  if (list(err, "fees.items", f.items, 1, 10, "rates, each { label, price, per }")) {
    f.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
      if (!obj(err, `fees.items[${i}]`, x, ["label", "price", "per"])) return;
      text(err, `fees.items[${i}].label`, x.label);
      if (!isNum(x.price, 0.01, 5000)) err(`fees.items[${i}].price`, "pounds, everything compulsory included");
      if (!["hour", "session", "day", "week", "month"].includes(x.per)) err(`fees.items[${i}].per`, "hour, session, day, week or month");
    });
  }
  text(err, "fees.includes", f.includes);
  if (f.extras !== undefined && list(err, "fees.extras", f.extras, 0, 10, "optional extras")) {
    f.extras.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
      if (!obj(err, `fees.extras[${i}]`, x, ["label", "price", "per", "optional", "instead"])) return;
      text(err, `fees.extras[${i}].label`, x.label);
      if (!isNum(x.price, 0.01, 500)) err(`fees.extras[${i}].price`, "pounds");
      if (!["day", "session", "month", "one-off"].includes(x.per)) err(`fees.extras[${i}].per`, "day, session, month or one-off");
      // DfE guidance: charges alongside funded hours must be voluntary. A compulsory charge belongs in the rate instead.
      if (x.optional !== true) err(`fees.extras[${i}].optional`, "true: an extra must be optional; a compulsory charge belongs in the headline rate (CMA)");
      if (x.instead !== undefined) text(err, `fees.extras[${i}].instead`, x.instead);
    });
  }
  if (f.note !== undefined) text(err, "fees.note", f.note);
  if (f.checked !== undefined && !isYmd(f.checked)) err("fees.checked", "YYYY-MM-DD");
}

/** @param {any} v @param {Report} err */
function checkVisit(v, err) {
  if (!obj(err, "visit", v, ["times", "message", "minutes", "text"])) return;
  text(err, "visit.message", v.message);
  if (v.text !== undefined) text(err, "visit.text", v.text);
  if (v.minutes !== undefined && !isInt(v.minutes, 10, 180)) err("visit.minutes", "how long a visit takes, 10 to 180 minutes");
  if (list(err, "visit.times", v.times, 1, 14, "visit times, each { day, time, week?, note? }")) {
    v.times.forEach((/** @type {any} */ t, /** @type {number} */ i) => {
      const p = `visit.times[${i}]`;
      if (!obj(err, p, t, ["day", "time", "week", "note"])) return;
      if (!DAYS.includes(t.day)) err(`${p}.day`, `one of ${DAYS.join(", ")}`);
      if (!HHMM.test(t.time ?? "")) err(`${p}.time`, "24-hour time, HH:MM");
      if (t.week !== undefined && t.week !== "first") err(`${p}.week`, "\"first\" (only in the first week of the month), or leave it out");
      if (t.note !== undefined) text(err, `${p}.note`, t.note);
    });
  }
}

/** @param {any} d @param {Report} err @param {Exists} exists */
function checkDay(d, err, exists) {
  if (!obj(err, "day", d, ["closes", "moments", "note"])) return;
  if (!HHMM.test(d.closes ?? "")) err("day.closes", "closing time, HH:MM");
  if (d.note !== undefined) text(err, "day.note", d.note);
  if (!list(err, "day.moments", d.moments, 3, 12, "moments, each { time, title, text, photo }")) return;
  let last = "";
  d.moments.forEach((/** @type {any} */ m, /** @type {number} */ i) => {
    const p = `day.moments[${i}]`;
    if (!obj(err, p, m, ["time", "title", "text", "photo"])) return;
    if (!HHMM.test(m.time ?? "")) err(`${p}.time`, "HH:MM");
    else if (m.time <= last) err(`${p}.time`, "moments in time order");
    last = m.time ?? last;
    text(err, `${p}.title`, m.title);
    text(err, `${p}.text`, m.text);
    photo(err, `${p}.photo`, m.photo, exists);
  });
}

/** @param {any} m @param {Report} err */
function checkMenu(m, err) {
  if (!obj(err, "menu", m, ["days", "allergens", "note"])) return;
  text(err, "menu.allergens", m.allergens); // the nursery's own statement; nothing we write
  if (m.note !== undefined) text(err, "menu.note", m.note);
  if (!list(err, "menu.days", m.days, 1, 5, "days, each { day, breakfast?, lunch, tea? }")) return;
  m.days.forEach((/** @type {any} */ d, /** @type {number} */ i) => {
    const p = `menu.days[${i}]`;
    if (!obj(err, p, d, ["day", "breakfast", "lunch", "tea"])) return;
    if (!DAYS.slice(0, 5).includes(d.day)) err(`${p}.day`, "mon to fri");
    text(err, `${p}.lunch`, d.lunch);
    for (const k of ["breakfast", "tea"]) if (d[k] !== undefined) text(err, `${p}.${k}`, d[k]);
  });
}

/** The Ofsted report: the outcome in the report's own words, its date, and the report on Ofsted's site. @param {any} o @param {Report} err */
function checkOfsted(o, err) {
  if (!obj(err, "ofsted", o, ["outcome", "inspected", "reportUrl", "urn", "text", "policies"])) return;
  text(err, "ofsted.outcome", o.outcome);
  if (!isYmd(o.inspected)) err("ofsted.inspected", "the inspection date, YYYY-MM-DD");
  if (!/^https:\/\/reports\.ofsted\.gov\.uk\/[^\s]+$/.test(o.reportUrl ?? "")) err("ofsted.reportUrl", "the report's address on reports.ofsted.gov.uk");
  if (o.urn !== undefined && !/^[A-Z0-9]{6,10}$/.test(o.urn)) err("ofsted.urn", "the setting's URN or reference number, as on the report");
  if (o.text !== undefined) text(err, "ofsted.text", o.text);
  if (o.policies !== undefined && list(err, "ofsted.policies", o.policies, 1, 20, "policies, each { label, text }")) {
    o.policies.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
      if (!obj(err, `ofsted.policies[${i}]`, x, ["label", "text"])) return;
      text(err, `ofsted.policies[${i}].label`, x.label);
      text(err, `ofsted.policies[${i}].text`, x.text);
    });
  }
}

/** @param {any} t @param {Report} err */
function checkTerms(t, err) {
  if (!obj(err, "terms", t, ["items", "note"])) return;
  if (t.note !== undefined) text(err, "terms.note", t.note);
  if (!list(err, "terms.items", t.items, 1, 40, "dates, each { id, label, date, end?, kind }")) return;
  ids(err, "terms.items", t.items);
  t.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `terms.items[${i}]`;
    if (!obj(err, p, x, ["id", "label", "date", "end", "kind"])) return;
    text(err, `${p}.label`, x.label);
    if (!isYmd(x.date)) err(`${p}.date`, "YYYY-MM-DD");
    if (x.end !== undefined && (!isYmd(x.end) || x.end < x.date)) err(`${p}.end`, "YYYY-MM-DD, on or after the date");
    if (!["term", "closed", "open-day"].includes(x.kind)) err(`${p}.kind`, "term, closed or open-day");
  });
}

/** @param {any} s @param {Report} err */
function checkSettling(s, err) {
  if (!obj(err, "settling", s, ["steps", "text", "message"])) return;
  text(err, "settling.text", s.text);
  text(err, "settling.message", s.message);
  if (!list(err, "settling.steps", s.steps, 2, 12, "sessions, each { label, from, to, withParent?, note? }")) return;
  s.steps.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `settling.steps[${i}]`;
    if (!obj(err, p, x, ["label", "from", "to", "withParent", "note"])) return;
    text(err, `${p}.label`, x.label);
    if (!HHMM.test(x.from ?? "") || !HHMM.test(x.to ?? "") || x.from >= x.to) err(p, "from and to, HH:MM, from before to");
    if (x.withParent !== undefined && typeof x.withParent !== "boolean") err(`${p}.withParent`, "true or false");
    if (x.note !== undefined) text(err, `${p}.note`, x.note);
  });
}

/** @param {any} r @param {Set<string>} rooms @param {Report} err */
function checkReady(r, rooms, err) {
  if (!obj(err, "ready", r, ["pack", "questions"])) return;
  if (list(err, "ready.pack", r.pack, 1, 8, "lists, each { room, items }")) {
    r.pack.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
      if (!obj(err, `ready.pack[${i}]`, x, ["room", "items"])) return;
      if (x.room !== "all" && !rooms.has(x.room)) err(`ready.pack[${i}].room`, `"all" or one of the rooms: ${[...rooms].join(", ")}`);
      if (list(err, `ready.pack[${i}].items`, x.items, 1, 20, "things to bring")) x.items.forEach((/** @type {any} */ t, /** @type {number} */ j) => text(err, `ready.pack[${i}].items[${j}]`, t));
    });
  }
  if (list(err, "ready.questions", r.questions, 3, 20, "questions a parent can ask on a visit")) r.questions.forEach((/** @type {any} */ q, /** @type {number} */ i) => text(err, `ready.questions[${i}]`, q));
}
