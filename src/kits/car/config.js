// @ts-check
/**
 * Validation for the car studio settings: vehicles, jobs, tint, wrap, Showroom, protection planner, quote,
 * aftercare, next free bay and the model finder. Unknown keys are refused so a typo can't silently switch
 * something off; demo-only values are refused on client sites.
 */

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
const TAG = /^[a-z0-9_]+$/;
const HEX = /^#[0-9a-f]{6}$/i;

/** The photos and traced panels that exist (same lists as src/kits/car/lib/bodies.js; a unit test keeps them equal). */
export const CAR_BODIES = ["hatch", "saloon", "suv", "van", "supercar"];
export const CAR_PANELS = ["bumper", "lights", "grille", "bonnet", "wings", "mirrors", "doors", "sills", "roof", "quarters", "taillights", "rear"];
const FINISHES = ["gloss", "satin", "matte", "chrome"];
const WINDOWS = ["rear", "fronts", "windscreen"];

/** @param {Record<string, any>} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}

/**
 * A list of objects, each with an id unique in the list.
 * @param {any} list @param {string} at @param {Report} err @param {(item: any, at: string) => void} each @returns {Set<string>} the ids
 */
function idList(list, at, err, each) {
  /** @type {Set<string>} */
  const ids = new Set();
  if (!Array.isArray(list) || !list.length) { err(at, "a non-empty list"); return ids; }
  list.forEach((item, i) => {
    const p = `${at}[${i}]`;
    if (!isObj(item)) { err(p, "an object"); return; }
    if (item.id !== undefined) {
      if (!SLUG.test(item.id)) err(`${p}.id`, "lowercase letters, numbers and dashes");
      else if (ids.has(item.id)) err(`${p}.id`, `"${item.id}" is used twice`);
      ids.add(item.id);
    }
    each(item, p);
  });
  return ids;
}

/** @param {any} site @param {Report} err */
export function checkCar(site, err) {
  if (site.messages?.likeThis !== undefined && !isStr(site.messages.likeThis)) err("messages.likeThis", 'the WhatsApp opening line under an enlarged photo, e.g. "Hi, can I get this done on my car"');
  if (site.kit !== "car") return;
  const vehicles = site.vehicles === undefined ? new Set() : idList(site.vehicles, "vehicles", err, (v, at) => {
    onlyKeys(v, ["id", "name", "body", "example"], at, err);
    if (!isStr(v.name)) err(`${at}.name`, 'what customers call it, e.g. "Saloon or estate"');
    if (!CAR_BODIES.includes(v.body)) err(`${at}.body`, `the vehicle's shape, for its pictures: ${CAR_BODIES.join(", ")}`);
    if (v.example !== undefined && !isStr(v.example)) err(`${at}.example`, 'a few models, e.g. "3 Series, A4, C-Class"');
  });
  const jobs = site.jobs === undefined ? new Set() : idList(site.jobs, "jobs", err, (j, at) => {
    onlyKeys(j, ["id", "name", "prices", "hours", "note"], at, err);
    if (!isStr(j.name)) err(`${at}.name`, "required");
    for (const k of ["prices", "hours"]) {
      if (!isObj(j[k])) { err(`${at}.${k}`, `one ${k === "prices" ? "price in pounds" : "time in hours"} per vehicle id`); continue; }
      for (const v of vehicles) if (!isNum(j[k][v], k === "prices" ? 1 : 0.25, k === "prices" ? 50_000 : 400)) err(`${at}.${k}.${v}`, k === "prices" ? "the studio's price in pounds" : "the studio's time in hours, e.g. 2.5");
      for (const v of Object.keys(j[k])) if (!vehicles.has(v)) err(`${at}.${k}.${v}`, "not a vehicle id");
    }
    if (j.note !== undefined && !isStr(j.note)) err(`${at}.note`, "text");
  });
  /** @param {any} id @param {string} at */
  const jobRef = (id, at) => { if (!jobs.has(id)) err(at, `"${id}" isn't a job id`); };
  checkTintWrap(site, err, jobRef);
  checkShowroom(site, err, jobRef, vehicles);
  checkProtection(site.protection, err, jobRef);
  checkServicePages(site, err);
  checkBay(site, err);
  checkModels(site.models, err, jobRef, vehicles);
}

/** @param {string} w @param {any} id @param {Report} err @param {(id: any, at: string) => void} jobRef */
function checkWindowJob(w, id, err, jobRef) {
  if (!WINDOWS.includes(w)) err(`tint.jobs.${w}`, `one of ${WINDOWS.join(", ")}`);
  else jobRef(id, `tint.jobs.${w}`);
}

/** @param {any} site @param {Report} err @param {(id: any, at: string) => void} jobRef */
function checkTintWrap(site, err, jobRef) {
  const t = site.tint;
  if (t !== undefined) {
    if (!isObj(t)) err("tint", "{ shades, jobs, measured }");
    else {
      onlyKeys(t, ["shades", "jobs", "measured"], "tint", err);
      idList(t.shades, "tint.shades", err, (s, at) => {
        onlyKeys(s, ["id", "name", "light", "sheen"], at, err);
        if (!isStr(s.name)) err(`${at}.name`, 'as the studio says it, e.g. "35%"');
        if (s.sheen !== undefined && !HEX.test(s.sheen)) err(`${at}.sheen`, "a chameleon film's colour cast, #RRGGBB");
        if (!isInt(s.light, 1, 100)) err(`${at}.light`, "percent of light through the glass once fitted, as the studio measures it (1–100)");
      });
      if (!isObj(t.jobs) || !Object.keys(t.jobs).length) err("tint.jobs", '{ "rear": "<job id>", "fronts": "<job id>", "windscreen"?: "<job id>" }');
      else for (const [w, id] of Object.entries(t.jobs)) checkWindowJob(w, id, err, jobRef);
      if (!isStr(t.measured)) err("tint.measured", 'how the studio measures light through the glass, e.g. "with our light meter on the car, after fitting"');
    }
  }
  const w = site.wrap;
  if (w === undefined) return;
  if (!isObj(w)) { err("wrap", "{ colours, finishes }"); return; }
  onlyKeys(w, ["colours", "finishes"], "wrap", err);
  idList(w.colours, "wrap.colours", err, (c, at) => {
    onlyKeys(c, ["id", "name", "hex"], at, err);
    if (!isStr(c.name)) err(`${at}.name`, "the film's colour name");
    if (!HEX.test(c.hex ?? "")) err(`${at}.hex`, "#RRGGBB");
  });
  idList(w.finishes, "wrap.finishes", err, (f, at) => {
    onlyKeys(f, ["id", "name", "job", "note"], at, err);
    if (!FINISHES.includes(f.id)) err(`${at}.id`, `one of ${FINISHES.join(", ")} (the swatches and the Showroom draw these)`);
    if (!isStr(f.name)) err(`${at}.name`, "required");
    jobRef(f.job, `${at}.job`);
    if (f.note !== undefined && !isStr(f.note)) err(`${at}.note`, "text");
  });
}

/** @param {any} site @param {Report} err @param {(id: any, at: string) => void} jobRef @param {Set<string>} vehicles */
function checkShowroom(site, err, jobRef, vehicles) {
  const s = site.showroom;
  if (s === undefined) return;
  if (!isObj(s)) { err("showroom", "{ wheels?, dechrome?, start? }"); return; }
  onlyKeys(s, ["wheels", "dechrome", "start"], "showroom", err);
  if (s.wheels !== undefined) {
    if (!isObj(s.wheels)) err("showroom.wheels", "{ job, colours }");
    else {
      onlyKeys(s.wheels, ["job", "colours"], "showroom.wheels", err);
      jobRef(s.wheels.job, "showroom.wheels.job");
      idList(s.wheels.colours, "showroom.wheels.colours", err, (c, at) => { onlyKeys(c, ["id", "name", "hex"], at, err); if (!isStr(c.name) || !HEX.test(c.hex ?? "")) err(at, "{ id, name, hex: #RRGGBB }"); });
    }
  }
  if (s.dechrome !== undefined) jobRef(s.dechrome, "showroom.dechrome");
  if (s.start !== undefined) checkStart(site, err, vehicles);
}

/** The first build's shades exist and are legal on the front. @param {Record<string, any>} tint @param {any[]} shades @param {Report} err */
function checkStartTint(tint, shades, err) {
  for (const [w, id] of Object.entries(tint)) {
    const shade = shades.find((/** @type {any} */ x) => x.id === id);
    if (!shade) err(`showroom.start.tint.${w}`, "a shade id");
    else if ((w === "fronts" && shade.light < 70) || (w === "windscreen" && shade.light < 75)) err(`showroom.start.tint.${w}`, "the first build must be legal (front side windows 70%+, windscreen 75%+)");
  }
}

/** The Showroom's first build: real choices, and legal. @param {any} site @param {Report} err @param {Set<string>} vehicles */
function checkStart(site, err, vehicles) {
  const s = site.showroom;
  const st = s.start;
  if (!isObj(st)) { err("showroom.start", "the first build shown"); return; }
  onlyKeys(st, ["vehicle", "tint", "wrap", "wheels", "dechrome"], "showroom.start", err);
  if (st.vehicle !== undefined && !vehicles.has(st.vehicle)) err("showroom.start.vehicle", "a vehicle id");
  checkStartTint(st.tint ?? {}, site.tint?.shades ?? [], err);
  if (st.wrap !== undefined && !(site.wrap?.colours?.some((/** @type {any} */ c) => c.id === st.wrap?.colour) && site.wrap?.finishes?.some((/** @type {any} */ f) => f.id === st.wrap?.finish))) err("showroom.start.wrap", "{ colour, finish } from wrap");
  if (st.wheels !== undefined && !s.wheels?.colours?.some((/** @type {any} */ c) => c.id === st.wheels)) err("showroom.start.wheels", "a wheel colour id");
}

/** @param {any} p @param {Report} err @param {(id: any, at: string) => void} jobRef */
function checkProtection(p, err, jobRef) {
  if (p === undefined) return;
  if (!isObj(p)) { err("protection", "{ panels, packs?, start? }"); return; }
  onlyKeys(p, ["panels", "packs", "start"], "protection", err);
  const ids = idList(p.panels, "protection.panels", err, (x, at) => {
    onlyKeys(x, ["id", "name", "job"], at, err);
    if (!CAR_PANELS.includes(x.id)) err(`${at}.id`, `a panel traced on the photos: ${CAR_PANELS.join(", ")}`);
    if (!isStr(x.name)) err(`${at}.name`, "required");
    jobRef(x.job, `${at}.job`);
  });
  (Array.isArray(p.packs) ? p.packs : p.packs === undefined ? [] : (err("protection.packs", "a list"), [])).forEach((/** @type {any} */ k, /** @type {number} */ i) => {
    const at = `protection.packs[${i}]`;
    if (!isObj(k)) { err(at, "{ name, job, panels }"); return; }
    onlyKeys(k, ["name", "job", "panels"], at, err);
    if (!isStr(k.name)) err(`${at}.name`, "required");
    jobRef(k.job, `${at}.job`);
    if (!Array.isArray(k.panels) || k.panels.length < 2 || !k.panels.every((/** @type {any} */ id) => ids.has(id))) err(`${at}.panels`, "two or more panel ids from protection.panels");
  });
  if (p.start !== undefined && !(Array.isArray(p.start) && p.start.every((/** @type {any} */ id) => ids.has(id)))) err("protection.start", "panel ids to show chosen at first");
  if (Array.isArray(p.packs) && p.packs.length > 6) err("protection.packs", "at most 6 packs");
}

/** Quote, aftercare and its page. @param {any} site @param {Report} err */
function checkServicePages(site, err) {
  const q = site.quote;
  if (q !== undefined) {
    if (!isObj(q)) err("quote", "{ message, options }");
    else {
      onlyKeys(q, ["message", "options"], "quote", err);
      if (!isStr(q.message)) err("quote.message", 'the opening line, e.g. "Hi, can I get a quote?"');
      if (!Array.isArray(q.options) || !q.options.length || q.options.length > 10 || !q.options.every(isStr)) err("quote.options", "1–10 kinds of work, as short labels");
    }
  }
  const a = site.aftercare;
  if (a !== undefined) {
    if (!isObj(a)) err("aftercare", "{ services }");
    else {
      onlyKeys(a, ["services"], "aftercare", err);
      idList(a.services, "aftercare.services", err, (s, at) => {
        onlyKeys(s, ["id", "name", "steps"], at, err);
        if (!isStr(s.name)) err(`${at}.name`, "required");
        if (!Array.isArray(s.steps) || !s.steps.length) { err(`${at}.steps`, "the studio's aftercare steps"); return; }
        s.steps.forEach((/** @type {any} */ st, /** @type {number} */ i) => {
          if (!isObj(st)) { err(`${at}.steps[${i}]`, "{ day, title, body }"); return; }
          onlyKeys(st, ["day", "title", "body"], `${at}.steps[${i}]`, err);
          if (!isInt(st.day, 0, 730)) err(`${at}.steps[${i}].day`, "days after fitting, 0 (the day itself) to 730");
          if (!isStr(st.title) || !isStr(st.body)) err(`${at}.steps[${i}]`, "a title and a sentence or two");
        });
      });
    }
  }
  if (site.tintPage !== undefined) checkTintPage(site.tintPage, err);
  if (site.ppfPage !== undefined) checkPpfPage(site.ppfPage, err);
  checkTracker(site, err);
  const ct = site.chipTest;
  if (ct !== undefined) {
    if (!isObj(ct)) err("chipTest", "{ job, line }");
    else {
      onlyKeys(ct, ["job", "line"], "chipTest", err);
      if (!isStr(ct.job) || !(Array.isArray(site.jobs) ? site.jobs : []).some((/** @type {any} */ j) => j?.id === ct.job)) err("chipTest.job", "the id of the job that protects the front (from jobs)");
      if (!isStr(ct.line)) err("chipTest.line", "one short line above the price, e.g. \"Protect the front of your car\"");
    }
  }
  const pg = site.aftercarePage;
  if (pg !== undefined && (!isObj(pg) || !isStr(pg.kicker) || !isStr(pg.title))) err("aftercarePage", "{ kicker, title, intro? }");
}

/** @param {any} site @param {Report} err */
function checkBay(site, err) {
  const b = site.bay;
  if (b === undefined) return;
  if (!isObj(b)) { err("bay", "{ source, csvUrl, message, deposit?, wait? }"); return; }
  onlyKeys(b, ["source", "csvUrl", "staleAfterHours", "message", "deposit", "wait"], "bay", err);
  if (!["sheet", "simulated"].includes(b.source)) err("bay.source", 'must be "sheet" (or "simulated" on demo sites)');
  if (b.source === "simulated" && site.mode !== "demo") err("bay.source", 'simulated data is only allowed on demo sites; use "sheet"');
  if (b.source === "sheet" && !/^https:\/\/docs\.google\.com\/spreadsheets\/.+output=csv/.test(b.csvUrl ?? "")) err("bay.csvUrl", "must be a published Google Sheet CSV link (File → Share → Publish to web → CSV)");
  if (b.staleAfterHours !== undefined && !isInt(b.staleAfterHours, 1, 168)) err("bay.staleAfterHours", "whole hours, 1–168");
  if (!isStr(b.message)) err("bay.message", 'the WhatsApp opening line, e.g. "Hi, when is your next free day?"');
  if (b.deposit !== undefined) checkDeposit(site, err);
  if (b.wait !== undefined) checkWait(b.wait, err);
}

/** @param {any} site @param {Report} err */
function checkDeposit(site, err) {
  const d = site.bay.deposit;
  {
    if (!isObj(d)) err("bay.deposit", "{ amount, link, text, terms }");
    else {
      onlyKeys(d, ["amount", "link", "text", "terms"], "bay.deposit", err);
      if (!isInt(d.amount, 5, 2000)) err("bay.deposit.amount", "whole pounds, 5–2000");
      if (!/^https:\/\/buy\.stripe\.com\/[\w-]+$/.test(d.link ?? "")) err("bay.deposit.link", "the studio's own Stripe Payment Link, https://buy.stripe.com/…");
      else if (site.mode === "demo" && !d.link.startsWith("https://buy.stripe.com/test_")) err("bay.deposit.link", "demo sites must use a Stripe test-mode link (https://buy.stripe.com/test_…)");
      else if (site.mode === "client" && d.link.startsWith("https://buy.stripe.com/test_")) err("bay.deposit.link", "is a Stripe test-mode link; client sites need the studio's live link");
      if (!isStr(d.text) || !isStr(d.terms)) err("bay.deposit", "text (what it holds) and terms (refunds, moving your day)");
    }
  }
}

/** @param {any} w @param {Report} err */
function checkWait(w, err) {
  {
    if (!isObj(w)) err("bay.wait", "{ text, lounge?, upToHours? }");
    else {
      onlyKeys(w, ["text", "lounge", "upToHours"], "bay.wait", err);
      if (!isStr(w.text)) err("bay.wait.text", "whether customers can wait, in a sentence");
      if (w.lounge !== undefined && !(Array.isArray(w.lounge) && w.lounge.every(isStr))) err("bay.wait.lounge", "short lines, e.g. \"Coffee\"");
      if (w.upToHours !== undefined && !isNum(w.upToHours, 0.5, 12)) err("bay.wait.upToHours", "the longest job customers usually wait for, in hours");
    }
  }
}

/** @param {any} m @param {Report} err @param {(id: any, at: string) => void} jobRef @param {Set<string>} vehicles */
function checkModels(m, err, jobRef, vehicles) {
  if (m === undefined) return;
  if (!isObj(m)) { err("models", "{ makes, priceJobs }"); return; }
  onlyKeys(m, ["makes", "priceJobs"], "models", err);
  if (!Array.isArray(m.makes) || !m.makes.length) err("models.makes", "a non-empty list");
  else m.makes.forEach((/** @type {any} */ mk, /** @type {number} */ i) => {
    const at = `models.makes[${i}]`;
    if (!isObj(mk)) { err(at, "{ name, tag, models }"); return; }
    onlyKeys(mk, ["name", "tag", "models"], at, err);
    if (!isStr(mk.name)) err(`${at}.name`, "required");
    if (!TAG.test(mk.tag ?? "")) err(`${at}.tag`, "the hashtag the studio uses for this make, lowercase without #");
    if (!Array.isArray(mk.models) || !mk.models.length) { err(`${at}.models`, "at least one model"); return; }
    mk.models.forEach((/** @type {any} */ md, /** @type {number} */ j) => {
      const p = `${at}.models[${j}]`;
      if (!isObj(md)) { err(p, "{ name, tag, vehicle }"); return; }
      onlyKeys(md, ["name", "tag", "vehicle"], p, err);
      if (!isStr(md.name)) err(`${p}.name`, "required");
      if (!TAG.test(md.tag ?? "")) err(`${p}.tag`, "hashtag, lowercase without #");
      if (!vehicles.has(md.vehicle)) err(`${p}.vehicle`, "a vehicle id (which prices apply)");
    });
  });
  if (!Array.isArray(m.priceJobs) || !m.priceJobs.length || m.priceJobs.length > 8) err("models.priceJobs", "1–8 job ids to price for the chosen model");
  else m.priceJobs.forEach((/** @type {any} */ id, /** @type {number} */ i) => jobRef(id, `models.priceJobs[${i}]`));
}

/** @param {any} pp @param {Report} err */
function checkPpfPage(pp, err) {
  if (!isObj(pp)) { err("ppfPage", "{ kicker, title, intro?, message, films, filmsNote?, details?, points? }"); return; }
  onlyKeys(pp, ["kicker", "title", "intro", "message", "films", "filmsNote", "details", "points"], "ppfPage", err);
  for (const k of ["kicker", "title", "message"]) if (!isStr(pp[k])) err(`ppfPage.${k}`, "required");
  if (!(Array.isArray(pp.films) && pp.films.length && pp.films.every((/** @type {any} */ x) => isObj(x) && isStr(x.name) && isStr(x.about) && FINISHES.includes(x.finish) && (x.hex === undefined || HEX.test(x.hex)) && (x.src === undefined || (isStr(x.src) && isStr(x.alt))))))
    err("ppfPage.films", `[{ name, about, best?, finish: ${FINISHES.join(" / ")}, hex?, src? + alt (a photo of that film) }] in the studio's own words; no thickness or warranty figures unless from the film maker`);
  if (pp.details !== undefined && !(Array.isArray(pp.details) && pp.details.every((/** @type {any} */ x) => isObj(x) && isStr(x.src) && isStr(x.alt))))
    err("ppfPage.details", "[{ src, alt, caption? }]: the studio's own close-ups of its work");
  if (pp.points !== undefined && !(Array.isArray(pp.points) && pp.points.every(isStr))) err("ppfPage.points", "[text]");
}

/** @param {any} tp @param {Report} err */
function checkTintPage(tp, err) {
  {
    if (!isObj(tp)) err("tintPage", "{ kicker, title, intro?, message, steps?, films?, filmsNote?, windscreen?, lights? }");
    else {
      onlyKeys(tp, ["kicker", "title", "intro", "message", "steps", "films", "filmsNote", "windscreen", "lights"], "tintPage", err);
      for (const k of ["windscreen", "lights"]) if (tp[k] !== undefined && !(isObj(tp[k]) && isStr(tp[k].body) && (tp[k].points === undefined || (Array.isArray(tp[k].points) && tp[k].points.every(isStr))))) err(`tintPage.${k}`, "{ body, points? } in the studio's own words: what it fits and what it doesn't");
      for (const k of ["kicker", "title", "message"]) if (!isStr(tp[k])) err(`tintPage.${k}`, "required");
      if (tp.steps !== undefined && !(Array.isArray(tp.steps) && tp.steps.every((/** @type {any} */ x) => isObj(x) && isStr(x.title) && isStr(x.body)))) err("tintPage.steps", "[{ title, body }] in the studio's own words");
      if (tp.films !== undefined && !(Array.isArray(tp.films) && tp.films.every((/** @type {any} */ x) => isObj(x) && isStr(x.name) && isStr(x.about)))) err("tintPage.films", "[{ name, about, best? }]; no heat or UV figures unless from the film maker's spec sheet");
    }
  }
}

/** "Your car, live". @param {any} site @param {Report} err */
function checkTracker(site, err) {
  const t = site.jobTracker;
  if (t === undefined) return;
  if (!isObj(t)) { err("jobTracker", "{ source, csvUrl, staleAfterHours?, stages, kicker, title, intro? }"); return; }
  onlyKeys(t, ["source", "csvUrl", "staleAfterHours", "stages", "kicker", "title", "intro", "example"], "jobTracker", err);
  if (!["sheet", "simulated"].includes(t.source)) err("jobTracker.source", 'must be "sheet" (or "simulated" on demo sites)');
  if (t.source === "simulated" && site.mode !== "demo") err("jobTracker.source", 'simulated data is only allowed on demo sites; use "sheet"');
  if (t.source === "sheet" && !/^https:\/\/docs\.google\.com\/spreadsheets\/.+output=csv/.test(t.csvUrl ?? "")) err("jobTracker.csvUrl", "must be a published Google Sheet CSV link (File → Share → Publish to web → CSV)");
  if (t.staleAfterHours !== undefined && !isInt(t.staleAfterHours, 1, 168)) err("jobTracker.staleAfterHours", "whole hours, 1–168");
  if (t.example !== undefined && site.mode !== "demo") err("jobTracker.example", "an example code is only for demo sites");
  if (t.example !== undefined && !/^[A-Z0-9]{4,10}$/.test(t.example)) err("jobTracker.example", "4–10 capital letters and digits");
  for (const k of ["kicker", "title"]) if (!isStr(t[k])) err(`jobTracker.${k}`, "required");
  if (!Array.isArray(t.stages) || t.stages.length < 2 || t.stages.length > 8) { err("jobTracker.stages", "2–8 stages in order, the last one meaning ready to collect: [{ id, name, about }]"); return; }
  const ids = new Set();
  t.stages.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    const at = `jobTracker.stages[${i}]`;
    if (!isObj(s)) { err(at, "{ id, name, about }"); return; }
    onlyKeys(s, ["id", "name", "about"], at, err);
    if (!isStr(s.id) || !SLUG.test(s.id)) err(`${at}.id`, "lower-case letters, digits and dashes, as typed in the sheet's stage column");
    else if (ids.has(s.id)) err(`${at}.id`, "used twice"); else ids.add(s.id);
    if (!isStr(s.name) || !isStr(s.about)) err(at, "a name and one short sentence");
  });
}
