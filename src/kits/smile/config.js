// @ts-check
/**
 * Validation for the smile kit (teeth whitening and aesthetic dental studios). Every price, timing and clinical word
 * is the studio's own; these checks make sure the site keeps the UK rules (src/kits/smile/lib/gdc.js):
 * every clinician registered and named with role, qualification, country and GDC number; whitening only by someone
 * allowed to whiten; no shade, permanence, guarantee, painless or laser promises, and no "specialist" without a GDC
 * specialist list; a gallery photo only with recorded consent; a complaints procedure.
 */
import { ROLES, STATUS, claimProblem, isGdcNumber } from "./lib/gdc.js";
import { minutesOf } from "./lib/smile.js";
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

/** @param {Report} err @param {string} path @param {any} list @param {string} what @returns {list is any[]} */
function list(err, path, list, what) {
  if (Array.isArray(list) && list.length) return true;
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

const PHOTO = ["src", "width", "height", "alt"];
/** @param {Report} err @param {string} path @param {any} p @param {Exists} exists @param {string[]} [extra] */
function photo(err, path, p, exists, extra = []) {
  if (!isObj(p)) { err(path, "a photo: { src, width, height, alt }"); return; }
  onlyKeys(p, [...PHOTO, ...extra], path, err);
  text(err, `${path}.alt`, p.alt);
  if (!Number.isInteger(p.width) || !Number.isInteger(p.height)) err(path, "width and height in pixels");
  if (!isStr(p.src)) err(`${path}.src`, "required");
  else if (exists && !exists(p.src)) err(`${path}.src`, `file not found: ${p.src}`);
}

/** Headed paragraphs in the studio's (or the clinician's) words. @param {Report} err @param {string} path @param {any} s */
function sections(err, path, s) {
  if (!list(err, path, s, "{ heading, text }")) return;
  s.forEach((/** @type {any} */ x, /** @type {number} */ i) => { onlyKeys(x, ["heading", "text"], `${path}[${i}]`, err); text(err, `${path}[${i}].heading`, x?.heading); text(err, `${path}[${i}].text`, x?.text); });
}

/** @param {Report} err @param {string} path @param {any} o */
function pageHead(err, path, o) { if (!isObj(o)) { err(path, "{ title, intro }"); return false; } text(err, `${path}.title`, o.title); return true; }

/** @param {any} site @param {Report} err @param {Exists} [exists] */
export function checkSmile(site, err, exists) {
  if (site.kit !== "smile") return;
  if (!site.features?.includes("smile-patient-info")) err("features", '"smile-patient-info" is required on every dental site: NHS or private, the complaints procedure, the Dental Complaints Service and the GDC (GDC guidance on advertising)');
  if (site.look === "booth" && site.hero?.strip === undefined) err("hero.strip", "the Booth look's hero is a photo-booth strip: { label, frames: [four photographs] }");
  checkStrip(site.hero?.strip, err, exists);
  const people = checkClinicians(site.clinicians, site.mode, err, exists);
  const tx = checkTreatments(site.treatments, people, err);
  if (site.patientInfo !== undefined) checkPatientInfo(site.patientInfo, err);
  if (site.consultation !== undefined) checkConsultation(site.consultation, err);
  if (site.chooser !== undefined) checkChooser(site.chooser, people, err, exists);
  if (site.whiteningPage !== undefined) checkWhitening(site.whiteningPage, people, err);
  if (site.journeyPage !== undefined) { onlyKeys(site.journeyPage, ["title", "intro"], "journeyPage", err); pageHead(err, "journeyPage", site.journeyPage); }
  if (site.aftercare !== undefined) checkAftercare(site.aftercare, err);
  if (site.smiles !== undefined) checkSmiles(site.smiles, tx, people, site.mode, err, exists);
  if (site.wedding !== undefined) checkWedding(site.wedding, err);
  if (site.journal !== undefined) checkJournal(site.journal, people, err);
  if (site.studio !== undefined) checkStudio(site.studio, err, exists);
  if (site.arrival !== undefined) checkArrival(site.arrival, err, exists);
  claims(site, err);
}

/** The booth strip: four photographs, each with where the face sits. @param {any} s @param {Report} err @param {Exists} exists */
function checkStrip(s, err, exists) {
  if (s === undefined) return;
  if (!isObj(s)) { err("hero.strip", "{ label, frames: [4 photos] }"); return; }
  onlyKeys(s, ["label", "frames", "note", "models"], "hero.strip", err);
  if (s.models !== undefined && typeof s.models !== "boolean") err("hero.strip.models", "true when the photographs are of models, not the studio's patients");
  text(err, "hero.strip.label", s.label);
  if (!Array.isArray(s.frames) || s.frames.length !== 4) { err("hero.strip.frames", "exactly four photographs, like a photo booth"); return; }
  s.frames.forEach((/** @type {any} */ f, /** @type {number} */ i) => {
    photo(err, `hero.strip.frames[${i}]`, f, exists, ["focus"]);
    if (f?.focus !== undefined && !/^\d{1,3}% \d{1,3}%$/.test(f.focus)) err(`hero.strip.frames[${i}].focus`, 'where the smile sits, e.g. "50% 40%"');
  });
}

/**
 * Every clinician the site names, as the GDC asks: name, registered role, qualification and the country it was
 * gained in, and GDC number (demo sites use 000000, which belongs to no one; client sites never do).
 * @param {any} c @param {string} mode @param {Report} err @param {Exists} exists @returns {Map<string, any>}
 */
function checkClinicians(c, mode, err, exists) {
  /** @type {Map<string, any>} */ const out = new Map();
  if (c === undefined) return out;
  if (!isObj(c) || !list(err, "clinicians.items", c.items, "clinician")) return out;
  onlyKeys(c, ["items"], "clinicians", err);
  ids(err, "clinicians.items", c.items);
  c.items.forEach((/** @type {any} */ p, /** @type {number} */ i) => {
    const at = `clinicians.items[${i}]`;
    onlyKeys(p, ["id", "name", "role", "qualification", "country", "gdc", "specialist", "interest", "prescribedBy", "lead", "bio", "photo"], at, err);
    for (const k of ["name", "qualification", "country"]) text(err, `${at}.${k}`, p?.[k]);
    if (!(p?.role in ROLES)) err(`${at}.role`, `one of ${Object.keys(ROLES).join(", ")}`);
    if (!isGdcNumber(p?.gdc)) err(`${at}.gdc`, "the GDC registration number, digits only, as a string");
    else if (mode === "demo" && !/^0+$/.test(p.gdc)) err(`${at}.gdc`, 'a demo uses "000000", a number that belongs to no one');
    else if (mode !== "demo" && /^0+$/.test(p.gdc)) err(`${at}.gdc`, "a placeholder; use the clinician's own GDC number");
    if (p?.specialist !== undefined && !isStr(p.specialist)) err(`${at}.specialist`, "the GDC specialist list they are on, e.g. \"Prosthodontics\"");
    if (p?.interest !== undefined && !isStr(p.interest)) err(`${at}.interest`, "e.g. \"special interest in whitening\"");
    if (p?.photo !== undefined) photo(err, `${at}.photo`, p.photo, exists);
    if (p?.id) out.set(p.id, p);
  });
  c.items.forEach((/** @type {any} */ p, /** @type {number} */ i) => {
    if (p?.prescribedBy === undefined) return;
    if (out.get(p.prescribedBy)?.role !== "dentist") err(`clinicians.items[${i}].prescribedBy`, "the id of the dentist who prescribes their whitening");
  });
  return out;
}

const VISIT = ["label", "minutes", "after", "note"];
/** @param {any} t @param {Map<string, any>} people @param {Report} err @returns {Set<string>} */
function checkTreatments(t, people, err) {
  /** @type {Set<string>} */ const out = new Set();
  if (t === undefined) return out;
  if (!isObj(t) || !list(err, "treatments.items", t.items, "treatment")) return out;
  onlyKeys(t, ["items"], "treatments", err);
  ids(err, "treatments.items", t.items);
  t.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `treatments.items[${i}]`;
    onlyKeys(x, ["id", "name", "line", "price", "by", "whitening", "visits", "page"], at, err);
    text(err, `${at}.name`, x?.name);
    text(err, `${at}.line`, x?.line);
    const p = x?.price;
    if (!isObj(p) || (p.from === undefined) === (p.fixed === undefined)) err(`${at}.price`, '{ from: 395 } or { fixed: 95 }, whole pounds, with an optional unit ("a tooth")');
    else {
      onlyKeys(p, ["from", "fixed", "unit"], `${at}.price`, err);
      const n = p.from ?? p.fixed;
      if (!Number.isInteger(n) || n < 0) err(`${at}.price`, "the studio's price in whole pounds");
      if (p.unit !== undefined && !isStr(p.unit)) err(`${at}.price.unit`, 'e.g. "a tooth"');
    }
    if (!Array.isArray(x?.by) || !x.by.length) err(`${at}.by`, "the ids of the clinicians who carry it out");
    else x.by.forEach((/** @type {string} */ id, /** @type {number} */ j) => {
      const who = people.get(id);
      if (!who) err(`${at}.by[${j}]`, `one of the clinicians' ids (${[...people.keys()].join(", ") || "add clinicians first"})`);
      else if (x.whitening === true && !mayWhiten(who)) err(`${at}.by[${j}]`, `${who.name} can't carry out whitening: only a dentist, or a hygienist, therapist or clinical dental technician on a dentist's prescription (set prescribedBy)`);
    });
    if (x?.whitening !== undefined && typeof x.whitening !== "boolean") err(`${at}.whitening`, "true for tooth whitening");
    if (list(err, `${at}.visits`, x?.visits, "visit: { label, minutes }")) x.visits.forEach((/** @type {any} */ v, /** @type {number} */ j) => {
      onlyKeys(v, VISIT, `${at}.visits[${j}]`, err);
      text(err, `${at}.visits[${j}].label`, v?.label);
      if (!Number.isInteger(v?.minutes) || v.minutes < 5 || v.minutes > 480) err(`${at}.visits[${j}].minutes`, "how long the visit takes, in minutes");
      if (j === 0 && v?.after !== undefined) err(`${at}.visits[0].after`, "the first visit comes after nothing; leave it out");
      if (j > 0 && (!Number.isInteger(v?.after) || v.after < 0 || v.after > 52)) err(`${at}.visits[${j}].after`, "weeks after the visit before (0 for the same week)");
    });
    if (x?.page !== undefined) { onlyKeys(x.page, ["intro", "sections"], `${at}.page`, err); text(err, `${at}.page.intro`, x.page?.intro); sections(err, `${at}.page.sections`, x.page?.sections); }
    if (x?.id) out.add(x.id);
  });
  return out;
}

/** @param {any} p */
const mayWhiten = (p) => ROLES[p.role]?.whitens === "yes" || (ROLES[p.role]?.whitens === "prescription" && isStr(p.prescribedBy));

/** The patient information and complaints page. @param {any} p @param {Report} err */
function checkPatientInfo(p, err) {
  if (!pageHead(err, "patientInfo", p)) return;
  onlyKeys(p, ["title", "intro", "status", "complaints", "notes"], "patientInfo", err);
  if (!(p.status in STATUS)) err("patientInfo.status", `"private", "nhs" or "mixed" (the GDC asks every website to say)`);
  const c = p.complaints;
  if (!isObj(c)) err("patientInfo.complaints", "{ steps: [the studio's own procedure], contact, replyDays }");
  else {
    onlyKeys(c, ["steps", "contact", "replyDays"], "patientInfo.complaints", err);
    if (list(err, "patientInfo.complaints.steps", c.steps, "step of the studio's procedure")) c.steps.forEach((/** @type {any} */ s, /** @type {number} */ i) => text(err, `patientInfo.complaints.steps[${i}]`, s));
    text(err, "patientInfo.complaints.contact", c.contact);
    if (!Number.isInteger(c.replyDays) || c.replyDays < 1 || c.replyDays > 28) err("patientInfo.complaints.replyDays", "working days to acknowledge a complaint, 1–28");
  }
  if (p.notes !== undefined) sections(err, "patientInfo.notes", p.notes);
}

/** @param {any} c @param {Report} err */
function checkConsultation(c, err) {
  if (!pageHead(err, "consultation", c)) return;
  onlyKeys(c, ["title", "intro", "facts", "bring", "steps", "message"], "consultation", err);
  text(err, "consultation.message", c.message);
  if (list(err, "consultation.facts", c.facts, "fact: { label, value }")) c.facts.forEach((/** @type {any} */ f, /** @type {number} */ i) => { onlyKeys(f, ["label", "value"], `consultation.facts[${i}]`, err); text(err, `consultation.facts[${i}].label`, f?.label); text(err, `consultation.facts[${i}].value`, f?.value); });
  if (c.bring !== undefined && (!Array.isArray(c.bring) || !c.bring.every(isStr))) err("consultation.bring", "a list of things to bring");
  if (c.steps !== undefined) sections(err, "consultation.steps", c.steps);
}

/** "Tell me what you'd change": the clinician's line and the choices, each with the message it writes. @param {any} c @param {Map<string, any>} people @param {Report} err @param {Exists} exists */
function checkChooser(c, people, err, exists) {
  if (!isObj(c)) { err("chooser", "{ quote, by, options }"); return; }
  onlyKeys(c, ["quote", "by", "options", "note", "photo"], "chooser", err);
  if (c.photo !== undefined) photo(err, "chooser.photo", c.photo, exists);
  text(err, "chooser.quote", c.quote);
  if (!people.has(c.by)) err("chooser.by", "the id of the clinician whose words the quote is");
  if (list(err, "chooser.options", c.options, "option: { label, message }")) {
    if (c.options.length > 6) err("chooser.options", "six choices at most");
    c.options.forEach((/** @type {any} */ o, /** @type {number} */ i) => { onlyKeys(o, ["label", "message"], `chooser.options[${i}]`, err); text(err, `chooser.options[${i}].label`, o?.label); text(err, `chooser.options[${i}].message`, o?.message); });
  }
}

/** @param {any} w @param {Map<string, any>} people @param {Report} err */
function checkWhitening(w, people, err) {
  if (!pageHead(err, "whiteningPage", w)) return;
  onlyKeys(w, ["title", "intro", "by", "ways", "sensitivity", "crowns"], "whiteningPage", err);
  if (!people.has(w.by)) err("whiteningPage.by", "the id of the clinician who wrote it");
  sections(err, "whiteningPage.ways", w.ways);
  text(err, "whiteningPage.sensitivity", w.sensitivity);
  if (w.crowns !== undefined) text(err, "whiteningPage.crowns", w.crowns);
}

/** @param {any} a @param {Report} err */
function checkAftercare(a, err) {
  if (!pageHead(err, "aftercare", a)) return;
  onlyKeys(a, ["title", "intro", "sections", "urgent", "reminders"], "aftercare", err);
  sections(err, "aftercare.sections", a.sections);
  text(err, "aftercare.urgent", a.urgent);
  if (a.reminders !== undefined && list(err, "aftercare.reminders", a.reminders, "reminder")) {
    ids(err, "aftercare.reminders", a.reminders);
    a.reminders.forEach((/** @type {any} */ r, /** @type {number} */ i) => {
      onlyKeys(r, ["id", "label", "months", "note"], `aftercare.reminders[${i}]`, err);
      text(err, `aftercare.reminders[${i}].label`, r?.label);
      if (!Number.isInteger(r?.months) || r.months < 1 || r.months > 36) err(`aftercare.reminders[${i}].months`, "months after treatment, 1–36");
    });
  }
}

/**
 * The smile gallery. A client's photo is the studio's own patient, published only with consent the studio has
 * recorded (the date and its own reference, never shown), never retouched, a before only of the same person. A demo
 * may use stock photographs of models instead, labelled so, with no before.
 * @param {any} s @param {Set<string>} tx @param {Map<string, any>} people @param {string} mode @param {Report} err @param {Exists} exists
 */
function checkSmiles(s, tx, people, mode, err, exists) {
  if (!pageHead(err, "smiles", s)) return;
  onlyKeys(s, ["title", "intro", "items"], "smiles", err);
  if (!list(err, "smiles.items", s.items, "photograph")) return;
  ids(err, "smiles.items", s.items);
  s.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `smiles.items[${i}]`;
    onlyKeys(x, ["id", "photo", "before", "treatment", "by", "consent", "model", "caption"], at, err);
    photo(err, `${at}.photo`, x?.photo, exists);
    if (x?.model === true) {
      if (mode !== "demo") err(`${at}.model`, "a client's gallery shows only its own patients, with their consent");
      if (x.before !== undefined) err(`${at}.before`, "never pair photographs of two different people");
      if (x.consent !== undefined) err(`${at}.consent`, "a model photograph has no patient consent; leave it out");
      return;
    }
    if (!isObj(x?.consent) || !isYmd(x.consent.date) || !isStr(x.consent.ref)) err(`${at}.consent`, "the patient's recorded consent: { date: \"YYYY-MM-DD\", ref: the studio's own record } (never published)");
    else onlyKeys(x.consent, ["date", "ref", "retouched"], `${at}.consent`, err);
    if (x?.consent?.retouched !== false) err(`${at}.consent.retouched`, "false: the studio confirms the photographs aren't retouched (CAP advice)");
    if (!tx.has(x?.treatment)) err(`${at}.treatment`, "the id of the treatment shown");
    if (!people.has(x?.by)) err(`${at}.by`, "the id of the clinician who treated them");
    if (x?.before !== undefined) photo(err, `${at}.before`, x.before, exists);
  });
}

/** @param {any} w @param {Report} err */
function checkWedding(w, err) {
  if (!isObj(w)) { err("wedding", "{ steps, late, message }"); return; }
  onlyKeys(w, ["title", "intro", "steps", "late", "message"], "wedding", err);
  text(err, "wedding.late", w.late);
  text(err, "wedding.message", w.message);
  if (!list(err, "wedding.steps", w.steps, "step: { id, label, weeksBefore }")) return;
  ids(err, "wedding.steps", w.steps);
  w.steps.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    onlyKeys(s, ["id", "label", "weeksBefore", "note"], `wedding.steps[${i}]`, err);
    text(err, `wedding.steps[${i}].label`, s?.label);
    if (!Number.isInteger(s?.weeksBefore) || s.weeksBefore < 0 || s.weeksBefore > 52) err(`wedding.steps[${i}].weeksBefore`, "weeks before the day, 0–52, from the studio's own timings");
  });
}

/** @param {any} j @param {Map<string, any>} people @param {Report} err */
function checkJournal(j, people, err) {
  if (!pageHead(err, "journal", j)) return;
  onlyKeys(j, ["title", "intro", "items"], "journal", err);
  if (!list(err, "journal.items", j.items, "piece")) return;
  ids(err, "journal.items", j.items, "slug");
  j.items.forEach((/** @type {any} */ a, /** @type {number} */ i) => {
    const at = `journal.items[${i}]`;
    onlyKeys(a, ["slug", "title", "date", "by", "intro", "sections"], at, err);
    text(err, `${at}.title`, a?.title);
    text(err, `${at}.intro`, a?.intro);
    if (!isYmd(a?.date)) err(`${at}.date`, "the day it was written, YYYY-MM-DD");
    if (!people.has(a?.by)) err(`${at}.by`, "the id of the clinician who wrote it");
    sections(err, `${at}.sections`, a?.sections);
  });
}

/** @param {any} s @param {Report} err @param {Exists} exists */
function checkStudio(s, err, exists) {
  if (!pageHead(err, "studio", s)) return;
  onlyKeys(s, ["title", "intro", "rooms"], "studio", err);
  if (list(err, "studio.rooms", s.rooms, "room: { photo, name, text }")) s.rooms.forEach((/** @type {any} */ r, /** @type {number} */ i) => {
    onlyKeys(r, ["photo", "name", "text"], `studio.rooms[${i}]`, err);
    photo(err, `studio.rooms[${i}].photo`, r?.photo, exists);
    text(err, `studio.rooms[${i}].name`, r?.name);
  });
}

/** Arriving: the steps from the door to the chair, timed from the appointment. @param {any} a @param {Report} err @param {Exists} exists */
function checkArrival(a, err, exists) {
  if (!pageHead(err, "arrival", a)) return;
  onlyKeys(a, ["title", "intro", "times", "start", "steps", "photo"], "arrival", err);
  if (!Array.isArray(a.times) || a.times.length < 2 || a.times.some((/** @type {string} */ t) => Number.isNaN(minutesOf(t)))) err("arrival.times", 'appointment times to choose from, e.g. ["08:15", "12:40", "18:00"]');
  else if (!a.times.includes(a.start)) err("arrival.start", "one of the times, shown first");
  if (list(err, "arrival.steps", a.steps, "step: { at, text }")) a.steps.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    onlyKeys(s, ["at", "text", "note"], `arrival.steps[${i}]`, err);
    if (!Number.isInteger(s?.at) || Math.abs(s.at) > 240) err(`arrival.steps[${i}].at`, "minutes from the appointment (−5 for five minutes before)");
    text(err, `arrival.steps[${i}].text`, s?.text);
  });
  if (a.photo !== undefined) photo(err, "arrival.photo", a.photo, exists);
}

/**
 * The studio's own words never promise what CAP and the GDC say they can't, wherever they are written: every string in
 * site.json is checked (file paths, links and consent records aside). "Specialist" is allowed only in the bio and
 * interest of a clinician who is on a GDC specialist list.
 * @param {any} site @param {Report} err
 */
function claims(site, err) {
  const skip = new Set(["src", "consent", "ref", "url", "href", "image", "directionsUrl", "sameAs", "features", "id", "slug"]);
  /** @param {any} v @param {string} path @param {boolean} specialist */
  const walk = (v, path, specialist) => {
    if (typeof v === "string") { const why = claimProblem(v, { specialist }); if (why) err(path, why); }
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`, specialist));
    else if (isObj(v)) for (const [k, x] of Object.entries(v)) if (!skip.has(k)) walk(x, path ? `${path}.${k}` : k, specialist);
  };
  for (const [k, v] of Object.entries(site)) if (k !== "clinicians") walk(v, k, false);
  site.clinicians?.items?.forEach((/** @type {any} */ p, /** @type {number} */ i) => {
    if (!isObj(p)) return;
    for (const [k, v] of Object.entries(p)) if (k !== "photo" && k !== "specialist") walk(v, `clinicians.items[${i}].${k}`, (k === "bio" || k === "interest") && isStr(p.specialist));
  });
}
