// @ts-check
/**
 * Validation for the garage kit (car parking, garages and car storage). Every measurement, price, charger, camera and
 * fact is the client's own; these checks keep the hall drawable and honest: bays fit inside the hall, numbers are
 * unique, chargers have a speed, cameras sit inside the walls, the aerial render has every image it draws on, and a
 * security fact is only ever text the client wrote (nothing is inferred).
 */
import { allBays } from "./lib/garage.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @typedef {((rel: string) => boolean)|undefined} Exists */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
/** @param {any} v @param {number} lo @param {number} hi */
const isNum = (v, lo, hi) => typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const IMG = /^img\/[\w./-]+\.(webp|jpe?g|png)$/;

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

/** @param {Report} err @param {string} path @param {any} v @param {Exists} exists */
function file(err, path, v, exists) {
  if (!isStr(v) || !IMG.test(v)) err(path, "a file in img/ (webp, jpg or png)");
  else if (exists && !exists(v)) err(path, `file not found: ${v}`);
}

/** @param {Report} err @param {string} path @param {any} p @param {Exists} exists */
function photo(err, path, p, exists) {
  if (!isObj(p)) { err(path, "a photo: { src, width, height, alt }"); return; }
  onlyKeys(p, ["src", "width", "height", "alt", "focus"], path, err);
  file(err, `${path}.src`, p.src, exists);
  text(err, `${path}.alt`, p.alt);
  if (!Number.isInteger(p.width) || !Number.isInteger(p.height)) err(path, "width and height in pixels");
  if (p.focus !== undefined && !/^\d{1,3}% \d{1,3}%$/.test(p.focus)) err(`${path}.focus`, 'where the subject sits, e.g. "50% 30%"');
}

/** @param {Report} err @param {string} path @param {any} o @param {string[]} keys */
function section(err, path, o, keys) {
  if (!isObj(o)) { err(path, `{ ${keys.join(", ")} }`); return false; }
  onlyKeys(o, keys, path, err);
  return true;
}

/** @param {any} site @param {Report} err @param {Exists} exists */
export function checkGarage(site, err, exists) {
  if (site.kit !== "garage") return;
  const features = /** @type {string[]} */ (Array.isArray(site.features) ? site.features : []);
  if (site.hall !== undefined) checkHall(site.hall, err);
  if (site.hero !== undefined) checkHero(site, err, exists);
  if (site.charging !== undefined) checkCharging(site, err);
  if (site.access !== undefined && section(err, "access", site.access, ["facts"])) lines(err, "access.facts", site.access.facts, "fact");
  if (site.security !== undefined) checkSecurity(site, err);
  if (site.kept !== undefined) checkKept(site.kept, err, exists);
  if (site.careCard !== undefined) checkCareCard(site.careCard, err);
  if (site.moveIn !== undefined) checkMoveIn(site.moveIn, err);
  if (site.layingUp !== undefined) checkLayingUp(site.layingUp, err);
  if (site.companies !== undefined) checkCompanies(site.companies, err);
  if (site.night !== undefined) checkNight(site.night, err, exists);
  if (site.insurerLetter !== undefined) checkLetter(site, err, exists);
  if (site.aerial !== undefined) checkAerial(site, err, exists);
  if (features.includes("garage-aerial") && !features.includes("garage-pick")) err("features", "garage-aerial needs garage-pick (the picker drives the car in)");
}

/** A list of the client's own lines. @param {Report} err @param {string} path @param {any} v @param {string} what */
function lines(err, path, v, what) {
  if (list(err, path, v, what)) v.forEach((/** @type {any} */ x, /** @type {number} */ i) => text(err, `${path}[${i}]`, x));
}

/** @param {any} c @param {Report} err */
function checkCareCard(c, err) {
  if (!section(err, "careCard", c, ["checks", "sample", "every"])) return;
  lines(err, "careCard.checks", c.checks, "check");
  text(err, "careCard.sample", c.sample);
  text(err, "careCard.every", c.every);
}

/** @param {any} c @param {Report} err */
function checkCompanies(c, err) {
  if (!section(err, "companies", c, ["intro", "sizes", "access"])) return;
  for (const k of ["sizes", "access"]) lines(err, `companies.${k}`, c[k], "choice");
  if (c.intro !== undefined) text(err, "companies.intro", c.intro);
}

/** @param {any} site @param {Report} err */
function checkCharging(site, err) {
  if (!section(err, "charging", site.charging, ["plugInBy", "readyBy", "note"])) return;
  for (const k of ["plugInBy", "readyBy"]) if (!TIME.test(site.charging[k] ?? "")) err(`charging.${k}`, "a time, HH:MM");
  if (site.charging.note !== undefined) text(err, "charging.note", site.charging.note);
  if (isObj(site.hall) && Array.isArray(site.hall.rows) && !allBays(site.hall).some((b) => b.charger)) err("charging", "no bay in hall.rows has a charger (charger: kW)");
}

/** @param {any} k @param {Report} err @param {Exists} exists */
function checkKept(k, err, exists) {
  if (!section(err, "kept", k, ["items"]) || !list(err, "kept.items", k.items, "item")) return;
  k.items.forEach((/** @type {any} */ it, /** @type {number} */ i) => {
    onlyKeys(it, ["title", "text", "photo"], `kept.items[${i}]`, err);
    text(err, `kept.items[${i}].title`, it.title); text(err, `kept.items[${i}].text`, it.text);
    photo(err, `kept.items[${i}].photo`, it.photo, exists);
  });
}

/** @param {any} m @param {Report} err */
function checkMoveIn(m, err) {
  if (!section(err, "moveIn", m, ["steps"]) || !list(err, "moveIn.steps", m.steps, "step")) return;
  m.steps.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    onlyKeys(s, ["day", "title", "note"], `moveIn.steps[${i}]`, err);
    if (!Number.isInteger(s.day) || Math.abs(s.day) > 120) err(`moveIn.steps[${i}].day`, "days from the start date (0 = the start, -7 = a week before)");
    text(err, `moveIn.steps[${i}].title`, s.title);
    if (s.note !== undefined) text(err, `moveIn.steps[${i}].note`, s.note);
  });
}

/** @param {any} L @param {Report} err */
function checkLayingUp(L, err) {
  if (!section(err, "layingUp", L, ["intro", "every", "visit", "back", "links"])) return;
  if (!Number.isInteger(L.every) || L.every < 7 || L.every > 90) err("layingUp.every", "days between care visits, 7 to 90");
  text(err, "layingUp.visit", L.visit); text(err, "layingUp.back", L.back);
  if (L.intro !== undefined) text(err, "layingUp.intro", L.intro);
  if (L.links === undefined || !list(err, "layingUp.links", L.links, "link")) return;
  L.links.forEach((/** @type {any} */ l, /** @type {number} */ i) => {
    onlyKeys(l, ["label", "url"], `layingUp.links[${i}]`, err);
    text(err, `layingUp.links[${i}].label`, l.label);
    if (!/^https:\/\/www\.gov\.uk\//.test(l.url ?? "")) err(`layingUp.links[${i}].url`, "a GOV.UK page (https://www.gov.uk/…): tax, SORN and insurance facts link to the source");
  });
}

/** @param {any} n @param {Report} err @param {Exists} exists */
function checkNight(n, err, exists) {
  if (!section(err, "night", n, ["intro", "steps"]) || !list(err, "night.steps", n.steps, "step")) return;
  if (n.intro !== undefined) text(err, "night.intro", n.intro);
  n.steps.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    onlyKeys(s, ["title", "text", "photo"], `night.steps[${i}]`, err);
    text(err, `night.steps[${i}].title`, s.title);
    if (s.text !== undefined) text(err, `night.steps[${i}].text`, s.text);
    if (s.photo !== undefined) photo(err, `night.steps[${i}].photo`, s.photo, exists);
  });
}

/** @param {any} site @param {Report} err @param {Exists} exists */
function checkLetter(site, err, exists) {
  if (!section(err, "insurerLetter", site.insurerLetter, ["file", "label"])) return;
  const f = site.insurerLetter.file;
  if (!isStr(f) || !/^img\/[\w./-]+\.pdf$/.test(f)) err("insurerLetter.file", "the client's own letter, a PDF in img/");
  else if (exists && !exists(f)) err("insurerLetter.file", `file not found: ${f}`);
  text(err, "insurerLetter.label", site.insurerLetter.label);
  if (site.mode === "demo") err("insurerLetter", "a real letter is the client's own document: client sites only");
}

/** @param {any} h @param {Report} err */
function checkHall(h, err) {
  if (!section(err, "hall", h, ["name", "width", "depth", "bayDepth", "gate", "rows", "columns"])) return;
  text(err, "hall.name", h.name);
  if (!isNum(h.width, 5, 200)) err("hall.width", "the inside width in metres, west wall (the gate) to east wall");
  if (!isNum(h.depth, 8, 100)) err("hall.depth", "the inside depth in metres, south wall to north wall");
  if (!isNum(h.bayDepth, 4, 7)) err("hall.bayDepth", "bay depth in metres, 4 to 7");
  if (isNum(h.depth, 8, 100) && isNum(h.bayDepth, 4, 7) && h.depth - 2 * h.bayDepth < 5) err("hall.depth", "leaves an aisle under 5 m between the two rows");
  if (!isObj(h.gate) || !isNum(h.gate.y, 0, h.depth ?? 100) || !isNum(h.gate.width, 2.4, 10)) err("hall.gate", "{ y: its centre from the south wall, width } in metres");
  else onlyKeys(h.gate, ["y", "width"], "hall.gate", err);
  if (!list(err, "hall.rows", h.rows, "row")) return;
  const seen = new Set();
  h.rows.forEach((/** @type {any} */ r, /** @type {number} */ i) => {
    onlyKeys(r, ["side", "x", "bays"], `hall.rows[${i}]`, err);
    if (!["north", "south"].includes(r.side)) err(`hall.rows[${i}].side`, '"north" or "south"');
    if (!isNum(r.x, 0, 50)) err(`hall.rows[${i}].x`, "where the row starts, metres from the gate wall");
    if (!list(err, `hall.rows[${i}].bays`, r.bays, "bay")) return;
    let x = r.x ?? 0;
    r.bays.forEach((/** @type {any} */ b, /** @type {number} */ j) => {
      const at = `hall.rows[${i}].bays[${j}]`;
      onlyKeys(b, ["n", "width", "free", "price", "charger"], at, err);
      if (!Number.isInteger(b.n) || b.n < 1) err(`${at}.n`, "the bay's number");
      else if (seen.has(b.n)) err(`${at}.n`, `bay ${b.n} is listed twice`);
      seen.add(b.n);
      if (!isNum(b.width, 1.8, 6)) err(`${at}.width`, "the bay's width in metres");
      if (typeof b.free !== "boolean") err(`${at}.free`, "true (free now) or false (let)");
      if (b.price !== undefined && !isNum(b.price, 1, 5000)) err(`${at}.price`, "the monthly price in pounds");
      if (b.charger !== undefined && ![3, 7, 11, 22, 50].includes(b.charger)) err(`${at}.charger`, "its speed in kW: 3, 7, 11, 22 or 50");
      x += isNum(b.width, 0, 10) ? b.width : 0;
    });
    if (isNum(h.width, 5, 200) && x > h.width + 1e-6) err(`hall.rows[${i}]`, `its bays run to ${x.toFixed(2)} m, past the ${h.width} m wall`);
  });
  if (h.columns !== undefined && Array.isArray(h.columns)) h.columns.forEach((/** @type {any} */ c, /** @type {number} */ i) => {
    if (!Array.isArray(c) || c.length !== 2 || !isNum(c[0], 0, h.width ?? 200) || !isNum(c[1], 0, h.depth ?? 100)) err(`hall.columns[${i}]`, "[x, y] in metres, inside the hall");
  });
}

/** @param {any} site @param {Report} err @param {Exists} exists */
function checkHero(site, err, exists) {
  const h = site.hero;
  if (!section(err, "hero", h, ["kicker", "title", "where", "medium", "intro", "from", "photo", "credit"])) return;
  for (const k of ["where", "from"]) text(err, `hero.${k}`, h[k]);
  for (const k of ["medium", "credit"]) if (h[k] !== undefined) text(err, `hero.${k}`, h[k]);
  if (h.photo !== undefined) photo(err, "hero.photo", h.photo, exists);
  if (h.photo === undefined && !(site.features ?? []).includes("garage-aerial")) err("hero.photo", "the hall's own photograph (or turn on garage-aerial)");
}

/** @param {any} site @param {Report} err */
function checkSecurity(site, err) {
  const s = site.security, h = site.hall;
  if (!section(err, "security", s, ["cameras", "recorded", "facts"])) return;
  text(err, "security.recorded", s.recorded);
  if (/live/i.test(s.recorded ?? "") && !/never|no live/i.test(s.recorded)) err("security.recorded", "the site never offers a live camera feed; say how footage is kept");
  if (list(err, "security.facts", s.facts, "fact")) s.facts.forEach((/** @type {any} */ f, /** @type {number} */ i) => text(err, `security.facts[${i}]`, f));
  if (s.cameras !== undefined && list(err, "security.cameras", s.cameras, "camera")) s.cameras.forEach((/** @type {any} */ c, /** @type {number} */ i) => {
    onlyKeys(c, ["x", "y", "facing"], `security.cameras[${i}]`, err);
    if (!isNum(c.x, 0, h?.width ?? 200) || !isNum(c.y, 0, h?.depth ?? 100)) err(`security.cameras[${i}]`, "x and y in metres, inside the hall");
    if (!isNum(c.facing, -360, 360)) err(`security.cameras[${i}].facing`, "the way it looks, in degrees (0 = towards the east wall, 90 = north)");
  });
}

/** @param {any} site @param {Report} err @param {Exists} exists */
function checkAerial(site, err, exists) {
  const a = site.aerial;
  if (!section(err, "aerial", a, ["day", "night", "dayPhone", "nightPhone", "cars", "frame", "phoneFrame"])) return;
  for (const k of ["day", "night", "dayPhone", "nightPhone"]) {
    const p = a[k];
    if (!isObj(p)) { err(`aerial.${k}`, "{ src, width, height }"); continue; }
    onlyKeys(p, ["src", "width", "height"], `aerial.${k}`, err);
    file(err, `aerial.${k}.src`, p.src, exists);
    if (!Number.isInteger(p.width) || !Number.isInteger(p.height)) err(`aerial.${k}`, "width and height in pixels");
  }
  if (!isObj(a.cars)) err("aerial.cars", "{ hatch, estate, suv }: a top-down render of each, 5.6 × 2.6 m, front to the right");
  else for (const k of ["hatch", "estate", "suv"]) file(err, `aerial.cars.${k}`, a.cars[k], exists);
  // Where the render's frame sits in hall metres: the desktop render's left edge and top edge, and its width; the
  // phone render (turned so the gate is at the bottom) its top edge in x and its left edge in y, and its height.
  checkFrames(a, err);
  if (!isObj(site.hall)) err("aerial", "needs hall: the render is drawn from the plan");
}

/** Where each render sits in hall metres, and that it has the render's shape. @param {any} a @param {Report} err */
function checkFrames(a, err) {
  for (const [k, size, xr] of /** @type {[string, string, number[]][]} */ ([["frame", "width", [-60, 0]], ["phoneFrame", "height", [0, 300]]])) {
    const f = a[k];
    if (!isObj(f) || !isNum(f.x, xr[0], xr[1]) || !isNum(f.top, 0, 120) || !isNum(f.bottom, -20, 0) || !isNum(f[size], 5, 300)) { err(`aerial.${k}`, `{ x, top, bottom, ${size} } in hall metres`); continue; }
    onlyKeys(f, ["x", "top", "bottom", size], `aerial.${k}`, err);
    const img = k === "frame" ? a.day : a.dayPhone, ratio = k === "frame" ? f.width / (f.top - f.bottom) : (f.top - f.bottom) / f.height;
    if (isObj(img) && img.width && img.height && Math.abs(img.width / img.height - ratio) > 0.01) err(`aerial.${k}`, `doesn't match the render's shape (${img.width} × ${img.height})`);
  }
}
