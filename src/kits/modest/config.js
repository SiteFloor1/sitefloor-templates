// @ts-check
/**
 * Validation for the modest kit (modest fashion and abaya boutiques). Every length, chart row, price, cut-off and
 * time is the shop's own; these checks keep them whole and consistent: a chart's lengths are lengths the shop sells,
 * a look only names pieces that exist, a demo carries no real payment link, and the shop's Eid cut-offs are days
 * before Eid (the dates themselves come from the shared lunar table, always "expected").
 */
import { isYmd } from "../../core/lib/diary.js";
import { features as KIT_FEATURES } from "./kit.js";

/** Pages a plan includes, counting the home page (as src/features/registry.js PAGE_LIMITS; not imported, because the
 * registry loads this kit while it starts). */
const LIMITS = { starter: 1, plus: 5, signature: Infinity };

/** @typedef {(path: string, msg: string) => void} Report */
/** @typedef {((rel: string) => boolean)|undefined} Exists */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
/** @param {any} v @param {number} lo @param {number} hi */
const isNum = (v, lo, hi) => typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi;
const ID = /^[a-z0-9-]{1,40}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
/** Half inches only: 56, 56.5. @param {any} v */
const half = (v) => isNum(v, 30, 80) && Number.isInteger(v * 2);

/** @param {Report} err @param {string} path @param {any} v */
function text(err, path, v) { if (!isStr(v)) err(path, "required text is missing"); }

/** A misspelt setting is refused, not silently ignored. @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (isObj(o)) for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}

/** @param {Report} err @param {string} path @param {any} v @param {string} what @returns {v is any[]} */
function list(err, path, v, what) {
  if (Array.isArray(v) && v.length) return true;
  err(path, `at least one ${what}`);
  return false;
}

/** Unique ids. @param {Report} err @param {string} path @param {any[]} items */
function ids(err, path, items) {
  const seen = new Set();
  items.forEach((x, i) => {
    if (!ID.test(x?.id ?? "")) err(`${path}[${i}].id`, "lowercase letters, numbers and dashes");
    else if (seen.has(x.id)) err(`${path}[${i}].id`, `"${x.id}" is used twice`);
    seen.add(x?.id);
  });
}

/** @param {Report} err @param {string} path @param {any} p @param {Exists} exists */
function photo(err, path, p, exists) {
  if (!isObj(p)) { err(path, "a photo: { src, width, height, alt }"); return; }
  onlyKeys(p, ["src", "width", "height", "alt", "focus", "small"], path, err);
  if (p.small !== undefined) {
    onlyKeys(p.small, ["src", "width"], `${path}.small`, err);
    if (!isStr(p.small?.src) || !/^img\/[\w./-]+\.(webp|jpe?g|png)$/.test(p.small.src)) err(`${path}.small.src`, "a smaller copy in img/, for phones");
    else if (exists && !exists(p.small.src)) err(`${path}.small.src`, `file not found: ${p.small.src}`);
    if (!Number.isInteger(p.small?.width) || !(p.small.width < p.width)) err(`${path}.small.width`, "the copy's width in pixels, smaller than the photo's");
  }
  text(err, `${path}.alt`, p.alt);
  if (!Number.isInteger(p.width) || !Number.isInteger(p.height)) err(path, "width and height in pixels");
  if (p.focus !== undefined && !/^\d{1,3}% \d{1,3}%$/.test(p.focus)) err(`${path}.focus`, 'where the subject sits, e.g. "50% 30%"');
  if (!isStr(p.src) || !/^img\/[\w./-]+\.(webp|jpe?g|png)$/.test(p.src)) err(`${path}.src`, "a file in img/ (webp, jpg or png)");
  else if (exists && !exists(p.src)) err(`${path}.src`, `file not found: ${p.src}`);
}

/** @param {Report} err @param {string} path @param {any} o @param {string[]} keys */
function page(err, path, o, keys = []) {
  if (!isObj(o)) { err(path, `{ ${["title", "intro", ...keys].join(", ")} }`); return false; }
  onlyKeys(o, ["title", "intro", ...keys], path, err);
  text(err, `${path}.title`, o.title);
  if (o.intro !== undefined) text(err, `${path}.intro`, o.intro);
  return true;
}

/**
 * @param {any} site @param {Report} err @param {Exists} [exists]
 */
export function checkModest(site, err, exists) {
  if (site.kit !== "modest") return;
  const features = /** @type {string[]} */ (Array.isArray(site.features) ? site.features : []);
  if (site.look === "taroub") checkHero(site.hero, site.pieces, err, exists);
  const pieces = checkPieces(site.pieces, site.lengths, features, err, exists);
  checkCategoryPages(site, features, err);
  if (site.lengths !== undefined) checkLengths(site.lengths, err);
  if (site.hemLine !== undefined) checkHemLine(site.hemLine, err, exists);
  if (site.eid !== undefined) checkEid(site.eid, err);
  if (site.appointments !== undefined) checkAppointments(site.appointments, err);
  if (site.looks !== undefined) checkLooks(site, pieces, err, exists);
  if (site.family !== undefined) checkFamily(site.family, pieces, err, exists);
  if (site.madeToMeasure !== undefined) checkMadeToMeasure(site.madeToMeasure, err, exists);
  if (site.fabrics !== undefined) checkFabrics(site.fabrics, err, exists);
}

/**
 * Each part of the collection with its own page counts as a page of the plan (the shared count takes a collection as
 * one page). This adds the rest, so a Plus site is the home page and four pages it chooses. Sold extras: "addonPages".
 * @param {any} site @param {string[]} features @param {Report} err
 */
function checkCategoryPages(site, features, err) {
  const limit0 = LIMITS[/** @type {"starter"|"plus"|"signature"} */ (site.plan)];
  if (!features.includes("modest-category-pages") || limit0 === undefined) return;
  const addons = Array.isArray(site.addons) ? site.addons : [];
  const own = new Set(KIT_FEATURES.filter((f) => typeof f === "object" && f.page).map((f) => /** @type {any} */ (f).id));
  const counted = 1 + features.filter((id) => own.has(id) && !addons.includes(id)).length
    + (features.includes("custom-pages") && Array.isArray(site.pages) ? site.pages.length : 0);
  const parts = (site.pieces?.categories ?? []).length;
  const pages = counted - 1 + parts;
  const limit = limit0 + (Number.isInteger(site.addonPages) ? site.addonPages : 0);
  if (parts > 1 && counted <= limit && pages > limit) err("features", `${pages} pages (each part of the collection is a page of its own: ${parts}), but the ${site.plan} plan includes ${limit}; turn off a page, keep fewer parts, or sell more with "addonPages"`);
}

/** The Taroub hero: the piece it shows, its photograph, credited, and the second piece on the wall. @param {any} h @param {any} pieces @param {Report} err @param {Exists} exists */
function checkHero(h, pieces, err, exists) {
  if (!isObj(h)) return; // the core check reports it
  onlyKeys(h, ["kicker", "title", "intro", "piece", "photo", "credit", "side"], "hero", err);
  const known = new Set((pieces?.items ?? []).map((/** @type {any} */ p) => p?.id));
  if (!known.has(h.piece)) err("hero.piece", "the id of the piece the hero shows (from pieces.items)");
  photo(err, "hero.photo", h.photo, exists);
  if (h.credit !== undefined) text(err, "hero.credit", h.credit);
  if (h.side !== undefined) {
    onlyKeys(h.side, ["piece", "photo"], "hero.side", err);
    if (!known.has(h.side?.piece)) err("hero.side.piece", "the id of a second piece (from pieces.items)");
    photo(err, "hero.side.photo", h.side?.photo, exists);
  }
}

/** @param {any} p @param {any} lengths @param {string[]} features @param {Report} err @param {Exists} exists @returns {any[]} */
function checkPieces(p, lengths, features, err, exists) {
  if (p === undefined) return [];
  if (!isObj(p)) { err("pieces", "{ categories, items }"); return []; }
  onlyKeys(p, ["categories", "items"], "pieces", err);
  const cats = list(err, "pieces.categories", p.categories, "part of the collection: { id, name, page? }") ? p.categories : [];
  ids(err, "pieces.categories", cats);
  cats.forEach((/** @type {any} */ c, /** @type {number} */ i) => {
    onlyKeys(c, ["id", "name", "page"], `pieces.categories[${i}]`, err);
    text(err, `pieces.categories[${i}].name`, c?.name);
    if (c?.page !== undefined) page(err, `pieces.categories[${i}].page`, c.page);
    else if (features.includes("modest-category-pages")) err(`pieces.categories[${i}].page`, "with the category pages on, every part of the collection needs its page: { title, intro? }");
  });
  const items = list(err, "pieces.items", p.items, "piece") ? p.items : [];
  ids(err, "pieces.items", items);
  const sizes = Array.isArray(lengths?.sizes) ? lengths.sizes : [];
  items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `pieces.items[${i}]`;
    onlyKeys(x, ["id", "name", "category", "line", "price", "lengths", "photo", "model", "eid"], at, err);
    text(err, `${at}.name`, x?.name);
    if (!cats.some((/** @type {any} */ c) => c?.id === x?.category)) err(`${at}.category`, "one of pieces.categories");
    if (x?.line !== undefined) text(err, `${at}.line`, x.line);
    if (!isNum(x?.price, 1, 20000)) err(`${at}.price`, "the price in pounds");
    if (x?.lengths !== undefined) {
      if (!Array.isArray(x.lengths) || !x.lengths.length || !x.lengths.every(half)) err(`${at}.lengths`, "the lengths it comes in, in inches, e.g. [54, 56, 58]");
      else for (const l of x.lengths) if (!sizes.includes(l)) err(`${at}.lengths`, `${l} isn't one of lengths.sizes`);
    }
    if (x?.photo !== undefined) photo(err, `${at}.photo`, x.photo, exists);
    if (x?.model !== undefined) {
      onlyKeys(x.model, ["height", "wears", "shoes"], `${at}.model`, err);
      if (!half(x.model?.wears) || (Array.isArray(x.lengths) && !x.lengths.includes(x.model.wears))) err(`${at}.model.wears`, "the length the model wears, one of the piece's lengths");
      if (x.model?.height !== undefined && !/^[4-6]′(\d|1[01])″$/.test(x.model.height)) err(`${at}.model.height`, "the model's height as the shop writes it, e.g. 5′7″ (only from the shop; never guessed)");
      if (x.model?.shoes !== undefined) text(err, `${at}.model.shoes`, x.model.shoes);
    }
    if (x?.eid !== undefined && typeof x.eid !== "boolean") err(`${at}.eid`, "true for a piece in the Eid edit");
  });
  return items;
}

/** The shop's lengths, its height chart and the shoes it lets her choose. @param {any} L @param {Report} err */
function checkLengths(L, err) {
  if (!isObj(L)) { err("lengths", "{ sizes, chart, shoes, start, measure }"); return; }
  onlyKeys(L, ["sizes", "clear", "chart", "shoes", "start", "measure", "takeUp"], "lengths", err);
  const sizes = Array.isArray(L.sizes) && L.sizes.length && L.sizes.every(half) ? L.sizes : null;
  if (!sizes) err("lengths.sizes", "the lengths the shop sells, in inches, e.g. [52, 54, 56, 58, 60]");
  else if (new Set(sizes).size !== sizes.length || sizes.some((/** @type {number} */ s, /** @type {number} */ i) => i && s <= sizes[i - 1])) err("lengths.sizes", "shortest first, each once");
  if (L.clear !== undefined && !isNum(L.clear, 0, 3)) err("lengths.clear", "how far above the floor a length should stop, in inches (0.5 if left out)");
  if (list(err, "lengths.chart", L.chart, "row: { height, from, to, length }")) L.chart.forEach((/** @type {any} */ r, /** @type {number} */ i) => {
    const at = `lengths.chart[${i}]`;
    onlyKeys(r, ["height", "from", "to", "length"], at, err);
    text(err, `${at}.height`, r?.height);
    if (!half(r?.from) || !half(r?.to) || r.to < r.from) err(at, "from and to: the shoulder-to-floor band in inches, from ≤ to");
    if (sizes && !sizes.includes(r?.length)) err(`${at}.length`, "one of lengths.sizes");
    if (i && half(r?.from) && half(L.chart[i - 1]?.to) && r.from <= L.chart[i - 1].to) err(`${at}.from`, "rows go shortest first and don't overlap");
  });
  if (list(err, "lengths.shoes", L.shoes, "shoe: { label, heel }")) L.shoes.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    onlyKeys(s, ["label", "heel"], `lengths.shoes[${i}]`, err);
    text(err, `lengths.shoes[${i}].label`, s?.label);
    if (!isNum(s?.heel, 0, 6)) err(`lengths.shoes[${i}].heel`, "the heel in inches (0 for flats)");
  });
  onlyKeys(L.start, ["shoulderToFloor", "shoe"], "lengths.start", err);
  if (!isObj(L.start) || !half(L.start.shoulderToFloor)) err("lengths.start.shoulderToFloor", "where the measurement starts, in inches");
  if (!Number.isInteger(L.start?.shoe) || L.start.shoe < 0 || L.start.shoe >= (L.shoes?.length ?? 0)) err("lengths.start.shoe", "which of lengths.shoes is chosen first (0 for the first)");
  text(err, "lengths.measure", L.measure);
  if (L.takeUp !== undefined) text(err, "lengths.takeUp", L.takeUp);
}

/** @param {any} h @param {Report} err @param {Exists} exists */
function checkHemLine(h, err, exists) {
  if (!isObj(h)) { err("hemLine", "{ photo, credit? }"); return; }
  onlyKeys(h, ["photo", "credit"], "hemLine", err);
  photo(err, "hemLine.photo", h.photo, exists);
  if (h.credit !== undefined) text(err, "hemLine.credit", h.credit);
}

/** @param {any} e @param {Report} err */
function checkEid(e, err) {
  if (!isObj(e)) { err("eid", "{ cutoffs, note? }"); return; }
  onlyKeys(e, ["cutoffs", "note"], "eid", err);
  if (list(err, "eid.cutoffs", e.cutoffs, "last order date: { label, daysBefore }")) e.cutoffs.forEach((/** @type {any} */ c, /** @type {number} */ i) => {
    onlyKeys(c, ["label", "daysBefore"], `eid.cutoffs[${i}]`, err);
    text(err, `eid.cutoffs[${i}].label`, c?.label);
    if (!Number.isInteger(c?.daysBefore) || c.daysBefore < 0 || c.daysBefore > 120) err(`eid.cutoffs[${i}].daysBefore`, "the shop's last order day, as whole days before Eid's expected window begins");
  });
  if (e.note !== undefined) text(err, "eid.note", e.note);
}

/** @param {any} a @param {Report} err */
function checkAppointments(a, err) {
  if (!isObj(a)) { err("appointments", "{ weekly, days?, closed?, reasons, minutes, intro }"); return; }
  onlyKeys(a, ["weekly", "days", "closed", "reasons", "minutes", "intro", "most"], "appointments", err);
  if (!isObj(a.weekly) || !Object.values(a.weekly).some((t) => Array.isArray(t) && t.length)) err("appointments.weekly", 'the standing times, e.g. { "sat": ["11:00", "14:00"] }');
  else for (const [d, t] of Object.entries(a.weekly)) {
    if (!DAYS.includes(d)) err(`appointments.weekly.${d}`, `a day: ${DAYS.join(", ")}`);
    else if (!Array.isArray(t) || !t.every((x) => TIME.test(x))) err(`appointments.weekly.${d}`, 'times like "11:00"');
  }
  if (a.days !== undefined && (!Number.isInteger(a.days) || a.days < 7 || a.days > 60)) err("appointments.days", "how many days ahead to offer, 7 to 60");
  if (a.closed !== undefined && (!Array.isArray(a.closed) || !a.closed.every(isYmd))) err("appointments.closed", 'dates the studio is closed, "YYYY-MM-DD"');
  if (list(err, "appointments.reasons", a.reasons, "reason (Eid, a wedding…)")) a.reasons.forEach((/** @type {any} */ r, /** @type {number} */ i) => text(err, `appointments.reasons[${i}]`, r));
  if (!Number.isInteger(a.minutes) || a.minutes < 15 || a.minutes > 240) err("appointments.minutes", "how long an appointment is, in minutes");
  if (a.most !== undefined && (!Number.isInteger(a.most) || a.most < 1 || a.most > 12)) err("appointments.most", "how many people may come, 1 to 12");
  text(err, "appointments.intro", a.intro);
}

/** @param {any} site @param {any[]} pieces @param {Report} err @param {Exists} exists */
function checkLooks(site, pieces, err, exists) {
  const l = site.looks;
  if (!isObj(l)) { err("looks", "{ sets }"); return; }
  onlyKeys(l, ["sets", "intro"], "looks", err);
  if (l.intro !== undefined) text(err, "looks.intro", l.intro);
  const pay = new Set((site.payLinks?.items ?? []).map((/** @type {any} */ p) => p?.id));
  if (!list(err, "looks.sets", l.sets, "set: { id, name, items }")) return;
  ids(err, "looks.sets", l.sets);
  l.sets.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    const at = `looks.sets[${i}]`;
    onlyKeys(s, ["id", "name", "line", "photo", "items", "payLink"], at, err);
    text(err, `${at}.name`, s?.name);
    if (s?.line !== undefined) text(err, `${at}.line`, s.line);
    if (s?.photo !== undefined) photo(err, `${at}.photo`, s.photo, exists);
    if (list(err, `${at}.items`, s?.items, "piece: { piece, optional? }")) s.items.forEach((/** @type {any} */ x, /** @type {number} */ j) => {
      onlyKeys(x, ["piece", "optional"], `${at}.items[${j}]`, err);
      const p = pieces.find((y) => y?.id === x?.piece);
      if (!p) err(`${at}.items[${j}].piece`, "the id of a piece in pieces.items");
      if (x?.optional !== undefined && typeof x.optional !== "boolean") err(`${at}.items[${j}].optional`, "true for a piece she may leave out");
      if (j === 0 && (x?.optional || !p?.lengths?.length)) err(`${at}.items[0]`, "the set starts with its abaya: a piece with lengths, not optional");
    });
    if (s?.payLink !== undefined) {
      const link = (site.payLinks?.items ?? []).find((/** @type {any} */ p) => p?.id === s.payLink);
      const base = (s.items ?? []).filter((/** @type {any} */ x) => !x?.optional).reduce((/** @type {number} */ t, /** @type {any} */ x) => t + (pieces.find((y) => y?.id === x?.piece)?.price ?? 0), 0);
      if (!pay.has(s.payLink)) err(`${at}.payLink`, `"${s.payLink}" isn't one of payLinks.items`);
      else if (link.amount !== base) err(`${at}.payLink`, `the Stripe link takes £${link.amount}, but the set as shown is £${base}; a Payment Link's amount is fixed, so they must match`);
      else if (!(site.features ?? []).includes("pay-link")) err(`${at}.payLink`, 'turn on "pay-link" to show it');
    }
  });
}

/** @param {any} f @param {any[]} pieces @param {Report} err @param {Exists} exists */
function checkFamily(f, pieces, err, exists) {
  if (!isObj(f)) { err("family", "{ pieces, intro, max? }"); return; }
  onlyKeys(f, ["pieces", "intro", "max", "photo"], "family", err);
  if (f.photo !== undefined) photo(err, "family.photo", f.photo, exists);
  text(err, "family.intro", f.intro);
  if (list(err, "family.pieces", f.pieces, "piece id")) f.pieces.forEach((/** @type {any} */ id, /** @type {number} */ i) => {
    if (!pieces.some((p) => p?.id === id)) err(`family.pieces[${i}]`, "the id of a piece in pieces.items");
  });
  if (f.max !== undefined && (!Number.isInteger(f.max) || f.max < 2 || f.max > 12)) err("family.max", "how many people the list takes, 2 to 12");
}

/** @param {any} m @param {Report} err @param {Exists} exists */
function checkMadeToMeasure(m, err, exists) {
  if (!page(err, "madeToMeasure", m, ["steps", "measurements", "from", "weeks", "photo"])) return;
  if (list(err, "madeToMeasure.steps", m.steps, "step: { title, text }")) m.steps.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    onlyKeys(s, ["title", "text"], `madeToMeasure.steps[${i}]`, err);
    text(err, `madeToMeasure.steps[${i}].title`, s?.title);
    text(err, `madeToMeasure.steps[${i}].text`, s?.text);
  });
  if (list(err, "madeToMeasure.measurements", m.measurements, "measurement")) m.measurements.forEach((/** @type {any} */ x, /** @type {number} */ i) => text(err, `madeToMeasure.measurements[${i}]`, x));
  if (!isNum(m.from, 1, 20000)) err("madeToMeasure.from", "the price it starts from, in pounds");
  if (!Number.isInteger(m.weeks) || m.weeks < 1 || m.weeks > 26) err("madeToMeasure.weeks", "how many weeks it takes");
  if (m.photo !== undefined) photo(err, "madeToMeasure.photo", m.photo, exists);
}

/** @param {any} f @param {Report} err @param {Exists} exists */
function checkFabrics(f, err, exists) {
  if (!page(err, "fabrics", f, ["items"])) return;
  if (!list(err, "fabrics.items", f.items, "fabric: { name, photo, line, care }")) return;
  f.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `fabrics.items[${i}]`;
    onlyKeys(x, ["name", "photo", "line", "weight", "care"], at, err);
    text(err, `${at}.name`, x?.name);
    text(err, `${at}.line`, x?.line);
    text(err, `${at}.care`, x?.care);
    if (x?.weight !== undefined) text(err, `${at}.weight`, x.weight);
    photo(err, `${at}.photo`, x?.photo, exists);
  });
}
