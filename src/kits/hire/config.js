// @ts-check
/**
 * Validation for the car hire kit (`hire`): the fleet (one row per car from the client's Sheet, imported by
 * src/kits/hire/tools/import-fleet.js), the client's rules and prices, and the live Sheet. The owner's firmest rules:
 * insurance, excess, deposit, age, licence years, points, mileage, extra-mile price, fuel policy, late return,
 * delivery fees and chauffeur rates all come from the client. A car or a site that leaves one out is refused: never a
 * default, never "typical". Unknown keys are refused, and simulated data is refused on client sites.
 */
import { checkRangeRules } from "../../core/lib/date-range.js";
import { CLASS_IDS } from "./lib/fleet.js";
import { DAY_KEYS } from "../../core/lib/hours.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @param {unknown} v @returns {v is string} */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
/** @param {unknown} v @returns {v is Record<string, any>} */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {unknown} v @param {number} min @param {number} max */
const isNum = (v, min, max) => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
/** @param {unknown} v @param {number} min @param {number} max */
const isInt = (v, min, max) => Number.isInteger(v) && isNum(v, min, max);
const SLUG = /^[a-z0-9-]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SHEET = /^https:\/\/docs\.google\.com\/spreadsheets\/.+output=csv/;
const FORM = /^https:\/\/docs\.google\.com\/forms\/d\/e\/[A-Za-z0-9_-]+\/viewform$/;
const DISTRICT = /^[A-Z]{1,2}(\d[A-Z\d]?)?$/;
const CAR_KEYS = ["id", "make", "model", "trim", "year", "class", "seats", "doors", "boot", "gearbox", "fuel", "power", "zeroToSixtyTwo",
  "interior", "colours", "photos", "rates", "deposit", "payLink", "driver", "insurance", "miles", "fuelPolicy", "lateReturn", "delivery",
  "chauffeurOnly", "chauffeur", "tuned", "lead", "firstTen"];
const PAGE_COPY = { "handover-check": "checkPage", "fleet-page": "fleetPage", "chauffeur-page": "chauffeurPage", "events-page": "eventsPage", "longterm-page": "longTermPage", "before-page": "beforePage", "deposit-status": "depositPage" };

/** @param {Record<string, any>} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}

/** @param {any} p @param {string} at @param {Report} err */
function photo(p, at, err) {
  if (!isObj(p)) { err(at, "{ src, width, height, alt }"); return; }
  onlyKeys(p, ["src", "width", "height", "alt"], at, err);
  if (!isStr(p.src) || !/^img\/.+\.(webp|jpe?g|png|avif)$/i.test(p.src)) err(`${at}.src`, "a photo in the site's img/ folder");
  if (!isInt(p.width, 1, 10000) || !isInt(p.height, 1, 10000)) err(at, "width and height in pixels");
  if (!isStr(p.alt)) err(`${at}.alt`, "what the photo shows, for people who can't see it");
}

/** @param {any} o @param {string} at @param {Report} err */
function pageCopy(o, at, err) {
  if (!isObj(o)) { err(at, "{ kicker, title, intro?, description? }"); return; }
  onlyKeys(o, ["kicker", "title", "intro", "description", "photo", "photoTall"], at, err);
  if (!isStr(o.kicker)) err(`${at}.kicker`, "the small line above the page title");
  if (!isStr(o.title)) err(`${at}.title`, "the page title");
  if (o.photo !== undefined) photo(o.photo, `${at}.photo`, err);
  if (o.photoTall !== undefined) photo(o.photoTall, `${at}.photoTall`, err);
}

/** A live tab of the client's Sheet. @param {any} s @param {string} at @param {string} mode @param {Report} err @param {string[]} [extra] */
function sheetSource(s, at, mode, err, extra = []) {
  if (!isObj(s)) { err(at, '{ source: "sheet", csvUrl, staleAfterHours }'); return; }
  onlyKeys(s, ["source", "csvUrl", "staleAfterHours", ...extra], at, err);
  if (!["sheet", "simulated"].includes(s.source)) err(`${at}.source`, '"sheet" (or "simulated" on demos)');
  if (s.source === "simulated" && mode === "client") err(`${at}.source`, 'simulated data is only allowed on demo sites; use "sheet"');
  if (s.source === "sheet" && !SHEET.test(s.csvUrl ?? "")) err(`${at}.csvUrl`, "a published Google Sheet CSV link (File → Share → Publish to web → CSV)");
  if (s.source === "simulated" && s.csvUrl !== undefined) err(`${at}.csvUrl`, "not used with simulated data");
  if (!isInt(s.staleAfterHours, 1, 336)) err(`${at}.staleAfterHours`, "after how many hours without a change the sheet counts as old (1–336); old data says \"ask us\"");
}

/**
 * @param {any} site @param {Report} err
 */
export function checkHire(site, err) {
  if (site.kit !== "hire") {
    for (const k of ["fleet", "hire"]) if (site[k] !== undefined) err(k, 'only for the car hire kit ("kit": "hire")');
    return;
  }
  const on = (/** @type {string} */ id) => Array.isArray(site.features) && site.features.includes(id);
  for (const [id, key] of Object.entries(PAGE_COPY)) {
    if (on(id)) pageCopy(site[key], key, err);
    else if (site[key] !== undefined) err(key, `only used with the "${id}" feature`);
  }
  photo(site.hero?.photo, "hero.photo", err); // one car in detail at night
  if (site.hero?.photoTall !== undefined) photo(site.hero.photoTall, "hero.photoTall", err);
  const h = site.hire;
  if (!isObj(h)) { err("hire", "the client's hire rules: dates, rates, deposit, extras, delivery, availability"); return; }
  onlyKeys(h, ["dates", "rates", "deposit", "extras", "delivery", "airports", "availability", "deposits", "chauffeur", "driverForm", "bring", "events", "longTerm", "film", "handover", "check"], "hire", err);
  checkRangeRules(h.dates, "hire.dates", err);
  checkRates(h.rates, err);
  if (!isObj(h.deposit) || !isStr(h.deposit.how) || !isStr(h.deposit.when)) err("hire.deposit", "{ how, when }: how the deposit is taken and when it's returned, in the client's words");
  else onlyKeys(h.deposit, ["how", "when"], "hire.deposit", err);
  const extras = checkExtras(h.extras, err);
  checkDelivery(h.delivery, err);
  if (on("meet-greet")) checkAirports(h.airports, err);
  else if (h.airports !== undefined) err("hire.airports", 'only used with the "meet-greet" feature');
  sheetSource(h.availability, "hire.availability", site.mode, err);
  if (on("deposit-status")) {
    sheetSource(h.deposits, "hire.deposits", site.mode, err, ["example"]);
    if (site.mode === "client" && h.deposits?.example !== undefined) err("hire.deposits.example", "demo sites only");
    if (site.mode === "demo" && !/^[A-Z0-9-]{4,32}$/.test(h.deposits?.example ?? "")) err("hire.deposits.example", "the demo reference visitors can try, e.g. DH-4821");
  } else if (h.deposits !== undefined) err("hire.deposits", 'only used with the "deposit-status" feature');
  if (on("chauffeur-page")) checkChauffeur(h.chauffeur, err);
  else if (h.chauffeur !== undefined) err("hire.chauffeur", 'only used with the "chauffeur-page" feature');
  if (on("driver-form")) checkDriverForm(h.driverForm, err);
  else if (h.driverForm !== undefined) err("hire.driverForm", 'only used with the "driver-form" feature');
  if (on("bring-list") && (!Array.isArray(h.bring) || !h.bring.length || !h.bring.every(isStr) || h.bring.length > 10)) err("hire.bring", "what to bring on the day, 1–10 lines in the client's words");
  if (on("handover")) {
    const ho = h.handover;
    if (!isObj(ho)) err("hire.handover", "{ door, doorTall, key, window }: the handover photographs and the client's delivery window");
    else {
      onlyKeys(ho, ["door", "doorTall", "key", "window"], "hire.handover", err);
      photo(ho.door, "hire.handover.door", err); photo(ho.doorTall, "hire.handover.doorTall", err); photo(ho.key, "hire.handover.key", err);
      if (!isStr(ho.window)) err("hire.handover.window", "when the client delivers, in their words, e.g. Delivered between 6 and 9 in the evening");
    }
  } else if (h.handover !== undefined) err("hire.handover", 'only used with the "handover" feature');
  if (on("handover-check")) {
    const c = h.check;
    if (!isObj(c)) err("hire.check", "{ panels, message }: the client's own list of what to look at, and the opening line of the message");
    else {
      onlyKeys(c, ["panels", "message"], "hire.check", err);
      if (!Array.isArray(c.panels) || c.panels.length < 3 || c.panels.length > 20 || !c.panels.every(isStr) || new Set(c.panels).size !== c.panels.length) err("hire.check.panels", "3–20 different parts of the car to look at, in the client's words (Front bumper, Wheels…)");
      if (!isStr(c.message)) err("hire.check.message", "the opening line of the message the record is sent with");
    }
  } else if (h.check !== undefined) err("hire.check", 'only used with the "handover-check" feature');
  if (on("hire-film")) checkFilm(h.film, err);
  else if (h.film !== undefined) err("hire.film", 'only used with the "hire-film" feature');

  const ids = checkFleet(site, on, err);
  if (on("events-page")) checkEvents(h.events, ids, extras, err);
  else if (h.events !== undefined) err("hire.events", 'only used with the "events-page" feature');
  if (on("longterm-page")) {
    if (!isObj(h.longTerm) || !isStr(h.longTerm.text) || !isStr(h.longTerm.message)) err("hire.longTerm", "{ text, message }: the client's long-term terms and the account request message");
    else onlyKeys(h.longTerm, ["text", "message", "minMonths"], "hire.longTerm", err);
    if (isObj(h.longTerm) && h.longTerm.minMonths !== undefined && !isInt(h.longTerm.minMonths, 1, 36)) err("hire.longTerm.minMonths", "1–36");
    if (Array.isArray(site.fleet?.cars) && !site.fleet.cars.some((/** @type {any} */ c) => c?.rates?.month !== undefined)) err("hire.longTerm", "no car has a month rate; add the client's monthly rates first");
  } else if (h.longTerm !== undefined) err("hire.longTerm", 'only used with the "longterm-page" feature');
}

/** @param {any} r @param {Report} err */
function checkRates(r, err) {
  if (!isObj(r)) { err("hire.rates", "{ weekDays, monthDays, weekend? }: how the client's rate table applies"); return; }
  onlyKeys(r, ["weekDays", "monthDays", "weekend"], "hire.rates", err);
  if (!isInt(r.weekDays, 1, 14)) err("hire.rates.weekDays", "how many days a week rate covers, in the client's terms (usually 7)");
  if (!isInt(r.monthDays, 20, 31)) err("hire.rates.monthDays", "how many days a month rate covers, in the client's terms (e.g. 28 or 30)");
  if (r.weekend !== undefined) {
    const w = r.weekend;
    if (!isObj(w)) { err("hire.rates.weekend", "{ pickUp, returnOn, maxDays }"); return; }
    onlyKeys(w, ["pickUp", "returnOn", "maxDays"], "hire.rates.weekend", err);
    const days = (/** @type {any} */ v) => Array.isArray(v) && v.length > 0 && v.every((d) => DAY_KEYS.includes(d));
    if (!days(w.pickUp)) err("hire.rates.weekend.pickUp", 'days a weekend hire can start, e.g. ["fri", "sat"]');
    if (!days(w.returnOn)) err("hire.rates.weekend.returnOn", 'days it comes back, e.g. ["sun", "mon"]');
    if (!isInt(w.maxDays, 1, 4)) err("hire.rates.weekend.maxDays", "the longest a weekend hire runs, in days (1–4)");
  }
}

/** @param {any} list @param {Report} err @returns {Set<string>} */
function checkExtras(list, err) {
  /** @type {Set<string>} */ const ids = new Set();
  if (!Array.isArray(list)) { err("hire.extras", "the client's extras (extra driver, child seat…), [] if none"); return ids; }
  list.forEach((x, i) => {
    const at = `hire.extras[${i}]`;
    if (!isObj(x)) { err(at, "{ id, label, price, per }"); return; }
    onlyKeys(x, ["id", "label", "price", "per"], at, err);
    if (!SLUG.test(x.id ?? "") || ids.has(x.id)) err(`${at}.id`, "lowercase-dashes, unique"); else ids.add(x.id);
    if (!isStr(x.label)) err(`${at}.label`, "what it is, e.g. Extra driver");
    if (!isNum(x.price, 0.01, 10000)) err(`${at}.price`, "the client's price in pounds");
    if (!["day", "hire"].includes(x.per)) err(`${at}.per`, '"day" or "hire"');
  });
  return ids;
}

/** @param {any} d @param {Report} err */
function checkDelivery(d, err) {
  if (!isObj(d)) { err("hire.delivery", "{ collect, zones }: where customers collect, and the client's delivery zones with fees"); return; }
  onlyKeys(d, ["collect", "zones", "note"], "hire.delivery", err);
  if (!isStr(d.collect)) err("hire.delivery.collect", "where and how customers collect, e.g. From us in Battersea, by appointment");
  if (!Array.isArray(d.zones)) { err("hire.delivery.zones", "the client's zones, [] if they don't deliver"); return; }
  /** @type {Set<string>} */ const seen = new Set();
  d.zones.forEach((/** @type {any} */ z, /** @type {number} */ i) => {
    const at = `hire.delivery.zones[${i}]`;
    if (!isObj(z)) { err(at, "{ name, fee, districts }"); return; }
    onlyKeys(z, ["name", "fee", "districts"], at, err);
    if (!isStr(z.name)) err(`${at}.name`, "the zone's name");
    if (!isNum(z.fee, 0, 5000)) err(`${at}.fee`, "the client's delivery and collection fee for this zone, in pounds (0 if free)");
    if (!Array.isArray(z.districts) || !z.districts.length || !z.districts.every((/** @type {any} */ x) => typeof x === "string" && DISTRICT.test(x))) err(`${at}.districts`, 'postcode areas or districts, e.g. ["SW11", "SW1", "SE"]');
    else for (const x of z.districts) { if (seen.has(x)) err(`${at}.districts`, `${x} is in two zones`); seen.add(x); }
  });
}

/** @param {any} list @param {Report} err */
function checkAirports(list, err) {
  if (!Array.isArray(list) || !list.length) { err("hire.airports", "the airports the client meets customers at, each with its fee"); return; }
  list.forEach((a, i) => {
    const at = `hire.airports[${i}]`;
    if (!isObj(a)) { err(at, "{ id, name, fee, note? }"); return; }
    onlyKeys(a, ["id", "name", "fee", "note"], at, err);
    if (!SLUG.test(a.id ?? "")) err(`${at}.id`, "lowercase-dashes");
    if (!isStr(a.name)) err(`${at}.name`, "e.g. Heathrow");
    if (!isNum(a.fee, 0, 5000)) err(`${at}.fee`, "the client's meet-and-greet fee in pounds");
  });
}

/** @param {any} c @param {Report} err */
function checkChauffeur(c, err) {
  if (!isObj(c)) { err("hire.chauffeur", "{ services, stepMinutes, message }"); return; }
  onlyKeys(c, ["services", "stepMinutes", "message"], "hire.chauffeur", err);
  if (![15, 30, 60].includes(c.stepMinutes)) err("hire.chauffeur.stepMinutes", "how the client bills part hours: 15, 30 or 60 minutes");
  if (!isStr(c.message)) err("hire.chauffeur.message", "the opening line of the quote request message");
  if (!Array.isArray(c.services) || !c.services.length) err("hire.chauffeur.services", "what the chauffeur service covers (hourly, airport transfers, weddings…)");
  else c.services.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    if (!isObj(s) || !isStr(s.title) || !isStr(s.text)) err(`hire.chauffeur.services[${i}]`, "{ title, text }");
    else onlyKeys(s, ["title", "text"], `hire.chauffeur.services[${i}]`, err);
  });
}

/** @param {any} f @param {Report} err */
function checkDriverForm(f, err) {
  if (!isObj(f)) { err("hire.driverForm", "{ url, checkCode }"); return; }
  onlyKeys(f, ["url", "checkCode"], "hire.driverForm", err);
  if (!FORM.test(f.url ?? "")) err("hire.driverForm.url", "the client's own Google Form link (…/viewform); we never collect licence details ourselves");
  const c = f.checkCode;
  if (!isObj(c)) { err("hire.driverForm.checkCode", "{ validDays, source, checked }: the DVLA check code rule from gov.uk"); return; }
  onlyKeys(c, ["validDays", "source", "checked"], "hire.driverForm.checkCode", err);
  if (!isInt(c.validDays, 1, 60)) err("hire.driverForm.checkCode.validDays", "days a check code is valid, from gov.uk");
  if (!/^https:\/\/www\.gov\.uk\//.test(c.source ?? "")) err("hire.driverForm.checkCode.source", "the gov.uk page it comes from");
  if (!DATE.test(c.checked ?? "")) err("hire.driverForm.checkCode.checked", "when we checked gov.uk, YYYY-MM-DD");
}

/** @param {any} f @param {Report} err */
function checkFilm(f, err) {
  if (!isObj(f)) { err("hire.film", "{ src, poster, note }"); return; }
  onlyKeys(f, ["src", "poster", "note"], "hire.film", err);
  if (!/^img\/[\w.-]+\.mp4$/.test(f.src ?? "")) err("hire.film.src", "an .mp4 in img/ (the client's own car, muted)");
  photo(f.poster, "hire.film.poster", err);
  if (f.note !== undefined && !isStr(f.note)) err("hire.film.note", "text");
}

/** @param {any} e @param {Set<string>} cars @param {Set<string>} extras @param {Report} err */
function checkEvents(e, cars, extras, err) {
  if (!isObj(e)) { err("hire.events", "{ text, cars, ribbons?, message }"); return; }
  onlyKeys(e, ["text", "cars", "ribbons", "message"], "hire.events", err);
  if (!isStr(e.text)) err("hire.events.text", "what the client offers for weddings and events");
  if (!isStr(e.message)) err("hire.events.message", "the opening line of the event request");
  if (!Array.isArray(e.cars) || !e.cars.length) err("hire.events.cars", "the cars that suit, by id");
  else for (const id of e.cars) if (!cars.has(id)) err("hire.events.cars", `"${id}" isn't in the fleet`);
  if (e.ribbons !== undefined && !extras.has(e.ribbons)) err("hire.events.ribbons", "an id from hire.extras (the client's ribbon price)");
}

/** The fleet and every car's rules. @param {any} site @param {(id: string) => boolean} on @param {Report} err @returns {Set<string>} */
function checkFleet(site, on, err) {
  /** @type {Set<string>} */ const ids = new Set();
  const f = site.fleet;
  if (!isObj(f)) { err("fleet", "{ lead, classes, range, cars }: import it from the client's Sheet (src/kits/hire/tools/import-fleet.js)"); return ids; }
  onlyKeys(f, ["lead", "classes", "range", "cars", "imported"], "fleet", err);
  if (f.imported !== undefined && !DATE.test(f.imported)) err("fleet.imported", "when the Sheet was imported, YYYY-MM-DD");
  /** @type {Set<string>} */ const classes = new Set();
  if (!Array.isArray(f.classes) || !f.classes.length) err("fleet.classes", "the client's classes and their names");
  else f.classes.forEach((/** @type {any} */ k, /** @type {number} */ i) => {
    const at = `fleet.classes[${i}]`;
    if (!isObj(k)) { err(at, "{ id, name, line, photo, photoTall }"); return; }
    onlyKeys(k, ["id", "name", "line", "photo", "photoTall"], at, err);
    if (!CLASS_IDS.includes(k.id)) err(`${at}.id`, `one of ${CLASS_IDS.join(", ")}`);
    else if (classes.has(k.id)) err(`${at}.id`, "used twice"); else classes.add(k.id);
    if (k.id === "tuned" && !on("tuned-class")) err(`${at}.id`, 'the tuned class needs the "tuned-class" feature (Plus)');
    if (!isStr(k.name)) err(`${at}.name`, "how the client names the class");
    if (k.line !== undefined && !isStr(k.line)) err(`${at}.line`, "one short line");
    if (on("fleet-page")) { photo(k.photo, `${at}.photo`, err); photo(k.photoTall, `${at}.photoTall`, err); }
    if (Array.isArray(f.cars) && !f.cars.some((/** @type {any} */ c) => c?.class === k.id)) err(`${at}.id`, `no car is in "${k.id}"; remove the class or add its cars`);
  });
  const pays = new Map((site.payLinks?.items ?? []).map((/** @type {any} */ p) => [p?.id, p]));
  if (!Array.isArray(f.cars) || !f.cars.length) { err("fleet.cars", "at least one car"); return ids; }
  /** @type {Set<string>} */ const leads = new Set();
  f.cars.forEach((/** @type {any} */ c, /** @type {number} */ i) => {
    const at = `fleet.cars[${i}]${isObj(c) && isStr(c.id) ? ` (${c.id})` : ""}`;
    if (!isObj(c)) { err(at, "a car"); return; }
    if (!SLUG.test(c.id ?? "")) err(`${at}.id`, "lowercase letters, numbers and dashes (it becomes the car's page address)");
    else if (ids.has(c.id)) err(`${at}.id`, "used twice"); else ids.add(c.id);
    checkCar(c, at, { classes, pays, on, rates: site.hire?.rates, leads }, err);
  });
  if (!classes.has(f.lead) || !f.cars.some((/** @type {any} */ c) => c?.class === f.lead)) err("fleet.lead", "the class the home page leads with (one of the client's classes, with cars)");
  if (!Array.isArray(f.range) || f.range.length < 2 || f.range.length > 4) err("fleet.range", "2–4 car ids for the home page's range strip, from other classes");
  else for (const id of f.range) {
    const c = f.cars.find((/** @type {any} */ x) => x?.id === id);
    if (!c) err("fleet.range", `"${id}" isn't in the fleet`);
    else if (c.class === f.lead) err("fleet.range", `"${id}" is in the leading class already; the strip shows the rest of the range`);
  }
  return ids;
}

/**
 * One car. Self-drive cars need every rule; chauffeur-only cars need the client's hourly rate and minimum instead.
 * @param {any} c @param {string} at
 * @param {{ classes: Set<string>, pays: Map<string, any>, on: (id: string) => boolean, rates: any, leads: Set<string> }} x
 * @param {Report} err
 */
function checkCar(c, at, x, err) {
  onlyKeys(c, CAR_KEYS, at, err);
  for (const k of ["make", "model"]) if (!isStr(c[k])) err(`${at}.${k}`, "required");
  if (c.trim !== undefined && !isStr(c.trim)) err(`${at}.trim`, "text");
  if (!isInt(c.year, 1950, 2035)) err(`${at}.year`, "the car's year");
  if (!x.classes.has(c.class)) err(`${at}.class`, "one of the client's classes");
  if (!isInt(c.seats, 1, 9)) err(`${at}.seats`, "how many seats");
  if (c.doors !== undefined && !isInt(c.doors, 2, 5)) err(`${at}.doors`, "2–5");
  for (const k of ["boot", "gearbox", "fuel", "interior", "fuelPolicy", "lateReturn"]) if (c[k] !== undefined && !isStr(c[k])) err(`${at}.${k}`, "text in the client's words");
  if (c.power !== undefined && !isInt(c.power, 50, 2000)) err(`${at}.power`, "bhp as the client states it");
  if (c.zeroToSixtyTwo !== undefined && !isNum(c.zeroToSixtyTwo, 1.5, 20)) err(`${at}.zeroToSixtyTwo`, "seconds, as the client states it");
  if (c.colours !== undefined && (!Array.isArray(c.colours) || !c.colours.every(isStr))) err(`${at}.colours`, "a list");
  checkPhotos(c.photos, `${at}.photos`, err);
  if (c.lead !== undefined && typeof c.lead !== "boolean") err(`${at}.lead`, "true or false");
  if (c.lead === true) { if (x.leads.has(c.class)) err(`${at}.lead`, "only one lead car per class"); x.leads.add(c.class); }
  if (c.firstTen !== undefined) {
    if (!x.on("first-ten")) err(`${at}.firstTen`, 'only used with the "first-ten" feature');
    else if (!Array.isArray(c.firstTen) || !c.firstTen.length || c.firstTen.length > 6 || !c.firstTen.every(isStr)) err(`${at}.firstTen`, "1–6 short notes on this car's controls and fuel, from the client");
  }
  if (c.chauffeur !== undefined) {
    if (!isObj(c.chauffeur) || !isNum(c.chauffeur.hourly, 1, 5000) || !isInt(c.chauffeur.minHours, 1, 24)) err(`${at}.chauffeur`, "{ hourly, minHours }: the client's hourly rate with a chauffeur and the minimum hours");
    else onlyKeys(c.chauffeur, ["hourly", "minHours"], `${at}.chauffeur`, err);
  }
  if (c.class === "chauffeur" && c.chauffeur === undefined) err(`${at}.chauffeur`, "a chauffeur car needs the client's hourly rate and minimum hours");
  if (c.class === "tuned") {
    if (!isObj(c.tuned) || !isStr(c.tuned.mods) || !isStr(c.tuned.insurance)) err(`${at}.tuned`, "{ mods, insurance, driver? }: the client's stated modifications and insurance note");
    else onlyKeys(c.tuned, ["mods", "insurance", "driver"], `${at}.tuned`, err);
    if (c.power === undefined) err(`${at}.power`, "a tuned car shows the client's stated power");
  } else if (c.tuned !== undefined) err(`${at}.tuned`, "only for cars in the tuned class");
  if (c.chauffeurOnly !== undefined && typeof c.chauffeurOnly !== "boolean") err(`${at}.chauffeurOnly`, "true or false");
  if (c.chauffeurOnly) {
    if (c.chauffeur === undefined) err(`${at}.chauffeur`, "a chauffeur-only car needs the client's hourly rate and minimum hours");
    for (const k of ["driver", "miles", "insurance"]) if (c[k] !== undefined) err(`${at}.${k}`, "not used on a chauffeur-only car (the customer doesn't drive)");
    if (c.deposit !== undefined && !isNum(c.deposit, 0, 100000)) err(`${at}.deposit`, "pounds");
    return;
  }
  selfDrive(c, at, x, err);
}

/** @param {any} p @param {string} at @param {Report} err */
function checkPhotos(p, at, err) {
  if (!isObj(p)) { err(at, "{ card, small?, square?, gallery?, arrival? }"); return; }
  onlyKeys(p, ["card", "small", "square", "gallery", "arrival"], at, err);
  photo(p.card, `${at}.card`, err);
  for (const k of ["small", "square", "arrival"]) if (p[k] !== undefined) photo(p[k], `${at}.${k}`, err);
  if (p.gallery !== undefined) {
    if (!Array.isArray(p.gallery) || p.gallery.length > 8) err(`${at}.gallery`, "up to 8 photos");
    else p.gallery.forEach((/** @type {any} */ g, /** @type {number} */ i) => photo(g, `${at}.gallery[${i}]`, err));
  }
}

/**
 * Every rule a self-drive car must state. @param {any} c @param {string} at
 * @param {{ pays: Map<string, any>, on: (id: string) => boolean, rates: any }} x @param {Report} err
 */
function selfDrive(c, at, x, err) {
  const r = c.rates;
  if (!isObj(r)) err(`${at}.rates`, "the client's rates: day (required), weekend, week, month");
  else {
    onlyKeys(r, ["day", "weekend", "week", "month"], `${at}.rates`, err);
    if (!isNum(r.day, 1, 100000)) err(`${at}.rates.day`, "the client's day rate");
    for (const k of ["weekend", "week", "month"]) if (r[k] !== undefined && !isNum(r[k], 1, 1000000)) err(`${at}.rates.${k}`, "pounds");
    if (r.weekend !== undefined && !isObj(x.rates?.weekend)) err(`${at}.rates.weekend`, "set hire.rates.weekend first: which days a weekend hire starts and ends");
  }
  if (!isNum(c.deposit, 0, 100000)) err(`${at}.deposit`, "the client's deposit for this car, in pounds (0 if none)");
  if (c.payLink !== undefined) {
    const p = x.pays.get(c.payLink);
    if (!p) err(`${at}.payLink`, `"${c.payLink}" isn't one of payLinks.items`);
    else if (p.kind !== "deposit" || p.holds !== "request") err(`${at}.payLink`, 'a deposit that holds a request ("kind": "deposit", "holds": "request")');
    else if (p.amount !== c.deposit) err(`${at}.payLink`, `the Payment Link is £${p.amount} but this car's deposit is £${c.deposit}`);
  }
  const d = c.driver;
  if (!isObj(d)) err(`${at}.driver`, "{ minAge, licenceYears, maxPoints }: the client's driver rules for this car");
  else {
    onlyKeys(d, ["minAge", "licenceYears", "maxPoints"], `${at}.driver`, err);
    if (!isInt(d.minAge, 17, 99)) err(`${at}.driver.minAge`, "the client's minimum age");
    if (!isInt(d.licenceYears, 0, 50)) err(`${at}.driver.licenceYears`, "years with a full licence");
    if (!isInt(d.maxPoints, 0, 12)) err(`${at}.driver.maxPoints`, "the most points the client accepts");
  }
  const ins = c.insurance;
  if (!isObj(ins)) err(`${at}.insurance`, "{ cover, excess, reduction }: the client's insurance for this car");
  else {
    onlyKeys(ins, ["cover", "excess", "reduction"], `${at}.insurance`, err);
    if (!isStr(ins.cover)) err(`${at}.insurance.cover`, "what the insurance covers, in the client's words");
    if (!isNum(ins.excess, 0, 100000)) err(`${at}.insurance.excess`, "the client's excess in pounds");
    if (ins.reduction === undefined) err(`${at}.insurance.reduction`, 'the excess reduction the client offers, or false if none ("excess_reduction": none)');
    else if (ins.reduction !== false) {
      const red = ins.reduction;
      if (!isObj(red) || !isNum(red.price, 0.01, 10000) || !["day", "hire"].includes(red.per) || !isNum(red.to, 0, 100000)) err(`${at}.insurance.reduction`, '{ price, per: "day"|"hire", to }: what it costs and what the excess becomes');
      else { onlyKeys(red, ["price", "per", "to"], `${at}.insurance.reduction`, err); if (isNum(ins.excess, 0, 100000) && red.to >= ins.excess) err(`${at}.insurance.reduction.to`, "must be lower than the excess"); }
    }
  }
  const m = c.miles;
  if (!isObj(m)) err(`${at}.miles`, '{ perDay, extra }: miles included a day ("unlimited" allowed) and the extra-mile price');
  else {
    onlyKeys(m, ["perDay", "extra"], `${at}.miles`, err);
    if (m.perDay !== "unlimited" && !isInt(m.perDay, 1, 2000)) err(`${at}.miles.perDay`, 'miles a day, or "unlimited"');
    if (m.perDay !== "unlimited" && !isNum(m.extra, 0.01, 100)) err(`${at}.miles.extra`, "the client's price per extra mile");
  }
  if (!isStr(c.fuelPolicy)) err(`${at}.fuelPolicy`, "the client's fuel or charge policy for this car");
  if (!isStr(c.lateReturn)) err(`${at}.lateReturn`, "what happens if it comes back late, in the client's words");
  if (typeof c.delivery !== "boolean") err(`${at}.delivery`, "can this car be delivered? true or false");
}
