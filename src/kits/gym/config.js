// @ts-check
/**
 * Validation for the gym kit (premium gyms and health clubs). Every class, time, count, price and fee is the club's own;
 * these checks make sure it is complete and can't mislead:
 * - Prices follow the DMCC Act 2024 and the CMA's price-transparency guidance (CMA209): every membership and corporate
 *   rate lists its mandatory fees (joining, admin, induction; an empty list must be written, so "no fees" is a decision,
 *   never an omission), and the build works out every headline total itself. A price typed as text is refused.
 * - The count: "usually" figures are the club's own averages; a live count comes only from the club's sheet and is
 *   ignored after 15 minutes at most. Simulated counts and places are refused on client sites.
 * - Booking goes to the club's own app (Mindbody, Glofox, TeamUp…), never a form we run.
 * A misspelt setting is refused, never silently ignored.
 */
import { isTime } from "../../core/lib/hours.js";
import { checkGymPages } from "./config-pages.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const ID = /^[a-z0-9-]{1,40}$/;
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const HEAD = ["title", "intro"];
const PHOTO = ["src", "width", "height", "alt", "caption"];
/** Words that would turn a fact into a promise. */
const PROMISES = /\b(guarantee[ds]?|results? in|lose \d|transform your body|best gym)\b/i;

/** @param {Report} err @param {string} path @param {any} v */
function text(err, path, v) { if (!isStr(v)) err(path, "required text is missing"); }

/** @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (!isObj(o)) { err(at, "must be an object"); return; }
  for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}

/** @param {Report} err @param {string} path @param {any} p @param {((rel: string) => boolean)|undefined} exists */
function photo(err, path, p, exists) {
  if (!isObj(p)) { err(path, "a photo: { src, width, height, alt }"); return; }
  onlyKeys(p, PHOTO, path, err);
  text(err, `${path}.alt`, p.alt);
  if (!Number.isInteger(p.width) || !Number.isInteger(p.height)) err(path, "width and height in pixels");
  if (!isStr(p.src)) err(`${path}.src`, "required");
  else if (exists && !exists(p.src)) err(`${path}.src`, `file not found: ${p.src}`);
}

/** @param {Report} err @param {string} path @param {any[]} list @returns {Set<string>} */
function ids(err, path, list) {
  const seen = new Set();
  (Array.isArray(list) ? list : []).forEach((x, i) => {
    if (!ID.test(x?.id ?? "")) err(`${path}[${i}].id`, "lowercase letters, numbers and dashes");
    else if (seen.has(x.id)) err(`${path}[${i}].id`, `"${x.id}" is used twice`);
    seen.add(x?.id);
  });
  return seen;
}

/** @param {any} v @param {string} at @param {Report} err */
function httpsUrl(v, at, err) {
  if (v === undefined) return;
  try { if (new URL(v).protocol !== "https:") throw new Error(); } catch { err(at, "a full https:// link"); }
}

/** @param {any} v */
const wholePounds = (v) => Number.isInteger(v) && v >= 0 && v <= 100000;

/**
 * A price the build can total lawfully: whole-pound monthly price, minimum term in months (0 = rolling), and every
 * mandatory fee. @param {any} p @param {string} at @param {Report} err
 */
function priced(p, at, err) {
  if (!wholePounds(p.monthly) || p.monthly < 1) err(`${at}.monthly`, "the monthly price in whole pounds, e.g. 129");
  if (!Number.isInteger(p.minimumMonths) || p.minimumMonths < 0 || p.minimumMonths > 24) err(`${at}.minimumMonths`, "the minimum term in months (0 for a rolling month-to-month membership)");
  if (!Array.isArray(p.mandatoryFees)) {
    err(`${at}.mandatoryFees`, "list every fee a member must pay to join (joining, admin, induction), or [] if there are none. The law (DMCC Act 2024, CMA209) requires them in the headline price, so the build adds them itself; leaving the list out is refused");
    return;
  }
  p.mandatoryFees.forEach((/** @type {any} */ f, /** @type {number} */ i) => {
    onlyKeys(f, ["name", "amount"], `${at}.mandatoryFees[${i}]`, err);
    if (!isStr(f?.name) || f.name.length > 30) err(`${at}.mandatoryFees[${i}].name`, "the fee's name, e.g. \"Joining fee\"");
    if (!wholePounds(f?.amount) || f.amount < 1) err(`${at}.mandatoryFees[${i}].amount`, "whole pounds, e.g. 30 (a fee of nothing isn't a fee: leave it out)");
  });
}

/** @param {any} site @param {Report} err @param {((rel: string) => boolean)|undefined} [exists] */
export function checkGym(site, err, exists) {
  if (site.kit !== "gym") return;
  checkBooking(site.booking, err);
  const classIds = site.classTypes !== undefined ? checkClassTypes(site.classTypes, err) : new Set();
  if (site.timetable !== undefined) checkTimetable(site.timetable, classIds, err);
  if (site.busy !== undefined) checkBusy(site.busy, site, err);
  if (site.clubMemberships !== undefined) checkMemberships(site.clubMemberships, err);
  if (site.corporate !== undefined) checkCorporate(site.corporate, site.clubMemberships, err);
  if (site.recovery !== undefined) checkRecovery(site.recovery, err, exists);
  if (site.spaces !== undefined) checkSource(site.spaces, "spaces", site.mode, err);
  if (site.hyrox !== undefined) checkHyrox(site.hyrox, classIds, err, exists);
  checkPagesAndCopy(site, err, exists);
  checkGymPages(site, err, exists);
}

/** @param {any} b @param {Report} err */
function checkBooking(b, err) {
  if (!isObj(b) || b.provider !== "other" || !isStr(b.name) || !isStr(b.url)) err("booking", "the club's booking app: { \"provider\": \"other\", \"name\": \"Glofox\", \"url\": \"https://…\" } (classes say \"Book in the app\" and link there)");
}

/** The requests, the page heads, the hero photographs and the no-promises rule. @param {any} site @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkPagesAndCopy(site, err, exists) {
  for (const k of ["friendPass", "dayPass"]) if (site[k] !== undefined) checkRequest(site[k], k, err);
  for (const k of ["timetablePage", "membershipPage"]) if (site[k] !== undefined) { onlyKeys(site[k], HEAD, k, err); text(err, `${k}.title`, site[k]?.title); }
  if (site.hero?.photo) photo(err, "hero.photo", site.hero.photo, exists);
  if (site.hero?.phonePhoto) photo(err, "hero.phonePhoto", site.hero.phonePhoto, exists);
  const copy = JSON.stringify([site.clubMemberships, site.corporate, site.hyrox, site.recovery, site.dayPass, site.friendPass]);
  if (PROMISES.test(copy)) err("copy", "no promises of results (guaranteed, lose…, transform your body): say what the club does, not what a body will do");
}

/** @param {any} c @param {Report} err */
function checkClassTypes(c, err) {
  onlyKeys(c, ["items"], "classTypes", err);
  const items = Array.isArray(c?.items) ? c.items : [];
  if (!items.length) err("classTypes.items", "the club's classes: [{ id, name, minutes, text }]");
  const seen = ids(err, "classTypes.items", items);
  items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    onlyKeys(x, ["id", "name", "minutes", "text", "size", "goals", "level"], `classTypes.items[${i}]`, err);
    text(err, `classTypes.items[${i}].name`, x?.name);
    text(err, `classTypes.items[${i}].text`, x?.text);
    if (!Number.isInteger(x?.minutes) || x.minutes < 10 || x.minutes > 180) err(`classTypes.items[${i}].minutes`, "the class's length in minutes, 10 to 180");
    if (x?.size !== undefined && (!Number.isInteger(x.size) || x.size < 1 || x.size > 200)) err(`classTypes.items[${i}].size`, "the most people in the class, 1 to 200");
  });
  return seen;
}

/** @param {any} t @param {Set<string>} classIds @param {Report} err */
function checkTimetable(t, classIds, err) {
  onlyKeys(t, ["weekly"], "timetable", err);
  if (!isObj(t?.weekly)) { err("timetable.weekly", "{ \"mon\": [{ \"time\": \"18:30\", \"class\": \"<class id>\" }], … }"); return; }
  for (const [day, list] of Object.entries(t.weekly)) {
    if (!DAYS.includes(day)) { err(`timetable.weekly.${day}`, `days are ${DAYS.join(", ")}`); continue; }
    (Array.isArray(list) ? list : []).forEach((/** @type {any} */ s, /** @type {number} */ i) => {
      const at = `timetable.weekly.${day}[${i}]`;
      onlyKeys(s, ["time", "class", "coach", "room", "url"], at, err);
      if (!isTime(s?.time)) err(`${at}.time`, "24-hour time, e.g. \"18:30\"");
      if (!classIds.has(s?.class)) err(`${at}.class`, "one of the class ids in classTypes.items");
      httpsUrl(s?.url, `${at}.url`, err);
    });
  }
}

/** @param {any} busy @param {any} site @param {Report} err */
function checkBusy(busy, site, err) {
  onlyKeys(busy, ["capacity", "usual", "live"], "busy", err);
  if (!Number.isInteger(busy?.capacity) || busy.capacity < 10 || busy.capacity > 5000) err("busy.capacity", "the most people the club may hold at once (its own figure)");
  if (!isObj(busy?.usual)) err("busy.usual", "the club's own usual count for each hour, per weekday: { \"mon\": [24 numbers or null, midnight first] }");
  else for (const day of DAYS) {
    const row = busy.usual[day];
    if (!Array.isArray(row) || row.length !== 24) { err(`busy.usual.${day}`, "24 values, one per hour from midnight: the usual count, or null when closed"); continue; }
    row.forEach((v, h) => { if (v !== null && (!Number.isInteger(v) || v < 0 || v > busy.capacity)) err(`busy.usual.${day}[${h}]`, "a whole number from 0 to the capacity, or null"); });
  }
  for (const k of Object.keys(busy?.usual ?? {})) if (!DAYS.includes(k)) err(`busy.usual.${k}`, `days are ${DAYS.join(", ")}`);
  if (busy?.live !== undefined) {
    if (!site.features?.includes("gym-live")) err("busy.live", "only with the gym-live feature (Signature)");
    checkSource(busy.live, "busy.live", site.mode, err);
  }
}

/** A live source: the club's published sheet, or simulated on a demo; never older than 15 minutes. @param {any} s @param {string} at @param {string} mode @param {Report} err */
function checkSource(s, at, mode, err) {
  onlyKeys(s, ["source", "csvUrl", "staleAfterMinutes"], at, err);
  if (s?.source === "simulated") { if (mode !== "demo") err(`${at}.source`, "simulated figures are for demos only; use the club's sheet"); }
  else if (s?.source === "sheet") { if (!/^https:\/\/docs\.google\.com\/spreadsheets\/d\/e\/[\w-]+\/pub\?(.+&)?output=csv/.test(s.csvUrl ?? "")) err(`${at}.csvUrl`, "the club's Google Sheet published as CSV (https://docs.google.com/spreadsheets/d/e/…/pub?…output=csv)"); }
  else err(`${at}.source`, "\"sheet\" (or \"simulated\" on a demo)");
  if (s?.staleAfterMinutes !== undefined && (!Number.isInteger(s.staleAfterMinutes) || s.staleAfterMinutes < 1 || s.staleAfterMinutes > 15)) err(`${at}.staleAfterMinutes`, "1 to 15: an older figure is not shown");
}

/** @param {any} m @param {Report} err */
function checkMemberships(m, err) {
  onlyKeys(m, ["title", "intro", "tiers", "note"], "clubMemberships", err);
  text(err, "clubMemberships.title", m?.title);
  const tiers = Array.isArray(m?.tiers) ? m.tiers : [];
  if (!tiers.length) err("clubMemberships.tiers", "the club's memberships");
  ids(err, "clubMemberships.tiers", tiers);
  tiers.forEach((/** @type {any} */ t, /** @type {number} */ i) => {
    const at = `clubMemberships.tiers[${i}]`;
    onlyKeys(t, ["id", "name", "monthly", "minimumMonths", "mandatoryFees", "includes", "line"], at, err);
    text(err, `${at}.name`, t?.name);
    priced(t ?? {}, at, err);
    if (!Array.isArray(t?.includes) || !t.includes.length || !t.includes.every(isStr)) err(`${at}.includes`, "what the membership includes, one item per line");
  });
}

/** @param {any} c @param {any} memberships @param {Report} err */
function checkCorporate(c, memberships, err) {
  onlyKeys(c, ["title", "intro", "rates", "companies", "message", "proof"], "corporate", err);
  text(err, "corporate.title", c?.title);
  text(err, "corporate.proof", c?.proof);
  text(err, "corporate.message", c?.message);
  const tierIds = new Set((memberships?.tiers ?? []).map((/** @type {any} */ t) => t.id));
  const rates = Array.isArray(c?.rates) ? c.rates : [];
  if (!rates.length) err("corporate.rates", "the club's corporate rates");
  const rateIds = ids(err, "corporate.rates", rates);
  rates.forEach((/** @type {any} */ r, /** @type {number} */ i) => {
    const at = `corporate.rates[${i}]`;
    onlyKeys(r, ["id", "name", "tier", "monthly", "minimumMonths", "mandatoryFees"], at, err);
    text(err, `${at}.name`, r?.name);
    if (!tierIds.has(r?.tier)) err(`${at}.tier`, "the membership this rate is for (an id in clubMemberships.tiers)");
    priced(r ?? {}, at, err);
  });
  const companies = Array.isArray(c?.companies) ? c.companies : [];
  if (!companies.length) err("corporate.companies", "the companies with a rate: [{ name, rate }]");
  companies.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    onlyKeys(x, ["name", "rate"], `corporate.companies[${i}]`, err);
    text(err, `corporate.companies[${i}].name`, x?.name);
    if (!rateIds.has(x?.rate)) err(`corporate.companies[${i}].rate`, "an id in corporate.rates");
  });
}

/** @param {any} r @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkRecovery(r, err, exists) {
  onlyKeys(r, ["title", "intro", "photo", "room", "slots", "rules"], "recovery", err);
  text(err, "recovery.title", r?.title);
  if (r?.photo !== undefined) photo(err, "recovery.photo", r.photo, exists);
  if (r?.room !== undefined) photo(err, "recovery.room", r.room, exists);
  if (r?.rules !== undefined && (!Array.isArray(r.rules) || !r.rules.every(isStr))) err("recovery.rules", "a list of short lines");
  const slots = Array.isArray(r?.slots) ? r.slots : [];
  if (!slots.length) err("recovery.slots", "the bookable slots: [{ id, name, minutes, size, days, times }]");
  ids(err, "recovery.slots", slots);
  slots.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    const at = `recovery.slots[${i}]`;
    onlyKeys(s, ["id", "name", "minutes", "size", "with", "days", "times", "url"], at, err);
    text(err, `${at}.name`, s?.name);
    if (!Number.isInteger(s?.minutes) || s.minutes < 10 || s.minutes > 120) err(`${at}.minutes`, "the slot's length in minutes");
    if (!Number.isInteger(s?.size) || s.size < 1 || s.size > 60) err(`${at}.size`, "how many people at once");
    if (!Array.isArray(s?.days) || !s.days.length || !s.days.every((/** @type {any} */ d) => DAYS.includes(d))) err(`${at}.days`, `the days it runs, from ${DAYS.join(", ")}`);
    if (!Array.isArray(s?.times) || !s.times.length || !s.times.every(isTime)) err(`${at}.times`, "start times, e.g. [\"19:30\", \"20:30\"]");
    httpsUrl(s?.url, `${at}.url`, err);
  });
}

/** @param {any} h @param {Set<string>} classIds @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkHyrox(h, classIds, err, exists) {
  onlyKeys(h, ["title", "intro", "phases", "taper", "minWeeks", "maxWeeks", "short", "long", "page"], "hyrox", err);
  text(err, "hyrox.title", h?.title);
  text(err, "hyrox.short", h?.short);
  text(err, "hyrox.long", h?.long);
  const phase = (/** @type {any} */ p, /** @type {string} */ at, /** @type {boolean} */ taper) => checkPhase(p, at, taper, classIds, err);
  const phases = Array.isArray(h?.phases) ? h.phases : [];
  if (phases.length < 2 || phases.length > 5) err("hyrox.phases", "two to five phases before the taper");
  phases.forEach((/** @type {any} */ p, /** @type {number} */ i) => phase(p, `hyrox.phases[${i}]`, false));
  phase(h?.taper, "hyrox.taper", true);
  checkWeeks(h, phases.length, err);
  if (h?.page !== undefined) checkHyroxPage(h.page, err, exists);
}

/** Every phase gets at least a week before the taper. @param {any} h @param {number} phases @param {Report} err */
function checkWeeks(h, phases, err) {
  const least = Math.max(4, phases + (Number.isInteger(h?.taper?.weeks) ? h.taper.weeks : 1));
  if (!Number.isInteger(h?.minWeeks) || h.minWeeks < least) err("hyrox.minWeeks", `the shortest plan the club writes: at least ${least} weeks (a week for each phase and the taper's weeks)`);
  if (!Number.isInteger(h?.maxWeeks) || h.maxWeeks <= (h?.minWeeks ?? 0) || h.maxWeeks > 52) err("hyrox.maxWeeks", "the longest plan, more than minWeeks and at most 52");
}

/** @param {any} page @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkHyroxPage(page, err, exists) {
  onlyKeys(page, ["photo", "notes"], "hyrox.page", err);
  if (page?.photo !== undefined) photo(err, "hyrox.page.photo", page.photo, exists);
  if (!Array.isArray(page?.notes) || !page.notes.every(isStr)) err("hyrox.page.notes", "a list of short lines");
}

/** @param {any} p @param {string} at @param {boolean} taper @param {Set<string>} classIds @param {Report} err */
function checkPhase(p, at, taper, classIds, err) {
  onlyKeys(p, taper ? ["name", "text", "classes", "weeks"] : ["name", "text", "classes", "share"], at, err);
  text(err, `${at}.name`, p?.name);
  text(err, `${at}.text`, p?.text);
  if (!Array.isArray(p?.classes) || !p.classes.length || !p.classes.every((/** @type {any} */ c) => classIds.has(c))) err(`${at}.classes`, "the club's own classes for this phase (ids in classTypes.items)");
  const ok = taper ? Number.isInteger(p?.weeks) && p.weeks >= 1 && p.weeks <= 3 : typeof p?.share === "number" && p.share > 0 && p.share <= 1;
  if (!ok) err(at, taper ? "weeks: 1 to 3" : "share: this phase's part of the weeks before the taper, 0 to 1");
}

/** A request sent on WhatsApp: the friend pass, the day pass. @param {any} r @param {string} at @param {Report} err */
function checkRequest(r, at, err) {
  onlyKeys(r, ["title", "intro", "rules", "message", "goals"], at, err);
  text(err, `${at}.title`, r?.title);
  text(err, `${at}.message`, r?.message);
  if (r?.rules !== undefined && (!Array.isArray(r.rules) || !r.rules.every(isStr))) err(`${at}.rules`, "a list of short lines (who can come, how often, what to bring)");
  if (r?.goals !== undefined && (!Array.isArray(r.goals) || !r.goals.every(isStr))) err(`${at}.goals`, "a list of short choices");
}
