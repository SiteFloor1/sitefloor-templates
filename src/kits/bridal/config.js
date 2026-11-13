// @ts-check
/**
 * Validation for the bridal kit (bridal salons): the appointment card and request, the designers, the gowns and their
 * photographs, the diary's timings, trunk shows and sample sales, fittings and veils. Every figure here (fees, prices,
 * lead times, fittings) is the salon's own; the checks only make sure it is complete and can't mislead.
 */
import { SILHOUETTES, NECKLINES, SLEEVES } from "./lib/gowns.js";
import { isYmd } from "../../core/lib/diary.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const ID = /^[a-z0-9-]{1,40}$/;

/** @param {Report} err @param {string} path @param {any} v */
function text(err, path, v) { if (!isStr(v)) err(path, "required text is missing"); }

/** A misspelt setting is refused, not silently ignored. @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (isObj(o)) for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}

const PHOTO = ["src", "width", "height", "alt", "caption"];
const PAGE_HEAD = ["kicker", "title", "intro"];

/**
 * The salon's own Stripe Payment Link: a test-mode link on a demo (so nothing is ever charged), the live link on a
 * client site (a test link can't take a bride's money). @param {any} link @param {string} at @param {string} mode @param {Report} err
 */
function stripeLink(link, at, mode, err) {
  if (!/^https:\/\/buy\.stripe\.com\/[\w-]+$/.test(link ?? "")) err(at, "the salon's own Stripe Payment Link, https://buy.stripe.com/…");
  else if (mode === "demo" && !link.startsWith("https://buy.stripe.com/test_")) err(at, "demo sites must use a Stripe test-mode link (https://buy.stripe.com/test_…)");
  else if (mode === "client" && link.startsWith("https://buy.stripe.com/test_")) err(at, "is a Stripe test-mode link; client sites need the salon's live link");
}

/** @param {Report} err @param {string} path @param {any} p @param {((rel: string) => boolean)|undefined} exists @param {string[]} [keys] */
function photo(err, path, p, exists, keys = PHOTO) {
  if (!isObj(p)) { err(path, "a photo: { src, width, height, alt }"); return; }
  onlyKeys(p, keys, path, err);
  text(err, `${path}.alt`, p.alt);
  if (!Number.isInteger(p.width) || !Number.isInteger(p.height)) err(path, "width and height in pixels");
  if (!isStr(p.src)) err(`${path}.src`, "required");
  else if (exists && !exists(p.src)) err(`${path}.src`, `file not found: ${p.src}`);
}

/** Unique ids in a list. @param {Report} err @param {string} path @param {any[]} list */
function ids(err, path, list) {
  const seen = new Set();
  list.forEach((x, i) => {
    if (!ID.test(x?.id ?? "")) err(`${path}[${i}].id`, "lowercase letters, numbers and dashes");
    else if (seen.has(x.id)) err(`${path}[${i}].id`, `"${x.id}" is used twice`);
    seen.add(x?.id);
  });
}

/** @param {any} site @param {Report} err @param {((rel: string) => boolean)|undefined} [exists] */
export function checkBridal(site, err, exists) {
  if (site.kit !== "bridal") return;
  checkMirror(site.hero?.mirror, err, exists);
  checkAppointment(site.appointment, site.mode, err);
  const houses = checkDesigners(site.designers, err);
  if (site.gowns !== undefined) checkGowns(site.gowns, houses, err, exists);
  if (site.diary !== undefined) checkDiary(site.diary, err);
  if (site.trunkShows !== undefined) checkTrunkShows(site.trunkShows, houses, err);
  if (site.fittingsPage !== undefined) checkFittings(site.fittingsPage, err, exists);
  if (site.shortlist !== undefined) { onlyKeys(site.shortlist, ["message"], "shortlist", err); text(err, "shortlist.message", site.shortlist?.message); }
  for (const k of ["gownsPage", "bridesPage", "giftPage"]) if (site[k] !== undefined) { onlyKeys(site[k], PAGE_HEAD, k, err); text(err, `${k}.title`, site[k]?.title); }
  const a = site.appointment;
  if (a?.room !== undefined) photo(err, "appointment.room", a.room, exists);
  if (a?.detail !== undefined) photo(err, "appointment.detail", a.detail, exists);
}

/** The hero's three panes: three photographs of one gown, each captioned. @param {any} m @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkMirror(m, err, exists) {
  if (m === undefined) return;
  if (!isObj(m)) { err("hero.mirror", "{ label, left, centre, right }"); return; }
  onlyKeys(m, ["label", "left", "centre", "right"], "hero.mirror", err);
  text(err, "hero.mirror.label", m.label);
  for (const k of ["left", "centre", "right"]) { photo(err, `hero.mirror.${k}`, m[k], exists, ["src", "width", "height", "alt", "label"]); text(err, `hero.mirror.${k}.label`, m[k]?.label); }
}

/** The card's facts are the salon's own words; the request needs its opening line. @param {any} a @param {string} mode @param {Report} err */
function checkAppointment(a, mode, err) {
  if (a === undefined) return;
  if (!isObj(a)) { err("appointment", "an object; see src/kits/bridal/features/appointment/README.md"); return; }
  onlyKeys(a, ["message", "facts", "note", "maxGuests", "times", "feeLink", "intro", "room", "detail"], "appointment", err);
  text(err, "appointment.message", a.message);
  if (!Array.isArray(a.facts) || !a.facts.length) err("appointment.facts", "at least one fact, e.g. { label: \"Length\", value: \"90 minutes\" }");
  else a.facts.forEach((/** @type {any} */ f, /** @type {number} */ i) => { onlyKeys(f, ["label", "value"], `appointment.facts[${i}]`, err); text(err, `appointment.facts[${i}].label`, f?.label); text(err, `appointment.facts[${i}].value`, f?.value); });
  if (!Number.isInteger(a.maxGuests) || a.maxGuests < 0 || a.maxGuests > 10) err("appointment.maxGuests", "how many guests may come with the bride, 0–10");
  if (a.times !== undefined && (!Array.isArray(a.times) || !a.times.every(isStr))) err("appointment.times", "a list of choices, e.g. [\"A weekday morning\", \"A Saturday\"]");
  if (a.feeLink !== undefined) stripeLink(a.feeLink, "appointment.feeLink", mode, err);
}

/** @param {any} d @param {Report} err @returns {Set<string>} the houses' ids */
function checkDesigners(d, err) {
  /** @type {Set<string>} */ const out = new Set();
  if (d === undefined) return out;
  if (!isObj(d) || !Array.isArray(d.items) || !d.items.length) { err("designers.items", "at least one designer"); return out; }
  onlyKeys(d, ["items"], "designers", err);
  ids(err, "designers.items", d.items);
  d.items.forEach((/** @type {any} */ h, /** @type {number} */ i) => {
    onlyKeys(h, ["id", "name", "known", "prices"], `designers.items[${i}]`, err);
    text(err, `designers.items[${i}].name`, h?.name);
    text(err, `designers.items[${i}].known`, h?.known);
    text(err, `designers.items[${i}].prices`, h?.prices);
    if (h?.id) out.add(h.id);
  });
  return out;
}

/** @param {any} g @param {Set<string>} houses @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkGowns(g, houses, err, exists) {
  if (!isObj(g) || !Array.isArray(g.items) || !g.items.length) { err("gowns.items", "at least one gown"); return; }
  onlyKeys(g, ["message", "items"], "gowns", err);
  text(err, "gowns.message", g.message);
  ids(err, "gowns.items", g.items);
  g.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => checkGown(x, `gowns.items[${i}]`, houses, err, exists));
}

/** @param {any} x @param {string} p @param {Set<string>} houses @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkGown(x, p, houses, err, exists) {
  onlyKeys(x, ["id", "name", "house", "fabric", "silhouette", "neckline", "sleeve", "price", "editorial", "views"], p, err);
  text(err, `${p}.name`, x?.name);
  text(err, `${p}.fabric`, x?.fabric);
  if (!houses.has(x?.house)) err(`${p}.house`, `one of the designers' ids (${[...houses].join(", ") || "add designers first"})`);
  for (const [k, words] of /** @type {[string, Record<string, string>][]} */ ([["silhouette", SILHOUETTES], ["neckline", NECKLINES], ["sleeve", SLEEVES]])) {
    if (!(x?.[k] in words)) err(`${p}.${k}`, `one of ${Object.keys(words).join(", ")}`);
  }
  if (x?.price !== null && !(Number.isInteger(x?.price) && x.price > 0)) err(`${p}.price`, "the salon's price in whole pounds, or null for \"price on request\"");
  if (x?.editorial !== undefined) checkEditorial(x.editorial, `${p}.editorial`, err, exists);
  if (!Array.isArray(x?.views) || !x.views.length) err(`${p}.views`, "at least one photo of the gown; the first is its card");
  else x.views.forEach((/** @type {any} */ v, /** @type {number} */ j) => { photo(err, `${p}.views[${j}]`, v, exists, ["label", "src", "width", "height", "alt"]); text(err, `${p}.views[${j}].label`, v?.label); });
}

/**
 * A gown that leads on the home page: a wide photograph for large screens and a tall one for phones, worn, the gown
 * the subject. @param {any} e @param {string} p @param {Report} err @param {((rel: string) => boolean)|undefined} exists
 */
function checkEditorial(e, p, err, exists) {
  if (!isObj(e)) { err(p, "{ layout, wide: photo, tall: photo }"); return; }
  onlyKeys(e, ["layout", "wide", "tall"], p, err);
  onlyKeys(e.tall, ["src", "width", "height"], `${p}.tall`, err);
  if (e.layout !== undefined && !["full", "left", "right"].includes(e.layout)) err(`${p}.layout`, '"full", "left" or "right"');
  photo(err, `${p}.wide`, e.wide, exists);
  if (!isObj(e.tall)) err(`${p}.tall`, "the phone's photograph: { src, width, height }");
  else { if (!Number.isInteger(e.tall.width) || !Number.isInteger(e.tall.height)) err(`${p}.tall`, "width and height in pixels"); if (exists && isStr(e.tall.src) && !exists(e.tall.src)) err(`${p}.tall.src`, `file not found: ${e.tall.src}`); }
}

/** The diary's steps are the salon's timings, in weeks before the wedding. @param {any} d @param {Report} err */
function checkDiary(d, err) {
  if (!isObj(d) || !Array.isArray(d.steps) || !d.steps.length) { err("diary.steps", "the salon's steps, e.g. { id: \"order\", label: \"Order your gown\", weeksBefore: 40 }"); return; }
  onlyKeys(d, ["orderStep", "late", "steps"], "diary", err);
  ids(err, "diary.steps", d.steps);
  d.steps.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    onlyKeys(s, ["id", "label", "weeksBefore", "note"], `diary.steps[${i}]`, err);
    text(err, `diary.steps[${i}].label`, s?.label);
    if (!Number.isInteger(s?.weeksBefore) || s.weeksBefore < 0 || s.weeksBefore > 104) err(`diary.steps[${i}].weeksBefore`, "whole weeks before the wedding, 0–104");
  });
  if (!d.steps.some((/** @type {any} */ s) => s?.id === d.orderStep)) err("diary.orderStep", "the id of the step that is the last day to order");
  text(err, "diary.late", d.late);
}

/** @param {any} t @param {Set<string>} houses @param {Report} err */
function checkTrunkShows(t, houses, err) {
  if (!isObj(t) || !Array.isArray(t.items)) { err("trunkShows.items", "a list (it may be empty between seasons)"); return; }
  onlyKeys(t, ["formUrl", "items"], "trunkShows", err);
  if (t.formUrl !== undefined && !/^https:\/\/(docs\.google\.com\/forms|forms\.gle)\//.test(t.formUrl)) err("trunkShows.formUrl", "the salon's own Google Form for the waiting list");
  ids(err, "trunkShows.items", t.items);
  t.items.forEach((/** @type {any} */ e, /** @type {number} */ i) => {
    const p = `trunkShows.items[${i}]`;
    onlyKeys(e, ["id", "kind", "house", "title", "from", "to", "text"], p, err);
    if (!["trunk-show", "sample-sale"].includes(e?.kind)) err(`${p}.kind`, '"trunk-show" or "sample-sale"');
    text(err, `${p}.title`, e?.title);
    text(err, `${p}.text`, e?.text);
    if (!isYmd(e?.from) || !isYmd(e?.to)) err(p, "from and to, real dates, YYYY-MM-DD");
    else if (e.to < e.from) err(`${p}.to`, "ends before it starts");
    if (e?.house !== undefined && !houses.has(e.house)) err(`${p}.house`, "one of the designers' ids");
  });
}

/** @param {any} f @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkFittings(f, err, exists) {
  if (!isObj(f)) { err("fittingsPage", "an object"); return; }
  onlyKeys(f, [...PAGE_HEAD, "fittings", "alterations", "veils", "photo"], "fittingsPage", err);
  text(err, "fittingsPage.title", f.title);
  if (!Array.isArray(f.fittings) || !f.fittings.length) err("fittingsPage.fittings", "each fitting: { title, when, text }");
  else f.fittings.forEach((/** @type {any} */ x, /** @type {number} */ i) => { onlyKeys(x, ["title", "when", "text"], `fittingsPage.fittings[${i}]`, err); for (const k of ["title", "when", "text"]) text(err, `fittingsPage.fittings[${i}].${k}`, x?.[k]); });
  text(err, "fittingsPage.alterations", f.alterations);
  (f.veils ?? []).forEach((/** @type {any} */ v, /** @type {number} */ i) => { onlyKeys(v, ["name", "length", "text", "price"], `fittingsPage.veils[${i}]`, err); for (const k of ["name", "length", "text"]) text(err, `fittingsPage.veils[${i}].${k}`, v?.[k]); });
  if (f.photo !== undefined) photo(err, "fittingsPage.photo", f.photo, exists);
}
