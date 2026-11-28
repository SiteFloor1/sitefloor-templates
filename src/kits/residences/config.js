// @ts-check
/**
 * Validation for the residences kit. Each setting is described once as a shape (below) and checked by one walker:
 * unknown keys are refused, required text can't be blank, files must exist, and a demo can never carry a real
 * scheme membership number. The law decides what must be there: the fees and terms page on every site, the redress
 * scheme named, and nothing that would show a price without its mandatory fees.
 */
import { RULES } from "./lib/rules.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @param {any} v */ const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {any} v */ const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const REF = /^[A-Za-z0-9-]{1,12}$/;
const DEMO_NUMBER = "000000";
/** Pages the kit builds, so a collection's slug can't take one. */
export const RESERVED = ["index", "fees", "viewing", "residences", "quote", "areas", "short-lets", "long-lets", "serviced", "arriving", "about", "neighbourhood", "concierge", "corporate", "landlords", "journal", "visit", "privacy", "404"];

/**
 * A shape is a type name, or [shape] for a non-empty list, or { key: shape } for an object (keys ending "?" are
 * optional). Types: text, lines (non-empty list of text), int, num, bool, ymd, ym, url, photo, slug.
 * @typedef {string | any[] | Record<string, any>} Shape
 */
const PHOTO = { src: "file", "small?": "file", "tall?": "file", width: "int", height: "int", "tallWidth?": "int", "tallHeight?": "int", alt: "text", credit: "text", "position?": "position" };
const ITEMS = [{ title: "text", text: "text" }];
/** @type {Record<string, Shape>} */
const SHAPES = {
  hero: { kicker: "text", title: "text", intro: "text", photo: PHOTO },
  homes: { source: "source", "csvUrl?": "url", "staleAfterHours?": "int", ask: "text", photos: "photoMap", "plans?": "photoMap", "tours?": "tourMap" },
  stay: { stops: ["int"], start: "int", home: "ref" },
  light: { place: { lat: "num", lng: "num" } },
  fees: { intro: "text", stays: ITEMS, charges: [{ name: "text", price: "text", "note?": "text" }], cancellation: "text", tenancy: "lines" },
  schemes: { redress: { name: "text", member: "member", url: "url" }, "cmp?": { name: "text", member: "member", url: "url" }, deposits: "text" },
  viewing: { intro: "text", message: "text", kinds: "lines" },
  areas: { intro: "text", items: [{ slug: "slug", name: "text", line: "text", photo: PHOTO, notes: [{ label: "text", text: "text" }] }] },
  shortLets: { intro: "text", points: ITEMS, terms: "lines" },
  longLets: { intro: "text", points: ITEMS },
  serviced: { intro: "text", columns: "lines", rows: [{ item: "text", values: "lines" }] },
  arriving: { intro: "text", hours: "text", steps: ITEMS, late: "text", "photo?": PHOTO },
  about: { intro: "text", paragraphs: "lines", photo: PHOTO },
  neighbourhood: { intro: "text", centre: { lat: "num", lng: "num", label: "text" }, ring: "int", checked: "ym", places: [{ name: "text", kind: "text", lat: "num", lng: "num", "minutes?": "int", "note?": "text" }] },
  concierge: { intro: "text", message: "text", hours: "text", services: [{ label: "text", "note?": "text" }], photo: PHOTO },
  corporate: { intro: "text", points: ITEMS, message: "text" },
  owners: { intro: "text", services: [{ name: "text", fee: "text", includes: "lines" }] },
  journal: { intro: "text", items: [{ slug: "slug", title: "text", summary: "text", date: "ymd", "checked?": "ymd", body: "lines", "sources?": [{ label: "text", url: "url" }] }] },
};

/**
 * @param {any} v @param {Shape} shape @param {string} at
 * @param {{ err: Report, exists?: (rel: string) => boolean, mode: string, slugs: Set<string> }} o
 */
function walk(v, shape, at, o) {
  if (Array.isArray(shape)) {
    if (!Array.isArray(v) || !v.length) { o.err(at, "at least one"); return; }
    v.forEach((x, i) => walk(x, shape[0], `${at}[${i}]`, o));
    return;
  }
  if (isObj(shape)) {
    if (!isObj(v)) { o.err(at, `required: { ${Object.keys(shape).join(", ")} }`); return; }
    const keys = Object.keys(shape).map((k) => k.replace(/\?$/, ""));
    for (const k of Object.keys(v)) if (!keys.includes(k)) o.err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
    for (const [k, s] of Object.entries(shape)) {
      const key = k.replace(/\?$/, "");
      if (k.endsWith("?") && v[key] === undefined) continue;
      walk(v[key], s, `${at}.${key}`, o);
    }
    return;
  }
  switch (shape) {
    case "text": if (!isStr(v)) o.err(at, "required text is missing"); break;
    case "lines": if (!Array.isArray(v) || !v.length || v.some((x) => !isStr(x))) o.err(at, "at least one line of text"); break;
    case "int": if (!Number.isInteger(v) || v < 0) o.err(at, "a whole number"); break;
    case "num": if (typeof v !== "number" || !Number.isFinite(v)) o.err(at, "a number"); break;
    case "ymd": if (!/^\d{4}-\d{2}-\d{2}$/.test(v ?? "")) o.err(at, "a date, YYYY-MM-DD"); break;
    case "ym": if (!/^\d{4}-\d{2}$/.test(v ?? "")) o.err(at, "a month, YYYY-MM"); break;
    case "url": if (!/^https:\/\/[^\s]+$/.test(v ?? "")) o.err(at, "an https:// link"); break;
    case "ref": if (!REF.test(v ?? "")) o.err(at, "a home's ref from the sheet"); break;
    case "position": if (!/^\d{1,3}% \d{1,3}%$/.test(v ?? "")) o.err(at, 'the crop\'s focus, e.g. "50% 30%"'); break;
    case "file":
      if (!isStr(v)) o.err(at, "required");
      else if (o.exists && !o.exists(v)) o.err(at, `file not found: ${v}`);
      break;
    case "slug":
      if (!SLUG.test(v ?? "")) o.err(at, "lowercase words joined by dashes");
      else if (RESERVED.includes(v) || o.slugs.has(v)) o.err(at, `"${v}" is already a page`);
      o.slugs.add(v);
      break;
    case "source": if (!["sheet", "simulated"].includes(v)) o.err(at, '"sheet" (a client) or "simulated" (a demo)'); break;
    case "member":
      if (!isStr(v)) o.err(at, "the membership number as the scheme shows it");
      else if (o.mode === "demo" && v !== DEMO_NUMBER) o.err(at, `demo sites are fictional: use ${DEMO_NUMBER} so no real business is named`);
      else if (o.mode === "client" && v === DEMO_NUMBER) o.err(at, "is a demo number; a client site needs the real one from the scheme");
      break;
    case "photoMap":
      if (!isObj(v) || !Object.keys(v).length) o.err(at, "{ ref: photo } for each home");
      else for (const [ref, p] of Object.entries(v)) { if (!REF.test(ref)) o.err(`${at}.${ref}`, "a home's ref"); walk(p, PHOTO, `${at}.${ref}`, o); }
      break;
    case "tourMap":
      if (!isObj(v)) o.err(at, "{ ref: link } for each home with a tour");
      else for (const [ref, u] of Object.entries(v)) if (!/^https:\/\/my\.matterport\.com\/show\/\?m=[A-Za-z0-9]+$/.test(String(u))) o.err(`${at}.${ref}`, "the tour's https://my.matterport.com/show/?m=… link");
      break;
    default: o.err(at, `unknown shape ${String(shape)}`);
  }
}

/** @param {any} site @param {Report} err @param {((rel: string) => boolean)|undefined} [exists] */
export function checkResidences(site, err, exists) {
  if (site.kit !== "residences") return;
  const on = (/** @type {string} */ id) => Array.isArray(site.features) && site.features.includes(id);
  if (!on("residences-fees")) err("features", '"residences-fees" is required on every residences site: its fees, terms and redress scheme must be shown');
  const o = { err, exists, mode: site.mode, slugs: new Set() };
  for (const [key, shape] of Object.entries(SHAPES)) {
    if (site[key] === undefined) continue;
    walk(site[key], shape, key, o);
  }
  const r = site.schemes?.redress?.name;
  if (isStr(r) && !RULES.redress.schemes.includes(r)) err("schemes.redress.name", `one of the approved schemes: ${RULES.redress.schemes.join(", ")}`);
  const h = site.homes;
  if (isObj(h)) {
    if (h.source === "sheet" && !/^https:\/\/docs\.google\.com\/spreadsheets\/.+output=csv/.test(h.csvUrl ?? "")) err("homes.csvUrl", "the sheet's published CSV link (File → Share → Publish to web → CSV)");
    if (h.source === "simulated" && site.mode !== "demo") err("homes.source", "only a demo may simulate its homes");
    if (h.staleAfterHours !== undefined && (h.staleAfterHours < 1 || h.staleAfterHours > 72)) err("homes.staleAfterHours", "1 to 72 hours");
  }
  const s = site.stay;
  if (isObj(s) && Array.isArray(s.stops)) {
    if (s.stops.some((n, i) => !Number.isInteger(n) || n < 1 || n > 89 || (i && n <= s.stops[i - 1]))) err("stay.stops", "nights from 1 to 89, each more than the last (a long let is added after them)");
    if (Number.isInteger(s.start) && s.start > s.stops.length) err("stay.start", `a position from 0 to ${s.stops.length} (the last is the long let)`);
  }
  const sv = site.serviced;
  if (isObj(sv) && Array.isArray(sv.columns) && Array.isArray(sv.rows)) sv.rows.forEach((/** @type {any} */ r, /** @type {number} */ i) => {
    if (Array.isArray(r?.values) && r.values.length !== sv.columns.length) err(`serviced.rows[${i}].values`, `one for each of the ${sv.columns.length} columns`);
  });
  const nb = site.neighbourhood;
  if (isObj(nb) && Number.isInteger(nb.ring) && (nb.ring < 5 || nb.ring > 30 || nb.ring % 5)) err("neighbourhood.ring", "the outer ring in minutes: 5, 10, 15, 20, 25 or 30");
  if (on("residences-plans") && !isObj(h?.plans)) err("homes.plans", "the floor plan of each home: { ref: photo }");
  if (on("residences-tour") && !isObj(h?.tours)) err("homes.tours", "each home's tour link: { ref: link }");
}
