// @ts-check
/**
 * Validation for the ifa kit (independent and restricted financial advisers). FCA rules decide what must be there and
 * what must never be: the firm's statutory status and FRN with its register entry, the Financial Ombudsman Service,
 * the risk sentence beside fees, a plain statement of independent or restricted advice (COBS 6.2B), and no promised
 * returns or growth projections anywhere (COBS 4.2). Every fact (fees, people, numbers) is the firm's own; a demo can
 * never carry a real firm's or adviser's number.
 */
import { isFrn, isIrn, isDemoNumber, isRegisterLink, promises } from "./lib/fca.js";
import { scheduleProblem } from "./lib/fees.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const ID = /^[a-z0-9-]{1,40}$/;
const YMD = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+\d[\d ]{7,17}$/;
const DOMAIN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

/** Pages the kit builds; a topic or a guide can't take one of these names. */
export const RESERVED = ["index", "regulatory", "check", "independent", "fees", "advisers", "first-meeting", "services", "your-year",
  "old-pensions", "guides", "insights", "visit", "privacy", "404", "topic", "guide"];

/** @param {Report} err @param {string} path @param {any} v */
const text = (err, path, v) => { if (!isStr(v)) err(path, "required text is missing"); };

/** A misspelt setting is refused, not silently ignored. @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (isObj(o)) for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}

/** @param {Report} err @param {string} path @param {any} v @param {string} what @returns {any[]} */
function list(err, path, v, what) {
  if (!Array.isArray(v) || !v.length) { err(path, `at least one ${what}`); return []; }
  return v;
}

/** @param {Report} err @param {string} path @param {any} v */
const lines = (err, path, v) => list(err, path, v, "line").forEach((x, i) => text(err, `${path}[${i}]`, x));

/** @param {Report} err @param {string} path @param {any} p @param {((rel: string) => boolean)|undefined} exists */
function photo(err, path, p, exists) {
  if (!isObj(p)) { err(path, "a photo: { src, width, height, alt }"); return; }
  onlyKeys(p, ["src", "width", "height", "alt", "position", "credit"], path, err);
  text(err, `${path}.alt`, p.alt);
  if (!Number.isInteger(p.width) || !Number.isInteger(p.height)) err(path, "width and height in pixels");
  if (p.position !== undefined && !/^\d{1,3}% \d{1,3}%$/.test(p.position)) err(`${path}.position`, 'the crop\'s focus, e.g. "50% 40%"');
  if (p.credit !== undefined) text(err, `${path}.credit`, p.credit);
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

/** The register link: the firm's (or adviser's) own entry on a client site; a demo may only point at the register's search. @param {any} v @param {string} path @param {string} mode @param {Report} err */
function registerLink(v, path, mode, err) {
  if (!isRegisterLink(v)) err(path, "a link into the FCA register, https://register.fca.org.uk/…");
  else if (mode === "client" && /^https:\/\/register\.fca\.org\.uk\/?$/.test(v)) err(path, "client sites link to their own entry on the register (open it and copy the address), not the search page");
  else if (mode === "demo" && !/^https:\/\/register\.fca\.org\.uk\/?$/.test(v)) err(path, "demo sites are fictional: link to the register's search page, https://register.fca.org.uk/");
}

/** Every string in the kit's settings, with where it is. @param {any} v @param {string} at @param {[string, string][]} out */
function strings(v, at, out) {
  if (typeof v === "string") out.push([at, v]);
  else if (Array.isArray(v)) v.forEach((x, i) => strings(x, `${at}[${i}]`, out));
  else if (isObj(v)) for (const [k, x] of Object.entries(v)) strings(x, `${at}.${k}`, out);
  return out;
}

/** @param {any} site @param {Report} err @param {((rel: string) => boolean)|undefined} [exists] */
export function checkIfa(site, err, exists) {
  if (site.kit !== "ifa") return;
  const on = (/** @type {string} */ id) => Array.isArray(site.features) && site.features.includes(id);
  for (const [id, why] of [["ifa-fca", "its FCA status, number and register entry, and the Financial Ombudsman Service"], ["ifa-independence", "whether its advice is independent or restricted (COBS 6.2B)"], ["ifa-check", "how clients can tell a real call or email from a scam"]]) {
    if (!on(id)) err("features", `"${id}" is required on every financial adviser's site: ${why}`);
  }
  checkHero(site.hero, err, exists);
  if (site.regulation !== undefined) checkRegulation(site.regulation, site.mode, err);
  if (site.independence !== undefined) checkIndependence(site.independence, err);
  if (site.check !== undefined) checkCheck(site.check, err);
  const topics = site.topics !== undefined ? checkTopics(site.topics, err, exists) : new Set();
  const guides = site.guides !== undefined ? checkGuides(site.guides, err, exists) : new Set();
  if (site.services !== undefined) checkServices(site.services, topics, err);
  if (site.advisers !== undefined) checkAdvisers(site.advisers, site.mode, err, exists);
  if (site.fees !== undefined) checkFees(site.fees, err);
  if (site.meeting !== undefined) checkMeeting(site.meeting, err);
  if (site.upload !== undefined) checkUpload(site.upload, err);
  if (site.year !== undefined) checkYear(site.year, err);
  if (site.milestones !== undefined) {
    onlyKeys(site.milestones, ["topic"], "milestones", err);
    if (!topics.has(site.milestones?.topic)) err("milestones.topic", "the id of the topic page that shows the milestones (e.g. pensions)");
  }
  if (site.tracing !== undefined) { onlyKeys(site.tracing, ["title", "intro"], "tracing", err); text(err, "tracing.title", site.tracing?.title); text(err, "tracing.intro", site.tracing?.intro); }
  if (site.journal !== undefined) checkJournal(site.journal, err);
  for (const [what, set] of /** @type {[string, Set<string>][]} */ ([["topics", topics], ["guides", guides]])) {
    for (const id of set) if (RESERVED.includes(id) || (site.pages ?? []).some((/** @type {any} */ p) => p?.slug === id)) err(what, `"${id}" is the name of another page; give it another id`);
  }
  for (const id of topics) if (guides.has(id)) err("guides", `"${id}" is both a topic and a guide; give one another id`);
  // COBS 4.2: a promotion can't promise returns or performance, and this kit shows no growth or projections.
  // Nothing the firm writes anywhere in its settings may.
  for (const [at, v] of strings(site, "", [])) {
    if (promises(v)) err(at.replace(/^\./, ""), "promises a return, performance or growth; FCA rules (COBS 4.2) don't allow that on the site");
  }
}

/** @param {any} h @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkHero(h, err, exists) {
  if (!isObj(h)) { err("hero", "required: { kicker, title, intro, photo }"); return; }
  onlyKeys(h, ["kicker", "title", "intro", "photo", "photoTall"], "hero", err);
  for (const k of ["kicker", "title", "intro"]) text(err, `hero.${k}`, h[k]);
  if (isStr(h.title) && h.title.replace(/\|/g, " ").trim().split(/\s+/).length > 10) err("hero.title", "ten words at most; say what the firm does in hero.intro");
  photo(err, "hero.photo", h.photo, exists);
  if (h.photoTall !== undefined) photo(err, "hero.photoTall", h.photoTall, exists);
}

/** @param {any} r @param {string} mode @param {Report} err */
function checkRegulation(r, mode, err) {
  if (!isObj(r)) { err("regulation", "an object; see src/kits/ifa/features/ifa-fca/README.md"); return; }
  onlyKeys(r, ["legalName", "tradingName", "frn", "registerUrl", "entity", "office", "unregulated", "fscs", "complaints"], "regulation", err);
  for (const k of ["legalName", "entity", "unregulated"]) text(err, `regulation.${k}`, r[k]);
  if (r.tradingName !== undefined) text(err, "regulation.tradingName", r.tradingName);
  fcaNumber(r.frn, "regulation.frn", mode, err, "frn");
  registerLink(r.registerUrl, "regulation.registerUrl", mode, err);
  if (r.fscs !== undefined) text(err, "regulation.fscs", r.fscs);
  if (r.office !== undefined) text(err, "regulation.office", r.office);
  if (!isObj(r.complaints)) { err("regulation.complaints", "how to complain to the firm: { email, address, steps }"); return; }
  onlyKeys(r.complaints, ["email", "address", "steps"], "regulation.complaints", err);
  if (!EMAIL.test(r.complaints.email ?? "")) err("regulation.complaints.email", "the address complaints go to");
  text(err, "regulation.complaints.address", r.complaints.address);
  lines(err, "regulation.complaints.steps", r.complaints.steps);
}

/** COBS 6.2B: say plainly which the firm is, and if restricted, what it is restricted to. @param {any} x @param {Report} err */
function checkIndependence(x, err) {
  if (!isObj(x)) { err("independence", "{ status, line, body }"); return; }
  onlyKeys(x, ["status", "line", "body", "restrictedTo"], "independence", err);
  if (!["independent", "restricted"].includes(x.status)) err("independence.status", '"independent" or "restricted", as the firm describes its advice to the FCA');
  text(err, "independence.line", x.line);
  lines(err, "independence.body", x.body);
  if (x.status === "restricted") text(err, "independence.restrictedTo", x.restrictedTo);
  if (x.status === "independent" && x.restrictedTo !== undefined) err("independence.restrictedTo", "only for restricted advice");
  if (x.status === "restricted" && isStr(x.line) && /\bindependent\b/i.test(x.line) && !/\bnot independent\b/i.test(x.line)) err("independence.line", "restricted advice can't be called independent");
}

/** @param {any} c @param {Report} err */
function checkCheck(c, err) {
  if (!isObj(c)) { err("check", "{ title, intro, phones, domains, never, callback }"); return; }
  onlyKeys(c, ["title", "intro", "phones", "domains", "never", "callback"], "check", err);
  for (const k of ["title", "intro", "callback"]) text(err, `check.${k}`, c[k]);
  list(err, "check.phones", c.phones, "phone number").forEach((p, i) => {
    onlyKeys(p, ["label", "number"], `check.phones[${i}]`, err);
    text(err, `check.phones[${i}].label`, p?.label);
    if (!PHONE.test(p?.number ?? "")) err(`check.phones[${i}].number`, 'international format, e.g. "+44 20 7946 0123"');
  });
  list(err, "check.domains", c.domains, "email domain").forEach((d, i) => { if (!DOMAIN.test(d ?? "")) err(`check.domains[${i}]`, "a domain, e.g. thursby.co.uk"); });
  lines(err, "check.never", c.never);
}

/** The services, each with what to bring to talk about it. @param {any} s @param {Set<string>} topics @param {Report} err */
function checkServices(s, topics, err) {
  if (!isObj(s)) { err("services", "{ who, minimum, items }"); return; }
  onlyKeys(s, ["who", "minimum", "items"], "services", err);
  text(err, "services.who", s.who);
  text(err, "services.minimum", s.minimum);
  const items = list(err, "services.items", s.items, "service");
  ids(err, "services.items", items);
  items.forEach((x, i) => {
    onlyKeys(x, ["id", "title", "line", "bring", "topic"], `services.items[${i}]`, err);
    text(err, `services.items[${i}].title`, x?.title);
    text(err, `services.items[${i}].line`, x?.line);
    lines(err, `services.items[${i}].bring`, x?.bring);
    if (x?.topic !== undefined && !topics.has(x.topic)) err(`services.items[${i}].topic`, `"${x.topic}" isn't one of topics.items`);
  });
}

/** @param {any} a @param {string} mode @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkAdvisers(a, mode, err, exists) {
  if (!isObj(a)) { err("advisers", "{ items }"); return; }
  onlyKeys(a, ["items"], "advisers", err);
  const items = list(err, "advisers.items", a.items, "adviser");
  ids(err, "advisers.items", items);
  items.forEach((x, i) => {
    const at = `advisers.items[${i}]`;
    onlyKeys(x, ["id", "name", "role", "irn", "registerUrl", "letters", "line", "photo"], at, err);
    for (const k of ["name", "role"]) text(err, `${at}.${k}`, x?.[k]);
    fcaNumber(x?.irn, `${at}.irn`, mode, err, "irn");
    if (x?.registerUrl !== undefined) registerLink(x.registerUrl, `${at}.registerUrl`, mode, err);
    for (const k of ["letters", "line"]) if (x?.[k] !== undefined) text(err, `${at}.${k}`, x[k]);
    if (x?.photo !== undefined) photo(err, `${at}.photo`, x.photo, exists);
  });
}

/** @param {any} f @param {Report} err */
function checkFees(f, err) {
  if (!isObj(f)) { err("fees", "{ schedule, example, presets, includes, paid, vat, other }"); return; }
  onlyKeys(f, ["intro", "schedule", "example", "presets", "includes", "paid", "vat", "other", "extras"], "fees", err);
  const p = scheduleProblem(f.schedule);
  if (p) err("fees.schedule", p);
  const inRange = (/** @type {any} */ n) => Number.isInteger(n) && n > 0 && (f.schedule?.from === undefined || n >= f.schedule.from) && (f.schedule?.to === undefined || n <= f.schedule.to);
  if (!inRange(f.example)) err("fees.example", "the amount the statement opens on, in whole pounds, inside the schedule's from and to");
  list(err, "fees.presets", f.presets, "amount").forEach((n, i) => { if (!inRange(n)) err(`fees.presets[${i}]`, "whole pounds inside the schedule's from and to"); });
  if (Array.isArray(f.presets) && f.presets.length > 5) err("fees.presets", "five amounts at most");
  for (const k of ["intro", "paid", "vat", "other"]) text(err, `fees.${k}`, f[k]);
  if (isStr(f.other) && !/platform|fund/i.test(f.other)) err("fees.other", "must say how platform and fund charges are charged (separately, and shown before the client decides)");
  lines(err, "fees.includes", f.includes);
  if (f.extras !== undefined) list(err, "fees.extras", f.extras, "fee").forEach((x, i) => {
    onlyKeys(x, ["label", "fee"], `fees.extras[${i}]`, err);
    text(err, `fees.extras[${i}].label`, x?.label);
    text(err, `fees.extras[${i}].fee`, x?.fee);
  });
}

/** @param {any} m @param {Report} err */
function checkMeeting(m, err) {
  if (!isObj(m)) { err("meeting", "{ title, intro, length, where, bring }"); return; }
  onlyKeys(m, ["title", "intro", "length", "where", "bring", "after"], "meeting", err);
  for (const k of ["title", "intro", "length", "after"]) text(err, `meeting.${k}`, m[k]);
  lines(err, "meeting.where", m.where);
  lines(err, "meeting.bring", m.bring);
  if (Array.isArray(m.bring) && m.bring.length > 12) err("meeting.bring", "twelve things at most");
}

/** The firm's own secure upload: a link only; the website never receives a file. @param {any} u @param {Report} err */
function checkUpload(u, err) {
  if (!isObj(u)) { err("upload", "{ url, name, line }"); return; }
  onlyKeys(u, ["url", "name", "line"], "upload", err);
  if (!/^https:\/\/[^\s]+$/.test(u.url ?? "")) err("upload.url", "the firm's own secure portal or upload link, https://…");
  text(err, "upload.name", u.name);
  text(err, "upload.line", u.line);
}

/** @param {any} y @param {Report} err */
function checkYear(y, err) {
  if (!isObj(y)) { err("year", "{ intro, steps, note }"); return; }
  onlyKeys(y, ["intro", "steps", "note", "adviserLeaves"], "year", err);
  for (const k of ["intro", "note", "adviserLeaves"]) text(err, `year.${k}`, y[k]);
  list(err, "year.steps", y.steps, "step").forEach((s, i) => {
    onlyKeys(s, ["when", "what"], `year.steps[${i}]`, err);
    text(err, `year.steps[${i}].when`, s?.when);
    text(err, `year.steps[${i}].what`, s?.what);
  });
}

/** Topic pages (pensions, inheritance tax…): general information, then how the firm helps. @param {any} t @param {Report} err @param {((rel: string) => boolean)|undefined} exists @returns {Set<string>} */
function checkTopics(t, err, exists) {
  if (!isObj(t)) { err("topics", "{ items }"); return new Set(); }
  onlyKeys(t, ["items"], "topics", err);
  const items = list(err, "topics.items", t.items, "topic");
  const set = ids(err, "topics.items", items);
  items.forEach((x, i) => {
    const at = `topics.items[${i}]`;
    onlyKeys(x, ["id", "title", "intro", "photo", "body", "help", "regulated", "checked", "sources"], at, err);
    for (const k of ["title", "intro"]) text(err, `${at}.${k}`, x?.[k]);
    lines(err, `${at}.body`, x?.body);
    lines(err, `${at}.help`, x?.help);
    if (typeof x?.regulated !== "boolean") err(`${at}.regulated`, "true if the FCA regulates this advice; false (e.g. tax or estate planning) and the page says so");
    if (!YMD.test(x?.checked ?? "")) err(`${at}.checked`, "the date the facts were last checked, YYYY-MM-DD");
    sources(err, `${at}.sources`, x?.sources);
    if (x?.photo !== undefined) photo(err, `${at}.photo`, x.photo, exists);
  });
  return set;
}

/** @param {Report} err @param {string} at @param {any} v */
function sources(err, at, v) {
  list(err, at, v, "source").forEach((s, i) => {
    onlyKeys(s, ["label", "url"], `${at}[${i}]`, err);
    text(err, `${at}[${i}].label`, s?.label);
    if (!/^https:\/\/[^\s]+$/.test(s?.url ?? "")) err(`${at}[${i}].url`, "https://…");
  });
}

/** Life-event guides: steps and what to have ready; general information, dated and sourced. @param {any} g @param {Report} err @param {((rel: string) => boolean)|undefined} exists @returns {Set<string>} */
function checkGuides(g, err, exists) {
  if (!isObj(g)) { err("guides", "{ title, intro, items }"); return new Set(); }
  onlyKeys(g, ["title", "intro", "items"], "guides", err);
  text(err, "guides.title", g.title);
  text(err, "guides.intro", g.intro);
  const items = list(err, "guides.items", g.items, "guide");
  const set = ids(err, "guides.items", items);
  items.forEach((x, i) => {
    const at = `guides.items[${i}]`;
    onlyKeys(x, ["id", "title", "intro", "photo", "steps", "ready", "checked", "sources"], at, err);
    for (const k of ["title", "intro"]) text(err, `${at}.${k}`, x?.[k]);
    list(err, `${at}.steps`, x?.steps, "step").forEach((s, j) => {
      onlyKeys(s, ["title", "text"], `${at}.steps[${j}]`, err);
      text(err, `${at}.steps[${j}].title`, s?.title);
      text(err, `${at}.steps[${j}].text`, s?.text);
    });
    lines(err, `${at}.ready`, x?.ready);
    if (!YMD.test(x?.checked ?? "")) err(`${at}.checked`, "the date the facts were last checked, YYYY-MM-DD");
    sources(err, `${at}.sources`, x?.sources);
    if (x?.photo !== undefined) photo(err, `${at}.photo`, x.photo, exists);
  });
  return set;
}

/** The journal: the firm's own articles, each signed off by compliance before it shows. @param {any} j @param {Report} err */
function checkJournal(j, err) {
  if (!isObj(j)) { err("journal", "{ title, intro, items }"); return; }
  onlyKeys(j, ["title", "intro", "items"], "journal", err);
  text(err, "journal.title", j.title);
  text(err, "journal.intro", j.intro);
  const items = list(err, "journal.items", j.items, "article");
  ids(err, "journal.items", items);
  items.forEach((x, i) => {
    const at = `journal.items[${i}]`;
    onlyKeys(x, ["id", "title", "date", "summary", "body", "author", "approvedBy", "approvedOn"], at, err);
    for (const k of ["title", "summary", "author", "approvedBy"]) text(err, `${at}.${k}`, x?.[k]);
    lines(err, `${at}.body`, x?.body);
    if (!YMD.test(x?.date ?? "")) err(`${at}.date`, "YYYY-MM-DD");
    if (!YMD.test(x?.approvedOn ?? "")) err(`${at}.approvedOn`, "the date compliance approved it, YYYY-MM-DD");
    else if (YMD.test(x?.date ?? "") && x.approvedOn > x.date) err(`${at}.approvedOn`, "compliance approves an article before it's published");
  });
}
