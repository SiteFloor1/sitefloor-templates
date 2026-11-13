// @ts-check
/**
 * Validation for the law kit (solicitors' firms). The SRA Transparency Rules decide what must be there: the SRA number
 * and digital badge, the complaints procedure, and prices and service information for the services rule 1 lists. Every
 * fact here (prices, people, matters, insurance) is the firm's own; the checks make sure it is complete and can't
 * mislead, and that a demo can never carry a real firm's or solicitor's number.
 */
import { SRA_SERVICES, isSraNumber, isBadgeFrame } from "./lib/sra.js";
import { scenarioProblems } from "./lib/succession.js";
import { decodePack } from "./lib/pack.js";
import { bounds } from "./lib/estimate.js";
import { cleanMatterCode } from "./lib/matter.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const ID = /^[a-z0-9-]{1,40}$/;
const YM = /^\d{4}-(0[1-9]|1[0-2])$/;
const YMD = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Figures, tax results or promises, which an illustration must never carry. */
const FIGURES = /£|\d+\s?%|tax-free|no tax|save\s+\d|guarantee/i;
/** Pages the kit builds; a generated page (an area, an insight, a guide) can't take one of these names. */
const RESERVED = ["words", "when-someone-dies", "gather", "house", "your-matter", "index", "practice", "people", "pricing", "complaints", "insights", "contact", "guides", "meeting", "succession", "visit", "privacy", "404", "custom", "area", "insight", "guide"];

/** @param {Report} err @param {string} path @param {any} v */
function text(err, path, v) { if (!isStr(v)) err(path, "required text is missing"); }

/** A misspelt setting is refused, not silently ignored. @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (isObj(o)) for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}

/** @param {Report} err @param {string} path @param {any} p @param {((rel: string) => boolean)|undefined} exists */
function photo(err, path, p, exists) {
  if (!isObj(p)) { err(path, "a photo: { src, width, height, alt }"); return; }
  onlyKeys(p, ["src", "width", "height", "alt", "position"], path, err);
  text(err, `${path}.alt`, p.alt);
  if (!Number.isInteger(p.width) || !Number.isInteger(p.height)) err(path, "width and height in pixels");
  if (p.position !== undefined && !/^\d{1,3}% \d{1,3}%$/.test(p.position)) err(`${path}.position`, 'the crop\'s focus, e.g. "50% 40%"');
  if (!isStr(p.src)) err(`${path}.src`, "required");
  else if (exists && !exists(p.src)) err(`${path}.src`, `file not found: ${p.src}`);
}

/** @param {Report} err @param {string} path @param {any[]} list @param {Set<string>} [into] */
function ids(err, path, list, into) {
  const seen = new Set();
  list.forEach((x, i) => {
    if (!ID.test(x?.id ?? "")) err(`${path}[${i}].id`, "lowercase letters, numbers and dashes");
    else if (seen.has(x.id)) err(`${path}[${i}].id`, `"${x.id}" is used twice`);
    seen.add(x?.id);
    into?.add(x?.id);
  });
  return seen;
}

/**
 * An SRA number or ID on a demo is all noughts, so a fictional firm can never show a real firm's or solicitor's number;
 * a client site shows its real one. @param {any} v @param {string} path @param {string} mode @param {Report} err
 */
function sraNumber(v, path, mode, err) {
  if (!isSraNumber(v)) err(path, "the number as the SRA register shows it, digits only");
  else if (mode === "demo" && !/^0+$/.test(v)) err(path, "demo sites are fictional: use 000000 so no real firm or solicitor is named");
  else if (mode === "client" && /^0+$/.test(v)) err(path, "is the demo number; client sites need the real one from the SRA register");
}

/** @param {any} site @param {Report} err @param {((rel: string) => boolean)|undefined} [exists] */
export function checkLaw(site, err, exists) {
  if (site.kit !== "law") return;
  const on = (/** @type {string} */ id) => Array.isArray(site.features) && site.features.includes(id);
  if (!on("regulation")) err("features", '"regulation" is required on every law firm site: the SRA number and badge (SRA Transparency Rules 4.1)');
  if (!on("complaints")) err("features", '"complaints" is required on every law firm site: the complaints procedure (SRA Transparency Rules 2.1)');
  checkHero(site.hero, err, exists);
  checkRegulation(site.regulation, site.mode, err);
  const people = checkPeople(site.people, site.mode, err, exists);
  const areas = checkPractice(site.practice, people, err, exists);
  if (site.pricing !== undefined) checkPricing(site.pricing, people, err);
  checkRuleOne(site, err);
  if (site.complaints !== undefined) checkComplaints(site.complaints, err);
  if (site.firstContact !== undefined) checkFirstContact(site.firstContact, err);
  const ways = site.arrival !== undefined ? checkArrival(site.arrival, err, exists) : new Set();
  /** @type {Set<string>} */ const pages = new Set([...areas]);
  if (site.insights !== undefined) checkArticles(site.insights, "insights", people, areas, pages, err, false, exists);
  if (site.guides !== undefined) checkArticles(site.guides, "guides", people, areas, pages, err, true, exists);
  if (site.matters !== undefined) checkMatters(site.matters, areas, err);
  if (site.meetingPack !== undefined) checkMeetingPack(site.meetingPack, people, ways, site.mode, err);
  if (site.succession !== undefined) checkSuccession(site.succession, err);
  checkTools(site, people, areas, err, exists);
  for (const id of pages) if (RESERVED.includes(id) || (site.pages ?? []).some((/** @type {any} */ p) => p?.slug === id)) err("practice", `"${id}" is the name of another page; give that area, insight or guide another id`);
}

/** The law look's hero: one sentence over a photograph of the firm's room. @param {any} h @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkHero(h, err, exists) {
  if (!isObj(h)) { err("hero", "required: { kicker, title, intro, photo }"); return; }
  onlyKeys(h, ["kicker", "title", "intro", "photo"], "hero", err);
  for (const k of ["kicker", "title"]) text(err, `hero.${k}`, h[k]);
  photo(err, "hero.photo", h.photo, exists);
}

/** @param {any} r @param {string} mode @param {Report} err */
function checkRegulation(r, mode, err) {
  if (r === undefined) return;
  if (!isObj(r)) { err("regulation", "an object; see src/kits/law/features/regulation/README.md"); return; }
  onlyKeys(r, ["legalName", "entity", "sraNumber", "badgeFrame", "insurance", "office"], "regulation", err);
  text(err, "regulation.legalName", r.legalName);
  text(err, "regulation.entity", r.entity);
  sraNumber(r.sraNumber, "regulation.sraNumber", mode, err);
  if (mode === "client" && !isBadgeFrame(r.badgeFrame)) err("regulation.badgeFrame", "the frame address from the firm's SRA digital badge code, https://cdn.yoshki.com/iframe/…html (SRA Transparency Rules 4.1)");
  if (mode === "demo" && r.badgeFrame !== undefined) err("regulation.badgeFrame", "a demo is fictional and has no SRA badge; leave it out (the page shows where the badge goes)");
  if (!isObj(r.insurance)) err("regulation.insurance", "the firm's professional indemnity insurer and where the cover applies: { insurer, address, coverage }");
  else { onlyKeys(r.insurance, ["insurer", "address", "coverage"], "regulation.insurance", err); for (const k of ["insurer", "address", "coverage"]) text(err, `regulation.insurance.${k}`, r.insurance[k]); }
  if (r.office !== undefined) text(err, "regulation.office", r.office);
}

/** @param {any} p @param {string} mode @param {Report} err @param {((rel: string) => boolean)|undefined} exists @returns {Map<string, any>} */
function checkPeople(p, mode, err, exists) {
  /** @type {Map<string, any>} */ const out = new Map();
  if (p === undefined) return out;
  if (!isObj(p) || !Array.isArray(p.items) || !p.items.length) { err("people.items", "at least one person"); return out; }
  onlyKeys(p, ["items"], "people", err);
  ids(err, "people.items", p.items);
  p.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `people.items[${i}]`;
    onlyKeys(x, ["id", "name", "role", "solicitor", "sraId", "practice", "email", "phone", "admitted", "note", "photo"], at, err);
    for (const k of ["name", "role"]) text(err, `${at}.${k}`, x?.[k]);
    if (typeof x?.solicitor !== "boolean") err(`${at}.solicitor`, "true for a solicitor (who then shows an SRA ID), false for anyone else");
    if (x?.solicitor) sraNumber(x.sraId, `${at}.sraId`, mode, err);
    else if (x?.sraId !== undefined) err(`${at}.sraId`, "only solicitors have an SRA ID; set solicitor to true or remove it");
    if (x?.email !== undefined && !EMAIL.test(x.email)) err(`${at}.email`, "not a valid email address");
    if (x?.phone !== undefined && !/^\+\d[\d ]{7,17}$/.test(x.phone)) err(`${at}.phone`, 'international format, e.g. "+44 20 7946 0000"');
    if (x?.admitted !== undefined && !/^(19|20)\d{2}$/.test(String(x.admitted))) err(`${at}.admitted`, "the year admitted as a solicitor, e.g. 2009");
    if (x?.photo !== undefined) photo(err, `${at}.photo`, x.photo, exists);
    if (x?.id) out.set(x.id, x);
  });
  return out;
}

/** @param {any} p @param {Map<string, any>} people @param {Report} err @param {((rel: string) => boolean)|undefined} exists @returns {Set<string>} */
function checkPractice(p, people, err, exists) {
  /** @type {Set<string>} */ const out = new Set();
  if (p === undefined) return out;
  if (!isObj(p) || !Array.isArray(p.items) || !p.items.length) { err("practice.items", "at least one practice area"); return out; }
  onlyKeys(p, ["items", "photo"], "practice", err);
  ids(err, "practice.items", p.items, out);
  if (p.photo !== undefined) photo(err, "practice.photo", p.photo, exists);
  p.items.forEach((/** @type {any} */ a, /** @type {number} */ i) => {
    const at = `practice.items[${i}]`;
    onlyKeys(a, ["id", "name", "line", "about", "does", "lead", "sraServices", "photo", "asked"], at, err);
    if (a?.asked !== undefined) { onlyKeys(a.asked, ["q", "a"], `${at}.asked`, err); text(err, `${at}.asked.q`, a.asked?.q); text(err, `${at}.asked.a`, a.asked?.a); }
    for (const k of ["name", "line", "about"]) text(err, `${at}.${k}`, a?.[k]);
    if (!Array.isArray(a?.does) || !a.does.length || !a.does.every(isStr)) err(`${at}.does`, "what the firm does in this area, a list of short lines");
    const lead = people.get(a?.lead);
    if (!lead) err(`${at}.lead`, `the id of the person who leads it (${[...people.keys()].join(", ") || "add people first"})`);
    else if (!lead.email) err(`people`, `${lead.name} leads ${a.name}, so needs an email for enquiries`);
    if (a?.sraServices !== undefined && (!Array.isArray(a.sraServices) || !a.sraServices.every((/** @type {string} */ s) => s in SRA_SERVICES))) err(`${at}.sraServices`, `services the SRA lists, from: ${Object.keys(SRA_SERVICES).join(", ")}`);
    if (a?.photo !== undefined) photo(err, `${at}.photo`, a.photo, exists);
  });
  return out;
}

/** A firm that offers a service rule 1 lists must publish its price and service information. @param {any} site @param {Report} err */
function checkRuleOne(site, err) {
  const offered = new Set((site.practice?.items ?? []).flatMap((/** @type {any} */ a) => (Array.isArray(a?.sraServices) ? a.sraServices : [])));
  if (!offered.size) return;
  if (!site.features?.includes("pricing")) { err("features", `"pricing" is required: the firm offers ${[...offered].join(", ")}, which the SRA Transparency Rules (rule 1) say must have published prices`); return; }
  const priced = new Set((site.pricing?.services ?? []).map((/** @type {any} */ s) => s?.service));
  for (const s of offered) if (!priced.has(s)) err("pricing.services", `no price and service information for "${s}" (${SRA_SERVICES[s].label}), which the firm offers`);
}

/** @param {any} v */
const pounds = (v) => Number.isFinite(v) && v >= 0 && Math.round(v * 100) === v * 100;

/** @param {any} p @param {Map<string, any>} people @param {Report} err */
function checkPricing(p, people, err) {
  if (!isObj(p)) { err("pricing", "an object; see src/kits/law/features/pricing/README.md"); return; }
  onlyKeys(p, ["title", "intro", "vatRegistered", "updated", "services", "other"], "pricing", err);
  text(err, "pricing.title", p.title);
  if (typeof p.vatRegistered !== "boolean") err("pricing.vatRegistered", "true if the firm charges VAT (the page then shows prices with and without it)");
  if (!YM.test(p.updated ?? "")) err("pricing.updated", "the month these prices were last checked, YYYY-MM");
  if (!Array.isArray(p.services)) { err("pricing.services", "a list (empty if the firm offers none of the services rule 1 lists)"); return; }
  const seen = new Set();
  p.services.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    const at = `pricing.services[${i}]`;
    onlyKeys(s, ["service", "name", "price", "basis", "includes", "excludes", "disbursements", "stages", "timescale", "team", "experience"], at, err);
    if (!(s?.service in SRA_SERVICES)) err(`${at}.service`, `one of ${Object.keys(SRA_SERVICES).join(", ")}`);
    else if (seen.has(s.service)) err(`${at}.service`, `"${s.service}" is listed twice`);
    seen.add(s?.service);
    text(err, `${at}.name`, s?.name);
    checkPrice(s?.price, `${at}.price`, err);
    text(err, `${at}.basis`, s?.basis);
    for (const k of ["includes", "excludes", "stages"]) if (!Array.isArray(s?.[k]) || !s[k].length || !s[k].every(isStr)) err(`${at}.${k}`, k === "excludes" ? "what a client might expect that isn't included (the SRA asks for this)" : "a list of short lines");
    if (!Array.isArray(s?.disbursements)) err(`${at}.disbursements`, "a list, each { name, amount (or null if it varies), vat, note }");
    else s.disbursements.forEach((/** @type {any} */ d, /** @type {number} */ j) => {
      onlyKeys(d, ["name", "amount", "vat", "note"], `${at}.disbursements[${j}]`, err);
      text(err, `${at}.disbursements[${j}].name`, d?.name);
      if (d?.amount !== null && !pounds(d?.amount)) err(`${at}.disbursements[${j}].amount`, "pounds, or null if it varies (then say why in note)");
      if (d?.amount === null) text(err, `${at}.disbursements[${j}].note`, d?.note);
      if (typeof d?.vat !== "boolean") err(`${at}.disbursements[${j}].vat`, "true if VAT is added to it");
    });
    text(err, `${at}.timescale`, s?.timescale);
    if (!Array.isArray(s?.team) || !s.team.length || !s.team.every((/** @type {string} */ id) => people.has(id))) err(`${at}.team`, "the ids of the people who do and supervise the work");
    text(err, `${at}.experience`, s?.experience);
  });
  if (p.other !== undefined) text(err, "pricing.other", p.other);
}

/** A fixed fee, or a range with what moves it. @param {any} v @param {string} at @param {Report} err */
function checkPrice(v, at, err) {
  if (!isObj(v)) { err(at, '{ "fixed": 1500 } or { "from": 1500, "to": 3000 }, in pounds before VAT'); return; }
  onlyKeys(v, ["fixed", "from", "to", "hourly"], at, err);
  const kinds = ["fixed", "from", "hourly"].filter((k) => v[k] !== undefined);
  if (kinds.length !== 1) err(at, "one of fixed, a from–to range, or hourly");
  for (const k of ["fixed", "from", "to", "hourly"]) if (v[k] !== undefined && !pounds(v[k])) err(`${at}.${k}`, "pounds before VAT");
  if (v.from !== undefined && (v.to === undefined || v.to < v.from)) err(`${at}.to`, "the top of the range, at least the lowest");
  if (v.to !== undefined && v.from === undefined) err(`${at}.from`, "the bottom of the range");
}

/** @param {any} c @param {Report} err */
function checkComplaints(c, err) {
  if (!isObj(c)) { err("complaints", "an object; see src/kits/law/features/complaints/README.md"); return; }
  onlyKeys(c, ["intro", "contact", "steps", "updated"], "complaints", err);
  text(err, "complaints.intro", c.intro);
  if (!isObj(c.contact)) err("complaints.contact", "who handles complaints: { name, role, email, address }");
  else {
    onlyKeys(c.contact, ["name", "role", "email", "address"], "complaints.contact", err);
    for (const k of ["name", "role", "address"]) text(err, `complaints.contact.${k}`, c.contact[k]);
    if (!EMAIL.test(c.contact.email ?? "")) err("complaints.contact.email", "not a valid email address");
  }
  if (!Array.isArray(c.steps) || !c.steps.length) err("complaints.steps", "the firm's own procedure, each { title, text }");
  else c.steps.forEach((/** @type {any} */ s, /** @type {number} */ i) => { onlyKeys(s, ["title", "text"], `complaints.steps[${i}]`, err); text(err, `complaints.steps[${i}].title`, s?.title); text(err, `complaints.steps[${i}].text`, s?.text); });
  if (!YM.test(c.updated ?? "")) err("complaints.updated", "the month the procedure was last checked, YYYY-MM");
}

/** @param {any} f @param {Report} err */
function checkFirstContact(f, err) {
  if (!isObj(f)) { err("firstContact", "{ title, intro, email }"); return; }
  onlyKeys(f, ["title", "intro", "email"], "firstContact", err);
  text(err, "firstContact.title", f.title);
  text(err, "firstContact.intro", f.intro);
  if (!EMAIL.test(f.email ?? "")) err("firstContact.email", "the address that receives first enquiries (someone runs the conflict check before passing it on)");
}

/** @param {any} a @param {Report} err @param {((rel: string) => boolean)|undefined} exists @returns {Set<string>} the ways in */
function checkArrival(a, err, exists) {
  /** @type {Set<string>} */ const out = new Set();
  if (!isObj(a)) { err("arrival", "{ title, text, ways, photo }"); return out; }
  onlyKeys(a, ["title", "text", "ways", "photo"], "arrival", err);
  text(err, "arrival.title", a.title);
  text(err, "arrival.text", a.text);
  if (!Array.isArray(a.ways) || !a.ways.length) err("arrival.ways", "each way in: { id, label, text }");
  else {
    ids(err, "arrival.ways", a.ways, out);
    a.ways.forEach((/** @type {any} */ w, /** @type {number} */ i) => { onlyKeys(w, ["id", "label", "text"], `arrival.ways[${i}]`, err); text(err, `arrival.ways[${i}].label`, w?.label); text(err, `arrival.ways[${i}].text`, w?.text); });
  }
  photo(err, "arrival.photo", a.photo, exists);
  return out;
}

/**
 * Insights and guides: the firm's own writing, dated, with an author who is one of its people; a guide also names the
 * partner who reviewed it and when.
 * @param {any} a @param {string} key @param {Map<string, any>} people @param {Set<string>} areas @param {Set<string>} pages @param {Report} err @param {boolean} reviewed @param {((rel: string) => boolean)|undefined} exists
 */
function checkArticles(a, key, people, areas, pages, err, reviewed, exists) {
  if (!isObj(a) || !Array.isArray(a.items) || !a.items.length) { err(`${key}.items`, "at least one piece"); return; }
  onlyKeys(a, ["title", "intro", "items"], key, err);
  text(err, `${key}.title`, a.title);
  a.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `${key}.items[${i}]`;
    onlyKeys(x, ["id", "title", "date", "author", "practice", "summary", "body", "photo", ...(reviewed ? ["reviewedBy", "reviewed"] : [])], at, err);
    if (x?.photo !== undefined) photo(err, `${at}.photo`, x.photo, exists);
    if (!ID.test(x?.id ?? "")) err(`${at}.id`, "lowercase letters, numbers and dashes");
    else if (pages.has(x.id)) err(`${at}.id`, `"${x.id}" is already a page on this site`);
    pages.add(x?.id);
    for (const k of ["title", "summary"]) text(err, `${at}.${k}`, x?.[k]);
    if (!YMD.test(x?.date ?? "")) err(`${at}.date`, "when it was written, YYYY-MM-DD");
    if (!people.has(x?.author)) err(`${at}.author`, "the id of the person who wrote it");
    if (x?.practice !== undefined && !areas.has(x.practice)) err(`${at}.practice`, "one of the practice areas' ids");
    if (!Array.isArray(x?.body) || !x.body.length || !x.body.every(isStr)) err(`${at}.body`, "the piece, a list of paragraphs");
    if (reviewed) {
      if (!people.get(x?.reviewedBy)?.solicitor) err(`${at}.reviewedBy`, "the id of the solicitor who reviewed it");
      if (!YMD.test(x?.reviewed ?? "")) err(`${at}.reviewed`, "when it was last reviewed, YYYY-MM-DD");
    }
  });
}

/** Public matters: only with the client's approval and only what is already public, with its source. @param {any} m @param {Set<string>} areas @param {Report} err */
function checkMatters(m, areas, err) {
  if (!isObj(m) || !Array.isArray(m.items) || !m.items.length) { err("matters.items", "at least one matter"); return; }
  onlyKeys(m, ["title", "intro", "items"], "matters", err);
  ids(err, "matters.items", m.items);
  m.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `matters.items[${i}]`;
    onlyKeys(x, ["id", "practice", "title", "text", "year", "approved", "source"], at, err);
    for (const k of ["title", "text"]) text(err, `${at}.${k}`, x?.[k]);
    if (!areas.has(x?.practice)) err(`${at}.practice`, "one of the practice areas' ids");
    if (!/^(19|20)\d{2}$/.test(String(x?.year ?? ""))) err(`${at}.year`, "the year, e.g. 2025");
    if (x?.approved !== true) err(`${at}.approved`, "must be true: the client has approved naming this matter, in writing");
    if (!isObj(x?.source) || !isStr(x.source.name) || !/^https:\/\//.test(x.source.url ?? "")) err(`${at}.source`, "where it is already public: { name, url }");
    else onlyKeys(x.source, ["name", "url"], `${at}.source`, err);
    if (/\b(won|guarantee|always|never lose|success rate)\b/i.test(`${x?.title} ${x?.text}`)) err(at, "describe the work, not a result or a promise (SRA Code: don't mislead about outcomes)");
  });
}

/** @param {any} m @param {Map<string, any>} people @param {Set<string>} ways @param {string} mode @param {Report} err */
function checkMeetingPack(m, people, ways, mode, err) {
  if (!isObj(m)) { err("meetingPack", "{ title, intro, bring, fees }"); return; }
  onlyKeys(m, ["title", "intro", "bring", "fees", "note", "example"], "meetingPack", err);
  for (const k of ["title", "intro", "fees"]) text(err, `meetingPack.${k}`, m[k]);
  if (!Array.isArray(m.bring) || !m.bring.length) err("meetingPack.bring", "the things a client may be asked to bring: { id, label }");
  else { ids(err, "meetingPack.bring", m.bring); m.bring.forEach((/** @type {any} */ b, /** @type {number} */ i) => { onlyKeys(b, ["id", "label"], `meetingPack.bring[${i}]`, err); text(err, `meetingPack.bring[${i}].label`, b?.label); }); }
  if (m.example !== undefined && mode === "client") err("meetingPack.example", "only demos carry an example pack; a client's packs are only ever in the links the firm sends");
  if (m.example !== undefined && mode === "demo") {
    const r = decodePack(String(m.example), { people: [...people.keys()], ways: [...ways], bring: (m.bring ?? []).map((/** @type {any} */ b) => b?.id) });
    if (!r.ok) err("meetingPack.example", `the part after # of an example pack link; this one fails on ${r.why}`);
  }
}

/** @param {any} s @param {Report} err */
function checkSuccession(s, err) {
  if (!isObj(s)) { err("succession", "{ title, intro, note, scenarios }"); return; }
  onlyKeys(s, ["title", "intro", "note", "scenarios"], "succession", err);
  for (const k of ["title", "intro", "note"]) { text(err, `succession.${k}`, s[k]); if (FIGURES.test(String(s[k] ?? ""))) err(`succession.${k}`, "no figures, tax results or promises in an illustration"); }
  if (isStr(s.note) && !/illustration/i.test(s.note)) err("succession.note", 'must say it is an illustration (e.g. "An illustration only, not advice")');
  if (!Array.isArray(s.scenarios) || !s.scenarios.length) { err("succession.scenarios", "at least one illustration"); return; }
  ids(err, "succession.scenarios", s.scenarios);
  s.scenarios.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    onlyKeys(x, ["id", "label", "nodes", "steps"], `succession.scenarios[${i}]`, err);
    text(err, `succession.scenarios[${i}].label`, x?.label);
    for (const p of scenarioProblems(x)) err(`succession.scenarios[${i}].${p.slice(0, p.indexOf(": "))}`, p.slice(p.indexOf(": ") + 2));
    for (const [j, st] of (x?.steps ?? []).entries()) if (FIGURES.test(`${st?.title} ${st?.text}`)) err(`succession.scenarios[${i}].steps[${j}]`, "no figures, tax results or promises in an illustration");
    if (FIGURES.test(String(x?.label ?? ""))) err(`succession.scenarios[${i}].label`, "no figures, tax results or promises in an illustration");
    for (const [j, n] of (x?.nodes ?? []).entries()) if (FIGURES.test(String(n?.label ?? ""))) err(`succession.scenarios[${i}].nodes[${j}].label`, "no figures, tax results or promises in an illustration");
  });
}

/** A list of { id, … } with unique ids and the listed text fields. @param {any} list @param {string} at @param {string[]} keys @param {string[]} texts @param {Report} err */
function items(list, at, keys, texts, err) {
  if (!Array.isArray(list) || !list.length) { err(at, "at least one"); return; }
  ids(err, at, list);
  list.forEach((/** @type {any} */ x, /** @type {number} */ i) => { onlyKeys(x, keys, `${at}[${i}]`, err); for (const k of texts) text(err, `${at}[${i}].${k}`, x?.[k]); });
}

/**
 * The tools and showpieces added in the second round: glossary, matter steps, bereavement, gather, your hours, will
 * reminder, estimator, intestacy, house tour, matter by code.
 * @param {any} site @param {Map<string, any>} people @param {Set<string>} areas @param {Report} err @param {((rel: string) => boolean)|undefined} exists
 */
function checkTools(site, people, areas, err, exists) {
  const head = (/** @type {any} */ o, /** @type {string} */ k, /** @type {string[]} */ extra) => { if (!isObj(o)) { err(k, "an object; see the feature's README"); return false; } onlyKeys(o, ["title", "intro", ...extra], k, err); text(err, `${k}.title`, o.title); return true; };
  const g = site.glossary;
  if (g !== undefined && head(g, "glossary", ["terms"])) {
    if (!Array.isArray(g.terms) || g.terms.length < 3) err("glossary.terms", "at least three, each { term, means }");
    else g.terms.forEach((/** @type {any} */ t, /** @type {number} */ i) => { onlyKeys(t, ["term", "means"], `glossary.terms[${i}]`, err); text(err, `glossary.terms[${i}].term`, t?.term); text(err, `glossary.terms[${i}].means`, t?.means); });
  }
  const ms = site.matterSteps;
  if (ms !== undefined && head(ms, "matterSteps", ["matters"])) {
    items(ms.matters, "matterSteps.matters", ["id", "practice", "name", "steps"], ["name"], err);
    (ms.matters ?? []).forEach((/** @type {any} */ m, /** @type {number} */ i) => {
      if (!areas.has(m?.practice)) err(`matterSteps.matters[${i}].practice`, "one of the practice areas' ids");
      if (!Array.isArray(m?.steps) || m.steps.length < 2) err(`matterSteps.matters[${i}].steps`, "at least two steps, each { title, when, text, you }");
      else m.steps.forEach((/** @type {any} */ st, /** @type {number} */ j) => { const at = `matterSteps.matters[${i}].steps[${j}]`; onlyKeys(st, ["title", "when", "text", "you"], at, err); for (const k of ["title", "when", "text"]) text(err, `${at}.${k}`, st?.[k]); });
    });
  }
  const b = site.bereavement;
  if (b !== undefined && head(b, "bereavement", ["steps", "help", "checked"])) {
    items(b.steps, "bereavement.steps", ["id", "title", "text", "remindDays", "link"], ["title", "text"], err);
    (b.steps ?? []).forEach((/** @type {any} */ st, /** @type {number} */ i) => {
      if (st?.remindDays !== undefined && !(Number.isInteger(st.remindDays) && st.remindDays >= 0 && st.remindDays <= 365)) err(`bereavement.steps[${i}].remindDays`, "days after the start date for a reminder, 0–365");
      if (st?.link !== undefined && (!isStr(st.link?.label) || !/^https:\/\/(www\.)?gov\.uk\//.test(st.link?.url ?? ""))) err(`bereavement.steps[${i}].link`, "{ label, url } on gov.uk");
    });
    const days = (b.steps ?? []).map((/** @type {any} */ st) => st?.remindDays).filter((/** @type {any} */ d) => Number.isInteger(d));
    if (days.some((/** @type {number} */ d, /** @type {number} */ i) => i > 0 && d < days[i - 1])) err("bereavement.steps", "order the steps by their reminder day, so the suggested dates never go backwards down the page");
    text(err, "bereavement.help", b.help);
    if (!YM.test(b.checked ?? "")) err("bereavement.checked", "the month the steps were checked against gov.uk, YYYY-MM");
  }
  const ga = site.gather;
  if (ga !== undefined && head(ga, "gather", ["lists"])) {
    items(ga.lists, "gather.lists", ["id", "practice", "title", "items"], ["title"], err);
    (ga.lists ?? []).forEach((/** @type {any} */ l, /** @type {number} */ i) => {
      if (l?.practice !== undefined && !areas.has(l.practice)) err(`gather.lists[${i}].practice`, "one of the practice areas' ids");
      if (!Array.isArray(l?.items) || !l.items.length || !l.items.every(isStr)) err(`gather.lists[${i}].items`, "the things to gather, short lines");
    });
  }
  const yh = site.yourHours;
  if (yh !== undefined) {
    if (!isObj(yh)) err("yourHours", "{ zones: [{ zone, label }] }");
    else {
      onlyKeys(yh, ["zones"], "yourHours", err);
      if (!Array.isArray(yh.zones) || !yh.zones.length) err("yourHours.zones", "the firm's usual client cities: { zone: \"Asia/Hong_Kong\", label: \"Hong Kong\" }");
      else yh.zones.forEach((/** @type {any} */ z, /** @type {number} */ i) => {
        onlyKeys(z, ["zone", "label"], `yourHours.zones[${i}]`, err); text(err, `yourHours.zones[${i}].label`, z?.label);
        try { new Intl.DateTimeFormat("en-GB", { timeZone: z?.zone }); if (!isStr(z?.zone)) throw 0; } catch { err(`yourHours.zones[${i}].zone`, "an IANA time zone, e.g. Asia/Hong_Kong"); }
      });
    }
  }
  const wr = site.willReminder;
  if (wr !== undefined && head(wr, "willReminder", ["practice", "events", "years"])) {
    if (!areas.has(wr.practice)) err("willReminder.practice", "the practice area it sits with (its lead receives the email)");
    items(wr.events, "willReminder.events", ["id", "label"], ["label"], err);
    if (!Number.isInteger(wr.years) || wr.years < 1 || wr.years > 10) err("willReminder.years", "years until the reminder, 1–10");
  }
  const es = site.estimator;
  if (es !== undefined && head(es, "estimator", ["service", "questions", "note"])) {
    const svc = (site.pricing?.services ?? []).find((/** @type {any} */ x) => x?.service === es.service);
    if (!svc) err("estimator.service", "a service listed in pricing.services, with a from–to price");
    else if (svc.price?.from === undefined) err("estimator.service", `"${es.service}" needs a from–to price range in pricing`);
    if (!Array.isArray(es.questions) || !es.questions.length) err("estimator.questions", "each { id, label, options: [{ label, low, high }] }");
    else {
      ids(err, "estimator.questions", es.questions);
      es.questions.forEach((/** @type {any} */ q, /** @type {number} */ i) => {
        const at = `estimator.questions[${i}]`;
        onlyKeys(q, ["id", "label", "options"], at, err); text(err, `${at}.label`, q?.label);
        if (!Array.isArray(q?.options) || q.options.length < 2) err(`${at}.options`, "at least two answers");
        else q.options.forEach((/** @type {any} */ o, /** @type {number} */ j) => { onlyKeys(o, ["label", "low", "high"], `${at}.options[${j}]`, err); text(err, `${at}.options[${j}].label`, o?.label); if (!pounds(o?.low) || !pounds(o?.high) || o.high < o.low) err(`${at}.options[${j}]`, "low and high, pounds added before VAT, high at least low"); });
      });
      if (svc?.price?.from !== undefined && es.questions.every((/** @type {any} */ q) => Array.isArray(q?.options) && q.options.every((/** @type {any} */ o) => pounds(o?.low) && pounds(o?.high)))) {
        const { min, max } = bounds(svc.price.from, es.questions);
        if (min < svc.price.from || max > svc.price.to) err("estimator.questions", `answers can reach £${min}–£${max}; the published range is £${svc.price.from}–£${svc.price.to}, and an estimate may never go outside it`);
      }
    }
    text(err, "estimator.note", es.note);
  }
  if (site.intestacy !== undefined) head(site.intestacy, "intestacy", []);
  const h = site.house;
  if (h !== undefined && head(h, "house", ["rooms"])) {
    items(h.rooms, "house.rooms", ["id", "name", "line", "photo"], ["name", "line"], err);
    (h.rooms ?? []).forEach((/** @type {any} */ r, /** @type {number} */ i) => photo(err, `house.rooms[${i}].photo`, r?.photo, exists));
  }
  const mc = site.matterCode;
  if (mc !== undefined) {
    if (!isObj(mc)) err("matterCode", "an object; see src/kits/law/features/matter-code/README.md");
    else {
      onlyKeys(mc, ["title", "intro", "source", "csvUrl", "staleAfterDays", "stages", "example"], "matterCode", err);
      text(err, "matterCode.title", mc.title);
      if (!["sheet", "simulated"].includes(mc.source)) err("matterCode.source", '"sheet" (the firm\'s published sheet) or "simulated" (demos)');
      if (mc.source === "simulated" && site.mode === "client") err("matterCode.source", "simulated data is only allowed on demo sites");
      if (mc.source === "sheet" && !/^https:\/\/docs\.google\.com\/spreadsheets\/.+output=csv/.test(mc.csvUrl ?? "")) err("matterCode.csvUrl", "the published Google Sheet CSV link (File → Share → Publish to web → CSV)");
      if (mc.staleAfterDays !== undefined && !(Number.isInteger(mc.staleAfterDays) && mc.staleAfterDays >= 1 && mc.staleAfterDays <= 60)) err("matterCode.staleAfterDays", "1–60 days");
      items(mc.stages, "matterCode.stages", ["id", "name", "about"], ["name", "about"], err);
      if (mc.example !== undefined && (site.mode !== "demo" || !cleanMatterCode(mc.example))) err("matterCode.example", "demos only: an example code, 8–12 letters and digits");
    }
  }
  void people;
}
