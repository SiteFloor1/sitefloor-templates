// @ts-check
/**
 * Validation for the trainer kit (independent personal trainers and small private studios). Every price, place, hour
 * and qualification is the trainer's own; these checks keep the site honest:
 *  - qualifications only with the awarding body and year; a register link only to the trainer's own entry (https);
 *  - no weight-loss figures, dress sizes, guarantees or timed results anywhere in the trainer's copy;
 *  - live data from the trainer's sheet on client sites (simulated data is for demos only);
 *  - prices as whole pounds, the first month's pattern 1–3 sessions a week;
 *  - programmes that need a qualification (pregnancy, injury) name one the trainer holds, and say who they work
 *    alongside; nothing "treats", "fixes" or "cures";
 *  - client stories only in the client's own words, with consent recorded (demos show marked samples only);
 *  - payment links only to the trainer's own Stripe Payment Links.
 */
import { isTime, toMinutes } from "../../core/lib/hours.js";
import { WEEKDAYS } from "./lib/trainer.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @typedef {((rel: string) => boolean)|undefined} Exists */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const ID = /^[a-z0-9-]{1,40}$/;
const POUNDS = (/** @type {any} */ v) => Number.isInteger(v) && v >= 0 && v <= 100000;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const STRIPE = /^https:\/\/(buy|donate)\.stripe\.com\/[A-Za-z0-9_-]+$/;

/** A number as a trainer might write it: digits, words, "a", "half a". */
const N = String.raw`(?:\d+(?:\.\d+)?|an?|half an?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|sixty|ninety|a few|several)`;
const T = String.raw`(?:days?|weeks?|months?)`;
const BODY = String.raw`(?:abs|six[- ]?pack|leaner|slimmer|thinner|lighter|toned|shredded|ripped|beach body|best body|new you|dream body|bikini body)`;

/** Words a trainer's site never uses: promised weight or size loss, guarantees, results by a date, bodies by a date. */
const PROMISES = [
  new RegExp(String.raw`\b(lose|losing|drop|dropping|shed|shedding|burn(?:\s+off)?|melt|shred|knock\s+off|take\s+off)\s+(?:up\s+to\s+)?${N}\s*(kg|kilos?|kilograms?|lbs?|pounds|stones?|st|inch(?:es)?|cm|dress\s+sizes?|sizes?)\b`, "i"),
  /\bdress\s+sizes?\b/i,
  /\bguarantee[ds]?\b/i,
  new RegExp(String.raw`\b(results?|difference|change|transformation)s?\s+(?:in|within|after|by)\s+(?:just\s+)?${N}\s+${T}\b`, "i"),
  new RegExp(String.raw`\b${N}\s+${T}\s+to\s+(?:an?\s+|your\s+|the\s+)?(?:new|better|slimmer|leaner|fitter|stronger|toned|best|flatter|dream)\b`, "i"),
  new RegExp(String.raw`\b${BODY}\b[^.!?]{0,40}\b(?:in|within|by|after)\s+(?:just\s+)?${N}\s+${T}\b`, "i"),
  new RegExp(String.raw`\b(?:in|within|by|after)\s+(?:just\s+)?${N}\s+${T}\b[^.!?]{0,40}\b${BODY}\b`, "i"),
  /\b(visible|flat|chiselled|chiseled)\s+(abs|stomach|tummy|belly)\b/i,
  /\binch(es)?\s+off\b/i,
  /\b(melt|shred|torch|blast|burn)\s+(?:the\s+|away\s+|off\s+|your\s+)?(fat|belly|calories|pounds)\b/i,
  /\bfat[- ]burning\b/i,
  /\b(best|dream|beach|bikini)\s+body\b/i,
];

/**
 * Health claims a trainer can't make: they train alongside a physio or GP, never treat. Someone else's treatment ("once
 * your physio's treatment has finished") and gifting ("treat someone") are fine, so those are taken out first.
 */
const ALLOWED_TREAT = [
  /\b(?:your|their|the|a|my|his|her)\s+(?:physio(?:therapist)?|GP|doctor|midwife|consultant|osteopath|chiropractor|hospital|medical|NHS)(?:'s|s')?\s+(?:treatment|treats|treated)\b/gi,
  /\b(?:physio(?:therapy)?|medical|hospital|NHS|GP)\s+treatment\b/gi,
  /\btreat\s+(?:yourself|someone|them|him|her|a\s+friend|your\s+\w+)\b/gi,
];
const TREATS = /\b(treat(s|ed|ing|ment)?|cures?|cured|curing|fix(es|ing)?|heals?|healed|healing|repairs?|repaired|repairing|rehabilitat\w*|diagnos\w*|gets?\s+rid\s+of|pain[- ]free|recover(s|ing|ed)?\s+from)\b/i;

/** @param {string} v */
const treats = (v) => TREATS.test(ALLOWED_TREAT.reduce((t, re) => t.replace(re, ""), v));

/** Setting names that hold addresses, links or ids, never copy. */
const NOT_COPY = ["src", "srcMobile", "csvUrl", "registerUrl", "url", "href", "payLink", "directionsUrl", "feedUrl", "profile", "image", "id", "kind", "page", "feature", "source"];

/** Every string of copy under v, with its path. @param {any} v @param {string} path @param {(s: string, path: string) => void} fn */
function eachCopy(v, path, fn) {
  if (typeof v === "string") fn(v, path);
  else if (Array.isArray(v)) v.forEach((x, i) => eachCopy(x, `${path}[${i}]`, fn));
  else if (isObj(v)) for (const [k, x] of Object.entries(v)) if (!NOT_COPY.includes(k)) eachCopy(x, `${path}.${k}`, fn);
}

/** @param {string} str @param {string} path @param {Report} err */
function copyClaim(str, path, err) {
  if (PROMISES.some((re) => re.test(str))) err(path, "reads as a promise of results (weight, size, a body or a result by a date, a guarantee); say what the sessions are, not what they'll do");
  else if (treats(str)) err(path, "reads as a health claim (treats, fixes, cures, repairs, pain-free…); a trainer trains alongside a physio or GP. Someone else's treatment is fine to mention");
}

/** Settings that aren't the trainer's copy: Google reviews (the reviewer's words, copied as written) and the rest. */
const NOT_TRAINER_COPY = ["reviews", "qualifications", "schemaVersion", "id", "mode", "plan", "kit", "look", "url", "indexable", "lang", "features", "addons", "contact", "booking", "brand"];

/**
 * The trainer's copy, everywhere: no promised results, no health claims. Qualification names are the awarding body's,
 * so only the trainer's own lines about them are checked.
 * @param {any} site @param {Report} err
 */
function checkCopy(site, err) {
  for (const [k, v] of Object.entries(site)) if (!NOT_TRAINER_COPY.includes(k)) eachCopy(v, k, (str, path) => copyClaim(str, path, err));
  const q = site.qualifications;
  if (isObj(q)) for (const k of ["title", "intro", "insured", "firstAid"]) if (typeof q[k] === "string") copyClaim(q[k], `qualifications.${k}`, err);
}

/** @param {Report} err @param {string} path @param {any} v */
function text(err, path, v) { if (!isStr(v)) err(path, "required text is missing"); }

/** A misspelt setting is refused, not silently ignored. @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (isObj(o)) for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}

/** @param {Report} err @param {string} path @param {any} l @param {string} what @returns {l is any[]} */
function list(err, path, l, what) {
  if (Array.isArray(l) && l.length) return true;
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

/** @param {Report} err @param {string} path @param {any} p @param {Exists} exists @param {string[]} [extra] */
function photo(err, path, p, exists, extra = []) {
  if (!isObj(p)) { err(path, "a photo: { src, width, height, alt }"); return; }
  onlyKeys(p, ["src", "width", "height", "alt", "focus", ...extra], path, err);
  text(err, `${path}.alt`, p.alt);
  if (!Number.isInteger(p.width) || !Number.isInteger(p.height)) err(path, "width and height in pixels");
  if (!isStr(p.src)) err(`${path}.src`, "required");
  else if (exists && !exists(p.src)) err(`${path}.src`, `file not found: ${p.src}`);
}

/** @param {Report} err @param {string} path @param {any} days */
function weekdays(err, path, days) {
  if (!Array.isArray(days) || !days.length || days.some((d) => !WEEKDAYS.includes(d)) || new Set(days).size !== days.length) err(path, `working days, each once, from ${WEEKDAYS.join(", ")}`);
  else if (days.some((d, i) => i && WEEKDAYS.indexOf(d) < WEEKDAYS.indexOf(days[i - 1]))) err(path, "in week order, Monday first");
}

/** @param {Report} err @param {string} path @param {any} from @param {any} to */
function hourRange(err, path, from, to) {
  if (!isTime(from) || !isTime(to) || toMinutes(from) % 60 || toMinutes(to) % 60) err(path, 'from and to on the hour, "HH:00"');
  else if (toMinutes(to) <= toMinutes(from)) err(path, "to must come after from");
}

/** Where the open hours come from: the trainer's sheet (or simulated, demos only). @param {any} d @param {string} mode @param {Report} err */
function checkDiarySource(d, mode, err) {
  if (!["simulated", "sheet"].includes(d.source)) err("diary.source", 'must be "sheet" (or "simulated" on demo sites)');
  if (d.source === "simulated" && mode !== "demo") err("diary.source", 'simulated data is only allowed on demo sites; use "sheet"');
  if (d.source === "sheet" && !(isStr(d.csvUrl) && /^https:\/\/docs\.google\.com\/spreadsheets\/.+output=csv/.test(d.csvUrl))) err("diary.csvUrl", "the sheet's published CSV link (File → Share → Publish to web → CSV)");
  if (d.source !== "sheet" && d.csvUrl !== undefined) err("diary.csvUrl", 'only with source "sheet"');
}

/** The photograph over a block of spoken-for hours. @param {any} d @param {Report} err @param {Exists} exists */
function checkDiaryPhoto(d, err, exists) {
    photo(err, "diary.photo", d.photo, exists, ["caption", "block"]);
    const b = d.photo?.block;
    if (!isObj(b)) err("diary.photo.block", "{ days, from, to }: the spoken-for hours the photograph covers");
    else {
      onlyKeys(b, ["days", "from", "to"], "diary.photo.block", err);
      weekdays(err, "diary.photo.block.days", b.days);
      hourRange(err, "diary.photo.block", b.from, b.to);
      if (Array.isArray(b.days) && Array.isArray(d.days)) {
        const idx = b.days.map((x) => d.days.indexOf(x));
        if (idx.some((i) => i < 0) || idx.some((i, k) => k && i !== idx[k - 1] + 1)) err("diary.photo.block.days", "working days next to each other");
      }
      if (isTime(b.from) && isTime(b.to) && isTime(d.from) && isTime(d.to) && (toMinutes(b.from) < toMinutes(d.from) || toMinutes(b.to) > toMinutes(d.to))) err("diary.photo.block", "inside the diary's hours");
    }
}

/** @param {any} d @param {string} mode @param {Report} err @param {Exists} exists */
function checkDiary(d, mode, err, exists) {
  if (!isObj(d)) { err("diary", "{ source, days, from, to, priceFrom, photo }"); return; }
  onlyKeys(d, ["source", "csvUrl", "staleAfterHours", "days", "from", "to", "minutes", "priceFrom", "photo"], "diary", err);
  checkDiarySource(d, mode, err);
  if (d.staleAfterHours !== undefined && !(Number.isInteger(d.staleAfterHours) && d.staleAfterHours >= 1 && d.staleAfterHours <= 72)) err("diary.staleAfterHours", "1 to 72 hours");
  weekdays(err, "diary.days", d.days);
  hourRange(err, "diary", d.from, d.to);
  if (d.minutes !== undefined && !(Number.isInteger(d.minutes) && d.minutes >= 30 && d.minutes <= 60)) err("diary.minutes", "a session's length, 30 to 60 minutes");
  if (!POUNDS(d.priceFrom) || d.priceFrom === 0) err("diary.priceFrom", "the lowest price of an hour, whole pounds");
  if (d.photo !== undefined) checkDiaryPhoto(d, err, exists);
}

/** @param {any} m @param {Report} err @param {Exists} exists */
function checkMonth(m, err, exists) {
  if (!isObj(m)) { err("firstMonth", "{ places, often, steps, prices, message }"); return; }
  onlyKeys(m, ["photo", "caption", "places", "often", "steps", "prices", "policy", "message"], "firstMonth", err);
  text(err, "firstMonth.message", m.message);
  if (m.photo !== undefined) photo(err, "firstMonth.photo", m.photo, exists);
  if (list(err, "firstMonth.places", m.places, "place: { id, label, note, text }")) {
    ids(err, "firstMonth.places", m.places);
    m.places.forEach((/** @type {any} */ p, /** @type {number} */ i) => {
      onlyKeys(p, ["id", "label", "note", "text", "away"], `firstMonth.places[${i}]`, err);
      text(err, `firstMonth.places[${i}].label`, p?.label);
      text(err, `firstMonth.places[${i}].text`, p?.text);
      if (p?.away !== undefined && typeof p.away !== "boolean") err(`firstMonth.places[${i}].away`, "true when the trainer comes to the client");
    });
  }
  if (list(err, "firstMonth.often", m.often, "choice: { perWeek, label, note }")) {
    m.often.forEach((/** @type {any} */ o, /** @type {number} */ i) => {
      onlyKeys(o, ["perWeek", "label", "note", "default"], `firstMonth.often[${i}]`, err);
      if (![1, 2, 3].includes(o?.perWeek)) err(`firstMonth.often[${i}].perWeek`, "1, 2 or 3 sessions a week");
      text(err, `firstMonth.often[${i}].label`, o?.label);
    });
    if (m.often.filter((/** @type {any} */ o) => o?.default).length > 1) err("firstMonth.often", "one default at most");
  }
  if (list(err, "firstMonth.steps", m.steps, "step of the first session: { minute, text }")) {
    m.steps.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
      onlyKeys(s, ["minute", "text"], `firstMonth.steps[${i}]`, err);
      if (!(Number.isInteger(s?.minute) && s.minute >= 0 && s.minute <= 90)) err(`firstMonth.steps[${i}].minute`, "minutes into the session, 0 to 90");
      else if (i && s.minute <= m.steps[i - 1]?.minute) err(`firstMonth.steps[${i}].minute`, "in order");
      text(err, `firstMonth.steps[${i}].text`, s?.text);
    });
  }
  const p = m.prices;
  if (!isObj(p)) err("firstMonth.prices", "{ first, session: { \"1\": …, \"2\": …, \"3\": … }, travel }");
  else {
    onlyKeys(p, ["first", "session", "travel"], "firstMonth.prices", err);
    if (!POUNDS(p.first)) err("firstMonth.prices.first", "whole pounds");
    if (!isObj(p.session)) err("firstMonth.prices.session", "the price of a session by sessions a week");
    else for (const o of m.often ?? []) if (!POUNDS(p.session[String(o?.perWeek)])) err(`firstMonth.prices.session.${o?.perWeek}`, "whole pounds");
    if (p.travel !== undefined && !POUNDS(p.travel)) err("firstMonth.prices.travel", "whole pounds, added when the trainer comes to the client");
  }
  if (m.policy !== undefined) {
    if (!list(err, "firstMonth.policy", m.policy, "line: { label, value }")) return;
    m.policy.forEach((/** @type {any} */ l, /** @type {number} */ i) => { onlyKeys(l, ["label", "value"], `firstMonth.policy[${i}]`, err); text(err, `firstMonth.policy[${i}].label`, l?.label); text(err, `firstMonth.policy[${i}].value`, l?.value); });
  }
}

/** @param {any} q @param {Report} err */
function checkQualifications(q, err) {
  if (!isObj(q)) { err("qualifications", "{ title, items, registerUrl }"); return; }
  onlyKeys(q, ["title", "intro", "items", "registerUrl", "registerName", "insured", "firstAid"], "qualifications", err);
  if (list(err, "qualifications.items", q.items, "qualification the trainer holds: { name, awardingBody, year }")) {
    q.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
      onlyKeys(x, ["name", "awardingBody", "year"], `qualifications.items[${i}]`, err);
      text(err, `qualifications.items[${i}].name`, x?.name);
      text(err, `qualifications.items[${i}].awardingBody`, x?.awardingBody);
      if (!(Number.isInteger(x?.year) && x.year >= 1980 && x.year <= 2100)) err(`qualifications.items[${i}].year`, "the year it was awarded");
    });
  }
  if (q.registerUrl !== undefined && !(isStr(q.registerUrl) && q.registerUrl.startsWith("https://"))) err("qualifications.registerUrl", "the trainer's own public register entry, an https link");
  if (q.registerUrl !== undefined) text(err, "qualifications.registerName", q.registerName);
  for (const k of ["insured", "firstAid"]) if (q[k] !== undefined && !isStr(q[k])) err(`qualifications.${k}`, "a line in the trainer's words, only if true");
}

/** @param {any} s @param {Report} err */
function checkSessions(s, err) {
  if (!isObj(s)) { err("sessions", "{ items }"); return; }
  onlyKeys(s, ["title", "intro", "items"], "sessions", err);
  if (!list(err, "sessions.items", s.items, "session: { id, name, text, minutes }")) return;
  ids(err, "sessions.items", s.items);
  s.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    onlyKeys(x, ["id", "name", "text", "minutes", "price"], `sessions.items[${i}]`, err);
    text(err, `sessions.items[${i}].name`, x?.name);
    text(err, `sessions.items[${i}].text`, x?.text);
    if (!(Number.isInteger(x?.minutes) && x.minutes >= 15 && x.minutes <= 180)) err(`sessions.items[${i}].minutes`, "15 to 180");
    if (x?.price !== undefined && !(POUNDS(x.price) && x.price > 0)) err(`sessions.items[${i}].price`, "whole pounds");
  });
}

/** A page's own heading and line. @param {Report} err @param {string} at @param {any} o */
function pageHead(err, at, o) { text(err, `${at}.title`, o?.title); if (o?.intro !== undefined) text(err, `${at}.intro`, o.intro); }

/** Lines of text. @param {Report} err @param {string} path @param {any} l @param {string} what */
function lines(err, path, l, what) { if (list(err, path, l, what)) l.forEach((/** @type {any} */ x, /** @type {number} */ i) => text(err, `${path}[${i}]`, x)); }

/** The name of a qualification the trainer holds. @param {any} site @param {Report} err @param {string} path @param {any} name */
function held(site, err, path, name) {
  const names = (site.qualifications?.items ?? []).map((/** @type {any} */ q) => q?.name);
  if (!isStr(name)) err(path, "the qualification this rests on, as named in qualifications.items");
  else if (!names.includes(name)) err(path, `"${name}" isn't in qualifications.items; only what the trainer holds`);
}

const KINDS = ["strength", "fitness", "prenatal", "rehab", "older", "event", "other"];

/** One programme. @param {any} site @param {any} x @param {string} at @param {Report} err @param {Exists} exists */
function checkProgramme(site, x, at, err, exists) {
  onlyKeys(x, ["id", "kind", "name", "line", "who", "text", "sessions", "care", "qualification", "photo"], at, err);
  if (!KINDS.includes(x?.kind)) err(`${at}.kind`, KINDS.join(", "));
  for (const k of ["name", "line", "who"]) text(err, `${at}.${k}`, x?.[k]);
  lines(err, `${at}.text`, x?.text, "paragraph");
  lines(err, `${at}.sessions`, x?.sessions, "kind of session, in order (\"Lower body strength\")");
  if (x?.photo !== undefined) photo(err, `${at}.photo`, x.photo, exists);
  const careful = ["prenatal", "rehab"].includes(x?.kind);
  if (careful) text(err, `${at}.care`, x?.care);
  if (careful || x?.qualification !== undefined) held(site, err, `${at}.qualification`, x?.qualification);
}


/** @param {any} site @param {Report} err @param {Exists} exists */
function checkProgrammes(site, err, exists) {
  const p = site.programmes;
  if (!isObj(p)) { err("programmes", "{ title, intro, items }"); return; }
  onlyKeys(p, ["title", "intro", "items"], "programmes", err);
  pageHead(err, "programmes", p);
  if (!list(err, "programmes.items", p.items, "programme: { id, kind, name, line, who, text, sessions }")) return;
  ids(err, "programmes.items", p.items);
  p.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => checkProgramme(site, x, `programmes.items[${i}]`, err, exists));
}

/** PT-3. @param {any} site @param {Report} err */
function checkGoal(site, err) {
  const g = site.goalFinder;
  if (!isObj(g)) { err("goalFinder", "{ title, goals, levels, injury, message }"); return; }
  onlyKeys(g, ["title", "intro", "goals", "levels", "injury", "message"], "goalFinder", err);
  pageHead(err, "goalFinder", g);
  for (const k of ["injury", "message"]) text(err, `goalFinder.${k}`, g[k]);
  const progs = (site.programmes?.items ?? []).map((/** @type {any} */ x) => x?.id);
  if (list(err, "goalFinder.goals", g.goals, "goal: { id, label, programme }")) {
    ids(err, "goalFinder.goals", g.goals);
    g.goals.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
      onlyKeys(x, ["id", "label", "programme"], `goalFinder.goals[${i}]`, err);
      text(err, `goalFinder.goals[${i}].label`, x?.label);
      if (!progs.includes(x?.programme)) err(`goalFinder.goals[${i}].programme`, `one of programmes.items: ${progs.join(", ")}`);
    });
  }
  if (list(err, "goalFinder.levels", g.levels, "level: { id, label, text }")) {
    ids(err, "goalFinder.levels", g.levels);
    g.levels.forEach((/** @type {any} */ x, /** @type {number} */ i) => { onlyKeys(x, ["id", "label", "text"], `goalFinder.levels[${i}]`, err); text(err, `goalFinder.levels[${i}].label`, x?.label); text(err, `goalFinder.levels[${i}].text`, x?.text); });
  }
}

/** PT-4: the client's own words, with consent; samples only on demos. @param {any} site @param {Report} err */
function checkStories(site, err) {
  const s = site.stories;
  if (!isObj(s)) { err("stories", "{ source, title, items }"); return; }
  onlyKeys(s, ["source", "title", "intro", "items"], "stories", err);
  pageHead(err, "stories", s);
  if (!["client", "sample"].includes(s.source)) err("stories.source", '"client" (the trainer\'s own clients, with consent) or "sample" (demos only)');
  if (s.source === "sample" && site.mode !== "demo") err("stories.source", "sample stories are for demos; a client site shows its own clients' words, with consent");
  if (!list(err, "stories.items", s.items, "story: { name, words, consent }")) return;
  s.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `stories.items[${i}]`;
    onlyKeys(x, ["name", "programme", "since", "words", "consent"], at, err);
    text(err, `${at}.name`, x?.name);
    lines(err, `${at}.words`, x?.words, "paragraph in the client's own words");
    if (x?.programme !== undefined && !(site.programmes?.items ?? []).some((/** @type {any} */ p) => p?.id === x.programme)) err(`${at}.programme`, "one of programmes.items");
    if (s.source === "client") {
      if (!isObj(x?.consent) || !/^\d{4}-\d{2}$/.test(x.consent.date ?? "") || !isStr(x.consent.how)) err(`${at}.consent`, '{ date: "YYYY-MM", how: "in writing" }: when and how this client agreed to be quoted');
    }
  });
}

/** PT-5. @param {any} c @param {Report} err */
function checkCoverage(c, err) {
  if (!isObj(c)) { err("coverage", "{ title, areas, elsewhere }"); return; }
  onlyKeys(c, ["title", "intro", "areas", "elsewhere"], "coverage", err);
  pageHead(err, "coverage", c);
  text(err, "coverage.elsewhere", c.elsewhere);
  if (!list(err, "coverage.areas", c.areas, "area: { id, label, districts }")) return;
  ids(err, "coverage.areas", c.areas);
  c.areas.forEach((/** @type {any} */ a, /** @type {number} */ i) => {
    onlyKeys(a, ["id", "label", "districts", "note"], `coverage.areas[${i}]`, err);
    text(err, `coverage.areas[${i}].label`, a?.label);
    if (!Array.isArray(a?.districts) || !a.districts.length || a.districts.some((/** @type {any} */ d) => !/^[A-Z]{1,2}\d[A-Z\d]?$/.test(d))) err(`coverage.areas[${i}].districts`, 'postcode districts, e.g. ["SW3", "SW10", "W8"]');
  });
}

/** PT-6. @param {any} t @param {Report} err */
function checkTimeline(t, err) {
  if (!isObj(t)) { err("timeline", "{ title, phases, message }"); return; }
  onlyKeys(t, ["title", "intro", "phases", "message"], "timeline", err);
  pageHead(err, "timeline", t);
  text(err, "timeline.message", t.message);
  if (!list(err, "timeline.phases", t.phases, "phase: { from, to, name, text }")) return;
  let next = 1;
  t.phases.forEach((/** @type {any} */ p, /** @type {number} */ i) => {
    onlyKeys(p, ["from", "to", "name", "text"], `timeline.phases[${i}]`, err);
    text(err, `timeline.phases[${i}].name`, p?.name);
    text(err, `timeline.phases[${i}].text`, p?.text);
    if (p?.from !== next || !Number.isInteger(p?.to) || p.to < p.from || p.to > 12) err(`timeline.phases[${i}]`, `weeks ${next} to n, following on from the phase before, within 12 weeks`);
    next = (Number.isInteger(p?.to) ? p.to : next) + 1;
  });
  if (next !== 13) err("timeline.phases", "the phases cover all twelve weeks");
}

/** PT-7. @param {any} k @param {Report} err @param {Exists} exists */
function checkPackages(k, err, exists) {
  if (!isObj(k)) { err("packages", "{ title, items, message }"); return; }
  onlyKeys(k, ["title", "intro", "photo", "items", "invoice", "message"], "packages", err);
  pageHead(err, "packages", k);
  text(err, "packages.message", k.message);
  if (k.photo !== undefined) photo(err, "packages.photo", k.photo, exists);
  if (k.invoice !== undefined) text(err, "packages.invoice", k.invoice);
  if (!list(err, "packages.items", k.items, "package: { id, kind, name, who, includes, priceFrom, unit }")) return;
  ids(err, "packages.items", k.items);
  k.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `packages.items[${i}]`;
    onlyKeys(x, ["id", "kind", "name", "who", "includes", "priceFrom", "unit", "people"], at, err);
    if (!["corporate", "family"].includes(x?.kind)) err(`${at}.kind`, '"corporate" or "family"');
    for (const f of ["name", "who", "unit"]) text(err, `${at}.${f}`, x?.[f]);
    lines(err, `${at}.includes`, x?.includes, "line on what's included");
    if (!(POUNDS(x?.priceFrom) && x.priceFrom > 0)) err(`${at}.priceFrom`, "whole pounds, the trainer's own price");
    if (!(Number.isInteger(x?.people) && x.people >= 2 && x.people <= 40)) err(`${at}.people`, "the most people it's for, 2 to 40");
  });
}

/** PT-8. @param {any} c @param {Report} err */
function checkChecklist(c, err) {
  if (!isObj(c)) { err("checklist", "{ title, groups, cancellation }"); return; }
  onlyKeys(c, ["title", "intro", "groups", "cancellation"], "checklist", err);
  pageHead(err, "checklist", c);
  text(err, "checklist.cancellation", c.cancellation);
  if (list(err, "checklist.groups", c.groups, "group: { label, items }")) c.groups.forEach((/** @type {any} */ g, /** @type {number} */ i) => { onlyKeys(g, ["label", "items"], `checklist.groups[${i}]`, err); text(err, `checklist.groups[${i}].label`, g?.label); lines(err, `checklist.groups[${i}].items`, g?.items, "thing to do or bring"); });
}

/** Pages made mostly of the trainer's words. @param {any} site @param {Report} err @param {Exists} exists */
function checkWordPages(site, err, exists) {
  const shapes = /** @type {Record<string, string[]>} */ ({
    startHere: ["title", "intro", "photo", "questionnaire"],
    online: ["title", "intro", "photo", "home", "remote", "message"],
    nutrition: ["title", "intro", "photo", "approach", "does", "doesNot", "referOn", "qualification"],
    studio: ["title", "intro", "photo", "room", "facts"],
  });
  for (const [k, keys] of Object.entries(shapes)) {
    const o = site[k];
    if (o === undefined) continue;
    if (!isObj(o)) { err(k, `{ ${keys.join(", ")} }`); continue; }
    onlyKeys(o, keys, k, err);
    pageHead(err, k, o);
    if (o.photo !== undefined) photo(err, `${k}.photo`, o.photo, exists);
    if (o.room !== undefined) photo(err, `${k}.room`, o.room, exists);
  }
  if (isObj(site.startHere)) text(err, "startHere.questionnaire", site.startHere.questionnaire);
  checkOnline(site.online, err);
  if (isObj(site.nutrition)) {
    const n = site.nutrition;
    lines(err, "nutrition.approach", n.approach, "paragraph");
    lines(err, "nutrition.does", n.does, "thing the trainer does");
    lines(err, "nutrition.doesNot", n.doesNot, "thing the trainer leaves to others");
    text(err, "nutrition.referOn", n.referOn);
    if (n.qualification !== undefined) held(site, err, "nutrition.qualification", n.qualification);
  }
  if (isObj(site.studio) && list(err, "studio.facts", site.studio.facts, "fact: { label, value }")) site.studio.facts.forEach((/** @type {any} */ f, /** @type {number} */ i) => { onlyKeys(f, ["label", "value"], `studio.facts[${i}]`, err); text(err, `studio.facts[${i}].label`, f?.label); text(err, `studio.facts[${i}].value`, f?.value); });
}

/** @param {any} o @param {Report} err */
function checkOnline(o, err) {
  if (!isObj(o)) return;
  text(err, "online.message", o.message);
  for (const k of ["home", "remote"]) {
    const b = o[k];
    if (!isObj(b)) { err(`online.${k}`, "{ title, text, items, price }"); continue; }
    onlyKeys(b, ["title", "text", "items", "price", "unit"], `online.${k}`, err);
    text(err, `online.${k}.title`, b.title);
    text(err, `online.${k}.text`, b.text);
    lines(err, `online.${k}.items`, b.items, "line");
    if (b.price !== undefined && !(POUNDS(b.price) && b.price > 0)) err(`online.${k}.price`, "whole pounds");
    if (b.price !== undefined) text(err, `online.${k}.unit`, b.unit);
  }
}

/** Prices and blocks. @param {any} p @param {string} mode @param {Report} err */
function checkPricesPage(p, mode, err) {
  if (!isObj(p)) { err("pricesPage", "{ title, blocks }"); return; }
  onlyKeys(p, ["title", "intro", "blocks", "note"], "pricesPage", err);
  pageHead(err, "pricesPage", p);
  if (p.note !== undefined) text(err, "pricesPage.note", p.note);
  if (!list(err, "pricesPage.blocks", p.blocks, "block: { sessions, price, duo, useWithin, payLink }")) return;
  p.blocks.forEach((/** @type {any} */ b, /** @type {number} */ i) => checkBlock(b, i, p.blocks, err));
  if (mode === "demo") p.blocks.forEach((/** @type {any} */ b, /** @type {number} */ i) => { if (b?.payLink !== undefined && !/\/test_/.test(String(b.payLink))) err(`pricesPage.blocks[${i}].payLink`, "a demo takes no money: a Stripe test link (…/test_…) or none"); });
}

/** @param {any} b @param {number} i @param {any[]} all @param {Report} err */
function checkBlock(b, i, all, err) {
  const at = `pricesPage.blocks[${i}]`;
  const whole = (/** @type {any} */ v) => POUNDS(v) && v > 0;
  onlyKeys(b, ["sessions", "price", "duo", "useWithin", "payLink"], at, err);
    if (!(Number.isInteger(b?.sessions) && b.sessions >= 1 && b.sessions <= 50)) err(`${at}.sessions`, "1 to 50");
    else if (i && b.sessions <= all[i - 1]?.sessions) err(`${at}.sessions`, "smallest block first");
    if (!whole(b?.price)) err(`${at}.price`, "whole pounds for the whole block");
    if (b?.duo !== undefined && !whole(b.duo)) err(`${at}.duo`, "whole pounds for the block, for two people");
    if (b?.useWithin !== undefined) text(err, `${at}.useWithin`, b.useWithin);
    if (b?.payLink !== undefined && !STRIPE.test(String(b.payLink))) err(`${at}.payLink`, "the trainer's own Stripe Payment Link, https://buy.stripe.com/…");
}

/** @param {any} j @param {Report} err @param {Exists} exists */
function checkJournal(j, err, exists) {
  if (!isObj(j)) { err("journal", "{ title, articles }"); return; }
  onlyKeys(j, ["title", "intro", "articles"], "journal", err);
  pageHead(err, "journal", j);
  if (!list(err, "journal.articles", j.articles, "article: { slug, title, intro, minutes, body }")) return;
  const seen = new Set();
  j.articles.forEach((/** @type {any} */ a, /** @type {number} */ i) => {
    const at = `journal.articles[${i}]`;
    onlyKeys(a, ["slug", "title", "intro", "minutes", "photo", "body"], at, err);
    if (!SLUG.test(a?.slug ?? "")) err(`${at}.slug`, "lowercase words and dashes, for the page's address");
    else if (seen.has(a.slug)) err(`${at}.slug`, "used twice");
    seen.add(a?.slug);
    text(err, `${at}.title`, a?.title);
    text(err, `${at}.intro`, a?.intro);
    if (!(Number.isInteger(a?.minutes) && a.minutes >= 1 && a.minutes <= 30)) err(`${at}.minutes`, "minutes to read, 1 to 30");
    if (a?.photo !== undefined) photo(err, `${at}.photo`, a.photo, exists);
    lines(err, `${at}.body`, a?.body, "paragraph");
  });
}

/** Each extra block of settings, only when it's there. @param {any} site @param {Report} err @param {Exists} exists */
function checkMore(site, err, exists) {
  if (site.programmes !== undefined) checkProgrammes(site, err, exists);
  if (site.goalFinder !== undefined) checkGoal(site, err);
  if (site.stories !== undefined) checkStories(site, err);
  if (site.coverage !== undefined) checkCoverage(site.coverage, err);
  if (site.timeline !== undefined) checkTimeline(site.timeline, err);
  if (site.packages !== undefined) checkPackages(site.packages, err, exists);
  if (site.checklist !== undefined) checkChecklist(site.checklist, err);
  if (site.pricesPage !== undefined) checkPricesPage(site.pricesPage, site.mode, err);
  if (site.journal !== undefined) checkJournal(site.journal, err, exists);
  checkWordPages(site, err, exists);
}


/** @param {any} site @param {Report} err @param {Exists} [exists] */
export function checkTrainer(site, err, exists) {
  if (site.kit !== "trainer") return;
  if (site.diary !== undefined) checkDiary(site.diary, site.mode, err, exists);
  if (site.firstMonth !== undefined) checkMonth(site.firstMonth, err, exists);
  if (site.qualifications !== undefined) checkQualifications(site.qualifications, err);
  if (site.sessions !== undefined) checkSessions(site.sessions, err);
  checkMore(site, err, exists);
  checkCopy(site, err);
}
