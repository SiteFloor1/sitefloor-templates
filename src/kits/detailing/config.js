// @ts-check
/**
 * Validation for the detailing kit (paint correction, ceramic coating, paint protection film, interiors). Every price,
 * size, length of job, care step, maintenance interval and stage is the studio's own; these checks only make sure it is
 * complete and can't mislead. Simulated diaries and cars are refused on client sites, and the inspection light only
 * runs on a real matched pair (the same panel, light and framing). A misspelt setting is refused, never ignored.
 */

/** @typedef {(path: string, msg: string) => void} Report */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const ID = /^[a-z0-9-]{1,40}$/;
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const PHOTO = ["src", "width", "height", "alt", "caption"];
const PAGE = ["kicker", "title", "intro", "photo", "body"];
const AREAS = ["front-end", "full-front", "track", "whole"];
const SERVICE = [...PAGE, "includes", "steps", "prices", "priceFrom", "message"];

/** @param {Report} err @param {string} path @param {any} v */
function text(err, path, v) { if (!isStr(v)) err(path, "required text is missing"); }
/** @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (isObj(o)) for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}
/** @param {Report} err @param {string} path @param {any} list @param {number} min @param {number} max */
function list(err, path, list, min, max) {
  if (!Array.isArray(list) || list.length < min || list.length > max) { err(path, `a list of ${min} to ${max}`); return false; }
  return true;
}
/** @param {Report} err @param {string} path @param {any} v @param {number} max */
function words(err, path, v, max) {
  if (!list(err, path, v, 1, max)) return;
  v.forEach((/** @type {any} */ s, /** @type {number} */ i) => text(err, `${path}[${i}]`, s));
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
/** Unique ids in a list. @param {Report} err @param {string} path @param {any[]} items @returns {Set<string>} */
function ids(err, path, items) {
  const seen = new Set();
  items.forEach((x, i) => {
    if (!ID.test(x?.id ?? "")) err(`${path}[${i}].id`, "lowercase letters, numbers and dashes");
    else if (seen.has(x.id)) err(`${path}[${i}].id`, `"${x.id}" is used twice`);
    seen.add(x?.id);
  });
  return seen;
}
/** The studio's own "from" prices, in whole pounds, one per size it prices. @param {Report} err @param {string} at @param {any} p @param {Set<string>} sizes @param {boolean} needOne */
function prices(err, at, p, sizes, needOne) {
  if (!isObj(p)) { err(at, "the studio's own prices by car size, e.g. { \"medium\": 450 }"); return; }
  for (const [k, v] of Object.entries(p)) {
    if (!sizes.has(k)) err(`${at}.${k}`, `not one of the sizes (${[...sizes].join(", ")})`);
    else if (!Number.isInteger(v) || v < 1 || v > 100000) err(`${at}.${k}`, "the studio's own price in whole pounds, e.g. 450");
  }
  if (needOne && !Object.keys(p).length) err(at, "price at least one size");
}
/** @param {Report} err @param {string} at @param {any} v @param {string} mode */
function liveSource(err, at, v, mode) {
  if (!isObj(v)) { err(at, "required"); return; }
  if (!["simulated", "sheet"].includes(v.source)) err(`${at}.source`, "\"sheet\" (the studio's published Google Sheet) or \"simulated\" (demo only)");
  if (v.source === "simulated" && mode === "client") err(`${at}.source`, "client sites read the studio's own sheet; simulated data is for the demo only");
  if (v.source === "sheet" && !/^https:\/\/docs\.google\.com\/spreadsheets\/d\/e\/[\w-]+\/pub\?[^\s]*output=csv/.test(v.csvUrl ?? "")) err(`${at}.csvUrl`, "the sheet's \"Publish to the web\" CSV link (https://docs.google.com/spreadsheets/d/e/…/pub?…output=csv)");
  if (v.source === "simulated" && v.csvUrl !== undefined) err(`${at}.csvUrl`, "only with source \"sheet\"");
  if (!Number.isInteger(v.staleAfterHours) || v.staleAfterHours < 1 || v.staleAfterHours > 168) err(`${at}.staleAfterHours`, "hours after which an untouched sheet is treated as unknown, 1 to 168");
}
/** @param {Report} err @param {string} at @param {any} pg @param {((rel: string) => boolean)|undefined} exists */
function page(err, at, pg, exists) {
  if (!isObj(pg)) { err(at, "required: { kicker, title, intro }"); return; }
  onlyKeys(pg, PAGE, at, err);
  text(err, `${at}.title`, pg.title);
  text(err, `${at}.intro`, pg.intro);
  if (pg.kicker !== undefined) text(err, `${at}.kicker`, pg.kicker);
  if (pg.photo !== undefined) photo(err, `${at}.photo`, pg.photo, exists);
  if (pg.body !== undefined) words(err, `${at}.body`, pg.body, 8);
}
/** A service page: a page's opening plus what's included, the steps, its prices and a question. */
function service(/** @type {Report} */ err, /** @type {string} */ at, /** @type {any} */ pg, /** @type {Set<string>} */ sizes, /** @type {Set<string>} */ pkgIds, /** @type {Set<string>} */ addOnIds, /** @type {any} */ exists) {
  if (!isObj(pg)) { err(at, "required: { title, intro, includes, steps, message }"); return; }
  page(err, at, Object.fromEntries(Object.entries(pg).filter(([k]) => PAGE.includes(k))), exists);
  onlyKeys(pg, SERVICE, at, err);
  words(err, `${at}.includes`, pg.includes, 10);
  if (list(err, `${at}.steps`, pg.steps, 2, 6)) pg.steps.forEach((/** @type {any} */ s, /** @type {number} */ i) => { onlyKeys(s, ["name", "text"], `${at}.steps[${i}]`, err); text(err, `${at}.steps[${i}].name`, s.name); text(err, `${at}.steps[${i}].text`, s.text); });
  text(err, `${at}.message`, pg.message);
  if (pg.prices !== undefined && pg.priceFrom !== undefined) err(at, "prices or priceFrom, not both");
  if (pg.prices !== undefined) prices(err, `${at}.prices`, pg.prices, sizes, true);
  if (pg.priceFrom !== undefined) {
    const f = pg.priceFrom;
    onlyKeys(f, ["addOn", "package"], `${at}.priceFrom`, err);
    if (!isObj(f) || Object.keys(f).length !== 1) err(`${at}.priceFrom`, "{ \"addOn\": \"<id>\" } or { \"package\": \"<id>\" }");
    else if (f.addOn !== undefined && !addOnIds.has(f.addOn)) err(`${at}.priceFrom.addOn`, "one of the addOns ids");
    else if (f.package !== undefined && !pkgIds.has(f.package)) err(`${at}.priceFrom.package`, "one of the package ids");
  }
}
/** The studio's own Stripe Payment Link: a test-mode link on a demo, the live one on a client site. */
function stripeLink(/** @type {Report} */ err, /** @type {string} */ at, /** @type {any} */ link, /** @type {string} */ mode) {
  if (!/^https:\/\/buy\.stripe\.com\/[\w-]+$/.test(link ?? "")) err(at, "the studio's own Stripe Payment Link, https://buy.stripe.com/…");
  else if (mode === "demo" && !link.startsWith("https://buy.stripe.com/test_")) err(at, "demo sites must use a Stripe test-mode link (https://buy.stripe.com/test_…)");
  else if (mode === "client" && link.startsWith("https://buy.stripe.com/test_")) err(at, "is a Stripe test-mode link; client sites need the studio's live link");
}
/** @param {any} v */
const isYmd = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(`${v}T12:00:00Z`).toISOString().startsWith(v);

/** @param {any} site @param {Report} err @param {((rel: string) => boolean)|undefined} [exists] */
export function checkDetailing(site, err, exists) {
  if (site.kit !== "detailing") return;
  const sizes = checkSizes(site.sizes, err);
  const pkgIds = site.packages !== undefined ? checkPackages(site.packages, sizes, err, exists) : new Set();
  if (site.addOns !== undefined && list(err, "addOns", site.addOns, 1, 12)) {
    ids(err, "addOns", site.addOns);
    site.addOns.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
      onlyKeys(x, ["id", "name", "line", "days", "prices"], `addOns[${i}]`, err);
      text(err, `addOns[${i}].name`, x.name);
      if (!Number.isInteger(x.days) || x.days < 0 || x.days > 10) err(`addOns[${i}].days`, "extra days it adds, 0 if done alongside");
      prices(err, `addOns[${i}].prices`, x.prices, sizes, false);
    });
  }
  if (site.builder !== undefined) { onlyKeys(site.builder, ["message"], "builder", err); text(err, "builder.message", site.builder?.message); }
  if (site.availability !== undefined) {
    const a = site.availability;
    onlyKeys(a, ["source", "csvUrl", "staleAfterHours", "workdays", "message"], "availability", err);
    liveSource(err, "availability", a, site.mode);
    if (!list(err, "availability.workdays", a.workdays, 1, 7) || a.workdays.some((/** @type {any} */ d) => !DAYS.includes(d))) err("availability.workdays", `the days the studio works, from ${DAYS.join(", ")}`);
    if (!/\{date\}/.test(a.message ?? "")) err("availability.message", "the request message, with {date} and {package} where they go");
  }
  if (site.care !== undefined) {
    onlyKeys(site.care, ["steps"], "care", err);
    if (list(err, "care.steps", site.care.steps, 1, 8)) site.care.steps.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
      onlyKeys(s, ["day", "title", "text"], `care.steps[${i}]`, err);
      if (!Number.isInteger(s.day) || s.day < 1 || s.day > 400) err(`care.steps[${i}].day`, "days after handover, from 1");
      text(err, `care.steps[${i}].title`, s.title); text(err, `care.steps[${i}].text`, s.text);
    });
  }
  if (site.explained !== undefined) {
    const e = site.explained;
    onlyKeys(e, ["photo", "coating", "film"], "explained", err);
    photo(err, "explained.photo", e.photo, exists);
    for (const k of ["coating", "film"]) {
      onlyKeys(e[k], ["name", "line", "does", "doesnt"], `explained.${k}`, err);
      text(err, `explained.${k}.name`, e[k]?.name);
      words(err, `explained.${k}.does`, e[k]?.does, 5);
      words(err, `explained.${k}.doesnt`, e[k]?.doesnt, 4);
    }
  }
  if (site.maintenance !== undefined) {
    const m = site.maintenance;
    onlyKeys(m, ["message", "plans", "count"], "maintenance", err);
    text(err, "maintenance.message", m.message);
    if (m.count !== undefined && (!Number.isInteger(m.count) || m.count < 2 || m.count > 26)) err("maintenance.count", "how many reminders, 2 to 26");
    if (list(err, "maintenance.plans", m.plans, 1, 4)) {
      ids(err, "maintenance.plans", m.plans);
      m.plans.forEach((/** @type {any} */ p, /** @type {number} */ i) => {
        onlyKeys(p, ["id", "name", "every", "text", "price", "monthly", "payLink"], `maintenance.plans[${i}]`, err);
        if ((p.monthly === undefined) !== (p.payLink === undefined)) err(`maintenance.plans[${i}]`, "monthly and payLink go together: the monthly price and the Stripe link that charges it");
        if (p.monthly !== undefined && (!Number.isInteger(p.monthly) || p.monthly < 1)) err(`maintenance.plans[${i}].monthly`, "the studio's own monthly price in whole pounds");
        if (p.payLink !== undefined) stripeLink(err, `maintenance.plans[${i}].payLink`, p.payLink, site.mode);
        text(err, `maintenance.plans[${i}].name`, p.name); text(err, `maintenance.plans[${i}].text`, p.text);
        if (!Number.isInteger(p.every) || p.every < 1 || p.every > 52) err(`maintenance.plans[${i}].every`, "weeks between visits, 1 to 52");
        if (p.price !== undefined && (!Number.isInteger(p.price) || p.price < 1)) err(`maintenance.plans[${i}].price`, "the studio's own price in whole pounds");
      });
    }
  }
  if (site.progress !== undefined) {
    const p = site.progress;
    onlyKeys(p, ["source", "csvUrl", "staleAfterHours", "stages", "photo", "example"], "progress", err);
    liveSource(err, "progress", p, site.mode);
    if (list(err, "progress.stages", p.stages, 2, 6)) {
      ids(err, "progress.stages", p.stages);
      p.stages.forEach((/** @type {any} */ s, /** @type {number} */ i) => { onlyKeys(s, ["id", "name"], `progress.stages[${i}]`, err); text(err, `progress.stages[${i}].name`, s.name); });
    }
    photo(err, "progress.photo", p.photo, exists);
    if (p.example !== undefined && (site.mode !== "demo" || p.source !== "simulated")) err("progress.example", "a demo's example code, only with simulated data");
  }
  if (site.paintRequest !== undefined) {
    const r = site.paintRequest;
    onlyKeys(r, ["message", "concerns", "photos", "photo"], "paintRequest", err);
    text(err, "paintRequest.message", r.message);
    words(err, "paintRequest.concerns", r.concerns, 8);
    if (list(err, "paintRequest.photos", r.photos, 2, 6)) r.photos.forEach((/** @type {any} */ s, /** @type {number} */ i) => text(err, `paintRequest.photos[${i}]`, s));
    if (r.photo !== undefined) photo(err, "paintRequest.photo", r.photo, exists);
  }
  if (site.correction !== undefined) {
    const c = site.correction;
    onlyKeys(c, ["photo", "text", "steps", "package"], "correction", err);
    photo(err, "correction.photo", c.photo, exists);
    text(err, "correction.text", c.text);
    if (list(err, "correction.steps", c.steps, 2, 5)) c.steps.forEach((/** @type {any} */ s, /** @type {number} */ i) => { onlyKeys(s, ["name", "text"], `correction.steps[${i}]`, err); text(err, `correction.steps[${i}].name`, s.name); text(err, `correction.steps[${i}].text`, s.text); });
    if (c.package !== undefined && !pkgIds.has(c.package)) err("correction.package", "one of the package ids");
  }
  if (site.protection !== undefined) {
    const p = site.protection;
    onlyKeys(p, ["photo", "coverages", "message", "note"], "protection", err);
    photo(err, "protection.photo", p.photo, exists);
    text(err, "protection.message", p.message);
    text(err, "protection.note", p.note);
    if (list(err, "protection.coverages", p.coverages, 1, 4)) {
      ids(err, "protection.coverages", p.coverages);
      p.coverages.forEach((/** @type {any} */ c, /** @type {number} */ i) => {
        onlyKeys(c, ["id", "name", "line", "area"], `protection.coverages[${i}]`, err);
        text(err, `protection.coverages[${i}].name`, c.name); text(err, `protection.coverages[${i}].line`, c.line);
        if (!AREAS.includes(c.area)) err(`protection.coverages[${i}].area`, `what the 3D car shows covered: ${AREAS.join(", ")}`);
      });
    }
  }
  if (site.filmPrices !== undefined) {
    onlyKeys(site.filmPrices, ["source", "csvUrl"], "filmPrices", err);
    liveSource(err, "filmPrices", { staleAfterHours: 1, ...site.filmPrices }, site.mode);
  }
  if (site.dueCheck !== undefined) {
    const d = site.dueCheck;
    onlyKeys(d, ["message", "items"], "dueCheck", err);
    text(err, "dueCheck.message", d.message);
    if (list(err, "dueCheck.items", d.items, 1, 6)) {
      ids(err, "dueCheck.items", d.items);
      d.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
        onlyKeys(x, ["id", "name", "months", "weeks", "text"], `dueCheck.items[${i}]`, err);
        text(err, `dueCheck.items[${i}].name`, x.name); text(err, `dueCheck.items[${i}].text`, x.text);
        const m = x.months !== undefined, w = x.weeks !== undefined;
        if (m === w) err(`dueCheck.items[${i}]`, "the studio's interval, either months (1 to 60) or weeks (1 to 104)");
        else if (m && (!Number.isInteger(x.months) || x.months < 1 || x.months > 60)) err(`dueCheck.items[${i}].months`, "1 to 60");
        else if (w && (!Number.isInteger(x.weeks) || x.weeks < 1 || x.weeks > 104)) err(`dueCheck.items[${i}].weeks`, "1 to 104");
      });
    }
  }
  if (site.collection !== undefined) {
    const c = site.collection;
    onlyKeys(c, ["source", "csvUrl", "staleAfterHours", "message", "note"], "collection", err);
    liveSource(err, "collection", c, site.mode);
    text(err, "collection.message", c.message);
    if (c.note !== undefined) text(err, "collection.note", c.note);
  }
  for (const k of ["paintChart", "leasePrices"]) {
    if (site[k] === undefined) continue;
    onlyKeys(site[k], ["source", "csvUrl"], k, err);
    liveSource(err, k, { staleAfterHours: 1, ...site[k] }, site.mode);
  }
  if (site.features?.includes("paint-chart") && !site.features.includes("correction-3d") && !site.features.includes("protection-3d")) err("features", "paint-chart colours the 3D car, so it needs correction-3d or protection-3d");
  if (site.leaseReturn !== undefined) {
    const l = site.leaseReturn;
    if (!isObj(l)) err("leaseReturn", "required: { title, intro, message }");
    else {
      page(err, "leaseReturn", Object.fromEntries(Object.entries(l).filter(([k]) => PAGE.includes(k))), exists);
      onlyKeys(l, [...PAGE, "message", "note"], "leaseReturn", err);
      text(err, "leaseReturn.message", l.message);
      if (l.note !== undefined) text(err, "leaseReturn.note", l.note);
    }
  }
  for (const k of ["wheelsPage", "interiorPage", "newCarPage", "sellingPage"]) {
    if (site[k] !== undefined) service(err, k, site[k], sizes, pkgIds, new Set((site.addOns ?? []).map((/** @type {any} */ x) => x.id)), exists);
  }
  if (site.inspection !== undefined) checkInspection(site.inspection, err, exists);
  for (const k of ["packagesPage", "coatingPage", "filmPage", "bookPage", "correctionPage", "maintenancePage", "aftercarePage", "resultsPage"]) {
    if (site[k] !== undefined) page(err, k, site[k], exists);
  }
  if (site.journal !== undefined) checkJournal(site.journal, err, exists);
}

/** @param {any} v @param {Report} err @returns {Set<string>} */
function checkSizes(v, err) {
  if (!list(err, "sizes", v, 2, 6)) return new Set();
  v.forEach((/** @type {any} */ s, /** @type {number} */ i) => { onlyKeys(s, ["id", "name"], `sizes[${i}]`, err); text(err, `sizes[${i}].name`, s.name); });
  return ids(err, "sizes", v);
}

/** @param {any} p @param {Set<string>} sizes @param {Report} err @param {any} exists @returns {Set<string>} */
function checkPackages(p, sizes, err, exists) {
  onlyKeys(p, ["note", "items"], "packages", err);
  if (p?.note !== undefined) text(err, "packages.note", p.note);
  if (!list(err, "packages.items", p?.items, 1, 8)) return new Set();
  const out = ids(err, "packages.items", p.items);
  p.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `packages.items[${i}]`;
    onlyKeys(x, ["id", "name", "line", "includes", "days", "prices", "photo"], at, err);
    text(err, `${at}.name`, x.name); text(err, `${at}.line`, x.line);
    if (x.includes !== undefined) words(err, `${at}.includes`, x.includes, 8);
    if (!Number.isInteger(x.days) || x.days < 1 || x.days > 30) err(`${at}.days`, "working days the car stays, 1 to 30");
    prices(err, `${at}.prices`, x.prices, sizes, true);
    if (x.photo !== undefined) photo(err, `${at}.photo`, x.photo, exists);
  });
  return out;
}

/**
 * The inspection light's matched pair: the same panel under the same light, framed the same, before and after. Both
 * files must exist and be the same size, so the light can never sweep across two different pictures.
 * @param {any} v @param {Report} err @param {any} exists
 */
function checkInspection(v, err, exists) {
  onlyKeys(v, ["before", "after", "alt", "caption"], "inspection", err);
  text(err, "inspection.alt", v?.alt);
  text(err, "inspection.caption", v?.caption);
  for (const k of ["before", "after"]) {
    const p = v?.[k];
    onlyKeys(p, ["src", "width", "height"], `inspection.${k}`, err);
    if (!isObj(p) || !isStr(p.src) || !Number.isInteger(p.width) || !Number.isInteger(p.height)) err(`inspection.${k}`, "{ src, width, height }");
    else if (exists && !exists(p.src)) err(`inspection.${k}.src`, `file not found: ${p.src}`);
  }
  if (isObj(v?.before) && isObj(v?.after) && (v.before.width !== v.after.width || v.before.height !== v.after.height)) err("inspection", "before and after must be the same size: a matched pair of the same panel, light and framing");
  if (isObj(v?.before) && isObj(v?.after) && v.before.src === v.after.src) err("inspection", "before and after are the same file");
}

/** @param {any} j @param {Report} err @param {any} exists */
function checkJournal(j, err, exists) {
  onlyKeys(j, ["kicker", "title", "intro", "items"], "journal", err);
  text(err, "journal.title", j?.title); text(err, "journal.intro", j?.intro);
  if (!list(err, "journal.items", j?.items, 1, 30)) return;
  const seen = new Set();
  j.items.forEach((/** @type {any} */ a, /** @type {number} */ i) => {
    const at = `journal.items[${i}]`;
    onlyKeys(a, ["slug", "title", "date", "line", "photo", "body"], at, err);
    if (!ID.test(a.slug ?? "")) err(`${at}.slug`, "lowercase words with dashes");
    else if (seen.has(a.slug)) err(`${at}.slug`, `"${a.slug}" is used twice`);
    seen.add(a.slug);
    text(err, `${at}.title`, a.title); text(err, `${at}.line`, a.line);
    if (!isYmd(a.date)) err(`${at}.date`, "the day it was written, YYYY-MM-DD");
    photo(err, `${at}.photo`, a.photo, exists);
    words(err, `${at}.body`, a.body, 12);
  });
}
