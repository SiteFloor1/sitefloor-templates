// @ts-check
/**
 * Validation for the letting kit (letting and property management agents in England). The law decides what must be
 * there: every fee with VAT and the redress and client money protection schemes (Consumer Rights Act 2015, s.83), a
 * copy of the CMP certificate (Client Money Protection Schemes for Property Agents Regulations 2018), and tenant
 * terms within the Tenant Fees Act caps (lib/fees.js). A demo can never carry a real member number.
 */
import { tenantTermsProblem } from "./lib/fees.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const ID = /^[a-z0-9-]{1,30}$/;
const FLOOR = /^[A-Z0-9]{1,3}$/;
const UNIT = /^[A-Za-z0-9-]{1,12}$/;
const MODELS = ["mansion", "terrace", "tower"];
const REDRESS = ["The Property Ombudsman", "Property Redress Scheme"];
const DEMO_NUMBER = "000000";
/** Pages the kit builds. */
export const RESERVED = ["index", "fees", "owners", "residences", "repairs", "visit", "privacy", "404", "manage", "areas", "journal", "valuation", "onboarding", "stories", "moving-in"];

/** @param {Report} err @param {string} path @param {any} v */
const text = (err, path, v) => { if (!isStr(v)) err(path, "required text is missing"); };

/** A misspelt setting is refused, not silently ignored. @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (isObj(o)) for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}

/** @param {Report} err @param {string} path @param {any} v */
function lines(err, path, v) {
  if (!Array.isArray(v) || !v.length) { err(path, "at least one line"); return; }
  v.forEach((x, i) => text(err, `${path}[${i}]`, x));
}

/** @param {Report} err @param {string} path @param {any} p @param {((rel: string) => boolean)|undefined} exists */
function photo(err, path, p, exists) {
  if (!isObj(p)) { err(path, "a photo: { src, tall, width, height, alt, credit }"); return; }
  onlyKeys(p, ["src", "tall", "width", "height", "tallWidth", "tallHeight", "alt", "position", "credit"], path, err);
  text(err, `${path}.alt`, p.alt);
  text(err, `${path}.credit`, p.credit);
  for (const k of ["width", "height", "tallWidth", "tallHeight"]) if (!Number.isInteger(p[k])) err(`${path}.${k}`, "a size in pixels");
  if (p.position !== undefined && !/^\d{1,3}% \d{1,3}%$/.test(p.position)) err(`${path}.position`, 'the crop\'s focus, e.g. "50% 30%"');
  for (const k of ["src", "tall"]) {
    if (!isStr(p[k])) err(`${path}.${k}`, "required");
    else if (exists && !exists(p[k])) err(`${path}.${k}`, `file not found: ${p[k]}`);
  }
}

/** A demo shows noughts so no real agent is named; a client shows its real number. @param {any} v @param {string} path @param {string} mode @param {Report} err */
function member(v, path, mode, err) {
  if (!isStr(v)) err(path, "the membership number as the scheme shows it");
  else if (mode === "demo" && v !== DEMO_NUMBER) err(path, `demo sites are fictional: use ${DEMO_NUMBER} so no real agent is named`);
  else if (mode === "client" && v === DEMO_NUMBER) err(path, "is a demo number; client sites need the real one from the scheme's certificate");
}

/** @param {any} site @param {Report} err @param {((rel: string) => boolean)|undefined} [exists] */
export function checkLetting(site, err, exists) {
  if (site.kit !== "letting") return;
  SLUGS = new Set();
  const on = (/** @type {string} */ id) => Array.isArray(site.features) && site.features.includes(id);
  if (!on("letting-fees")) err("features", '"letting-fees" is required on every letting agent\'s site: fees must be shown prominently (Consumer Rights Act 2015, s.83)');
  checkHero(site.hero, err, exists);
  checkSchemes(site.schemes, site.mode, err, exists);
  checkFees(site.fees, err);
  if (site.homes !== undefined) checkHomes(site, err);
  if (site.owners !== undefined) checkOwners(site.owners, err);
  if (site.repairs !== undefined) checkRepairs(site.repairs, err);
  if (site.manage !== undefined) checkManage(site.manage, err);
  if (site.areas !== undefined) checkAreas(site, err, exists);
  if (site.journal !== undefined) checkJournal(site.journal, err);
  if (site.valuation !== undefined) checkValuation(site.valuation, err);
  if (site.onboarding !== undefined) checkOnboarding(site.onboarding, err);
  if (site.stories !== undefined) checkStories(site.stories, site.mode, err);
  if (site.moveday !== undefined) checkMoveday(site.moveday, err);
}

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const YMD = /^\d{4}-\d{2}-\d{2}$/;
/** A collection's page names must not clash with the kit's pages or each other. @param {Set<string>} seen @param {string} at @param {any} slug @param {Report} err */
function slugOk(seen, at, slug, err) {
  if (!SLUG.test(slug ?? "")) err(at, "lowercase words joined by dashes");
  else if (RESERVED.includes(slug) || seen.has(slug)) err(at, `"${slug}" is already a page`);
  seen.add(slug);
}
/** @type {Set<string>} */ let SLUGS = new Set();

/** @param {any} m @param {Report} err */
function checkManage(m, err) {
  if (!isObj(m)) { err("manage", "required: { title, intro, kinds, year }"); return; }
  onlyKeys(m, ["title", "intro", "kinds", "year", "not"], "manage", err);
  text(err, "manage.title", m.title); text(err, "manage.intro", m.intro);
  if (!Array.isArray(m.kinds) || !m.kinds.length) err("manage.kinds", "at least one: { name, text }");
  else m.kinds.forEach((/** @type {any} */ k, /** @type {number} */ i) => { onlyKeys(k, ["name", "text"], `manage.kinds[${i}]`, err); text(err, `manage.kinds[${i}].name`, k?.name); text(err, `manage.kinds[${i}].text`, k?.text); });
  if (!Array.isArray(m.year) || !m.year.length) err("manage.year", "at least one: { when, what }");
  else m.year.forEach((/** @type {any} */ y, /** @type {number} */ i) => { onlyKeys(y, ["when", "what"], `manage.year[${i}]`, err); text(err, `manage.year[${i}].when`, y?.when); text(err, `manage.year[${i}].what`, y?.what); });
  if (m.not !== undefined) lines(err, "manage.not", m.not);
}

/** @param {any} site @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkAreas(site, err, exists) {
  const a = site.areas;
  if (!isObj(a)) { err("areas", "required: { title, intro, items }"); return; }
  onlyKeys(a, ["title", "intro", "items"], "areas", err);
  text(err, "areas.title", a.title); text(err, "areas.intro", a.intro);
  const ids = new Set((site.homes?.buildings ?? []).map((/** @type {any} */ b) => b.id));
  SLUGS = new Set();
  if (!Array.isArray(a.items) || !a.items.length) { err("areas.items", "at least one area"); return; }
  a.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `areas.items[${i}]`;
    onlyKeys(x, ["slug", "name", "line", "buildings", "photo", "notes"], at, err);
    slugOk(SLUGS, `${at}.slug`, x?.slug, err);
    text(err, `${at}.name`, x?.name); text(err, `${at}.line`, x?.line);
    if (!Array.isArray(x?.buildings)) err(`${at}.buildings`, "the ids of the buildings in this area (may be empty)");
    else x.buildings.forEach((/** @type {any} */ b, /** @type {number} */ j) => { if (!ids.has(b)) err(`${at}.buildings[${j}]`, `no building "${b}" in homes.buildings`); });
    const p = x?.photo;
    if (!isObj(p)) err(`${at}.photo`, "{ src, width, height, alt, credit }: the client's own, or a credited licensed photograph of this area");
    else {
      onlyKeys(p, ["src", "small", "width", "height", "alt", "credit"], `${at}.photo`, err);
      if (p.small !== undefined && (!isStr(p.small) || (exists && !exists(p.small)))) err(`${at}.photo.small`, "a 700-pixel-wide copy for phones and the areas page (optional)");
      for (const k of ["alt", "credit"]) text(err, `${at}.photo.${k}`, p[k]);
      for (const k of ["width", "height"]) if (!Number.isInteger(p[k])) err(`${at}.photo.${k}`, "a size in pixels");
      if (!isStr(p.src)) err(`${at}.photo.src`, "required");
      else if (exists && !exists(p.src)) err(`${at}.photo.src`, `file not found: ${p.src}`);
    }
    if (!Array.isArray(x?.notes) || x.notes.length < 3) err(`${at}.notes`, "at least three notes, { label, text }, so the page isn't thin");
    else x.notes.forEach((/** @type {any} */ n, /** @type {number} */ j) => { onlyKeys(n, ["label", "text"], `${at}.notes[${j}]`, err); text(err, `${at}.notes[${j}].label`, n?.label); text(err, `${at}.notes[${j}].text`, n?.text); });
  });
}

/** @param {any} j @param {Report} err */
function checkJournal(j, err) {
  if (!isObj(j)) { err("journal", "required: { title, intro, items }"); return; }
  onlyKeys(j, ["title", "intro", "items"], "journal", err);
  text(err, "journal.title", j.title); text(err, "journal.intro", j.intro);
  if (!Array.isArray(j.items) || !j.items.length) { err("journal.items", "at least one article"); return; }
  const seen = new Set();
  j.items.forEach((/** @type {any} */ a, /** @type {number} */ i) => {
    const at = `journal.items[${i}]`;
    onlyKeys(a, ["slug", "title", "summary", "audience", "date", "checked", "sections", "sources"], at, err);
    slugOk(seen, `${at}.slug`, a?.slug, err);
    if (SLUGS.has(a?.slug)) err(`${at}.slug`, `"${a.slug}" is already an area's page`);
    for (const k of ["title", "summary", "audience"]) text(err, `${at}.${k}`, a?.[k]);
    for (const k of ["date", "checked"]) if (!YMD.test(a?.[k] ?? "")) err(`${at}.${k}`, "a date as YYYY-MM-DD");
    if (!Array.isArray(a?.sections) || a.sections.length < 3) err(`${at}.sections`, "at least three sections, { h, p: [paragraphs] }");
    else a.sections.forEach((/** @type {any} */ s, /** @type {number} */ k) => { text(err, `${at}.sections[${k}].h`, s?.h); lines(err, `${at}.sections[${k}].p`, s?.p); });
    if (!Array.isArray(a?.sources) || !a.sources.length) err(`${at}.sources`, "where every rule comes from: { title, url }");
    else a.sources.forEach((/** @type {any} */ s, /** @type {number} */ k) => {
      text(err, `${at}.sources[${k}].title`, s?.title);
      if (!/^https:\/\/(www\.gov\.uk|www\.legislation\.gov\.uk)\//.test(s?.url ?? "")) err(`${at}.sources[${k}].url`, "a GOV.UK or legislation.gov.uk page");
    });
  });
}

/** @param {any} v @param {Report} err */
function checkValuation(v, err) {
  if (!isObj(v)) { err("valuation", "required: { title, intro, kinds, message, reply }"); return; }
  onlyKeys(v, ["title", "intro", "kinds", "message", "reply", "next"], "valuation", err);
  for (const k of ["title", "intro", "message", "reply"]) text(err, `valuation.${k}`, v[k]);
  lines(err, "valuation.kinds", v.kinds);
  if (v.next !== undefined) lines(err, "valuation.next", v.next);
}

/** @param {any} o @param {Report} err */
function checkOnboarding(o, err) {
  if (!isObj(o)) { err("onboarding", "required: { title, intro, steps, checklistIntro, checklist, message }"); return; }
  onlyKeys(o, ["title", "intro", "steps", "checklistIntro", "checklist", "message"], "onboarding", err);
  for (const k of ["title", "intro", "checklistIntro", "message"]) text(err, `onboarding.${k}`, o[k]);
  lines(err, "onboarding.checklist", o.checklist);
  if (!Array.isArray(o.steps) || o.steps.length < 3) err("onboarding.steps", "at least three steps: { title, text, you?, time }");
  else o.steps.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    onlyKeys(s, ["title", "text", "you", "time"], `onboarding.steps[${i}]`, err);
    for (const k of ["title", "text", "time"]) text(err, `onboarding.steps[${i}].${k}`, s?.[k]);
    if (s?.you !== undefined) lines(err, `onboarding.steps[${i}].you`, s.you);
  });
}

/** Real owners on a client site, with their permission; a demo's are marked fictional. @param {any} st @param {string} mode @param {Report} err */
function checkStories(st, mode, err) {
  if (!isObj(st)) { err("stories", "required: { title, intro, items }"); return; }
  onlyKeys(st, ["title", "intro", "items"], "stories", err);
  text(err, "stories.title", st.title); text(err, "stories.intro", st.intro);
  if (!Array.isArray(st.items) || !st.items.length) { err("stories.items", "at least one story"); return; }
  st.items.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    const at = `stories.items[${i}]`;
    onlyKeys(s, ["title", "home", "service", "before", "did", "after", "figures", "owner", "date", "consent"], at, err);
    for (const k of ["title", "home", "service", "before", "did", "after", "owner"]) text(err, `${at}.${k}`, s?.[k]);
    if (!/^\d{4}-\d{2}$/.test(s?.date ?? "")) err(`${at}.date`, "the month as YYYY-MM");
    if (mode === "client" && s?.consent !== true) err(`${at}.consent`, "a real owner's story needs their written permission to publish it: consent: true");
    (s?.figures ?? []).forEach((/** @type {any} */ f, /** @type {number} */ k) => { text(err, `${at}.figures[${k}].value`, f?.value); text(err, `${at}.figures[${k}].label`, f?.label); });
  });
}

/** @param {any} m @param {Report} err */
function checkMoveday(m, err) {
  if (!isObj(m)) { err("moveday", "required: { title, intro, steps }"); return; }
  onlyKeys(m, ["title", "intro", "steps"], "moveday", err);
  text(err, "moveday.title", m.title); text(err, "moveday.intro", m.intro);
  if (!Array.isArray(m.steps) || m.steps.length < 3) { err("moveday.steps", "at least three steps: { id, label, offset, time?, note? }"); return; }
  const seen = new Set();
  m.steps.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    const at = `moveday.steps[${i}]`;
    onlyKeys(s, ["id", "label", "offset", "time", "note"], at, err);
    if (!ID.test(s?.id ?? "") || s.id === "deposit" || seen.has(s.id)) err(`${at}.id`, 'a unique id (lowercase, dashes); "deposit" is the kit\'s own step');
    seen.add(s?.id);
    text(err, `${at}.label`, s?.label);
    if (!(Number.isInteger(s?.offset) && s.offset >= -60 && s.offset <= 60)) err(`${at}.offset`, "days from the keys, -60 to 60");
    if (s?.time !== undefined && !/^([01]\d|2[0-2]):[0-5]\d$/.test(s.time)) err(`${at}.time`, "HH:MM, before 23:00");
    if (s?.note !== undefined) text(err, `${at}.note`, s.note);
  });
}

/** @param {any} r @param {Report} err */
function checkRepairs(r, err) {
  if (!isObj(r)) { err("repairs", "required: { title, intro, emergencyIntro, emergencies, outOfHours, message }"); return; }
  onlyKeys(r, ["title", "intro", "emergencyIntro", "emergencies", "outOfHours", "message"], "repairs", err);
  for (const k of ["title", "intro", "emergencyIntro", "message"]) text(err, `repairs.${k}`, r[k]);
  lines(err, "repairs.emergencies", r.emergencies);
  if (!/^\+44 ?[1-9][\d ]{8,12}$/.test(r.outOfHours ?? "")) err("repairs.outOfHours", 'a UK number as +44 …, e.g. "+44 20 7946 0000"');
}

/** @param {any} h @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkHero(h, err, exists) {
  if (!isObj(h)) { err("hero", "required: { kicker, title, photo }"); return; }
  onlyKeys(h, ["kicker", "title", "intro", "photo"], "hero", err);
  text(err, "hero.kicker", h.kicker);
  text(err, "hero.title", h.title);
  photo(err, "hero.photo", h.photo, exists);
}

/** @param {any} s @param {string} mode @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkSchemes(s, mode, err, exists) {
  if (!isObj(s)) { err("schemes", "required: { redress, cmp }: the redress scheme and the client money protection scheme the agent belongs to"); return; }
  onlyKeys(s, ["redress", "cmp", "deposits"], "schemes", err);
  const r = s.redress, c = s.cmp;
  if (!isObj(r)) err("schemes.redress", "required: { name, member, url }");
  else {
    onlyKeys(r, ["name", "member", "url"], "schemes.redress", err);
    if (!REDRESS.includes(r.name)) err("schemes.redress.name", `one of the two government-approved schemes: ${REDRESS.join(", ")}`);
    member(r.member, "schemes.redress.member", mode, err);
    if (!/^https:\/\//.test(r.url ?? "")) err("schemes.redress.url", "the scheme's website (https)");
  }
  if (!isObj(c)) err("schemes.cmp", "required: { name, member, url, certificate }");
  else {
    onlyKeys(c, ["name", "member", "url", "certificate"], "schemes.cmp", err);
    text(err, "schemes.cmp.name", c.name);
    member(c.member, "schemes.cmp.member", mode, err);
    if (!/^https:\/\//.test(c.url ?? "")) err("schemes.cmp.url", "the scheme's website (https)");
    // The 2018 regulations ask for a copy of the certificate on the agent's website; a demo has none to show.
    if (mode === "client" && !isStr(c.certificate)) err("schemes.cmp.certificate", "a copy of the CMP certificate (PDF or image in img/) must be on the site");
    else if (isStr(c.certificate) && exists && !exists(c.certificate)) err("schemes.cmp.certificate", `file not found: ${c.certificate}`);
  }
  if (s.deposits !== undefined) text(err, "schemes.deposits", s.deposits);
}

/** @param {any} f @param {Report} err */
function checkFees(f, err) {
  if (!isObj(f)) { err("fees", "required: { tenant, services }"); return; }
  onlyKeys(f, ["tenant", "services", "other", "example"], "fees", err);
  if (f.example !== undefined && !(Number.isInteger(f.example) && f.example > 0)) err("fees.example", "a monthly rent in whole pounds for the examples, e.g. 2000");
  const t = f.tenant ?? {};
  onlyKeys(t, ["holdingWeeks", "depositWeeksBelow", "depositWeeksFrom", "changeFee", "lostKeys"], "fees.tenant", err);
  const problem = tenantTermsProblem(t);
  if (problem) err("fees.tenant", `${problem} (Tenant Fees Act 2019)`);
  if (t.lostKeys !== undefined) text(err, "fees.tenant.lostKeys", t.lostKeys);
  if (!Array.isArray(f.services) || !f.services.length) { err("fees.services", "at least one service for owners, with its fee"); return; }
  const seen = new Set();
  f.services.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    const at = `fees.services[${i}]`;
    onlyKeys(s, ["id", "name", "basis", "percent", "includes"], at, err);
    if (!ID.test(s?.id ?? "")) err(`${at}.id`, "lowercase letters, numbers and dashes");
    else if (seen.has(s.id)) err(`${at}.id`, `"${s.id}" is used twice`);
    seen.add(s?.id);
    text(err, `${at}.name`, s?.name);
    if (!["monthly", "year-once"].includes(s?.basis)) err(`${at}.basis`, '"monthly" (a share of each month\'s rent) or "year-once" (a share of a year\'s rent, once)');
    if (!(typeof s?.percent === "number" && s.percent > 0 && s.percent < 100)) err(`${at}.percent`, "the fee as a percentage of the rent, with VAT, e.g. 18");
    lines(err, `${at}.includes`, s?.includes);
  });
  (f.other ?? []).forEach((/** @type {any} */ o, /** @type {number} */ i) => {
    const at = `fees.other[${i}]`;
    onlyKeys(o, ["name", "price", "per"], at, err);
    text(err, `${at}.name`, o?.name);
    if (!(typeof o?.price === "number" && o.price >= 0)) err(`${at}.price`, "the price in pounds, with VAT");
    if (o?.per !== undefined) text(err, `${at}.per`, o.per);
  });
}

/** @param {any} site @param {Report} err */
function checkHomes(site, err) {
  const h = site.homes;
  if (!isObj(h)) { err("homes", "required: { source, buildings, viewing }"); return; }
  onlyKeys(h, ["source", "csvUrl", "staleAfterHours", "hero", "buildings", "viewing"], "homes", err);
  if (site.mode === "demo" && h.source !== "simulated") err("homes.source", 'a demo uses "simulated"');
  if (site.mode === "client" && h.source !== "sheet") err("homes.source", 'a client site reads its own Google Sheet: "sheet"');
  if (h.source === "sheet" && !/^https:\/\/docs\.google\.com\/spreadsheets\/.+output=csv/.test(h.csvUrl ?? "")) err("homes.csvUrl", "the sheet's published CSV link (File → Share → Publish to web → CSV)");
  if (h.staleAfterHours !== undefined && !(Number.isInteger(h.staleAfterHours) && h.staleAfterHours >= 1 && h.staleAfterHours <= 72)) err("homes.staleAfterHours", "whole hours from 1 to 72 (default 36)");
  text(err, "homes.viewing", h.viewing);
  if (!Array.isArray(h.buildings) || !h.buildings.length) { err("homes.buildings", "at least one building, with its floors"); return; }
  const ids = new Set(), units = new Set();
  h.buildings.forEach((/** @type {any} */ b, /** @type {number} */ i) => {
    const at = `homes.buildings[${i}]`;
    onlyKeys(b, ["id", "name", "kind", "model", "floors"], at, err);
    if (!ID.test(b?.id ?? "")) err(`${at}.id`, "lowercase letters, numbers and dashes");
    else if (ids.has(b.id)) err(`${at}.id`, `"${b.id}" is used twice`);
    ids.add(b?.id);
    text(err, `${at}.name`, b?.name);
    text(err, `${at}.kind`, b?.kind);
    if (b?.model !== undefined && !MODELS.includes(b.model)) err(`${at}.model`, `one of: ${MODELS.join(", ")}`);
    if (!Array.isArray(b?.floors) || !b.floors.length) { err(`${at}.floors`, "at least one floor"); return; }
    const fl = new Set();
    b.floors.forEach((/** @type {any} */ f, /** @type {number} */ j) => {
      const fat = `${at}.floors[${j}]`;
      onlyKeys(f, ["id", "label", "note", "units"], fat, err);
      if (!FLOOR.test(f?.id ?? "")) err(`${fat}.id`, 'as the lift shows it: "G", "LG", "1"');
      else if (fl.has(f.id)) err(`${fat}.id`, `"${f.id}" is used twice`);
      fl.add(f?.id);
      text(err, `${fat}.label`, f?.label);
      if (f?.note !== undefined) text(err, `${fat}.note`, f.note);
      if (!Array.isArray(f?.units) || !f.units.length) err(`${fat}.units`, "the refs of the homes on this floor, as the sheet's ref column has them");
      else f.units.forEach((/** @type {any} */ u, /** @type {number} */ k) => {
        if (!UNIT.test(u ?? "")) err(`${fat}.units[${k}]`, "letters, numbers and dashes, up to 12");
        else if (units.has(u)) err(`${fat}.units[${k}]`, `"${u}" is in two places`);
        units.add(u);
      });
    });
  });
  if (site.features?.includes("letting-building")) {
    const hero = h.buildings.find((/** @type {any} */ b) => b.id === h.hero);
    if (!hero) err("homes.hero", "the building the lift plate and the 3D illustration show: one of the buildings' ids");
    else if (!hero.model) err("homes.hero", `the building "${hero.id}" needs a model for the 3D illustration: ${MODELS.join(", ")}`);
    else if (hero.floors.length > 9) err("homes.hero", "the lift plate shows up to 9 floors");
  }
}

/** @param {any} o @param {Report} err */
function checkOwners(o, err) {
  if (!isObj(o)) { err("owners", "required: { title, intro, duties, valuation }"); return; }
  onlyKeys(o, ["title", "intro", "duties", "valuation"], "owners", err);
  text(err, "owners.title", o.title);
  text(err, "owners.intro", o.intro);
  lines(err, "owners.duties", o.duties);
  text(err, "owners.valuation", o.valuation);
}
