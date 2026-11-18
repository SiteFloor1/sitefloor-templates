// @ts-check
/**
 * Validation for the tourism kit (independent tour operators). Every journey, month pick, price, checklist line and
 * ATOL number is the operator's own; these checks keep them whole and honest: a journey's map needs a country we hold
 * an outline for and real coordinates, time zones must exist, typical weather must name its source, travel advice
 * links go to gov.uk's foreign travel advice and nowhere else, and a client never carries the demo's simulated trip.
 */
import { COUNTRIES } from "./lib/countries.js";
import { knownZone, isTravelAdvice } from "./lib/tourism.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @typedef {((rel: string) => boolean)|undefined} Exists */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
/** @param {any} v @param {number} lo @param {number} hi */
const isNum = (v, lo, hi) => typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi;
const ID = /^[a-z0-9-]{1,40}$/;
const WHO = ["couple", "family", "friends", "solo"];
const HTTPS = /^https:\/\/[^\s]+$/;

/** @param {Report} err @param {string} path @param {any} v */
function text(err, path, v) { if (!isStr(v)) err(path, "required text is missing"); }
/** @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (isObj(o)) for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}
/** @param {Report} err @param {string} path @param {any} v @param {string} what @returns {v is any[]} */
function list(err, path, v, what) {
  if (Array.isArray(v) && v.length) return true;
  err(path, `at least one ${what}`);
  return false;
}
/** @param {Report} err @param {string} path @param {any[]} items */
function ids(err, path, items) {
  const seen = new Set();
  items.forEach((x, i) => {
    if (!ID.test(x?.id ?? "")) err(`${path}[${i}].id`, "lowercase letters, numbers and dashes");
    else if (seen.has(x.id)) err(`${path}[${i}].id`, `"${x.id}" is used twice`);
    seen.add(x?.id);
  });
}
/** Months 1–12, each once. @param {Report} err @param {string} path @param {any} v */
function months(err, path, v) {
  if (!Array.isArray(v) || !v.length || !v.every((m) => Number.isInteger(m) && m >= 1 && m <= 12) || new Set(v).size !== v.length) err(path, "the months, as numbers 1 (January) to 12, each once");
}
/** @param {Report} err @param {string} path @param {any} p @param {Exists} exists */
function photo(err, path, p, exists) {
  if (!isObj(p)) { err(path, "a photo: { src, width, height, alt }"); return; }
  onlyKeys(p, ["src", "width", "height", "alt", "focus", "small"], path, err);
  text(err, `${path}.alt`, p.alt);
  if (!Number.isInteger(p.width) || !Number.isInteger(p.height)) err(path, "width and height in pixels");
  if (p.focus !== undefined && !/^\d{1,3}% \d{1,3}%$/.test(p.focus)) err(`${path}.focus`, 'where the subject sits, e.g. "50% 30%"');
  for (const [k, src] of [["src", p.src], ["small.src", p.small?.src]]) {
    if (k === "small.src" && p.small === undefined) continue;
    if (!isStr(src) || !/^img\/[\w./-]+\.(webp|jpe?g|png)$/.test(src)) err(`${path}.${k}`, "a file in img/ (webp, jpg or png)");
    else if (exists && !exists(src)) err(`${path}.${k}`, `file not found: ${src}`);
  }
  if (p.small !== undefined) {
    onlyKeys(p.small, ["src", "width"], `${path}.small`, err);
    if (!Number.isInteger(p.small?.width) || !(p.small.width < p.width)) err(`${path}.small.width`, "the copy's width in pixels, smaller than the photo's");
  }
}
/** @param {Report} err @param {string} path @param {any} o @param {string[]} keys */
function page(err, path, o, keys) {
  if (!isObj(o)) { err(path, `{ ${["title", "intro", ...keys].join(", ")} }`); return false; }
  onlyKeys(o, ["title", "intro", ...keys], path, err);
  text(err, `${path}.title`, o.title);
  if (o.intro !== undefined) text(err, `${path}.intro`, o.intro);
  return true;
}
/** @param {Report} err @param {string} path @param {any} p */
function point(err, path, p) {
  text(err, `${path}.name`, p?.name ?? p?.place);
  if (!isNum(p?.lat, -90, 90) || !isNum(p?.lon, -180, 180)) err(path, "lat and lon in decimal degrees (south and west are negative)");
}

/** @param {any} site @param {Report} err @param {Exists} [exists] */
export function checkTourism(site, err, exists) {
  if (site.kit !== "tourism") return;
  const features = /** @type {string[]} */ (Array.isArray(site.features) ? site.features : []);
  const on = (/** @type {string} */ id) => features.includes(id);
  const journeys = checkJourneys(site.journeys, site.climate, on, err, exists);
  const jids = journeys.map((j) => j?.id);
  if (site.atol !== undefined) checkAtol(site.atol, err);
  if (site.when !== undefined) checkWhen(site.when, jids, site.climate, on, err);
  if (site.climate !== undefined) checkClimate(site.climate, err);
  if (site.experts !== undefined) checkExperts(site.experts, err);
  if (site.builder !== undefined) checkBuilder(site.builder, err);
  if (site.ready !== undefined) checkReady(site.ready, err);
  if (site.trip !== undefined) checkTrip(site, err);
  if (site.look === "logbook" && site.hero !== undefined) {
    onlyKeys(site.hero, ["kicker", "title", "intro", "journey", "credit"], "hero", err);
    if (site.hero.journey !== undefined && !jids.includes(site.hero.journey)) err("hero.journey", "the id of a journey in journeys.items (the one the home page opens on)");
  }
}

/** @param {any} J @param {any} climate @param {(id: string) => boolean} on @param {Report} err @param {Exists} exists @returns {any[]} */
function checkJourneys(J, climate, on, err, exists) {
  if (J === undefined) return [];
  if (!isObj(J)) { err("journeys", "{ items, monthly? }"); return []; }
  onlyKeys(J, ["items", "monthly"], "journeys", err);
  const items = list(err, "journeys.items", J.items, "journey") ? J.items : [];
  ids(err, "journeys.items", items);
  const keys = isObj(climate?.places) ? Object.keys(climate.places) : [];
  items.forEach((/** @type {any} */ j, /** @type {number} */ i) => checkJourney(j, `journeys.items[${i}]`, keys, err, exists));
  if (J.monthly !== undefined) {
    const jids = items.map((/** @type {any} */ j) => j?.id);
    if (!isObj(J.monthly)) err("journeys.monthly", 'the journey of the month: { "11": "desert-to-ice", … } (months 1–12)');
    else for (const [m, id] of Object.entries(J.monthly)) {
      if (!/^(1[0-2]|[1-9])$/.test(m)) err(`journeys.monthly.${m}`, "a month, 1 to 12");
      else if (!jids.includes(id)) err(`journeys.monthly.${m}`, "the id of a journey in journeys.items");
    }
  } else if (on("tourism-month")) err("journeys.monthly", "the journey of the month needs the operator's picks: { \"11\": \"<journey id>\", … }");
  return items;
}

/** @param {any} j @param {string} at @param {string[]} keys @param {Report} err @param {Exists} exists */
function checkJourney(j, at, keys, err, exists) {
    onlyKeys(j, ["id", "name", "country", "where", "nights", "from", "line", "go", "who", "photo", "stops", "via"], at, err);
    text(err, `${at}.name`, j?.name);
    text(err, `${at}.where`, j?.where);
    text(err, `${at}.line`, j?.line);
    if (!(/** @type {any} */ (COUNTRIES))[j?.country]) err(`${at}.country`, "the country's three-letter code (ISO 3166, e.g. CHL, NAM, JPN), for its drawn map");
    if (!Number.isInteger(j?.nights) || j.nights < 1 || j.nights > 90) err(`${at}.nights`, "how many nights, a whole number");
    if (j?.from !== undefined && !isNum(j.from, 1, 500000)) err(`${at}.from`, "the operator's own 'from' price per person, in pounds (leave out if they don't publish one)");
    months(err, `${at}.go`, j?.go);
    if (!Array.isArray(j?.who) || !j.who.length || !j.who.every((/** @type {any} */ w) => WHO.includes(w))) err(`${at}.who`, `who it suits: ${WHO.join(", ")}`);
    photo(err, `${at}.photo`, j?.photo, exists);
    if (list(err, `${at}.stops`, j?.stops, "stop: { days, place, text, lat, lon, tz }")) j.stops.forEach((/** @type {any} */ s, /** @type {number} */ k) => checkStop(s, `${at}.stops[${k}]`, keys, err, exists));
    if (j?.via !== undefined) checkVia(j, at, err);
}

/** @param {any} j @param {string} at @param {Report} err */
function checkVia(j, at, err) {
  if (!Array.isArray(j.via)) { err(`${at}.via`, "places the route passes through: [{ name, lat, lon, before }]"); return; }
  j.via.forEach((/** @type {any} */ v, /** @type {number} */ k) => {
    onlyKeys(v, ["name", "lat", "lon", "before"], `${at}.via[${k}]`, err);
    point(err, `${at}.via[${k}]`, v);
    if (!Number.isInteger(v?.before) || v.before < 0 || v.before >= (j.stops?.length ?? 0)) err(`${at}.via[${k}].before`, "the stop it comes before (0 for the first stop)");
  });
}

/** @param {any} s @param {string} sp @param {string[]} keys @param {Report} err @param {Exists} exists */
function checkStop(s, sp, keys, err, exists) {
  onlyKeys(s, ["days", "place", "text", "lat", "lon", "tz", "photo", "climate"], sp, err);
  text(err, `${sp}.days`, s?.days);
  text(err, `${sp}.text`, s?.text);
  point(err, sp, s);
  if (!isStr(s?.tz) || !knownZone(s.tz)) err(`${sp}.tz`, 'the place\'s time zone, e.g. "America/Santiago"');
  if (s?.photo !== undefined) photo(err, `${sp}.photo`, s.photo, exists);
  if (s?.climate !== undefined && !keys.includes(s.climate)) err(`${sp}.climate`, "a place in climate.places");
}

/** The ATOL number exactly as the operator's certificate gives it; we never format or check it. @param {any} a @param {Report} err */
function checkAtol(a, err) {
  if (!isObj(a)) { err("atol", "{ number, holder?, note?, termsUrl? }"); return; }
  onlyKeys(a, ["number", "holder", "note", "termsUrl"], "atol", err);
  text(err, "atol.number", a.number);
  if (a.holder !== undefined) text(err, "atol.holder", a.holder);
  if (a.note !== undefined) text(err, "atol.note", a.note);
  if (a.termsUrl !== undefined && !(HTTPS.test(a.termsUrl) || /^\/[a-z0-9-]+$/.test(a.termsUrl))) err("atol.termsUrl", "where the booking terms are: an https link, or a page of this site like /terms");
}

/** @param {any} w @param {string[]} jids @param {any} climate @param {(id: string) => boolean} on @param {Report} err */
function checkWhen(w, jids, climate, on, err) {
  if (!page(err, "when", w, ["places"])) return;
  const keys = isObj(climate?.places) ? Object.keys(climate.places) : [];
  if (list(err, "when.places", w.places, "place: { name, go, journey?, climate? }")) w.places.forEach((/** @type {any} */ p, /** @type {number} */ i) => {
    const at = `when.places[${i}]`;
    onlyKeys(p, ["name", "go", "journey", "climate"], at, err);
    text(err, `${at}.name`, p?.name);
    months(err, `${at}.go`, p?.go);
    if (p?.journey !== undefined && !jids.includes(p.journey)) err(`${at}.journey`, "the id of a journey in journeys.items");
    if (p?.climate !== undefined && !keys.includes(p.climate)) err(`${at}.climate`, "a place in climate.places");
    if (on("tourism-weather") && p?.climate === undefined) err(`${at}.climate`, "with typical weather on, each place names its climate data (climate.places)");
  });
}

/** Typical weather: always from a named source, a stated period, one value a month. @param {any} c @param {Report} err */
function checkClimate(c, err) {
  if (!isObj(c)) { err("climate", "{ source, url, about, places }"); return; }
  onlyKeys(c, ["source", "url", "about", "places"], "climate", err);
  text(err, "climate.source", c.source);
  text(err, "climate.about", c.about);
  if (!HTTPS.test(c.url ?? "")) err("climate.url", "the source's address (https)");
  if (!isObj(c.places) || !Object.keys(c.places).length) err("climate.places", '{ "atacama": [12 typical highs in °C, January first], … }');
  else for (const [k, v] of Object.entries(c.places)) {
    if (!ID.test(k)) err(`climate.places.${k}`, "a key of lowercase letters, numbers and dashes");
    if (!Array.isArray(v) || v.length !== 12 || !v.every((x) => isNum(x, -60, 60))) err(`climate.places.${k}`, "twelve typical daily highs in °C, January to December, as the source gives them");
  }
}

/** @param {any} e @param {Report} err */
function checkExperts(e, err) {
  if (!page(err, "experts", e, ["people"])) return;
  if (list(err, "experts.people", e.people, "person: { name, line, been }")) e.people.forEach((/** @type {any} */ p, /** @type {number} */ i) => {
    const at = `experts.people[${i}]`;
    onlyKeys(p, ["name", "role", "line", "been", "phone"], at, err);
    text(err, `${at}.name`, p?.name);
    text(err, `${at}.line`, p?.line);
    if (p?.role !== undefined) text(err, `${at}.role`, p.role);
    if (p?.phone !== undefined && !/^\+?[\d ]{7,20}$/.test(p.phone)) err(`${at}.phone`, "their direct line, digits and spaces");
    if (!Array.isArray(p?.been) || !p.been.length || !p.been.every(isStr)) err(`${at}.been`, "the places they've travelled, in their own words");
  });
}

/** @param {any} b @param {Report} err */
function checkBuilder(b, err) {
  if (!page(err, "builder", b, ["regions"])) return;
  if (!list(err, "builder.regions", b.regions, "region: { id, name, where, nights }")) return;
  ids(err, "builder.regions", b.regions);
  b.regions.forEach((/** @type {any} */ r, /** @type {number} */ i) => {
    const at = `builder.regions[${i}]`;
    onlyKeys(r, ["id", "name", "where", "nights", "line"], at, err);
    text(err, `${at}.name`, r?.name);
    text(err, `${at}.where`, r?.where);
    if (r?.line !== undefined) text(err, `${at}.line`, r.line);
    const n = r?.nights;
    if (!Array.isArray(n) || n.length !== 2 || !n.every((x) => Number.isInteger(x) && x >= 1 && x <= 30) || n[0] > n[1]) err(`${at}.nights`, "the fewest and most nights the operator suggests there, e.g. [2, 5]");
  });
}

/** @param {any} r @param {Report} err */
function checkReady(r, err) {
  if (!page(err, "ready", r, ["countries", "items", "checked"])) return;
  if (list(err, "ready.countries", r.countries, "country: { name, advice }")) r.countries.forEach((/** @type {any} */ c, /** @type {number} */ i) => {
    onlyKeys(c, ["name", "advice"], `ready.countries[${i}]`, err);
    text(err, `ready.countries[${i}].name`, c?.name);
    if (!isTravelAdvice(c?.advice)) err(`ready.countries[${i}].advice`, "the country's gov.uk foreign travel advice page: https://www.gov.uk/foreign-travel-advice/<country>");
  });
  if (list(err, "ready.items", r.items, "thing to do before you go: { text, when? }")) r.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    onlyKeys(x, ["text", "when"], `ready.items[${i}]`, err);
    text(err, `ready.items[${i}].text`, x?.text);
    if (x?.when !== undefined) text(err, `ready.items[${i}].when`, x.when);
  });
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(r.checked ?? "")) err("ready.checked", 'the month the operator last checked the list, "YYYY-MM"');
}

/** @param {any} site @param {Report} err */
function checkTrip(site, err) {
  const t = site.trip;
  if (!isObj(t)) { err("trip", '{ source: "sheet", csvUrl, staleAfterDays? }'); return; }
  onlyKeys(t, ["source", "csvUrl", "staleAfterDays", "example", "intro"], "trip", err);
  if (t.intro !== undefined) text(err, "trip.intro", t.intro);
  if (t.source === "simulated") {
    if (site.mode !== "demo") err("trip.source", 'only a demo may simulate trips; a client reads its own sheet ("sheet")');
    if (!/^[A-Z0-9]{6,12}$/.test(t.example ?? "")) err("trip.example", "the demo's sample code, 6 to 12 capitals and numbers");
  } else if (t.source === "sheet") {
    if (!/^https:\/\/docs\.google\.com\/spreadsheets\/[^\s]+output=csv[^\s]*$/.test(t.csvUrl ?? "")) err("trip.csvUrl", "the sheet published as CSV (File → Share → Publish to web → CSV)");
    if (t.example !== undefined) err("trip.example", "demo only");
  } else err("trip.source", '"sheet" (or "simulated" on a demo)');
  if (t.staleAfterDays !== undefined && (!Number.isInteger(t.staleAfterDays) || t.staleAfterDays < 1 || t.staleAfterDays > 90)) err("trip.staleAfterDays", "after how many days without an update the page asks them to call, 1 to 90");
}
