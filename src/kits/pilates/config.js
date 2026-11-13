// @ts-check
/**
 * Validation for the pilates kit (reformer studios): the class types and the week's timetable, places left from the
 * studio's sheet, the first class, the class finder and waitlist, the intro card and gift cards (the studio's own
 * Stripe Payment Links), private and duet sessions, retreats and the labelled reformer clip. Every class, time, length,
 * price and date is the studio's own; the checks only make sure it is complete and can't mislead. Simulated places
 * are refused on client sites. A misspelt setting is refused, never silently ignored.
 */
import { isTime } from "../../core/lib/hours.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const ID = /^[a-z0-9-]{1,40}$/;
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const PHOTO = ["src", "width", "height", "alt", "caption"];
const HEAD = ["kicker", "title", "intro"];

/** @param {Report} err @param {string} path @param {any} v */
function text(err, path, v) { if (!isStr(v)) err(path, "required text is missing"); }

/** @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (isObj(o)) for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
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

/** Unique ids in a list. @param {Report} err @param {string} path @param {any[]} list @returns {Set<string>} */
function ids(err, path, list) {
  const seen = new Set();
  list.forEach((x, i) => {
    if (!ID.test(x?.id ?? "")) err(`${path}[${i}].id`, "lowercase letters, numbers and dashes");
    else if (seen.has(x.id)) err(`${path}[${i}].id`, `"${x.id}" is used twice`);
    seen.add(x?.id);
  });
  return seen;
}

/** A price is the studio's own, in whole pounds; optional. @param {any} v @param {string} at @param {Report} err */
function price(v, at, err) {
  if (v !== undefined && (!Number.isInteger(v) || v < 1 || v > 100000)) err(at, "the studio's own price in whole pounds, e.g. 75");
}

/**
 * The studio's own Stripe Payment Link: test mode on a demo (nothing is ever charged), the live link on a client site.
 * @param {any} link @param {string} at @param {string} mode @param {Report} err
 */
function stripeLink(link, at, mode, err) {
  if (!/^https:\/\/buy\.stripe\.com\/[\w-]+$/.test(link ?? "")) err(at, "the studio's own Stripe Payment Link, https://buy.stripe.com/…");
  else if (mode === "demo" && !link.startsWith("https://buy.stripe.com/test_")) err(at, "demo sites must use a Stripe test-mode link (https://buy.stripe.com/test_…)");
  else if (mode === "client" && link.startsWith("https://buy.stripe.com/test_")) err(at, "is a Stripe test-mode link; client sites need the studio's live link");
}

/** @param {any} v @param {string} at @param {Report} err */
function formUrl(v, at, err) {
  if (v !== undefined && !/^https:\/\/(docs\.google\.com\/forms\/|forms\.gle\/)/.test(v)) err(at, "the studio's own Google Form link (https://docs.google.com/forms/… or https://forms.gle/…)");
}

/** @param {any} v */
const isYmd = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T12:00:00Z`)) && new Date(`${v}T12:00:00Z`).toISOString().startsWith(v);

/** @param {any} site @param {Report} err @param {((rel: string) => boolean)|undefined} [exists] */
export function checkPilates(site, err, exists) {
  if (site.kit !== "pilates") return;
  const classIds = checkClassTypes(site.classTypes, err);
  if (!/\{class\}/.test(site.messages?.book ?? "") || !/\{time\}/.test(site.messages?.book ?? "")) err("messages.book", "the booking message, with {class}, {day} and {time} where they go, e.g. \"Hello, I'd like to book {class} on {day} at {time}.\"");
  if (site.timetable !== undefined) checkTimetable(site.timetable, classIds, err);
  if (site.places !== undefined) checkPlaces(site.places, site.mode, err);
  checkFirstSteps(site, classIds, err, exists);
  if (site.introCard !== undefined) checkIntro(site.introCard, site.mode, err, exists);
  if (site.giftCards !== undefined) checkGifts(site.giftCards, site.mode, err);
  for (const k of ["classesPage", "giftsPage"]) if (site[k] !== undefined) { onlyKeys(site[k], HEAD, k, err); text(err, `${k}.title`, site[k]?.title); }
  if (site.privatePage !== undefined) checkPrivate(site.privatePage, err, exists);
  if (site.retreats !== undefined) checkRetreats(site.retreats, site.mode, err, exists);
  if (site.reformerClip !== undefined) checkClip(site.reformerClip, err, exists);
  checkHeroPhotos(site.hero, err, exists);
  checkSignatureExtras(site, classIds, err, exists);
}

/**
 * The Signature additions: the reformer settings card, the class passport, the method library, a page per class and
 * per teacher, the pregnancy guide, private hire, workshops, and the pack calculator (Plus).
 * @param {any} site @param {Set<string>} classIds @param {Report} err @param {((rel: string) => boolean)|undefined} exists
 */
function checkSignatureExtras(site, classIds, err, exists) {
  const on = (/** @type {string} */ id) => Array.isArray(site.features) && site.features.includes(id);
  if (site.machine !== undefined) checkMachine(site.machine, err);
  if (site.passport !== undefined) checkPassport(site.passport, site.mode, err);
  if (site.method !== undefined) checkMethod(site.method, classIds, err, exists);
  if (on("class-pages")) checkClassPages(site.classTypes, err, exists);
  if (site.teacherPages !== undefined) checkTeachers(site.teacherPages, site.staff, err);
  if (site.prenatal !== undefined) checkPrenatal(site.prenatal, classIds, err, exists);
  if (site.studioHire !== undefined) checkHire(site.studioHire, err, exists);
  if (site.workshops !== undefined) checkWorkshops(site.workshops, site.mode, err, exists);
  if (site.packs !== undefined) checkPacks(site.packs, err);
}

/** @param {any} m @param {Report} err */
function checkMachine(m, err) {
  onlyKeys(m, ["springs", "maxPerSpring", "footbar", "headrest", "straps", "gear", "message"], "machine", err);
  if (!Array.isArray(m?.springs) || m.springs.length < 1 || m.springs.length > 6) err("machine.springs", "the studio's springs, heaviest first: [{ id, name }], e.g. { id: \"red\", name: \"Red (heavy)\" }");
  else { ids(err, "machine.springs", m.springs); m.springs.forEach((/** @type {any} */ x, /** @type {number} */ i) => { onlyKeys(x, ["id", "name"], `machine.springs[${i}]`, err); text(err, `machine.springs[${i}].name`, x?.name); }); }
  for (const [k, hi] of [["maxPerSpring", 6], ["footbar", 8], ["gear", 6]]) if (!Number.isInteger(m?.[k]) || m[k] < 1 || m[k] > Number(hi)) err(`machine.${k}`, `a whole number, 1–${hi}`);
  for (const k of ["headrest", "straps"]) if (!Array.isArray(m?.[k]) || m[k].length < 2 || m[k].some((/** @type {any} */ x) => !/^[a-z0-9-]{1,20}$/.test(x))) err(`machine.${k}`, "two or more short words, e.g. [\"up\", \"flat\", \"down\"]");
  text(err, "machine.message", m?.message);
}

/** A live source: the studio's published sheet, or simulated data on a demo only. @param {any} p @param {string} at @param {string} mode @param {Report} err */
function sheetSource(p, at, mode, err) {
  if (!["sheet", "simulated"].includes(p?.source)) err(`${at}.source`, 'must be "sheet" or "simulated"');
  if (p?.source === "simulated" && mode === "client") err(`${at}.source`, "simulated data is for demos only; client sites read the studio's Google Sheet");
  if (p?.source === "sheet" && !/^https:\/\/docs\.google\.com\/spreadsheets\/.+output=csv/.test(p?.csvUrl ?? "")) err(`${at}.csvUrl`, "the studio's sheet published as CSV (File → Share → Publish to web → CSV)");
}

/** @param {any} p @param {string} mode @param {Report} err */
function checkPassport(p, mode, err) {
  onlyKeys(p, ["source", "csvUrl", "staleAfterHours", "milestones", "example"], "passport", err);
  sheetSource(p, "passport", mode, err);
  if (p?.staleAfterHours !== undefined && (!Number.isInteger(p.staleAfterHours) || p.staleAfterHours < 1 || p.staleAfterHours > 168)) err("passport.staleAfterHours", "whole hours, 1–168");
  if (!Array.isArray(p?.milestones) || p.milestones.some((/** @type {any} */ n) => !Number.isInteger(n) || n < 1 || n > 5000)) err("passport.milestones", "the studio's milestones in classes, e.g. [25, 50, 100]");
  if (p?.example !== undefined && mode !== "demo") err("passport.example", "an example code is only for demo sites");
  if (p?.example !== undefined && !/^[A-Z0-9]{8,12}$/.test(p.example)) err("passport.example", "8–12 capital letters and digits");
}

/** @param {any} m @param {Set<string>} classIds @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkMethod(m, classIds, err, exists) {
  onlyKeys(m, ["kicker", "title", "intro", "items"], "method", err);
  text(err, "method.title", m?.title);
  if (!Array.isArray(m?.items) || m.items.length < 2 || m.items.length > 24) { err("method.items", "two to 24 exercises: { id, name, works, springs, easier, harder, classes, photo, text }"); return; }
  ids(err, "method.items", m.items);
  m.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `method.items[${i}]`;
    onlyKeys(x, ["id", "name", "line", "text", "works", "springs", "easier", "harder", "classes", "photo"], at, err);
    for (const k of ["name", "line", "text", "works", "springs", "easier", "harder"]) text(err, `${at}.${k}`, x?.[k]);
    if (!Array.isArray(x?.classes) || !x.classes.length || x.classes.some((/** @type {any} */ c) => !classIds.has(c))) err(`${at}.classes`, "the class ids where it comes up, from classTypes");
    photo(err, `${at}.photo`, x?.photo, exists);
  });
}

/** Each class's own page needs its photo, who it's for and what happens. @param {any} c @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkClassPages(c, err, exists) {
  (c?.items ?? []).forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `classTypes.items[${i}]`;
    text(err, `${at}.who`, x?.who);
    if (!Array.isArray(x?.expect) || x.expect.length < 2 || x.expect.some((/** @type {any} */ s) => !isStr(s))) err(`${at}.expect`, "what happens, two or more short lines");
    photo(err, `${at}.photo`, x?.photo, exists);
  });
}

/** @param {any} t @param {any} staff @param {Report} err */
function checkTeachers(t, staff, err) {
  onlyKeys(t, ["items"], "teacherPages", err);
  const names = new Set((Array.isArray(staff) ? staff : []).map((/** @type {any} */ s) => s?.name));
  if (!Array.isArray(t?.items) || !t.items.length) { err("teacherPages.items", "one per teacher: { id, name (as in staff), training, line }"); return; }
  ids(err, "teacherPages.items", t.items);
  t.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `teacherPages.items[${i}]`;
    onlyKeys(x, ["id", "name", "line", "training", "private"], at, err);
    if (!names.has(x?.name)) err(`${at}.name`, "a teacher's name exactly as in staff");
    text(err, `${at}.line`, x?.line);
    if (!Array.isArray(x?.training) || !x.training.length || x.training.some((/** @type {any} */ s) => !isStr(s))) err(`${at}.training`, "their training, in their own words, as short lines");
    if (x?.private !== undefined && typeof x.private !== "boolean") err(`${at}.private`, "true if they teach private sessions");
  });
}

/** @param {any} p @param {Set<string>} classIds @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkPrenatal(p, classIds, err, exists) {
  onlyKeys(p, ["kicker", "title", "intro", "stages", "goAhead", "message", "photo"], "prenatal", err);
  for (const k of ["title", "goAhead", "message"]) text(err, `prenatal.${k}`, p?.[k]);
  if (p?.photo !== undefined) photo(err, "prenatal.photo", p.photo, exists);
  if (!Array.isArray(p?.stages) || p.stages.length < 2) { err("prenatal.stages", "two or more: { when, class, text }"); return; }
  p.stages.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    onlyKeys(x, ["when", "class", "text"], `prenatal.stages[${i}]`, err);
    text(err, `prenatal.stages[${i}].when`, x?.when); text(err, `prenatal.stages[${i}].text`, x?.text);
    if (x?.class !== undefined && !classIds.has(x.class)) err(`prenatal.stages[${i}].class`, "a class id from classTypes, or leave out");
  });
}

/** @param {any} h @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkHire(h, err, exists) {
  onlyKeys(h, ["kicker", "title", "intro", "kinds", "includes", "message", "maxPeople", "photo"], "studioHire", err);
  for (const k of ["title", "message"]) text(err, `studioHire.${k}`, h?.[k]);
  if (h?.photo !== undefined) photo(err, "studioHire.photo", h.photo, exists);
  if (!Number.isInteger(h?.maxPeople) || h.maxPeople < 1 || h.maxPeople > 100) err("studioHire.maxPeople", "the most people at once, from the studio");
  if (!Array.isArray(h?.includes) || !h.includes.length || h.includes.some((/** @type {any} */ s) => !isStr(s))) err("studioHire.includes", "what's included, as short lines");
  if (!Array.isArray(h?.kinds) || !h.kinds.length || h.kinds.length > 4) { err("studioHire.kinds", "one to four: { id, name, text }"); return; }
  ids(err, "studioHire.kinds", h.kinds);
  h.kinds.forEach((/** @type {any} */ k, /** @type {number} */ i) => { onlyKeys(k, ["id", "name", "text"], `studioHire.kinds[${i}]`, err); text(err, `studioHire.kinds[${i}].name`, k?.name); text(err, `studioHire.kinds[${i}].text`, k?.text); });
}

/** @param {any} w @param {string} mode @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkWorkshops(w, mode, err, exists) {
  onlyKeys(w, ["kicker", "title", "intro", "items", "formUrl", "photo"], "workshops", err);
  text(err, "workshops.title", w?.title);
  formUrl(w?.formUrl, "workshops.formUrl", err);
  if (w?.photo !== undefined) photo(err, "workshops.photo", w.photo, exists);
  if (!Array.isArray(w?.items)) { err("workshops.items", "the workshops: { id, title, date, from, to, teacher?, text, price?, places?, payLink? } (an empty list is fine)"); return; }
  ids(err, "workshops.items", w.items);
  w.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `workshops.items[${i}]`;
    onlyKeys(x, ["id", "title", "date", "from", "to", "teacher", "text", "price", "places", "payLink"], at, err);
    text(err, `${at}.title`, x?.title); text(err, `${at}.text`, x?.text);
    if (!isYmd(x?.date)) err(`${at}.date`, "a real date, YYYY-MM-DD");
    if (!isTime(x?.from) || !isTime(x?.to) || x.to <= x.from) err(at, "from and to: HH:MM, ending after it starts");
    price(x?.price, `${at}.price`, err);
    if (x?.places !== undefined && (!Number.isInteger(x.places) || x.places < 1 || x.places > 100)) err(`${at}.places`, "how many places, from the studio");
    if (x?.payLink !== undefined) stripeLink(x.payLink, `${at}.payLink`, mode, err);
  });
}

/** @param {any} p @param {Report} err */
function checkPacks(p, err) {
  onlyKeys(p, ["single", "items", "memberships", "terms"], "packs", err);
  text(err, "packs.terms", p?.terms);
  price(p?.single, "packs.single", err);
  if (p?.single === undefined) err("packs.single", "the studio's price for one class");
  const list = [...(Array.isArray(p?.items) ? p.items : []), ...(Array.isArray(p?.memberships) ? p.memberships : [])];
  if (list.length < 1) err("packs", "at least one pack or membership");
  ids(err, "packs", list);
  (p?.items ?? []).forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `packs.items[${i}]`;
    onlyKeys(x, ["id", "name", "classes", "price", "months"], at, err);
    text(err, `${at}.name`, x?.name); price(x?.price, `${at}.price`, err);
    if (!Number.isInteger(x?.classes) || x.classes < 2 || x.classes > 100) err(`${at}.classes`, "how many classes, 2–100");
    if (!Number.isInteger(x?.months) || x.months < 1 || x.months > 24) err(`${at}.months`, "how many months it lasts, 1–24");
  });
  (p?.memberships ?? []).forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `packs.memberships[${i}]`;
    onlyKeys(x, ["id", "name", "monthly", "classes", "minMonths"], at, err);
    text(err, `${at}.name`, x?.name); price(x?.monthly, `${at}.monthly`, err);
    if (x?.classes !== "unlimited" && (!Number.isInteger(x?.classes) || x.classes < 1 || x.classes > 60)) err(`${at}.classes`, 'classes a month, or "unlimited"');
    if (x?.minMonths !== undefined && (!Number.isInteger(x.minMonths) || x.minMonths < 1 || x.minMonths > 24)) err(`${at}.minMonths`, "the minimum term in months");
  });
}

/** @param {any} h @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkHeroPhotos(h, err, exists) {
  if (h?.photo === undefined) err("hero.photo", "the hero photograph: { src, width, height, alt }");
  else photo(err, "hero.photo", h.photo, exists);
  if (h?.phonePhoto !== undefined) photo(err, "hero.phonePhoto", h.phonePhoto, exists);
}

/** The first class, the class finder and the waitlist. @param {any} site @param {Set<string>} classIds @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkFirstSteps(site, classIds, err, exists) {
  if (site.firstClass !== undefined) checkFirst(site.firstClass, classIds, err, exists);
  if (site.classFinder !== undefined) checkFinder(site.classFinder, classIds, err);
  if (site.waitlist !== undefined) {
    onlyKeys(site.waitlist, ["message"], "waitlist", err);
    if (!/\{class\}/.test(site.waitlist?.message ?? "") || !/\{time\}/.test(site.waitlist?.message ?? "")) err("waitlist.message", "the WhatsApp message, with {class}, {day} and {time} where they go");
  }
}

/** @param {any} f @param {Set<string>} classIds @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkFirst(f, classIds, err, exists) {
  onlyKeys(f, ["class", "steps", "photo"], "firstClass", err);
  if (!classIds.has(f?.class)) err("firstClass.class", "the class id a first-timer should book, from classTypes");
  if (!Array.isArray(f?.steps) || f.steps.length < 2 || f.steps.length > 6) err("firstClass.steps", "two to six steps: { title, text }");
  else f.steps.forEach((/** @type {any} */ s, /** @type {number} */ i) => { onlyKeys(s, ["title", "text"], `firstClass.steps[${i}]`, err); text(err, `firstClass.steps[${i}].title`, s?.title); text(err, `firstClass.steps[${i}].text`, s?.text); });
  if (f?.photo !== undefined) photo(err, "firstClass.photo", f.photo, exists);
}

/** @param {any} m @param {Set<string>} classIds @param {Report} err */
function checkFinder(m, classIds, err) {
  onlyKeys(m, ["new", "slower", "steady", "faster", "pregnancy"], "classFinder", err);
  for (const k of ["new", "slower", "steady", "faster"]) if (!classIds.has(m?.[k])) err(`classFinder.${k}`, "a class id from classTypes");
  if (m?.pregnancy !== undefined && !classIds.has(m.pregnancy)) err("classFinder.pregnancy", "a class id from classTypes, or leave out if the studio has no pregnancy class");
}

/** @param {any} c @param {string} mode @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkIntro(c, mode, err, exists) {
  onlyKeys(c, ["text", "classes", "days", "price", "payLink", "note", "photo"], "introCard", err);
  text(err, "introCard.text", c?.text);
  if (c?.photo !== undefined) photo(err, "introCard.photo", c.photo, exists);
  if (!Number.isInteger(c?.classes) || c.classes < 1 || c.classes > 10) err("introCard.classes", "how many classes the card holds, 1–10");
  if (c?.days !== undefined && (!Number.isInteger(c.days) || c.days < 1 || c.days > 365)) err("introCard.days", "how many days the card lasts, a whole number");
  price(c?.price, "introCard.price", err);
  stripeLink(c?.payLink, "introCard.payLink", mode, err);
}

/** @param {any} c @param {Report} err @returns {Set<string>} */
function checkClassTypes(c, err) {
  if (c === undefined) return new Set();
  onlyKeys(c, ["items"], "classTypes", err);
  if (!Array.isArray(c?.items) || !c.items.length) { err("classTypes.items", "the studio's classes: { id, name, minutes, level?, text }"); return new Set(); }
  const seen = ids(err, "classTypes.items", c.items);
  c.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `classTypes.items[${i}]`;
    onlyKeys(x, ["id", "name", "minutes", "level", "text", "who", "expect", "photo"], at, err);
    text(err, `${at}.name`, x?.name); text(err, `${at}.text`, x?.text);
    if (!Number.isInteger(x?.minutes) || x.minutes < 10 || x.minutes > 180) err(`${at}.minutes`, "the class length in minutes, e.g. 50");
  });
  return seen;
}

/** @param {any} t @param {Set<string>} classIds @param {Report} err */
function checkTimetable(t, classIds, err) {
  onlyKeys(t, ["reformers", "weekly", "note"], "timetable", err);
  if (!Number.isInteger(t?.reformers) || t.reformers < 1 || t.reformers > 30) err("timetable.reformers", "how many reformers in the room, 1–30");
  if (!isObj(t?.weekly)) { err("timetable.weekly", "{ mon: [{ time, class, teacher? }], … }"); return; }
  onlyKeys(t.weekly, DAYS, "timetable.weekly", err);
  let total = 0;
  for (const d of DAYS) {
    const list = t.weekly[d] ?? [];
    if (!Array.isArray(list)) { err(`timetable.weekly.${d}`, "a list of classes, or []"); continue; }
    const times = new Set();
    list.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
      const at = `timetable.weekly.${d}[${i}]`;
      onlyKeys(s, ["time", "class", "teacher"], at, err);
      if (!isTime(s?.time)) err(`${at}.time`, "24-hour time, HH:MM");
      else if (times.has(s.time)) err(`${at}.time`, `two classes at ${s.time}; one room runs one class at a time`);
      times.add(s?.time);
      if (!classIds.has(s?.class)) err(`${at}.class`, "a class id from classTypes");
      if (s?.teacher !== undefined) text(err, `${at}.teacher`, s.teacher);
      total++;
    });
  }
  if (!total) err("timetable.weekly", "at least one class in the week");
}

/** @param {any} p @param {string} mode @param {Report} err */
function checkPlaces(p, mode, err) {
  onlyKeys(p, ["source", "csvUrl", "staleAfterMinutes"], "places", err);
  if (!["sheet", "simulated"].includes(p?.source)) err("places.source", 'must be "sheet" or "simulated"');
  if (p?.source === "simulated" && mode === "client") err("places.source", "simulated places are for demos only; client sites read the studio's Google Sheet");
  if (p?.source === "sheet" && !/^https:\/\/docs\.google\.com\/spreadsheets\/.+output=csv/.test(p?.csvUrl ?? "")) err("places.csvUrl", "the studio's sheet published as CSV (File → Share → Publish to web → CSV)");
  if (p?.staleAfterMinutes !== undefined && (!Number.isInteger(p.staleAfterMinutes) || p.staleAfterMinutes < 10 || p.staleAfterMinutes > 1440)) err("places.staleAfterMinutes", "10–1440 minutes");
}

/** @param {any} g @param {string} mode @param {Report} err */
function checkGifts(g, mode, err) {
  onlyKeys(g, ["items", "message", "howItWorks"], "giftCards", err);
  text(err, "giftCards.message", g?.message); text(err, "giftCards.howItWorks", g?.howItWorks);
  if (!Array.isArray(g?.items) || !g.items.length || g.items.length > 4) { err("giftCards.items", "one to four cards: { id, name, text, price?, payLink }"); return; }
  ids(err, "giftCards.items", g.items);
  g.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `giftCards.items[${i}]`;
    onlyKeys(x, ["id", "name", "text", "price", "payLink"], at, err);
    text(err, `${at}.name`, x?.name); text(err, `${at}.text`, x?.text);
    price(x?.price, `${at}.price`, err);
    stripeLink(x?.payLink, `${at}.payLink`, mode, err);
  });
}

/** @param {any} p @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkPrivate(p, err, exists) {
  onlyKeys(p, [...HEAD, "kinds", "assessment", "message", "photo", "photo2"], "privatePage", err);
  text(err, "privatePage.title", p?.title); text(err, "privatePage.assessment", p?.assessment); text(err, "privatePage.message", p?.message);
  if (!Array.isArray(p?.kinds) || !p.kinds.length || p.kinds.length > 4) err("privatePage.kinds", "one to four: { id, name, minutes, text }");
  else {
    ids(err, "privatePage.kinds", p.kinds);
    p.kinds.forEach((/** @type {any} */ k, /** @type {number} */ i) => {
      onlyKeys(k, ["id", "name", "minutes", "text"], `privatePage.kinds[${i}]`, err);
      text(err, `privatePage.kinds[${i}].name`, k?.name); text(err, `privatePage.kinds[${i}].text`, k?.text);
      if (!Number.isInteger(k?.minutes) || k.minutes < 15 || k.minutes > 180) err(`privatePage.kinds[${i}].minutes`, "length in minutes");
    });
  }
  if (p?.photo !== undefined) photo(err, "privatePage.photo", p.photo, exists);
  if (p?.photo2 !== undefined) photo(err, "privatePage.photo2", p.photo2, exists);
}

/** @param {any} r @param {string} mode @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkRetreats(r, mode, err, exists) {
  onlyKeys(r, [...HEAD, "items", "formUrl", "photo"], "retreats", err);
  text(err, "retreats.title", r?.title);
  formUrl(r?.formUrl, "retreats.formUrl", err);
  if (r?.photo !== undefined) photo(err, "retreats.photo", r.photo, exists);
  if (!Array.isArray(r?.items)) { err("retreats.items", "the retreats: { id, name, place, from, to, text, includes, price?, depositLink? } (an empty list is fine)"); return; }
  ids(err, "retreats.items", r.items);
  r.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `retreats.items[${i}]`;
    onlyKeys(x, ["id", "name", "place", "from", "to", "text", "includes", "price", "depositLink", "places", "placesLeft", "placesChecked", "balanceDue", "days", "rooms", "photo"], at, err);
    checkRetreatPage(x, at, err, exists);
    for (const k of ["name", "place", "text"]) text(err, `${at}.${k}`, x?.[k]);
    if (!isYmd(x?.from) || !isYmd(x?.to)) err(at, "from and to: real dates, YYYY-MM-DD");
    else if (x.to < x.from) err(`${at}.to`, "ends before it starts");
    if (!Array.isArray(x?.includes) || !x.includes.length || x.includes.some((/** @type {any} */ s) => !isStr(s))) err(`${at}.includes`, "what's included, as a list of short lines");
    price(x?.price, `${at}.price`, err);
    if (x?.places !== undefined && (!Number.isInteger(x.places) || x.places < 1 || x.places > 100)) err(`${at}.places`, "how many places in all, from the studio");
    if (x?.depositLink !== undefined) stripeLink(x.depositLink, `${at}.depositLink`, mode, err);
  });
}

/** A retreat's own page: the days, the rooms, places left as at a date, the balance date. @param {any} x @param {string} at @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkRetreatPage(x, at, err, exists) {
  if (x?.photo !== undefined) photo(err, `${at}.photo`, x.photo, exists);
  if (x?.balanceDue !== undefined && (!isYmd(x.balanceDue) || (isYmd(x?.from) && x.balanceDue >= x.from))) err(`${at}.balanceDue`, "a real date before the retreat starts");
  if (x?.placesLeft !== undefined) {
    if (!Number.isInteger(x.placesLeft) || x.placesLeft < 0 || (Number.isInteger(x?.places) && x.placesLeft > x.places)) err(`${at}.placesLeft`, "places still free, no more than places");
    if (!isYmd(x?.placesChecked)) err(`${at}.placesChecked`, "the date the studio last counted the places, YYYY-MM-DD");
  }
  checkRetreatLists(x, at, err);
}

/** @param {any} x @param {string} at @param {Report} err */
function checkRetreatLists(x, at, err) {
  const badDay = (/** @type {any} */ d) => !isStr(d?.title) || !isStr(d?.text);
  const badRoom = (/** @type {any} */ r) => !isStr(r?.name) || !isStr(r?.text) || (r.price !== undefined && (!Number.isInteger(r.price) || r.price < 1));
  if (x?.days !== undefined && (!Array.isArray(x.days) || x.days.some(badDay))) err(`${at}.days`, "day by day: [{ title, text }]");
  if (x?.rooms !== undefined && (!Array.isArray(x.rooms) || x.rooms.some(badRoom))) err(`${at}.rooms`, "the rooms: [{ name, text, price? }] with the studio's own prices");
}

/** @param {any} c @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkClip(c, err, exists) {
  onlyKeys(c, ["video", "poster", "captions", "credit"], "reformerClip", err);
  if (!isObj(c?.video)) err("reformerClip.video", "{ src (an .mp4), width, height, seconds }");
  else {
    onlyKeys(c.video, ["src", "width", "height", "seconds"], "reformerClip.video", err);
    if (!/\.mp4$/.test(c.video.src ?? "")) err("reformerClip.video.src", "an .mp4 file");
    else if (exists && !exists(c.video.src)) err("reformerClip.video.src", `file not found: ${c.video.src}`);
    if (!Number.isInteger(c.video.width) || !Number.isInteger(c.video.height)) err("reformerClip.video", "width and height in pixels");
    if (typeof c.video.seconds !== "number" || c.video.seconds <= 0 || c.video.seconds > 120) err("reformerClip.video.seconds", "the clip's length in seconds (a short clip, up to 120)");
  }
  photo(err, "reformerClip.poster", c?.poster, exists);
  if (!Array.isArray(c?.captions) || c.captions.length < 2) { err("reformerClip.captions", "two or more: { from, to, text } in seconds"); return; }
  let last = -1;
  c.captions.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `reformerClip.captions[${i}]`;
    onlyKeys(x, ["from", "to", "text"], at, err);
    text(err, `${at}.text`, x?.text);
    if (typeof x?.from !== "number" || typeof x?.to !== "number" || x.to <= x.from) err(at, "from and to in seconds, to after from");
    else if (x.from < last) err(at, "captions in time order, not overlapping");
    else if (typeof c.video?.seconds === "number" && x.to > c.video.seconds + 0.01) err(`${at}.to`, "after the clip ends");
    if (typeof x?.to === "number") last = x.to;
  });
  text(err, "reformerClip.credit", c?.credit);
}
