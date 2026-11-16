// @ts-check
/**
 * Validation for the bridalbeauty kit (bridal hair and makeup artists): the cover (its photo, an optional cut-out so
 * the name passes behind her head), the packages, the date check and its sheet, the morning worked back, the party
 * quote, the look library, the trial, travel by postcode, "before I arrive" and the skin prep countdown. Every price,
 * minute and rule is the artist's own; the checks make sure it is complete and can't mislead. A misspelt setting is
 * refused rather than silently ignored, and simulated data is refused on a client site.
 */

/** @typedef {(path: string, msg: string) => void} Report */
/** @typedef {((rel: string) => boolean)|undefined} Exists */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
/** @param {any} v @param {number} lo @param {number} hi */
const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const ID = /^[a-z0-9-]{1,40}$/;
const HM = /^([01]\d|2[0-3]):[0-5]\d$/;
const DISTRICT = /^[A-Z]{1,2}\d[A-Z\d]?\*?$|^[A-Z]{1,2}\*$/;
const PHOTO = ["src", "width", "height", "alt"];
const PAGE_HEAD = ["title", "intro"];
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
/** Pages the kit already builds, so a guide or journal piece can't take their address. */
const TAKEN = ["index", "privacy", "404", "bridal", "looks", "trials", "morning", "skin", "visit", "journal", "guide", "article"];
export const BLOCKS = ["text", "facts", "quote", "looks", "questions", "list", "photo", "ask"];

/** The finishes and hair a look is filed under (the look library's filters). */
export const FINISH = { natural: "Natural", soft: "Soft glam", full: "Full glam", editorial: "Editorial" };
export const HAIR = { up: "Up", half: "Half up", down: "Down", sleek: "Sleek", veil: "Under a veil", hijab: "Hijab styling" };

/** @param {Report} err @param {string} path @param {any} v */
function text(err, path, v) { if (!isStr(v)) err(path, "required text is missing"); }

/** @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (isObj(o)) for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}

/** @param {Report} err @param {string} path @param {any} p @param {Exists} exists */
function photo(err, path, p, exists) {
  if (!isObj(p)) { err(path, "a photo: { src, width, height, alt }"); return; }
  onlyKeys(p, PHOTO, path, err);
  text(err, `${path}.alt`, p.alt);
  if (!isInt(p.width, 1, 10000) || !isInt(p.height, 1, 10000)) err(path, "width and height in pixels");
  if (!isStr(p.src)) err(`${path}.src`, "required");
  else if (exists && !exists(p.src)) err(`${path}.src`, `file not found: ${p.src}`);
}

/** Unique ids in a list. @param {Report} err @param {string} path @param {any[]} list @returns {Set<string>} */
function ids(err, path, list) {
  /** @type {Set<string>} */ const seen = new Set();
  list.forEach((x, i) => {
    if (!ID.test(x?.id ?? "")) err(`${path}[${i}].id`, "lowercase letters, numbers and dashes");
    else if (seen.has(x.id)) err(`${path}[${i}].id`, `"${x.id}" is used twice`);
    seen.add(x?.id);
  });
  return seen;
}

/** @param {Report} err @param {string} p @param {any} v @param {string} what */
function list(err, p, v, what, lo = 1, hi = 8) {
  if (!Array.isArray(v) || v.length < lo || v.length > hi) { err(p, `${lo} to ${hi} ${what}`); return false; }
  return true;
}

/** @param {Report} err @param {string} k @param {any} v @param {string[]} [more] */
function pageHead(err, k, v, more = []) {
  if (!isObj(v)) { err(k, "{ title, intro }"); return; }
  onlyKeys(v, [...PAGE_HEAD, ...more], k, err);
  text(err, `${k}.title`, v.title);
}

/** The pages each plan includes, counting home (as in src/features/registry.js; not imported, since the registry loads the kits). */
const PAGE_LIMITS = { starter: 1, plus: 5, signature: Infinity };

/**
 * @param {any} site @param {Report} err @param {Exists} [exists]
 * @param {{ id: string, page?: string }[]} [own] the kit's features, for counting its pages
 */
export function checkBridalBeauty(site, err, exists, own = []) {
  if (site.kit !== "bridalbeauty") return;
  checkHero(site.hero, err, exists);
  if (site.packages !== undefined) checkPackages(site.packages, err);
  if (site.dateCheck !== undefined) checkDates(site.dateCheck, site.mode, err);
  if (site.morning !== undefined) checkMorning(site.morning, err);
  if (site.party !== undefined) checkParty(site.party, site.packages, err, exists);
  if (site.looks !== undefined) checkLooks(site.looks, err, exists);
  if (site.trial !== undefined) checkTrial(site.trial, err);
  if (site.travel !== undefined) checkTravel(site.travel, err);
  if (site.ready !== undefined) checkReady(site.ready, err);
  if (site.skin !== undefined) checkSkin(site.skin, err);
  for (const k of ["looksPage", "trialPage", "morningPage", "skinPage"]) if (site[k] !== undefined) pageHead(err, k, site[k]);
  if (site.bridalPage !== undefined) {
    pageHead(err, "bridalPage", site.bridalPage, ["photo", "terms"]);
    if (site.bridalPage?.photo !== undefined) photo(err, "bridalPage.photo", site.bridalPage.photo, exists);
    if (site.bridalPage?.terms !== undefined && list(err, "bridalPage.terms", site.bridalPage.terms, "booking terms in the artist's words"))
      site.bridalPage.terms.forEach((/** @type {any} */ t, /** @type {number} */ i) => text(err, `bridalPage.terms[${i}]`, t));
  }
  /** @type {Set<string>} */ const slugs = new Set();
  if (site.guides !== undefined) checkGuides(site, err, exists, slugs);
  if (site.journal !== undefined) checkJournal(site, err, exists, slugs);
  guidePages(site, err, own);
}

/**
 * The guide pages (Weddings abroad, the bridal party…) are a collection the shared count sees as one page, but each is
 * a page the client pays for, so they count one by one against the plan, like general pages. Every shared page this kit
 * offers is free (Plan your visit) or refused (work, team, custom pages), so the kit's own pages are the whole count.
 * @param {any} site @param {Report} err @param {{ id: string, page?: string }[]} own
 */
function guidePages(site, err, own) {
  if (!site.features?.includes("bridalbeauty-guides") || !Array.isArray(site.guides) || site.guides.length < 2) return;
  const limit = PAGE_LIMITS[/** @type {"starter"|"plus"|"signature"} */ (site.plan)];
  if (limit === undefined) return;
  const addons = Array.isArray(site.addons) ? site.addons : [];
  const pages = 1 + own.filter((f) => f.page && site.features.includes(f.id) && !addons.includes(f.id)).length + site.guides.length - 1;
  const extra = Number.isInteger(site.addonPages) ? site.addonPages : 0;
  if (pages > limit + extra) err("guides", `${pages} pages counting each guide page, but the ${site.plan} plan includes ${limit + extra}; remove a guide or sell more with "addonPages"`);
}

/** @param {Report} err @param {string} at @param {any} slug @param {Set<string>} slugs */
function slugOf(err, at, slug, slugs) {
  if (!isStr(slug) || !SLUG.test(slug) || TAKEN.includes(slug) || slug.startsWith("journal-")) err(at, `lowercase words and dashes, not ${TAKEN.join(", ")}`);
  else if (slugs.has(slug)) err(at, `"${slug}" is used twice`);
  else slugs.add(slug);
}

/**
 * A guide page or a journal piece: its blocks, each one of BLOCKS. Prices in a worked example come from the packages
 * by id, so a guide can never quote a price the bridal page doesn't; a line of its own (a travel day) names its price.
 * @param {any} site @param {Report} err @param {Exists} exists @param {string} at @param {any} blocks
 */
function checkBlocks(site, err, exists, at, blocks) {
  if (!list(err, at, blocks, "blocks", 2, 16)) return;
  const pkg = site.packages ?? {};
  const known = new Set([...(pkg.bride ?? []).map((/** @type {any} */ x) => `bride:${x.id}`), ...(pkg.party ?? []).map((/** @type {any} */ x) => `party:${x.id}`)]);
  const looks = new Set((site.looks?.items ?? []).map((/** @type {any} */ x) => x.id));
  blocks.forEach((/** @type {any} */ b, /** @type {number} */ i) => {
    const p = `${at}[${i}]`;
    if (!isObj(b) || !BLOCKS.includes(b.type)) { err(`${p}.type`, `one of ${BLOCKS.join(", ")}`); return; }
    const keys = { text: ["heading", "body"], facts: ["heading", "items"], quote: ["heading", "text", "lines", "note"], looks: ["heading", "ids"],
      questions: ["heading", "items"], list: ["heading", "items"], photo: [...PHOTO, "caption"], ask: ["text", "message", "label"] }[/** @type {"text"} */ (b.type)];
    onlyKeys(b, ["type", ...keys], p, err);
    if (b.heading !== undefined) text(err, `${p}.heading`, b.heading);
    if (b.type === "text") text(err, `${p}.body`, b.body);
    if (b.type === "facts" && list(err, `${p}.items`, b.items, "{ label, value } lines", 2, 8))
      b.items.forEach((/** @type {any} */ x, /** @type {number} */ j) => { onlyKeys(x, ["label", "value"], `${p}.items[${j}]`, err); text(err, `${p}.items[${j}].label`, x?.label); text(err, `${p}.items[${j}].value`, x?.value); });
    if (b.type === "list" && list(err, `${p}.items`, b.items, "lines", 2, 10)) b.items.forEach((/** @type {any} */ x, /** @type {number} */ j) => text(err, `${p}.items[${j}]`, x));
    if (b.type === "questions" && list(err, `${p}.items`, b.items, "{ q, a } questions", 2, 8))
      b.items.forEach((/** @type {any} */ x, /** @type {number} */ j) => { onlyKeys(x, ["q", "a"], `${p}.items[${j}]`, err); text(err, `${p}.items[${j}].q`, x?.q); text(err, `${p}.items[${j}].a`, x?.a); });
    if (b.type === "photo") { photo(err, p, Object.fromEntries(PHOTO.map((k) => [k, b[k]])), exists); if (b.caption !== undefined) text(err, `${p}.caption`, b.caption); }
    if (b.type === "ask") { text(err, `${p}.text`, b.text); text(err, `${p}.message`, b.message); if (b.label !== undefined) text(err, `${p}.label`, b.label); }
    if (b.type === "looks") {
      if (!site.features?.includes("bridalbeauty-looks")) err(p, "looks come from the look library: turn on bridalbeauty-looks");
      else if (list(err, `${p}.ids`, b.ids, "look ids from looks.items", 1, 4)) b.ids.forEach((/** @type {any} */ id, /** @type {number} */ j) => { if (!looks.has(id)) err(`${p}.ids[${j}]`, `"${id}" isn't in looks.items`); });
    }
    if (b.type === "quote") {
      text(err, `${p}.heading`, b.heading);
      if (b.text !== undefined) text(err, `${p}.text`, b.text);
      if (b.note !== undefined) text(err, `${p}.note`, b.note);
      if (list(err, `${p}.lines`, b.lines, "lines: { package: \"bride:<id>\" or \"party:<id>\", count? } or { name, price, count? }", 2, 8))
        b.lines.forEach((/** @type {any} */ l, /** @type {number} */ j) => {
          const q = `${p}.lines[${j}]`;
          onlyKeys(l, ["package", "name", "price", "count"], q, err);
          if (l?.count !== undefined && !isInt(l.count, 1, 20)) err(`${q}.count`, "a whole number, 1 to 20");
          if (l?.package !== undefined) { if (!known.has(l.package)) err(`${q}.package`, `one of ${[...known].join(", ")}`); if (l.name !== undefined || l.price !== undefined) err(q, "a package line takes its name and price from the packages"); }
          else { text(err, `${q}.name`, l?.name); if (!isInt(l?.price, 0, 20000)) err(`${q}.price`, "the artist's price in whole pounds"); }
        });
    }
  });
}

/** @param {any} site @param {Report} err @param {Exists} exists @param {Set<string>} slugs */
function checkGuides(site, err, exists, slugs) {
  if (!list(err, "guides", site.guides, "guide pages", 1, 12)) return;
  site.guides.forEach((/** @type {any} */ g, /** @type {number} */ i) => {
    const at = `guides[${i}]`;
    if (!isObj(g)) { err(at, "{ slug, title, description, intro, photo?, blocks }"); return; }
    onlyKeys(g, ["slug", "menu", "title", "description", "intro", "photo", "blocks"], at, err);
    slugOf(err, `${at}.slug`, g.slug, slugs);
    for (const k of ["menu", "title", "intro"]) text(err, `${at}.${k}`, g[k]);
    if (!isStr(g.description) || g.description.length > 160) err(`${at}.description`, "the sentence search results show, up to 160 characters");
    if (g.photo !== undefined) photo(err, `${at}.photo`, g.photo, exists);
    checkBlocks(site, err, exists, `${at}.blocks`, g.blocks);
  });
}

/** @param {any} site @param {Report} err @param {Exists} exists @param {Set<string>} slugs */
function checkJournal(site, err, exists, slugs) {
  const j = site.journal;
  if (!isObj(j)) { err("journal", "{ title, intro, items }"); return; }
  onlyKeys(j, ["title", "intro", "items"], "journal", err);
  text(err, "journal.title", j.title); text(err, "journal.intro", j.intro);
  if (!list(err, "journal.items", j.items, "pieces", 1, 30)) return;
  j.items.forEach((/** @type {any} */ a, /** @type {number} */ i) => {
    const at = `journal.items[${i}]`;
    if (!isObj(a)) { err(at, "{ slug, title, line, photo, blocks }"); return; }
    onlyKeys(a, ["slug", "title", "line", "minutes", "photo", "blocks"], at, err);
    slugOf(err, `${at}.slug`, a.slug, slugs);
    text(err, `${at}.title`, a.title);
    if (!isStr(a.line) || a.line.length > 160) err(`${at}.line`, "one sentence, up to 160 characters (search results show it)");
    if (a.minutes !== undefined && !isInt(a.minutes, 1, 30)) err(`${at}.minutes`, "minutes to read, 1 to 30");
    photo(err, `${at}.photo`, a.photo, exists);
    checkBlocks(site, err, exists, `${at}.blocks`, a.blocks);
  });
}

/**
 * The cover: one finished bride, full-bleed. The name sits above her head unless `cutout` (the same photo with
 * everything but her head and hair made transparent) lets it pass behind; `focus` frames her on a wide screen and a
 * phone ("x% y%", like CSS object-position).
 * @param {any} h @param {Report} err @param {Exists} exists
 */
function checkHero(h, err, exists) {
  if (!isObj(h)) { err("hero", "the cover: { kicker, star, photo, focus?, cutout? }"); return; }
  onlyKeys(h, ["kicker", "title", "intro", "star", "photo", "focus", "cutout"], "hero", err);
  text(err, "hero.kicker", h.kicker);
  text(err, "hero.star", h.star);
  photo(err, "hero.photo", h.photo, exists);
  if (h.focus !== undefined) {
    onlyKeys(h.focus, ["wide", "phone"], "hero.focus", err);
    for (const k of ["wide", "phone"]) if (h.focus?.[k] !== undefined && !/^\d{1,3}% \d{1,3}%$/.test(h.focus[k])) err(`hero.focus.${k}`, 'where her face sits, "x% y%" (e.g. "50% 30%")');
  }
  if (h.cutout !== undefined) {
    if (!isObj(h.cutout)) { err("hero.cutout", "{ src }: the cover photo with only her head and hair kept (WebP with transparency, same size)"); return; }
    onlyKeys(h.cutout, ["src"], "hero.cutout", err);
    if (!isStr(h.cutout.src) || !/\.webp$/.test(h.cutout.src)) err("hero.cutout.src", "a WebP with transparency, the same size as hero.photo");
    else if (exists && !exists(h.cutout.src)) err("hero.cutout.src", `file not found: ${h.cutout.src}`);
  }
}

/** @param {Report} err @param {string} q @param {any} x @param {string[]} more */
function service(err, q, x, more = []) {
  onlyKeys(x, ["id", "name", "text", "minutes", "price", ...more], q, err);
  text(err, `${q}.name`, x?.name);
  text(err, `${q}.text`, x?.text);
  if (!isInt(x?.minutes, 15, 300) || x.minutes % 5) err(`${q}.minutes`, "minutes in the chair, 15 to 300, in fives, as the artist says");
  if (!isInt(x?.price, 1, 5000)) err(`${q}.price`, "the artist's price in whole pounds");
}

/** @param {any} p @param {Report} err */
function checkPackages(p, err) {
  if (!isObj(p)) { err("packages", "{ message, bride, party, extras? }"); return; }
  onlyKeys(p, ["message", "bride", "party", "extras", "note"], "packages", err);
  text(err, "packages.message", p.message);
  if (list(err, "packages.bride", p.bride, "bridal services (hair and makeup, makeup, hair), each with the trial", 1, 4)) {
    ids(err, "packages.bride", p.bride);
    p.bride.forEach((/** @type {any} */ x, /** @type {number} */ i) => service(err, `packages.bride[${i}]`, x));
  }
  if (list(err, "packages.party", p.party, "party services (bridesmaids, mothers, children)", 1, 6)) {
    ids(err, "packages.party", p.party);
    p.party.forEach((/** @type {any} */ x, /** @type {number} */ i) => service(err, `packages.party[${i}]`, x));
  }
  if (p.extras !== undefined && list(err, "packages.extras", p.extras, "extras (stay for touch-ups, an evening restyle…)", 0, 6))
    p.extras.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
      const q = `packages.extras[${i}]`;
      onlyKeys(x, ["name", "text", "price", "from"], q, err);
      text(err, `${q}.name`, x?.name);
      text(err, `${q}.text`, x?.text);
      if (!isInt(x?.price, 1, 5000)) err(`${q}.price`, "the artist's price in whole pounds");
    });
  if (p.note !== undefined) text(err, "packages.note", p.note);
}

/** @param {any} d @param {string} mode @param {Report} err */
function checkDates(d, mode, err) {
  if (!isObj(d)) { err("dateCheck", "{ source, csvUrl, message, lead? }"); return; }
  onlyKeys(d, ["source", "csvUrl", "staleAfterDays", "message", "lead"], "dateCheck", err);
  if (!["sheet", "simulated"].includes(d.source)) err("dateCheck.source", 'must be "sheet" (or "simulated" on demo sites)');
  if (d.source === "simulated" && mode !== "demo") err("dateCheck.source", 'simulated data is only allowed on demo sites; use "sheet"');
  if (d.source === "sheet" && !/^https:\/\/docs\.google\.com\/spreadsheets\/.+output=csv/.test(d.csvUrl ?? "")) err("dateCheck.csvUrl", "must be a published Google Sheet CSV link (File → Share → Publish to web → CSV)");
  if (d.source === "simulated" && d.csvUrl !== undefined) err("dateCheck.csvUrl", "only with a sheet");
  if (d.staleAfterDays !== undefined && !isInt(d.staleAfterDays, 1, 90)) err("dateCheck.staleAfterDays", "whole days, 1–90: older than this, the cover asks the bride to message instead");
  text(err, "dateCheck.message", d.message);
  if (d.lead !== undefined) text(err, "dateCheck.lead", d.lead);
}

/** @param {any} m @param {Report} err */
function checkMorning(m, err) {
  if (!isObj(m)) { err("morning", "{ message, ceremony, travelMinutes, dressMinutes, bufferMinutes, earlyStart, secondArtist? }"); return; }
  onlyKeys(m, ["message", "ceremony", "travelMinutes", "dressMinutes", "bufferMinutes", "earlyStart", "secondArtist", "text"], "morning", err);
  text(err, "morning.message", m.message);
  if (m.text !== undefined) text(err, "morning.text", m.text);
  const c = m.ceremony;
  if (!isObj(c)) err("morning.ceremony", '{ default: "14:00", times: ["12:00", …] }');
  else {
    onlyKeys(c, ["default", "times"], "morning.ceremony", err);
    if (!Array.isArray(c.times) || c.times.length < 2 || c.times.length > 16 || !c.times.every((/** @type {any} */ t) => HM.test(t) && t >= "09:00" && t <= "18:00"))
      err("morning.ceremony.times", 'two to sixteen ceremony times, "HH:MM", 09:00 to 18:00');
    else if (!c.times.includes(c.default)) err("morning.ceremony.default", "one of the times");
  }
  for (const [k, lo, hi] of /** @type {[string, number, number][]} */ ([["travelMinutes", 0, 120], ["dressMinutes", 10, 90], ["bufferMinutes", 0, 60]]))
    if (!isInt(m[k], lo, hi)) err(`morning.${k}`, `whole minutes, ${lo} to ${hi}`);
  const e = m.earlyStart;
  if (!isObj(e) || !HM.test(e.before ?? "") || !isInt(e.fee, 0, 500)) err("morning.earlyStart", '{ before: "07:00", fee: 40 }: the artist\'s fee for a start before that time (0 if none)');
  else onlyKeys(e, ["before", "fee"], "morning.earlyStart", err);
  if (m.secondArtist !== undefined) {
    const s = m.secondArtist;
    if (!isObj(s) || !HM.test(s.earliest ?? "") || !isInt(s.fee, 1, 2000)) err("morning.secondArtist", '{ earliest: "05:30", fee: 150 }: a second artist joins when one would start before `earliest`');
    else onlyKeys(s, ["earliest", "fee"], "morning.secondArtist", err);
  }
}

/** @param {any} p @param {any} packages @param {Report} err @param {Exists} exists */
function checkParty(p, packages, err, exists) {
  if (!isObj(p)) { err("party", "{ message, start, max }"); return; }
  onlyKeys(p, ["message", "start", "max", "text", "photo", "caption"], "party", err);
  if (p.photo !== undefined) photo(err, "party.photo", p.photo, exists);
  if (p.caption !== undefined) text(err, "party.caption", p.caption);
  text(err, "party.message", p.message);
  if (p.text !== undefined) text(err, "party.text", p.text);
  if (!isInt(p.max, 1, 20)) err("party.max", "the most people the artist takes besides the bride, 1 to 20");
  const known = new Set((packages?.party ?? []).map((/** @type {any} */ x) => x.id));
  if (!isObj(p.start)) err("party.start", "how many of each party service the quote starts with: { <packages.party id>: count }");
  else for (const [k, v] of Object.entries(p.start)) {
    if (!known.has(k)) err(`party.start.${k}`, "not one of packages.party");
    if (!isInt(v, 0, 20)) err(`party.start.${k}`, "a whole number");
  }
}

/** @param {any} l @param {Report} err @param {Exists} exists */
function checkLooks(l, err, exists) {
  if (!isObj(l)) { err("looks", "{ message, season, items }"); return; }
  onlyKeys(l, ["message", "season", "items"], "looks", err);
  text(err, "looks.message", l.message);
  if (!list(err, "looks.items", l.items, "looks, each { id, name, finish, hair, minutes, photo }", 4, 30)) return;
  const seen = ids(err, "looks.items", l.items);
  l.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const q = `looks.items[${i}]`;
    onlyKeys(x, ["id", "name", "finish", "hair", "minutes", "text", "photo"], q, err);
    text(err, `${q}.name`, x?.name);
    if (!(x?.finish in FINISH)) err(`${q}.finish`, `one of: ${Object.keys(FINISH).join(", ")}`);
    if (!(x?.hair in HAIR)) err(`${q}.hair`, `one of: ${Object.keys(HAIR).join(", ")}`);
    if (!isInt(x?.minutes, 15, 300)) err(`${q}.minutes`, "minutes in the chair");
    if (x?.text !== undefined) text(err, `${q}.text`, x.text);
    photo(err, `${q}.photo`, x?.photo, exists);
  });
  if (!Array.isArray(l.season) || l.season.length !== 4 || !l.season.every((/** @type {any} */ s) => seen.has(s)) || new Set(l.season).size !== 4)
    err("looks.season", "the four looks on the home page, by id");
}

/** @param {any} t @param {Report} err */
function checkTrial(t, err) {
  if (!isObj(t)) { err("trial", "{ message, price, minutes, earliestWeeks, latestWeeks, where, bring, text }"); return; }
  onlyKeys(t, ["message", "price", "minutes", "earliestWeeks", "latestWeeks", "where", "bring", "text", "guests"], "trial", err);
  text(err, "trial.message", t.message);
  text(err, "trial.text", t.text);
  if (!isInt(t.price, 0, 1000)) err("trial.price", "the trial's price in whole pounds (0 if it's part of the package)");
  if (!isInt(t.minutes, 30, 300)) err("trial.minutes", "how long the trial takes, in minutes");
  if (!isInt(t.earliestWeeks, 2, 78) || !isInt(t.latestWeeks, 0, 52) || t.latestWeeks >= t.earliestWeeks) err("trial", "earliestWeeks and latestWeeks: the window before the wedding, earliest first (e.g. 24 and 4)");
  if (list(err, "trial.where", t.where, "places for the trial (the studio, your home…)", 1, 4)) t.where.forEach((/** @type {any} */ w, /** @type {number} */ i) => text(err, `trial.where[${i}]`, w));
  if (list(err, "trial.bring", t.bring, "things to bring", 1, 8)) t.bring.forEach((/** @type {any} */ w, /** @type {number} */ i) => text(err, `trial.bring[${i}]`, w));
  if (t.guests !== undefined) text(err, "trial.guests", t.guests);
}

/** @param {any} t @param {Report} err */
function checkTravel(t, err) {
  if (!isObj(t)) { err("travel", "{ message, base, free, zones, note }"); return; }
  onlyKeys(t, ["message", "base", "free", "zones", "note"], "travel", err);
  text(err, "travel.message", t.message);
  text(err, "travel.note", t.note);
  if (!DISTRICT.test(t.base ?? "") || String(t.base).includes("*")) err("travel.base", 'the district the artist travels from, e.g. "SW4"');
  const district = (/** @type {string} */ p, /** @type {any} */ v) => { if (!Array.isArray(v) || !v.length || !v.every((/** @type {any} */ x) => DISTRICT.test(x))) err(p, 'postcode districts, e.g. ["SW4", "SW9"] (a trailing * covers a whole area: "CR*")'); };
  district("travel.free", t.free);
  if (!Array.isArray(t.zones) || t.zones.length > 6) err("travel.zones", "up to six { districts, fee } zones");
  else t.zones.forEach((/** @type {any} */ z, /** @type {number} */ i) => {
    onlyKeys(z, ["districts", "fee"], `travel.zones[${i}]`, err);
    district(`travel.zones[${i}].districts`, z?.districts);
    if (!isInt(z?.fee, 1, 1000)) err(`travel.zones[${i}].fee`, "the artist's travel fee in whole pounds");
  });
}

/** @param {any} r @param {Report} err */
function checkReady(r, err) {
  if (!isObj(r)) { err("ready", "{ message, items }"); return; }
  onlyKeys(r, ["message", "items"], "ready", err);
  text(err, "ready.message", r.message);
  if (list(err, "ready.items", r.items, "things to have ready", 3, 8)) r.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => text(err, `ready.items[${i}]`, x));
}

/** @param {any} s @param {Report} err */
function checkSkin(s, err) {
  if (!isObj(s)) { err("skin", "{ message, steps, note }"); return; }
  onlyKeys(s, ["message", "steps", "note"], "skin", err);
  text(err, "skin.message", s.message);
  text(err, "skin.note", s.note);
  if (!/clinician|doctor|dermatologist|pharmacist/i.test(s.note ?? "")) err("skin.note", "say that treatments are a question for a clinician (skin advice here is the artist's, not medical)");
  if (!list(err, "skin.steps", s.steps, "steps, each { id, label, daysBefore, text }", 3, 10)) return;
  ids(err, "skin.steps", s.steps);
  s.steps.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const q = `skin.steps[${i}]`;
    onlyKeys(x, ["id", "label", "daysBefore", "text"], q, err);
    text(err, `${q}.label`, x?.label);
    text(err, `${q}.text`, x?.text);
    if (!isInt(x?.daysBefore, 0, 365)) err(`${q}.daysBefore`, "days before the wedding, 0 to 365");
  });
}
