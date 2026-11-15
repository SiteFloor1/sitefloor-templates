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
export const RESERVED = ["index", "fees", "owners", "residences", "privacy", "404"];

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
  const on = (/** @type {string} */ id) => Array.isArray(site.features) && site.features.includes(id);
  if (!on("letting-fees")) err("features", '"letting-fees" is required on every letting agent\'s site: fees must be shown prominently (Consumer Rights Act 2015, s.83)');
  checkHero(site.hero, err, exists);
  checkSchemes(site.schemes, site.mode, err, exists);
  checkFees(site.fees, err);
  if (site.homes !== undefined) checkHomes(site, err);
  if (site.owners !== undefined) checkOwners(site.owners, err);
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
