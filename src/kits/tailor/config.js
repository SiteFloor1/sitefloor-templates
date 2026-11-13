// @ts-check
/**
 * Validation for the tailor kit (bespoke tailors): the hero's two photographs, what the house makes and its "from"
 * prices, the commission's steps, the cloth book, trunk shows, "your commission, by code", the style lexicon and the
 * wedding order-by. Every figure (prices, weights, weeks, fittings) is the house's own; the checks only make sure it is
 * complete and can't mislead.
 */
import { SEASONS } from "./lib/tailor.js";
import { KINDS } from "./lib/lexicon.js";
import { isYmd } from "../../core/lib/diary.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @typedef {((rel: string) => boolean)|undefined} Exists */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const ID = /^[a-z0-9-]{1,40}$/;
const PAGE_HEAD = ["kicker", "title", "intro"];

/** @param {Report} err @param {string} path @param {any} v */
function text(err, path, v) { if (!isStr(v)) err(path, "required text is missing"); }

/** A misspelt setting is refused, not silently ignored. @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (isObj(o)) for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}

/** @param {Report} err @param {string} path @param {any} p @param {Exists} exists @param {boolean} [needsAlt] */
function photo(err, path, p, exists, needsAlt = true) {
  if (!isObj(p)) { err(path, "a photo: { src, width, height, alt }"); return; }
  onlyKeys(p, ["src", "width", "height", "alt", "caption"], path, err);
  if (needsAlt) text(err, `${path}.alt`, p.alt);
  if (!Number.isInteger(p.width) || !Number.isInteger(p.height)) err(path, "width and height in pixels");
  if (!isStr(p.src)) err(`${path}.src`, "required");
  else if (exists && !exists(p.src)) err(`${path}.src`, `file not found: ${p.src}`);
}

/** Unique ids in a list. @param {Report} err @param {string} path @param {any[]} list @returns {string[]} */
function ids(err, path, list) {
  const seen = new Set();
  list.forEach((x, i) => {
    if (!ID.test(x?.id ?? "")) err(`${path}[${i}].id`, "lowercase letters, numbers and dashes");
    else if (seen.has(x.id)) err(`${path}[${i}].id`, `"${x.id}" is used twice`);
    seen.add(x?.id);
  });
  return [...seen].filter(Boolean);
}

/** @param {any} o @param {string} at @param {Report} err */
function pageHead(o, at, err) { onlyKeys(o, PAGE_HEAD, at, err); text(err, `${at}.title`, o?.title); }

/** @param {any} site @param {Report} err @param {Exists} [exists] */
export function checkTailor(site, err, exists) {
  if (site.kit !== "tailor") return;
  checkHero(site.hero, err, exists);
  if (site.garments !== undefined) checkGarments(site.garments, err);
  const steps = site.process !== undefined ? checkProcess(site.process, err, exists) : [];
  const cloths = site.cloths !== undefined ? checkCloths(site.cloths, err, exists) : [];
  if (site.travels !== undefined) checkTravels(site.travels, err);
  if (site.commission !== undefined) checkCommission(site.commission, site.process, steps, cloths, site.mode, err);
  if (site.lexicon !== undefined) checkLexicon(site.lexicon, err, exists);
  if (site.weddingOrder !== undefined) checkWeddingOrder(site.weddingOrder, err, exists);
  if (site.fittingReminder !== undefined) checkReminder(site.fittingReminder, site.weddingOrder, err);
  if (site.spec !== undefined) checkSpec(site.spec, err, exists, site.garments);
  if (site.garmentPages !== undefined) checkGarmentPages(site.garmentPages, err, exists);
  if (site.explained !== undefined) checkExplained(site.explained, err);
  if (site.journal !== undefined) checkJournal(site.journal, err, exists);
  checkSimplePages(site, err, exists);
  for (const k of ["clothPage", "processPage", "travelsPage"]) if (site[k] !== undefined) pageHead(site[k], k, err);
  checkSlugs(site, err);
}

/** The cut on the board and the coat on its stand. @param {any} h @param {Report} err @param {Exists} exists */
function checkHero(h, err, exists) {
  if (h === undefined) return;
  if (!isObj(h)) { err("hero", "{ kicker, title, cut, cutPhone, stand }"); return; }
  if (h.cut === undefined && h.stand === undefined) return; // a hero from another look's settings is checked there
  onlyKeys(h, ["kicker", "title", "intro", "cut", "cutPhone", "stand"], "hero", err);
  text(err, "hero.title", h.title);
  photo(err, "hero.cut", h.cut, exists);
  photo(err, "hero.cutPhone", h.cutPhone, exists, false);
  photo(err, "hero.stand", h.stand, exists);
}

/** What the house makes, each with the house's own "from" price or none. @param {any} g @param {Report} err */
function checkGarments(g, err) {
  if (!isObj(g) || !Array.isArray(g.items) || !g.items.length) { err("garments.items", "at least one garment, e.g. { id: \"suit\", name: \"Two-piece suit\", from: 4200 }"); return; }
  onlyKeys(g, ["message", "items", "times", "note"], "garments", err);
  text(err, "garments.message", g.message);
  ids(err, "garments.items", g.items);
  g.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    onlyKeys(x, ["id", "name", "from", "text"], `garments.items[${i}]`, err);
    text(err, `garments.items[${i}].name`, x?.name);
    if (x?.from !== null && !(Number.isInteger(x?.from) && x.from > 0)) err(`garments.items[${i}].from`, "the house's starting price in whole pounds, or null to price it at the appointment");
  });
  if (g.times !== undefined && (!Array.isArray(g.times) || !g.times.every(isStr))) err("garments.times", "a list of choices, e.g. [\"A weekday morning\", \"A Saturday\"]");
}

/** The commission's steps, in order. @param {any} p @param {Report} err @param {Exists} exists @returns {string[]} */
function checkProcess(p, err, exists) {
  if (!isObj(p) || !Array.isArray(p.steps) || p.steps.length < 2) { err("process.steps", "the house's steps in order, e.g. { id: \"cut\", name: \"Cut\", text: \"…\" }"); return []; }
  onlyKeys(p, ["steps"], "process", err);
  const out = ids(err, "process.steps", p.steps);
  p.steps.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    onlyKeys(s, ["id", "name", "text", "more", "photo"], `process.steps[${i}]`, err);
    text(err, `process.steps[${i}].name`, s?.name);
    text(err, `process.steps[${i}].text`, s?.text);
    if (s?.photo !== undefined) photo(err, `process.steps[${i}].photo`, s.photo, exists);
  });
  return out;
}

/** The cloth book: each length's photograph, its weave full screen, and the house's words. @param {any} c @param {Report} err @param {Exists} exists @returns {string[]} */
function checkCloths(c, err, exists) {
  if (!isObj(c) || !Array.isArray(c.items) || c.items.length < 2) { err("cloths.items", "at least two cloths"); return []; }
  onlyKeys(c, ["message", "note", "items"], "cloths", err);
  text(err, "cloths.message", c.message);
  const out = ids(err, "cloths.items", c.items);
  c.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `cloths.items[${i}]`;
    onlyKeys(x, ["id", "name", "cloth", "weight", "seasons", "drop", "length", "weave", "weavePhone"], p, err);
    text(err, `${p}.name`, x?.name);
    text(err, `${p}.cloth`, x?.cloth);
    if (x?.weight !== undefined && !(Number.isInteger(x.weight) && x.weight >= 120 && x.weight <= 900)) err(`${p}.weight`, "grams per metre as the house gives it (120–900), or leave it out");
    if (!Array.isArray(x?.seasons) || !x.seasons.length || !x.seasons.every((/** @type {string} */ s) => s in SEASONS)) err(`${p}.seasons`, `one or more of ${Object.keys(SEASONS).join(", ")}`);
    if (x?.drop !== undefined && !(typeof x.drop === "number" && x.drop >= 0.6 && x.drop <= 1)) err(`${p}.drop`, "how far the length hangs, 0.6–1");
    photo(err, `${p}.length`, x?.length, exists);
    photo(err, `${p}.weave`, x?.weave, exists, false);
    photo(err, `${p}.weavePhone`, x?.weavePhone, exists, false);
  });
  return out;
}

/** @param {any} t @param {Report} err */
function checkTravels(t, err) {
  if (!isObj(t) || !Array.isArray(t.items)) { err("travels.items", "a list (it may be empty between trips)"); return; }
  onlyKeys(t, ["message", "items"], "travels", err);
  text(err, "travels.message", t.message);
  ids(err, "travels.items", t.items);
  t.items.forEach((/** @type {any} */ e, /** @type {number} */ i) => {
    const p = `travels.items[${i}]`;
    onlyKeys(e, ["id", "city", "venue", "from", "to", "text"], p, err);
    for (const k of ["city", "venue"]) text(err, `${p}.${k}`, e?.[k]);
    if (!isYmd(e?.from) || !isYmd(e?.to)) err(p, "from and to, real dates, YYYY-MM-DD");
    else if (e.to < e.from) err(`${p}.to`, "ends before it starts");
  });
}

/**
 * "Your commission, by code": a published sheet on a client site, simulated only on a demo. Its stages are the
 * process's own steps, each with a photograph. @param {any} c @param {any} process @param {string[]} steps
 * @param {string[]} cloths @param {string} mode @param {Report} err
 */
function checkCommission(c, process, steps, cloths, mode, err) {
  if (!isObj(c)) { err("commission", "an object; see src/kits/tailor/features/commission/README.md"); return; }
  onlyKeys(c, ["source", "csvUrl", "staleAfterDays", "stages", "fittingMinutes", "example"], "commission", err);
  checkSource(c, mode, err);
  if (c.staleAfterDays !== undefined && !(Number.isInteger(c.staleAfterDays) && c.staleAfterDays >= 1 && c.staleAfterDays <= 60)) err("commission.staleAfterDays", "whole days, 1–60");
  if (c.fittingMinutes !== undefined && !(Number.isInteger(c.fittingMinutes) && c.fittingMinutes >= 15 && c.fittingMinutes <= 180)) err("commission.fittingMinutes", "how long a fitting takes, 15–180 minutes");
  checkStages(c.stages, process, steps, err);
  if (c.example !== undefined && mode !== "demo") err("commission.example", "a demo's sample code only");
  if (mode === "demo" && !/^[A-Z0-9]{8,12}$/.test(c.example ?? "")) err("commission.example", "the demo's sample code, 8–12 capital letters and numbers");
  if (cloths.length === 0 && c.source === "sheet") err("cloths", "the commission names its cloth from the cloth book; add cloths");
}

/** Where the commission comes from: the house's published sheet, or simulated on a demo. @param {any} c @param {string} mode @param {Report} err */
function checkSource(c, mode, err) {
  if (!["sheet", "simulated"].includes(c.source)) err("commission.source", '"sheet" or "simulated"');
  if (c.source === "simulated" && mode !== "demo") err("commission.source", "simulated data is for demos; a client site reads the house's sheet");
  if (c.source === "sheet" && !/^https:\/\/docs\.google\.com\/spreadsheets\/d\/e\/[\w-]+\/pub\?(.+&)?output=csv/.test(c.csvUrl ?? "")) err("commission.csvUrl", "the sheet published to the web as CSV (https://docs.google.com/spreadsheets/d/e/…/pub?…output=csv)");
}

/** The commission's stages are the process's own steps, each with a photograph. @param {any} stages @param {any} process @param {string[]} steps @param {Report} err */
function checkStages(stages, process, steps, err) {
  if (!Array.isArray(stages) || stages.length < 2) { err("commission.stages", "two or more of the process's step ids, in order"); return; }
  stages.forEach((/** @type {string} */ id, /** @type {number} */ i) => {
    if (!steps.includes(id)) err(`commission.stages[${i}]`, `one of the process's step ids (${steps.join(", ") || "add process.steps first"})`);
    else if (!process.steps.find((/** @type {any} */ s) => s.id === id)?.photo) err(`commission.stages[${i}]`, `process step "${id}" needs a photo to show in the commission`);
  });
}

/** @param {any} l @param {Report} err @param {Exists} exists */
function checkLexicon(l, err, exists) {
  if (!isObj(l) || !Array.isArray(l.items) || l.items.length < 3) { err("lexicon.items", "at least three words, e.g. { id: \"peak\", term: \"Peak lapel\", kind: \"lapel\", text: \"…\" }"); return; }
  onlyKeys(l, [...PAGE_HEAD, "items"], "lexicon", err);
  text(err, "lexicon.title", l.title);
  ids(err, "lexicon.items", l.items);
  l.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `lexicon.items[${i}]`;
    onlyKeys(x, ["id", "term", "kind", "text", "photo"], p, err);
    text(err, `${p}.term`, x?.term);
    text(err, `${p}.text`, x?.text);
    if (!(x?.kind in KINDS)) err(`${p}.kind`, `one of ${Object.keys(KINDS).join(", ")}`);
    if (x?.photo !== undefined) photo(err, `${p}.photo`, x.photo, exists);
  });
}

/** The house's timings, in weeks before the wedding. @param {any} w @param {Report} err @param {Exists} exists */
function checkWeddingOrder(w, err, exists) {
  if (!isObj(w) || !Array.isArray(w.steps) || !w.steps.length) { err("weddingOrder.steps", "the house's steps, e.g. { id: \"start\", label: \"First appointment\", weeksBefore: 16 }"); return; }
  onlyKeys(w, [...PAGE_HEAD, "photo", "orderStep", "late", "steps", "party"], "weddingOrder", err);
  if (w.party !== undefined) checkParty(w.party, err);
  text(err, "weddingOrder.title", w.title);
  text(err, "weddingOrder.late", w.late);
  ids(err, "weddingOrder.steps", w.steps);
  w.steps.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    onlyKeys(s, ["id", "label", "weeksBefore", "note"], `weddingOrder.steps[${i}]`, err);
    text(err, `weddingOrder.steps[${i}].label`, s?.label);
    if (!Number.isInteger(s?.weeksBefore) || s.weeksBefore < 0 || s.weeksBefore > 104) err(`weddingOrder.steps[${i}].weeksBefore`, "whole weeks before the wedding, 0–104");
  });
  if (!w.steps.some((/** @type {any} */ s) => s?.id === w.orderStep)) err("weddingOrder.orderStep", "the id of the step that is the last day to start");
  if (w.photo !== undefined) photo(err, "weddingOrder.photo", w.photo, exists);
}

/** The plain pages: a page head, a photograph, and for the re-order slip its message and note. @param {any} site @param {Report} err @param {Exists} exists */
function checkSimplePages(site, err, exists) {
  if (site.voucherPage !== undefined) { onlyKeys(site.voucherPage, [...PAGE_HEAD, "photo"], "voucherPage", err); text(err, "voucherPage.title", site.voucherPage?.title); if (site.voucherPage?.photo !== undefined) photo(err, "voucherPage.photo", site.voucherPage.photo, exists); }
  if (site.reorder !== undefined) { onlyKeys(site.reorder, [...PAGE_HEAD, "message", "note", "photo"], "reorder", err); for (const k of ["title", "message", "note"]) text(err, `reorder.${k}`, site.reorder?.[k]); if (site.reorder?.photo !== undefined) photo(err, "reorder.photo", site.reorder.photo, exists); }
}

/**
 * The evening-before reminder in the fitting calendar files: when it sounds (16:00–21:00, the house's time) and what
 * to bring, in the house's words; on the wedding planner, for the steps listed.
 * @param {any} r @param {any} w @param {Report} err
 */
function checkReminder(r, w, err) {
  if (!isObj(r)) { err("fittingReminder", "{ at: \"18:00\", items: [\"the shoes you'll wear with it\"], weddingSteps: [\"baste\"] }"); return; }
  onlyKeys(r, ["at", "items", "weddingSteps"], "fittingReminder", err);
  const m = /^(\d{2}):(\d{2})$/.exec(r.at ?? "");
  if (!m || Number(m[1]) < 16 || Number(m[1]) > 21 || Number(m[2]) > 59) err("fittingReminder.at", "a time the evening before, 16:00 to 21:59, e.g. \"18:00\"");
  if (!Array.isArray(r.items) || r.items.length > 5 || r.items.some((/** @type {any} */ x) => !isStr(x) || !x.trim() || x.length > 60)) err("fittingReminder.items", "up to 5 short things to bring, each under 60 characters, written to follow \"Bring\"");
  if (r.weddingSteps !== undefined) {
    const stepIds = (w?.steps ?? []).map((/** @type {any} */ s) => s?.id);
    if (!Array.isArray(r.weddingSteps) || r.weddingSteps.some((/** @type {any} */ id) => !stepIds.includes(id))) err("fittingReminder.weddingSteps", `ids from weddingOrder.steps (${stepIds.join(", ") || "none"})`);
  }
}

/** The party rule: the extra weeks a larger party starts earlier, the house's own. @param {any} p @param {Report} err */
function checkParty(p, err) {
  if (!isObj(p)) { err("weddingOrder.party", "{ max, rules: [{ from, extraWeeks }] }"); return; }
  onlyKeys(p, ["max", "rules"], "weddingOrder.party", err);
  if (!Number.isInteger(p.max) || p.max < 2 || p.max > 20) err("weddingOrder.party.max", "the largest party the house dresses, 2–20");
  if (!Array.isArray(p.rules)) { err("weddingOrder.party.rules", "a list, e.g. [{ from: 4, extraWeeks: 2 }] (may be empty)"); return; }
  p.rules.forEach((/** @type {any} */ r, /** @type {number} */ i) => {
    onlyKeys(r, ["from", "extraWeeks"], `weddingOrder.party.rules[${i}]`, err);
    if (!Number.isInteger(r?.from) || r.from < 2) err(`weddingOrder.party.rules[${i}].from`, "a party size, 2 or more");
    if (!Number.isInteger(r?.extraWeeks) || r.extraWeeks < 0 || r.extraWeeks > 26) err(`weddingOrder.party.rules[${i}].extraWeeks`, "whole weeks, 0–26");
  });
}

/** The specification card: every option is a real photograph of a detail the house makes. @param {any} sp @param {Report} err @param {Exists} exists @param {any} garments */
function checkSpec(sp, err, exists, garments) {
  if (!isObj(sp) || !Array.isArray(sp.groups) || sp.groups.length < 2 || sp.groups.length > 6) { err("spec.groups", "2–6 groups of choices, e.g. { id: \"lapel\", name: \"Lapel\", options: […] }"); return; }
  onlyKeys(sp, [...PAGE_HEAD, "message", "note", "groups"], "spec", err);
  text(err, "spec.title", sp.title);
  text(err, "spec.message", sp.message);
  text(err, "spec.note", sp.note);
  const gids = ids(err, "spec.groups", sp.groups);
  const garmentIds = (garments?.items ?? []).map((/** @type {any} */ x) => x?.id);
  if (gids.includes("cloth") || gids.includes("garment")) err("spec.groups", "\"cloth\" and \"garment\" come from the cloth book and what the house makes; use other ids");
  sp.groups.forEach((/** @type {any} */ g, /** @type {number} */ i) => {
    const p = `spec.groups[${i}]`;
    onlyKeys(g, ["id", "name", "options", "for"], p, err);
    if (g?.for !== undefined && (!Array.isArray(g.for) || !g.for.length || g.for.some((/** @type {any} */ id) => !garmentIds.includes(id)))) err(`${p}.for`, `garment ids from garments.items (${garmentIds.join(", ") || "none"})`);
    text(err, `${p}.name`, g?.name);
    if (!Array.isArray(g?.options) || g.options.length < 2 || g.options.length > 5) { err(`${p}.options`, "2–5 options, each with a photograph"); return; }
    ids(err, `${p}.options`, g.options);
    g.options.forEach((/** @type {any} */ o, /** @type {number} */ j) => {
      onlyKeys(o, ["id", "label", "text", "photo"], `${p}.options[${j}]`, err);
      text(err, `${p}.options[${j}].label`, o?.label);
      photo(err, `${p}.options[${j}].photo`, o?.photo, exists);
    });
  });
}

const PAGE_TEXT = ["slug", "kicker", "title", "intro", "description"];

/** A page in a collection: its slug, title and the one sentence Google shows. @param {any} x @param {string} p @param {Report} err */
function pageItem(x, p, err) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(x?.slug ?? "")) err(`${p}.slug`, "lowercase words and dashes");
  text(err, `${p}.title`, x?.title);
  if (!isStr(x?.description) || x.description.length > 160) err(`${p}.description`, "one sentence, up to 160 characters");
}

/** @param {any} g @param {Report} err @param {Exists} exists */
function checkGarmentPages(g, err, exists) {
  if (!isObj(g) || !Array.isArray(g.items) || !g.items.length) { err("garmentPages.items", "at least one garment page"); return; }
  onlyKeys(g, [...PAGE_HEAD, "items"], "garmentPages", err);
  text(err, "garmentPages.title", g.title);
  g.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `garmentPages.items[${i}]`;
    onlyKeys(x, [...PAGE_TEXT, "garment", "photo", "body", "details", "cloths"], p, err);
    pageItem(x, p, err);
    text(err, `${p}.body`, x?.body);
    photo(err, `${p}.photo`, x?.photo, exists);
    (x?.details ?? []).forEach((/** @type {any} */ d, /** @type {number} */ j) => { onlyKeys(d, ["label", "value"], `${p}.details[${j}]`, err); text(err, `${p}.details[${j}].label`, d?.label); text(err, `${p}.details[${j}].value`, d?.value); });
  });
}

/** General facts must say where they come from. @param {any} e @param {Report} err */
function checkExplained(e, err) {
  if (!isObj(e)) { err("explained", "an object"); return; }
  onlyKeys(e, [...PAGE_HEAD, "checked", "rows", "sections", "sources"], "explained", err);
  text(err, "explained.title", e.title);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(e.checked ?? "")) err("explained.checked", "the month the sources were checked, YYYY-MM");
  if (!Array.isArray(e.rows) || e.rows.length < 2) err("explained.rows", "at least two rows: { label, bespoke, mtm, rtw }");
  else e.rows.forEach((/** @type {any} */ r, /** @type {number} */ i) => { onlyKeys(r, ["label", "bespoke", "mtm", "rtw"], `explained.rows[${i}]`, err); for (const k of ["label", "bespoke", "mtm", "rtw"]) text(err, `explained.rows[${i}].${k}`, r?.[k]); });
  (e.sections ?? []).forEach((/** @type {any} */ s, /** @type {number} */ i) => { onlyKeys(s, ["heading", "body"], `explained.sections[${i}]`, err); text(err, `explained.sections[${i}].heading`, s?.heading); text(err, `explained.sections[${i}].body`, s?.body); });
  if (!Array.isArray(e.sources) || !e.sources.length) err("explained.sources", "where the general facts come from: { label, url }");
  else e.sources.forEach((/** @type {any} */ s, /** @type {number} */ i) => { onlyKeys(s, ["label", "url", "note"], `explained.sources[${i}]`, err); text(err, `explained.sources[${i}].label`, s?.label); if (!/^https:\/\//.test(s?.url ?? "")) err(`explained.sources[${i}].url`, "an https link"); });
}

/** @param {any} j @param {Report} err @param {Exists} exists */
function checkJournal(j, err, exists) {
  if (!isObj(j) || !Array.isArray(j.items) || !j.items.length) { err("journal.items", "at least one article"); return; }
  onlyKeys(j, [...PAGE_HEAD, "note", "items"], "journal", err);
  text(err, "journal.title", j.title);
  j.items.forEach((/** @type {any} */ a, /** @type {number} */ i) => {
    const p = `journal.items[${i}]`;
    onlyKeys(a, ["slug", "title", "date", "author", "summary", "photo", "body", "sources"], p, err);
    pageItem({ ...a, description: a?.summary }, p, err);
    if (!isYmd(a?.date)) err(`${p}.date`, "the date it was written, YYYY-MM-DD");
    text(err, `${p}.body`, a?.body);
    photo(err, `${p}.photo`, a?.photo, exists);
    (a?.sources ?? []).forEach((/** @type {any} */ s, /** @type {number} */ k) => { onlyKeys(s, ["label", "url"], `${p}.sources[${k}]`, err); if (!/^https:\/\//.test(s?.url ?? "")) err(`${p}.sources[${k}].url`, "an https link"); });
  });
}

/** Pages every site has, and this kit's own, can't be reused as a collection's slug. */
const TAKEN = ["index", "privacy", "visit", "from-your-pattern", "404", "cloth", "process", "trunk-shows", "weddings", "lexicon", "team", "bespoke", "journal", "vouchers", "specification", "article", "garment", "what-we-make"];

/** @param {any} site @param {Report} err */
function checkSlugs(site, err) {
  const seen = new Set([...TAKEN, ...(site.pages ?? []).map((/** @type {any} */ p) => p.slug)]);
  for (const [key, list] of /** @type {[string, any[]][]} */ ([["garmentPages", site.garmentPages?.items ?? []], ["journal", site.journal?.items ?? []]])) {
    list.forEach((x, i) => {
      if (seen.has(x?.slug)) err(`${key}.items[${i}].slug`, `"${x.slug}" is already a page`);
      seen.add(x?.slug);
    });
  }
}
