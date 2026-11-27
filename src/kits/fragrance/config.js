// @ts-check
/**
 * Validation for the fragrance kit (perfume houses with a boutique and an online shop, and new brands launching).
 * Every note, size, price, engraving limit and term is the house's own. The firmest rules of the trade: no claims
 * about how long a scent lasts or how it performs, no "smells like" another brand, and no invented stock or waiting
 * list numbers. Unknown keys are refused so a typo can't silently switch something off. A demo takes no payments.
 */
import { allNotes, noteKey } from "./lib/fragrance.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @typedef {((rel: string) => boolean)|undefined} Exists */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const ID = /^[a-z0-9-]{1,40}$/;
const PAY = /^https:\/\/buy\.stripe\.com\/[A-Za-z0-9_-]+$/;
const FORM = /^https:\/\/(docs\.google\.com\/forms\/|forms\.gle\/)/;
const YMD = /^\d{4}-\d{2}-\d{2}$/;
/** Words a perfume house may not use about its own scents without its own evidence (and never on a demo). */
const CLAIMS = new RegExp([
  String.raw`long[- ]?lasting`, String.raw`lasts? (all day|all night|\d+\s*(h|hrs?|hours?)\b)`, String.raw`all[- ]day( wear| long)?\b`,
  // hours as wear ("8-hour wear", "12h on skin"); plain hours stay allowed ("ready in 48 hours")
  String.raw`\d+\s*[- ]?\s*(h|hrs?|hours?)\b[- ]?(of )?(wear|on( the)? skin|lasting|longevity)`, String.raw`outlasts?`, String.raw`longevity`,
  String.raw`beast mode`, String.raw`projection`, String.raw`sillage of`, String.raw`compliments?`, String.raw`leaves? a trail`, String.raw`trails? (behind|all)`,
  String.raw`smells? (just )?like`, String.raw`dupe`, String.raw`inspired by`, String.raw`clone of`, String.raw`reminiscent of`, String.raw`similar to`, String.raw`alternative to`,
  String.raw`selling fast`, String.raw`only \d+ left`, String.raw`limited stock`,
].map((x) => `\\b${x}\\b`).join("|"), "i");

/** @param {Report} err @param {string} path @param {any} v */
function text(err, path, v) { if (!isStr(v)) err(path, "required text is missing"); }
/** @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (isObj(o)) for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}
/** @param {Report} err @param {string} path @param {any} v @param {number} lo @param {number} hi @param {string} what */
function num(err, path, v, lo, hi, what) { if (typeof v !== "number" || !Number.isFinite(v) || v < lo || v > hi) err(path, what); }
/** @param {Report} err @param {string} path @param {any} v @param {string} mode */
function payLink(err, path, v, mode) {
  if (v === undefined) return;
  if (mode === "demo") err(path, "a demo takes no payments; leave it out (orders go to WhatsApp)");
  else if (typeof v !== "string" || !PAY.test(v)) err(path, "the house's own Stripe Payment Link (https://buy.stripe.com/…)");
}
const PHOTO = ["src", "width", "height", "alt", "focus"];
/** @param {Report} err @param {string} path @param {any} p @param {Exists} exists */
function photo(err, path, p, exists) {
  if (!isObj(p)) { err(path, "a photo: { src, width, height, alt }"); return; }
  onlyKeys(p, PHOTO, path, err);
  text(err, `${path}.alt`, p.alt);
  if (!isStr(p.src)) err(`${path}.src`, "the image file, e.g. img/sable.webp");
  else if (exists && !exists(p.src)) err(`${path}.src`, `file not found: ${p.src}`);
  if (!Number.isInteger(p.width) || !Number.isInteger(p.height) || p.width < 1 || p.height < 1) err(path, "width and height in pixels");
}
/** @param {Report} err @param {string} path @param {any} o @param {string[]} keys @returns {boolean} */
function block(err, path, o, keys) {
  if (!isObj(o)) { err(path, `{ ${keys.join(", ")} }`); return false; }
  onlyKeys(o, keys, path, err);
  return true;
}
/** Where the bottle sits on the hero picture, as fractions of its width and height (measured once). @param {Report} err @param {string} path @param {any} m */
function marks(err, path, m) {
  if (!block(err, path, m, ["neck", "shoulder", "base", "xl", "xr", "floor"])) return;
  for (const k of ["neck", "shoulder", "base", "xl", "xr", "floor"]) num(err, `${path}.${k}`, m[k], 0, 1, "a fraction of the picture, 0–1");
  if (m.neck >= m.shoulder || m.shoulder >= m.base || m.base >= m.floor) err(path, "top to bottom: neck, shoulder, base, floor");
  if (m.xl >= m.xr) err(path, "xl (the bottle's left edge) comes before xr");
}

/**
 * @param {any} f @param {Report} err @param {Exists} exists @param {string} mode
 * @returns {Map<string, any>}
 */
function checkFragrances(f, err, exists, mode) {
  /** @type {Map<string, any>} */ const out = new Map();
  if (!block(err, "fragrances", f, ["title", "intro", "featured", "items", "message", "sampleMessage", "delivery"])) return out;
  text(err, "fragrances.title", f.title);
  text(err, "fragrances.message", f.message);
  if (f.sampleMessage !== undefined) text(err, "fragrances.sampleMessage", f.sampleMessage);
  if (f.delivery !== undefined) text(err, "fragrances.delivery", f.delivery);
  if (!Array.isArray(f.items) || !f.items.length) { err("fragrances.items", "at least one fragrance"); return out; }
  f.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `fragrances.items[${i}]`;
    if (!block(err, at, x, ["id", "name", "line", "character", "notes", "photo", "sizes", "sample", "isNew"])) return;
    if (!ID.test(x.id ?? "")) err(`${at}.id`, "lowercase letters, numbers and dashes");
    else if (out.has(x.id)) err(`${at}.id`, `"${x.id}" is used twice`);
    else out.set(x.id, x);
    text(err, `${at}.name`, x.name);
    text(err, `${at}.line`, x.line);
    if (x.character !== undefined) text(err, `${at}.character`, x.character);
    if (x.notes !== undefined && block(err, `${at}.notes`, x.notes, ["top", "heart", "base"])) {
      for (const t of ["top", "heart", "base"]) {
        const n = x.notes[t];
        if (n !== undefined && (!Array.isArray(n) || !n.length || !n.every(isStr))) err(`${at}.notes.${t}`, "the house's notes for this tier, e.g. [\"bergamot\", \"sea salt\"]");
      }
    }
    photo(err, `${at}.photo`, x.photo, exists);
    if (!Array.isArray(x.sizes) || !x.sizes.length) err(`${at}.sizes`, "at least one size: { ml, price }");
    else x.sizes.forEach((/** @type {any} */ s, /** @type {number} */ j) => {
      onlyKeys(s, ["ml", "price", "payLink"], `${at}.sizes[${j}]`, err);
      num(err, `${at}.sizes[${j}].ml`, s?.ml, 1, 1000, "the size in ml");
      num(err, `${at}.sizes[${j}].price`, s?.price, 1, 10000, "the house's price in pounds");
      payLink(err, `${at}.sizes[${j}].payLink`, s?.payLink, mode);
    });
    if (x.sample !== undefined && block(err, `${at}.sample`, x.sample, ["ml", "price", "payLink"])) {
      num(err, `${at}.sample.ml`, x.sample.ml, 0.5, 15, "the sample's size in ml");
      num(err, `${at}.sample.price`, x.sample.price, 0, 100, "the sample's price in pounds");
      payLink(err, `${at}.sample.payLink`, x.sample.payLink, mode);
    }
    if (x.isNew !== undefined && typeof x.isNew !== "boolean") err(`${at}.isNew`, "true or false");
  });
  if (f.featured !== undefined && !out.has(f.featured)) err("fragrances.featured", `no fragrance "${f.featured}"`);
  return out;
}

/** @param {any} site @param {Report} err @param {Exists} exists @param {Map<string, any>} items */
function checkHero(site, err, exists, items) {
  const h = site.hero;
  if (!block(err, "hero", h, ["kicker", "title", "intro", "fragrance", "photo", "phonePhoto", "marks", "credit"])) return;
  text(err, "hero.kicker", h.kicker);
  if (!items.has(h.fragrance)) err("hero.fragrance", "the fragrance the hero shows (an id in fragrances.items)");
  photo(err, "hero.photo", h.photo, exists);
  if (h.phonePhoto !== undefined) photo(err, "hero.phonePhoto", h.phonePhoto, exists);
  if ((site.features ?? []).includes("fragrance-notes") && h.marks === undefined) err("hero.marks", "with the notes on the bottle, where the bottle sits on the picture: { neck, shoulder, base, xl, xr, floor }");
  if (h.marks !== undefined) marks(err, "hero.marks", h.marks);
}

/** The turntable: the frames of one bottle, numbered from 1, the first being the hero picture. @param {any} t @param {Report} err @param {Exists} exists */
function checkTurntable(t, err, exists) {
  if (!block(err, "turntable", t, ["frames", "repeat", "src", "wideSrc", "phoneSrc", "width", "height", "phoneWidth", "phoneHeight", "credit"])) return;
  if (!Number.isInteger(t.frames) || t.frames < 8 || t.frames > 72) err("turntable.frames", "how many photographs make the full turn, 8–72 (24–36 is usual)");
  if (t.repeat !== undefined && (!Number.isInteger(t.repeat) || t.repeat < 2 || t.frames % t.repeat)) err("turntable.repeat", "a symmetric bottle seen again every N frames (a whole part of frames); leave out for a full set");
  const unique = t.repeat ?? t.frames;
  for (const k of ["src", "wideSrc", "phoneSrc"]) {
    const v = t[k];
    if (v === undefined && k !== "src") continue;
    if (!isStr(v) || !/\{n\}\.[a-z0-9]+$/i.test(v)) { err(`turntable.${k}`, "the frames' file name ending in {n} and the extension, e.g. img/turn/d-{n}.webp"); continue; }
    if (exists) for (let n = 1; n <= unique; n++) { const f = v.replace("{n}", String(n).padStart(2, "0")); if (!exists(f)) { err(`turntable.${k}`, `file not found: ${f}`); break; } }
  }
  for (const k of ["width", "height"]) if (!Number.isInteger(t[k])) err(`turntable.${k}`, "the frames' size in pixels");
  if (t.phoneSrc !== undefined) for (const k of ["phoneWidth", "phoneHeight"]) if (!Number.isInteger(t[k])) err(`turntable.${k}`, "the phone frames' size in pixels");
  if (t.credit !== undefined) text(err, "turntable.credit", t.credit);
}

/** @param {any} e @param {Report} err @param {Exists} exists @param {Map<string, any>} items @param {string} mode */
function checkEngraving(e, err, exists, items, mode) {
  if (!block(err, "engraving", e, ["title", "intro", "price", "maxLetters", "styles", "places", "photo", "area", "fragrance", "ml", "days", "message", "payLink"])) return;
  text(err, "engraving.title", e.title);
  text(err, "engraving.message", e.message);
  num(err, "engraving.price", e.price, 0, 500, "the house's engraving price in pounds");
  if (!Number.isInteger(e.maxLetters) || e.maxLetters < 1 || e.maxLetters > 60) err("engraving.maxLetters", "the house's letter limit, spaces included");
  if (!Array.isArray(e.styles) || !e.styles.length || !e.styles.every((/** @type {any} */ s) => ["caps", "lower", "initials"].includes(s))) err("engraving.styles", "the house's letter styles: caps, lower, initials");
  if (!Array.isArray(e.places) || !e.places.length || !e.places.every((/** @type {any} */ s) => ["glass", "box"].includes(s))) err("engraving.places", "where it can go: glass, box");
  if (e.days !== undefined) text(err, "engraving.days", e.days);
  if (!items.has(e.fragrance)) err("engraving.fragrance", "the fragrance the desk shows (an id in fragrances.items)");
  else if (!items.get(e.fragrance).sizes?.some((/** @type {any} */ s) => s.ml === e.ml)) err("engraving.ml", "one of that fragrance's sizes");
  payLink(err, "engraving.payLink", e.payLink, mode);
  // The live preview needs one front-on picture with the engravable area marked; without it the plain order form shows.
  if (e.photo !== undefined || e.area !== undefined) {
    photo(err, "engraving.photo", e.photo, exists);
    if (block(err, "engraving.area", e.area, ["x0", "y0", "x1", "y1"])) {
      for (const k of ["x0", "y0", "x1", "y1"]) num(err, `engraving.area.${k}`, e.area[k], 0, 1, "a fraction of the picture, 0–1");
      if (!(e.area.x0 < e.area.x1 && e.area.y0 < e.area.y1)) err("engraving.area", "x0 < x1 and y0 < y1");
    }
  }
}

/** @param {any} o @param {Report} err @param {Exists} exists @param {Map<string, any>} items */
function checkOrgan(o, err, exists, items) {
  if (!block(err, "organ", o, ["title", "intro", "max", "ingredients", "note"])) return;
  text(err, "organ.title", o.title);
  if (o.max !== undefined && (!Number.isInteger(o.max) || o.max < 1 || o.max > 5)) err("organ.max", "how many may be chosen, 1–5");
  const notes = new Set([...items.values()].flatMap((f) => allNotes(f).map(noteKey)));
  if (!Array.isArray(o.ingredients) || o.ingredients.length < 3) { err("organ.ingredients", "at least three: { note, photo }"); return; }
  o.ingredients.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `organ.ingredients[${i}]`;
    onlyKeys(x, ["note", "photo", "credit"], at, err);
    text(err, `${at}.note`, x?.note);
    // An ingredient no bottle has is never shown: the organ only offers what the house uses.
    if (isStr(x?.note) && !notes.has(noteKey(x.note))) err(`${at}.note`, `no fragrance lists "${x.note}"`);
    photo(err, `${at}.photo`, x?.photo, exists);
    if (x?.credit !== undefined) text(err, `${at}.credit`, x.credit);
  });
}

/** @param {any} d @param {Report} err @param {string} mode */
function checkDiscovery(d, err, mode) {
  if (!block(err, "discovery", d, ["title", "intro", "pick", "ml", "price", "terms", "message", "payLink"])) return;
  text(err, "discovery.title", d.title);
  text(err, "discovery.terms", d.terms);
  text(err, "discovery.message", d.message);
  if (!Number.isInteger(d.pick) || d.pick < 2 || d.pick > 10) err("discovery.pick", "how many samples a set holds, 2–10");
  num(err, "discovery.ml", d.ml, 0.5, 15, "each sample's size in ml");
  num(err, "discovery.price", d.price, 1, 500, "the set's price in pounds");
  payLink(err, "discovery.payLink", d.payLink, mode);
}

/** @param {any} g @param {Report} err */
function checkGifts(g, err) {
  if (!block(err, "gifts", g, ["title", "intro", "wrap", "terms", "message"])) return;
  text(err, "gifts.title", g.title);
  text(err, "gifts.message", g.message);
  if (g.terms !== undefined) text(err, "gifts.terms", g.terms);
  if (g.wrap !== undefined && block(err, "gifts.wrap", g.wrap, ["price", "line"])) {
    num(err, "gifts.wrap.price", g.wrap.price, 0, 100, "the wrapping price in pounds (0 if free)");
    text(err, "gifts.wrap.line", g.wrap.line);
  }
}

/** Let them choose: an amount paid now; they try samples and choose. @param {any} c @param {Report} err @param {string} mode */
function checkChoose(c, err, mode) {
  if (!block(err, "choose", c, ["title", "intro", "amounts", "terms", "message", "redeemTitle", "redeemMessage"])) return;
  for (const k of ["title", "terms", "message", "redeemTitle", "redeemMessage"]) text(err, `choose.${k}`, c[k]);
  if (!Array.isArray(c.amounts) || !c.amounts.length) err("choose.amounts", "the amounts the house sells: { amount, payLink }");
  else c.amounts.forEach((/** @type {any} */ a, /** @type {number} */ i) => {
    onlyKeys(a, ["amount", "payLink"], `choose.amounts[${i}]`, err);
    num(err, `choose.amounts[${i}].amount`, a?.amount, 1, 5000, "an amount in pounds");
    payLink(err, `choose.amounts[${i}].payLink`, a?.payLink, mode);
  });
}

/** Launch mode. @param {any} l @param {Report} err @param {Map<string, any>} items @param {string} mode */
function checkLaunch(l, err, items, mode) {
  if (!block(err, "launch", l, ["date", "newWeeks", "scents", "waitlist", "preorder", "story", "terms", "message"])) return;
  if (!YMD.test(l.date ?? "")) err("launch.date", "the launch day, YYYY-MM-DD");
  if (l.newWeeks !== undefined && (!Number.isInteger(l.newWeeks) || l.newWeeks < 0 || l.newWeeks > 26)) err("launch.newWeeks", "how many weeks the launch scents show as new, 0–26");
  if (!Array.isArray(l.scents) || !l.scents.length) err("launch.scents", "the launch fragrances (ids)");
  else l.scents.forEach((/** @type {any} */ id, /** @type {number} */ i) => { if (!items.has(id)) err(`launch.scents[${i}]`, `no fragrance "${id}"`); });
  text(err, "launch.terms", l.terms);
  text(err, "launch.message", l.message);
  if (l.waitlist !== undefined && block(err, "launch.waitlist", l.waitlist, ["formUrl"])) {
    if (mode === "demo") err("launch.waitlist.formUrl", "a demo collects no names; leave it out (the waiting list goes to WhatsApp)");
    else if (!FORM.test(l.waitlist.formUrl ?? "")) err("launch.waitlist.formUrl", "the house's Google Form for the waiting list");
  }
  if (l.preorder !== undefined) {
    if (!isObj(l.preorder)) err("launch.preorder", "{ fragrance id: Stripe Payment Link }");
    else for (const [id, link] of Object.entries(l.preorder)) { if (!items.has(id)) err(`launch.preorder.${id}`, `no fragrance "${id}"`); payLink(err, `launch.preorder.${id}`, link, mode); }
  }
  if (l.story !== undefined && block(err, "launch.story", l.story, ["title", "text", "by"])) for (const k of ["title", "text", "by"]) text(err, `launch.story.${k}`, l.story[k]);
}

/** Every string the house writes, on every page, is checked for performance claims and brand comparisons. @param {any} site @param {Report} err */
function claims(site, err) {
  const skip = new Set(["src", "url", "href", "image", "directionsUrl", "sameAs", "features", "id", "slug", "payLink", "formUrl", "alt", "credit", "wideSrc", "phoneSrc", "kit", "look", "mode", "plan", "lang", "schemaVersion", "contact", "booking", "hours", "brand"]);
  /** @param {any} v @param {string} path */
  const walk = (v, path) => {
    if (typeof v === "string") { if (CLAIMS.test(v)) err(path, `a performance claim or comparison ("${v.match(CLAIMS)?.[0]}"): notes and character only, in the house's words`); }
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (isObj(v)) for (const [k, x] of Object.entries(v)) if (!skip.has(k)) walk(x, path ? `${path}.${k}` : k);
  };
  // Every word the house writes, anywhere on the site (pages, questions, the business line), not only the kit's sections.
  walk(site, "");
}

/** @param {any} site @param {Report} err @param {Exists} [exists] */
export function checkFragrance(site, err, exists) {
  if (site.kit !== "fragrance") return;
  const mode = site.mode ?? "client";
  const items = checkFragrances(site.fragrances, err, exists, mode);
  if (site.look === "verriere") checkHero(site, err, exists, items);
  if (site.turntable !== undefined) checkTurntable(site.turntable, err, exists);
  if (site.engraving !== undefined) checkEngraving(site.engraving, err, exists, items, mode);
  if ((site.features ?? []).includes("fragrance-engraving-desk") && (site.engraving?.photo === undefined || site.engraving?.area === undefined)) err("engraving", "the engraving desk needs one front-on picture of the bottle with its engravable area: { photo, area }");
  if (site.organ !== undefined) checkOrgan(site.organ, err, exists, items);
  if (site.discovery !== undefined) checkDiscovery(site.discovery, err, mode);
  if (site.gifts !== undefined) checkGifts(site.gifts, err);
  if (site.choose !== undefined) checkChoose(site.choose, err, mode);
  if (site.launch !== undefined) checkLaunch(site.launch, err, items, mode);
  claims(site, err);
}
