// @ts-check
/**
 * Validation for the driving kit (driving instructors and small driving schools). Every price, area, centre and
 * instructor detail is the client's own; these checks keep the site honest:
 *  - no pass-rate claims, guarantees or "pass first time" promises in the instructor's copy; a pass rate only in its
 *    own field, as the client gives it, with the dates it covers;
 *  - a DVSA badge number only as the client supplies it, only for an approved instructor (ADI), never invented;
 *  - test fees only as checked on gov.uk/driving-test-cost, with the date;
 *  - live data from the instructor's own sheets on client sites (simulated data is for demos only);
 *  - prices as whole pounds; a block and an intensive course never dearer than the same hours singly.
 */
import { isYmd } from "../../core/lib/diary.js";
import { FEES_SOURCE } from "./lib/govuk.js";
import { CODE } from "./lib/driving.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @typedef {((rel: string) => boolean)|undefined} Exists */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const POUNDS = (/** @type {any} */ v) => Number.isInteger(v) && v > 0 && v <= 20000;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DISTRICT = /^[A-Z]{1,2}\d[A-Z\d]?$/;
const SHEET = /^https:\/\/docs\.google\.com\/spreadsheets\/.+output=csv/;

/**
 * Words an instructor's own copy never uses: pass rates and success rates, "pass first time" and "first-time pass" in any
 * form, guarantees, "100%" or a percentage of pupils or passes, a pass by a deadline ("pass in 2 weeks"), and speed
 * claims ("fastest", "quickest", "pass faster"). A pass rate goes only in instructors.passRate, as the client gives it,
 * with its dates.
 */
const CLAIMS = [
  /\b(?:pass|success)[- ]?rates?\b/i,
  /\b100\s*(?:%|per\s*cent)/i,
  /\d\s*(?:%|per\s*cent)[^.!?]{0,30}\b(?:pass|pupils|learners|students|success)/i,
  /\b(?:pass|success)[^.!?]{0,20}\d\s*(?:%|per\s*cent)/i,
  /\bpass(?:es|ed|ing)?\b[^.!?]{0,30}?\b(?:first|1st)[- ]?time\b/i,
  /\b(?:first|1st)[- ]?time\s+pass(?:es|ed)?\b/i,
  /\bguarantee[ds]?\b/i,
  /\bnever\s+fail/i,
  /\bpass(?:es|ed|ing)?\b[^.!?]{0,20}?\b(?:in|within)\s+(?:just\s+|only\s+)?(?:\d+|one|two|three|four|five|six|a)\s+(?:days?|weeks?|months?)\b/i,
  /\b(?:fastest|quickest|speediest)\b/i,
  /\bpass(?:es|ing)?\s+(?:faster|quicker|sooner)\b/i,
];

/** Setting names that hold addresses, links, ids or the client's own dated figures, never copy. */
const NOT_COPY = ["src", "csvUrl", "url", "href", "image", "id", "page", "feature", "source", "photo", "district", "badge", "passRate", "example", "skills", "date", "checked", "slug"];
/** Settings that aren't the instructor's copy (reviews are the reviewer's words, copied as written). */
const NOT_INSTRUCTOR_COPY = ["reviews", "schemaVersion", "id", "mode", "plan", "kit", "look", "url", "indexable", "lang", "features", "addons", "contact", "booking", "brand", "fees"];

/** @param {any} v @param {string} path @param {(s: string, path: string) => void} fn */
function eachCopy(v, path, fn) {
  if (typeof v === "string") fn(v, path);
  else if (Array.isArray(v)) v.forEach((x, i) => eachCopy(x, `${path}[${i}]`, fn));
  else if (isObj(v)) for (const [k, x] of Object.entries(v)) if (!NOT_COPY.includes(k)) eachCopy(x, `${path}.${k}`, fn);
}

/** @param {Report} err @param {string} path @param {any} v */
function text(err, path, v) { if (!isStr(v)) err(path, "required text is missing"); }

/** @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (isObj(o)) for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}

/** @param {Report} err @param {string} path @param {any} l @param {string} what @returns {l is any[]} */
function list(err, path, l, what) {
  if (Array.isArray(l) && l.length) return true;
  err(path, `at least one ${what}`);
  return false;
}

/** A page's opening: { title, intro }. @param {any} o @param {string} at @param {Report} err */
function head(o, at, err) {
  if (!isObj(o)) { err(at, "{ title, intro, … }"); return false; }
  text(err, `${at}.title`, o.title);
  if (o.intro !== undefined) text(err, `${at}.intro`, o.intro);
  return true;
}

/** @param {Report} err @param {string} path @param {any} p @param {Exists} exists */
function photo(err, path, p, exists) {
  if (!isObj(p)) { err(path, "a photo: { src, width, height, alt }"); return; }
  onlyKeys(p, ["src", "width", "height", "alt", "focus", "credit"], path, err);
  text(err, `${path}.alt`, p.alt);
  if (!Number.isInteger(p.width) || !Number.isInteger(p.height)) err(path, "width and height in pixels");
  if (!isStr(p.src)) err(`${path}.src`, "required");
  else if (exists && !exists(p.src)) err(`${path}.src`, `file not found: ${p.src}`);
}

/** gov.uk links only: the site never points a rule anywhere else. @param {Report} err @param {string} path @param {any} links */
function govLinks(err, path, links) {
  if (links === undefined) return;
  if (!Array.isArray(links)) { err(path, "a list of { label, url } gov.uk links"); return; }
  links.forEach((l, i) => {
    onlyKeys(l, ["label", "url"], `${path}[${i}]`, err);
    text(err, `${path}[${i}].label`, l?.label);
    if (!(isStr(l?.url) && /^https:\/\/www\.gov\.uk\//.test(l.url))) err(`${path}[${i}].url`, "a gov.uk link (https://www.gov.uk/…)");
  });
}

/** Text blocks on a guide page: { title, text } or { title, items }. @param {Report} err @param {string} path @param {any} blocks */
function blocks(err, path, blocks) {
  if (!list(err, path, blocks, "block: { title, text } or { title, items }")) return;
  blocks.forEach((b, i) => {
    onlyKeys(b, ["title", "text", "items"], `${path}[${i}]`, err);
    text(err, `${path}[${i}].title`, b?.title);
    if (b?.text === undefined && b?.items === undefined) err(`${path}[${i}]`, "text or items");
    if (b?.text !== undefined) text(err, `${path}[${i}].text`, b.text);
    if (b?.items !== undefined && !(Array.isArray(b.items) && b.items.length && b.items.every(isStr))) err(`${path}[${i}].items`, "a list of lines");
  });
}

/** A guide page: { title, intro, photo?, blocks, links?, price? }. @param {any} g @param {string} at @param {Report} err @param {Exists} exists */
function guide(g, at, err, exists) {
  if (!head(g, at, err)) return;
  onlyKeys(g, ["title", "intro", "photo", "blocks", "links", "price"], at, err);
  if (g.photo !== undefined) photo(err, `${at}.photo`, g.photo, exists);
  blocks(err, `${at}.blocks`, g.blocks);
  govLinks(err, `${at}.links`, g.links);
  if (g.price !== undefined) {
    if (!isObj(g.price)) err(`${at}.price`, "{ label, amount }");
    else { onlyKeys(g.price, ["label", "amount"], `${at}.price`, err); text(err, `${at}.price.label`, g.price.label); if (!POUNDS(g.price.amount)) err(`${at}.price.amount`, "whole pounds"); }
  }
}

/** One gearbox's prices. @param {any} p @param {string} at @param {Report} err */
function gearboxPrices(p, at, err) {
  if (!isObj(p)) { err(at, "{ hour, two, block: { hours, price }, intensive: { hours, price, over } }"); return; }
  onlyKeys(p, ["hour", "two", "block", "intensive"], at, err);
  if (!POUNDS(p.hour)) err(`${at}.hour`, "an hour's lesson, whole pounds");
  if (!POUNDS(p.two)) err(`${at}.two`, "a two-hour lesson, whole pounds");
  for (const k of ["block", "intensive"]) {
    const b = p[k];
    if (!isObj(b)) { err(`${at}.${k}`, "{ hours, price }"); continue; }
    onlyKeys(b, k === "intensive" ? ["hours", "price", "over"] : ["hours", "price"], `${at}.${k}`, err);
    if (!(Number.isInteger(b.hours) && b.hours >= 2 && b.hours <= 60)) err(`${at}.${k}.hours`, "2 to 60 hours");
    if (!POUNDS(b.price)) err(`${at}.${k}.price`, "whole pounds");
    else if (POUNDS(p.hour) && b.price > p.hour * b.hours) err(`${at}.${k}.price`, "dearer than the same hours singly; a block or course never costs more");
    if (k === "intensive") text(err, `${at}.intensive.over`, b.over);
  }
}

/** @param {any} l @param {Report} err */
function checkLessons(l, err) {
  if (!head(l, "lessons", err)) return;
  onlyKeys(l, ["title", "intro", "manual", "automatic", "note"], "lessons", err);
  if (l.manual === undefined && l.automatic === undefined) err("lessons", "manual, automatic or both");
  if (l.manual !== undefined) gearboxPrices(l.manual, "lessons.manual", err);
  if (l.automatic !== undefined) gearboxPrices(l.automatic, "lessons.automatic", err);
}

/** @param {any} a @param {Report} err */
function checkAreas(a, err) {
  if (!head(a, "areas", err)) return;
  onlyKeys(a, ["title", "intro", "districts", "pickup", "notCovered"], "areas", err);
  text(err, "areas.notCovered", a.notCovered);
  if (a.pickup !== undefined) text(err, "areas.pickup", a.pickup);
  if (!list(err, "areas.districts", a.districts, "district: { district, name }")) return;
  const seen = new Set();
  a.districts.forEach((/** @type {any} */ d, /** @type {number} */ i) => {
    onlyKeys(d, ["district", "name"], `areas.districts[${i}]`, err);
    if (!DISTRICT.test(d?.district ?? "")) err(`areas.districts[${i}].district`, 'a postcode district in capitals, like "E14"');
    else if (seen.has(d.district)) err(`areas.districts[${i}].district`, `"${d.district}" is listed twice`);
    seen.add(d?.district);
    text(err, `areas.districts[${i}].name`, d?.name);
  });
}

/** Where live data comes from. @param {any} o @param {string} at @param {string} mode @param {Report} err */
function source(o, at, mode, err) {
  if (!["simulated", "sheet"].includes(o.source)) err(`${at}.source`, 'must be "sheet" (or "simulated" on demo sites)');
  if (o.source === "simulated" && mode !== "demo") err(`${at}.source`, 'simulated data is only allowed on demo sites; use "sheet"');
  if (o.source === "sheet" && !(isStr(o.csvUrl) && SHEET.test(o.csvUrl))) err(`${at}.csvUrl`, "the sheet's published CSV link (File → Share → Publish to web → CSV)");
  if (o.source !== "sheet" && o.csvUrl !== undefined) err(`${at}.csvUrl`, 'only with source "sheet"');
}

/** @param {any} s @param {string} mode @param {Report} err */
function checkSlots(s, mode, err) {
  if (!head(s, "slots", err)) return;
  onlyKeys(s, ["title", "intro", "source", "csvUrl", "staleAfterHours", "message"], "slots", err);
  source(s, "slots", mode, err);
  text(err, "slots.message", s.message);
  if (s.staleAfterHours !== undefined && !(Number.isInteger(s.staleAfterHours) && s.staleAfterHours >= 1 && s.staleAfterHours <= 168)) err("slots.staleAfterHours", "1 to 168 hours");
}

/** @param {any} f @param {Report} err */
function checkFees(f, err) {
  if (!isObj(f)) { err("fees", "{ practical, practicalOutOfHours, theory, checked, source }"); return; }
  onlyKeys(f, ["practical", "practicalOutOfHours", "theory", "checked", "source"], "fees", err);
  for (const k of ["practical", "practicalOutOfHours", "theory"]) if (!POUNDS(f[k])) err(`fees.${k}`, "whole pounds, as gov.uk shows it");
  if (!isYmd(f.checked)) err("fees.checked", 'the date you checked gov.uk, "YYYY-MM-DD"');
  if (f.source !== FEES_SOURCE) err("fees.source", `${FEES_SOURCE}, where the fees were checked`);
}

/** @param {any} p @param {Report} err */
function checkPlanner(p, err) {
  if (!head(p, "planner", err)) return;
  onlyKeys(p, ["title", "intro", "perWeek", "intensive"], "planner", err);
  if (list(err, "planner.perWeek", p.perWeek, "choice: { hours, label }")) {
    p.perWeek.forEach((/** @type {any} */ c, /** @type {number} */ i) => {
      onlyKeys(c, ["hours", "label", "default"], `planner.perWeek[${i}]`, err);
      if (!(Number.isInteger(c?.hours) && c.hours >= 1 && c.hours <= 12)) err(`planner.perWeek[${i}].hours`, "hours a week, 1 to 12");
      text(err, `planner.perWeek[${i}].label`, c?.label);
    });
    if (p.perWeek.filter((/** @type {any} */ c) => c?.default).length !== 1) err("planner.perWeek", "exactly one default");
  }
  if (p.intensive !== undefined && p.intensive !== true) err("planner.intensive", "true to offer the intensive course as a choice (its hours and price come from lessons)");
}

/** @param {any} p @param {string} mode @param {Report} err */
function checkProgress(p, mode, err) {
  if (!head(p, "progress", err)) return;
  onlyKeys(p, ["title", "intro", "source", "csvUrl", "staleAfterHours", "skills", "example"], "progress", err);
  source(p, "progress", mode, err);
  if (p.staleAfterHours !== undefined && !(Number.isInteger(p.staleAfterHours) && p.staleAfterHours >= 24 && p.staleAfterHours <= 1440)) err("progress.staleAfterHours", "24 to 1440 hours");
  if (list(err, "progress.skills", p.skills, "skill, as a column of the sheet")) {
    if (p.skills.some((/** @type {any} */ s) => !isStr(s)) || new Set(p.skills).size !== p.skills.length) err("progress.skills", "each skill once, as text");
  }
  if (mode === "demo") { if (!CODE.test(p.example ?? "")) err("progress.example", "the demo's sample code, 6 to 12 capitals and digits"); }
  else if (p.example !== undefined) err("progress.example", "demo sites only");
}

/** @param {any} c @param {Report} err */
function checkCentres(c, err) {
  if (!head(c, "centres", err)) return;
  onlyKeys(c, ["title", "intro", "items", "sample"], "centres", err);
  if (list(err, "centres.items", c.items, "centre: { name, note }")) c.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    onlyKeys(x, ["name", "note"], `centres.items[${i}]`, err);
    text(err, `centres.items[${i}].name`, x?.name);
    if (x?.note !== undefined) text(err, `centres.items[${i}].note`, x.note);
  });
  if (c.sample !== undefined && typeof c.sample !== "boolean") err("centres.sample", "true on a demo's sample list");
}

/** @param {any} t @param {string} mode @param {Report} err @param {Exists} exists */
function checkInstructors(t, mode, err, exists) {
  if (!head(t, "instructors", err)) return;
  onlyKeys(t, ["title", "intro", "items", "passRate"], "instructors", err);
  if (list(err, "instructors.items", t.items, "instructor: { name, status, gearboxes, text }")) {
    t.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
      const at = `instructors.items[${i}]`;
      onlyKeys(x, ["name", "status", "badge", "gearboxes", "text", "photo"], at, err);
      text(err, `${at}.name`, x?.name);
      text(err, `${at}.text`, x?.text);
      if (!["ADI", "PDI"].includes(x?.status)) err(`${at}.status`, '"ADI" (approved driving instructor) or "PDI" (trainee, on a trainee licence)');
      if (x?.badge !== undefined) {
        if (!/^\d{4,7}$/.test(String(x.badge))) err(`${at}.badge`, "the badge number as the client gives it, digits only");
        if (x.status !== "ADI") err(`${at}.badge`, "only for an approved driving instructor (ADI)");
        if (mode === "demo") err(`${at}.badge`, "never on a demo: a badge number is real and only the client supplies it");
      }
      if (!(Array.isArray(x?.gearboxes) && x.gearboxes.length && x.gearboxes.every((/** @type {any} */ g) => ["manual", "automatic"].includes(g)))) err(`${at}.gearboxes`, '"manual", "automatic" or both');
      if (x?.photo !== undefined) photo(err, `${at}.photo`, x.photo, exists);
    });
  }
  const r = t.passRate;
  if (r !== undefined) {
    if (mode === "demo") { err("instructors.passRate", "never on a demo: a pass rate is the client's own figure"); return; }
    if (!isObj(r)) { err("instructors.passRate", "{ text, from, to }"); return; }
    onlyKeys(r, ["text", "from", "to"], "instructors.passRate", err);
    text(err, "instructors.passRate.text", r.text);
    if (!isYmd(r.from) || !isYmd(r.to) || r.from >= r.to) err("instructors.passRate", "the dates it covers, from and to, \"YYYY-MM-DD\"");
  }
}

/** @param {any} j @param {Report} err @param {Exists} exists */
function checkJournal(j, err, exists) {
  if (!head(j, "journal", err)) return;
  onlyKeys(j, ["title", "intro", "articles"], "journal", err);
  if (!list(err, "journal.articles", j.articles, "article: { slug, title, intro, date, body }")) return;
  const seen = new Set();
  j.articles.forEach((/** @type {any} */ a, /** @type {number} */ i) => {
    const at = `journal.articles[${i}]`;
    onlyKeys(a, ["slug", "title", "intro", "date", "body", "photo", "links"], at, err);
    if (!SLUG.test(a?.slug ?? "")) err(`${at}.slug`, "lowercase words joined by dashes");
    else if (seen.has(a.slug)) err(`${at}.slug`, `"${a.slug}" is used twice`);
    seen.add(a?.slug);
    text(err, `${at}.title`, a?.title);
    text(err, `${at}.intro`, a?.intro);
    if (!isYmd(a?.date)) err(`${at}.date`, 'the date it was written, "YYYY-MM-DD"');
    if (!(Array.isArray(a?.body) && a.body.length && a.body.every(isStr))) err(`${at}.body`, "paragraphs, as a list");
    if (a?.photo !== undefined) photo(err, `${at}.photo`, a.photo, exists);
    govLinks(err, `${at}.links`, a?.links);
  });
}

/** No pass-rate claims, guarantees or promises anywhere in the instructor's copy. @param {any} site @param {Report} err */
function checkClaims(site, err) {
  for (const [k, v] of Object.entries(site)) if (!NOT_INSTRUCTOR_COPY.includes(k)) eachCopy(v, k, (str, path) => {
    if (CLAIMS.some((re) => re.test(str))) err(path, "reads as a pass-rate claim, a guarantee or a promise; a pass rate goes only in instructors.passRate, with its dates");
  });
}

/** The guide pages, the Passed page and the centres' sample flag. @param {any} site @param {(id: string) => boolean} on @param {Report} err @param {Exists} exists */
function checkPages(site, on, err, exists) {
  for (const [id, key] of [["driving-lessons", "lessonsPage"], ["driving-area-page", "areaPage"], ["driving-book", "bookPage"], ["driving-parents", "parents"], ["driving-gearbox", "gearbox"], ["driving-intensive", "intensive"], ["driving-theory", "theory"], ["driving-passplus", "passPlus"], ["driving-refresher", "refresher"]]) {
    if (on(id)) guide(site[key], key, err, exists);
  }
  if (on("driving-passed")) {
    const p = site.passed;
    if (head(p, "passed", err)) { onlyKeys(p, ["title", "intro", "consent"], "passed", err); text(err, "passed.consent", p.consent); }
    if (site.mode === "demo") err("features", "driving-passed is for client sites: pass photos are real pupils, shown with their agreement");
  }
  if (site.centres?.sample && site.mode !== "demo") err("centres.sample", "demo sites only");
}

/**
 * The driving kit's site.json checks.
 * @param {any} site @param {Report} err @param {Exists} [exists]
 */
export function checkDriving(site, err, exists) {
  if (site.kit !== "driving") return;
  const on = (/** @type {string} */ id) => (site.features ?? []).includes(id);
  const mode = site.mode;
  checkClaims(site, err);
  if (on("driving-prices")) checkLessons(site.lessons, err);
  if (on("driving-areas")) checkAreas(site.areas, err);
  if (on("driving-testday")) { if (head(site.testDay, "testDay", err)) onlyKeys(site.testDay, ["title", "intro"], "testDay", err); }
  if (on("driving-slots")) checkSlots(site.slots, mode, err);
  if (on("driving-ready")) {
    const r = site.ready;
    if (head(r, "ready", err)) { onlyKeys(r, ["title", "intro", "yes", "notYet"], "ready", err); text(err, "ready.yes", r.yes); text(err, "ready.notYet", r.notYet); }
  }
  if (on("driving-pass")) { checkPlanner(site.planner, err); checkFees(site.fees, err); }
  else if (site.fees !== undefined) checkFees(site.fees, err);
  if (on("driving-progress")) checkProgress(site.progress, mode, err);
  if (on("driving-centres")) checkCentres(site.centres, err);
  if (on("driving-instructors")) checkInstructors(site.instructors, mode, err, exists);
  if (on("driving-journal")) checkJournal(site.journal, err, exists);
  checkPages(site, on, err, exists);
}
