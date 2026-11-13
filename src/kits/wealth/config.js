// @ts-check
/**
 * Validation for the wealth kit (private wealth managers). The FCA's rules decide what must be there and what must never
 * be: the firm's FCA status and reference number, capital-at-risk wording where it is promoted, a clear line on what the
 * FCA doesn't regulate (COBS 4.2.4(4)), and no performance figures, return promises or calculators anywhere. Every fact
 * (fees, people, numbers, offices) is the firm's own; a demo can never carry a real firm's or adviser's number.
 */
import { isFrn, isIrn, isDemoNumber, promises } from "./lib/fca.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const ID = /^[a-z0-9-]{1,40}$/;
const YMD = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+\d[\d ]{7,17}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
/** Pages the kit builds; a moment's page can't take one of these names. */
const RESERVED = ["index", "regulatory", "check", "insights", "approach", "people", "meeting", "offices", "family", "life", "visit", "privacy", "404", "events", "documents", "letter-of-wishes", "adviser", "about"];

/** @param {Report} err @param {string} path @param {any} v */
const text = (err, path, v) => { if (!isStr(v)) err(path, "required text is missing"); };

/** A misspelt setting is refused, not silently ignored. @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (isObj(o)) for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}

/** @param {Report} err @param {string} path @param {any} list @param {string} what @returns {any[]} */
function list(err, path, list, what) {
  if (!Array.isArray(list) || !list.length) { err(path, `at least one ${what}`); return []; }
  return list;
}

/** @param {Report} err @param {string} path @param {any} v */
function lines(err, path, v) {
  list(err, path, v, "line").forEach((x, i) => text(err, `${path}[${i}]`, x));
}

/** @param {Report} err @param {string} path @param {any} p @param {((rel: string) => boolean)|undefined} exists */
function photo(err, path, p, exists) {
  if (!isObj(p)) { err(path, "a photo: { src, width, height, alt }"); return; }
  onlyKeys(p, ["src", "width", "height", "alt", "position"], path, err);
  text(err, `${path}.alt`, p.alt);
  if (!Number.isInteger(p.width) || !Number.isInteger(p.height)) err(path, "width and height in pixels");
  if (p.position !== undefined && !/^\d{1,3}% \d{1,3}%$/.test(p.position)) err(`${path}.position`, 'the crop\'s focus, e.g. "50% 40%"');
  if (!isStr(p.src)) err(`${path}.src`, "required");
  else if (exists && !exists(p.src)) err(`${path}.src`, `file not found: ${p.src}`);
}

/** @param {Report} err @param {string} path @param {any[]} items @returns {Set<string>} */
function ids(err, path, items) {
  const seen = new Set();
  items.forEach((x, i) => {
    if (!ID.test(x?.id ?? "")) err(`${path}[${i}].id`, "lowercase letters, numbers and dashes");
    else if (seen.has(x.id)) err(`${path}[${i}].id`, `"${x.id}" is used twice`);
    seen.add(x?.id);
  });
  return seen;
}

/** A demo shows noughts so no real firm or adviser is named; a client shows its real number. @param {any} v @param {string} path @param {string} mode @param {Report} err @param {"frn"|"irn"} kind */
function fcaNumber(v, path, mode, err, kind) {
  const ok = kind === "frn" ? isFrn(v) : isIrn(v);
  if (!ok) err(path, kind === "frn" ? "the firm reference number as the FCA register shows it: six or seven digits" : "the individual reference number as the FCA register shows it: three capital letters and five digits, e.g. ABC01234");
  else if (mode === "demo" && !isDemoNumber(v)) err(path, `demo sites are fictional: use ${kind === "frn" ? "000000" : "a number ending 00000"} so no real firm or person is named`);
  else if (mode === "client" && isDemoNumber(v)) err(path, "is a demo number; client sites need the real one from the FCA register");
}

/** Every string in the kit's settings, with where it is. @param {any} v @param {string} at @param {[string, string][]} out */
function strings(v, at, out) {
  if (typeof v === "string") out.push([at, v]);
  else if (Array.isArray(v)) v.forEach((x, i) => strings(x, `${at}[${i}]`, out));
  else if (isObj(v)) for (const [k, x] of Object.entries(v)) if (k !== "sample") strings(x, `${at}.${k}`, out);
  return out;
}

/** @param {any} site @param {Report} err @param {((rel: string) => boolean)|undefined} [exists] */
export function checkWealth(site, err, exists) {
  if (site.kit !== "wealth") return;
  const on = (/** @type {string} */ id) => Array.isArray(site.features) && site.features.includes(id);
  if (!on("fca")) err("features", '"fca" is required on every wealth manager\'s site: its FCA status and reference number');
  if (!on("check")) err("features", '"check" is required on every wealth manager\'s site: how clients can tell a real call or email from a fraud');
  checkHero(site.hero, err, exists);
  if (site.regulation !== undefined) checkRegulation(site.regulation, site.mode, err);
  if (site.check !== undefined) checkCheck(site.check, err);
  const events = site.lifeEvents !== undefined ? checkLifeEvents(site.lifeEvents, err, exists) : new Set();
  if (site.situations !== undefined) checkSituations(site.situations, events, err);
  if (site.help !== undefined) checkServices(site.help, events, err, exists);
  if (site.advisers !== undefined) checkPeople(site.advisers, events, site.mode, err, exists);
  if (site.offices !== undefined) checkOffices(site.offices, err, exists);
  const insightIds = site.insights !== undefined ? checkInsights(site.insights, site.mode, err, exists) : new Set();
  if (site.lifeEvents !== undefined) site.lifeEvents.items?.forEach((/** @type {any} */ e, /** @type {number} */ i) => (e?.insights ?? []).forEach((/** @type {string} */ id, /** @type {number} */ j) => {
    if (!insightIds.has(id)) err(`lifeEvents.items[${i}].insights[${j}]`, `"${id}" isn't one of the insights in insights.items`);
  }));
  if (site.approach !== undefined) checkApproach(site.approach, err);
  if (site.events !== undefined) checkEvents(site.events, site.mode, err);
  if (site.documents !== undefined) { onlyKeys(site.documents, ["title", "intro"], "documents", err); text(err, "documents.title", site.documents?.title); text(err, "documents.intro", site.documents?.intro); }
  if (site.features?.includes("documents") && !(site.lifeEvents?.items ?? []).some((/** @type {any} */ e) => Array.isArray(e?.documents))) err("lifeEvents", '"documents" needs at least one moment with a documents list');
  if (site.wishesGuide !== undefined) { onlyKeys(site.wishesGuide, ["title", "intro"], "wishesGuide", err); text(err, "wishesGuide.title", site.wishesGuide?.title); text(err, "wishesGuide.intro", site.wishesGuide?.intro); }
  if (site.meeting !== undefined) checkMeeting(site.meeting, err);
  if (site.bring !== undefined) { onlyKeys(site.bring, ["title", "items"], "bring", err); text(err, "bring.title", site.bring?.title); lines(err, "bring.items", site.bring?.items); }
  if (site.familyMap !== undefined) { onlyKeys(site.familyMap, ["title", "intro"], "familyMap", err); text(err, "familyMap.title", site.familyMap?.title); text(err, "familyMap.intro", site.familyMap?.intro); }
  if (site.features?.includes("adviser-pages")) (site.advisers?.items ?? []).forEach((/** @type {any} */ x, /** @type {number} */ i) => { if (x?.photo === undefined) err(`advisers.items[${i}].photo`, "each adviser's page is built around a photo (a portrait, or at a distance)"); });
  if (site.features?.includes("adviser-pages")) for (const x of site.advisers?.items ?? []) if (RESERVED.includes(x?.id) || events.has(x?.id) || (site.pages ?? []).some((/** @type {any} */ p) => p?.slug === x?.id)) err("advisers", `"${x.id}" is the name of another page; give that adviser another id`);
  for (const id of events) if (RESERVED.includes(id) || (site.pages ?? []).some((/** @type {any} */ p) => p?.slug === id)) err("lifeEvents", `"${id}" is the name of another page; give that moment another id`);
  // COBS 4.2: a promotion can't promise returns or performance. Nothing the firm writes anywhere in its settings may
  // (About and other pages, answers, its description, Plan your visit, messages); only the demo's sample sheets are
  // skipped here, because their rows are checked one by one as they're read and held back on purpose.
  for (const [at, v] of strings(site, "", [])) {
    if (promises(v)) err(at.replace(/^\./, ""), "promises a return or performance; FCA rules (COBS 4.2) don't allow that on the site");
  }
}

/** The hero: a short headline, the plain line of what the firm does, one wide photograph. @param {any} h @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkHero(h, err, exists) {
  if (!isObj(h)) { err("hero", "required: { kicker, title, intro, photo }"); return; }
  onlyKeys(h, ["kicker", "title", "intro", "photo", "photoTall"], "hero", err);
  for (const k of ["kicker", "title", "intro"]) text(err, `hero.${k}`, h[k]);
  if (isStr(h.title) && h.title.replace(/\|/g, " ").trim().split(/\s+/).length > 8) err("hero.title", "eight words at most; say what the firm does in hero.intro");
  photo(err, "hero.photo", h.photo, exists);
  if (h.photoTall !== undefined) photo(err, "hero.photoTall", h.photoTall, exists);
}

/** @param {any} r @param {string} mode @param {Report} err */
function checkRegulation(r, mode, err) {
  if (!isObj(r)) { err("regulation", "an object; see src/kits/wealth/features/fca/README.md"); return; }
  onlyKeys(r, ["legalName", "frn", "entity", "office", "unregulated", "capitalAtRisk", "fscs", "complaints"], "regulation", err);
  for (const k of ["legalName", "entity", "unregulated"]) text(err, `regulation.${k}`, r[k]);
  fcaNumber(r.frn, "regulation.frn", mode, err, "frn");
  if (r.capitalAtRisk !== undefined && !/capital is at risk|may get back less/i.test(r.capitalAtRisk)) err("regulation.capitalAtRisk", "must still say plainly that capital is at risk (COBS 4.2.4G)");
  if (r.fscs !== undefined) text(err, "regulation.fscs", r.fscs);
  if (r.office !== undefined) text(err, "regulation.office", r.office);
  if (!isObj(r.complaints)) err("regulation.complaints", "how to complain to the firm: { email, address, steps }");
  else {
    onlyKeys(r.complaints, ["email", "address", "steps"], "regulation.complaints", err);
    if (!EMAIL.test(r.complaints.email ?? "")) err("regulation.complaints.email", "the address complaints go to");
    text(err, "regulation.complaints.address", r.complaints.address);
    lines(err, "regulation.complaints.steps", r.complaints.steps);
  }
}

/** "Is this really us?" @param {any} c @param {Report} err */
function checkCheck(c, err) {
  if (!isObj(c)) { err("check", "an object: { title, intro, phones, domains, never, callback }"); return; }
  onlyKeys(c, ["title", "intro", "phones", "domains", "never", "callback"], "check", err);
  for (const k of ["title", "intro", "callback"]) text(err, `check.${k}`, c[k]);
  list(err, "check.phones", c.phones, "phone number").forEach((p, i) => {
    onlyKeys(p, ["label", "number"], `check.phones[${i}]`, err);
    text(err, `check.phones[${i}].label`, p?.label);
    if (!PHONE.test(p?.number ?? "")) err(`check.phones[${i}].number`, 'international format, e.g. "+44 20 7946 0000"');
  });
  list(err, "check.domains", c.domains, "domain").forEach((d, i) => { if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(d ?? "")) err(`check.domains[${i}]`, "a domain, e.g. lyallharrow.co.uk"); });
  lines(err, "check.never", c.never);
}

/** @param {any} s @param {Set<string>} events @param {Report} err */
function checkSituations(s, events, err) {
  if (!isObj(s)) { err("situations", "an object: { items, places }"); return; }
  onlyKeys(s, ["items", "places", "line", "next"], "situations", err);
  for (const k of ["line", "next"]) text(err, `situations.${k}`, s[k]);
  const items = list(err, "situations.items", s.items, "situation");
  ids(err, "situations.items", items);
  items.forEach((x, i) => {
    onlyKeys(x, ["id", "label", "line", "next", "event"], `situations.items[${i}]`, err);
    for (const k of ["label", "line", "next"]) text(err, `situations.items[${i}].${k}`, x?.[k]);
    if (isStr(x?.label) && x.label[0] !== x.label[0].toLowerCase()) err(`situations.items[${i}].label`, 'starts in lower case: it completes the sentence "I am …"');
    if (x?.event !== undefined && events.size && !events.has(x.event)) err(`situations.items[${i}].event`, `"${x.event}" isn't one of the moments in lifeEvents.items`);
  });
  const places = list(err, "situations.places", s.places, "place");
  ids(err, "situations.places", places);
  places.forEach((p, i) => { onlyKeys(p, ["id", "label", "meet"], `situations.places[${i}]`, err); text(err, `situations.places[${i}].label`, p?.label); text(err, `situations.places[${i}].meet`, p?.meet); });
}

/** @param {any} s @param {Set<string>} events @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkServices(s, events, err, exists) {
  if (!isObj(s)) { err("help", "an object: { items, audience, minimum }"); return; }
  onlyKeys(s, ["items", "audience", "minimum"], "help", err);
  if (s.audience !== undefined) text(err, "help.audience", s.audience);
  if (s.minimum !== undefined) text(err, "help.minimum", s.minimum);
  const items = list(err, "help.items", s.items, "service");
  ids(err, "help.items", items);
  if (items.length > 4) err("help.items", "four at most, so the columns stay calm");
  items.forEach((x, i) => {
    const at = `help.items[${i}]`;
    onlyKeys(x, ["id", "title", "line", "photo", "event", "navLabel"], at, err);
    for (const k of ["title", "line"]) text(err, `${at}.${k}`, x?.[k]);
    photo(err, `${at}.photo`, x?.photo, exists);
    if (x?.event !== undefined && events.size && !events.has(x.event)) err(`${at}.event`, `"${x.event}" isn't one of the moments in lifeEvents.items`);
  });
}

/** @param {any} p @param {Set<string>} events @param {string} mode @param {Report} err */
function checkPeople(p, events, mode, err, exists) {
  if (!isObj(p)) { err("advisers", "an object: { items }"); return; }
  onlyKeys(p, ["items"], "advisers", err);
  const items = list(err, "advisers.items", p.items, "person");
  ids(err, "advisers.items", items);
  items.forEach((x, i) => {
    const at = `advisers.items[${i}]`;
    onlyKeys(x, ["id", "name", "role", "irn", "leads", "note", "phone", "email", "photo", "book"], at, err);
    for (const k of ["name", "role"]) text(err, `${at}.${k}`, x?.[k]);
    if (x?.irn !== undefined) fcaNumber(x.irn, `${at}.irn`, mode, err, "irn");
    if (x?.phone !== undefined && !PHONE.test(x.phone)) err(`${at}.phone`, 'international format, e.g. "+44 20 7946 0000"');
    if (x?.email !== undefined && !EMAIL.test(x.email)) err(`${at}.email`, "not a valid email address");
    if (x?.photo !== undefined) photo(err, `${at}.photo`, x.photo, exists);
    if (x?.book !== undefined && !/^https:\/\/[^\s]+$/.test(x.book)) err(`${at}.book`, "the adviser's own booking page, an https link");
    (x?.leads ?? []).forEach((/** @type {string} */ e, /** @type {number} */ j) => { if (events.size && !events.has(e)) err(`${at}.leads[${j}]`, `"${e}" isn't one of the moments in lifeEvents.items`); });
  });
}

/** The first office is the one in site.location and site.hours; any others carry their own. @param {any} o @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkOffices(o, err, exists) {
  if (!isObj(o)) { err("offices", "an object: { items }"); return; }
  onlyKeys(o, ["items"], "offices", err);
  const items = list(err, "offices.items", o.items, "office");
  ids(err, "offices.items", items);
  items.forEach((x, i) => {
    const at = `offices.items[${i}]`;
    const own = ["streetAddress", "locality", "postcode", "country", "timezone", "weekly"];
    onlyKeys(x, ["id", "name", "facts", "photo", "arrival", ...(i ? own : [])], at, err);
    text(err, `${at}.name`, x?.name);
    list(err, `${at}.facts`, x?.facts, "fact").forEach((f, j) => { onlyKeys(f, ["label", "text"], `${at}.facts[${j}]`, err); text(err, `${at}.facts[${j}].label`, f?.label); text(err, `${at}.facts[${j}].text`, f?.text); });
    if (x?.photo !== undefined) photo(err, `${at}.photo`, x.photo, exists);
    if (x?.arrival !== undefined) lines(err, `${at}.arrival`, x.arrival);
    if (!i) return;
    for (const k of ["streetAddress", "locality", "country"]) text(err, `${at}.${k}`, x?.[k]);
    try { new Intl.DateTimeFormat("en-GB", { timeZone: x?.timezone }); if (!isStr(x?.timezone)) throw new Error(); } catch { err(`${at}.timezone`, 'an IANA time zone, e.g. "Europe/Zurich"'); }
    if (!isObj(x?.weekly)) err(`${at}.weekly`, 'opening hours by day, like site.hours.weekly: { "mon": [["08:30","18:00"]], … }');
    else for (const d of DAYS) {
      const r = x.weekly[d];
      if (!Array.isArray(r) || r.some((/** @type {any} */ x) => !Array.isArray(x) || x.length !== 2 || !TIME.test(x[0]) || !TIME.test(x[1]))) err(`${at}.weekly.${d}`, 'a list of ["HH:MM","HH:MM"] ranges, or [] when closed');
    }
  });
}

/** @param {any} n @param {string} mode @param {Report} err @param {((rel: string) => boolean)|undefined} exists @returns {Set<string>} */
function checkInsights(n, mode, err, exists) {
  if (!isObj(n)) { err("insights", "an object; see src/kits/wealth/features/insights/README.md"); return new Set(); }
  onlyKeys(n, ["title", "intro", "source", "csvUrl", "photos", "items", "sample"], "insights", err);
  text(err, "insights.title", n.title);
  if (!["site", "sheet", "simulated"].includes(n.source)) err("insights.source", '"sheet" (the firm publishes from its own Google Sheet) or "site" (written into site.json)');
  if (n.source === "sheet" && !/^https:\/\/docs\.google\.com\/spreadsheets\/d\/e\/[\w-]+\/pub\?.*output=csv/.test(n.csvUrl ?? "")) err("insights.csvUrl", "the sheet's File → Share → Publish to web link, as CSV (https://docs.google.com/spreadsheets/d/e/…/pub?…output=csv)");
  if (n.source === "simulated" && mode !== "demo") err("insights.source", '"simulated" is for demos only; use "sheet" or "site"');
  if (n.source === "simulated" && !isStr(n.sample)) err("insights.sample", "the demo's sample sheet, as CSV text");
  if (n.sample !== undefined && mode !== "demo") err("insights.sample", "demo only; a client's insights come from its own sheet");
  if (!isObj(n.photos) || !Object.keys(n.photos).length) err("insights.photos", "the site's own photographs insights can use, by name: { \"coast\": { src, width, height, alt } }");
  else for (const [k, p] of Object.entries(n.photos)) { if (!ID.test(k)) err(`insights.photos.${k}`, "name in lowercase letters, numbers and dashes"); photo(err, `insights.photos.${k}`, p, exists); }
  const items = Array.isArray(n.items) ? n.items : [];
  if (!Array.isArray(n.items)) err("insights.items", "a list (it can be empty when the firm publishes from its sheet)");
  else if (!items.length && n.source === "site") err("insights.items", "at least one insight");
  const seen = ids(err, "insights.items", items);
  items.forEach((x, i) => {
    const at = `insights.items[${i}]`;
    onlyKeys(x, ["id", "title", "category", "date", "summary", "body", "author", "photo", "approvedBy", "approvedOn"], at, err);
    for (const k of ["title", "category", "summary", "author", "approvedBy"]) text(err, `${at}.${k}`, x?.[k]);
    lines(err, `${at}.body`, x?.body);
    if (!YMD.test(x?.date ?? "")) err(`${at}.date`, "YYYY-MM-DD");
    if (!YMD.test(x?.approvedOn ?? "")) err(`${at}.approvedOn`, "the date compliance approved it, YYYY-MM-DD; nothing shows without it");
    if (isObj(n.photos) && !(x?.photo in n.photos)) err(`${at}.photo`, `one of the names in insights.photos (${Object.keys(n.photos).join(", ")})`);
  });
  return seen;
}

/** @param {any} a @param {Report} err */
function checkApproach(a, err) {
  if (!isObj(a)) { err("approach", "an object: { title, intro, steps, fees }"); return; }
  onlyKeys(a, ["title", "intro", "steps", "fees"], "approach", err);
  text(err, "approach.title", a.title);
  list(err, "approach.steps", a.steps, "step").forEach((s, i) => { onlyKeys(s, ["id", "title", "text"], `approach.steps[${i}]`, err); text(err, `approach.steps[${i}].title`, s?.title); text(err, `approach.steps[${i}].text`, s?.text); if (s?.id !== undefined && !ID.test(s.id)) err(`approach.steps[${i}].id`, "lowercase letters, numbers and dashes"); });
  if (!isObj(a.fees)) { err("approach.fees", "the firm's fees in pounds: { intro, rows, note }"); return; }
  onlyKeys(a.fees, ["intro", "rows", "note"], "approach.fees", err);
  text(err, "approach.fees.intro", a.fees.intro);
  list(err, "approach.fees.rows", a.fees.rows, "fee").forEach((r, i) => { onlyKeys(r, ["label", "how"], `approach.fees.rows[${i}]`, err); text(err, `approach.fees.rows[${i}].label`, r?.label); text(err, `approach.fees.rows[${i}].how`, r?.how); });
}

/** @param {any} m @param {Report} err */
function checkMeeting(m, err) {
  if (!isObj(m)) { err("meeting", "an object: { title, intro, where, note }"); return; }
  onlyKeys(m, ["title", "intro", "email", "where", "note"], "meeting", err);
  for (const k of ["title", "intro"]) text(err, `meeting.${k}`, m[k]);
  if (m.email !== undefined && !EMAIL.test(m.email)) err("meeting.email", "not a valid email address");
  lines(err, "meeting.where", m.where);
}

/** @param {any} le @param {Report} err @param {((rel: string) => boolean)|undefined} exists @returns {Set<string>} */
function checkLifeEvents(le, err, exists) {
  if (!isObj(le)) { err("lifeEvents", "an object: { items }"); return new Set(); }
  onlyKeys(le, ["items"], "lifeEvents", err);
  const items = list(err, "lifeEvents.items", le.items, "moment");
  const seen = ids(err, "lifeEvents.items", items);
  items.forEach((x, i) => {
    const at = `lifeEvents.items[${i}]`;
    onlyKeys(x, ["id", "title", "intro", "photo", "we", "ready", "timeline", "insights", "documents"], at, err);
    for (const k of ["title", "intro"]) text(err, `${at}.${k}`, x?.[k]);
    photo(err, `${at}.photo`, x?.photo, exists);
    lines(err, `${at}.we`, x?.we);
    lines(err, `${at}.ready`, x?.ready);
    if (x?.documents !== undefined) list(err, `${at}.documents`, x.documents, "group of documents").forEach((g, j) => {
      onlyKeys(g, ["group", "items"], `${at}.documents[${j}]`, err);
      text(err, `${at}.documents[${j}].group`, g?.group);
      lines(err, `${at}.documents[${j}].items`, g?.items);
      if (/£|\d+\s?%/.test(JSON.stringify(g ?? {}))) err(`${at}.documents[${j}]`, "a list of papers carries no figures");
    });
    if (x?.timeline !== undefined) {
      const t = x.timeline;
      onlyKeys(t, ["title", "steps"], `${at}.timeline`, err);
      text(err, `${at}.timeline.title`, t?.title);
      list(err, `${at}.timeline.steps`, t?.steps, "step").forEach((s, j) => {
        onlyKeys(s, ["when", "you", "us", "others"], `${at}.timeline.steps[${j}]`, err);
        text(err, `${at}.timeline.steps[${j}].when`, s?.when);
        if (![s?.you, s?.us, s?.others].some(isStr)) err(`${at}.timeline.steps[${j}]`, "say what someone does: you, us or others");
        if (/£|\d+\s?%/.test(`${s?.you ?? ""} ${s?.us ?? ""} ${s?.others ?? ""}`)) err(`${at}.timeline.steps[${j}]`, "an illustration carries no figures");
      });
    }
  });
  return seen;
}

/** Events from the firm's sheet (or written here), each approved by compliance. @param {any} n @param {string} mode @param {Report} err */
function checkEvents(n, mode, err) {
  if (!isObj(n)) { err("events", "an object; see src/kits/wealth/features/firm-events/README.md"); return; }
  onlyKeys(n, ["title", "intro", "reply", "source", "csvUrl", "items", "sample"], "events", err);
  for (const k of ["title", "intro"]) text(err, `events.${k}`, n[k]);
  if (!(EMAIL.test(n.reply ?? "") || /^https:\/\/\S+$/.test(n.reply ?? ""))) err("events.reply", "where replies go: an email address, or the firm's own form (https)");
  if (!["site", "sheet", "simulated"].includes(n.source)) err("events.source", '"sheet" (the firm publishes from its own Google Sheet) or "site" (written into site.json)');
  if (n.source === "sheet" && !/^https:\/\/docs\.google\.com\/spreadsheets\/d\/e\/[\w-]+\/pub\?.*output=csv/.test(n.csvUrl ?? "")) err("events.csvUrl", "the sheet's File → Share → Publish to web link, as CSV");
  if (n.source === "simulated" && mode !== "demo") err("events.source", '"simulated" is for demos only; use "sheet" or "site"');
  if (n.source === "simulated" && !isStr(n.sample)) err("events.sample", "the demo's sample sheet, as CSV text");
  if (n.sample !== undefined && mode !== "demo") err("events.sample", "demo only; a client's events come from its own sheet");
  if (!Array.isArray(n.items)) { err("events.items", "a list (it can be empty when the firm publishes from its sheet)"); return; }
  ids(err, "events.items", n.items);
  n.items.forEach((/** @type {any} */ e, /** @type {number} */ i) => {
    const at = `events.items[${i}]`;
    onlyKeys(e, ["id", "title", "kind", "date", "start", "end", "place", "summary", "reply", "approvedBy", "approvedOn"], at, err);
    for (const k of ["title", "kind", "place", "summary", "approvedBy"]) text(err, `${at}.${k}`, e?.[k]);
    if (!YMD.test(e?.date ?? "")) err(`${at}.date`, "YYYY-MM-DD");
    if (!YMD.test(e?.approvedOn ?? "")) err(`${at}.approvedOn`, "the date compliance approved it, YYYY-MM-DD; nothing shows without it");
    if (!TIME.test(e?.start ?? "") || !TIME.test(e?.end ?? "") || e.end <= e.start) err(`${at}.start`, "start and end times like 18:30, ending after it starts");
    if (e?.reply !== undefined && !(EMAIL.test(e.reply) || /^https:\/\/\S+$/.test(e.reply))) err(`${at}.reply`, "an email address or an https form link");
  });
}
