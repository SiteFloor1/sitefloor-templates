// @ts-check
/**
 * Validation for the walk-in queue, loyalty card, memberships, before/after and gift vouchers.
 * Unknown keys are refused so a typo can't silently switch something off.
 */
import { openHourCount } from "./queue.js";
import { KITS } from "../../features/registry.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @param {unknown} v @returns {v is string} */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
/** @param {unknown} v @returns {v is Record<string, any>} */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {unknown} v @param {number} min @param {number} max */
const isInt = (v, min, max) => Number.isInteger(v) && /** @type {number} */ (v) >= min && /** @type {number} */ (v) <= max;
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

/** @param {Record<string, any>} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}

/** @param {any} site @param {Report} err @param {((p: string) => boolean)|undefined} exists */
export function checkExtras(site, err, exists) {
  if (site.queue !== undefined) checkQueue(site, err);
  if (site.loyalty !== undefined) checkLoyalty(site, err);
  if (site.memberships !== undefined) checkMemberships(site, err);
  if (site.beforeAfter !== undefined) checkBeforeAfter(site.beforeAfter, err, exists);
  if (site.vouchers !== undefined) checkVouchers(site.vouchers, err);
}

/** @param {any} site @param {Report} err */
function checkQueue(site, err) {
  const q = site.queue;
  if (!isObj(q)) { err("queue", '{ "source": "sheet", "csvUrl": "…", "chairs": 3, "minutesPerCut": 15, "busyness": { "mon": [0, 1, …] } }'); return; }
  onlyKeys(q, ["source", "csvUrl", "staleAfterMinutes", "chairs", "minutesPerCut", "busyness", "busynessSource"], "queue", err);
  if (!["simulated", "sheet"].includes(q.source)) err("queue.source", 'must be "sheet" (or "simulated" on demo sites)');
  if (q.source === "simulated" && site.mode !== "demo") err("queue.source", 'simulated data is only allowed on demo sites; use "sheet"');
  if (q.source === "sheet" && !/^https:\/\/docs\.google\.com\/spreadsheets\/.+output=csv/.test(q.csvUrl ?? "")) {
    err("queue.csvUrl", "must be a published Google Sheet CSV link (File → Share → Publish to web → CSV)");
  }
  if (q.staleAfterMinutes !== undefined && !isInt(q.staleAfterMinutes, 5, 60)) err("queue.staleAfterMinutes", "whole minutes, 5–60");
  if (!isInt(q.chairs, 1, 20)) err("queue.chairs", "how many barbers usually cut at once, 1–20");
  if (!isInt(q.minutesPerCut, 5, 90)) err("queue.minutesPerCut", "the shop's average minutes per customer, 5–90");
  if (!isStr(q.busynessSource)) err("queue.busynessSource", 'where the usual-busyness numbers come from, e.g. "Google popular times, checked Oct 2026"');
  checkBusyness(site, err);
}

/** @param {any} site @param {Report} err */
function checkBusyness(site, err) {
  const q = site.queue;
  if (!isObj(q.busyness)) { err("queue.busyness", "one list of levels (0 quiet – 3 very busy) per open day"); return; }
  onlyKeys(q.busyness, DAYS, "queue.busyness", err);
  for (const day of DAYS) {
    const want = openHourCount(site.hours ?? {}, day);
    const got = q.busyness[day];
    if (!want) { if (got !== undefined) err(`queue.busyness.${day}`, "the shop is closed that day"); continue; }
    if (!Array.isArray(got) || got.length !== want || !got.every((l) => isInt(l, 0, 3))) {
      err(`queue.busyness.${day}`, `${want} levels (0–3), one per hour the shop is open, starting at the opening hour`);
    }
  }
}

/** @param {any} site @param {string} id */
const serviceOf = (site, id) => (Array.isArray(site.services) ? site.services : []).find((/** @type {any} */ s) => s?.id === id);


/** @param {any} site @param {Report} err */
function checkLoyalty(site, err) {
  const l = site.loyalty;
  if (!isObj(l)) { err("loyalty", '{ "stamps": 6, "reward": "Your 6th cut is free", "rules": ["…"], "compareService": "skin" }'); return; }
  onlyKeys(l, ["stamps", "reward", "rules", "compareService", "card"], "loyalty", err);
  if (!isInt(l.stamps, 3, 20)) err("loyalty.stamps", "how many stamps fill the card, 3–20 (the last one is the free cut)");
  if (!isStr(l.reward)) err("loyalty.reward", 'what a full card gets, e.g. "Your 6th cut is free"');
  if (!Array.isArray(l.rules) || !l.rules.length || !l.rules.every(isStr)) err("loyalty.rules", "the card's rules as short lines (what counts, expiry, one card per person)");
  // The savings example compares against a service, or against what the trade sells instead (its kit's `savingsItem`).
  const item = KITS.find((k) => k.id === site.kit)?.savingsItem;
  if (item) { if (!item.find(site, l.compareService)) err("loyalty.compareService", item.hint); }
  else if (!serviceOf(site, l.compareService)) err("loyalty.compareService", "id of the service used for the savings example (from services)");
  if (l.card !== undefined && !["paper", "app"].includes(l.card)) err("loyalty.card", '"paper" (stamped in the shop) or "app"');
}

/** @param {any} site @param {Report} err */
function checkMemberships(site, err) {
  const m = site.memberships;
  if (!isObj(m)) { err("memberships", '{ "compareService": "skin", "plans": [{ "name": "…", "price": 35, "cuts": 2, "includes": ["…"] }], "terms": "…" }'); return; }
  onlyKeys(m, ["compareService", "plans", "terms", "join"], "memberships", err);
  if (!serviceOf(site, m.compareService)) err("memberships.compareService", "id of the service the plans cover (from services)");
  if (!isStr(m.terms)) err("memberships.terms", "how to cancel, minimum term and how payment is taken");
  if (m.join !== undefined && !isStr(m.join)) err("memberships.join", "the WhatsApp message for joining");
  if (!Array.isArray(m.plans) || m.plans.length < 1 || m.plans.length > 4) { err("memberships.plans", "1–4 plans"); return; }
  for (const [i, p] of m.plans.entries()) checkPlan(p, `memberships.plans[${i}]`, err);
}

/** @param {any} p @param {string} at @param {Report} err */
function checkPlan(p, at, err) {
  if (!isObj(p)) { err(at, "a plan"); return; }
  onlyKeys(p, ["name", "price", "cuts", "includes", "featured"], at, err);
  if (!isStr(p.name)) err(`${at}.name`, "required");
  if (typeof p.price !== "number" || p.price <= 0) err(`${at}.price`, "monthly price in pounds");
  if (!(p.cuts === "unlimited" || isInt(p.cuts, 1, 8))) err(`${at}.cuts`, 'cuts a month, 1–8, or "unlimited"');
  if (p.includes !== undefined && !(Array.isArray(p.includes) && p.includes.every(isStr))) err(`${at}.includes`, "short lines");
  if (p.featured !== undefined && typeof p.featured !== "boolean") err(`${at}.featured`, "true or false");
}

/** @param {any} b @param {Report} err @param {((p: string) => boolean)|undefined} exists */
function checkBeforeAfter(b, err, exists) {
  if (!isObj(b) || !Array.isArray(b.items) || !b.items.length) { err("beforeAfter.items", "at least one pair of photos"); return; }
  onlyKeys(b, ["items"], "beforeAfter", err);
  for (const [i, p] of b.items.entries()) {
    const at = `beforeAfter.items[${i}]`;
    if (!isObj(p)) { err(at, "a pair of photos"); continue; }
    onlyKeys(p, ["before", "after", "beforeLabel", "afterLabel", "alt", "caption", "by"], at, err);
    for (const k of ["before", "after"]) {
      if (!isStr(p[k]) || !/^img\/[\w.-]+\.(webp|jpe?g|png|avif)$/.test(p[k])) err(`${at}.${k}`, "a photo in img/ (webp, jpg, png or avif)");
      else if (exists && !exists(p[k])) err(`${at}.${k}`, `file not found: ${p[k]}`);
    }
    if (!isStr(p.alt)) err(`${at}.alt`, "what the two photos show, for screen readers");
    for (const k of ["beforeLabel", "afterLabel", "caption", "by"]) if (p[k] !== undefined && !isStr(p[k])) err(`${at}.${k}`, "text");
  }
}

/** @param {any} v @param {Report} err */
function checkVouchers(v, err) {
  if (!isObj(v)) { err("vouchers", '{ "amounts": [10, 20, 30], "validMonths": 12, "howToBuy": "…", "terms": "…" }'); return; }
  onlyKeys(v, ["amounts", "custom", "validMonths", "howToBuy", "terms"], "vouchers", err);
  if (!Array.isArray(v.amounts) || !v.amounts.length || v.amounts.length > 6 || !v.amounts.every((/** @type {any} */ a) => isInt(a, 5, 2500))) err("vouchers.amounts", "1–6 whole-pound amounts, £5–£2,500");
  if (v.custom !== undefined && !(isObj(v.custom) && isInt(v.custom.min, 5, 2500) && isInt(v.custom.max, 5, 10000) && v.custom.min < v.custom.max)) err("vouchers.custom", '{ "min": 10, "max": 200 } whole pounds (min up to £2,500, max up to £10,000)');
  if (!isInt(v.validMonths, 6, 60)) err("vouchers.validMonths", "how long a voucher lasts, in months (UK gift cards: at least 12 is usual)");
  if (!isStr(v.howToBuy)) err("vouchers.howToBuy", "how payment works, e.g. pay by card in the shop or by bank transfer");
  if (!isStr(v.terms)) err("vouchers.terms", "one or two lines: refunds, using it across visits");
}
