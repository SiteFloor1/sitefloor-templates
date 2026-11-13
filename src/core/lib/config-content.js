// @ts-check
/**
 * Checks for the copy and menu blocks of site.json: the things that, if
 * missing, would build a site with blank headings, empty WhatsApp messages or
 * a price calculator that breaks. Used by validateSite in config.js.
 */
import { getFeature } from "../../features/registry.js";

/** @typedef {(path: string, msg: string) => void} Report */

/** schema.org types the kits use. Add to this list when a new trade needs one. */
export const SCHEMA_TYPES = [
  "LocalBusiness", "BarberShop", "HairSalon", "BeautySalon", "NailSalon", "DaySpa", "Restaurant", "CafeOrCoffeeShop",
  "Bakery", "ClothingStore", "JewelryStore", "Florist", "Electrician", "Plumber", "HVACBusiness", "AutoRepair", "AutoWash", "AutoBodyShop",
  "ParkingFacility", "SelfStorage", "ExerciseGym", "HealthClub", "SportsActivityLocation", "ProfessionalService",
  "LegalService", "FinancialService", "TattooParlor", "PetStore", "MovingCompany", "HousePainter", "RoofingContractor", "Locksmith", "GeneralContractor",
  "Dentist",
];

/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

/** An in-page anchor, a site path, or an https link. Never javascript:, data: or http:. @param {any} v */
export const isSafeHref = (v) => typeof v === "string" && /^(#[\w-]*|\/(?!\/)[^\s]*|https:\/\/[^\s]+)$/.test(v);

/**
 * Hero, navigation, messages and the heading copy for every enabled feature.
 * @param {any} site @param {Report} err
 */
export function checkCopy(site, err) {
  checkHero(site.hero, err);
  checkNav(site.nav, err);
  if (!isStr(site.messages?.general)) err("messages.general", "the pre-filled WhatsApp message for Book buttons");
  for (const id of Array.isArray(site.features) ? site.features : []) {
    const key = getFeature(id)?.section;
    if (key && !isStr(site.sections?.[key]?.title)) err(`sections.${key}.title`, `heading for "${id}" is missing`);
  }
  if (site.team !== undefined && !isStr(site.team?.title)) err("team.title", "heading for the team page is missing");
}

/** @param {any} h @param {Report} err */
function checkHero(h, err) {
  if (!isObj(h)) { err("hero", "required"); return; }
  for (const k of ["kicker", "title", "intro"]) if (!isStr(h[k])) err(`hero.${k}`, "required text is missing");
  (h.stats ?? []).forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    if (!Array.isArray(s) || s.length !== 2 || !isStr(s[0]) || !isStr(s[1])) err(`hero.stats[${i}]`, 'must be ["value", "label"], e.g. ["4", "barbers"]');
  });
  const cta = h.secondaryCta;
  if (cta !== undefined && (!isStr(cta?.label) || !isSafeHref(cta?.href))) err("hero.secondaryCta", "needs a label and an href (#anchor, /page or https://)");
}

/** @param {any} nav @param {Report} err */
function checkNav(nav, err) {
  if (!Array.isArray(nav) || nav.length === 0) { err("nav", "at least one link"); return; }
  nav.forEach((/** @type {any} */ n, /** @type {number} */ i) => {
    if (!isStr(n?.label)) err(`nav[${i}].label`, "required text is missing");
    if ((n?.href === undefined) === (n?.page === undefined)) err(`nav[${i}]`, 'needs exactly one of "href" or "page"');
    else if (n.href !== undefined && !isSafeHref(n.href)) err(`nav[${i}].href`, "must be #anchor, /path or https://");
  });
}

/**
 * Services and extras feed the cut builder's prices and times.
 * @param {any} site @param {Report} err
 */
export function checkMenu(site, err) {
  for (const key of ["services", "extras"]) {
    const list = site[key];
    if (list === undefined) continue;
    if (!Array.isArray(list) || list.length === 0) { err(key, "must be a non-empty list"); continue; }
    const ids = new Set();
    list.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
      const p = `${key}[${i}]`;
      if (!/^[a-z0-9-]+$/.test(s?.id ?? "")) err(`${p}.id`, "lowercase letters, numbers and dashes");
      else if (ids.has(s.id)) err(`${p}.id`, `"${s.id}" is used twice`);
      ids.add(s?.id);
      if (!isStr(s?.name)) err(`${p}.name`, "required text is missing");
      if (typeof s?.price !== "number" || !Number.isFinite(s.price) || s.price < 0) err(`${p}.price`, "a number of pounds, e.g. 22 (not \"£22\")");
      if (!Number.isInteger(s?.minutes) || s.minutes <= 0) err(`${p}.minutes`, "whole minutes, e.g. 40");
    });
  }
}

/**
 * JSON path of the first string matching a pattern, e.g. "hero.intro".
 * @param {any} value @param {RegExp} pattern @param {string} [at]
 * @returns {string|null}
 */
export function findText(value, pattern, at = "") {
  if (typeof value === "string") return pattern.test(value) ? at || "(root)" : null;
  if (Array.isArray(value)) {
    for (const [i, v] of value.entries()) { const hit = findText(v, pattern, `${at}[${i}]`); if (hit) return hit; }
  } else if (isObj(value)) {
    for (const [k, v] of Object.entries(value)) { const hit = findText(v, pattern, at ? `${at}.${k}` : k); if (hit) return hit; }
  }
  return null;
}
