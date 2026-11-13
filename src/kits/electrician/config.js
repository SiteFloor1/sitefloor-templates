// @ts-check
/**
 * Validation for the electrician kit (premium electricians, lighting designers, smart-home installers). Every figure
 * (prices, cable runs, fuse sizes, bands) is the client's own; every accreditation is the client's and links to its
 * public register; the fault guide never tells anyone to repair anything. A misspelt setting is refused, and simulated
 * data is refused on client sites.
 */
import { ROOMS, FITTINGS } from "./lib/house.js";
import { KINDS } from "./lib/certificates.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @param {any} v */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
/** @param {any} v */
const isPounds = (v) => Number.isInteger(v) && v >= 0 && v <= 1_000_000;
const ID = /^[a-z0-9-]{1,40}$/;
const PAGE_HEAD = ["kicker", "title", "intro"];
const PHOTO = ["src", "width", "height", "alt", "caption"];

/**
 * Accreditation schemes the page can show, and the only site its register link may point to (so a badge always
 * leads to the scheme's own public register, never a page of the client's).
 */
export const REGISTERS = /** @type {const} */ ({
  "niceic": { name: "NICEIC", host: /^https:\/\/(www\.)?niceic\.com\// },
  "napit": { name: "NAPIT", host: /^https:\/\/(www\.)?napit\.org\.uk\// },
  "stroma": { name: "Stroma Certification", host: /^https:\/\/(www\.)?stroma\.com\// },
  "competent-person": { name: "Electrical Competent Person register", host: /^https:\/\/(www\.)?electricalcompetentperson\.co\.uk\// },
  "trustmark": { name: "TrustMark", host: /^https:\/\/(www\.)?trustmark\.org\.uk\// },
  "which": { name: "Which? Trusted Traders", host: /^https:\/\/trustedtraders\.which\.co\.uk\// },
  "ozev": { name: "OZEV authorised installer", host: /^https:\/\/(www\.)?gov\.uk\// },
});

/** @param {Report} err @param {string} path @param {any} v */
function text(err, path, v) { if (!isStr(v)) err(path, "required text is missing"); }

/** @param {any} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  if (isObj(o)) for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}

/** @param {Report} err @param {string} path @param {any} p @param {((rel: string) => boolean)|undefined} exists @param {string[]} [keys] */
function photo(err, path, p, exists, keys = PHOTO) {
  if (!isObj(p)) { err(path, "a photo: { src, width, height, alt }"); return; }
  onlyKeys(p, keys, path, err);
  if (keys.includes("alt")) text(err, `${path}.alt`, p.alt);
  if (!Number.isInteger(p.width) || !Number.isInteger(p.height)) err(path, "width and height in pixels");
  if (!isStr(p.src)) err(`${path}.src`, "required");
  else if (exists && !exists(p.src)) err(`${path}.src`, `file not found: ${p.src}`);
}

/** A list of 1..max items. @param {Report} err @param {string} path @param {any} list @param {number} min @param {number} max @param {string} what */
function list(err, path, list, min, max, what) {
  if (!Array.isArray(list) || list.length < min || list.length > max) { err(path, `${min}–${max} ${what}`); return false; }
  return true;
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

/** @param {any} v @param {string} at @param {Report} err */
function pageHead(v, at, err) {
  if (v === undefined) return;
  onlyKeys(v, PAGE_HEAD, at, err);
  text(err, `${at}.title`, v?.title);
}

/** @param {any} site @param {Report} err @param {((rel: string) => boolean)|undefined} [exists] */
export function checkElectrician(site, err, exists) {
  if (site.kit !== "electrician") return;
  if (site.mode !== "demo") demoNameLeft(site, err);
  checkScenes(site.hero?.scenes, err, exists);
  if (site.mark !== undefined) { onlyKeys(site.mark, ["word", "line"], "mark", err); text(err, "mark.word", site.mark?.word); if (site.mark?.line !== undefined) text(err, "mark.line", site.mark.line); }
  if (site.hero !== undefined) onlyKeys(site.hero, ["kicker", "title", "intro", "scenes"], "hero", err);
  if (site.callOut !== undefined) { onlyKeys(site.callOut, ["line", "when", "message"], "callOut", err); for (const k of ["line", "when", "message"]) text(err, `callOut.${k}`, site.callOut?.[k]); }
  if (site.registers !== undefined) checkRegisters(site.registers, err);
  if (site.circuits !== undefined) checkCircuits(site.circuits, err);
  if (site.rooms !== undefined) checkRooms(site.rooms, err, exists);
  if (site.fittings !== undefined) checkFittings(site.fittings, err, exists);
  if (site.faultGuide !== undefined) checkFaultGuide(site.faultGuide, err);
  if (site.projects !== undefined) checkProjects(site.projects, err, exists);
  if (site.ev !== undefined) checkEv(site.ev, err, exists);
  if (site.designer !== undefined) checkDesigner(site.designer, err);
  if (site.dimmer !== undefined) checkDimmer(site.dimmer, err, exists);
  if (site.steps !== undefined) checkSteps(site.steps, err);
  if (site.beforeYouCall !== undefined) checkBeforeYouCall(site.beforeYouCall, err);
  if (site.estimate !== undefined) checkEstimate(site.estimate, err);
  if (site.house3d !== undefined) checkHouse(site.house3d, err);
  if (site.certificates !== undefined) checkCertificates(site.certificates, site.mode, err);
  for (const k of ["projectsPage", "evPage", "lightingPage", "yourProjectPage"]) pageHead(site[k], k, err);
}

/** The hero's scenes: one photograph per scene of the same home; the keypad shows their names. @param {any} s @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkScenes(s, err, exists) {
  if (!list(err, "hero.scenes", s, 1, 4, "scenes, each { id, label, line, wide, tall } (the first is shown when the page opens)")) return;
  ids(err, "hero.scenes", s);
  s.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `hero.scenes[${i}]`;
    onlyKeys(x, ["id", "label", "line", "wide", "tall"], p, err);
    text(err, `${p}.line`, x?.line);
    if (!isStr(x?.label) || x.label.length > 10) err(`${p}.label`, "the key's name, up to 10 characters (it is engraved on a small key)");
    photo(err, `${p}.wide`, x?.wide, exists);
    photo(err, `${p}.tall`, x?.tall, exists, ["src", "width", "height"]);
  });
}

/** @param {any} r @param {Report} err */
function checkRegisters(r, err) {
  if (!list(err, "registers", r, 1, 6, "accreditations, each { scheme, label, url }")) return;
  r.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `registers[${i}]`;
    onlyKeys(x, ["scheme", "label", "url"], p, err);
    const scheme = /** @type {Record<string, { name: string, host: RegExp }>} */ (REGISTERS)[x?.scheme];
    if (!scheme) err(`${p}.scheme`, `one of ${Object.keys(REGISTERS).join(", ")}`);
    else if (!scheme.host.test(x?.url ?? "")) err(`${p}.url`, `the client's entry on the ${scheme.name} public register (an https link on the scheme's own site)`);
    text(err, `${p}.label`, x?.label);
  });
}

/** @param {any} c @param {Report} err */
function checkCircuits(c, err) {
  onlyKeys(c, ["items"], "circuits", err);
  if (!list(err, "circuits.items", c?.items, 1, 12, "services, each { id, name, included: [lines] }")) return;
  ids(err, "circuits.items", c.items);
  c.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `circuits.items[${i}]`;
    onlyKeys(x, ["id", "name", "included"], p, err);
    text(err, `${p}.name`, x?.name);
    if (!Array.isArray(x?.included) || !x.included.length || !x.included.every(isStr)) err(`${p}.included`, "what the service includes, at least one line, in the client's words");
  });
}

/** @param {any} r @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkRooms(r, err, exists) {
  onlyKeys(r, ["items"], "rooms", err);
  if (!list(err, "rooms.items", r?.items, 2, 6, "rooms, each { id, name, scene, did, photo }")) return;
  ids(err, "rooms.items", r.items);
  r.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `rooms.items[${i}]`;
    onlyKeys(x, ["id", "name", "scene", "did", "photo"], p, err);
    for (const k of ["name", "scene", "did"]) text(err, `${p}.${k}`, x?.[k]);
    photo(err, `${p}.photo`, x?.photo, exists);
  });
}

/** Numbered lights on a photograph: each a point on the photo (percent) and the client's reason for it. @param {any} f @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkFittings(f, err, exists) {
  onlyKeys(f, ["photo", "items"], "fittings", err);
  photo(err, "fittings.photo", f?.photo, exists);
  if (!list(err, "fittings.items", f?.items, 1, 8, "lights, each { x, y, name, why, scene, colour, control }")) return;
  f.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `fittings.items[${i}]`;
    onlyKeys(x, ["x", "y", "name", "why", "scene", "colour", "control"], p, err);
    for (const k of ["name", "why", "scene", "colour", "control"]) text(err, `${p}.${k}`, x?.[k]);
    for (const k of ["x", "y"]) if (typeof x?.[k] !== "number" || x[k] < 2 || x[k] > 98) err(`${p}.${k}`, "where the light is on the photo, 2–98 (percent across or down)");
  });
}

/** Never a repair instruction: what to tell the electrician, and one safety line. @param {any} g @param {Report} err */
function checkFaultGuide(g, err) {
  onlyKeys(g, ["message", "safety", "cases"], "faultGuide", err);
  text(err, "faultGuide.message", g?.message);
  text(err, "faultGuide.safety", g?.safety);
  if (!list(err, "faultGuide.cases", g?.cases, 2, 6, "cases, each { id, label, tell: [lines] }")) return;
  ids(err, "faultGuide.cases", g.cases);
  // Anything that tells the visitor to do the work: reset, swap, push or put back, switch back on, take a cover off, try…
  const thing = "(?:it|them|the [a-z0-9 ]{1,30}?)";
  const doIt = new RegExp(`\\b(?:reset|replace|rewire|unscrew|screw (?:in|down|up)|swap|change the|tighten|loosen|isolate|flip|remove|fix it|repair it|open (?:the|it|up)|take ${thing}? ?off|take off|(?:push|put|flick|turn|switch|pop) ${thing}? ?back|(?:turn|switch) ${thing}? ?(?:off|on) at|turn (?:off |on )?the main|try (?:putting|turning|switching|resetting|pushing|flipping|changing|replacing))\\b`, "i");
  const repair = "reads like a repair instruction; the guide only says what to tell the electrician";
  if (isStr(g?.message) && doIt.test(g.message)) err("faultGuide.message", repair);
  // The safety line may say what not to do, and to switch off if it's safe; anything else that reads as a repair is refused.
  if (isStr(g?.safety)) {
    const rest = g.safety
      .replace(/\b(?:don't|do not|never|please don't)\b[^.;:!?]*/gi, " ")
      .replace(/\b(?:switch|turn) (?:it |them |the [a-z ]{1,30}?)?off(?: at the (?:socket|wall|plug|main switch|mains))?(?:,? (?:but )?only)?(?:,? if (?:it's|it is) safe(?: to)?(?: do so)?)?/gi, " ")
      .replace(/\bturn (?:off )?the main(?:s)?(?: switch)?(?: off)?(?:,? if (?:it's|it is) safe(?: to)?(?: do so)?)?/gi, " ");
    if (doIt.test(rest)) err("faultGuide.safety", "reads like a repair instruction; the safety line may say what not to do, and to switch off if it's safe");
  }
  g.cases.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `faultGuide.cases[${i}]`;
    onlyKeys(x, ["id", "label", "tell"], p, err);
    text(err, `${p}.label`, x?.label);
    if (isStr(x?.label) && doIt.test(x.label)) err(`${p}.label`, repair);
    if (!Array.isArray(x?.tell) || !x.tell.length || !x.tell.every(isStr)) err(`${p}.tell`, "what to tell us, at least one line");
    else x.tell.forEach((/** @type {string} */ t, /** @type {number} */ j) => { if (doIt.test(t)) err(`${p}.tell[${j}]`, repair); });
  });
}

/** The demo's business name. A client's site set up from the demo or a README must never still greet it. */
const DEMO_NAME = /\bCorbel\b/;
/** @param {any} site @param {Report} err */
function demoNameLeft(site, err) {
  /** @param {any} v @param {string} path */
  const walk = (v, path) => {
    if (typeof v === "string") { if (DEMO_NAME.test(v)) err(path, "still names the demo business (Corbel); use the client's own name"); }
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k);
  };
  walk(site, "");
}

/** @param {any} pj @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkProjects(pj, err, exists) {
  onlyKeys(pj, ["types", "items"], "projects", err);
  if (!list(err, "projects.types", pj?.types, 1, 10, "kinds of work, each { id, label }")) return;
  ids(err, "projects.types", pj.types);
  const types = new Set(pj.types.map((/** @type {any} */ t) => t.id));
  if (!list(err, "projects.items", pj?.items, 1, 60, "projects")) return;
  ids(err, "projects.items", pj.items);
  pj.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const p = `projects.items[${i}]`;
    onlyKeys(x, ["id", "title", "area", "type", "did", "photo"], p, err);
    for (const k of ["title", "area"]) text(err, `${p}.${k}`, x?.[k]);
    if (!types.has(x?.type)) err(`${p}.type`, `one of the types' ids (${[...types].join(", ")})`);
    if (!Array.isArray(x?.did) || !x.did.length || !x.did.every(isStr)) err(`${p}.did`, "what was done, at least one line");
    photo(err, `${p}.photo`, x?.photo, exists);
  });
}

/** @param {any} ev @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkEv(ev, err, exists) {
  onlyKeys(ev, ["message", "standard", "perMetre", "maxMetres", "minFuse", "leadMetres", "grantUrl", "photo"], "ev", err);
  if (ev?.leadMetres !== undefined && (typeof ev.leadMetres !== "number" || ev.leadMetres < 3 || ev.leadMetres > 15)) err("ev.leadMetres", "the charger's own lead, 3–15 metres");
  text(err, "ev.message", ev?.message);
  onlyKeys(ev?.standard, ["price", "includedMetres", "what"], "ev.standard", err);
  if (!isPounds(ev?.standard?.price) || ev.standard.price === 0) err("ev.standard.price", "the client's price for a standard install, whole pounds");
  if (!Number.isInteger(ev?.standard?.includedMetres) || ev.standard.includedMetres < 1 || ev.standard.includedMetres > 50) err("ev.standard.includedMetres", "the cable run the standard price includes, 1–50 metres");
  text(err, "ev.standard.what", ev?.standard?.what);
  if (!isPounds(ev?.perMetre)) err("ev.perMetre", "the client's price for each extra metre, whole pounds");
  if (!Number.isInteger(ev?.maxMetres) || ev.maxMetres <= (ev?.standard?.includedMetres ?? 0) || ev.maxMetres > 100) err("ev.maxMetres", "the longest run the client prices without a survey, more than the included metres, up to 100");
  if (![60, 80, 100].includes(ev?.minFuse)) err("ev.minFuse", "the smallest main fuse the client fits to without a survey: 60, 80 or 100 (amps)");
  if (ev?.grantUrl !== undefined && !/^https:\/\/(www\.)?(gov\.uk|find-government-grants\.service\.gov\.uk)\//.test(ev.grantUrl)) err("ev.grantUrl", "a gov.uk page about the chargepoint grant (amounts change; the page never states one)");
  if (ev?.photo !== undefined) photo(err, "ev.photo", ev.photo, exists);
}

/** @param {any} d @param {Report} err */
function checkDesigner(d, err) {
  onlyKeys(d, ["message", "sizes", "rooms", "layers", "control"], "designer", err);
  text(err, "designer.message", d?.message);
  if (!list(err, "designer.sizes", d?.sizes, 1, 4, "room sizes, each { id, label }")) return;
  ids(err, "designer.sizes", d.sizes);
  const sizes = d.sizes.map((/** @type {any} */ s) => s.id);
  d.sizes.forEach((/** @type {any} */ s, /** @type {number} */ i) => { onlyKeys(s, ["id", "label"], `designer.sizes[${i}]`, err); text(err, `designer.sizes[${i}].label`, s?.label); });
  if (list(err, "designer.rooms", d?.rooms, 1, 12, "rooms, each { id, name }")) {
    ids(err, "designer.rooms", d.rooms);
    d.rooms.forEach((/** @type {any} */ r, /** @type {number} */ i) => { onlyKeys(r, ["id", "name"], `designer.rooms[${i}]`, err); text(err, `designer.rooms[${i}].name`, r?.name); });
  }
  if (list(err, "designer.layers", d?.layers, 1, 8, "layers of light, each { id, name, about, price, per: { <size>: how many } }")) {
    ids(err, "designer.layers", d.layers);
    d.layers.forEach((/** @type {any} */ l, /** @type {number} */ i) => {
      const p = `designer.layers[${i}]`;
      onlyKeys(l, ["id", "name", "about", "price", "per"], p, err);
      for (const k of ["name", "about"]) text(err, `${p}.${k}`, l?.[k]);
      if (!isPounds(l?.price) || l.price === 0) err(`${p}.price`, "the client's price for each one, fitted, whole pounds");
      if (!isObj(l?.per)) err(`${p}.per`, `how many in each size of room: { ${sizes.map((/** @type {string} */ s) => `"${s}": n`).join(", ")} }`);
      else for (const s of sizes) if (!Number.isInteger(l.per[s]) || l.per[s] < 0 || l.per[s] > 40) err(`${p}.per.${s}`, "how many in that size of room, 0–40");
    });
  }
  onlyKeys(d?.control, ["name", "price"], "designer.control", err);
  text(err, "designer.control.name", d?.control?.name);
  if (!isPounds(d?.control?.price) || d.control.price === 0) err("designer.control.price", "the client's price for the scene keypad, fitted and set up");
}

/** The dimmer: the client's own photographs of one room from one spot, from off to full. @param {any} d @param {Report} err @param {((rel: string) => boolean)|undefined} exists */
function checkDimmer(d, err, exists) {
  onlyKeys(d, ["label", "note", "frames"], "dimmer", err);
  text(err, "dimmer.label", d?.label);
  if (!list(err, "dimmer.frames", d?.frames, 2, 5, "photographs of the same room, darkest first, each { src, width, height, alt, label }")) return;
  d.frames.forEach((/** @type {any} */ f, /** @type {number} */ i) => { photo(err, `dimmer.frames[${i}]`, f, exists, ["src", "width", "height", "alt", "label"]); text(err, `dimmer.frames[${i}].label`, f?.label); });
  const [w, h] = [d.frames[0]?.width, d.frames[0]?.height];
  if (d.frames.some((/** @type {any} */ f) => f?.width !== w || f?.height !== h)) err("dimmer.frames", "every photograph the same size (taken from one spot)");
}

/** @param {any} s @param {Report} err */
function checkSteps(s, err) {
  onlyKeys(s, ["items"], "steps", err);
  if (!list(err, "steps.items", s?.items, 2, 8, "steps, each { title, when, text }")) return;
  s.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => { onlyKeys(x, ["title", "when", "text"], `steps.items[${i}]`, err); for (const k of ["title", "when", "text"]) text(err, `steps.items[${i}].${k}`, x?.[k]); });
}

/** @param {any} b @param {Report} err */
function checkBeforeYouCall(b, err) {
  onlyKeys(b, ["message", "ages", "goals"], "beforeYouCall", err);
  text(err, "beforeYouCall.message", b?.message);
  for (const k of ["ages", "goals"]) if (!Array.isArray(b?.[k]) || b[k].length < 2 || !b[k].every(isStr)) err(`beforeYouCall.${k}`, "at least two choices");
}

/** @param {any} e @param {Report} err */
function checkEstimate(e, err) {
  onlyKeys(e, ["message", "bedroomsMax", "homes", "works"], "estimate", err);
  text(err, "estimate.message", e?.message);
  if (!Number.isInteger(e?.bedroomsMax) || e.bedroomsMax < 2 || e.bedroomsMax > 12) err("estimate.bedroomsMax", "the most bedrooms the estimate covers, 2–12 (bigger homes get a survey)");
  if (list(err, "estimate.homes", e?.homes, 1, 6, "kinds of home, each { id, label, factor }")) {
    ids(err, "estimate.homes", e.homes);
    e.homes.forEach((/** @type {any} */ h, /** @type {number} */ i) => { onlyKeys(h, ["id", "label", "factor"], `estimate.homes[${i}]`, err); text(err, `estimate.homes[${i}].label`, h?.label); if (typeof h?.factor !== "number" || h.factor < 0.5 || h.factor > 2) err(`estimate.homes[${i}].factor`, "the client's multiplier for this kind of home, 0.5–2"); });
  }
  if (list(err, "estimate.works", e?.works, 1, 8, "kinds of work, each { id, name, base: { min, max }, perBedroom: { min, max } }")) {
    ids(err, "estimate.works", e.works);
    e.works.forEach((/** @type {any} */ w, /** @type {number} */ i) => {
      const p = `estimate.works[${i}]`;
      onlyKeys(w, ["id", "name", "base", "perBedroom"], p, err);
      text(err, `${p}.name`, w?.name);
      for (const k of ["base", "perBedroom"]) {
        onlyKeys(w?.[k], ["min", "max"], `${p}.${k}`, err);
        if (!isPounds(w?.[k]?.min) || !isPounds(w?.[k]?.max) || w[k].max < w[k].min) err(`${p}.${k}`, "the client's band in whole pounds, { min, max } with max ≥ min");
      }
    });
  }
}

/** @param {any} h @param {Report} err */
function checkHouse(h, err) {
  onlyKeys(h, ["message", "types", "rooms"], "house3d", err);
  text(err, "house3d.message", h?.message);
  /** @type {Set<string>} */ const types = new Set();
  if (list(err, "house3d.types", h?.types, 1, FITTINGS.length, "kinds of fitting, each { id, name, price }")) {
    h.types.forEach((/** @type {any} */ t, /** @type {number} */ i) => {
      const p = `house3d.types[${i}]`;
      onlyKeys(t, ["id", "name", "price"], p, err);
      if (!(/** @type {readonly string[]} */ (FITTINGS)).includes(t?.id)) err(`${p}.id`, `one of ${FITTINGS.join(", ")}`);
      else if (types.has(t.id)) err(`${p}.id`, `"${t.id}" is listed twice`);
      types.add(t?.id);
      text(err, `${p}.name`, t?.name);
      if (!isPounds(t?.price) || t.price === 0) err(`${p}.price`, "the client's price for each one, fitted, whole pounds");
    });
  }
  if (list(err, "house3d.rooms", h?.rooms, 2, Object.keys(ROOMS).length, "rooms, each { id, fittings: { <kind>: how many } }")) {
    const seen = new Set();
    h.rooms.forEach((/** @type {any} */ r, /** @type {number} */ i) => {
      const p = `house3d.rooms[${i}]`;
      onlyKeys(r, ["id", "fittings"], p, err);
      if (!(r?.id in ROOMS)) err(`${p}.id`, `one of the model's rooms: ${Object.keys(ROOMS).join(", ")}`);
      else if (seen.has(r.id)) err(`${p}.id`, `"${r.id}" is listed twice`);
      seen.add(r?.id);
      if (!isObj(r?.fittings) || !Object.keys(r.fittings).length) err(`${p}.fittings`, "how many of each kind in this room");
      else for (const [k, n] of Object.entries(r.fittings)) {
        if (!types.has(k)) err(`${p}.fittings.${k}`, "a kind listed in house3d.types");
        if (!Number.isInteger(n) || n < 1 || n > 30) err(`${p}.fittings.${k}`, "how many, 1–30");
      }
    });
  }
}

/** @param {any} c @param {string} mode @param {Report} err */
function checkCertificates(c, mode, err) {
  onlyKeys(c, ["source", "csvUrl", "intervalYears", "weeksBefore", "kinds", "landlord", "example", ...PAGE_HEAD], "certificates", err);
  text(err, "certificates.title", c?.title);
  text(err, "certificates.kicker", c?.kicker);
  if (!["sheet", "simulated"].includes(c?.source)) err("certificates.source", '"sheet" (the client\'s published Google Sheet) or "simulated" (demos only)');
  if (mode === "client" && c?.source === "simulated") err("certificates.source", 'simulated data is only allowed on demo sites; use "sheet"');
  if (c?.source === "sheet" && !/^https:\/\/docs\.google\.com\/spreadsheets\/.+output=csv/.test(c?.csvUrl ?? "")) err("certificates.csvUrl", "a published Google Sheet CSV link (File → Share → Publish to web → CSV)");
  if (c?.source === "simulated" && !isStr(c?.example)) err("certificates.example", "the demo's example code");
  if (mode === "client" && c?.example !== undefined) err("certificates.example", "demo sites only");
  if (!Number.isInteger(c?.intervalYears) || c.intervalYears < 1 || c.intervalYears > 10) err("certificates.intervalYears", "the client's usual years between inspections when a certificate doesn't say, 1–10");
  if (!Number.isInteger(c?.weeksBefore) || c.weeksBefore < 1 || c.weeksBefore > 26) err("certificates.weeksBefore", "how many weeks before the due date the reminder goes off, 1–26");
  if (c?.kinds !== undefined) { onlyKeys(c.kinds, Object.keys(KINDS), "certificates.kinds", err); for (const [k, v] of Object.entries(c.kinds ?? {})) text(err, `certificates.kinds.${k}`, v); }
  if (c?.landlord !== undefined) {
    onlyKeys(c.landlord, ["text", "source", "checked"], "certificates.landlord", err);
    text(err, "certificates.landlord.text", c.landlord?.text);
    if (!/^https:\/\/www\.gov\.uk\//.test(c.landlord?.source ?? "")) err("certificates.landlord.source", "the gov.uk page the landlord rule comes from");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(c.landlord?.checked ?? "")) err("certificates.landlord.checked", "the day the rule was checked against gov.uk, YYYY-MM-DD (re-check it before each build)");
  }
}
