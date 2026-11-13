// @ts-check
/**
 * Validation for the jeweller kit (fine jewellers and goldsmiths). The firmest rule of the trade: nothing about a
 * piece is guessed. Every fact (metal, stones, carat, hallmark, certificate, sourcing) and every price comes from the
 * client's own entry; a field left empty shows nothing. Claim words (hallmarked, GIA, ethical, conflict-free, lab-grown…)
 * are refused anywhere in a piece except the fact field made for them, which a demo may never fill. Demo specs and
 * prices are allowed only on a demo site that says so (pieces.demoData). Unknown keys are refused so a typo can't
 * silently switch something off.
 */
import { FACT_KEYS, CLIENT_ONLY_FACTS, claimIn } from "./lib/pieces.js";
import { isTime } from "../../core/lib/hours.js";
import { checkRangeRules } from "../../core/lib/date-range.js";

/** @typedef {(path: string, msg: string) => void} Report */
/** @param {unknown} v @returns {v is string} */
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
/** @param {unknown} v @returns {v is Record<string, any>} */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** @param {unknown} v @param {number} min @param {number} max */
const isInt = (v, min, max) => Number.isInteger(v) && /** @type {number} */ (v) >= min && /** @type {number} */ (v) <= max;
const SLUG = /^[a-z0-9-]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const PAGE_KEYS = ["title", "intro", "description"];

/** @param {Record<string, any>} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}

/**
 * @typedef {object} Ctx
 * @property {Report} err
 * @property {boolean} demo
 * @property {((rel: string) => boolean)|undefined} exists
 * @property {Set<string>} pieceIds
 * @property {Set<string>} payIds
 */

/** @param {any} p @param {string} at @param {Ctx} c */
function photo(p, at, c) {
  if (!isObj(p)) { c.err(at, "{ src, width, height, alt }"); return; }
  onlyKeys(p, ["src", "width", "height", "alt"], at, c.err);
  if (!isStr(p.src)) c.err(`${at}.src`, "the image file, e.g. img/solitaire.webp");
  else if (c.exists && !c.exists(p.src)) c.err(`${at}.src`, `file not found: ${p.src}`);
  if (!isInt(p.width, 1, 10000) || !isInt(p.height, 1, 10000)) c.err(at, "width and height in pixels");
  if (!isStr(p.alt)) c.err(`${at}.alt`, "what the photo shows, for people who can't see it");
}

/** @param {any} v @param {string} at @param {Ctx} c @param {boolean} [required] */
function text(v, at, c, required = true) {
  if (v === undefined && !required) return;
  if (!isStr(v)) c.err(at, "required text is missing");
}

/** @param {any} list @param {string} at @param {Ctx} c @param {(item: any, at: string) => void} each @returns {Set<string>} */
function idList(list, at, c, each) {
  /** @type {Set<string>} */ const ids = new Set();
  if (!Array.isArray(list) || !list.length) { c.err(at, "a non-empty list"); return ids; }
  list.forEach((item, i) => {
    const p = `${at}[${i}]`;
    if (!isObj(item)) { c.err(p, "an object"); return; }
    if (!SLUG.test(item.id ?? "")) c.err(`${p}.id`, "lowercase letters, numbers and dashes");
    else if (ids.has(item.id)) c.err(`${p}.id`, `"${item.id}" is used twice`);
    else ids.add(item.id);
    each(item, p);
  });
  return ids;
}

/** @param {any} list @param {string} at @param {Ctx} c */
function pieceRefs(list, at, c) {
  if (list === undefined) return;
  if (!Array.isArray(list)) { c.err(at, "a list of piece ids"); return; }
  list.forEach((id, i) => { if (!c.pieceIds.has(id)) c.err(`${at}[${i}]`, `no piece "${id}" in pieces.items`); });
}

/** Price exactly as the client sets it: a price, "from" a price, or on request; or nothing. @param {any} o @param {string} at @param {Ctx} c */
function price(o, at, c) {
  if (o.price !== undefined && !(typeof o.price === "number" && Number.isFinite(o.price) && o.price >= 0)) c.err(`${at}.price`, "a number of pounds, e.g. 4200 (not \"£4,200\")");
  if (o.priceFrom !== undefined && (typeof o.priceFrom !== "boolean" || o.price === undefined)) c.err(`${at}.priceFrom`, "true to show \"From £…\"; needs a price");
  if (o.onRequest !== undefined && (o.onRequest !== true || o.price !== undefined)) c.err(`${at}.onRequest`, "true to show \"Price on request\", instead of a price");
}

/** Claim words outside their own fact field. @param {any} v @param {string} at @param {Ctx} c */
function noClaims(v, at, c) {
  if (typeof v === "string") {
    const field = claimIn(v);
    if (field) c.err(at, field === "aftercare"
      ? "makes a guarantee or warranty claim; put the client's own aftercare terms in \"aftercare\" or \"questions\""
      : `makes a ${field} claim; it may only be stated in the piece's facts.${field}, in the client's own words`);
  } else if (Array.isArray(v)) v.forEach((x, i) => noClaims(x, `${at}[${i}]`, c));
  else if (isObj(v)) for (const [k, x] of Object.entries(v)) if (k !== "facts") noClaims(x, `${at}.${k}`, c);
}

const PIECE_KEYS = ["id", "name", "collection", "photo", "photos", "line", "story", "price", "priceFrom", "onRequest", "facts",
  "occasions", "months", "shape", "band", "hand", "worn", "pairs", "engrave", "gift"];

/** The client's own fact lines: known keys, words only, claims only in their own field and never on a demo. @param {any} facts @param {string} at @param {Ctx} c */
function factsOf(facts, at, c) {
  if (!isObj(facts)) { c.err(at, `an object with any of: ${FACT_KEYS.join(", ")}`); return; }
  onlyKeys(facts, FACT_KEYS, at, c.err);
  for (const [k, v] of Object.entries(facts)) {
    if (!isStr(v)) c.err(`${at}.${k}`, "the client's own words, or leave it out");
    const own = CLIENT_ONLY_FACTS.includes(k);
    if (c.demo && own) { c.err(`${at}.${k}`, "a demo never carries hallmarks, certificates or sourcing claims; only a client states them"); continue; }
    const f = own ? null : claimIn(String(v));
    if (f && f !== k) c.err(`${at}.${k}`, `makes a ${f} claim; put it in facts.${f}, in the client's own words`);
  }
}

/** @param {any} hand @param {string} at @param {Ctx} c */
function handOf(hand, at, c) {
  if (!isObj(hand)) { c.err(at, "{ photo, widthMm }"); return; }
  onlyKeys(hand, ["photo", "widthMm", "size"], at, c.err);
  photo(hand.photo, `${at}.photo`, c);
  // True scale needs to know how wide the photo is in real life; the client measures it when the photo is taken.
  if (hand.widthMm !== undefined && !(typeof hand.widthMm === "number" && hand.widthMm >= 30 && hand.widthMm <= 250)) c.err(`${at}.widthMm`, "the real width the photo shows, in mm (30–250), measured when it was taken");
  if (hand.size !== undefined && !/^[A-Z](½)?$/.test(hand.size)) c.err(`${at}.size`, "the UK ring size worn in the photo, e.g. \"L\" or \"L½\"");
}

/** A card-sized copy of a photo (img/c/…) must exist: cards use it so pages of many pieces stay light. @param {any} p @param {string} at @param {Ctx} c */
function cardCopy(p, at, c) {
  if (c.exists && isStr(p?.src) && c.exists(p.src) && !c.exists(p.src.replace(/^img\//, "img/c/"))) c.err(at, `needs a 900×1125 card copy at ${p.src.replace(/^img\//, "img/c/")}`);
}

/** @param {any} p @param {string} at @param {Ctx} c @param {Set<string>} collections */
function piece(p, at, c, collections) {
  onlyKeys(p, PIECE_KEYS, at, c.err);
  text(p.name, `${at}.name`, c);
  if (!collections.has(p.collection)) c.err(`${at}.collection`, `one of the collection ids: ${[...collections].join(", ")}`);
  photo(p.photo, `${at}.photo`, c);
  cardCopy(p.photo, `${at}.photo`, c);
  (p.photos ?? []).forEach((/** @type {any} */ x, /** @type {number} */ i) => photo(x, `${at}.photos[${i}]`, c));
  text(p.line, `${at}.line`, c, false);
  text(p.story, `${at}.story`, c, false);
  price(p, at, c);
  if (p.facts !== undefined) factsOf(p.facts, `${at}.facts`, c);
  noClaims({ ...p, photo: p.photo?.alt, photos: (p.photos ?? []).map((/** @type {any} */ x) => x?.alt) }, at, c);
  const ok = {
    occasions: (/** @type {any} */ v) => Array.isArray(v) && v.every((x) => SLUG.test(x)),
    months: (/** @type {any} */ v) => Array.isArray(v) && v.every((m) => isInt(m, 1, 12)),
    shape: (/** @type {any} */ v) => SLUG.test(v),
  };
  const say = { occasions: "occasion ids", months: "birthstone months, 1–12", shape: "a stone shape id from \"stones\"" };
  for (const k of /** @type {(keyof typeof ok)[]} */ (Object.keys(ok))) if (p[k] !== undefined && !ok[k](p[k])) c.err(`${at}.${k}`, say[k]);
  for (const k of ["band", "engrave", "gift"]) if (p[k] !== undefined && typeof p[k] !== "boolean") c.err(`${at}.${k}`, "true or false");
  if (p.hand !== undefined) handOf(p.hand, `${at}.hand`, c);
  // The piece worn (on a neck, an ear, a wrist, a hand): shown beside it on its page.
  if (p.worn !== undefined) photo(p.worn, `${at}.worn`, c);
}

/** @param {any} pg @param {string} at @param {Ctx} c @param {string[]} [more] */
function page(pg, at, c, more = []) {
  if (!isObj(pg)) { c.err(at, "an object with title and intro"); return false; }
  onlyKeys(pg, [...PAGE_KEYS, ...more], at, c.err);
  text(pg.title, `${at}.title`, c);
  text(pg.intro, `${at}.intro`, c);
  text(pg.description, `${at}.description`, c, false);
  return true;
}

/** @param {any} o @param {string} at @param {Ctx} c @param {string[]} keys @returns {boolean} */
function block(o, at, c, keys) {
  if (!isObj(o)) { c.err(at, `{ ${keys.join(", ")} }`); return false; }
  onlyKeys(o, keys, at, c.err);
  return true;
}

/** @param {any} list @param {string} at @param {Ctx} c @param {string[]} keys @param {(x: any, at: string) => void} [each] */
function steps(list, at, c, keys, each) {
  if (!Array.isArray(list) || !list.length) { c.err(at, "a non-empty list"); return; }
  list.forEach((s, i) => {
    const p = `${at}[${i}]`;
    if (!isObj(s)) { c.err(p, "an object"); return; }
    onlyKeys(s, keys, p, c.err);
    text(s.title, `${p}.title`, c);
    text(s.text, `${p}.text`, c);
    each?.(s, p);
  });
}

/** @param {any} list @param {string} at @param {Ctx} c */
function words(list, at, c) {
  if (!Array.isArray(list) || !list.length || !list.every(isStr)) c.err(at, "a list of short phrases");
}

/** The pieces and their collections; fills c.pieceIds. @param {any} site @param {Ctx} c */
function checkPieces(site, c) {
  const P = site.pieces;
  if (P === undefined) return;
  if (!block(P, "pieces", c, ["demoData", "collections", "items"])) return;
  if (P.demoData !== undefined && P.demoData !== true) c.err("pieces.demoData", "true on a demo whose specs and prices are made up for the demo");
  if (P.demoData && site.mode !== "demo") c.err("pieces.demoData", "a client site shows only the client's own facts and prices; remove demoData");
  const collections = idList(P.collections, "pieces.collections", c, (x, at) => {
    onlyKeys(x, ["id", "name", "line", "door"], at, c.err);
    text(x.name, `${at}.name`, c);
    // The collection's door on the home page and the photograph on its page: a piece worn, 3:4, about 900×1200.
    if (x.door !== undefined) photo(x.door, `${at}.door`, c);
    text(x.line, `${at}.line`, c, false);
    noClaims(x.line, `${at}.line`, c);
  });
  c.pieceIds = idList(P.items, "pieces.items", c, (x, at) => piece(x, at, c, collections));
  (P.items ?? []).forEach((/** @type {any} */ p, /** @type {number} */ i) => { if (isObj(p)) pieceRefs(p.pairs, `pieces.items[${i}].pairs`, c); });
  for (const id of collections) if (!(P.items ?? []).some((/** @type {any} */ p) => p?.collection === id)) c.err("pieces.collections", `"${id}" has no pieces`);
}

/** The hero's piece and its two crops. @param {any} site @param {Ctx} c */
function checkHero(site, c) {
  const h = site.hero ?? {};
  for (const k of ["piece", "photo", "photoTall"]) if (h[k] === undefined) c.err(`hero.${k}`, "required for this look: the piece the home page opens on, its wide photo and its tall (phone) photo");
  if (h.piece !== undefined && !c.pieceIds.has(h.piece)) c.err("hero.piece", "the id of the piece the home page opens on");
  if (h.photo !== undefined) photo(h.photo, "hero.photo", c);
  if (h.photoTall !== undefined) photo(h.photoTall, "hero.photoTall", c);
}

/** @param {any} A @param {Ctx} c @param {boolean} picker the shared date picker is on */
function checkAppointments(A, c, picker) {
  if (!block(A, "appointments", c, ["message", "reasons", "when", "reply", "notice", "horizon", "slots", "minutes", "bankHolidays"])) return;
  text(A.message, "appointments.message", c);
  words(A.reasons, "appointments.reasons", c);
  if (!picker || A.when !== undefined) words(A.when, "appointments.when", c);
  text(A.reply, "appointments.reply", c, false);
  if (A.notice !== undefined && !isInt(A.notice, 0, 30)) c.err("appointments.notice", "days' notice the house needs, 0–30");
  if (A.horizon !== undefined && !isInt(A.horizon, 7, 365)) c.err("appointments.horizon", "how many days ahead can be asked for, 7–365");
  if (A.minutes !== undefined && !isInt(A.minutes, 15, 240)) c.err("appointments.minutes", "how long an appointment is, in minutes");
  if (A.slots !== undefined && !(Array.isArray(A.slots) && A.slots.length && A.slots.every(isTime))) c.err("appointments.slots", "start times, [\"10:30\", \"14:00\"]");
  if (picker) checkPicker(A, c);
}

/** The shared date picker on the appointment request. @param {any} A @param {Ctx} c */
function checkPicker(A, c) {
  // The shared date picker: the house's own times and whether it opens on bank holidays are never guessed.
  if (A.slots === undefined) c.err("appointments.slots", "the date picker is on: the house's own appointment times, [\"10:30\", \"14:00\"]");
  if (!["closed", "open"].includes(A.bankHolidays)) c.err("appointments.bankHolidays", "the date picker is on: \"closed\" or \"open\" on bank holidays");
  if (A.slots === undefined || A.bankHolidays === undefined) return;
  const named = { horizonDays: "horizon", leadHours: "notice", slotMinutes: "minutes" };
  checkRangeRules({ horizonDays: A.horizon ?? 60, leadHours: (A.notice ?? 1) * 24, bankHolidays: A.bankHolidays, slots: A.slots, slotMinutes: A.minutes ?? 60 }, "appointments",
    (at, msg) => c.err(at.replace(/horizonDays|leadHours|slotMinutes/, (k) => named[/** @type {keyof typeof named} */ (k)]), msg));
}

/** The home page's quiet parts: the room, the box, the visit. @param {any} site @param {Ctx} c */
function checkHouse(site, c) {
  if (site.room !== undefined && block(site.room, "room", c, ["photo", "line"])) { photo(site.room.photo, "room.photo", c); text(site.room.line, "room.line", c); }
  if (site.box !== undefined && block(site.box, "box", c, ["photo", "line", "items"])) {
    photo(site.box.photo, "box.photo", c); text(site.box.line, "box.line", c);
    if (site.box.items !== undefined) words(site.box.items, "box.items", c);
    noClaims(site.box, "box", c);
  }
  if (site.prepared !== undefined && block(site.prepared, "prepared", c, ["steps", "length", "bring"])) {
    steps(site.prepared.steps, "prepared.steps", c, ["title", "text"]);
    text(site.prepared.length, "prepared.length", c, false);
    if (site.prepared.bring !== undefined) words(site.prepared.bring, "prepared.bring", c);
  }
}

/** @param {any} B @param {Ctx} c */
function checkBespoke(B, c) {
  if (!page(B, "bespoke", c, ["steps", "timing", "deposit", "brief", "photo"])) return;
  steps(B.steps, "bespoke.steps", c, ["title", "text", "when"]);
  text(B.timing, "bespoke.timing", c);
  if (B.photo !== undefined) photo(B.photo, "bespoke.photo", c);
  if (B.deposit !== undefined && block(B.deposit, "bespoke.deposit", c, ["text", "pay"])) {
    text(B.deposit.text, "bespoke.deposit.text", c);
    if (B.deposit.pay !== undefined && !c.payIds.has(B.deposit.pay)) c.err("bespoke.deposit.pay", "the id of a deposit in payLinks.items");
  }
  if (block(B.brief, "bespoke.brief", c, ["kinds", "metals", "budgets"])) for (const k of ["kinds", "metals", "budgets"]) words(B.brief[k], `bespoke.brief.${k}`, c);
  noClaims(B, "bespoke", c);
}

/** @param {any} F @param {any} site @param {Ctx} c */
function checkFamily(F, site, c) {
  if (!page(F, "family", c, ["pairs", "keep", "start", "demoNote"])) return;
  if (!Array.isArray(F.pairs) || !F.pairs.length) c.err("family.pairs", "at least one before and after");
  else F.pairs.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
    const at = `family.pairs[${i}]`;
    if (!block(x, at, c, ["before", "after", "text"])) return;
    photo(x.before, `${at}.before`, c); photo(x.after, `${at}.after`, c); text(x.text, `${at}.text`, c);
  });
  words(F.keep, "family.keep", c);
  text(F.start, "family.start", c);
  if (F.demoNote !== undefined && site.mode !== "demo") c.err("family.demoNote", "demo sites only");
}

/** @param {any} GI @param {Ctx} c */
function checkGifts(GI, c) {
  if (!page(GI, "gifts", c, ["bands", "wrapping"])) return;
  if (!Array.isArray(GI.bands) || !GI.bands.length) c.err("gifts.bands", "price bands the client sets: [{ label, max }]");
  else GI.bands.forEach((/** @type {any} */ b, /** @type {number} */ i) => {
    if (!block(b, `gifts.bands[${i}]`, c, ["label", "min", "max"])) return;
    text(b.label, `gifts.bands[${i}].label`, c);
    for (const k of ["min", "max"]) if (b[k] !== undefined && !isInt(b[k], 0, 10_000_000)) c.err(`gifts.bands[${i}].${k}`, "whole pounds");
  });
  text(GI.wrapping, "gifts.wrapping", c);
}

/** @param {any} O @param {Ctx} c */
function checkOccasions(O, c) {
  if (!page(O, "occasions", c, ["items", "pages"])) return;
  idList(O.items, "occasions.items", c, (x, at) => {
    onlyKeys(x, ["id", "name", "from", "to", "line", "pieces"], at, c.err);
    text(x.name, `${at}.name`, c); text(x.line, `${at}.line`, c);
    if (!DATE.test(x.from ?? "") || !DATE.test(x.to ?? "") || x.to < x.from) c.err(at, "from and to as YYYY-MM-DD, to on or after from");
    pieceRefs(x.pieces, `${at}.pieces`, c);
  });
  // An occasion's own page (anniversaries, birthdays, Valentine's…): its photograph, a few words, its pieces.
  if (O.pages !== undefined) idList(O.pages, "occasions.pages", c, (x, at) => {
    onlyKeys(x, ["id", "name", "photo", "photoPhone", "line", "story", "pieces", "by", "reminder", "birthstones"], at, c.err);
    text(x.name, `${at}.name`, c); text(x.line, `${at}.line`, c); text(x.story, `${at}.story`, c, false); text(x.by, `${at}.by`, c, false);
    photo(x.photo, `${at}.photo`, c); photo(x.photoPhone, `${at}.photoPhone`, c);
    if (!Array.isArray(x.pieces) || !x.pieces.length) c.err(`${at}.pieces`, "the pieces the house would show for it");
    else pieceRefs(x.pieces, `${at}.pieces`, c);
    for (const k of ["reminder", "birthstones"]) if (x[k] !== undefined && typeof x[k] !== "boolean") c.err(`${at}.${k}`, "true or false");
    noClaims(x, at, c);
  });
}

/** Bridal party orders: matching pieces for the party, by role. @param {any} BP @param {Ctx} c */
function checkParty(BP, c) {
  if (!page(BP, "party", c, ["photo", "photoPhone", "pieces", "roles", "max", "lead"])) return;
  photo(BP.photo, "party.photo", c); photo(BP.photoPhone, "party.photoPhone", c);
  if (!Array.isArray(BP.pieces) || !BP.pieces.length) c.err("party.pieces", "the pieces offered for a party, as piece ids");
  else pieceRefs(BP.pieces, "party.pieces", c);
  words(BP.roles, "party.roles", c);
  if (!isInt(BP.max, 1, 40)) c.err("party.max", "the most of one piece in an order, 1–40");
  text(BP.lead, "party.lead", c, false);
  noClaims(BP, "party", c);
}

/** @param {any} BS @param {Ctx} c */
function checkBirthstones(BS, c) {
  if (!page(BS, "birthstones", c, ["months"])) return;
  if (!Array.isArray(BS.months) || BS.months.length !== 12) { c.err("birthstones.months", "twelve months, January first: { stone, line }"); return; }
  BS.months.forEach((/** @type {any} */ m, /** @type {number} */ i) => {
    if (!block(m, `birthstones.months[${i}]`, c, ["stone", "line"])) return;
    text(m.stone, `birthstones.months[${i}].stone`, c);
    text(m.line, `birthstones.months[${i}].line`, c, false);
  });
}

/** The guide pages: bridal, engagement, bands, ring size, aftercare. @param {any} site @param {Ctx} c */
function checkGuides(site, c) {
  const B = site.bridal;
  if (B !== undefined && page(B, "bridal", c, ["collections", "words", "photo"])) {
    if (!Array.isArray(B.collections) || !B.collections.length) c.err("bridal.collections", "the collection ids shown on the page");
    if (B.words !== undefined) steps(B.words, "bridal.words", c, ["title", "text"]);
    if (B.photo !== undefined) photo(B.photo, "bridal.photo", c);
  }
  const G = site.engagementGuide;
  if (G !== undefined && page(G, "engagementGuide", c, ["metals", "settings", "sizing"])) {
    steps(G.metals, "engagementGuide.metals", c, ["title", "text"]);
    steps(G.settings, "engagementGuide.settings", c, ["title", "text"]);
    text(G.sizing, "engagementGuide.sizing", c);
    noClaims(G, "engagementGuide", c);
  }
  const W = site.weddingBands;
  if (W !== undefined && page(W, "weddingBands", c, ["collection", "notes"])) {
    if (!isStr(W.collection)) c.err("weddingBands.collection", "the collection id of the bands");
    steps(W.notes, "weddingBands.notes", c, ["title", "text"]);
  }
  const RS = site.ringSizer;
  if (RS !== undefined && page(RS, "ringSizer", c, ["postal", "message"])) { text(RS.postal, "ringSizer.postal", c); text(RS.message, "ringSizer.message", c); }
  const AC = site.aftercare;
  if (AC !== undefined && page(AC, "aftercare", c, ["items", "reminder"])) { steps(AC.items, "aftercare.items", c, ["title", "text"]); text(AC.reminder, "aftercare.reminder", c); }
}

/** The reminder and the stone guide. @param {any} site @param {Ctx} c */
function checkTools(site, c) {
  const AN = site.anniversary;
  if (AN !== undefined && block(AN, "anniversary", c, ["weeks", "line"])) {
    if (!Array.isArray(AN.weeks) || !AN.weeks.length || !AN.weeks.every((/** @type {any} */ w) => isInt(w, 1, 12))) c.err("anniversary.weeks", "weeks of notice to offer, e.g. [2, 4, 6]");
    text(AN.line, "anniversary.line", c);
  }
  if (site.stones !== undefined) idList(site.stones, "stones", c, (x, at) => {
    onlyKeys(x, ["id", "name", "photo", "text"], at, c.err);
    text(x.name, `${at}.name`, c); photo(x.photo, `${at}.photo`, c); text(x.text, `${at}.text`, c);
    noClaims(x, at, c);
  });
}

/** @param {any} ST @param {any} site @param {Ctx} c */
function checkStories(ST, site, c) {
  if (!page(ST, "stories", c, ["items", "demoNote"])) return;
  idList(ST.items, "stories.items", c, (x, at) => {
    onlyKeys(x, ["id", "title", "line", "weeks", "steps", "piece"], at, c.err);
    text(x.title, `${at}.title`, c); text(x.line, `${at}.line`, c); text(x.weeks, `${at}.weeks`, c, false);
    if (x.piece !== undefined && !c.pieceIds.has(x.piece)) c.err(`${at}.piece`, "a piece id");
    if (!Array.isArray(x.steps) || x.steps.length < 2) c.err(`${at}.steps`, "two or more: the drawing to the finished piece");
    else x.steps.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
      if (!block(s, `${at}.steps[${i}]`, c, ["photo", "caption"])) return;
      photo(s.photo, `${at}.steps[${i}].photo`, c); cardCopy(s.photo, `${at}.steps[${i}].photo`, c); text(s.caption, `${at}.steps[${i}].caption`, c);
    });
    noClaims(x, at, c);
  });
  if (ST.demoNote !== undefined && site.mode !== "demo") c.err("stories.demoNote", "demo sites only");
}

/** The Signature parts: the stories, engraving, the proposal. @param {any} site @param {Ctx} c */
function checkSignature(site, c) {
  if (site.stories !== undefined) checkStories(site.stories, site, c);
  const EN = site.engraving;
  if (EN !== undefined && block(EN, "engraving", c, ["max", "styles", "photo", "note", "path"])) {
    if (!isInt(EN.max, 4, 60)) c.err("engraving.max", "the most letters the house engraves inside a band, 4–60");
    idList(EN.styles, "engraving.styles", c, (x, at) => { onlyKeys(x, ["id", "label"], at, c.err); text(x.label, `${at}.label`, c); if (!["script", "roman", "block"].includes(x.id)) c.err(`${at}.id`, "script, roman or block"); });
    photo(EN.photo, "engraving.photo", c); text(EN.note, "engraving.note", c);
    // The curve of the band's inside in the photo, as an SVG path in the photo's own pixels, for the words to follow.
    if (!/^M[\d\s.,MLCQAZmlcqaz-]+$/.test(EN.path ?? "")) c.err("engraving.path", "an SVG path (M… C…) along the inside of the band in the photo, in its pixels");
  }
  const GN = site.giftNote;
  if (GN !== undefined && block(GN, "giftNote", c, ["line", "max", "sample"])) {
    text(GN.line, "giftNote.line", c); text(GN.sample, "giftNote.sample", c, false);
    if (!isInt(GN.max, 20, 300)) c.err("giftNote.max", "the most letters the card in the box takes, 20–300");
  }
  const PR = site.proposal;
  if (PR !== undefined && block(PR, "proposal", c, ["line", "styles", "budgets"])) { text(PR.line, "proposal.line", c); words(PR.styles, "proposal.styles", c); words(PR.budgets, "proposal.budgets", c); }
}

/** Gift parts that need something to show. @param {any} site @param {any[]} items @param {(id: string) => boolean} on @param {Ctx} c */
function checkGiftParts(site, items, on, c) {
  const bands = Array.isArray(site.gifts?.bands) ? site.gifts.bands : [];
  if (on("gift-shortlist") && !bands.some((/** @type {any} */ b) => items.some((/** @type {any} */ p) => p?.gift && typeof p.price === "number" && !p.onRequest && p.price >= (b?.min ?? 0) && p.price <= (b?.max ?? Infinity)))) c.err("gifts.bands", "\"gift-shortlist\" is on but no priced gift piece falls in any band");
  if (on("the-card") && !Array.isArray(site.occasions?.pages)) c.err("occasions.pages", "\"the-card\" is on but there are no occasion pages to put it on");
}

/** Parts that only work when a piece has what they show. @param {any} site @param {Ctx} c */
function checkShown(site, c) {
  const on = (/** @type {string} */ id) => Array.isArray(site.features) && site.features.includes(id);
  const items = Array.isArray(site.pieces?.items) ? site.pieces.items : [];
  if (on("on-a-hand") && !items.some((/** @type {any} */ p) => p?.hand)) c.err("pieces.items", "\"on-a-hand\" is on but no piece has a \"hand\" photo");
  if (on("the-piece") && !items.some((/** @type {any} */ p) => p?.photos?.length)) c.err("pieces.items", "\"the-piece\" is on but no piece has macro \"photos\"");
  if (on("pair-it") && !items.some((/** @type {any} */ p) => p?.pairs?.length)) c.err("pieces.items", "\"pair-it\" is on but no piece lists \"pairs\"");
  checkGiftParts(site, items, on, c);
  if (on("stone-guide") && Array.isArray(site.stones)) for (const s of site.stones) if (isObj(s) && !items.some((/** @type {any} */ p) => p?.shape === s.id)) c.err("stones", `"${s.id}" has no piece in that shape`);
}

/** @param {any} site @param {string} id */
const on = (site, id) => Array.isArray(site.features) && site.features.includes(id);

/**
 * @param {any} site @param {Report} err @param {((rel: string) => boolean)|undefined} exists
 */
export function checkJeweller(site, err, exists) {
  if (site.kit !== "jeweller") return;
  /** @type {Ctx} */
  const c = { err, demo: site.mode === "demo", exists, pieceIds: new Set(), payIds: new Set((site.payLinks?.items ?? []).map((/** @type {any} */ p) => p?.id)) };
  checkPieces(site, c);
  checkHero(site, c);
  if (site.piecesPage !== undefined) page(site.piecesPage, "piecesPage", c);
  if (site.appointments !== undefined) checkAppointments(site.appointments, c, on(site, "date-range") && on(site, "appointment-request"));
  checkHouse(site, c);
  checkGuides(site, c);
  checkTools(site, c);
  if (site.bespoke !== undefined) checkBespoke(site.bespoke, c);
  if (site.family !== undefined) checkFamily(site.family, site, c);
  if (site.gifts !== undefined) checkGifts(site.gifts, c);
  if (site.occasions !== undefined) checkOccasions(site.occasions, c);
  if (site.birthstones !== undefined) checkBirthstones(site.birthstones, c);
  if (site.party !== undefined) checkParty(site.party, c);
  checkSignature(site, c);
  checkShown(site, c);
}
