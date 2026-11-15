// @ts-check
/**
 * Validation for the trainer kit (independent personal trainers and small private studios). Every price, place, hour
 * and qualification is the trainer's own; these checks keep the site honest:
 *  - qualifications only with the awarding body and year; a register link only to the trainer's own entry (https);
 *  - no weight-loss figures, dress sizes, guarantees or timed results anywhere in the trainer's copy;
 *  - live data from the trainer's sheet on client sites (simulated data is for demos only);
 *  - prices as whole pounds, the first month's pattern 1–3 sessions a week.
 */
import { isTime, toMinutes } from "../../core/lib/hours.js";
import { WEEKDAYS } from "./lib/trainer.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @typedef {((rel: string) => boolean)|undefined} Exists */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const ID = /^[a-z0-9-]{1,40}$/;
const POUNDS = (/** @type {any} */ v) => Number.isInteger(v) && v >= 0 && v <= 100000;

/** Words a trainer's site never uses: promised weight loss, sizes, guarantees, timed results. */
const PROMISES = [
  /\b(lose|drop|shed|burn off)\s+(up to\s+)?\d+(\.\d+)?\s*(kg|kilos?|kilograms?|lbs?|pounds|stone|st)\b/i,
  /\bdress sizes?\b/i,
  /\bguarantee[ds]?\b/i,
  /\bresults?\s+(in|within)\s+\d+\s+(days?|weeks?)\b/i,
  /\b(\d+|a|one|two|three|four)\s+(days?|weeks?)\s+to\s+(a\s+)?(new|better|slimmer|leaner)\b/i,
];

/** @param {any} v @param {string} path @param {Report} err */
function claims(v, path, err) {
  if (typeof v === "string") { if (PROMISES.some((re) => re.test(v))) err(path, "reads as a promise of results (weight, size, a guarantee or a timed result); say what the sessions are, not what they'll do"); return; }
  if (Array.isArray(v)) v.forEach((x, i) => claims(x, `${path}[${i}]`, err));
  else if (isObj(v)) for (const [k, x] of Object.entries(v)) if (!["src", "csvUrl", "registerUrl", "url"].includes(k)) claims(x, `${path}.${k}`, err);
}

/** @param {Report} err @param {string} path @param {any} v */
function text(err, path, v) { if (!isStr(v)) err(path, "required text is missing"); }

/** A misspelt setting is refused, not silently ignored. @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (isObj(o)) for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}

/** @param {Report} err @param {string} path @param {any} l @param {string} what @returns {l is any[]} */
function list(err, path, l, what) {
  if (Array.isArray(l) && l.length) return true;
  err(path, `at least one ${what}`);
  return false;
}

/** Unique ids. @param {Report} err @param {string} path @param {any[]} items */
function ids(err, path, items) {
  const seen = new Set();
  items.forEach((x, i) => {
    if (!ID.test(x?.id ?? "")) err(`${path}[${i}].id`, "lowercase letters, numbers and dashes");
    else if (seen.has(x.id)) err(`${path}[${i}].id`, `"${x.id}" is used twice`);
    seen.add(x?.id);
  });
}

/** @param {Report} err @param {string} path @param {any} p @param {Exists} exists @param {string[]} [extra] */
function photo(err, path, p, exists, extra = []) {
  if (!isObj(p)) { err(path, "a photo: { src, width, height, alt }"); return; }
  onlyKeys(p, ["src", "width", "height", "alt", "focus", ...extra], path, err);
  text(err, `${path}.alt`, p.alt);
  if (!Number.isInteger(p.width) || !Number.isInteger(p.height)) err(path, "width and height in pixels");
  if (!isStr(p.src)) err(`${path}.src`, "required");
  else if (exists && !exists(p.src)) err(`${path}.src`, `file not found: ${p.src}`);
}

/** @param {Report} err @param {string} path @param {any} days */
function weekdays(err, path, days) {
  if (!Array.isArray(days) || !days.length || days.some((d) => !WEEKDAYS.includes(d)) || new Set(days).size !== days.length) err(path, `working days, each once, from ${WEEKDAYS.join(", ")}`);
  else if (days.some((d, i) => i && WEEKDAYS.indexOf(d) < WEEKDAYS.indexOf(days[i - 1]))) err(path, "in week order, Monday first");
}

/** @param {Report} err @param {string} path @param {any} from @param {any} to */
function hourRange(err, path, from, to) {
  if (!isTime(from) || !isTime(to) || toMinutes(from) % 60 || toMinutes(to) % 60) err(path, 'from and to on the hour, "HH:00"');
  else if (toMinutes(to) <= toMinutes(from)) err(path, "to must come after from");
}

/** Where the open hours come from: the trainer's sheet (or simulated, demos only). @param {any} d @param {string} mode @param {Report} err */
function checkDiarySource(d, mode, err) {
  if (!["simulated", "sheet"].includes(d.source)) err("diary.source", 'must be "sheet" (or "simulated" on demo sites)');
  if (d.source === "simulated" && mode !== "demo") err("diary.source", 'simulated data is only allowed on demo sites; use "sheet"');
  if (d.source === "sheet" && !(isStr(d.csvUrl) && /^https:\/\/docs\.google\.com\/spreadsheets\/.+output=csv/.test(d.csvUrl))) err("diary.csvUrl", "the sheet's published CSV link (File → Share → Publish to web → CSV)");
  if (d.source !== "sheet" && d.csvUrl !== undefined) err("diary.csvUrl", 'only with source "sheet"');
}

/** The photograph over a block of spoken-for hours. @param {any} d @param {Report} err @param {Exists} exists */
function checkDiaryPhoto(d, err, exists) {
    photo(err, "diary.photo", d.photo, exists, ["caption", "block"]);
    const b = d.photo?.block;
    if (!isObj(b)) err("diary.photo.block", "{ days, from, to }: the spoken-for hours the photograph covers");
    else {
      onlyKeys(b, ["days", "from", "to"], "diary.photo.block", err);
      weekdays(err, "diary.photo.block.days", b.days);
      hourRange(err, "diary.photo.block", b.from, b.to);
      if (Array.isArray(b.days) && Array.isArray(d.days)) {
        const idx = b.days.map((x) => d.days.indexOf(x));
        if (idx.some((i) => i < 0) || idx.some((i, k) => k && i !== idx[k - 1] + 1)) err("diary.photo.block.days", "working days next to each other");
      }
      if (isTime(b.from) && isTime(b.to) && isTime(d.from) && isTime(d.to) && (toMinutes(b.from) < toMinutes(d.from) || toMinutes(b.to) > toMinutes(d.to))) err("diary.photo.block", "inside the diary's hours");
    }
}

/** @param {any} d @param {string} mode @param {Report} err @param {Exists} exists */
function checkDiary(d, mode, err, exists) {
  if (!isObj(d)) { err("diary", "{ source, days, from, to, priceFrom, photo }"); return; }
  onlyKeys(d, ["source", "csvUrl", "staleAfterHours", "days", "from", "to", "minutes", "priceFrom", "photo"], "diary", err);
  checkDiarySource(d, mode, err);
  if (d.staleAfterHours !== undefined && !(Number.isInteger(d.staleAfterHours) && d.staleAfterHours >= 1 && d.staleAfterHours <= 72)) err("diary.staleAfterHours", "1 to 72 hours");
  weekdays(err, "diary.days", d.days);
  hourRange(err, "diary", d.from, d.to);
  if (d.minutes !== undefined && !(Number.isInteger(d.minutes) && d.minutes >= 30 && d.minutes <= 60)) err("diary.minutes", "a session's length, 30 to 60 minutes");
  if (!POUNDS(d.priceFrom) || d.priceFrom === 0) err("diary.priceFrom", "the lowest price of an hour, whole pounds");
  if (d.photo !== undefined) checkDiaryPhoto(d, err, exists);
}

/** @param {any} m @param {Report} err @param {Exists} exists */
function checkMonth(m, err, exists) {
  if (!isObj(m)) { err("firstMonth", "{ places, often, steps, prices, message }"); return; }
  onlyKeys(m, ["photo", "caption", "places", "often", "steps", "prices", "policy", "message"], "firstMonth", err);
  text(err, "firstMonth.message", m.message);
  if (m.photo !== undefined) photo(err, "firstMonth.photo", m.photo, exists);
  if (list(err, "firstMonth.places", m.places, "place: { id, label, note, text }")) {
    ids(err, "firstMonth.places", m.places);
    m.places.forEach((/** @type {any} */ p, /** @type {number} */ i) => {
      onlyKeys(p, ["id", "label", "note", "text", "away"], `firstMonth.places[${i}]`, err);
      text(err, `firstMonth.places[${i}].label`, p?.label);
      text(err, `firstMonth.places[${i}].text`, p?.text);
      if (p?.away !== undefined && typeof p.away !== "boolean") err(`firstMonth.places[${i}].away`, "true when the trainer comes to the client");
    });
  }
  if (list(err, "firstMonth.often", m.often, "choice: { perWeek, label, note }")) {
    m.often.forEach((/** @type {any} */ o, /** @type {number} */ i) => {
      onlyKeys(o, ["perWeek", "label", "note", "default"], `firstMonth.often[${i}]`, err);
      if (![1, 2, 3].includes(o?.perWeek)) err(`firstMonth.often[${i}].perWeek`, "1, 2 or 3 sessions a week");
      text(err, `firstMonth.often[${i}].label`, o?.label);
    });
    if (m.often.filter((/** @type {any} */ o) => o?.default).length > 1) err("firstMonth.often", "one default at most");
  }
  if (list(err, "firstMonth.steps", m.steps, "step of the first session: { minute, text }")) {
    m.steps.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
      onlyKeys(s, ["minute", "text"], `firstMonth.steps[${i}]`, err);
      if (!(Number.isInteger(s?.minute) && s.minute >= 0 && s.minute <= 90)) err(`firstMonth.steps[${i}].minute`, "minutes into the session, 0 to 90");
      else if (i && s.minute <= m.steps[i - 1]?.minute) err(`firstMonth.steps[${i}].minute`, "in order");
      text(err, `firstMonth.steps[${i}].text`, s?.text);
    });
  }
  const p = m.prices;
  if (!isObj(p)) err("firstMonth.prices", "{ first, session: { \"1\": …, \"2\": …, \"3\": … }, travel }");
  else {
    onlyKeys(p, ["first", "session", "travel"], "firstMonth.prices", err);
    if (!POUNDS(p.first)) err("firstMonth.prices.first", "whole pounds");
    if (!isObj(p.session)) err("firstMonth.prices.session", "the price of a session by sessions a week");
    else for (const o of m.often ?? []) if (!POUNDS(p.session[String(o?.perWeek)])) err(`firstMonth.prices.session.${o?.perWeek}`, "whole pounds");
    if (p.travel !== undefined && !POUNDS(p.travel)) err("firstMonth.prices.travel", "whole pounds, added when the trainer comes to the client");
  }
  if (m.policy !== undefined) {
    if (!list(err, "firstMonth.policy", m.policy, "line: { label, value }")) return;
    m.policy.forEach((/** @type {any} */ l, /** @type {number} */ i) => { onlyKeys(l, ["label", "value"], `firstMonth.policy[${i}]`, err); text(err, `firstMonth.policy[${i}].label`, l?.label); text(err, `firstMonth.policy[${i}].value`, l?.value); });
  }
}

/** @param {any} q @param {Report} err */
function checkQualifications(q, err) {
  if (!isObj(q)) { err("qualifications", "{ title, items, registerUrl }"); return; }
  onlyKeys(q, ["title", "intro", "items", "registerUrl", "registerName", "insured", "firstAid"], "qualifications", err);
  if (list(err, "qualifications.items", q.items, "qualification the trainer holds: { name, awardingBody, year }")) {
    q.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
      onlyKeys(x, ["name", "awardingBody", "year"], `qualifications.items[${i}]`, err);
      text(err, `qualifications.items[${i}].name`, x?.name);
      text(err, `qualifications.items[${i}].awardingBody`, x?.awardingBody);
      if (!(Number.isInteger(x?.year) && x.year >= 1980 && x.year <= 2100)) err(`qualifications.items[${i}].year`, "the year it was awarded");
    });
  }
  if (q.registerUrl !== undefined && !(isStr(q.registerUrl) && q.registerUrl.startsWith("https://"))) err("qualifications.registerUrl", "the trainer's own public register entry, an https link");
  if (q.registerUrl !== undefined) text(err, "qualifications.registerName", q.registerName);
  for (const k of ["insured", "firstAid"]) if (q[k] !== undefined && !isStr(q[k])) err(`qualifications.${k}`, "a line in the trainer's words, only if true");
}

/** @param {any} s @param {Report} err */
function checkSessions(s, err) {
  if (!isObj(s)) { err("sessions", "{ items }"); return; }
  onlyKeys(s, ["title", "intro", "items"], "sessions", err);
  if (!list(err, "sessions.items", s.items, "session: { id, name, text, minutes }")) return;
  ids(err, "sessions.items", s.items);
  s.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    onlyKeys(x, ["id", "name", "text", "minutes", "price"], `sessions.items[${i}]`, err);
    text(err, `sessions.items[${i}].name`, x?.name);
    text(err, `sessions.items[${i}].text`, x?.text);
    if (!(Number.isInteger(x?.minutes) && x.minutes >= 15 && x.minutes <= 180)) err(`sessions.items[${i}].minutes`, "15 to 180");
    if (x?.price !== undefined && !(POUNDS(x.price) && x.price > 0)) err(`sessions.items[${i}].price`, "whole pounds");
  });
}

/** @param {any} site @param {Report} err @param {Exists} [exists] */
export function checkTrainer(site, err, exists) {
  if (site.kit !== "trainer") return;
  if (site.diary !== undefined) checkDiary(site.diary, site.mode, err, exists);
  if (site.firstMonth !== undefined) checkMonth(site.firstMonth, err, exists);
  if (site.qualifications !== undefined) checkQualifications(site.qualifications, err);
  if (site.sessions !== undefined) checkSessions(site.sessions, err);
  for (const k of ["hero", "firstMonth", "sessions", "qualifications", "questions", "business"]) if (site[k] !== undefined) claims(site[k], k, err);
}
