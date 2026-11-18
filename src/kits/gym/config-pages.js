// @ts-check
/**
 * Validation for the gym's own pages (the second set): the class finder, the free trial, the club tour, the coaches,
 * personal training, the first visit, the app, members' events and the journal. Same rules as config.js: every fact is
 * the club's own, every price is a lawful total worked out by the build (DMCC Act 2024, CMA209), and a misspelt
 * setting is refused, never ignored.
 */

/** @typedef {(path: string, msg: string) => void} Report */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const ID = /^[a-z0-9-]{1,40}$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const YMD = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const PHOTO = ["src", "width", "height", "alt", "caption"];

/** @param {Report} err @param {string} path @param {any} v */
function text(err, path, v) { if (!isStr(v)) err(path, "required text is missing"); }

/** @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (!isObj(o)) { err(at, "must be an object"); return false; }
  for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
  return true;
}

/** @param {Report} err @param {string} path @param {any} v @param {string} what */
function lines(err, path, v, what) {
  if (!Array.isArray(v) || !v.length || !v.every(isStr)) err(path, `a list of ${what}`);
}

/** @param {Report} err @param {string} path @param {any} p @param {((rel: string) => boolean)|undefined} exists */
function photo(err, path, p, exists) {
  if (!onlyKeys(p, PHOTO, path, err)) return;
  text(err, `${path}.alt`, p.alt);
  if (!Number.isInteger(p.width) || !Number.isInteger(p.height)) err(path, "width and height in pixels");
  if (!isStr(p.src)) err(`${path}.src`, "required");
  else if (exists && !exists(p.src)) err(`${path}.src`, `file not found: ${p.src}`);
}

/** A page's head: title and one line. @param {any} o @param {string} at @param {Report} err */
function head(o, at, err) { text(err, `${at}.title`, o?.title); if (o?.intro !== undefined) text(err, `${at}.intro`, o.intro); }

/** @param {any} v @param {string} at @param {Report} err */
function httpsUrl(v, at, err) {
  if (v === undefined) return;
  try { if (new URL(v).protocol !== "https:") throw new Error(); } catch { err(at, "a full https:// link"); }
}

/** @param {any[]} list @param {string} at @param {Report} err @returns {Set<string>} */
function ids(list, at, err) {
  const seen = new Set();
  list.forEach((x, i) => {
    if (!ID.test(x?.id ?? "")) err(`${at}[${i}].id`, "lowercase letters, numbers and dashes");
    else if (seen.has(x.id)) err(`${at}[${i}].id`, `"${x.id}" is used twice`);
    seen.add(x?.id);
  });
  return seen;
}

/** Choices the finder offers: [{ id, label }]. @param {any} v @param {string} at @param {Report} err */
function choices(v, at, err) {
  if (!Array.isArray(v) || v.length < 2 || v.length > 8) { err(at, "two to eight choices: [{ id, label }]"); return new Set(); }
  v.forEach((c, i) => { onlyKeys(c, ["id", "label"], `${at}[${i}]`, err); text(err, `${at}[${i}].label`, c?.label); });
  return ids(v, at, err);
}

/**
 * The class finder: the club's goals and levels, and each class tagged with them.
 * @param {any} site @param {Report} err
 */
function checkFinder(site, err) {
  const f = site.classFinder;
  if (!onlyKeys(f, ["title", "intro", "goals", "levels"], "classFinder", err)) return;
  head(f, "classFinder", err);
  const goals = choices(f.goals, "classFinder.goals", err), levels = choices(f.levels, "classFinder.levels", err);
  (site.classTypes?.items ?? []).forEach((/** @type {any} */ c, /** @type {number} */ i) => {
    const at = `classTypes.items[${i}]`;
    if (!Array.isArray(c?.goals) || !c.goals.length || !c.goals.every((/** @type {any} */ g) => goals.has(g))) err(`${at}.goals`, "what the class is for: ids from classFinder.goals");
    if (!levels.has(c?.level)) err(`${at}.level`, "who it suits: an id from classFinder.levels");
  });
}

/** Steps people follow: [{ title, text }]. @param {any} v @param {string} at @param {Report} err */
function steps(v, at, err) {
  if (!Array.isArray(v) || v.length < 2 || v.length > 8) { err(at, "two to eight steps: [{ title, text }]"); return; }
  v.forEach((s, i) => { onlyKeys(s, ["title", "text"], `${at}[${i}]`, err); text(err, `${at}[${i}].title`, s?.title); text(err, `${at}[${i}].text`, s?.text); });
}

/** @param {any} t @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkTrial(t, err, exists) {
  if (!onlyKeys(t, ["title", "intro", "photo", "includes", "steps"], "trialPage", err)) return;
  head(t, "trialPage", err);
  if (t.photo !== undefined) photo(err, "trialPage.photo", t.photo, exists);
  lines(err, "trialPage.includes", t.includes, "what the day includes");
  steps(t.steps, "trialPage.steps", err);
}

/** @param {any} t @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkTour(t, err, exists) {
  if (!onlyKeys(t, ["title", "intro", "rooms"], "tour", err)) return;
  head(t, "tour", err);
  if (!Array.isArray(t.rooms) || t.rooms.length < 2 || t.rooms.length > 8) { err("tour.rooms", "two to eight rooms: [{ id, name, photo, text, facts }]"); return; }
  ids(t.rooms, "tour.rooms", err);
  t.rooms.forEach((/** @type {any} */ r, /** @type {number} */ i) => {
    const at = `tour.rooms[${i}]`;
    onlyKeys(r, ["id", "name", "photo", "text", "facts"], at, err);
    text(err, `${at}.name`, r?.name);
    text(err, `${at}.text`, r?.text);
    photo(err, `${at}.photo`, r?.photo, exists);
    lines(err, `${at}.facts`, r?.facts, "short facts (what's in the room, how many, step-free)");
  });
}

/** @param {any} c @param {any} site @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkCoaches(c, site, err, exists) {
  if (!onlyKeys(c, ["title", "intro", "items"], "coaches", err)) return;
  head(c, "coaches", err);
  if (!Array.isArray(c.items) || !c.items.length) { err("coaches.items", "the club's coaches: [{ id, name, photo, role, qualifications, text }]"); return; }
  ids(c.items, "coaches.items", err);
  const onTimetable = new Set(Object.values(site.timetable?.weekly ?? {}).flat().map((/** @type {any} */ s) => s?.coach).filter(Boolean));
  c.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `coaches.items[${i}]`;
    onlyKeys(x, ["id", "name", "photo", "role", "qualifications", "text"], at, err);
    text(err, `${at}.name`, x?.name);
    text(err, `${at}.role`, x?.role);
    text(err, `${at}.text`, x?.text);
    if (x?.photo !== undefined) photo(err, `${at}.photo`, x.photo, exists);
    lines(err, `${at}.qualifications`, x?.qualifications, "the coach's qualifications, as on their certificates");
    if (isStr(x?.name) && onTimetable.size && !onTimetable.has(x.name)) err(`${at}.name`, `"${x.name}" isn't a coach on the timetable; write the name the timetable uses (timetable.weekly[].coach)`);
  });
  // The coaches page shows each coach's week from the timetable: without coach names there, it would show none.
  if (!onTimetable.size) err("coaches", "the timetable names no coaches: add \"coach\" to its sessions (timetable.weekly[].coach), the same names as here");
}

/** The same price rule as memberships. @param {any} p @param {string} at @param {Report} err */
function pack(p, at, err) {
  onlyKeys(p, ["id", "name", "sessions", "minutes", "price", "mandatoryFees", "text"], at, err);
  text(err, `${at}.name`, p?.name);
  if (!Number.isInteger(p?.sessions) || p.sessions < 1 || p.sessions > 50) err(`${at}.sessions`, "how many sessions the pack holds, 1 to 50");
  if (!Number.isInteger(p?.minutes) || p.minutes < 15 || p.minutes > 180) err(`${at}.minutes`, "each session's length in minutes");
  if (!Number.isInteger(p?.price) || p.price < 1 || p.price > 100000) err(`${at}.price`, "the pack's price in whole pounds, e.g. 270");
  if (!Array.isArray(p?.mandatoryFees)) {
    err(`${at}.mandatoryFees`, "list every fee a client must pay for this pack (an assessment, say), or [] if there are none. The law (DMCC Act 2024, CMA209) requires them in the headline price, so the build adds them itself; leaving the list out is refused");
    return;
  }
  p.mandatoryFees.forEach((/** @type {any} */ f, /** @type {number} */ i) => {
    onlyKeys(f, ["name", "amount"], `${at}.mandatoryFees[${i}]`, err);
    if (!isStr(f?.name) || f.name.length > 30) err(`${at}.mandatoryFees[${i}].name`, "the fee's name, e.g. \"Assessment fee\"");
    if (!Number.isInteger(f?.amount) || f.amount < 1) err(`${at}.mandatoryFees[${i}].amount`, "whole pounds (a fee of nothing isn't a fee: leave it out)");
  });
}

/** @param {any} t @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkTraining(t, err, exists) {
  if (!onlyKeys(t, ["title", "intro", "photo", "who", "packs", "notes", "message"], "training", err)) return;
  head(t, "training", err);
  text(err, "training.who", t.who);
  text(err, "training.message", t.message);
  if (t.photo !== undefined) photo(err, "training.photo", t.photo, exists);
  if (t.notes !== undefined) lines(err, "training.notes", t.notes, "short lines");
  if (!Array.isArray(t.packs) || !t.packs.length) { err("training.packs", "the club's personal training packs"); return; }
  ids(t.packs, "training.packs", err);
  t.packs.forEach((/** @type {any} */ p, /** @type {number} */ i) => pack(p, `training.packs[${i}]`, err));
}

/** @param {any} f @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkFirstVisit(f, err, exists) {
  if (!onlyKeys(f, ["title", "intro", "photo", "bring", "steps", "rules"], "firstVisit", err)) return;
  head(f, "firstVisit", err);
  if (f.photo !== undefined) photo(err, "firstVisit.photo", f.photo, exists);
  lines(err, "firstVisit.bring", f.bring, "what to bring");
  steps(f.steps, "firstVisit.steps", err);
  if (f.rules !== undefined) lines(err, "firstVisit.rules", f.rules, "house rules");
}

/** @param {any} a @param {Report} err */
function checkApp(a, err) {
  if (!onlyKeys(a, ["title", "intro", "steps", "rules", "stores"], "app", err)) return;
  head(a, "app", err);
  steps(a.steps, "app.steps", err);
  if (!Array.isArray(a.rules) || !a.rules.length) err("app.rules", "the booking rules: [{ label, text }] (when bookings open, cancelling, the waitlist)");
  else a.rules.forEach((/** @type {any} */ r, /** @type {number} */ i) => { onlyKeys(r, ["label", "text"], `app.rules[${i}]`, err); text(err, `app.rules[${i}].label`, r?.label); text(err, `app.rules[${i}].text`, r?.text); });
  if (a.stores !== undefined) {
    if (!Array.isArray(a.stores) || !a.stores.length) err("app.stores", "[{ name, url }] for the app stores");
    else a.stores.forEach((/** @type {any} */ s, /** @type {number} */ i) => { onlyKeys(s, ["name", "url"], `app.stores[${i}]`, err); text(err, `app.stores[${i}].name`, s?.name); httpsUrl(s?.url, `app.stores[${i}].url`, err); if (s?.url === undefined) err(`app.stores[${i}].url`, "required"); });
  }
}

/** @param {any} e @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkEvents(e, err, exists) {
  if (!onlyKeys(e, ["title", "intro", "photo", "items"], "events", err)) return;
  head(e, "events", err);
  if (e.photo !== undefined) photo(err, "events.photo", e.photo, exists);
  if (!Array.isArray(e.items) || !e.items.length) { err("events.items", "the club's events: [{ id, title, date, time, minutes, text }]"); return; }
  ids(e.items, "events.items", err);
  e.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `events.items[${i}]`;
    onlyKeys(x, ["id", "title", "date", "time", "minutes", "text", "who", "place", "url"], at, err);
    text(err, `${at}.title`, x?.title);
    text(err, `${at}.text`, x?.text);
    if (!YMD.test(x?.date ?? "") || Number.isNaN(Date.parse(`${x.date}T12:00:00Z`))) err(`${at}.date`, "the day, YYYY-MM-DD");
    if (!TIME.test(x?.time ?? "")) err(`${at}.time`, "24-hour start time, e.g. \"18:30\"");
    if (!Number.isInteger(x?.minutes) || x.minutes < 15 || x.minutes > 720) err(`${at}.minutes`, "how long it runs, in minutes");
    if (x?.who !== undefined) text(err, `${at}.who`, x.who);
    if (x?.place !== undefined) text(err, `${at}.place`, x.place);
    httpsUrl(x?.url, `${at}.url`, err);
  });
}

/** @param {any} j @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkJournal(j, err, exists) {
  if (!onlyKeys(j, ["title", "intro", "items"], "journal", err)) return;
  head(j, "journal", err);
  if (!Array.isArray(j.items) || !j.items.length) { err("journal.items", "the club's articles: [{ slug, title, intro, date, minutes, body }]"); return; }
  const seen = new Set();
  j.items.forEach((/** @type {any} */ a, /** @type {number} */ i) => {
    const at = `journal.items[${i}]`;
    onlyKeys(a, ["slug", "title", "intro", "date", "minutes", "photo", "body"], at, err);
    if (!SLUG.test(a?.slug ?? "")) err(`${at}.slug`, "lowercase words and dashes, for the page's address");
    else if (seen.has(a.slug)) err(`${at}.slug`, "used twice");
    seen.add(a?.slug);
    text(err, `${at}.title`, a?.title);
    text(err, `${at}.intro`, a?.intro);
    if (!YMD.test(a?.date ?? "")) err(`${at}.date`, "when it was written, YYYY-MM-DD");
    if (!Number.isInteger(a?.minutes) || a.minutes < 1 || a.minutes > 30) err(`${at}.minutes`, "reading time in minutes");
    if (a?.photo !== undefined) photo(err, `${at}.photo`, a.photo, exists);
    lines(err, `${at}.body`, a?.body, "paragraphs");
  });
}

/** Words that would turn a fact into a promise. */
const PROMISES = /\b(guarantee[ds]?|results? in|lose \d|transform your body|best gym|world[- ]class)\b/i;

/**
 * The gym's own pages. Runs from checkGym (config.js) for gym sites only.
 * @param {any} site @param {Report} err @param {((rel: string) => boolean)|undefined} exists
 */
export function checkGymPages(site, err, exists) {
  if (site.classFinder !== undefined) checkFinder(site, err);
  if (site.trialPage !== undefined) checkTrial(site.trialPage, err, exists);
  if (site.tour !== undefined) checkTour(site.tour, err, exists);
  if (site.coaches !== undefined) checkCoaches(site.coaches, site, err, exists);
  if (site.training !== undefined) checkTraining(site.training, err, exists);
  if (site.firstVisit !== undefined) checkFirstVisit(site.firstVisit, err, exists);
  if (site.app !== undefined) checkApp(site.app, err);
  if (site.events !== undefined) checkEvents(site.events, err, exists);
  if (site.journal !== undefined) checkJournal(site.journal, err, exists);
  const copy = JSON.stringify([site.classFinder, site.trialPage, site.tour, site.coaches, site.training, site.firstVisit, site.app, site.events, site.journal]);
  if (PROMISES.test(copy)) err("copy", "no promises of results (guaranteed, lose…, transform your body, world-class): say what the club does, not what a body will do");
}
