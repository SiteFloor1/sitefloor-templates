// @ts-check
/**
 * Validation for the hol kit (holiday-let and Airbnb management in Great Britain). Honesty decides what must be
 * there: the fee as a percentage of what guests pay with VAT included; guest prices as totals for a stated stay with
 * every mandatory fee (the CMA's drip-pricing rules); the estimate only from the company's own last-year figures; a
 * sample statement whose sums add up; owner stories only on a client site, real and dated. A demo is fictional: its
 * homes and figures say so.
 */
import { figuresProblems } from "./lib/estimate.js";
import { statementProblems, turnoverProblems, tidyCode } from "./lib/owners.js";
import { REGIONS } from "./lib/rules.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const ID = /^[a-z0-9-]{1,30}$/;
const YMD = /^\d{4}-\d{2}-\d{2}$/;
/** Pages the kit builds. */
export const RESERVED = ["index", "fees", "rules", "owners", "review", "homes", "manage", "areas", "care", "styling", "onboarding", "guide", "stories", "journal", "article", "privacy", "404"];

/** @param {Report} err @param {string} path @param {any} v */
const text = (err, path, v) => { if (!isStr(v)) err(path, "required text is missing"); };
/** @param {Report} err @param {string} path @param {any} v */
function lines(err, path, v) {
  if (!Array.isArray(v) || !v.length) { err(path, "at least one line"); return; }
  v.forEach((x, i) => text(err, `${path}[${i}]`, x));
}
/** @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (isObj(o)) for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}
/** @param {Report} err @param {string} path @param {any} p @param {((rel: string) => boolean)|undefined} exists @param {boolean} [tall] */
function photo(err, path, p, exists, tall = false) {
  if (!isObj(p)) { err(path, `a photo: { src,${tall ? " tall," : ""} width, height, alt, credit }`); return; }
  onlyKeys(p, ["src", "tall", "width", "height", "tallWidth", "tallHeight", "alt", "position", "credit"], path, err);
  text(err, `${path}.alt`, p.alt);
  text(err, `${path}.credit`, p.credit);
  for (const k of tall ? ["width", "height", "tallWidth", "tallHeight"] : ["width", "height"]) if (!Number.isInteger(p[k])) err(`${path}.${k}`, "a size in pixels");
  if (p.position !== undefined && !/^\d{1,3}% \d{1,3}%$/.test(p.position)) err(`${path}.position`, 'the crop\'s focus, e.g. "50% 30%"');
  for (const k of tall ? ["src", "tall"] : ["src"]) {
    if (!isStr(p[k])) err(`${path}.${k}`, "required");
    else if (exists && !exists(p[k])) err(`${path}.${k}`, `file not found: ${p[k]}`);
  }
}
/** @param {Report} err @param {string} path @param {any} items @param {string[]} keys */
function titled(err, path, items, keys = ["title", "text"]) {
  if (!Array.isArray(items) || !items.length) { err(path, "at least one"); return; }
  items.forEach((it, i) => { for (const k of keys) text(err, `${path}[${i}].${k}`, it?.[k]); });
}
/** @param {Report} err @param {string} at @param {any} page */
function pageHead(err, at, page) {
  if (!isObj(page)) { err(at, "required: { title, intro, … }"); return false; }
  text(err, `${at}.title`, page.title); text(err, `${at}.intro`, page.intro);
  return true;
}

/** HOL-7's free dates: where the booked stays come from. @param {any} c @param {boolean} demo @param {Report} err */
function checkCalendar(c, demo, err) {
  if (!isObj(c)) { err("homes.calendar", 'required: { source: "sheet", csvUrl } (or "simulated" on a demo)'); return; }
  onlyKeys(c, ["source", "csvUrl", "staleAfterHours"], "homes.calendar", err);
  if (c.source === "simulated" && !demo) err("homes.calendar.source", "simulated stays are for demos; a client reads its own sheet");
  if (c.source === "sheet" && !(isStr(c.csvUrl) && /^https:\/\/docs\.google\.com\//.test(c.csvUrl))) err("homes.calendar.csvUrl", "the sheet's published CSV link (docs.google.com)");
  if (!["sheet", "simulated"].includes(c.source)) err("homes.calendar.source", '"sheet" (or "simulated" on a demo)');
}

/** @param {any} site @param {Report} err @param {((rel: string) => boolean)|undefined} [exists] */
export function checkHol(site, err, exists) {
  if (site.kit !== "hol") return;
  const on = (/** @type {string} */ id) => site.features?.includes(id);
  const demo = site.mode === "demo";

  if (!on("hol-fees")) err("features", '"hol-fees" is required: what we do and what it costs, with the fee in pounds, is on every plan');
  if (!on("hol-rules")) err("features", '"hol-rules" is required: the rules where the owner\'s home is, linked to the official pages, are on every plan');

  // hero
  const h = site.hero;
  if (!isObj(h)) err("hero", "required: { kicker, title, intro, ask, photo, promises }");
  else {
    onlyKeys(h, ["kicker", "title", "intro", "ask", "photo", "promises"], "hero", err);
    text(err, "hero.kicker", h.kicker); text(err, "hero.title", h.title); text(err, "hero.intro", h.intro); text(err, "hero.ask", h.ask);
    photo(err, "hero.photo", h.photo, exists, true);
    if (h.promises !== undefined) titled(err, "hero.promises", h.promises);
  }

  // HOL-1: the fee, VAT included, in pounds on an example
  const f = site.fees;
  if (isObj(f)) {
    onlyKeys(f, ["percent", "vatIncluded", "basis", "example", "charges", "weDo", "youKeep", "notice", "office"], "fees", err);
    if (typeof f.percent !== "number" || f.percent <= 0 || f.percent >= 60) err("fees.percent", "the management fee as a percentage of what guests pay");
    if (f.vatIncluded !== true) err("fees.vatIncluded", "must be true: the headline fee includes VAT (CMA), so there is nothing to add");
    text(err, "fees.basis", f.basis);
    if (!Number.isInteger(f.example) || f.example < 1000) err("fees.example", "an example amount of bookings in pounds, e.g. 10000");
    if (!Array.isArray(f.charges)) err("fees.charges", "every other charge, each { name, amount, when } (amount in pounds with VAT, or 0 for none)");
    else f.charges.forEach((/** @type {any} */ c, /** @type {number} */ i) => {
      text(err, `fees.charges[${i}].name`, c?.name); text(err, `fees.charges[${i}].when`, c?.when);
      if (typeof c?.amount !== "number" || c.amount < 0) err(`fees.charges[${i}].amount`, "pounds with VAT; 0 when there is no charge");
    });
    lines(err, "fees.weDo", f.weDo); lines(err, "fees.youKeep", f.youKeep); text(err, "fees.notice", f.notice);
  }

  // HOL-2
  if (on("hol-rules")) {
    const r = site.rules;
    if (!isObj(r)) err("rules", "required: { region }");
    else {
      onlyKeys(r, ["region"], "rules", err);
      if (!REGIONS.some((x) => x.id === r.region)) err("rules.region", `where most of the company's homes are: ${REGIONS.map((x) => x.id).join(", ")}`);
    }
  }

  if (on("hol-owners") && pageHead(err, "owners", site.owners)) titled(err, "owners.promises", site.owners.promises);
  if (on("hol-start")) {
    if (!isObj(site.start)) err("start", "required: { title, steps: [{ title, text, when }] }");
    else { text(err, "start.title", site.start.title); titled(err, "start.steps", site.start.steps, ["title", "text", "when"]); }
  }
  if (on("hol-statement") && isObj(f)) {
    const s = site.statement;
    if (!isObj(s)) err("statement", "required");
    else {
      text(err, "statement.home", s.home); text(err, "statement.month", s.month); text(err, "statement.paidOn", s.paidOn);
      for (const p of statementProblems(s, f.percent)) err("statement", p);
    }
  }
  if (on("hol-review")) {
    if (pageHead(err, "review", site.review)) { text(err, "review.message", site.review.message); lines(err, "review.now", site.review.now); }
  }
  if (on("hol-turnover")) {
    const t = site.turnover;
    if (!isObj(t)) err("turnover", "required: { title, intro, note, steps }");
    else {
      text(err, "turnover.title", t.title); text(err, "turnover.intro", t.intro); text(err, "turnover.note", t.note);
      for (const p of turnoverProblems(t.steps)) err("turnover", p);
      (t.steps ?? []).forEach((/** @type {any} */ s, /** @type {number} */ i) => { text(err, `turnover.steps[${i}].title`, s?.title); text(err, `turnover.steps[${i}].detail`, s?.detail); photo(err, `turnover.steps[${i}].photo`, s?.photo, exists); });
    }
  }

  // HOL-7: guest prices are totals for a stated stay, every mandatory fee included
  if (on("hol-homes")) {
    const hs = site.homes;
    if (!isObj(hs) || !Array.isArray(hs.items) || !hs.items.length) err("homes", "required: { title, intro, items: [...] }");
    else {
      text(err, "homes.title", hs.title); text(err, "homes.intro", hs.intro);
      const ids = new Set();
      hs.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
        const at = `homes.items[${i}]`;
        onlyKeys(x, ["id", "name", "town", "sleeps", "bedrooms", "photo", "stay", "book", "line"], at, err);
        if (!ID.test(x?.id ?? "")) err(`${at}.id`, "a short id: lower-case letters, digits, hyphens");
        else if (ids.has(x.id)) err(`${at}.id`, "used twice"); else ids.add(x.id);
        text(err, `${at}.name`, x?.name); text(err, `${at}.town`, x?.town); text(err, `${at}.line`, x?.line);
        for (const k of ["sleeps", "bedrooms"]) if (!Number.isInteger(x?.[k]) || x[k] < 1) err(`${at}.${k}`, "a whole number");
        photo(err, `${at}.photo`, x?.photo, exists);
        if (!isObj(x?.stay) || !Number.isInteger(x.stay.nights) || x.stay.nights < 1 || !Number.isInteger(x.stay.total) || x.stay.total < 1) err(`${at}.stay`, "the guest's total for a stated stay, every mandatory fee included: { nights, total, when }");
        else text(err, `${at}.stay.when`, x.stay.when);
        if (x?.book !== undefined && !(isStr(x.book) && /^https:\/\//.test(x.book))) err(`${at}.book`, "where a guest books this home (the listing or the company's booking page); leave it out to book by WhatsApp");
      });
      if (on("hol-calendar")) checkCalendar(hs.calendar, demo, err);
    }
  }

  // HOL-6: only from published figures, the fee the same as the fees page
  if (on("hol-estimate")) {
    for (const p of figuresProblems(site.estimate)) err("estimate", p);
    if (isObj(site.estimate) && isObj(f) && site.estimate.percent !== f.percent) err("estimate.percent", `must match fees.percent (${f.percent}): one fee everywhere`);
    if (isObj(site.estimate)) onlyKeys(site.estimate, ["year", "percent", "sizes", "london"], "estimate", err);
  }

  if (on("hol-manage") && pageHead(err, "manage", site.manage)) { titled(err, "manage.kinds", site.manage.kinds, ["name", "text"]); lines(err, "manage.not", site.manage.not); }
  if (on("hol-areas") && pageHead(err, "areas", site.areas)) titled(err, "areas.items", site.areas.items, ["name", "districts", "text"]);
  if (on("hol-care") && pageHead(err, "care", site.care)) { lines(err, "care.linen", site.care.linen); lines(err, "care.restock", site.care.restock); }
  if (on("hol-styling") && pageHead(err, "styling", site.styling)) {
    titled(err, "styling.items", site.styling.items); text(err, "styling.fee", site.styling.fee);
    photo(err, "styling.photo", site.styling.photo, exists);
  }
  if (on("hol-onboarding") && pageHead(err, "onboarding", site.onboarding)) {
    const ps = site.onboarding.papers;
    if (!Array.isArray(ps) || !ps.length) err("onboarding.papers", "at least one: { text, url }");
    else ps.forEach((/** @type {any} */ p, /** @type {number} */ i) => { text(err, `onboarding.papers[${i}].text`, p?.text); if (p?.url !== undefined && !/^https:\/\/(www\.)?(gov\.uk|legislation\.gov\.uk|gov\.scot|gov\.wales|gassaferegister\.co\.uk)\//.test(p.url)) err(`onboarding.papers[${i}].url`, "an official page"); });
  }
  if (on("hol-guide")) {
    const g = site.guides;
    const homeIds = (site.homes?.items ?? []).map((/** @type {any} */ x) => x.id);
    if (!isObj(g) || !Array.isArray(g.items) || !g.items.length) err("guides", "required: { items: [{ home, code, arrival, wifi, heating, bins, near: [], walks: [] }] }");
    else g.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
      const at = `guides.items[${i}]`;
      onlyKeys(x, ["home", "code", "arrival", "wifi", "heating", "bins", "near", "walks", "leaving"], at, err);
      if (!homeIds.includes(x?.home)) err(`${at}.home`, "one of homes.items' ids");
      if (tidyCode(x?.code ?? "").length < 4) err(`${at}.code`, "at least four letters or digits");
      for (const k of ["arrival", "wifi", "heating", "bins", "leaving"]) text(err, `${at}.${k}`, x?.[k]);
      lines(err, `${at}.near`, x?.near); lines(err, `${at}.walks`, x?.walks);
      if (/password|pin|door code|key ?safe code/i.test(`${x?.wifi} ${x?.arrival}`) && /\d{4,}/.test(`${x?.wifi} ${x?.arrival}`)) err(at, "a guidebook is not security: no passwords or door codes in it");
    });
  }
  if (on("hol-stories")) {
    if (demo) err("features", '"hol-stories" is client only: a demo never invents owner reviews');
    if (pageHead(err, "stories", site.stories)) {
      const items = site.stories.items;
      if (!Array.isArray(items) || !items.length) err("stories.items", "at least one real review");
      else items.forEach((/** @type {any} */ r, /** @type {number} */ i) => {
        for (const k of ["text", "author", "source"]) text(err, `stories.items[${i}].${k}`, r?.[k]);
        if (!YMD.test(r?.date ?? "")) err(`stories.items[${i}].date`, "the date it was left, YYYY-MM-DD");
      });
    }
  }
  if (on("hol-journal") && pageHead(err, "journal", site.journal)) {
    const items = site.journal.items;
    if (!Array.isArray(items) || !items.length) err("journal.items", "at least one article");
    else items.forEach((/** @type {any} */ a, /** @type {number} */ i) => {
      const at = `journal.items[${i}]`;
      if (!ID.test(a?.slug ?? "") || RESERVED.includes(a?.slug)) err(`${at}.slug`, "a short page name not used by another page");
      text(err, `${at}.title`, a?.title); text(err, `${at}.summary`, a?.summary);
      if (!YMD.test(a?.date ?? "")) err(`${at}.date`, "YYYY-MM-DD"); if (!YMD.test(a?.checked ?? "")) err(`${at}.checked`, "the day its rules were checked, YYYY-MM-DD");
      lines(err, `${at}.body`, a?.body);
      if (!Array.isArray(a?.sources) || !a.sources.length) err(`${at}.sources`, "at least one { label, url }");
    });
  }
}
