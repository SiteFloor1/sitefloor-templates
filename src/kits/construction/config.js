// @ts-check
/**
 * Validation for the construction kit (builders: extensions, basements, renovations, new builds, listed buildings). Every
 * fact here is the builder's own: their projects, stage lengths, accreditations, insurance and rates. The checks make
 * sure it is complete and can't mislead: a demo can't carry a real membership number or any price, journal facts
 * about planning and building regulations come only from gov.uk with the date they were checked, and a project's
 * "before" photograph needs the client's consent.
 */
import { HOUSES, ROOFS, DEPTH_LIMITS } from "./lib/extension.js";
import { outwardCode } from "./lib/brief.js";
import { TOPICS } from "./lib/planning.js";
import { FACINGS } from "./lib/sun.js";
import { HOUSE_AGES } from "./lib/survey.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const ID = /^[a-z0-9-]{1,40}$/;
const YM = /^\d{4}-(0[1-9]|1[0-2])$/;
const YMD = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
/** The stages the 3D model can draw. */
export const MODEL_STAGES = ["survey", "groundworks", "structure", "envelope", "firstfix", "finish"];
/** Pages the kit builds; a generated page (a project, a service, an article) can't take one of these names. */
const RESERVED = ["index", "projects", "services", "how-we-build", "start", "specification", "extension", "team", "journal",
  "accreditations", "your-build", "visit", "privacy", "404", "project", "service", "article", "custom", "costs", "planning",
  "living", "reviews", "loft", "survey"];

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

/** @param {Report} err @param {string} path @param {any[]} list @param {boolean} [page] each id becomes a page */
function ids(err, path, list, page) {
  const seen = new Set();
  list.forEach((x, i) => {
    if (!ID.test(x?.id ?? "")) err(`${path}[${i}].id`, "lowercase letters, numbers and dashes");
    else if (seen.has(x.id)) err(`${path}[${i}].id`, `"${x.id}" is used twice`);
    else if (page && RESERVED.includes(x.id)) err(`${path}[${i}].id`, `"${x.id}" is the name of one of the kit's pages`);
    seen.add(x?.id);
  });
  return seen;
}

/** @param {Report} err @param {string} path @param {any} v */
function paras(err, path, v) {
  if (!Array.isArray(v) || !v.length || v.some((p) => !isStr(p))) err(path, "a list of paragraphs");
}

/** @param {Report} err @param {string} path @param {any} v */
function weeks(err, path, v) {
  if (v === undefined) return;
  if (!Array.isArray(v) || v.length !== 2 || !v.every((n) => Number.isInteger(n) && n > 0 && n < 200) || v[0] > v[1]) err(path, "[fewest, most] weeks, from your own jobs, e.g. [2, 3]");
}

/** @param {any} site @param {Report} err @param {((rel: string) => boolean)|undefined} [exists] */
export function checkConstruction(site, err, exists) {
  if (site.kit !== "construction") return;
  const on = (/** @type {string} */ id) => Array.isArray(site.features) && site.features.includes(id);
  const demo = site.mode === "demo";

  checkHero(site.hero, err, exists);
  const types = site.buildTypes !== undefined ? checkTypes(site.buildTypes, on("service-pages"), err, exists) : new Set();

  if (site.projects !== undefined) checkProjects(site, types, err, exists, on("projects-map"));
  if (site.stages !== undefined) checkStages(site.stages, err, exists, on("build-3d"));
  if (site.visualiser !== undefined) checkVisualiser(site.visualiser, demo, err);
  if (site.credentials !== undefined) checkCredentials(site.credentials, demo, err);
  if (site.brief !== undefined) checkBrief(site.brief, err);
  if (site.siteProgress !== undefined) checkProgress(site.siteProgress, site.stages, demo, err);
  if (site.spec !== undefined) checkSpec(site.spec, err, exists);
  if (site.crew !== undefined) checkCrew(site.crew, err, exists);
  if (site.journal !== undefined) checkJournal(site.journal, err, exists);
  if (site.howWeBuild !== undefined) {
    const w = site.howWeBuild;
    onlyKeys(w, ["title", "intro", "sections"], "howWeBuild", err);
    text(err, "howWeBuild.title", w?.title);
    if (!Array.isArray(w?.sections) || !w.sections.length) err("howWeBuild.sections", "at least one: { title, text: [paragraphs] }");
    else w.sections.forEach((s, i) => { onlyKeys(s, ["title", "text"], `howWeBuild.sections[${i}]`, err); text(err, `howWeBuild.sections[${i}].title`, s.title); paras(err, `howWeBuild.sections[${i}].text`, s.text); });
  }
  checkPages(site, err, exists);
  for (const k of ["projectsMap", "build3d", "visualiserPage", "planningGuide"]) {
    if (site[k] === undefined) continue;
    onlyKeys(site[k], ["title", "intro"], k, err);
    text(err, `${k}.title`, site[k]?.title);
  }
}

/** @param {any} h @param {Report} err @param {any} exists */
function checkHero(h, err, exists) {
  if (!isObj(h)) { err("hero", "required: { kicker, title, intro, photo, photoPhone }"); return; }
  onlyKeys(h, ["kicker", "title", "intro", "photo", "photoPhone"], "hero", err);
  for (const k of ["kicker", "title", "intro"]) text(err, `hero.${k}`, h[k]);
  if (isStr(h.title) && h.title.length > 60) err("hero.title", "a few words (60 characters at most)");
  photo(err, "hero.photo", h.photo, exists);
  if (h.photoPhone !== undefined) photo(err, "hero.photoPhone", h.photoPhone, exists);
}

/** @param {any} b @param {boolean} pages @param {Report} err @param {any} exists @returns {Set<string>} */
function checkTypes(b, pages, err, exists) {
  const types = new Set();
  onlyKeys(b, ["title", "intro", "items"], "buildTypes", err);
  if (!Array.isArray(b?.items) || !b.items.length) { err("buildTypes.items", "at least one kind of work"); return types; }
  ids(err, "buildTypes.items", b.items, pages).forEach((id) => types.add(id));
  b.items.forEach((/** @type {any} */ t, /** @type {number} */ i) => {
    const at = `buildTypes.items[${i}]`;
    onlyKeys(t, ["id", "name", "line", "photo", "about", "includes", "planning"], at, err);
    if (t.planning !== undefined && (!Array.isArray(t.planning) || t.planning.some((/** @type {any} */ k) => !Object.hasOwn(TOPICS, k)))) err(`${at}.planning`, `planning topics from GOV.UK to show: ${Object.keys(TOPICS).join(", ")}`);
    text(err, `${at}.name`, t.name); text(err, `${at}.line`, t.line);
    photo(err, `${at}.photo`, t.photo, exists);
    if (pages) paras(err, `${at}.about`, t.about);
    if (t.includes !== undefined && (!Array.isArray(t.includes) || t.includes.some((/** @type {any} */ x) => !isStr(x)))) err(`${at}.includes`, "a list of short lines");
  });
  return types;
}

// A full UK postcode (outward and inward), or a house number before a street name.
const FULL_POSTCODE = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i;
const HOUSE_NUMBER = /\b\d+[a-z]?,?\s+(?:[A-Z][a-z']+\s+){1,3}(?:Road|Street|Grove|Avenue|Lane|Gardens|Place|Terrace|Crescent|Close|Hill|Way|Drive|Court|Square|Row|Mews|Park|Walk|Rise|Green|Vale|Villas|Parade)\b/;

/**
 * A project's own words may name a neighbourhood, never an address: no full postcode, no house number and street.
 * @param {Report} err @param {string} at @param {any} value @param {boolean} [place] a place may not start with a number at all
 */
function noAddress(err, at, value, place = false) {
  if (typeof value !== "string") return;
  if (FULL_POSTCODE.test(value) || HOUSE_NUMBER.test(value) || (place && /^\s*\d/.test(value))) {
    err(at, "a neighbourhood or postcode district only (\"Highbury, N5\"), never a house number, street address or full postcode");
  }
}

/** @param {any} site @param {Set<string>} types @param {Report} err @param {any} exists @param {boolean} mapped */
function checkProjects(site, types, err, exists, mapped) {
  const p = site.projects;
  onlyKeys(p, ["title", "intro", "items"], "projects", err);
  if (!Array.isArray(p?.items) || !p.items.length) { err("projects.items", "at least one finished project"); return; }
  ids(err, "projects.items", p.items, site.features?.includes("jobs-page"));
  p.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => checkProject(x, `projects.items[${i}]`, types, err, exists, mapped));
}

/** @param {any} x @param {string} at @param {Set<string>} types @param {Report} err @param {any} exists @param {boolean} mapped */
function checkProject(x, at, types, err, exists, mapped) {
  {
    onlyKeys(x, ["id", "place", "district", "scope", "type", "year", "weeks", "photos", "before", "during", "consent", "story"], at, err);
    if (x.during !== undefined) checkDuring(x, at, err, exists);
    text(err, `${at}.place`, x.place); text(err, `${at}.scope`, x.scope);
    noAddress(err, `${at}.place`, x.place, true); noAddress(err, `${at}.scope`, x.scope);
    for (const p of [x.story ?? []].flat()) noAddress(err, `${at}.story`, p);
    if (types.size && x.type !== undefined && !types.has(x.type)) err(`${at}.type`, `one of the buildTypes ids: ${[...types].join(", ")}`);
    const whole = (/** @type {any} */ n, /** @type {number} */ lo, /** @type {number} */ hi) => n === undefined || (Number.isInteger(n) && n > lo && n < hi);
    if (!whole(x.year, 1990, 2100)) err(`${at}.year`, "the year it was handed over");
    if (!whole(x.weeks, 0, 260)) err(`${at}.weeks`, "how many weeks it took on site, from your records");
    if (!Array.isArray(x.photos) || !x.photos.length || x.photos.length > 8) err(`${at}.photos`, "one to eight photos of the finished work");
    else x.photos.forEach((/** @type {any} */ ph, /** @type {number} */ j) => photo(err, `${at}.photos[${j}]`, ph, exists));
    if (x.before !== undefined) {
      photo(err, `${at}.before`, x.before, exists);
      if (x.consent !== true) err(`${at}.consent`, "a before photo shows a client's home: set true only when they have agreed in writing");
    }
    if (x.story !== undefined) paras(err, `${at}.story`, x.story);
    if (mapped || x.district !== undefined) checkDistrict(x.district, `${at}.district`, err);
  }
}

/** A postcode district's centre, never an address. @param {any} d @param {string} at @param {Report} err */
function checkDistrict(d, at, err) {
  if (!isObj(d)) { err(at, "the postcode district, never the address: { code, lat, lng }"); return; }
  onlyKeys(d, ["code", "lat", "lng"], at, err);
  if (!outwardCode(d.code) || outwardCode(d.code) !== d.code) err(`${at}.code`, 'the first half of the postcode only, e.g. "N5"');
  const uk = typeof d.lat === "number" && d.lat > 49 && d.lat < 61 && typeof d.lng === "number" && d.lng > -9 && d.lng < 2.5;
  if (!uk) err(at, "the district's centre in the UK, as lat and lng");
}

/** @param {any} s @param {Report} err @param {any} exists @param {boolean} modelled */
function checkStages(s, err, exists, modelled) {
  onlyKeys(s, ["title", "intro", "above", "below", "items"], "stages", err);
  text(err, "stages.title", s?.title); text(err, "stages.intro", s?.intro);
  photo(err, "stages.above", s?.above, exists); photo(err, "stages.below", s?.below, exists);
  if (!Array.isArray(s?.items) || s.items.length < 3 || s.items.length > 7) { err("stages.items", "three to seven stages, in order"); return; }
  ids(err, "stages.items", s.items);
  s.items.forEach((x, i) => {
    const at = `stages.items[${i}]`;
    onlyKeys(x, ["id", "name", "line", "model", "about", "weeks", "photo", "living"], at, err);
    if (x.living !== undefined) {
      onlyKeys(x.living, ["lines", "noisy"], `${at}.living`, err);
      if (!Array.isArray(x.living?.lines) || !x.living.lines.length || x.living.lines.some((/** @type {any} */ l) => !isStr(l))) err(`${at}.living.lines`, "what home is like at this stage, a few short lines");
      if (x.living?.noisy !== undefined && typeof x.living.noisy !== "boolean") err(`${at}.living.noisy`, "true or false");
    }
    text(err, `${at}.name`, x.name); text(err, `${at}.line`, x.line);
    weeks(err, `${at}.weeks`, x.weeks);
    if (x.about !== undefined) paras(err, `${at}.about`, x.about);
    if (x.photo !== undefined) photo(err, `${at}.photo`, x.photo, exists);
    if (modelled && !MODEL_STAGES.includes(x.model)) err(`${at}.model`, `what the 3D model shows at this stage: ${MODEL_STAGES.join(", ")}`);
    else if (x.model !== undefined && !MODEL_STAGES.includes(x.model)) err(`${at}.model`, `one of ${MODEL_STAGES.join(", ")}`);
  });
  if (modelled) {
    const order = s.items.map((/** @type {any} */ x) => MODEL_STAGES.indexOf(x.model));
    if (order.some((n, i) => i && n <= order[i - 1])) err("stages.items", "the 3D model's stages must go forward in order");
  }
}

/** @param {any} v @param {boolean} demo @param {Report} err */
function checkVisualiser(v, demo, err) {
  onlyKeys(v, ["house", "roof", "depth", "message", "rates"], "visualiser", err);
  if (v?.house !== undefined && !Object.hasOwn(HOUSES, v.house)) err("visualiser.house", `the house it opens on: ${Object.keys(HOUSES).join(", ")}`);
  if (v?.roof !== undefined && !Object.hasOwn(ROOFS, v.roof)) err("visualiser.roof", `the roof it opens on: ${Object.keys(ROOFS).join(", ")}`);
  text(err, "visualiser.message", v?.message);
  const d = v?.depth;
  if (d !== undefined) {
    onlyKeys(d, ["min", "max", "step", "start"], "visualiser.depth", err);
    const ok = isObj(d) && [d.min, d.max, d.step, d.start].every((n) => typeof n === "number")
      && d.min >= DEPTH_LIMITS.min && d.max <= DEPTH_LIMITS.max && d.min < d.max && [0.25, 0.5].includes(d.step) && d.start >= d.min && d.start <= d.max;
    if (!ok) err("visualiser.depth", `{ min, max, step, start } in metres, between ${DEPTH_LIMITS.min} and ${DEPTH_LIMITS.max}, step 0.25 or 0.5`);
  }
  if (v?.rates !== undefined) checkRates(v.rates, demo, err);
}

/** @param {any} r @param {boolean} demo @param {Report} err */
function checkRates(r, demo, err) {
  // The owner's rule: no figures until the builder gives their own rates. A demo is fictional, so it has none.
  if (demo) { err("visualiser.rates", "a demo shows no prices: rates come only from a real builder's own figures"); return; }
  onlyKeys(r, ["perM2", "vat", "checked"], "visualiser.rates", err);
  if (!isObj(r?.perM2) || !Object.keys(r.perM2).length) err("visualiser.rates.perM2", "your own £ per m² of new room, low and high, for each roof: { \"lantern\": [low, high] }");
  else for (const [k, pair] of Object.entries(r.perM2)) {
    if (!Object.hasOwn(ROOFS, k)) err(`visualiser.rates.perM2.${k}`, `a roof: ${Object.keys(ROOFS).join(", ")}`);
    if (!Array.isArray(pair) || pair.length !== 2 || !pair.every((n) => Number.isInteger(n) && n >= 500 && n <= 20000) || pair[0] > pair[1]) err(`visualiser.rates.perM2.${k}`, "[low, high] in whole pounds per m², from your own recent jobs");
  }
  if (!["included", "excluded"].includes(r?.vat)) err("visualiser.rates.vat", '"included" or "excluded"');
  if (!YM.test(r?.checked ?? "")) err("visualiser.rates.checked", "the month you last checked these rates, YYYY-MM");
}

/** @param {any} c @param {boolean} demo @param {Report} err */
function checkCredentials(c, demo, err) {
  onlyKeys(c, ["title", "intro", "updated", "items", "insurance", "guarantee", "warranties"], "credentials", err);
  (Array.isArray(c?.warranties) ? c.warranties : c?.warranties === undefined ? [] : [null]).forEach((/** @type {any} */ w, /** @type {number} */ i) => {
    onlyKeys(w, ["name", "covers", "length"], `credentials.warranties[${i}]`, err);
    text(err, `credentials.warranties[${i}].name`, w?.name); text(err, `credentials.warranties[${i}].covers`, w?.covers);
  });
  if (!YM.test(c?.updated ?? "")) err("credentials.updated", "the month you last checked these against your certificates, YYYY-MM");
  const items = Array.isArray(c?.items) ? c.items : [];
  const cover = Array.isArray(c?.insurance) ? c.insurance : [];
  if (!items.length && !cover.length) err("credentials", "at least one membership or one insurance cover, from your own certificates");
  items.forEach((x, i) => {
    const at = `credentials.items[${i}]`;
    onlyKeys(x, ["name", "number", "checkUrl"], at, err);
    text(err, `${at}.name`, x.name);
    if (x.number !== undefined) {
      if (!/^[A-Z0-9/-]{3,20}$/i.test(String(x.number))) err(`${at}.number`, "the membership or registration number as the certificate shows it");
      else if (demo && !/^0+$/.test(String(x.number))) err(`${at}.number`, "demo sites are fictional: use 000000 so no real member is named");
      else if (!demo && /^0+$/.test(String(x.number))) err(`${at}.number`, "is the demo number; use the one on your certificate");
    }
    if (x.checkUrl !== undefined && !/^https:\/\//.test(x.checkUrl)) err(`${at}.checkUrl`, "the scheme's own public register, https");
    if (demo && x.checkUrl !== undefined) err(`${at}.checkUrl`, "a demo links to no register, because its numbers are fictional");
  });
  cover.forEach((x, i) => {
    const at = `credentials.insurance[${i}]`;
    onlyKeys(x, ["cover", "amount", "insurer"], at, err);
    text(err, `${at}.cover`, x.cover);
    if (!/^£\d[\d,.]*(m| million)?$/.test(String(x.amount ?? ""))) err(`${at}.amount`, 'the limit as your certificate shows it, e.g. "£10m"');
  });
  if (c?.guarantee !== undefined) text(err, "credentials.guarantee", c.guarantee);
}

/** @param {any} b @param {Report} err */
function checkBrief(b, err) {
  onlyKeys(b, ["title", "intro", "opening", "whens", "budgets", "note", "after"], "brief", err);
  if (b?.after !== undefined && (!Array.isArray(b.after) || b.after.some((/** @type {any} */ a) => !isStr(a?.name) || !isStr(a?.line)))) err("brief.after", "what happens next, in your words: [{ name, line }]");
  text(err, "brief.title", b?.title); text(err, "brief.opening", b?.opening);
  if (!Array.isArray(b?.whens) || b.whens.length < 2 || b.whens.some((/** @type {any} */ w) => !isStr(w))) err("brief.whens", "two or more answers to \"when\", e.g. \"In the next six months\"");
  if (b?.budgets !== undefined && (!Array.isArray(b.budgets) || b.budgets.length < 2 || b.budgets.some((/** @type {any} */ w) => !isStr(w)))) err("brief.budgets", "your own budget bands, or leave out");
}

/** @param {any} p @param {any} stages @param {boolean} demo @param {Report} err */
function checkProgress(p, stages, demo, err) {
  onlyKeys(p, ["title", "intro", "source", "csvUrl", "staleAfterDays", "example"], "siteProgress", err);
  text(err, "siteProgress.title", p?.title); text(err, "siteProgress.intro", p?.intro);
  if (!Array.isArray(stages?.items)) err("stages", "the site code shows your stages: add stages");
  if (p?.source === "sheet") {
    if (!/^https:\/\/docs\.google\.com\/spreadsheets\/d\/e\/[\w-]+\/pub\?.*output=csv/.test(p.csvUrl ?? "")) err("siteProgress.csvUrl", "the sheet's published CSV link (File → Share → Publish to web → CSV)");
    if (demo) err("siteProgress.source", 'a demo uses "simulated"');
  } else if (p?.source === "simulated") {
    if (!demo) err("siteProgress.source", 'client sites read their own sheet: "sheet"');
    if (!/^[A-Z0-9]{8,12}$/.test(p.example ?? "")) err("siteProgress.example", "the demo's example code, 8 to 12 capitals and digits");
  } else err("siteProgress.source", '"sheet" or "simulated"');
  if (!(Number.isInteger(p?.staleAfterDays) && p.staleAfterDays >= 3 && p.staleAfterDays <= 31)) err("siteProgress.staleAfterDays", "after how many days without an update the page says to call (3 to 31)");
}

/** @param {any} s @param {Report} err @param {any} exists */
function checkSpec(s, err, exists) {
  onlyKeys(s, ["title", "intro", "categories", "items"], "spec", err);
  text(err, "spec.title", s?.title);
  const cats = new Set(Array.isArray(s?.categories) ? s.categories.map((/** @type {any} */ c) => c?.id) : []);
  if (!Array.isArray(s?.categories) || s.categories.length < 2) err("spec.categories", "two or more: { id, name }");
  else { ids(err, "spec.categories", s.categories); s.categories.forEach((/** @type {any} */ c, /** @type {number} */ i) => text(err, `spec.categories[${i}].name`, c.name)); }
  if (!Array.isArray(s?.items) || !s.items.length) { err("spec.items", "the materials you work with"); return; }
  ids(err, "spec.items", s.items);
  s.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `spec.items[${i}]`;
    onlyKeys(x, ["id", "name", "category", "line", "where", "photo"], at, err);
    text(err, `${at}.name`, x.name); text(err, `${at}.line`, x.line);
    if (!cats.has(x.category)) err(`${at}.category`, "one of the category ids");
    photo(err, `${at}.photo`, x.photo, exists);
  });
}

/** @param {any} c @param {Report} err @param {any} exists */
function checkCrew(c, err, exists) {
  onlyKeys(c, ["title", "intro", "people"], "crew", err);
  text(err, "crew.title", c?.title);
  if (!Array.isArray(c?.people) || !c.people.length) { err("crew.people", "the people a client will meet"); return; }
  c.people.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `crew.people[${i}]`;
    onlyKeys(x, ["name", "role", "line", "photo"], at, err);
    text(err, `${at}.name`, x.name); text(err, `${at}.role`, x.role);
    if (x.photo !== undefined) photo(err, `${at}.photo`, x.photo, exists);
  });
}

/** @param {any} j @param {Report} err @param {any} exists */
function checkJournal(j, err, exists) {
  onlyKeys(j, ["title", "intro", "items"], "journal", err);
  text(err, "journal.title", j?.title);
  if (!Array.isArray(j?.items) || !j.items.length) { err("journal.items", "at least one article, in your own words"); return; }
  ids(err, "journal.items", j.items, true);
  j.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `journal.items[${i}]`;
    onlyKeys(x, ["id", "title", "date", "author", "summary", "photo", "body", "sources"], at, err);
    text(err, `${at}.title`, x.title); text(err, `${at}.summary`, x.summary); text(err, `${at}.author`, x.author);
    if (!YMD.test(x.date ?? "")) err(`${at}.date`, "the date it was written, YYYY-MM-DD");
    photo(err, `${at}.photo`, x.photo, exists);
    paras(err, `${at}.body`, x.body);
    // Planning and building-regulation facts only from gov.uk, each with the date it was checked.
    (x.sources ?? []).forEach((/** @type {any} */ s, /** @type {number} */ k) => {
      onlyKeys(s, ["label", "url", "checked"], `${at}.sources[${k}]`, err);
      text(err, `${at}.sources[${k}].label`, s.label);
      if (!/^https:\/\/(www\.)?([a-z0-9-]+\.)*gov\.uk\//.test(s.url ?? "")) err(`${at}.sources[${k}].url`, "planning and building-regulation facts come only from gov.uk");
      if (!YMD.test(s.checked ?? "")) err(`${at}.sources[${k}].checked`, "the date you checked the page, YYYY-MM-DD");
    });
  });
}

/** The pages and tools added for Signature and Plus: costs, planning, living, reviews, the light study, the sample box. @param {any} site @param {Report} err @param {any} exists */
function checkPages(site, err, exists) {
  const c = site.costs;
  if (c !== undefined) {
    onlyKeys(c, ["title", "intro", "how", "drivers", "separate", "vat", "noRates"], "costs", err);
    text(err, "costs.title", c?.title); paras(err, "costs.how", c?.how);
    for (const k of ["drivers", "separate"]) {
      if (c?.[k] === undefined && k === "separate") continue;
      if (!Array.isArray(c?.[k]) || !c[k].length || c[k].some((/** @type {any} */ d) => !isStr(d?.name) || !isStr(d?.line))) err(`costs.${k}`, "a list of { name, line } in your words");
    }
    // Words only: a figure on this page must come from the builder's rates (visualiser.rates), never typed in.
    const words = JSON.stringify(c);
    if (/£\s?\d/.test(words)) err("costs", "no pound figures here: your own rates go in visualiser.rates and show as a table");
    if (site.mode === "client" && !site.visualiser?.rates) text(err, "costs.noRates", c?.noRates);
  }
  checkMorePages(site, err, exists);
}

/** @param {any} site @param {Report} err @param {any} exists */
function checkMorePages(site, err, exists) {
  const pp = site.planningPage;
  if (pp !== undefined) { onlyKeys(pp, ["title", "intro", "help"], "planningPage", err); text(err, "planningPage.title", pp?.title); if (pp?.help !== undefined) paras(err, "planningPage.help", pp.help); }
  const lp = site.livingPage;
  if (lp !== undefined) {
    onlyKeys(lp, ["title", "intro", "tips"], "livingPage", err); text(err, "livingPage.title", lp?.title);
    if (lp?.tips !== undefined && (!Array.isArray(lp.tips) || lp.tips.some((/** @type {any} */ t) => !isStr(t)))) err("livingPage.tips", "a list of short tips in your words");
  }
  checkReviewsPage(site.reviewsPage, err, exists);
  checkTools(site, err);
  checkLoftAndSurvey(site, err, exists);
  if (site.neighbours !== undefined) checkNeighbours(site.neighbours, site.mode === "demo", err);
}

/** The loft page and the survey checklist. @param {any} site @param {Report} err @param {any} exists */
function checkLoftAndSurvey(site, err, exists) {
  const lp = site.loftPage;
  if (lp !== undefined) {
    onlyKeys(lp, ["title", "intro", "photo", "rulesTitle", "message"], "loftPage", err);
    text(err, "loftPage.title", lp?.title); text(err, "loftPage.rulesTitle", lp?.rulesTitle);
    photo(err, "loftPage.photo", lp?.photo, exists);
  }
  const sv = site.surveyPage;
  if (sv !== undefined) {
    onlyKeys(sv, ["title", "intro", "start", "message"], "surveyPage", err); text(err, "surveyPage.title", sv?.title);
    if (!Object.hasOwn(HOUSE_AGES, sv?.start ?? "")) err("surveyPage.start", `the age the list opens on: ${Object.keys(HOUSE_AGES).join(", ")}`);
  }
}

/**
 * For our neighbours: the live sites by district only (the id is the district and one word, so it can't be a street),
 * the builder's own hours and words, and this week from their published sheet.
 * @param {any} nb @param {boolean} demo @param {Report} err
 */
function checkNeighbours(nb, demo, err) {
  onlyKeys(nb, ["title", "intro", "hours", "promises", "reach", "message", "source", "csvUrl", "staleAfterDays", "sites"], "neighbours", err);
  text(err, "neighbours.title", nb?.title); text(err, "neighbours.reach", nb?.reach); text(err, "neighbours.message", nb?.message);
  const lines = (/** @type {any} */ v) => Array.isArray(v) && v.length > 0 && v.length <= 6 && v.every(isStr);
  if (!lines(nb?.hours)) err("neighbours.hours", "your working hours as one to six short lines, as you'd tell a neighbour");
  if (nb?.promises !== undefined && !lines(nb.promises)) err("neighbours.promises", "one to six short lines in your words");
  checkNeighbourSheet(nb, demo, err);
  checkNeighbourSites(nb?.sites, err);
}

/** The week's news: the client's own published sheet, or simulated on a demo. @param {any} nb @param {boolean} demo @param {Report} err */
function checkNeighbourSheet(nb, demo, err) {
  if (nb?.source === "sheet") {
    if (!/^https:\/\/docs\.google\.com\/spreadsheets\/d\/e\/[\w-]+\/pub\?.*output=csv/.test(nb.csvUrl ?? "")) err("neighbours.csvUrl", "the sheet's published CSV link (File → Share → Publish to web → CSV)");
    if (demo) err("neighbours.source", 'a demo uses "simulated"');
  } else if (nb?.source === "simulated") {
    if (!demo) err("neighbours.source", 'client sites read their own sheet: "sheet"');
  } else err("neighbours.source", '"sheet" or "simulated"');
  if (!(Number.isInteger(nb?.staleAfterDays) && nb.staleAfterDays >= 3 && nb.staleAfterDays <= 31)) err("neighbours.staleAfterDays", "after how many days without news the page says to call (3 to 31)");
}

/** @param {any} sites @param {Report} err */
function checkNeighbourSites(sites, err) {
  if (!Array.isArray(sites) || !sites.length || sites.length > 12) { err("neighbours.sites", "one to twelve live sites: { id, district, work, from, to }"); return; }
  const seen = new Set();
  sites.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `neighbours.sites[${i}]`;
    onlyKeys(x, ["id", "district", "work", "from", "to"], at, err);
    checkDistrict(x?.district, `${at}.district`, err);
    const code = String(x?.district?.code ?? "").toLowerCase();
    if (!new RegExp(`^${code.replace(/[^a-z0-9]/g, "")}-[a-z]{2,16}$`).test(x?.id ?? "")) err(`${at}.id`, `the district and one short word, e.g. "${code || "n5"}-rear": never a street or a house name`);
    else if (seen.has(x.id)) err(`${at}.id`, "used twice"); else seen.add(x.id);
    text(err, `${at}.work`, x?.work);
    if (!YM.test(x?.from ?? "") || !YM.test(x?.to ?? "") || x.to < x.from) err(at, "from and to as year and month, e.g. \"2026-09\" to \"2027-02\"");
  });
}

/** @param {any} rp @param {Report} err @param {any} exists */
function checkReviewsPage(rp, err, exists) {
  if (rp === undefined) return;
  onlyKeys(rp, ["title", "intro", "photo", "googleUrl"], "reviewsPage", err); text(err, "reviewsPage.title", rp?.title);
  if (rp?.photo !== undefined) photo(err, "reviewsPage.photo", rp.photo, exists);
  if (rp?.googleUrl !== undefined && !/^https:\/\//.test(rp.googleUrl)) err("reviewsPage.googleUrl", "your Google reviews link, https");
}

/** The light study and the sample box. @param {any} site @param {Report} err */
function checkTools(site, err) {
  const ls = site.lightStudy;
  if (ls !== undefined) {
    onlyKeys(ls, ["title", "intro", "facing", "places"], "lightStudy", err); text(err, "lightStudy.title", ls?.title);
    if (ls?.facing !== undefined && !Object.hasOwn(FACINGS, ls.facing)) err("lightStudy.facing", `the way the garden faces to start with: ${Object.keys(FACINGS).join(", ")}`);
    if (!Array.isArray(ls?.places) || !ls.places.length || ls.places.length > 12) err("lightStudy.places", "one to twelve postcode districts you work in: { code, lat, lng }");
    else ls.places.forEach((/** @type {any} */ p, /** @type {number} */ i) => checkDistrict(p, `lightStudy.places[${i}]`, err));
  }
  const sb = site.sampleBox;
  if (sb !== undefined) {
    onlyKeys(sb, ["title", "intro", "max", "message"], "sampleBox", err); text(err, "sampleBox.title", sb?.title); text(err, "sampleBox.message", sb?.message);
    if (!(Number.isInteger(sb?.max) && sb.max >= 1 && sb.max <= 12)) err("sampleBox.max", "how many finishes one box can hold, 1 to 12");
  }
}

/** Photos during the work: up to four, each with an optional caption, and only with the client's consent. @param {any} x @param {string} at @param {Report} err @param {any} exists */
function checkDuring(x, at, err, exists) {
  if (!Array.isArray(x.during) || x.during.length > 4) err(`${at}.during`, "up to four photos taken during the work");
  else x.during.forEach((/** @type {any} */ ph, /** @type {number} */ j) => { const { caption, ...rest } = ph ?? {}; photo(err, `${at}.during[${j}]`, rest, exists); if (caption !== undefined && !isStr(caption)) err(`${at}.during[${j}].caption`, "a short line"); });
  if (x.consent !== true) err(`${at}.consent`, "photos of a client's home during the work: set true only when they have agreed in writing");
}
