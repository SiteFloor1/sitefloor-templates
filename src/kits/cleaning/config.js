// @ts-check
/**
 * Validation for the cleaning kit. Every minute, rate, task and promise is the company's own; these checks keep the
 * figures able to add up (whole minutes, positive rates) and keep the honesty rules: a deposit is never promised (only
 * the company's own re-clean terms, quoted in `tenancy.terms`), deposit rules link to gov.uk with the month checked,
 * the simulated free days never reach a client site, and every misspelt setting is refused rather than ignored.
 */
import { FREQS, MAX_BEDS, MAX_BATHS, validChoice } from "./lib/visit.js";
import { isDistrict } from "./lib/areas.js";
import { isYmd } from "../../core/lib/diary.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @typedef {((rel: string) => boolean)|undefined} Exists */
/** @param {any} v */ const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */ const isStr = (v) => typeof v === "string" && v.trim().length > 0;
/** @param {any} v */ const isMin = (v) => Number.isInteger(v) && v > 0 && v <= 600;
const ID = /^[a-z0-9-]{1,40}$/;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** @param {Report} err @param {string} path @param {any} v */
function text(err, path, v) { if (!isStr(v)) err(path, "required text is missing"); }
/** @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) { if (isObj(o)) for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`); }
/** @param {Report} err @param {string} path @param {any} v @param {string} what @returns {v is any[]} */
function list(err, path, v, what) { if (Array.isArray(v) && v.length) return true; err(path, `at least one ${what}`); return false; }
/** @param {Report} err @param {string} path @param {any} v */
function texts(err, path, v) { if (list(err, path, v, "line of text")) v.forEach((t, i) => text(err, `${path}[${i}]`, t)); }
/** @param {Report} err @param {string} path @param {any[]} items @param {string} [key] */
function ids(err, path, items, key = "id") {
  const seen = new Set();
  items.forEach((x, i) => {
    if (!ID.test(x?.[key] ?? "")) err(`${path}[${i}].${key}`, "lowercase letters, numbers and dashes");
    else if (seen.has(x[key])) err(`${path}[${i}].${key}`, `"${x[key]}" is used twice`);
    seen.add(x?.[key]);
  });
}
/** Headed paragraphs in the company's words. @param {Report} err @param {string} path @param {any} s */
function sections(err, path, s) {
  if (!list(err, path, s, "{ heading, text }")) return;
  s.forEach((x, i) => { onlyKeys(x, ["heading", "text"], `${path}[${i}]`, err); text(err, `${path}[${i}].heading`, x?.heading); text(err, `${path}[${i}].text`, x?.text); });
}
/** @param {Report} err @param {string} path @param {any} p @param {Exists} exists */
function photo(err, path, p, exists) {
  if (!isObj(p)) { err(path, "a photo: { src, width, height, alt }"); return; }
  onlyKeys(p, ["src", "width", "height", "alt", "credit", "focus"], path, err);
  text(err, `${path}.alt`, p.alt);
  if (!Number.isInteger(p.width) || !Number.isInteger(p.height)) err(path, "width and height in pixels");
  if (!isStr(p.src)) err(`${path}.src`, "required");
  else if (exists && !exists(p.src)) err(`${path}.src`, `file not found: ${p.src}`);
}
/** @param {Report} err @param {string} path @param {any} o @param {string[]} extra */
function page(err, path, o, extra) {
  if (!isObj(o)) { err(path, "{ title, intro, … }"); return false; }
  onlyKeys(o, ["title", "intro", ...extra], path, err);
  text(err, `${path}.title`, o.title);
  return true;
}

/** A deposit is never promised; only the company's own re-clean terms, quoted. @param {string} s @returns {string|null} */
export function claimProblem(s) {
  if (/deposit[- ]back guarantee|guarantee[ds]? (?:your |the |a |a full )?(?:full )?deposit|100% deposit|deposit,? guaranteed/i.test(s)) return "never promise a deposit back; quote the company's own re-clean terms in tenancy.terms";
  return null;
}

/** Every string under a value, with its path. @param {any} v @param {string} at @returns {[string, string][]} */
function strings(v, at) {
  if (typeof v === "string") return [[at, v]];
  if (Array.isArray(v)) return v.flatMap((x, i) => strings(x, `${at}[${i}]`));
  if (isObj(v)) return Object.entries(v).flatMap(([k, x]) => strings(x, `${at}.${k}`));
  return [];
}

/** @param {any} site @param {Report} err @param {Exists} [exists] */
export function checkCleaning(site, err, exists) {
  if (site.kit !== "cleaning") return;
  const demo = site.mode === "demo";
  checkHero(site.hero, err, exists);
  if (site.visit !== undefined) checkVisit(site.visit, err);
  if (site.cleans !== undefined) checkServices(site.cleans, err, exists);
  if (site.features?.includes("cleaning-service-pages")) (site.cleans?.items ?? []).forEach((/** @type {any} */ x, /** @type {number} */ i) => { if (!x?.page) err(`cleans.items[${i}].page`, "every service needs its page ({ intro, sections }) when cleaning-service-pages is on"); });
  if (site.areas !== undefined) checkAreas(site.areas, demo, err);
  if (site.keys !== undefined) checkKeys(site.keys, err);
  if (site.tenancy !== undefined) checkTenancy(site.tenancy, err);
  if (site.policies !== undefined && page(err, "policies", site.policies, ["sections"])) sections(err, "policies.sections", site.policies.sections);
  if (site.cleaners !== undefined && page(err, "cleaners", site.cleaners, ["sections", "photo"])) {
    sections(err, "cleaners.sections", site.cleaners.sections);
    if (site.cleaners.photo !== undefined) photo(err, "cleaners.photo", site.cleaners.photo, exists);
  }
  if (site.offices !== undefined) checkOffices(site.offices, err, exists);
  if (site.journal !== undefined) checkJournal(site.journal, err);
  checkClaims(site, err);
}

/** A deposit is never promised anywhere but the company's own re-clean terms. @param {any} site @param {Report} err */
function checkClaims(site, err) {
  for (const key of ["hero", "visit", "cleans", "areas", "keys", "policies", "cleaners", "offices", "journal", "questions", "sections"]) {
    for (const [path, s] of strings(site[key], key)) { const p = claimProblem(s); if (p) err(path, p); }
  }
  if (site.tenancy) for (const [path, s] of strings({ ...site.tenancy, terms: "" }, "tenancy")) { const p = claimProblem(s); if (p) err(path, p); }
}

/** @param {any} h @param {Report} err @param {Exists} exists */
function checkHero(h, err, exists) {
  if (!isObj(h)) { err("hero", "{ kicker, title, intro, photo }"); return; }
  onlyKeys(h, ["kicker", "title", "intro", "photo"], "hero", err);
  text(err, "hero.kicker", h.kicker); text(err, "hero.title", h.title);
  photo(err, "hero.photo", h.photo, exists);
}

/** @param {any} v @param {Report} err */
function checkVisit(v, err) {
  if (!isObj(v)) { err("visit", "the company's minutes and rates: { rates, minimum, deep, rooms, extras, defaults }"); return; }
  onlyKeys(v, ["rates", "minimum", "deep", "rooms", "extras", "defaults", "startTime", "line", "photo"], "visit", err);
  if (!isObj(v.rates)) err("visit.rates", "£ an hour for each of: week, fortnight, once");
  else { onlyKeys(v.rates, [...FREQS], "visit.rates", err); for (const f of FREQS) if (!(typeof v.rates[f] === "number" && v.rates[f] > 0 && v.rates[f] < 500)) err(`visit.rates.${f}`, "£ an hour, more than 0"); }
  if (!(Number.isInteger(v.minimum) && v.minimum >= 0 && v.minimum <= 600)) err("visit.minimum", "the shortest visit booked, in whole minutes (0 for none)");
  if (!(typeof v.deep === "number" && v.deep >= 1 && v.deep <= 3)) err("visit.deep", "how much longer a one-off deep clean takes per room, 1 to 3 (e.g. 1.5)");
  if (!isObj(v.rooms)) err("visit.rooms", "{ kitchen, hall, bed, bath }");
  else {
    onlyKeys(v.rooms, ["kitchen", "hall", "bed", "bath"], "visit.rooms", err);
    for (const k of ["kitchen", "hall", "bed", "bath"]) checkRoom(v.rooms[k], k, err);
  }
  if (Array.isArray(v.extras)) {
    ids(err, "visit.extras", v.extras);
    v.extras.forEach((e, i) => { onlyKeys(e, ["id", "name", "min", "perBed"], `visit.extras[${i}]`, err); text(err, `visit.extras[${i}].name`, e?.name); if (!isMin(e?.min)) err(`visit.extras[${i}].min`, "whole minutes"); });
  } else err("visit.extras", "a list (it may be empty)");
  if (!validChoice(v.defaults)) err("visit.defaults", `the home shown first: { beds 1–${MAX_BEDS}, baths 1–${MAX_BATHS}, freq ${FREQS.join("/")} }`);
  if (v.startTime !== undefined && !HHMM.test(v.startTime)) err("visit.startTime", "HH:MM, the usual start of a visit");
  if (v.line !== undefined) text(err, "visit.line", v.line);
}

/** @param {any} r @param {string} k @param {Report} err */
function checkRoom(r, k, err) {
  const at = `visit.rooms.${k}`;
  if (!isObj(r)) { err(at, "{ name, min, tasks, not }"); return; }
  onlyKeys(r, ["name", "min", "extraMin", "tasks", "not"], at, err);
  text(err, `${at}.name`, r.name);
  if (!isMin(r.min)) err(`${at}.min`, "whole minutes, 1 to 600");
  if (r.extraMin !== undefined && (!isMin(r.extraMin) || (k !== "bed" && k !== "bath"))) err(`${at}.extraMin`, "whole minutes for each further bedroom or bathroom");
  texts(err, `${at}.tasks`, r.tasks);
  if (r.not !== undefined) text(err, `${at}.not`, r.not);
}

/** @param {any} s @param {Report} err @param {Exists} exists */
function checkServices(s, err, exists) {
  if (!isObj(s)) { err("cleans", "{ items }"); return; }
  onlyKeys(s, ["title", "intro", "items"], "cleans", err);
  if (!list(err, "cleans.items", s.items, "service")) return;
  ids(err, "cleans.items", s.items);
  const taken = ["index", "included", "end-of-tenancy", "policies", "offices", "cleaners", "journal", "visit", "privacy", "404"];
  s.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => { if (taken.includes(x?.id) || String(x?.id).startsWith("journal-")) err(`cleans.items[${i}].id`, `"${x.id}" is already a page's name; choose another`); });
  s.items.forEach((x, i) => {
    const at = `cleans.items[${i}]`;
    onlyKeys(x, ["id", "name", "line", "rate", "from", "unit", "page"], at, err);
    text(err, `${at}.name`, x?.name); text(err, `${at}.line`, x?.line);
    if (x?.rate !== undefined && !(typeof x.rate === "number" && x.rate > 0)) err(`${at}.rate`, "£ an hour");
    if (x?.from !== undefined && !(typeof x.from === "number" && x.from > 0)) err(`${at}.from`, "a \"from\" price in £");
    if (x?.rate === undefined && x?.from === undefined) err(at, "give an hourly rate (rate) or a \"from\" price (from)");
    if (x?.page !== undefined) checkServicePage(x.page, `${at}.page`, err, exists);
  });
}

/** @param {any} pg @param {string} at @param {Report} err @param {Exists} exists */
function checkServicePage(pg, at, err, exists) {
  onlyKeys(pg, ["intro", "sections", "photo", "takes"], at, err);
  text(err, `${at}.intro`, pg?.intro); sections(err, `${at}.sections`, pg?.sections);
  if (pg?.photo !== undefined) photo(err, `${at}.photo`, pg.photo, exists);
  if (pg?.takes !== undefined) text(err, `${at}.takes`, pg.takes);
}

/** @param {any} a @param {boolean} demo @param {Report} err */
function checkAreas(a, demo, err) {
  if (!isObj(a)) { err("areas", "{ districts, … }"); return; }
  onlyKeys(a, ["title", "intro", "districts", "places", "days"], "areas", err);
  if (list(err, "areas.districts", a.districts, "postcode district (e.g. SW4)")) a.districts.forEach((d, i) => { if (!isDistrict(d)) err(`areas.districts[${i}]`, "a district in capitals, like SW4 or SW1"); });
  if (a.places !== undefined) texts(err, "areas.places", a.places);
  if (a.days !== undefined) {
    const d = a.days;
    onlyKeys(d, ["source", "csvUrl", "staleAfterDays"], "areas.days", err);
    if (d?.source === "simulated") { if (!demo) err("areas.days.source", "simulated free days are for demos; use \"sheet\" with the company's published sheet"); }
    else if (d?.source === "sheet") { if (!/^https:\/\/docs\.google\.com\/spreadsheets\//.test(d.csvUrl ?? "")) err("areas.days.csvUrl", "the sheet's published CSV link (https://docs.google.com/spreadsheets/…)"); }
    else err("areas.days.source", "\"sheet\" (or \"simulated\" on a demo)");
    if (!(Number.isInteger(d?.staleAfterDays) && d.staleAfterDays >= 1 && d.staleAfterDays <= 14)) err("areas.days.staleAfterDays", "days after which the sheet counts as out of date, 1 to 14");
  }
}

/** @param {any} k @param {Report} err */
function checkKeys(k, err) {
  if (!isObj(k)) { err("keys", "{ steps, rules }"); return; }
  onlyKeys(k, ["title", "intro", "label", "steps", "rules"], "keys", err);
  if (list(err, "keys.steps", k.steps, "{ when, what, detail }")) k.steps.forEach((s, i) => { onlyKeys(s, ["when", "what", "detail", "where"], `keys.steps[${i}]`, err); text(err, `keys.steps[${i}].when`, s?.when); text(err, `keys.steps[${i}].what`, s?.what); });
  sections(err, "keys.rules", k.rules);
}

/** @param {any} t @param {Report} err */
function checkTenancy(t, err) {
  if (!page(err, "tenancy", t, ["before", "rooms", "terms", "depositLink", "checked", "cleanDaysBefore", "bookDaysBefore", "message"])) return;
  texts(err, "tenancy.before", t.before);
  if (list(err, "tenancy.rooms", t.rooms, "{ name, items }")) t.rooms.forEach((r, i) => { onlyKeys(r, ["name", "items"], `tenancy.rooms[${i}]`, err); text(err, `tenancy.rooms[${i}].name`, r?.name); texts(err, `tenancy.rooms[${i}].items`, r?.items); });
  text(err, "tenancy.terms", t.terms);
  if (!/^https:\/\/www\.gov\.uk\//.test(t.depositLink ?? "")) err("tenancy.depositLink", "the gov.uk page on tenancy deposits");
  if (!/^\d{4}-\d{2}$/.test(t.checked ?? "")) err("tenancy.checked", "the month the gov.uk link was checked, YYYY-MM");
  if (!(Number.isInteger(t.cleanDaysBefore) && t.cleanDaysBefore >= 0 && t.cleanDaysBefore <= 7)) err("tenancy.cleanDaysBefore", "days before check-out the clean happens, 0 to 7");
  if (!(Number.isInteger(t.bookDaysBefore) && t.bookDaysBefore >= 1 && t.bookDaysBefore <= 60)) err("tenancy.bookDaysBefore", "days before the clean to book by, 1 to 60");
  if (t.message !== undefined) text(err, "tenancy.message", t.message);
}

/** @param {any} o @param {Report} err @param {Exists} exists */
function checkOffices(o, err, exists) {
  if (!page(err, "offices", o, ["hours", "gap", "zones", "message", "photo", "rate"])) return;
  if (!isObj(o.hours) || !HHMM.test(o.hours.open ?? "") || !HHMM.test(o.hours.close ?? "")) err("offices.hours", "the hours shown first: { open: \"08:00\", close: \"18:00\" }");
  if (!(Number.isInteger(o.gap) && o.gap >= 0 && o.gap <= 120)) err("offices.gap", "minutes between the team leaving and the office opening, 0 to 120");
  if (list(err, "offices.zones", o.zones, "zone")) {
    ids(err, "offices.zones", o.zones);
    o.zones.forEach((/** @type {any} */ z, /** @type {number} */ i) => checkZone(z, `offices.zones[${i}]`, err));
  }
  text(err, "offices.message", o.message);
  if (o.photo !== undefined) photo(err, "offices.photo", o.photo, exists);
  if (o.rate !== undefined) err("offices.rate", "offices are quoted after a site survey; the page shows no price");
}

/** @param {any} z @param {string} at @param {Report} err */
function checkZone(z, at, err) {
  onlyKeys(z, ["id", "name", "min", "per", "count", "max", "tasks", "freq"], at, err);
  text(err, `${at}.name`, z?.name); texts(err, `${at}.tasks`, z?.tasks);
  if (!(typeof z?.min === "number" && z.min > 0 && z.min <= 600)) err(`${at}.min`, "minutes (per item when `per` is set)");
  if (z?.per !== undefined) { text(err, `${at}.per`, z.per); if (!(Number.isInteger(z.count) && z.count > 0 && Number.isInteger(z.max) && z.max >= z.count)) err(`${at}.count`, "how many to show first (count) and the most (max)"); }
  if (z?.freq !== undefined) text(err, `${at}.freq`, z.freq);
}

/** @param {any} j @param {Report} err */
function checkJournal(j, err) {
  if (!page(err, "journal", j, ["items"])) return;
  if (!list(err, "journal.items", j.items, "article")) return;
  ids(err, "journal.items", j.items, "slug");
  j.items.forEach((a, i) => {
    const at = `journal.items[${i}]`;
    onlyKeys(a, ["slug", "title", "date", "intro", "sections"], at, err);
    text(err, `${at}.title`, a?.title); text(err, `${at}.intro`, a?.intro);
    if (!isYmd(a?.date)) err(`${at}.date`, "YYYY-MM-DD");
    sections(err, `${at}.sections`, a?.sections);
  });
}
