// @ts-check
/**
 * Validation for the florist kit: this week's flowers and their colour, same-day delivery (the florist's own cut-offs
 * and postcode districts), occasions, the season, the card, flowers every week, care, rooms, sympathy, remembered
 * dates, weddings, workshops, gift a season and the bouquet builder. Every price, cut-off, district and date is the
 * florist's own; these checks only make sure it is complete and can't mislead. Unknown settings are refused, and a
 * client site can't use the demo's simulated data or a Stripe test link.
 */
import { isDistrict, cutoffLabel, cutoffOn } from "./lib/delivery.js";
import { bankHolidays, regionFromPostcode } from "../../core/lib/bank-holidays.js";
import { isHex, weekTokens } from "./lib/week.js";
import { contrast } from "../../core/lib/brand.js";
import { isTime, DAY_KEYS } from "../../core/lib/hours.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @typedef {((rel: string) => boolean)|undefined} Exists */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const ID = /^[a-z0-9-]{1,40}$/;
const YMD = /^\d{4}-\d{2}-\d{2}$/;
const PHOTO = ["src", "width", "height", "alt"];

/** @param {Report} err @param {string} path @param {any} v @param {number} [max] */
function text(err, path, v, max) {
  if (!isStr(v)) err(path, "required text is missing");
  else if (max && v.length > max) err(path, `keep it to ${max} characters (it has ${v.length})`);
}
/** @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (isObj(o)) for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}
/** @param {Report} err @param {string} at @param {any} o @param {string} shape */
function obj(err, at, o, shape) { if (!isObj(o)) { err(at, shape); return false; } return true; }
/** @param {Report} err @param {string} at @param {any} v */
function price(err, at, v) { if (!Number.isInteger(v) || v <= 0 || v > 20000) err(at, "a price in whole pounds, the florist's own"); }
/** @param {Report} err @param {string} at @param {any} v */
function date(err, at, v) {
  if (typeof v !== "string" || !YMD.test(v) || new Date(`${v}T12:00:00Z`).toISOString().slice(0, 10) !== v) err(at, "a date, YYYY-MM-DD");
}
/** @param {Report} err @param {string} path @param {any} p @param {Exists} exists @param {string[]} [keys] */
function photo(err, path, p, exists, keys = PHOTO) {
  if (!isObj(p)) { err(path, "a photo: { src, width, height, alt }"); return; }
  onlyKeys(p, keys, path, err);
  text(err, `${path}.alt`, p.alt);
  if (!Number.isInteger(p.width) || !Number.isInteger(p.height)) err(path, "width and height in pixels");
  if (!isStr(p.src)) err(`${path}.src`, "required");
  else if (!/^img\/[a-z0-9-]+\.(webp|jpg|png)$/.test(p.src)) err(`${path}.src`, "a photo in img/, e.g. img/week.webp");
  else if (exists && !exists(p.src)) err(`${path}.src`, `file not found: ${p.src}`);
}
/** @param {Report} err @param {string} path @param {any[]} list */
function ids(err, path, list) {
  const seen = new Set();
  list.forEach((x, i) => {
    if (!ID.test(x?.id ?? "")) err(`${path}[${i}].id`, "lowercase letters, numbers and dashes");
    else if (seen.has(x.id)) err(`${path}[${i}].id`, `"${x.id}" is used twice`);
    seen.add(x?.id);
  });
}
/** @param {Report} err @param {string} at @param {any} v @param {number} [min] */
function list(err, at, v, min = 1) { if (!Array.isArray(v) || v.length < min) { err(at, `a list of at least ${min}`); return false; } return true; }
/** The florist's own Stripe Payment Link: a test link on a demo, the live link on a client site. @param {any} link @param {string} at @param {string} mode @param {Report} err */
function stripeLink(link, at, mode, err) {
  if (!/^https:\/\/buy\.stripe\.com\/[\w-]+$/.test(link ?? "")) err(at, "the florist's own Stripe Payment Link, https://buy.stripe.com/…");
  else if (mode === "demo" && !link.startsWith("https://buy.stripe.com/test_")) err(at, "demo sites must use a Stripe test-mode link (https://buy.stripe.com/test_…)");
  else if (mode === "client" && link.startsWith("https://buy.stripe.com/test_")) err(at, "is a Stripe test-mode link; client sites need the florist's live link");
}
/** Live data: the florist's published Google Sheet on a client site; the demo keeps its values in the site. @param {any} s @param {string} at @param {string} mode @param {Report} err */
function source(s, at, mode, err) {
  if (s === undefined) return;
  if (!obj(err, at, s, '{ "source": "site" } or { "source": "sheet", "csvUrl": "…" }')) return;
  onlyKeys(s, ["source", "csvUrl"], at, err);
  if (!["site", "sheet"].includes(s.source)) err(`${at}.source`, '"site" (the values written here) or "sheet" (the florist\'s published Google Sheet)');
  if (s.source === "sheet" && !/^https:\/\/docs\.google\.com\/spreadsheets\/d\/e\/[\w-]+\/pub\?.*output=csv/.test(s.csvUrl ?? "")) err(`${at}.csvUrl`, "the Sheet's published CSV link (File → Share → Publish to web → CSV)");
  if (s.source === "sheet" && mode === "demo") err(`${at}.source`, 'a demo keeps its values in the site ("site")');
}

/** @param {any} site @param {Report} err @param {Exists} [exists] */
export function checkFlorist(site, err, exists) {
  if (site.kit !== "florist") return;
  const on = (/** @type {string} */ id) => Array.isArray(site.features) && site.features.includes(id);
  source(site.studioSheet, "studioSheet", site.mode, err);
  const m = site.mode, e = err, x = exists;
  /** Each setting's checker, run when the setting is present. */
  const checks = {
    week: (/** @type {any} */ v) => checkWeek(v, e, x),
    delivery: (/** @type {any} */ v) => checkDelivery(v, e),
    twoWays: (/** @type {any} */ v) => checkTwoWays(v, e, x),
    wrap: (/** @type {any} */ v) => checkWrap(v, e, x),
    occasions: (/** @type {any} */ v) => checkOccasions(v, e, x),
    inSeason: (/** @type {any} */ v) => checkSeason(v, e, x),
    card: (/** @type {any} */ v) => checkCard(v, e),
    everyWeek: (/** @type {any} */ v) => checkEveryWeek(v, m, e, x),
    care: (/** @type {any} */ v) => checkCare(v, e),
    rooms: (/** @type {any} */ v) => checkRooms(v, e, x),
    sympathy: (/** @type {any} */ v) => checkSympathy(v, e, x),
    remember: (/** @type {any} */ v) => checkRemember(v, e),
    weddings: (/** @type {any} */ v) => checkWeddings(v, e, x),
    workshops: (/** @type {any} */ v) => checkWorkshops(v, m, e, x),
    giftSeason: (/** @type {any} */ v) => checkGiftSeason(v, m, e, x),
    builder: (/** @type {any} */ v) => checkBuilder(v, e, x),
    note: (/** @type {any} */ v) => checkNote(v, e),
    gifts: (/** @type {any} */ v) => checkGifts(v, e, x),
    preorder: (/** @type {any} */ v) => checkPreorder(v, e, x, site.delivery, site.location?.region ?? regionFromPostcode(site.location?.postcode ?? "")),
    occasionPages: (/** @type {any} */ v) => checkOccasionPages(v, e, x),
    deliveryAreas: (/** @type {any} */ v) => checkAreas(v, site.delivery, e),
    funeral: (/** @type {any} */ v) => checkFuneral(v, e, x),
    stemNames: (/** @type {any} */ v) => checkStems(v, site.week, e),
    orderTracker: (/** @type {any} */ v) => checkTracker(v, m, e),
    calendar: (/** @type {any} */ v) => checkCalendar(v, e, x),
    stories: (/** @type {any} */ v) => checkStories(v, e, x),
    contract: (/** @type {any} */ v) => checkContract(v, m, e, x),
    bouquets: (/** @type {any} */ v) => checkBouquets(v, m, e, x),
    makeThis: (/** @type {any} */ v) => checkMakeThis(v, e, x),
    live: (/** @type {any} */ v) => checkLive(v, e),
    drop: (/** @type {any} */ v) => checkDrop(v, m, e, x),
  };
  for (const [key, check] of Object.entries(checks)) if (site[key] !== undefined) check(site[key]);
  if (on("business-flowers") && !site.contract?.accounts) err("contract.accounts", "your flowers this week reads each client's flowers from the florist's Sheet: { source, csvUrl, title }");
  // Same-day sits in this week's band (Mantel) or under today's bouquets (looks for social-first florists).
  if (on("same-day") && !on("this-week") && !on("todays-bouquets")) err("features", '"same-day" needs "this-week" or "todays-bouquets" to be on too');
  if (on("in-season") && site.studioSheet === undefined) err("studioSheet", 'in season now reads the florist\'s Sheet: { "source": "sheet", "csvUrl": … } (or "site" to use the list here)');
}

/** @param {any} w @param {Report} err @param {Exists} exists */
function checkWeek(w, err, exists) {
  if (!obj(err, "week", w, "{ name, stems, colour, colourName, sizes, photos, photo, message }")) return;
  onlyKeys(w, ["name", "stems", "colour", "colourName", "dots", "sizes", "photos", "photo", "message", "kicker"], "week", err);
  text(err, "week.name", w.name, 80);
  text(err, "week.stems", w.stems, 220);
  text(err, "week.colourName", w.colourName, 30);
  text(err, "week.message", w.message, 200);
  if (w.kicker !== undefined) text(err, "week.kicker", w.kicker, 60);
  if (!isHex(w.colour)) err("week.colour", 'the colour taken from this week\'s flowers, e.g. "#E0725C"');
  else {
    const t = weekTokens(w.colour, { ground: "#F7F6F3", ink: "#1C1B19" });
    if (contrast(t.weekDeep, "#FFFFFF") < 4.5) err("week.colour", "can't be made dark enough for a readable button; choose a stronger colour from the flowers");
  }
  if (w.dots !== undefined) {
    if (!Array.isArray(w.dots) || w.dots.length > 2 || !w.dots.every(isHex)) err("week.dots", "up to two more colours from the flowers, e.g. [\"#EBC6C3\", \"#C98448\"] (the week's colour is the first dot)");
  }
  if (list(err, "week.sizes", w.sizes)) {
    ids(err, "week.sizes", w.sizes);
    w.sizes.forEach((/** @type {any} */ s, /** @type {number} */ i) => { onlyKeys(s, ["id", "label", "price"], `week.sizes[${i}]`, err); text(err, `week.sizes[${i}].label`, s?.label, 20); price(err, `week.sizes[${i}].price`, s?.price); });
    if (w.sizes.length > 4) err("week.sizes", "four sizes at most");
  }
  if (list(err, "week.photos", w.photos)) {
    ids(err, "week.photos", w.photos);
    w.photos.forEach((/** @type {any} */ p, /** @type {number} */ i) => {
      photo(err, `week.photos[${i}]`, p, exists, ["id", ...PHOTO, "phone"]);
      if (p?.phone !== undefined) photo(err, `week.photos[${i}].phone`, p.phone, exists);
    });
    if (!w.photos.some((/** @type {any} */ p) => p?.id === w.photo)) err("week.photo", "the id of one of week.photos (the one shown this week)");
  }
}

/** @param {any} d @param {Report} err */
function checkDelivery(d, err) {
  if (!obj(err, "delivery", d, "{ zones, cutoffs, closed, bankHolidays, fee, collect }")) return;
  onlyKeys(d, ["zones", "cutoffs", "closed", "dates", "bankHolidays", "fee", "collect", "areas"], "delivery", err);
  if (d.dates !== undefined && obj(err, "delivery.dates", d.dates, '{ "2026-12-24": "11:00" }: a cut-off for one date (null for none that day)')) {
    for (const [k, c] of Object.entries(d.dates)) { date(err, `delivery.dates.${k}`, k); if (c !== null && !isTime(c)) err(`delivery.dates.${k}`, 'a time like "11:00", or null'); }
  }
  if (list(err, "delivery.zones", d.zones)) d.zones.forEach((/** @type {any} */ z, /** @type {number} */ i) => { if (typeof z !== "string" || !isDistrict(z)) err(`delivery.zones[${i}]`, 'a postcode district the florist delivers to by hand, e.g. "SW3"'); });
  if (obj(err, "delivery.cutoffs", d.cutoffs, '{ "mon": "13:00", …, "sun": null }: the order cut-off for same-day delivery each day, null for none')) {
    onlyKeys(d.cutoffs, [...DAY_KEYS], "delivery.cutoffs", err);
    for (const k of DAY_KEYS) {
      const c = d.cutoffs[k];
      if (c === undefined) err(`delivery.cutoffs.${k}`, 'required: the cut-off time ("13:00") or null for no deliveries that day');
      else if (c !== null && !isTime(c)) err(`delivery.cutoffs.${k}`, 'a time like "13:00", or null');
      else if (c !== null) void cutoffLabel(c);
    }
    if (DAY_KEYS.every((k) => d.cutoffs[k] === null)) err("delivery.cutoffs", "at least one day with deliveries");
  }
  if (d.closed !== undefined && (list(err, "delivery.closed", d.closed, 0))) d.closed.forEach((/** @type {any} */ x, /** @type {number} */ i) => date(err, `delivery.closed[${i}]`, x));
  if (!["closed", "open"].includes(d.bankHolidays)) err("delivery.bankHolidays", '"closed" or "open": whether the florist delivers on bank holidays');
  if (d.fee !== undefined && (!Number.isInteger(d.fee) || d.fee < 0 || d.fee > 200)) err("delivery.fee", "the delivery charge in whole pounds (0 for free), the florist's own");
  text(err, "delivery.collect", d.collect, 120);
  if (d.areas !== undefined) text(err, "delivery.areas", d.areas, 160);
}

/** @param {any} t @param {Report} err @param {Exists} exists */
function checkTwoWays(t, err, exists) {
  if (!obj(err, "twoWays", t, "{ room, door }")) return;
  onlyKeys(t, ["room", "door"], "twoWays", err);
  for (const k of ["room", "door"]) {
    const s = t[k];
    if (!obj(err, `twoWays.${k}`, s, "{ title, link, photo }")) continue;
    onlyKeys(s, ["title", "link", "photo"], `twoWays.${k}`, err);
    text(err, `twoWays.${k}.title`, s.title, 30);
    if (obj(err, `twoWays.${k}.link`, s.link, "{ label, href }")) { onlyKeys(s.link, ["label", "href"], `twoWays.${k}.link`, err); text(err, `twoWays.${k}.link.label`, s.link.label, 30); text(err, `twoWays.${k}.link.href`, s.link.href); }
    photo(err, `twoWays.${k}.photo`, s.photo, exists);
  }
  if (t.room?.photo?.src && t.room.photo.src === t.door?.photo?.src) err("twoWays.door.photo", "use a different photograph from the room's");
}

/** @param {any} w @param {Report} err @param {Exists} exists */
function checkWrap(w, err, exists) {
  if (!obj(err, "wrap", w, "{ text, paper, ribbon, photo }")) return;
  onlyKeys(w, ["text", "paper", "ribbon", "photo"], "wrap", err);
  if (list(err, "wrap.text", w.text)) w.text.forEach((/** @type {any} */ p, /** @type {number} */ i) => text(err, `wrap.text[${i}]`, p, 200));
  for (const k of ["paper", "ribbon"]) {
    // What the photograph actually shows: the swatch can't claim a colour the wrap isn't.
    if (obj(err, `wrap.${k}`, w[k], "{ name, colour }")) { onlyKeys(w[k], ["name", "colour"], `wrap.${k}`, err); text(err, `wrap.${k}.name`, w[k].name, 30); if (!isHex(w[k].colour)) err(`wrap.${k}.colour`, "a colour like \"#EBC6C3\", as in the photograph"); }
  }
  photo(err, "wrap.photo", w.photo, exists);
}

/** @param {any} o @param {Report} err @param {Exists} exists */
function checkOccasions(o, err, exists) {
  if (!obj(err, "occasions", o, "{ items, budgets }")) return;
  onlyKeys(o, ["items", "budgets"], "occasions", err);
  if (list(err, "occasions.items", o.items, 2)) {
    ids(err, "occasions.items", o.items);
    o.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
      const at = `occasions.items[${i}]`;
      onlyKeys(x, ["id", "title", "line", "from", "message", "photo", "href"], at, err);
      text(err, `${at}.title`, x?.title, 30); text(err, `${at}.line`, x?.line, 90); text(err, `${at}.message`, x?.message, 200);
      price(err, `${at}.from`, x?.from);
      photo(err, `${at}.photo`, x?.photo, exists);
    });
  }
  if (o.budgets !== undefined && list(err, "occasions.budgets", o.budgets)) o.budgets.forEach((/** @type {any} */ b, /** @type {number} */ i) => price(err, `occasions.budgets[${i}]`, b));
}

/** @param {any} s @param {Report} err @param {Exists} exists */
function checkSeason(s, err, exists) {
  if (!obj(err, "inSeason", s, "{ note, items, photo }")) return;
  onlyKeys(s, ["note", "items", "photo"], "inSeason", err);
  text(err, "inSeason.note", s.note, 120);
  if (list(err, "inSeason.items", s.items, 3)) {
    ids(err, "inSeason.items", s.items);
    s.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
      onlyKeys(x, ["id", "name", "status"], `inSeason.items[${i}]`, err);
      text(err, `inSeason.items[${i}].name`, x?.name, 40);
      if (!["just-in", "plenty", "last-week"].includes(x?.status)) err(`inSeason.items[${i}].status`, '"just-in", "plenty" or "last-week"');
    });
  }
  photo(err, "inSeason.photo", s.photo, exists);
}

/** @param {any} c @param {Report} err */
function checkCard(c, err) {
  if (!obj(err, "card", c, "{ max, lines, starters, from }")) return;
  onlyKeys(c, ["max", "lines", "starters", "from"], "card", err);
  if (!Number.isInteger(c.max) || c.max < 40 || c.max > 400) err("card.max", "the most characters the florist's card takes, 40–400");
  if (!Number.isInteger(c.lines) || c.lines < 2 || c.lines > 12) err("card.lines", "the most lines the card takes, 2–12");
  if (c.starters !== undefined && list(err, "card.starters", c.starters)) c.starters.forEach((/** @type {any} */ s, /** @type {number} */ i) => text(err, `card.starters[${i}]`, s, c.max ?? 200));
  text(err, "card.from", c.from, 30);
}

/** @param {any} e @param {string} mode @param {Report} err @param {Exists} exists */
function checkEveryWeek(e, mode, err, exists) {
  if (!obj(err, "everyWeek", e, "{ title, intro, plans, how, photo }")) return;
  onlyKeys(e, ["kicker", "title", "intro", "plans", "how", "photo"], "everyWeek", err);
  text(err, "everyWeek.title", e.title, 60); text(err, "everyWeek.intro", e.intro, 200);
  if (e.kicker !== undefined) text(err, "everyWeek.kicker", e.kicker, 40);
  if (list(err, "everyWeek.plans", e.plans)) {
    ids(err, "everyWeek.plans", e.plans);
    e.plans.forEach((/** @type {any} */ p, /** @type {number} */ i) => {
      const at = `everyWeek.plans[${i}]`;
      onlyKeys(p, ["id", "label", "price", "every", "line", "payLink"], at, err);
      text(err, `${at}.label`, p?.label, 30); text(err, `${at}.line`, p?.line, 120); price(err, `${at}.price`, p?.price);
      if (!["week", "fortnight", "month"].includes(p?.every)) err(`${at}.every`, '"week", "fortnight" or "month"');
      stripeLink(p?.payLink, `${at}.payLink`, mode, err);
    });
  }
  if (list(err, "everyWeek.how", e.how)) e.how.forEach((/** @type {any} */ h, /** @type {number} */ i) => { onlyKeys(h, ["q", "a"], `everyWeek.how[${i}]`, err); text(err, `everyWeek.how[${i}].q`, h?.q, 80); text(err, `everyWeek.how[${i}].a`, h?.a, 300); });
  photo(err, "everyWeek.photo", e.photo, exists);
}

/** @param {any} c @param {Report} err */
function checkCare(c, err) {
  if (!obj(err, "care", c, "{ title, intro, steps, lasts }")) return;
  onlyKeys(c, ["title", "intro", "steps", "lasts"], "care", err);
  text(err, "care.title", c.title, 60); text(err, "care.intro", c.intro, 200); text(err, "care.lasts", c.lasts, 200);
  if (list(err, "care.steps", c.steps, 3)) c.steps.forEach((/** @type {any} */ s, /** @type {number} */ i) => text(err, `care.steps[${i}]`, s, 200));
}

/** @param {any} r @param {Report} err @param {Exists} exists */
function checkRooms(r, err, exists) {
  if (!obj(err, "rooms", r, "{ items }")) return;
  onlyKeys(r, ["items"], "rooms", err);
  if (list(err, "rooms.items", r.items, 2)) {
    ids(err, "rooms.items", r.items);
    r.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => { onlyKeys(x, ["id", "title", "line", "photo"], `rooms.items[${i}]`, err); text(err, `rooms.items[${i}].title`, x?.title, 30); text(err, `rooms.items[${i}].line`, x?.line, 90); photo(err, `rooms.items[${i}].photo`, x?.photo, exists); });
  }
}

/** @param {any} s @param {Report} err @param {Exists} exists */
function checkSympathy(s, err, exists) {
  if (!obj(err, "sympathy", s, "{ title, intro, pieces, places, cardLines, message, note }")) return;
  onlyKeys(s, ["kicker", "title", "intro", "pieces", "places", "cardLines", "message", "note", "leadDays"], "sympathy", err);
  text(err, "sympathy.title", s.title, 60); text(err, "sympathy.intro", s.intro, 240); text(err, "sympathy.message", s.message, 200); text(err, "sympathy.note", s.note, 240);
  if (s.kicker !== undefined) text(err, "sympathy.kicker", s.kicker, 40);
  if (!Number.isInteger(s.leadDays) || s.leadDays < 0 || s.leadDays > 14) err("sympathy.leadDays", "days' notice the florist needs for funeral flowers, 0–14");
  if (list(err, "sympathy.pieces", s.pieces, 2)) {
    ids(err, "sympathy.pieces", s.pieces);
    s.pieces.forEach((/** @type {any} */ p, /** @type {number} */ i) => { const at = `sympathy.pieces[${i}]`; onlyKeys(p, ["id", "title", "line", "from", "photo"], at, err); text(err, `${at}.title`, p?.title, 40); text(err, `${at}.line`, p?.line, 120); price(err, `${at}.from`, p?.from); photo(err, `${at}.photo`, p?.photo, exists); });
  }
  if (list(err, "sympathy.places", s.places, 2)) s.places.forEach((/** @type {any} */ p, /** @type {number} */ i) => text(err, `sympathy.places[${i}]`, p, 60));
  if (list(err, "sympathy.cardLines", s.cardLines, 2)) s.cardLines.forEach((/** @type {any} */ p, /** @type {number} */ i) => text(err, `sympathy.cardLines[${i}]`, p, 120));
}

/** @param {any} r @param {Report} err */
function checkRemember(r, err) {
  if (!obj(err, "remember", r, "{ orderDaysBefore, kinds }")) return;
  onlyKeys(r, ["orderDaysBefore", "kinds"], "remember", err);
  if (!Number.isInteger(r.orderDaysBefore) || r.orderDaysBefore < 1 || r.orderDaysBefore > 14) err("remember.orderDaysBefore", "how many days before the date to remind them to order, 1–14");
  if (list(err, "remember.kinds", r.kinds, 2)) r.kinds.forEach((/** @type {any} */ k, /** @type {number} */ i) => text(err, `remember.kinds[${i}]`, k, 30));
}

/** @param {any} w @param {Report} err @param {Exists} exists */
function checkWeddings(w, err, exists) {
  if (!obj(err, "weddings", w, "{ title, intro, minWeeks, taken, pieces, consult, swatch, photo }")) return;
  onlyKeys(w, ["kicker", "title", "intro", "minWeeks", "taken", "pieces", "consult", "swatch", "photo"], "weddings", err);
  text(err, "weddings.title", w.title, 60); text(err, "weddings.intro", w.intro, 240);
  if (w.kicker !== undefined) text(err, "weddings.kicker", w.kicker, 40);
  if (!Number.isInteger(w.minWeeks) || w.minWeeks < 1 || w.minWeeks > 104) err("weddings.minWeeks", "the least notice the florist takes for a wedding, in weeks");
  if (list(err, "weddings.taken", w.taken, 0)) w.taken.forEach((/** @type {any} */ d, /** @type {number} */ i) => date(err, `weddings.taken[${i}]`, d));
  if (list(err, "weddings.pieces", w.pieces, 2)) {
    ids(err, "weddings.pieces", w.pieces);
    w.pieces.forEach((/** @type {any} */ p, /** @type {number} */ i) => { const at = `weddings.pieces[${i}]`; onlyKeys(p, ["id", "title", "line", "from", "photo"], at, err); text(err, `${at}.title`, p?.title, 40); text(err, `${at}.line`, p?.line, 120); if (p?.from !== undefined) price(err, `${at}.from`, p.from); photo(err, `${at}.photo`, p?.photo, exists); });
  }
  for (const k of ["consult", "swatch"]) if (obj(err, `weddings.${k}`, w[k], "{ title, text, message }")) { onlyKeys(w[k], ["title", "text", "message"], `weddings.${k}`, err); text(err, `weddings.${k}.title`, w[k].title, 50); text(err, `weddings.${k}.text`, w[k].text, 240); text(err, `weddings.${k}.message`, w[k].message, 240); }
  photo(err, "weddings.photo", w.photo, exists);
}

/** @param {any} w @param {string} mode @param {Report} err @param {Exists} exists */
function checkWorkshops(w, mode, err, exists) {
  if (!obj(err, "workshops", w, "{ title, intro, items }")) return;
  onlyKeys(w, ["kicker", "title", "intro", "items", "empty"], "workshops", err);
  text(err, "workshops.title", w.title, 60); text(err, "workshops.intro", w.intro, 240); text(err, "workshops.empty", w.empty, 160);
  if (w.kicker !== undefined) text(err, "workshops.kicker", w.kicker, 40);
  if (list(err, "workshops.items", w.items)) {
    ids(err, "workshops.items", w.items);
    w.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
      const at = `workshops.items[${i}]`;
      onlyKeys(x, ["id", "title", "text", "date", "start", "minutes", "price", "places", "left", "payLink", "photo"], at, err);
      text(err, `${at}.title`, x?.title, 50); text(err, `${at}.text`, x?.text, 240); date(err, `${at}.date`, x?.date);
      if (!isTime(x?.start)) err(`${at}.start`, 'a start time like "18:30"');
      if (!Number.isInteger(x?.minutes) || x.minutes < 30 || x.minutes > 480) err(`${at}.minutes`, "how long it lasts, in minutes");
      price(err, `${at}.price`, x?.price);
      if (!Number.isInteger(x?.places) || x.places < 1 || x.places > 40) err(`${at}.places`, "places at the table, 1–40");
      if (!Number.isInteger(x?.left) || x.left < 0 || x.left > (x?.places ?? 0)) err(`${at}.left`, "places left, from 0 to the number of places");
      stripeLink(x?.payLink, `${at}.payLink`, mode, err);
      photo(err, `${at}.photo`, x?.photo, exists);
    });
  }
}

/** @param {any} g @param {string} mode @param {Report} err @param {Exists} exists */
function checkGiftSeason(g, mode, err, exists) {
  if (!obj(err, "giftSeason", g, "{ lengths, message, photo }")) return;
  onlyKeys(g, ["lengths", "message", "photo", "leadDays"], "giftSeason", err);
  text(err, "giftSeason.message", g.message, 200);
  if (!Number.isInteger(g.leadDays) || g.leadDays < 0 || g.leadDays > 28) err("giftSeason.leadDays", "the soonest a first delivery can be, in days");
  if (list(err, "giftSeason.lengths", g.lengths)) g.lengths.forEach((/** @type {any} */ l, /** @type {number} */ i) => {
    const at = `giftSeason.lengths[${i}]`;
    onlyKeys(l, ["weeks", "price", "payLink"], at, err);
    if (!Number.isInteger(l?.weeks) || l.weeks < 2 || l.weeks > 52) err(`${at}.weeks`, "how many weekly deliveries, 2–52");
    price(err, `${at}.price`, l?.price);
    stripeLink(l?.payLink, `${at}.payLink`, mode, err);
  });
  photo(err, "giftSeason.photo", g.photo, exists);
}

/** @param {any} b @param {Report} err @param {Exists} exists */
function checkBuilder(b, err, exists) {
  if (!obj(err, "builder", b, "{ title, intro, palettes, sizes, bouquets, message }")) return;
  onlyKeys(b, ["kicker", "title", "intro", "palettes", "sizes", "bouquets", "message"], "builder", err);
  text(err, "builder.title", b.title, 60); text(err, "builder.intro", b.intro, 240); text(err, "builder.message", b.message, 200);
  if (b.kicker !== undefined) text(err, "builder.kicker", b.kicker, 40);
  const pal = list(err, "builder.palettes", b.palettes, 2) ? b.palettes : [];
  ids(err, "builder.palettes", pal);
  pal.forEach((/** @type {any} */ p, /** @type {number} */ i) => { onlyKeys(p, ["id", "label", "colour"], `builder.palettes[${i}]`, err); text(err, `builder.palettes[${i}].label`, p?.label, 24); if (!isHex(p?.colour)) err(`builder.palettes[${i}].colour`, "a colour like \"#E0725C\""); });
  const sizes = list(err, "builder.sizes", b.sizes) ? b.sizes : [];
  ids(err, "builder.sizes", sizes);
  sizes.forEach((/** @type {any} */ s, /** @type {number} */ i) => { onlyKeys(s, ["id", "label", "price"], `builder.sizes[${i}]`, err); text(err, `builder.sizes[${i}].label`, s?.label, 20); price(err, `builder.sizes[${i}].price`, s?.price); });
  if (list(err, "builder.bouquets", b.bouquets)) {
    ids(err, "builder.bouquets", b.bouquets);
    b.bouquets.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
      const at = `builder.bouquets[${i}]`;
      onlyKeys(x, ["id", "palette", "size", "photo"], at, err);
      if (!pal.some((/** @type {any} */ p) => p?.id === x?.palette)) err(`${at}.palette`, "one of builder.palettes");
      if (!sizes.some((/** @type {any} */ s) => s?.id === x?.size)) err(`${at}.size`, "one of builder.sizes");
      photo(err, `${at}.photo`, x?.photo, exists);
    });
    // Every palette needs at least one real photograph, or choosing it would show nothing.
    for (const p of pal) if (!b.bouquets.some((/** @type {any} */ x) => x?.palette === p?.id)) err("builder.bouquets", `no photograph for the "${p?.id}" palette; photograph one or remove the palette`);
  }
}

/** @param {Report} err @param {string} at @param {any} v */
function qaList(err, at, v) {
  if (!list(err, at, v)) return;
  v.forEach((/** @type {any} */ x, /** @type {number} */ i) => { onlyKeys(x, ["q", "a"], `${at}[${i}]`, err); text(err, `${at}[${i}].q`, x?.q, 90); text(err, `${at}[${i}].a`, x?.a, 400); });
}
/** A sheet- or simulation-backed private page's source. @param {any} t @param {string} at @param {string} mode @param {Report} err */
function privateSource(t, at, mode, err) {
  if (!["sheet", "simulated"].includes(t.source)) err(`${at}.source`, 'must be "sheet" (or "simulated" on demo sites)');
  if (t.source === "simulated" && mode !== "demo") err(`${at}.source`, 'simulated data is only allowed on demo sites; use "sheet"');
  if (t.source === "sheet" && !/^https:\/\/docs\.google\.com\/spreadsheets\/d\/e\/[\w-]+\/pub\?.*output=csv/.test(t.csvUrl ?? "")) err(`${at}.csvUrl`, "the Sheet's published CSV link (File → Share → Publish to web → CSV)");
  if (t.example !== undefined && mode !== "demo") err(`${at}.example`, "an example reference is only for demo sites");
  if (t.example !== undefined && !/^[A-Z0-9]{4,10}$/.test(t.example)) err(`${at}.example`, "4–10 capital letters and digits");
}

/** @param {any} n @param {Report} err */
function checkNote(n, err) {
  if (!obj(err, "note", n, "{ text, from }")) return;
  onlyKeys(n, ["text", "from"], "note", err);
  text(err, "note.text", n.text, 240);
  text(err, "note.from", n.from, 40);
}

/** @param {any} g @param {Report} err @param {Exists} exists */
function checkGifts(g, err, exists) {
  if (!obj(err, "gifts", g, "{ title?, items: [{ id, name, price, photo }] }")) return;
  onlyKeys(g, ["title", "items"], "gifts", err);
  if (g.title !== undefined) text(err, "gifts.title", g.title, 40);
  if (!list(err, "gifts.items", g.items)) return;
  if (g.items.length > 6) err("gifts.items", "six at most");
  ids(err, "gifts.items", g.items);
  g.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `gifts.items[${i}]`;
    onlyKeys(x, ["id", "name", "price", "photo"], at, err);
    text(err, `${at}.name`, x?.name, 40); price(err, `${at}.price`, x?.price); photo(err, `${at}.photo`, x?.photo, exists);
  });
}

/** Whether the florist delivers on a date: a cut-off that day, not closed, not a bank holiday they close on. @param {any} d @param {string} day @param {any} region */
function deliversOn(d, day, region) {
  if (!isObj(d?.cutoffs)) return true; // delivery itself reports what's wrong
  const wd = new Date(`${day}T12:00:00Z`).getUTCDay();
  const holidays = d.bankHolidays === "closed" ? bankHolidays(Number(day.slice(0, 4)), region) : [];
  return Boolean(cutoffOn(d, day, wd)) && !(d.closed ?? []).includes(day) && !holidays.includes(day);
}

/** @param {any} p @param {Report} err @param {Exists} exists @param {any} [delivery] @param {any} [region] */
function checkPreorder(p, err, exists, delivery, region) {
  if (!obj(err, "preorder", p, "{ windows: [{ id, title, line, opens, orderBy, day, items, message }] }")) return;
  onlyKeys(p, ["windows"], "preorder", err);
  if (!list(err, "preorder.windows", p.windows)) return;
  ids(err, "preorder.windows", p.windows);
  p.windows.forEach((/** @type {any} */ w, /** @type {number} */ i) => {
    const at = `preorder.windows[${i}]`;
    if (!obj(err, at, w, "{ id, title, line, opens, orderBy, day, items, message }")) return;
    onlyKeys(w, ["id", "title", "line", "opens", "orderBy", "day", "items", "message", "occasion"], at, err);
    text(err, `${at}.title`, w.title, 40); text(err, `${at}.line`, w.line, 140); text(err, `${at}.message`, w.message, 200);
    for (const k of ["opens", "orderBy", "day"]) date(err, `${at}.${k}`, w[k]);
    if (YMD.test(w.opens ?? "") && YMD.test(w.orderBy ?? "") && YMD.test(w.day ?? "") && !(w.opens < w.orderBy && w.orderBy <= w.day)) err(at, "opens before the order-by date, which is on or before the day (the florist's own dates)");
    if (w.occasion !== undefined && !ID.test(w.occasion)) err(`${at}.occasion`, "the id of an occasion page");
    if (delivery && YMD.test(w.day ?? "") && !deliversOn(delivery, w.day, region)) err(`${at}.day`, `the florist doesn't deliver on ${w.day} (a day with no cut-off, a closed date or a bank holiday); choose the day before`);
    if (list(err, `${at}.items`, w.items)) {
      if (w.items.length > 4) err(`${at}.items`, "four at most: a short menu");
      ids(err, `${at}.items`, w.items);
      w.items.forEach((/** @type {any} */ x, /** @type {number} */ j) => { onlyKeys(x, ["id", "name", "price", "photo"], `${at}.items[${j}]`, err); text(err, `${at}.items[${j}].name`, x?.name, 50); price(err, `${at}.items[${j}].price`, x?.price); photo(err, `${at}.items[${j}].photo`, x?.photo, exists); });
    }
  });
}

/** @param {any} o @param {Report} err @param {Exists} exists */
function checkOccasionPages(o, err, exists) {
  if (!obj(err, "occasionPages", o, "{ title, intro, pages }")) return;
  onlyKeys(o, ["kicker", "title", "intro", "pages"], "occasionPages", err);
  text(err, "occasionPages.title", o.title, 60); text(err, "occasionPages.intro", o.intro, 240);
  if (!list(err, "occasionPages.pages", o.pages, 2)) return;
  ids(err, "occasionPages.pages", o.pages);
  o.pages.forEach((/** @type {any} */ g, /** @type {number} */ i) => {
    const at = `occasionPages.pages[${i}]`;
    if (!obj(err, at, g, "{ id, title, line, intro, photo, items, message, words? }")) return;
    onlyKeys(g, ["id", "title", "line", "intro", "photo", "items", "message", "words"], at, err);
    text(err, `${at}.title`, g.title, 40); text(err, `${at}.line`, g.line, 100); text(err, `${at}.intro`, g.intro, 400); text(err, `${at}.message`, g.message, 200);
    photo(err, `${at}.photo`, g.photo, exists);
    if (list(err, `${at}.items`, g.items)) {
      if (g.items.length > 4) err(`${at}.items`, "four at most");
      g.items.forEach((/** @type {any} */ x, /** @type {number} */ j) => { onlyKeys(x, ["name", "price", "line"], `${at}.items[${j}]`, err); text(err, `${at}.items[${j}].name`, x?.name, 60); text(err, `${at}.items[${j}].line`, x?.line, 140); price(err, `${at}.items[${j}].price`, x?.price); });
    }
    if (g.words !== undefined && (!Array.isArray(g.words) || g.words.length > 6 || !g.words.every((/** @type {any} */ w) => isStr(w) && w.length <= 120))) err(`${at}.words`, "up to six lines for the card, 120 characters each");
  });
}

/** @param {any} a @param {any} d @param {Report} err */
function checkAreas(a, d, err) {
  if (!obj(err, "deliveryAreas", a, "{ title, intro, how, areas }")) return;
  onlyKeys(a, ["kicker", "title", "intro", "how", "areas"], "deliveryAreas", err);
  text(err, "deliveryAreas.title", a.title, 60); text(err, "deliveryAreas.intro", a.intro, 300);
  if (a.how !== undefined) qaList(err, "deliveryAreas.how", a.how);
  if (!list(err, "deliveryAreas.areas", a.areas)) return;
  const zones = Array.isArray(d?.zones) ? d.zones : [];
  const seen = new Set();
  a.areas.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `deliveryAreas.areas[${i}]`;
    if (!obj(err, at, x, "{ district, name, line, streets?, fee?, cutoffs? }")) return;
    onlyKeys(x, ["district", "name", "line", "streets", "fee", "cutoffs"], at, err);
    if (!zones.includes(x.district)) err(`${at}.district`, `one of the districts in delivery.zones (${zones.join(", ")})`);
    else if (seen.has(x.district)) err(`${at}.district`, "used twice"); else seen.add(x.district);
    text(err, `${at}.name`, x.name, 60); text(err, `${at}.line`, x.line, 240);
    if (x.streets !== undefined) text(err, `${at}.streets`, x.streets, 200);
    if (x.fee !== undefined && (!Number.isInteger(x.fee) || x.fee < 0 || x.fee > 200)) err(`${at}.fee`, "this area's delivery charge in whole pounds, the florist's own");
    if (x.cutoffs !== undefined && obj(err, `${at}.cutoffs`, x.cutoffs, '{ "mon": "12:00" }: only the days that differ')) {
      onlyKeys(x.cutoffs, [...DAY_KEYS], `${at}.cutoffs`, err);
      for (const [k, c] of Object.entries(x.cutoffs)) if (c !== null && !isTime(c)) err(`${at}.cutoffs.${k}`, 'a time like "12:00", or null');
    }
  });
}

/** @param {any} f @param {Report} err @param {Exists} exists */
function checkFuneral(f, err, exists) {
  if (!obj(err, "funeral", f, "{ title, intro, photo, pieces, notice, message }")) return;
  onlyKeys(f, ["kicker", "title", "intro", "photo", "pieces", "notice", "message", "note"], "funeral", err);
  text(err, "funeral.title", f.title, 60); text(err, "funeral.intro", f.intro, 300); text(err, "funeral.message", f.message, 200);
  if (f.note !== undefined) text(err, "funeral.note", f.note, 240);
  photo(err, "funeral.photo", f.photo, exists);
  qaList(err, "funeral.notice", f.notice);
  if (list(err, "funeral.pieces", f.pieces, 2)) {
    ids(err, "funeral.pieces", f.pieces);
    f.pieces.forEach((/** @type {any} */ x, /** @type {number} */ i) => { const at = `funeral.pieces[${i}]`; onlyKeys(x, ["id", "title", "line", "from", "photo"], at, err); text(err, `${at}.title`, x?.title, 40); text(err, `${at}.line`, x?.line, 160); price(err, `${at}.from`, x?.from); photo(err, `${at}.photo`, x?.photo, exists); });
  }
}

/** @param {any} n @param {any} week @param {Report} err */
function checkStems(n, week, err) {
  if (!obj(err, "stemNames", n, "{ photo, points: [{ x, y, px?, py?, name, note? }] }")) return;
  onlyKeys(n, ["photo", "points"], "stemNames", err);
  if (!week?.photos?.some((/** @type {any} */ p) => p?.id === n.photo)) err("stemNames.photo", "the id of the week photo these stems are marked on");
  if (!list(err, "stemNames.points", n.points)) return;
  if (n.points.length > 8) err("stemNames.points", "eight at most");
  const pc = (/** @type {any} */ v) => typeof v === "number" && v >= 0 && v <= 100;
  n.points.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `stemNames.points[${i}]`;
    onlyKeys(x, ["x", "y", "px", "py", "name", "note"], at, err);
    if (!pc(x?.x) || !pc(x?.y)) err(at, "x and y: where the stem is on the photo, in % from the left and top");
    if ((x?.px !== undefined || x?.py !== undefined) && (!pc(x.px) || !pc(x.py))) err(at, "px and py together: where the stem is on the phone photo, in %");
    text(err, `${at}.name`, x?.name, 40);
    if (x?.note !== undefined) text(err, `${at}.note`, x.note, 40);
  });
}

/** @param {any} t @param {string} mode @param {Report} err */
function checkTracker(t, mode, err) {
  if (!obj(err, "orderTracker", t, "{ source, csvUrl, stages, kicker, title, intro }")) return;
  onlyKeys(t, ["source", "csvUrl", "staleAfterHours", "stages", "kicker", "title", "intro", "example", "demo"], "orderTracker", err);
  privateSource(t, "orderTracker", mode, err);
  // The demo's simulated order: a note per stage and the photo it shows once made. Never on a client site.
  if (t.demo !== undefined) {
    if (mode !== "demo") err("orderTracker.demo", "only a demo simulates an order; a client's orders come from their Sheet");
    else if (obj(err, "orderTracker.demo", t.demo, "{ notes: [one per stage], photo: \"img/…\" }")) {
      onlyKeys(t.demo, ["notes", "photo"], "orderTracker.demo", err);
      if (!Array.isArray(t.demo.notes) || t.demo.notes.length !== (t.stages?.length ?? -1)) err("orderTracker.demo.notes", "one note per stage");
      if (!/^img\/[a-z0-9-]+\.(webp|jpg)$/.test(t.demo.photo ?? "")) err("orderTracker.demo.photo", "a photo in img/");
    }
  }
  if (t.staleAfterHours !== undefined && (!Number.isInteger(t.staleAfterHours) || t.staleAfterHours < 1 || t.staleAfterHours > 72)) err("orderTracker.staleAfterHours", "whole hours, 1–72");
  text(err, "orderTracker.kicker", t.kicker, 40); text(err, "orderTracker.title", t.title, 60);
  if (t.intro !== undefined) text(err, "orderTracker.intro", t.intro, 240);
  if (!Array.isArray(t.stages) || t.stages.length < 2 || t.stages.length > 6) { err("orderTracker.stages", "2–6 stages in order, the last meaning delivered: [{ id, name, about }]"); return; }
  ids(err, "orderTracker.stages", t.stages);
  t.stages.forEach((/** @type {any} */ x, /** @type {number} */ i) => { onlyKeys(x, ["id", "name", "about"], `orderTracker.stages[${i}]`, err); text(err, `orderTracker.stages[${i}].name`, x?.name, 30); text(err, `orderTracker.stages[${i}].about`, x?.about, 160); });
}

/** @param {any} c @param {Report} err @param {Exists} exists */
function checkCalendar(c, err, exists) {
  if (!obj(err, "calendar", c, "{ title, intro, months }")) return;
  onlyKeys(c, ["kicker", "title", "intro", "months", "weddingLine"], "calendar", err);
  text(err, "calendar.title", c.title, 60); text(err, "calendar.intro", c.intro, 300);
  if (c.weddingLine !== undefined) text(err, "calendar.weddingLine", c.weddingLine, 160);
  if (!Array.isArray(c.months) || c.months.length !== 12) { err("calendar.months", "twelve months, January first: [{ stems, line, photo }]"); return; }
  c.months.forEach((/** @type {any} */ m, /** @type {number} */ i) => { const at = `calendar.months[${i}]`; onlyKeys(m, ["stems", "line", "photo"], at, err); text(err, `${at}.stems`, m?.stems, 120); text(err, `${at}.line`, m?.line, 220); photo(err, `${at}.photo`, m?.photo, exists); });
}

/** @param {any} s @param {Report} err @param {Exists} exists */
function checkStories(s, err, exists) {
  if (!obj(err, "stories", s, "{ title, intro, items }")) return;
  onlyKeys(s, ["kicker", "title", "intro", "items"], "stories", err);
  text(err, "stories.title", s.title, 60); text(err, "stories.intro", s.intro, 300);
  if (!list(err, "stories.items", s.items)) return;
  ids(err, "stories.items", s.items);
  s.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `stories.items[${i}]`;
    if (!obj(err, at, x, "{ id, title, kind, venue, when, line, brief, palette, stems, photos }")) return;
    onlyKeys(x, ["id", "title", "kind", "venue", "when", "line", "brief", "palette", "stems", "photos"], at, err);
    text(err, `${at}.title`, x.title, 60); text(err, `${at}.kind`, x.kind, 30); text(err, `${at}.venue`, x.venue, 80);
    text(err, `${at}.line`, x.line, 140); text(err, `${at}.brief`, x.brief, 600); text(err, `${at}.stems`, x.stems, 260);
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(x.when ?? "")) err(`${at}.when`, "the month, YYYY-MM");
    if (!Array.isArray(x.palette) || x.palette.length < 2 || x.palette.length > 5) err(`${at}.palette`, "two to five colours: [{ name, colour }]");
    else x.palette.forEach((/** @type {any} */ c, /** @type {number} */ j) => { onlyKeys(c, ["name", "colour"], `${at}.palette[${j}]`, err); text(err, `${at}.palette[${j}].name`, c?.name, 30); if (!isHex(c?.colour)) err(`${at}.palette[${j}].colour`, 'a colour like "#E4CFD2"'); });
    if (!Array.isArray(x.photos) || x.photos.length < 3 || x.photos.length > 4) err(`${at}.photos`, "three or four of the florist's photographs");
    else x.photos.forEach((/** @type {any} */ p, /** @type {number} */ j) => photo(err, `${at}.photos[${j}]`, p, exists));
  });
}

/** @param {any} c @param {string} mode @param {Report} err @param {Exists} exists */
function checkContract(c, mode, err, exists) {
  if (!obj(err, "contract", c, "{ title, intro, how, weekly, sizes, message, photos }")) return;
  onlyKeys(c, ["kicker", "title", "intro", "how", "weekly", "sizes", "message", "photos", "accounts"], "contract", err);
  text(err, "contract.title", c.title, 60); text(err, "contract.intro", c.intro, 300); text(err, "contract.weekly", c.weekly, 400); text(err, "contract.message", c.message, 200);
  qaList(err, "contract.how", c.how);
  if (!Array.isArray(c.photos) || c.photos.length !== 2) err("contract.photos", "two photographs of the florist's work in a hotel, restaurant or office");
  else c.photos.forEach((/** @type {any} */ p, /** @type {number} */ i) => photo(err, `contract.photos[${i}]`, p, exists));
  if (list(err, "contract.sizes", c.sizes)) {
    if (c.sizes.length > 4) err("contract.sizes", "four at most");
    ids(err, "contract.sizes", c.sizes);
    c.sizes.forEach((/** @type {any} */ x, /** @type {number} */ i) => { const at = `contract.sizes[${i}]`; onlyKeys(x, ["id", "name", "line", "price", "every"], at, err); text(err, `${at}.name`, x?.name, 40); text(err, `${at}.line`, x?.line, 160); price(err, `${at}.price`, x?.price); if (!["week", "fortnight"].includes(x?.every)) err(`${at}.every`, '"week" or "fortnight": how often it changes for that price'); });
  }
  if (c.accounts !== undefined && obj(err, "contract.accounts", c.accounts, "{ source, csvUrl, title, intro? }")) {
    onlyKeys(c.accounts, ["source", "csvUrl", "staleAfterDays", "title", "intro", "example"], "contract.accounts", err);
    if (c.accounts.staleAfterDays !== undefined && (!Number.isInteger(c.accounts.staleAfterDays) || c.accounts.staleAfterDays < 1 || c.accounts.staleAfterDays > 31)) err("contract.accounts.staleAfterDays", "whole days, 1–31: after this a client's page says it may be out of date");
    privateSource(c.accounts, "contract.accounts", mode, err);
    text(err, "contract.accounts.title", c.accounts.title, 60);
    if (c.accounts.intro !== undefined) text(err, "contract.accounts.intro", c.accounts.intro, 240);
  }
}

// --- Social-first florists (the second look on this kit) ---

const DAY_KEYS_LIST = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Today's bouquets: the ranges, an optional pinned post, every bouquet with its photo and price. What's left comes
 * from the florist's Sheet on a client site (a number written here would still show weeks later); a demo may write one.
 * @param {any} b @param {string} mode @param {Report} err @param {Exists} exists
 */
function checkBouquets(b, mode, err, exists) {
  if (!obj(err, "bouquets", b, "{ message, ranges, items, … }")) return;
  onlyKeys(b, ["message", "instagram", "ranges", "pinned", "items", "addOns", "card", "title", "staleMinutes"], "bouquets", err);
  if (b.staleMinutes !== undefined && (!Number.isInteger(b.staleMinutes) || b.staleMinutes < 10 || b.staleMinutes > 720)) err("bouquets.staleMinutes", "after how many minutes counts the florist hasn't updated stop showing, 10–720");
  text(err, "bouquets.message", b.message, 120);
  if (b.instagram !== undefined && !/^[A-Za-z0-9._]{1,30}$/.test(b.instagram)) err("bouquets.instagram", "the Instagram handle without @, e.g. laleh.studio");
  if (list(err, "bouquets.ranges", b.ranges)) {
    if (b.ranges.length > 3) err("bouquets.ranges", "at most three ranges");
    ids(err, "bouquets.ranges", b.ranges);
    b.ranges.forEach((/** @type {any} */ r, /** @type {number} */ i) => { onlyKeys(r, ["id", "label", "line"], `bouquets.ranges[${i}]`, err); text(err, `bouquets.ranges[${i}].label`, r.label, 24); text(err, `bouquets.ranges[${i}].line`, r.line, 80); });
  }
  const rangeIds = (b.ranges ?? []).map((/** @type {any} */ r) => r.id);
  if (b.pinned !== undefined && obj(err, "bouquets.pinned", b.pinned, "{ name, priceFrom, photo, video? }")) {
    const p = b.pinned;
    onlyKeys(p, ["name", "price", "priceFrom", "photo", "video", "flag"], "bouquets.pinned", err);
    text(err, "bouquets.pinned.name", p.name, 60);
    if ((p.price === undefined) === (p.priceFrom === undefined)) err("bouquets.pinned", "a price or a priceFrom (not both)");
    if (p.price !== undefined) price(err, "bouquets.pinned.price", p.price);
    if (p.priceFrom !== undefined) price(err, "bouquets.pinned.priceFrom", p.priceFrom);
    photo(err, "bouquets.pinned.photo", p.photo, exists);
    if (p.video !== undefined) {
      if (!/^img\/[a-z0-9-]+\.mp4$/.test(p.video ?? "")) err("bouquets.pinned.video", "a muted clip in img/, e.g. img/pinned.mp4");
      else if (exists && !exists(p.video)) err("bouquets.pinned.video", `file not found: ${p.video}`);
    }
    if (p.flag !== undefined) text(err, "bouquets.pinned.flag", p.flag, 16);
  }
  if (list(err, "bouquets.items", b.items)) {
    ids(err, "bouquets.items", b.items);
    b.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
      const at = `bouquets.items[${i}]`;
      onlyKeys(x, ["id", "range", "name", "price", "photo", "status", "left"], at, err);
      if (!rangeIds.includes(x.range)) err(`${at}.range`, `one of the ranges: ${rangeIds.join(", ")}`);
      text(err, `${at}.name`, x.name, 40);
      price(err, `${at}.price`, x.price);
      photo(err, `${at}.photo`, x.photo, exists);
      if (x.id === "updated") err(`${at}.id`, '"updated" is the Sheet\'s update time (bouquet,updated,…); choose another id');
      if (mode !== "demo" && (x.status !== undefined || x.left !== undefined)) err(`${at}.status`, "a client site reads what's left and what's sold out from the florist's Sheet (bouquet,<id>,few:2 / sold, with bouquet,updated,<time>), never a value written here");
      if (x.status !== undefined && !["available", "few", "sold"].includes(x.status)) err(`${at}.status`, '"available", "few" (with left) or "sold"');
      if (x.status === "few" && (!Number.isInteger(x.left) || x.left < 1 || x.left > 99)) err(`${at}.left`, "how many are left, 1–99");
      if (x.left !== undefined && x.status !== "few") err(`${at}.left`, 'only with status "few"');
    });
    for (const r of rangeIds) if (!b.items.some((/** @type {any} */ x) => x.range === r)) err("bouquets.items", `the "${r}" range has no bouquets`);
  }
  if (b.addOns !== undefined && list(err, "bouquets.addOns", b.addOns)) {
    ids(err, "bouquets.addOns", b.addOns);
    b.addOns.forEach((/** @type {any} */ a, /** @type {number} */ i) => { onlyKeys(a, ["id", "name", "price"], `bouquets.addOns[${i}]`, err); text(err, `bouquets.addOns[${i}].name`, a.name, 40); price(err, `bouquets.addOns[${i}].price`, a.price); });
  }
  if (b.card !== undefined && obj(err, "bouquets.card", b.card, "{ max }")) {
    onlyKeys(b.card, ["max"], "bouquets.card", err);
    if (!Number.isInteger(b.card.max) || b.card.max < 20 || b.card.max > 400) err("bouquets.card.max", "the most characters the florist's card takes, 20–400");
  }
}

/** "Can you make this one?" @param {any} m @param {Report} err @param {Exists} exists */
function checkMakeThis(m, err, exists) {
  if (!obj(err, "makeThis", m, "{ title, intro, message, budgets, photo }")) return;
  onlyKeys(m, ["title", "intro", "message", "budgets", "photo"], "makeThis", err);
  text(err, "makeThis.title", m.title, 60);
  text(err, "makeThis.intro", m.intro, 160);
  text(err, "makeThis.message", m.message, 80);
  if (list(err, "makeThis.budgets", m.budgets, 2)) m.budgets.forEach((/** @type {any} */ v, /** @type {number} */ i) => { if (!/^£\d{1,4}\+?$/.test(v ?? "")) err(`makeThis.budgets[${i}]`, "a budget like £45 or £80+"); });
  if (m.photo !== undefined) photo(err, "makeThis.photo", m.photo, exists);
}

/** The florist's LIVE sessions. @param {any} l @param {Report} err */
function checkLive(l, err) {
  if (!obj(err, "live", l, "{ title, sessions, links }")) return;
  onlyKeys(l, ["title", "intro", "sessions", "links"], "live", err);
  text(err, "live.title", l.title, 60);
  if (l.intro !== undefined) text(err, "live.intro", l.intro, 160);
  if (list(err, "live.sessions", l.sessions)) l.sessions.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    const at = `live.sessions[${i}]`;
    onlyKeys(s, ["date", "time", "minutes", "where", "what"], at, err);
    date(err, `${at}.date`, s.date);
    if (!HHMM.test(s.time ?? "")) err(`${at}.time`, "a time, HH:MM");
    if (s.minutes !== undefined && (!Number.isInteger(s.minutes) || s.minutes < 10 || s.minutes > 240)) err(`${at}.minutes`, "how long it runs, 10–240 minutes");
    if (!["TikTok", "Instagram"].includes(s.where)) err(`${at}.where`, '"TikTok" or "Instagram"');
    text(err, `${at}.what`, s.what, 80);
  });
  if (obj(err, "live.links", l.links, "{ tiktok?, instagram? }")) {
    onlyKeys(l.links, ["tiktok", "instagram"], "live.links", err);
    if (l.links.tiktok !== undefined && !/^https:\/\/(www\.)?tiktok\.com\/@[\w.]+\/?$/.test(l.links.tiktok)) err("live.links.tiktok", "the florist's TikTok profile, https://www.tiktok.com/@…");
    if (l.links.instagram !== undefined && !/^https:\/\/(www\.)?instagram\.com\/[\w.]+\/?$/.test(l.links.instagram)) err("live.links.instagram", "the florist's Instagram profile, https://www.instagram.com/…");
    for (const s of l.sessions ?? []) if (s.where === "TikTok" && !l.links.tiktok) err("live.links.tiktok", "a session is on TikTok: add the profile link");
    for (const s of l.sessions ?? []) if (s.where === "Instagram" && !l.links.instagram) err("live.links.instagram", "a session is on Instagram: add the profile link");
  }
}

/** The weekly drop. @param {any} d @param {string} mode @param {Report} err @param {Exists} exists */
function checkDrop(d, mode, err, exists) {
  if (!obj(err, "drop", d, "{ name, intro, when, made, items, … }")) return;
  onlyKeys(d, ["name", "intro", "when", "made", "left", "staleMinutes", "items", "how"], "drop", err);
  text(err, "drop.name", d.name, 40);
  text(err, "drop.intro", d.intro, 200);
  if (obj(err, "drop.when", d.when, '{ "day": "fri", "time": "19:00", "hours": 48 }')) {
    onlyKeys(d.when, ["day", "time", "hours"], "drop.when", err);
    if (!DAY_KEYS_LIST.includes(d.when.day)) err("drop.when.day", `one of ${DAY_KEYS_LIST.join(", ")}`);
    if (!HHMM.test(d.when.time ?? "")) err("drop.when.time", "a time, HH:MM");
    if (!Number.isInteger(d.when.hours) || d.when.hours < 1 || d.when.hours > 144) err("drop.when.hours", "how long it stays open, 1–144 hours");
  }
  if (!Number.isInteger(d.made) || d.made < 1 || d.made > 500) err("drop.made", "how many the florist makes, 1–500");
  // A count written in the site would go stale on a real florist's site: clients read it from their Sheet only.
  if (d.left !== undefined) {
    if (mode !== "demo") err("drop.left", "a client site reads what's left from the florist's Sheet (drop,left,…), never a number written here");
    else if (!Number.isInteger(d.left) || d.left < 0 || d.left > d.made) err("drop.left", "0 up to what was made");
  }
  if (d.staleMinutes !== undefined && (!Number.isInteger(d.staleMinutes) || d.staleMinutes < 2 || d.staleMinutes > 120)) err("drop.staleMinutes", "after how many minutes an un-updated count stops showing, 2–120");
  if (list(err, "drop.items", d.items) && d.items.length > 4) err("drop.items", "at most four bouquets in a drop");
  (d.items ?? []).forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `drop.items[${i}]`;
    onlyKeys(x, ["name", "price", "photo", "line"], at, err);
    text(err, `${at}.name`, x.name, 40); price(err, `${at}.price`, x.price); photo(err, `${at}.photo`, x.photo, exists);
    if (x.line !== undefined) text(err, `${at}.line`, x.line, 100);
  });
  if (d.how !== undefined) qaList(err, "drop.how", d.how);
}
