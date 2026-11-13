// @ts-check
/**
 * Validation for the garden kit (garden designers and landscapers): the year in twelve plants, the studio's month,
 * services, gardens by style and their stories, the planting palette, the design process, materials, the garden
 * through the year, where the sun falls, maintenance plans and the planning guide. Every figure (weeks, prices,
 * visits, sizes) is the studio's own; the checks only make sure it is complete and can't mislead.
 */
import { isYmd } from "../../core/lib/diary.js";
import { LIGHT, CARE } from "./lib/garden.js";
import { FACINGS } from "./lib/sun-study.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @typedef {((rel: string) => boolean)|undefined} Exists */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const ID = /^[a-z0-9-]{1,40}$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const HEAD = ["kicker", "title", "intro"];
const PAGE = ["slug", "kicker", "title", "intro", "description"];
const SERVICES = ["design", "build", "care"];
/** Planning guidance may only come from the government's own sites. */
const OFFICIAL = /^https:\/\/(www\.)?(gov\.uk|legislation\.gov\.uk|planningportal\.co\.uk|gov\.wales|gov\.scot|nidirect\.gov\.uk)\//;

/** @param {Report} err @param {string} path @param {any} v */
function text(err, path, v) { if (!isStr(v)) err(path, "required text is missing"); }

/** A misspelt setting is refused, not silently ignored. @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (isObj(o)) for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}

/** @param {Report} err @param {string} path @param {any} p @param {Exists} exists */
function photo(err, path, p, exists) {
  if (!isObj(p)) { err(path, "a photo: { src, width, height, alt }"); return; }
  onlyKeys(p, ["src", "width", "height", "alt", "credit"], path, err);
  text(err, `${path}.alt`, p.alt);
  if (!Number.isInteger(p.width) || !Number.isInteger(p.height)) err(path, "width and height in pixels");
  if (!isStr(p.src)) err(`${path}.src`, "required");
  else if (exists && !exists(p.src)) err(`${path}.src`, `file not found: ${p.src}`);
}

/** Unique ids in a list. @param {Report} err @param {string} path @param {any[]} list @returns {string[]} */
function ids(err, path, list) {
  const seen = new Set();
  list.forEach((x, i) => {
    if (!ID.test(x?.id ?? "")) err(`${path}[${i}].id`, "lowercase letters, numbers and dashes");
    else if (seen.has(x.id)) err(`${path}[${i}].id`, `"${x.id}" is used twice`);
    seen.add(x?.id);
  });
  return [...seen].filter(Boolean);
}

/** @param {any} o @param {string} at @param {Report} err @param {string[]} [more] */
function head(o, at, err, more = []) {
  if (!isObj(o)) { err(at, "an object with a title"); return false; }
  onlyKeys(o, [...HEAD, ...more], at, err);
  text(err, `${at}.title`, o.title);
  return true;
}

/** A page in a collection. @param {any} x @param {string} p @param {Report} err */
function pageItem(x, p, err) {
  if (!SLUG.test(x?.slug ?? "")) err(`${p}.slug`, "lowercase words and dashes");
  text(err, `${p}.title`, x?.title);
  if (!isStr(x?.description) || x.description.length > 160) err(`${p}.description`, "one sentence, up to 160 characters");
}

/** @param {Report} err @param {string} path @param {any} v */
function months(err, path, v) {
  if (!Array.isArray(v) || !v.length || !v.every((m) => Number.isInteger(m) && m >= 1 && m <= 12) || new Set(v).size !== v.length) err(path, "months as numbers 1–12, each once, e.g. [5, 6, 7]");
}

/** @param {Report} err @param {string} path @param {any} v @param {number} n */
function twelve(err, path, v, n = 12) {
  if (!Array.isArray(v) || v.length !== n) { err(path, `exactly ${n} entries, January first`); return false; }
  return true;
}

/** @param {any} site @param {Report} err @param {Exists} [exists] */
export function checkGarden(site, err, exists) {
  if (site.kit !== "garden") return;
  if (site.hero !== undefined) { onlyKeys(site.hero, HEAD, "hero", err); text(err, "hero.title", site.hero?.title); }
  if (site.year !== undefined) checkYear(site.year, err, exists);
  if (site.calendar !== undefined) checkCalendar(site.calendar, site.mode, err, exists);
  if (site.calendarPage !== undefined && head(site.calendarPage, "calendarPage", err, ["startBy"])) checkStartBy(site.calendarPage.startBy, err);
  const services = site.whatWeDo !== undefined ? checkServices(site.whatWeDo, err) : [];
  if (site.servicePages !== undefined) checkServicePages(site.servicePages, services, err, exists);
  const styles = isObj(site.gardens) && Array.isArray(site.gardens.styles) ? site.gardens.styles.map((/** @type {any} */ s) => s?.id) : [];
  const gardens = site.gardens !== undefined ? checkGardens(site.gardens, err, exists) : [];
  const plants = site.palette !== undefined ? checkPalette(site.palette, err, exists) : [];
  const materials = site.materials !== undefined ? checkMaterials(site.materials, gardens, err, exists) : [];
  if (site.gardenPages !== undefined) checkGardenPages(site.gardenPages, gardens, plants, materials, err, exists);
  if (site.stylePages !== undefined) checkStylePages(site.stylePages, styles, err, exists);
  if (site.throughYear !== undefined) checkThroughYear(site.throughYear, gardens, err, exists);
  checkPages(site, err, exists);
}

/** The settings that stand alone: the design process, the sun study, maintenance, planning and the journal.
 * @param {any} site @param {Report} err @param {Exists} exists */
function checkPages(site, err, exists) {
  if (site.process !== undefined) checkProcess(site.process, err);
  if (site.sun !== undefined) checkSun(site.sun, err);
  if (site.maintenance !== undefined) checkMaintenance(site.maintenance, err);
  if (site.planning !== undefined) checkPlanning(site.planning, err);
  if (site.journal !== undefined) checkJournal(site.journal, err, exists);
  checkSlugs(site, err);
}

/** The year in twelve plants: the hero's strips. @param {any} y @param {Report} err @param {Exists} exists */
function checkYear(y, err, exists) {
  onlyKeys(y, ["months", "note"], "year", err);
  if (!twelve(err, "year.months", y?.months)) return;
  y.months.forEach((/** @type {any} */ m, /** @type {number} */ i) => {
    const p = `year.months[${i}]`;
    onlyKeys(m, ["plant", "line", "photo", "strip"], p, err);
    text(err, `${p}.plant`, m?.plant);
    text(err, `${p}.line`, m?.line);
    photo(err, `${p}.photo`, m?.photo, exists);
    // a narrow, light crop for the closed strip (about 200 × 640), so twelve photographs don't slow the first screen
    photo(err, `${p}.strip`, { ...m?.strip, alt: "-" }, exists);
  });
}

/**
 * The studio's month: what it is designing, building, planting and caring for, January to December; and the next
 * start, which is only shown while it was checked recently.
 * @param {any} c @param {string} mode @param {Report} err @param {Exists} exists
 */
function checkCalendar(c, mode, err, exists) {
  onlyKeys(c, ["months", "nextStart"], "calendar", err);
  if (twelve(err, "calendar.months", c?.months)) c.months.forEach((/** @type {any} */ m, /** @type {number} */ i) => {
    const p = `calendar.months[${i}]`;
    onlyKeys(m, ["headline", "intro", "design", "build", "planting", "care", "photo"], p, err);
    text(err, `${p}.headline`, m?.headline);
    if (!["design", "build", "planting", "care"].some((k) => isStr(m?.[k]))) err(p, "at least one of design, build, planting or care");
    if (m?.photo !== undefined) photo(err, `${p}.photo`, m.photo, exists);
  });
  const n = c?.nextStart;
  if (n === undefined) return;
  onlyKeys(n, ["design", "build", "updated", "staleAfterDays"], "calendar.nextStart", err);
  if (!isStr(n?.design) && !isStr(n?.build)) err("calendar.nextStart", "the month of the next design start, build start, or both, e.g. { design: \"March\" }");
  if (!isYmd(n?.updated)) err("calendar.nextStart.updated", "the day you last checked it, YYYY-MM-DD (it hides itself once it's out of date)");
  if (n?.staleAfterDays !== undefined && !(Number.isInteger(n.staleAfterDays) && n.staleAfterDays >= 7 && n.staleAfterDays <= 120)) err("calendar.nextStart.staleAfterDays", "7 to 120 days");
  if (mode === "client" && n?.staleAfterDays === undefined) err("calendar.nextStart.staleAfterDays", "how many days the next start stays true, e.g. 45");
}

/** @param {any} s @param {Report} err */
function checkStartBy(s, err) {
  if (s === undefined) return;
  onlyKeys(s, ["message", "design", "lead", "build", "note"], "calendarPage.startBy", err);
  text(err, "calendarPage.startBy.message", s?.message);
  for (const k of ["design", "lead", "build"]) if (!(Number.isInteger(s?.[k]) && s[k] >= 0 && s[k] <= 52)) err(`calendarPage.startBy.${k}`, "the studio's own typical weeks, 0–52");
}

/** Design, build, care: what the studio does. @param {any} s @param {Report} err @returns {string[]} */
function checkServices(s, err) {
  if (!isObj(s) || !Array.isArray(s.items) || !s.items.length) { err("whatWeDo.items", "what the studio does, e.g. { id: \"design\", name: \"Design\", text: \"…\" }"); return []; }
  onlyKeys(s, ["items"], "whatWeDo", err);
  const out = ids(err, "whatWeDo.items", s.items);
  s.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    onlyKeys(x, ["id", "name", "text"], `whatWeDo.items[${i}]`, err);
    if (!SERVICES.includes(x?.id)) err(`whatWeDo.items[${i}].id`, `one of ${SERVICES.join(", ")}`);
    text(err, `whatWeDo.items[${i}].name`, x?.name);
    text(err, `whatWeDo.items[${i}].text`, x?.text);
  });
  return out;
}

/** @param {any} s @param {string[]} services @param {Report} err @param {Exists} exists */
function checkServicePages(s, services, err, exists) {
  if (!isObj(s) || !Array.isArray(s.items) || !s.items.length) { err("servicePages.items", "a page for design, build or care"); return; }
  onlyKeys(s, ["items"], "servicePages", err);
  s.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `servicePages.items[${i}]`;
    onlyKeys(x, [...PAGE, "service", "photo", "body", "points"], p, err);
    pageItem(x, p, err);
    if (!services.includes(x?.service)) err(`${p}.service`, `one of whatWeDo.items: ${services.join(", ")}`);
    text(err, `${p}.body`, x?.body);
    photo(err, `${p}.photo`, x?.photo, exists);
    (x?.points ?? []).forEach((/** @type {any} */ d, /** @type {number} */ j) => { onlyKeys(d, ["label", "value"], `${p}.points[${j}]`, err); text(err, `${p}.points[${j}].label`, d?.label); text(err, `${p}.points[${j}].value`, d?.value); });
  });
}

/** Gardens by style and size. @param {any} g @param {Report} err @param {Exists} exists @returns {string[]} */
function checkGardens(g, err, exists) {
  if (!isObj(g) || !Array.isArray(g.items) || !g.items.length) { err("gardens.items", "at least one garden"); return []; }
  onlyKeys(g, ["styles", "items", "note"], "gardens", err);
  const styles = Array.isArray(g.styles) ? ids(err, "gardens.styles", g.styles) : [];
  if (!styles.length) err("gardens.styles", "the kinds of garden, e.g. { id: \"courtyard\", name: \"Courtyards\" }");
  (g.styles ?? []).forEach((/** @type {any} */ s, /** @type {number} */ i) => { onlyKeys(s, ["id", "name"], `gardens.styles[${i}]`, err); text(err, `gardens.styles[${i}].name`, s?.name); });
  const out = ids(err, "gardens.items", g.items);
  g.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `gardens.items[${i}]`;
    onlyKeys(x, ["id", "name", "place", "style", "size", "facing", "year", "photo"], p, err);
    text(err, `${p}.name`, x?.name);
    if (!styles.includes(x?.style)) err(`${p}.style`, `one of gardens.styles: ${styles.join(", ")}`);
    if (x?.facing !== undefined && !(x.facing in FACINGS)) err(`${p}.facing`, `one of ${Object.keys(FACINGS).join(", ")}`);
    if (x?.year !== undefined && !(Number.isInteger(x.year) && x.year > 1990 && x.year < 2100)) err(`${p}.year`, "the year it was finished");
    photo(err, `${p}.photo`, x?.photo, exists);
  });
  return out;
}

/** The studio's plants. @param {any} pl @param {Report} err @param {Exists} exists @returns {string[]} */
function checkPalette(pl, err, exists) {
  if (!head(pl, "palette", err, ["items", "note"])) return [];
  if (!Array.isArray(pl.items) || pl.items.length < 3) { err("palette.items", "at least three plants"); return []; }
  const out = ids(err, "palette.items", pl.items);
  pl.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `palette.items[${i}]`;
    onlyKeys(x, ["id", "name", "latin", "months", "light", "care", "text", "photo"], p, err);
    text(err, `${p}.name`, x?.name);
    months(err, `${p}.months`, x?.months);
    if (!Array.isArray(x?.light) || !x.light.length || !x.light.every((/** @type {string} */ l) => l in LIGHT)) err(`${p}.light`, `one or more of ${Object.keys(LIGHT).join(", ")}`);
    if (!(x?.care in CARE)) err(`${p}.care`, `one of ${Object.keys(CARE).join(", ")}`);
    photo(err, `${p}.photo`, x?.photo, exists);
  });
  return out;
}

/** Materials the studio builds with. @param {any} m @param {string[]} gardens @param {Report} err @param {Exists} exists @returns {string[]} */
function checkMaterials(m, gardens, err, exists) {
  if (!head(m, "materials", err, ["message", "items", "note"])) return [];
  text(err, "materials.message", m.message);
  if (!Array.isArray(m.items) || m.items.length < 2) { err("materials.items", "at least two materials"); return []; }
  const out = ids(err, "materials.items", m.items);
  m.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `materials.items[${i}]`;
    onlyKeys(x, ["id", "name", "detail", "photo", "garden"], p, err);
    text(err, `${p}.name`, x?.name);
    photo(err, `${p}.photo`, x?.photo, exists);
    if (x?.garden !== undefined && !gardens.includes(x.garden)) err(`${p}.garden`, `one of gardens.items: ${gardens.join(", ")}`);
  });
  return out;
}

/** A page for each garden. @param {any} gp @param {string[]} gardens @param {string[]} plants @param {string[]} materials @param {Report} err @param {Exists} exists */
function checkGardenPages(gp, gardens, plants, materials, err, exists) {
  if (!head(gp, "gardenPages", err, ["items"])) return;
  if (!Array.isArray(gp.items) || !gp.items.length) { err("gardenPages.items", "at least one garden's story"); return; }
  gp.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `gardenPages.items[${i}]`;
    onlyKeys(x, [...PAGE, "garden", "brief", "body", "photos", "plants", "materials"], p, err);
    pageItem(x, p, err);
    if (!gardens.includes(x?.garden)) err(`${p}.garden`, `one of gardens.items: ${gardens.join(", ")}`);
    text(err, `${p}.brief`, x?.brief);
    text(err, `${p}.body`, x?.body);
    (x?.photos ?? []).forEach((/** @type {any} */ ph, /** @type {number} */ j) => photo(err, `${p}.photos[${j}]`, ph, exists));
    (x?.plants ?? []).forEach((/** @type {string} */ id, /** @type {number} */ j) => { if (!plants.includes(id)) err(`${p}.plants[${j}]`, `not in palette.items: ${id}`); });
    (x?.materials ?? []).forEach((/** @type {string} */ id, /** @type {number} */ j) => { if (!materials.includes(id)) err(`${p}.materials[${j}]`, `not in materials.items: ${id}`); });
  });
}

/** A page for each kind of garden. @param {any} sp @param {string[]} styles @param {Report} err @param {Exists} exists */
function checkStylePages(sp, styles, err, exists) {
  if (!isObj(sp) || !Array.isArray(sp.items) || !sp.items.length) { err("stylePages.items", "a page for a kind of garden"); return; }
  onlyKeys(sp, ["items"], "stylePages", err);
  sp.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `stylePages.items[${i}]`;
    onlyKeys(x, [...PAGE, "style", "body", "photo"], p, err);
    pageItem(x, p, err);
    if (!styles.includes(x?.style)) err(`${p}.style`, `one of gardens.styles: ${styles.join(", ")}`);
    text(err, `${p}.body`, x?.body);
    photo(err, `${p}.photo`, x?.photo, exists);
  });
}

/** @param {any} pr @param {Report} err */
function checkProcess(pr, err) {
  if (!head(pr, "process", err, ["fee", "stages"])) return;
  if (!Array.isArray(pr.stages) || pr.stages.length < 2) { err("process.stages", "the studio's stages in order"); return; }
  ids(err, "process.stages", pr.stages);
  pr.stages.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    const p = `process.stages[${i}]`;
    onlyKeys(s, ["id", "name", "text", "receive", "weeks", "stop"], p, err);
    for (const k of ["name", "text"]) text(err, `${p}.${k}`, s?.[k]);
    if (s?.stop !== undefined && typeof s.stop !== "boolean") err(`${p}.stop`, "true when the client can stop after this stage");
  });
}

/** One garden from the same spot through the year. @param {any} t @param {string[]} gardens @param {Report} err @param {Exists} exists */
function checkThroughYear(t, gardens, err, exists) {
  onlyKeys(t, ["garden", "viewpoint", "photos", "note"], "throughYear", err);
  if (!gardens.includes(t?.garden)) err("throughYear.garden", `one of gardens.items: ${gardens.join(", ")}`);
  text(err, "throughYear.viewpoint", t?.viewpoint);
  if (!Array.isArray(t?.photos) || t.photos.length < 4 || t.photos.length > 12) { err("throughYear.photos", "4 to 12 photos of the same view, each with its month"); return; }
  const seen = new Set();
  t.photos.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    onlyKeys(x, ["month", "photo", "line"], `throughYear.photos[${i}]`, err);
    if (!(Number.isInteger(x?.month) && x.month >= 1 && x.month <= 12) || seen.has(x.month)) err(`throughYear.photos[${i}].month`, "a month 1–12, each once");
    seen.add(x?.month);
    photo(err, `throughYear.photos[${i}].photo`, x?.photo, exists);
  });
}

/** @param {any} s @param {Report} err */
function checkSun(s, err) {
  if (!head(s, "sun", err, ["lat", "lng", "place", "message", "garden", "note"])) return;
  if (typeof s.lat !== "number" || s.lat < 49.8 || s.lat > 60.9) err("sun.lat", "the studio's latitude, in the UK (49.8–60.9)");
  if (typeof s.lng !== "number" || s.lng < -8.7 || s.lng > 1.8) err("sun.lng", "the studio's longitude, in the UK (−8.7–1.8)");
  text(err, "sun.place", s.place);
  text(err, "sun.message", s.message);
  const g = s.garden;
  onlyKeys(g, ["width", "length", "house", "fence", "facing"], "sun.garden", err);
  const within = (/** @type {string} */ k, /** @type {number} */ lo, /** @type {number} */ hi) => { if (typeof g?.[k] !== "number" || g[k] < lo || g[k] > hi) err(`sun.garden.${k}`, `${lo}–${hi} metres`); };
  within("width", 3, 40); within("length", 3, 60); within("house", 3, 15); within("fence", 0, 3);
  if (!(g?.facing in FACINGS)) err("sun.garden.facing", `the example garden's facing: ${Object.keys(FACINGS).join(", ")}`);
}

/** @param {any} m @param {Report} err */
function checkMaintenance(m, err) {
  if (!head(m, "maintenance", err, ["message", "tasks", "plans", "note"])) return;
  text(err, "maintenance.message", m.message);
  if (twelve(err, "maintenance.tasks", m.tasks)) m.tasks.forEach((/** @type {any} */ t, /** @type {number} */ i) => { if (!Array.isArray(t) || !t.every(isStr)) err(`maintenance.tasks[${i}]`, "what the studio does that month, as a list"); });
  if (!Array.isArray(m.plans) || !m.plans.length) { err("maintenance.plans", "at least one plan"); return; }
  ids(err, "maintenance.plans", m.plans);
  m.plans.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `maintenance.plans[${i}]`;
    onlyKeys(x, ["id", "name", "text", "visits", "price", "per"], p, err);
    text(err, `${p}.name`, x?.name);
    months(err, `${p}.visits`, x?.visits);
    if (x?.price !== null && !(typeof x?.price === "number" && x.price > 0)) err(`${p}.price`, "the studio's own price, or null to price after a visit");
    if (x?.price !== null && !["visit", "month", "year"].includes(x?.per)) err(`${p}.per`, "visit, month or year");
  });
}

/** General planning facts must say where they come from, when they were checked, and that they're a guide. @param {any} pl @param {Report} err */
function checkPlanning(pl, err) {
  if (!head(pl, "planning", err, ["nation", "checked", "rows", "sources", "note"])) return;
  if (pl.nation !== "england") err("planning.nation", "\"england\": the guide covers England's rules (Wales, Scotland and Northern Ireland differ)");
  if (!isYmd(pl.checked)) err("planning.checked", "the day the sources were checked, YYYY-MM-DD");
  if (!Array.isArray(pl.rows) || pl.rows.length < 2) err("planning.rows", "at least two questions: { q, a }");
  else pl.rows.forEach((/** @type {any} */ r, /** @type {number} */ i) => { onlyKeys(r, ["q", "a"], `planning.rows[${i}]`, err); text(err, `planning.rows[${i}].q`, r?.q); text(err, `planning.rows[${i}].a`, r?.a); });
  if (!Array.isArray(pl.sources) || !pl.sources.length) err("planning.sources", "the GOV.UK pages it comes from: { label, url }");
  else pl.sources.forEach((/** @type {any} */ s, /** @type {number} */ i) => { onlyKeys(s, ["label", "url"], `planning.sources[${i}]`, err); text(err, `planning.sources[${i}].label`, s?.label); if (!OFFICIAL.test(s?.url ?? "")) err(`planning.sources[${i}].url`, "a government page (gov.uk, legislation.gov.uk or the Planning Portal)"); });
}

/** @param {any} j @param {Report} err @param {Exists} exists */
function checkJournal(j, err, exists) {
  if (!head(j, "journal", err, ["note", "items"])) return;
  if (!Array.isArray(j.items) || !j.items.length) { err("journal.items", "at least one article"); return; }
  j.items.forEach((/** @type {any} */ a, /** @type {number} */ i) => {
    const p = `journal.items[${i}]`;
    onlyKeys(a, ["slug", "title", "date", "summary", "photo", "body", "sources"], p, err);
    pageItem({ ...a, description: a?.summary }, p, err);
    if (!isYmd(a?.date)) err(`${p}.date`, "the date it was written, YYYY-MM-DD");
    text(err, `${p}.body`, a?.body);
    photo(err, `${p}.photo`, a?.photo, exists);
    (a?.sources ?? []).forEach((/** @type {any} */ s, /** @type {number} */ k) => { onlyKeys(s, ["label", "url"], `${p}.sources[${k}]`, err); if (!/^https:\/\//.test(s?.url ?? "")) err(`${p}.sources[${k}].url`, "an https link"); });
  });
}

/** Pages every site has, and this kit's own, can't be reused as a collection's slug. */
const TAKEN = ["index", "privacy", "visit", "404", "team", "calendar", "planting", "design-process", "gardens", "materials", "journal", "where-the-sun-falls", "maintenance", "permission", "garden", "article", "service", "style"];

/** @param {any} site @param {Report} err */
function checkSlugs(site, err) {
  const seen = new Set([...TAKEN, ...(site.pages ?? []).map((/** @type {any} */ p) => p.slug)]);
  for (const key of ["servicePages", "gardenPages", "stylePages", "journal"]) {
    (site[key]?.items ?? []).forEach((/** @type {any} */ x, /** @type {number} */ i) => {
      if (seen.has(x?.slug)) err(`${key}.items[${i}].slug`, `"${x.slug}" is already a page`);
      seen.add(x?.slug);
    });
  }
}
