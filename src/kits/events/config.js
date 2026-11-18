// @ts-check
/**
 * Validation for the events kit (event designers and producers). Every room, date, venue, visual and milestone is the
 * agency's own; these checks keep them whole and honest: a design visual is never also shown as a past event, the
 * venue directory names a partner only when the agency says so, sheets are published CSV, and a client never
 * carries the demo's simulated dates or proposals.
 */
import { realDate, LAYOUTS } from "./lib/events.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @typedef {((rel: string) => boolean)|undefined} Exists */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const ID = /^[a-z0-9-]{1,40}$/;
const OCCASIONS = ["wedding", "corporate", "private", "launch", "other"];
const SHEET = /^https:\/\/docs\.google\.com\/spreadsheets\/[^\s]+output=csv[^\s]*$/;
// Pages the kit builds by name: an occasion can't take one of these as its id (its page would overwrite it).
const RESERVED = ["index", "rooms", "start", "journal", "run-of-the-night", "case-studies", "venues", "your-room", "your-proposal", "visit", "privacy", "404"];

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
/** @param {Report} err @param {string} path @param {any} v */
function paragraphs(err, path, v) {
  if (!Array.isArray(v) || !v.length || !v.every(isStr)) err(path, "one or more paragraphs of the agency's own words");
}
/** A live-data setting: the agency's sheet, or a simulation on a demo. @param {any} site @param {string} key @param {Report} err @param {string[]} extra */
function source(site, key, err, extra) {
  const t = site[key];
  if (!isObj(t)) { err(key, '{ source: "sheet", csvUrl, staleAfterDays? }'); return false; }
  onlyKeys(t, ["source", "csvUrl", "staleAfterDays", "example", ...extra], key, err);
  if (t.source === "simulated") {
    if (site.mode !== "demo") err(`${key}.source`, 'only a demo may simulate; a client reads its own sheet ("sheet")');
  } else if (t.source === "sheet") {
    if (!SHEET.test(t.csvUrl ?? "")) err(`${key}.csvUrl`, "the sheet published as CSV (File → Share → Publish to web → CSV)");
    if (t.example !== undefined) err(`${key}.example`, "demo only");
  } else err(`${key}.source`, '"sheet" (or "simulated" on a demo)');
  return true;
}

/** @param {any} site @param {Report} err @param {Exists} [exists] */
export function checkEvents(site, err, exists) {
  if (site.kit !== "events") return;
  const features = /** @type {string[]} */ (Array.isArray(site.features) ? site.features : []);
  const on = (/** @type {string} */ id) => features.includes(id);
  const rooms = checkRooms(site.rooms, err, exists);
  if (site.dates !== undefined) checkDates(site, err);
  if (site.occasions !== undefined) checkOccasions(site.occasions, err, exists);
  if (site.brief !== undefined) checkBrief(site.brief, err);
  if (site.keyDates !== undefined) checkKeyDates(site.keyDates, err);
  if (site.journal !== undefined) checkJournal(site.journal, err);
  const sets = site.visuals !== undefined ? checkVisuals(site.visuals, err, exists) : [];
  if (site.layTable !== undefined) checkLay(site.layTable, err, exists);
  if (site.runOfShow !== undefined) checkRun(site.runOfShow, err);
  const cases = site.cases !== undefined ? checkCases(site.cases, err, exists) : [];
  if (site.venues !== undefined) checkVenues(site.venues, err);
  const planRooms = site.roomPlan !== undefined ? checkRoomPlan(site.roomPlan, err) : [];
  if (site.proposal !== undefined && source(site, "proposal", err, ["intro"])) {
    const p = site.proposal;
    if (p.source === "simulated" && !/^[A-Z0-9]{6,12}$/.test(p.example ?? "")) err("proposal.example", "the demo's sample code, 6 to 12 capitals and numbers");
    if (p.staleAfterDays !== undefined && (!Number.isInteger(p.staleAfterDays) || p.staleAfterDays < 1 || p.staleAfterDays > 120)) err("proposal.staleAfterDays", "after how many days without an update the page asks them to call, 1 to 120");
    if (p.intro !== undefined) text(err, "proposal.intro", p.intro);
  }
  if (on("events-proposal") && on("events-room-plan") && !planRooms.length) err("roomPlan.rooms", "the proposal draws the room from this list");
  // A design visual is a proposal, never a past event: no visual may also be one of the rooms or a case study.
  const visualSrcs = new Set([
    ...(site.visuals?.sets ?? []).flatMap((/** @type {any} */ s) => (s.views ?? []).map((/** @type {any} */ v) => v?.photo?.src)),
    ...(site.layTable?.dressings ?? []).map((/** @type {any} */ d) => d?.photo?.src),
  ].filter(Boolean));
  rooms.forEach((r, i) => { if (visualSrcs.has(r?.photo?.src)) err(`rooms.items[${i}].photo.src`, "a design visual can't be shown as a past room; use a photograph of an event the agency produced"); });
  cases.forEach((c, i) => (c?.photos ?? []).forEach((/** @type {any} */ p, /** @type {number} */ k) => { if (visualSrcs.has(p?.src)) err(`cases.items[${i}].photos[${k}].src`, "a design visual can't be shown in a case study of a past event"); }));
  if (site.look === "doors" && site.hero !== undefined) {
    onlyKeys(site.hero, ["kicker", "title", "intro", "photo", "credit"], "hero", err);
    photo(err, "hero.photo", site.hero.photo, exists);
  }
}

/** @param {any} R @param {Report} err @param {Exists} exists @returns {any[]} */
function checkRooms(R, err, exists) {
  if (R === undefined) return [];
  if (!isObj(R)) { err("rooms", "{ items }"); return []; }
  onlyKeys(R, ["items"], "rooms", err);
  const items = list(err, "rooms.items", R.items, "room: { id, name, occasion, guests, where, photo }") ? R.items : [];
  ids(err, "rooms.items", items);
  items.forEach((/** @type {any} */ r, /** @type {number} */ i) => {
    const at = `rooms.items[${i}]`;
    onlyKeys(r, ["id", "name", "occasion", "guests", "where", "line", "photo"], at, err);
    text(err, `${at}.name`, r?.name);
    text(err, `${at}.where`, r?.where);
    if (r?.line !== undefined) text(err, `${at}.line`, r.line);
    if (!OCCASIONS.includes(r?.occasion)) err(`${at}.occasion`, OCCASIONS.join(", "));
    if (!Number.isInteger(r?.guests) || r.guests < 2 || r.guests > 3000) err(`${at}.guests`, "how many guests the room held, a whole number");
    photo(err, `${at}.photo`, r?.photo, exists);
  });
  return items;
}

/** @param {any} site @param {Report} err */
function checkDates(site, err) {
  if (!source(site, "dates", err, ["days", "leadDays", "intro"])) return;
  const d = site.dates;
  if (d.days !== undefined && (!Array.isArray(d.days) || !d.days.length || !d.days.every((/** @type {any} */ x) => ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].includes(x)))) err("dates.days", 'the days "next free" looks for, e.g. ["sat"] or ["fri", "sat"]');
  if (d.leadDays !== undefined && (!Number.isInteger(d.leadDays) || d.leadDays < 0 || d.leadDays > 365)) err("dates.leadDays", "how many days ahead the next free day can be, 0 to 365");
  if (d.staleAfterDays !== undefined && (!Number.isInteger(d.staleAfterDays) || d.staleAfterDays < 1 || d.staleAfterDays > 60)) err("dates.staleAfterDays", "after how many days without an update the check asks them to message, 1 to 60");
  if (d.intro !== undefined) text(err, "dates.intro", d.intro);
}

/** @param {any} O @param {Report} err @param {Exists} exists */
function checkOccasions(O, err, exists) {
  if (!isObj(O)) { err("occasions", "{ items }"); return; }
  onlyKeys(O, ["items"], "occasions", err);
  const items = list(err, "occasions.items", O.items, "occasion: { id, title, intro, body, photo }") ? O.items : [];
  ids(err, "occasions.items", items);
  items.forEach((/** @type {any} */ o, /** @type {number} */ i) => {
    const at = `occasions.items[${i}]`;
    onlyKeys(o, ["id", "title", "nav", "menu", "intro", "body", "photo", "rooms"], at, err);
    if (o?.menu !== undefined && typeof o.menu !== "boolean") err(`${at}.menu`, "true to list it in the header menu");
    if (RESERVED.includes(o?.id) || /^(article|case|journal|occasion)-/.test(o?.id ?? "")) err(`${at}.id`, `"${o.id}" is the name of another page; choose another`);
    text(err, `${at}.title`, o?.title);
    text(err, `${at}.intro`, o?.intro);
    if (o?.nav !== undefined) text(err, `${at}.nav`, o.nav);
    paragraphs(err, `${at}.body`, o?.body);
    photo(err, `${at}.photo`, o?.photo, exists);
    if (o?.rooms !== undefined && !OCCASIONS.includes(o.rooms)) err(`${at}.rooms`, `which rooms to show beneath: ${OCCASIONS.join(", ")}`);
  });
}

/** @param {any} b @param {Report} err */
function checkBrief(b, err) {
  if (!page(err, "brief", b, ["types", "budgets", "email", "venueChoices"])) return;
  if (!Array.isArray(b.types) || b.types.length < 2 || !b.types.every(isStr)) err("brief.types", "the occasions to choose from, at least two");
  if (b.budgets !== undefined && (!Array.isArray(b.budgets) || !b.budgets.every(isStr))) err("brief.budgets", "the agency's own budget bands, as they word them (leave out to not ask)");
  if (b.venueChoices !== undefined && (!Array.isArray(b.venueChoices) || b.venueChoices.length < 2 || !b.venueChoices.every(isStr))) err("brief.venueChoices", "the venue answers to choose from");
  if (b.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) err("brief.email", "the address briefs go to by email (leave out for the site's contact email)");
}

/** @param {any} k @param {Report} err */
function checkKeyDates(k, err) {
  if (!isObj(k)) { err("keyDates", "{ items: [{ label, weeksBefore }] }"); return; }
  onlyKeys(k, ["items", "intro"], "keyDates", err);
  if (k.intro !== undefined) text(err, "keyDates.intro", k.intro);
  if (list(err, "keyDates.items", k.items, "milestone: { label, weeksBefore }")) k.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    onlyKeys(x, ["label", "weeksBefore"], `keyDates.items[${i}]`, err);
    text(err, `keyDates.items[${i}].label`, x?.label);
    if (!Number.isInteger(x?.weeksBefore) || x.weeksBefore < 0 || x.weeksBefore > 104) err(`keyDates.items[${i}].weeksBefore`, "how many weeks before the event, 0 to 104");
  });
}

/** @param {any} J @param {Report} err */
function checkJournal(J, err) {
  if (!page(err, "journal", J, ["items"])) return;
  const items = list(err, "journal.items", J.items, "article: { id, title, date, intro, body }") ? J.items : [];
  ids(err, "journal.items", items);
  items.forEach((/** @type {any} */ a, /** @type {number} */ i) => {
    const at = `journal.items[${i}]`;
    onlyKeys(a, ["id", "title", "date", "intro", "body"], at, err);
    text(err, `${at}.title`, a?.title);
    text(err, `${at}.intro`, a?.intro);
    if (!realDate(a?.date)) err(`${at}.date`, "the date it was written, YYYY-MM-DD");
    paragraphs(err, `${at}.body`, a?.body);
  });
}

/** @param {any} V @param {Report} err @param {Exists} exists @returns {string[]} */
function checkVisuals(V, err, exists) {
  if (!isObj(V)) { err("visuals", "{ home, sets: [{ id, title, line, views }] }"); return []; }
  onlyKeys(V, ["home", "sets", "credit"], "visuals", err);
  const sets = list(err, "visuals.sets", V.sets, "set of design visuals: { id, title, line, views }") ? V.sets : [];
  ids(err, "visuals.sets", sets);
  sets.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    const at = `visuals.sets[${i}]`;
    onlyKeys(s, ["id", "title", "line", "views"], at, err);
    text(err, `${at}.title`, s?.title);
    text(err, `${at}.line`, s?.line);
    if (!Array.isArray(s?.views) || s.views.length < 1 || s.views.length > 4) err(`${at}.views`, "one to four views: { label, photo }");
    else s.views.forEach((/** @type {any} */ v, /** @type {number} */ k) => {
      onlyKeys(v, ["label", "photo"], `${at}.views[${k}]`, err);
      text(err, `${at}.views[${k}].label`, v?.label);
      photo(err, `${at}.views[${k}].photo`, v?.photo, exists);
    });
  });
  const setIds = sets.map((/** @type {any} */ s) => s?.id);
  if (!setIds.includes(V.home)) err("visuals.home", "the id of the set the home page shows");
  if (V.credit !== undefined) text(err, "visuals.credit", V.credit);
  return setIds;
}

/** @param {any} T @param {Report} err @param {Exists} exists */
function checkLay(T, err, exists) {
  if (!isObj(T)) { err("layTable", "{ dressings: [three of { label, line, photo }] }"); return; }
  onlyKeys(T, ["dressings"], "layTable", err);
  if (!Array.isArray(T.dressings) || T.dressings.length !== 3) { err("layTable.dressings", "exactly three dressings of one table, from one camera"); return; }
  T.dressings.forEach((/** @type {any} */ d, /** @type {number} */ i) => {
    onlyKeys(d, ["label", "line", "photo"], `layTable.dressings[${i}]`, err);
    text(err, `layTable.dressings[${i}].label`, d?.label);
    text(err, `layTable.dressings[${i}].line`, d?.line);
    photo(err, `layTable.dressings[${i}].photo`, d?.photo, exists);
  });
  const sizes = new Set(T.dressings.map((/** @type {any} */ d) => `${d?.photo?.width}x${d?.photo?.height}`));
  if (sizes.size > 1) err("layTable.dressings", "the three views come from one camera, so they share one size");
}

/** @param {any} R @param {Report} err */
function checkRun(R, err) {
  if (!page(err, "runOfShow", R, ["items", "note"])) return;
  if (R.note !== undefined) text(err, "runOfShow.note", R.note);
  if (list(err, "runOfShow.items", R.items, "line: { time, what }")) R.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    onlyKeys(x, ["time", "what", "detail"], `runOfShow.items[${i}]`, err);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(x?.time ?? "")) err(`runOfShow.items[${i}].time`, "a time, HH:MM");
    text(err, `runOfShow.items[${i}].what`, x?.what);
    if (x?.detail !== undefined) text(err, `runOfShow.items[${i}].detail`, x.detail);
  });
}

/** @param {any} C @param {Report} err @param {Exists} exists @returns {any[]} */
function checkCases(C, err, exists) {
  if (!page(err, "cases", C, ["items"])) return [];
  const items = list(err, "cases.items", C.items, "case study: { id, title, occasion, guests, brief, room, mood, photos }") ? C.items : [];
  ids(err, "cases.items", items);
  items.forEach((/** @type {any} */ c, /** @type {number} */ i) => {
    const at = `cases.items[${i}]`;
    onlyKeys(c, ["id", "title", "occasion", "guests", "when", "line", "brief", "room", "mood", "photos"], at, err);
    for (const k of ["title", "line", "brief", "room", "mood", "when"]) text(err, `${at}.${k}`, c?.[k]);
    if (!OCCASIONS.includes(c?.occasion)) err(`${at}.occasion`, OCCASIONS.join(", "));
    if (!Number.isInteger(c?.guests) || c.guests < 2) err(`${at}.guests`, "how many guests, a whole number");
    if (list(err, `${at}.photos`, c?.photos, "photograph of that event")) c.photos.forEach((/** @type {any} */ p, /** @type {number} */ k) => photo(err, `${at}.photos[${k}]`, p, exists));
  });
  return items;
}

/** @param {any} V @param {Report} err */
function checkVenues(V, err) {
  if (!page(err, "venues", V, ["items", "note"])) return;
  if (V.note !== undefined) text(err, "venues.note", V.note);
  if (list(err, "venues.items", V.items, "venue: { name, area, kind }")) V.items.forEach((/** @type {any} */ v, /** @type {number} */ i) => {
    const at = `venues.items[${i}]`;
    onlyKeys(v, ["name", "area", "kind", "seated", "standing", "line", "partner", "url"], at, err);
    for (const k of ["name", "area", "kind"]) text(err, `${at}.${k}`, v?.[k]);
    if (v?.line !== undefined) text(err, `${at}.line`, v.line);
    for (const k of ["seated", "standing"]) if (v?.[k] !== undefined && (!Number.isInteger(v[k]) || v[k] < 1)) err(`${at}.${k}`, "as the venue gives it, a whole number");
    if (v?.partner !== undefined && v.partner !== true) err(`${at}.partner`, "true only when the agency has an agreement with the venue (leave out otherwise)");
    if (v?.url !== undefined && !/^https:\/\/[^\s]+$/.test(v.url)) err(`${at}.url`, "the venue's own website (https)");
  });
}

/** @param {any} P @param {Report} err @returns {string[]} */
function checkRoomPlan(P, err) {
  if (!page(err, "roomPlan", P, ["rooms", "start"])) return [];
  const rooms = list(err, "roomPlan.rooms", P.rooms, "room: { id, name, length, width }") ? P.rooms : [];
  ids(err, "roomPlan.rooms", rooms);
  rooms.forEach((/** @type {any} */ r, /** @type {number} */ i) => {
    const at = `roomPlan.rooms[${i}]`;
    onlyKeys(r, ["id", "name", "length", "width", "note"], at, err);
    text(err, `${at}.name`, r?.name);
    if (r?.note !== undefined) text(err, `${at}.note`, r.note);
    for (const k of ["length", "width"]) if (typeof r?.[k] !== "number" || r[k] < 4 || r[k] > 120) err(`${at}.${k}`, "metres, from the venue's plan");
    if (r?.length < r?.width) err(`${at}.length`, "the longer side (length ≥ width)");
  });
  const s = P.start;
  if (s !== undefined) {
    onlyKeys(s, ["room", "guests", "layout"], "roomPlan.start", err);
    if (!rooms.some((/** @type {any} */ r) => r?.id === s.room)) err("roomPlan.start.room", "the id of a room in roomPlan.rooms");
    if (!Number.isInteger(s.guests) || s.guests < 10 || s.guests > 1000) err("roomPlan.start.guests", "10 to 1000");
    if (!(s.layout in LAYOUTS)) err("roomPlan.start.layout", Object.keys(LAYOUTS).join(", "));
  }
  return rooms.map((/** @type {any} */ r) => r?.id);
}
