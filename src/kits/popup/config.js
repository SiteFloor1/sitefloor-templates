// @ts-check
/**
 * Validation for the pop-up kit. Every date, hour, price, partner and article is the brand's own; these checks keep
 * them whole and consistent, refuse unknown settings rather than ignore them, and refuse demo-only data (dates as days
 * from today, simulated sheets) on a client site.
 */

/** @typedef {(path: string, msg: string) => void} Report */
/** @typedef {((rel: string) => boolean)|undefined} Exists */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const ID = /^[a-z0-9-]{1,40}$/;
const YMD = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const SHEET = /^https:\/\/docs\.google\.com\/spreadsheets\/.+output=csv/;
const FORM = /^https:\/\/(docs\.google\.com\/forms\/|forms\.gle\/)/;
const POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?( \d[A-Z]{2})?$/i;

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
/** @param {Report} err @param {string} path @param {any} p @param {Exists} exists */
function photo(err, path, p, exists) {
  if (!isObj(p)) { err(path, "a photo: { src, width, height, alt }"); return; }
  onlyKeys(p, ["src", "width", "height", "alt", "focus", "small"], path, err);
  text(err, `${path}.alt`, p.alt);
  if (!Number.isInteger(p.width) || !Number.isInteger(p.height)) err(path, "width and height in pixels");
  if (p.focus !== undefined && !/^\d{1,3}% \d{1,3}%$/.test(p.focus)) err(`${path}.focus`, 'where the subject sits, e.g. "50% 30%"');
  for (const [k, v] of [["src", p.src], ["small.src", p.small?.src]]) {
    if (k === "small.src" && p.small === undefined) continue;
    if (!isStr(v) || !/^img\/[\w./-]+\.(webp|jpe?g|png)$/.test(v)) err(`${path}.${k}`, "a file in img/ (webp, jpg or png)");
    else if (exists && !exists(v)) err(`${path}.${k}`, `file not found: ${v}`);
  }
  if (p.small !== undefined) {
    onlyKeys(p.small, ["src", "width"], `${path}.small`, err);
    if (!Number.isInteger(p.small?.width) || !(p.small.width < p.width)) err(`${path}.small.width`, "the copy's width in pixels, smaller than the photo's");
  }
}
/** @param {Report} err @param {string} path @param {any} o @param {string[]} [keys] */
function pageHead(err, path, o, keys = []) {
  if (!isObj(o)) { err(path, `{ ${["title", "intro", ...keys].join(", ")} }`); return false; }
  onlyKeys(o, ["title", "intro", ...keys], path, err);
  text(err, `${path}.title`, o.title);
  if (o.intro !== undefined) text(err, `${path}.intro`, o.intro);
  return true;
}
/** @param {Report} err @param {string} path @param {any} v */
function price(err, path, v) { if (v !== undefined && !(typeof v === "number" && v >= 0 && v < 100000)) err(path, "the total price in pounds, every mandatory fee included (a number)"); }
/** @param {Report} err @param {string} path @param {any} v */
function https(err, path, v) { if (!isStr(v) || !/^https:\/\/[^\s]+$/.test(v)) err(path, "an https:// link"); }
/** A live-data source: the brand's published sheet, or the demo's simulation. @param {Report} err @param {string} at @param {any} o @param {string} mode @param {string[]} extra */
function source(err, at, o, mode, extra) {
  if (!isObj(o)) { err(at, '{ source: "sheet", csvUrl }'); return; }
  onlyKeys(o, ["source", "csvUrl", ...extra], at, err);
  if (!["sheet", "simulated"].includes(o.source)) err(`${at}.source`, 'must be "sheet" (or "simulated" on demo sites)');
  if (o.source === "simulated" && mode !== "demo") err(`${at}.source`, 'simulated data is only allowed on demo sites; use "sheet"');
  if (o.source === "sheet" && !SHEET.test(o.csvUrl ?? "")) err(`${at}.csvUrl`, "must be a published Google Sheet CSV link (File → Share → Publish to web → CSV)");
  if (o.source === "simulated" && o.csvUrl !== undefined) err(`${at}.csvUrl`, "a simulated source has no sheet");
}
/** A demo's dates are days from today (numbers); a client's are dates. @param {Report} err @param {string} path @param {any} v @param {string} mode */
function day(err, path, v, mode) {
  if (typeof v === "number") { if (mode !== "demo") err(path, 'days from today are only for demo sites; give the date, e.g. "2027-01-09"'); else if (!Number.isInteger(v) || Math.abs(v) > 400) err(path, "whole days from today"); }
  else if (!(typeof v === "string" && YMD.test(v))) err(path, 'a date, e.g. "2027-01-09"');
}
/** @param {any} v */
const ord = (v) => (typeof v === "number" ? v : Date.parse(`${v}T12:00:00Z`) / 864e5);

/** @param {any} site @param {Report} err @param {Exists} [exists] */
export function checkPopup(site, err, exists) {
  if (site.kit !== "popup") return;
  const features = /** @type {string[]} */ (Array.isArray(site.features) ? site.features : []);
  const on = (/** @type {string} */ id) => features.includes(id);
  const mode = site.mode;

  const P = site.popup;
  if (isObj(P)) {
    onlyKeys(P, ["line", "stops"], "popup", err);
    if (P.line !== undefined) text(err, "popup.line", P.line);
    if (list(err, "popup.stops", P.stops, "stop: { id, city, place, area, postcode, start, end, lat, lon }")) {
      ids(err, "popup.stops", P.stops);
      const kinds = new Set(P.stops.map((/** @type {any} */ s) => typeof s?.start));
      if (kinds.size > 1) err("popup.stops", "give every stop dates, or (demo) every stop days from today, not a mix");
      P.stops.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
        const at = `popup.stops[${i}]`;
        onlyKeys(s, ["id", "city", "place", "area", "postcode", "start", "end", "lat", "lon", "note", "photo"], at, err);
        for (const k of ["city", "place", "area"]) text(err, `${at}.${k}`, s?.[k]);
        if (!POSTCODE.test(s?.postcode ?? "")) err(`${at}.postcode`, 'a UK postcode, e.g. "SE1 2HQ" or "SE1"');
        day(err, `${at}.start`, s?.start, mode); day(err, `${at}.end`, s?.end, mode);
        if (s?.start !== undefined && s?.end !== undefined && ord(s.end) < ord(s.start)) err(`${at}.end`, "the last day comes before the first");
        if (!(typeof s?.lat === "number" && s.lat > 49.8 && s.lat < 60.9)) err(`${at}.lat`, "latitude in Britain (49.8 to 60.9)");
        if (!(typeof s?.lon === "number" && s.lon > -8.2 && s.lon < 1.8)) err(`${at}.lon`, "longitude in Britain (-8.2 to 1.8)");
        if (s?.note !== undefined) text(err, `${at}.note`, s.note);
        if (s?.photo !== undefined) photo(err, `${at}.photo`, s.photo, exists);
      });
    }
  }

  if (on("popup-rooms") && isObj(site.rooms)) {
    onlyKeys(site.rooms, ["items"], "rooms", err);
    if (list(err, "rooms.items", site.rooms.items, "room: { id, name, minutes, line, photo }")) {
      ids(err, "rooms.items", site.rooms.items);
      if (site.rooms.items.length > 6) err("rooms.items", "six rooms at most");
      site.rooms.items.forEach((/** @type {any} */ r, /** @type {number} */ i) => {
        onlyKeys(r, ["id", "name", "minutes", "line", "photo"], `rooms.items[${i}]`, err);
        text(err, `rooms.items[${i}].name`, r?.name); text(err, `rooms.items[${i}].line`, r?.line);
        if (!(Number.isInteger(r?.minutes) && r.minutes > 0 && r.minutes <= 240)) err(`rooms.items[${i}].minutes`, "the brand's own minutes for this room (1 to 240)");
        photo(err, `rooms.items[${i}].photo`, r?.photo, exists);
      });
    }
  }
  if (on("popup-experience")) pageHead(err, "experiencePage", site.experiencePage, ["closing"]);

  if (on("popup-waitlist") && isObj(site.waitlist)) {
    onlyKeys(site.waitlist, ["title", "intro", "formUrl", "message", "done"], "waitlist", err);
    text(err, "waitlist.title", site.waitlist.title); text(err, "waitlist.message", site.waitlist.message);
    if (site.waitlist.formUrl !== undefined && !FORM.test(site.waitlist.formUrl)) err("waitlist.formUrl", "the brand's own Google Form link (or leave it out to use WhatsApp)");
  }
  if (on("popup-city") && isObj(site.city)) {
    onlyKeys(site.city, ["title", "formUrl", "message"], "city", err);
    text(err, "city.title", site.city.title); text(err, "city.message", site.city.message);
    if (site.city.formUrl !== undefined && !FORM.test(site.city.formUrl)) err("city.formUrl", "the brand's own Google Form link (or leave it out to use WhatsApp)");
    if (!String(site.city.message ?? "").includes("{city}")) err("city.message", 'include {city}, e.g. "Please bring the pop-up to {city}."');
  }

  if (on("popup-whats-on") && isObj(site.programme)) {
    onlyKeys(site.programme, ["title", "intro", "items", "empty"], "programme", err);
    text(err, "programme.title", site.programme.title); text(err, "programme.empty", site.programme.empty);
    if (list(err, "programme.items", site.programme.items, "event: { id, title, date, from, to, line }")) {
      ids(err, "programme.items", site.programme.items);
      site.programme.items.forEach((/** @type {any} */ e, /** @type {number} */ i) => {
        const at = `programme.items[${i}]`;
        onlyKeys(e, ["id", "title", "date", "from", "to", "line", "price", "bookUrl", "photo"], at, err);
        text(err, `${at}.title`, e?.title); text(err, `${at}.line`, e?.line); day(err, `${at}.date`, e?.date, mode);
        if (!TIME.test(e?.from ?? "") || !TIME.test(e?.to ?? "") || e.to <= e.from) err(at, 'from and to as "18:00" and "21:00"');
        price(err, `${at}.price`, e?.price);
        if (e?.bookUrl !== undefined) https(err, `${at}.bookUrl`, e.bookUrl);
        if (e?.photo !== undefined) photo(err, `${at}.photo`, e.photo, exists);
      });
    }
  }

  if (on("popup-only-here") && isObj(site.onlyHere)) {
    const O = site.onlyHere;
    onlyKeys(O, ["title", "intro", "items", "stock", "message"], "onlyHere", err);
    text(err, "onlyHere.title", O.title); text(err, "onlyHere.message", O.message);
    if (list(err, "onlyHere.items", O.items, "piece: { id, name, line, price, photo }")) {
      ids(err, "onlyHere.items", O.items);
      O.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
        onlyKeys(x, ["id", "name", "line", "price", "photo"], `onlyHere.items[${i}]`, err);
        text(err, `onlyHere.items[${i}].name`, x?.name); text(err, `onlyHere.items[${i}].line`, x?.line);
        if (x?.price === undefined) err(`onlyHere.items[${i}].price`, "the total price, every mandatory fee included");
        price(err, `onlyHere.items[${i}].price`, x?.price);
        photo(err, `onlyHere.items[${i}].photo`, x?.photo, exists);
      });
    }
    source(err, "onlyHere.stock", O.stock, mode, ["staleAfterDays"]);
  }

  if (on("popup-hire") && pageHead(err, "hirePage", site.hirePage, ["photo", "blocks", "packages", "message"])) {
    const H = site.hirePage;
    photo(err, "hirePage.photo", H.photo, exists);
    text(err, "hirePage.message", H.message);
    if (list(err, "hirePage.blocks", H.blocks, "block: { heading, text }")) H.blocks.forEach((/** @type {any} */ b, /** @type {number} */ i) => { onlyKeys(b, ["heading", "text"], `hirePage.blocks[${i}]`, err); text(err, `hirePage.blocks[${i}].heading`, b?.heading); text(err, `hirePage.blocks[${i}].text`, b?.text); });
    (H.packages ?? []).forEach((/** @type {any} */ p, /** @type {number} */ i) => { onlyKeys(p, ["name", "line", "price"], `hirePage.packages[${i}]`, err); text(err, `hirePage.packages[${i}].name`, p?.name); text(err, `hirePage.packages[${i}].line`, p?.line); price(err, `hirePage.packages[${i}].price`, p?.price); });
  }

  if (on("popup-slots") && isObj(site.slots)) {
    onlyKeys(site.slots, ["title", "intro", "every", "lastBefore", "url", "note", "photo"], "slots", err);
    if (site.slots.photo !== undefined) photo(err, "slots.photo", site.slots.photo, exists);
    text(err, "slots.title", site.slots.title);
    https(err, "slots.url", site.slots.url);
    if (site.slots.every !== undefined && ![15, 20, 30, 60].includes(site.slots.every)) err("slots.every", "15, 20, 30 or 60 minutes");
    if (site.slots.lastBefore !== undefined && !(Number.isInteger(site.slots.lastBefore) && site.slots.lastBefore >= 0 && site.slots.lastBefore <= 240)) err("slots.lastBefore", "minutes before closing for the last entry");
    if (site.slots.note !== undefined) text(err, "slots.note", site.slots.note);
  }
  if (on("popup-invite") && isObj(site.invite)) { onlyKeys(site.invite, ["title"], "invite", err); text(err, "invite.title", site.invite.title); }
  if (on("popup-line")) source(err, "line", site.line, mode, ["staleAfterMinutes"]);
  if (on("popup-tour")) pageHead(err, "tourPage", site.tourPage);
  if (on("popup-past")) {
    pageHead(err, "pastPage", site.pastPage);
    if (mode !== "demo" && isObj(P) && Array.isArray(P.stops)) P.stops.forEach((/** @type {any} */ s, /** @type {number} */ i) => { if (typeof s?.end === "string" && s.end < new Date().toISOString().slice(0, 10) && !s.photo) err(`popup.stops[${i}].photo`, "a past pop-up shows the brand's own photograph of it"); });
  }
  for (const [id, key] of [["popup-press", "press"], ["popup-partners", "partners"]]) {
    if (!on(id) || !isObj(site[key])) continue;
    const X = site[key];
    onlyKeys(X, ["title", "intro", "items"], key, err);
    text(err, `${key}.title`, X.title);
    if (list(err, `${key}.items`, X.items, key === "press" ? "article: { outlet, title, date, url }" : "partner: { name, line, url }")) X.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
      const at = `${key}.items[${i}]`;
      if (key === "press") { onlyKeys(x, ["outlet", "title", "date", "url"], at, err); text(err, `${at}.outlet`, x?.outlet); text(err, `${at}.title`, x?.title); if (!YMD.test(x?.date ?? "")) err(`${at}.date`, "the date it was published"); }
      else { onlyKeys(x, ["name", "line", "url"], at, err); text(err, `${at}.name`, x?.name); text(err, `${at}.line`, x?.line); }
      https(err, `${at}.url`, x?.url);
    });
  }

  if (site.alcohol !== undefined) {
    onlyKeys(site.alcohol, ["line", "href"], "alcohol", err);
    text(err, "alcohol.line", site.alcohol?.line);
    if (site.alcohol?.href !== "https://www.drinkaware.co.uk/") err("alcohol.href", 'the Drinkaware link, "https://www.drinkaware.co.uk/"');
  }
}
