// @ts-check
/**
 * Validation for the lingerie kit (lingerie boutiques and women-founded lingerie brands): the shop's mode, collections
 * and pieces, categories, chapters, the size guide, fittings, gifts, the guide pages, the fit passport, the private
 * evening, the drop and pre-orders. Unknown keys are refused so a typo can't silently switch something off; sample
 * data is refused on client sites; every piece, colour, page and Payment Link a setting names must exist.
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
const HEX = /^#[0-9a-f]{6}$/i;
const HTTPS = /^https:\/\/[^\s]+$/;
const SHEET = /^https:\/\/docs\.google\.com\/spreadsheets\/.+output=csv/;
const FORM = /^https:\/\/docs\.google\.com\/forms\/d\/e\/[A-Za-z0-9_-]+\/viewform$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const LOCAL = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d$/;
/** Two small checks kept here so validation has no browser-side code in its imports (same rules as src/kits/lingerie/lib/fit.js and gifts.js; the unit tests compare them). */
export const isPassportCode = (/** @type {unknown} */ v) => typeof v === "string" && /^[A-HJ-NP-Z2-9]{8}$/.test(v);
export const isMonthDay = (/** @type {unknown} */ v) => typeof v === "string" && /^\d{2}-\d{2}$/.test(v)
  && Number(v.slice(0, 2)) >= 1 && Number(v.slice(0, 2)) <= 12 && Number(v.slice(3)) >= 1 && Number(v.slice(3)) <= new Date(Date.UTC(2024, Number(v.slice(0, 2)), 0)).getUTCDate();
export const SHOP_MODES = ["boutique", "online"];
export const CATEGORIES = ["bras", "briefs", "suspenders", "bodies", "nightwear", "bridal", "slips", "robes", "swim"];
/** Guide pages and the feature that builds each. */
export const GUIDE_PAGES = { "fitting": "fitting-page", "under-the-dress": "under-the-dress", "bridal": "bridal-page", "for-her": "for-her-page", "story": "founder-page", "fuller-bust": "fuller-bust-page", "stockings": "stockings-page", "care": "care-page", "the-lace": "lace-page" };
/** Home sections a chapter can open (src/kits/lingerie/home.js). */
const CHAPTER_BEFORE = ["new-season", "category-doors", "tell-us-about-her", "private-evening", "drop", "preorders", "discreet", "fit-finder", "size-guide", "private-fitting", "gift-wrap", "gift-concierge", "lace-viewer", "services", "stockists", "reviews", "questions", "page-links", "visit"];

/** @param {Record<string, any>} o @param {string[]} keys @param {string} at @param {Report} err */
function onlyKeys(o, keys, at, err) {
  for (const k of Object.keys(o)) if (!keys.includes(k)) err(`${at}.${k}`, `unknown setting; allowed: ${keys.join(", ")}`);
}

/** A non-empty list of objects with unique slug ids. @param {unknown} list @param {string} at @param {Report} err @param {(x: Record<string, any>, at: string) => void} each */
function idList(list, at, err, each) {
  if (!Array.isArray(list) || !list.length) { err(at, "a list with at least one entry"); return; }
  const seen = new Set();
  list.forEach((x, i) => {
    const p = `${at}[${i}]`;
    if (!isObj(x)) { err(p, "must be an object"); return; }
    if (!SLUG.test(x.id ?? "")) err(`${p}.id`, "lowercase letters, numbers and dashes");
    else if (seen.has(x.id)) err(`${p}.id`, `"${x.id}" is used twice`);
    seen.add(x.id);
    each(x, p);
  });
}

/** { src, width, height, alt }; the alt says what's in the photograph. @param {unknown} p @param {string} at @param {Report} err */
function photo(p, at, err) {
  if (!isObj(p)) { err(at, "{ src, width, height, alt }"); return; }
  onlyKeys(p, ["src", "width", "height", "alt", "position"], at, err);
  if (!/^img\/[a-z0-9/_.-]+\.(webp|jpe?g|png)$/.test(p.src ?? "")) err(`${at}.src`, "a file in the site's img/ folder");
  if (!isInt(p.width, 200, 6000) || !isInt(p.height, 200, 6000)) err(at, "width and height in pixels, as the file is");
  if (!isStr(p.alt)) err(`${at}.alt`, "what the photograph shows");
  if (p.position !== undefined && !/^\d{1,3}% \d{1,3}%$/.test(p.position)) err(`${at}.position`, 'where to keep in view when cropped, e.g. "50% 20%"');
}

/** @typedef {{ site: any, err: Report, pieceRef: (id: unknown, at: string) => void, payRef: (id: unknown, at: string) => void }} Ctx */

/** Each top-level setting and its check; a setting that's left out isn't checked (its feature asks for it). */
const SETTINGS = /** @type {Record<string, (v: any, c: Ctx) => void>} */ ({
  categories: (v, { err }) => idList(v, "categories", err, (c, at) => {
    onlyKeys(c, ["id", "label", "photo"], at, err);
    if (!CATEGORIES.includes(c.id)) err(`${at}.id`, CATEGORIES.join(", "));
    if (!isStr(c.label)) err(`${at}.label`, "the door's word, e.g. Bras");
    photo(c.photo, `${at}.photo`, err);
  }),
  chapters: (v, { err }) => idList(v, "chapters", err, (c, at) => {
    onlyKeys(c, ["id", "before", "title", "line", "photo", "link"], at, err);
    if (!CHAPTER_BEFORE.includes(c.before)) err(`${at}.before`, `the home section it opens: ${CHAPTER_BEFORE.join(", ")}`);
    if (!isStr(c.title)) err(`${at}.title`, "a few words, very large");
    if (c.line !== undefined && !isStr(c.line)) err(`${at}.line`, "one line under it");
    photo(c.photo, `${at}.photo`, err);
    if (c.link !== undefined) link(c.link, `${at}.link`, err);
  }),
  sizeGuide: (v, { err }) => checkSizeGuide(v, err),
  fitting: (v, { err }) => checkFitting(v, err),
  giftWrap: (g, { err }) => {
    if (!isObj(g)) { err("giftWrap", "{ text, price, cardMax }"); return; }
    onlyKeys(g, ["text", "price", "cardMax", "photo"], "giftWrap", err);
    if (!isStr(g.text)) err("giftWrap.text", "how the shop wraps, in its words");
    if (!isNum(g.price, 0, 100)) err("giftWrap.price", "pounds; 0 if wrapping is free");
    if (!isInt(g.cardMax, 20, 400)) err("giftWrap.cardMax", "longest card message in characters, 20–400");
    if (g.photo !== undefined) photo(g.photo, "giftWrap.photo", err);
  },
  discreet: (d, { err }) => {
    if (!isObj(d)) { err("discreet", "{ title, box, outer, statement, photo }"); return; }
    onlyKeys(d, ["title", "box", "outer", "statement", "photo"], "discreet", err);
    for (const k of ["title", "box", "outer", "statement"]) if (!isStr(d[k])) err(`discreet.${k}`, k === "statement" ? "what appears on a bank statement, exactly as the shop's card provider shows it" : "text, in the shop's words");
    photo(d.photo, "discreet.photo", err);
  },
  asks: (v, { err }) => idList(v, "asks", err, (s, at) => {
    onlyKeys(s, ["id", "label", "line", "message", "modes"], at, err);
    for (const k of ["label", "line", "message"]) if (!isStr(s[k])) err(`${at}.${k}`, k === "message" ? "the WhatsApp message it opens" : "text");
    if (s.modes !== undefined && (!Array.isArray(s.modes) || !s.modes.every((m) => SHOP_MODES.includes(m)))) err(`${at}.modes`, `shown only in: ${SHOP_MODES.join(", ")}`);
  }),
  stockists: (v, { err }) => idList(v, "stockists", err, (s, at) => {
    onlyKeys(s, ["id", "name", "city", "url"], at, err);
    if (!isStr(s.name) || !isStr(s.city)) err(at, "name and city");
    if (s.url !== undefined && !HTTPS.test(s.url)) err(`${at}.url`, "an https link");
  }),
  her: (v, { err }) => checkHer(v, err),
  fitFinder: (f, { err }) => {
    if (!isObj(f)) { err("fitFinder", "{ note, problems: [{ id, label, means, ask }] }"); return; }
    onlyKeys(f, ["note", "problems"], "fitFinder", err);
    if (!isStr(f.note)) err("fitFinder.note", "one line saying this is the fitters' usual advice, not a size");
    idList(f.problems, "fitFinder.problems", err, (p, at) => {
      onlyKeys(p, ["id", "label", "means", "ask"], at, err);
      for (const k of ["label", "means", "ask"]) if (!isStr(p[k])) err(`${at}.${k}`, "text, in the fitters' words");
    });
  },
  hint: (h, { err }) => { if (!isObj(h) || !isStr(h.note) || Object.keys(h).some((k) => k !== "note")) err("hint", '{ "note": the line the hint opens with }'); },
  underDress: (u, { err, pieceRef }) => {
    if (!isObj(u)) { err("underDress", "{ options: [{ id, label, advice, pieces, photo? }] }"); return; }
    onlyKeys(u, ["options"], "underDress", err);
    idList(u.options, "underDress.options", err, (o, at) => {
      onlyKeys(o, ["id", "label", "advice", "pieces", "photo"], at, err);
      if (!isStr(o.label) || !isStr(o.advice)) err(at, "label and advice");
      if (!Array.isArray(o.pieces)) err(`${at}.pieces`, "piece ids, the shop's suggestions");
      else o.pieces.forEach((/** @type {unknown} */ id, /** @type {number} */ i) => pieceRef(id, `${at}.pieces[${i}]`));
      if (o.photo !== undefined) photo(o.photo, `${at}.photo`, err);
    });
  },
  guides: (_, { site, err, pieceRef }) => checkGuides(site, err, pieceRef),
  passport: (_, { site, err }) => checkPassport(site, err),
  concierge: (c, { err }) => {
    if (!isObj(c)) { err("concierge", "{ leads, dates }"); return; }
    onlyKeys(c, ["leads", "dates", "note"], "concierge", err);
    if (!Array.isArray(c.leads) || !c.leads.length || !c.leads.every((/** @type {unknown} */ n) => isInt(n, 1, 90))) err("concierge.leads", "days before each date to remind, e.g. [21, 7]");
    idList(c.dates, "concierge.dates", err, (d, at) => {
      onlyKeys(d, ["id", "label", "md"], at, err);
      if (!isStr(d.label)) err(`${at}.label`, "e.g. Her birthday");
      if (d.md !== undefined && !isMonthDay(d.md)) err(`${at}.md`, 'a fixed day, "MM-DD" (e.g. "02-14"); leave out for dates he enters');
    });
  },
  evenings: (_, { site, err, payRef }) => checkEvenings(site, err, payRef),
  lace: (l, { err }) => {
    if (!isObj(l)) { err("lace", "{ photo, zoom, notes }"); return; }
    onlyKeys(l, ["photo", "zoom", "notes"], "lace", err);
    photo(l.photo, "lace.photo", err);
    if (!isNum(l.zoom, 1.5, 4)) err("lace.zoom", "how much the loupe magnifies, 1.5–4");
    if (!Array.isArray(l.notes) || !l.notes.every(isStr)) err("lace.notes", "the shop's notes on the lace, a list of lines");
  },
  bridalTimeline: (b, { err }) => {
    if (!isObj(b)) { err("bridalTimeline", "{ steps: [{ id, label, weeksBefore, note? }], late }"); return; }
    onlyKeys(b, ["steps", "late"], "bridalTimeline", err);
    idList(b.steps, "bridalTimeline.steps", err, (s, at) => {
      onlyKeys(s, ["id", "label", "weeksBefore", "note"], at, err);
      if (!isStr(s.label)) err(`${at}.label`, "text");
      if (!isInt(s.weeksBefore, 0, 104)) err(`${at}.weeksBefore`, "whole weeks before the wedding, the shop's own lead time");
    });
    if (!isStr(b.late)) err("bridalTimeline.late", "what to say when the first step has already passed");
  },
  bridalParty: (b, { err, payRef }) => {
    if (!isObj(b)) { err("bridalParty", '{ "minutes", "partyMax", "note", "photo", "deposit"? }'); return; }
    onlyKeys(b, ["minutes", "partyMax", "note", "photo", "deposit"], "bridalParty", err);
    if (!isInt(b.minutes, 30, 300)) err("bridalParty.minutes", "how long the evening is");
    if (!isInt(b.partyMax, 2, 12)) err("bridalParty.partyMax", "how many can come, the bride included, 2–12");
    if (!isStr(b.note)) err("bridalParty.note", "one line, in the shop's words");
    photo(b.photo, "bridalParty.photo", err);
    if (b.deposit !== undefined) {
      if (!isObj(b.deposit) || !isNum(b.deposit.amount, 1, 5000)) err("bridalParty.deposit", '{ "amount": pounds, "payLink": a payLinks id }');
      else { onlyKeys(b.deposit, ["amount", "payLink", "note"], "bridalParty.deposit", err); payRef(b.deposit.payLink, "bridalParty.deposit.payLink"); }
    }
  },
  takeovers: (v, c) => checkTakeovers(v, c),
  drop: (d, { err, pieceRef }) => {
    if (!isObj(d)) { err("drop", "{ name, at, ends?, line, photo, waitlist, pieces? }"); return; }
    onlyKeys(d, ["name", "at", "ends", "line", "photo", "waitlist", "pieces"], "drop", err);
    if (!isStr(d.name) || !isStr(d.line)) err("drop", "name and line");
    if (!LOCAL.test(d.at ?? "")) err("drop.at", '"YYYY-MM-DDTHH:MM", the shop\'s own time');
    if (d.ends !== undefined && !(LOCAL.test(d.ends) && d.ends > (d.at ?? ""))) err("drop.ends", '"YYYY-MM-DDTHH:MM", after drop.at');
    photo(d.photo, "drop.photo", err);
    if (!isObj(d.waitlist) || !(FORM.test(d.waitlist.formUrl ?? "") || d.waitlist.whatsapp === true)) err("drop.waitlist", '{ "formUrl": a Google Form link } or { "whatsapp": true }');
    if (d.pieces !== undefined) (Array.isArray(d.pieces) ? d.pieces : [null]).forEach((/** @type {unknown} */ id, /** @type {number} */ i) => pieceRef(id, `drop.pieces[${i}]`));
  },
});

/** @param {any} site @param {Report} err */
export function checkLingerie(site, err) {
  if (site.kit !== "lingerie") return;
  checkShop(site, err);
  const pieceIds = new Set();
  if (site.collections !== undefined || site.pieces !== undefined) checkCatalogue(site, err, pieceIds);
  const pay = new Set((site.payLinks?.items ?? []).map((/** @type {any} */ p) => p?.id));
  /** @type {Ctx} */
  const c = {
    site, err,
    pieceRef: (id, at) => { if (!pieceIds.has(id)) err(at, `"${id}" isn't one of pieces`); },
    payRef: (id, at) => { if (id !== undefined && !pay.has(id)) err(at, `"${id}" isn't one of payLinks.items`); },
  };
  for (const [key, check] of Object.entries(SETTINGS)) if (site[key] !== undefined) check(site[key], c);
  checkOnline(site, c);
}

export const TAKEOVERS = ["valentines", "christmas"];
const DAYS = (/** @type {string} */ a, /** @type {string} */ b) => (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000;

/** Gift takeovers: Valentine's and Christmas, each once, inside its dates, never overlapping. @param {unknown} v @param {Ctx} c */
function checkTakeovers(v, { site, err, pieceRef }) {
  idList(v, "takeovers", err, (t, at) => {
    onlyKeys(t, ["id", "name", "from", "to", "title", "line", "photo", "orderBy", "collectBy", "wrap", "edits"], at, err);
    if (!TAKEOVERS.includes(t.id)) err(`${at}.id`, TAKEOVERS.join(" or "));
    if (!isStr(t.name) || !isStr(t.title)) err(at, "name and title");
    if (t.line !== undefined && !isStr(t.line)) err(`${at}.line`, "one line, or leave it out");
    if (t.wrap !== undefined && typeof t.wrap !== "boolean") err(`${at}.wrap`, "true to add the gift-wrap line");
    if (t.wrap && !site.giftWrap) err(`${at}.wrap`, 'needs "giftWrap"');
    photo(t.photo, `${at}.photo`, err);
    takeoverTimes(t, at, site, err);
    takeoverEdits(t.edits, `${at}.edits`, err, pieceRef);
  });
  if (!Array.isArray(v)) return;
  const sorted = [...v].filter((t) => isObj(t) && DATE.test(t.from ?? "") && DATE.test(t.to ?? "")).sort((a, b) => (a.from < b.from ? -1 : 1));
  for (let i = 1; i < sorted.length; i++) if (sorted[i].from <= sorted[i - 1].to) err("takeovers", `"${sorted[i - 1].id}" and "${sorted[i].id}" overlap`);
}

/** @param {any} t @param {string} at @param {any} site @param {Report} err */
function takeoverTimes(t, at, site, err) {
  const datesOk = DATE.test(t.from ?? "") && DATE.test(t.to ?? "") && t.from <= t.to && DAYS(t.from, t.to) <= 60;
  if (!datesOk) err(at, '"from" and "to" dates (YYYY-MM-DD), at most 60 days apart');
  const within = (/** @type {unknown} */ x) => typeof x === "string" && LOCAL.test(x) && x.slice(0, 10) >= t.from && x.slice(0, 10) <= t.to;
  if (!within(t.orderBy)) err(`${at}.orderBy`, '"YYYY-MM-DDTHH:MM" between from and to, the shop\'s own time');
  if (t.collectBy === undefined) return;
  if (!within(t.collectBy) || t.collectBy < t.orderBy) err(`${at}.collectBy`, '"YYYY-MM-DDTHH:MM" after orderBy and by "to"');
  if (site.shop?.mode === "online") err(`${at}.collectBy`, "online brands have no collection; leave it out");
}

/** @param {unknown} edits @param {string} at @param {Report} err @param {Ctx["pieceRef"]} pieceRef */
function takeoverEdits(edits, at, err, pieceRef) {
  if (!Array.isArray(edits) || !edits.length || edits.length > 3) { err(at, '1–3 edits: [{ "label", "pieces": [piece ids] }]'); return; }
  edits.forEach((/** @type {any} */ e, /** @type {number} */ i) => {
    const ep = `${at}[${i}]`;
    if (!isObj(e) || !isStr(e.label) || !Array.isArray(e.pieces) || !e.pieces.length || e.pieces.length > 6) { err(ep, '{ "label", "pieces": 1–6 piece ids }'); return; }
    onlyKeys(e, ["label", "pieces"], ep, err);
    e.pieces.forEach((/** @type {unknown} */ id, /** @type {number} */ j) => pieceRef(id, `${ep}.pieces[${j}]`));
  });
}

/** Pre-orders and the drop: their Payment Links exist, and the drop is for online brands. @param {any} site @param {Ctx} c */
function checkOnline(site, c) {
  const on = (/** @type {string} */ id) => Array.isArray(site.features) && site.features.includes(id);
  const pieces = Array.isArray(site.pieces) ? site.pieces : [];
  pieces.forEach((/** @type {any} */ p, /** @type {number} */ i) => { if (isObj(p) && p.preorder !== undefined) c.payRef(p.preorder?.payLink, `pieces[${i}].preorder.payLink`); });
  if (on("preorders") && !pieces.some((/** @type {any} */ p) => p?.preorder)) c.err("pieces", 'the "preorders" feature needs at least one piece with "preorder"');
  if (on("drop") && site.shop?.mode !== "online" && site.mode !== "demo") c.err("features", '"drop" is for online brands (shop.mode "online")');
}

/** @param {unknown} l @param {string} at @param {Report} err */
function link(l, at, err) {
  if (!isObj(l) || !isStr(l.label) || !(SLUG.test(l.page ?? "") || /^#[a-z0-9-]+$/.test(l.href ?? ""))) err(at, '{ "label", "page": a page id } or { "label", "href": "#section" }');
  else onlyKeys(l, ["label", "page", "href"], at, err);
}

/** @param {any} site @param {Report} err */
function checkShop(site, err) {
  const s = site.shop;
  if (!isObj(s)) { err("shop", '{ "mode": "boutique" or "online", "strip": the line across the top, … }'); return; }
  onlyKeys(s, ["mode", "area", "strip", "shopUrl", "previewModes"], "shop", err);
  if (!SHOP_MODES.includes(s.mode)) err("shop.mode", `${SHOP_MODES.join(" or ")}: a shop with a fitting room, or a brand that sells online`);
  if (!isStr(s.area)) err("shop.area", 'where, in a word or two, e.g. "Mayfair"');
  if (!isObj(s.strip) || !isStr(s.strip[s.mode])) err(`shop.strip.${s.mode}`, "the line across the top of every page");
  else onlyKeys(s.strip, SHOP_MODES, "shop.strip", err);
  if (s.mode === "online" && !HTTPS.test(s.shopUrl ?? "")) err("shop.shopUrl", "online brands: the link to their own shop (Shopify or similar)");
  if (s.shopUrl !== undefined && !HTTPS.test(s.shopUrl)) err("shop.shopUrl", "an https link");
  if (s.previewModes !== undefined) {
    if (site.mode !== "demo") err("shop.previewModes", "demo sites only: lets the viewer switch between boutique and online words");
    else if (s.previewModes !== true) err("shop.previewModes", "true or leave out");
    else if (!isObj(s.strip) || !SHOP_MODES.every((m) => isStr(s.strip[m]))) err("shop.strip", "a line for each mode when previewModes is on");
  }
}

/** @param {any} site @param {Report} err @param {Set<unknown>} pieceIds */
function checkCatalogue(site, err, pieceIds) {
  /** @type {Map<string, Set<string>>} */
  const colours = new Map();
  idList(site.collections, "collections", err, (c, at) => {
    onlyKeys(c, ["id", "name", "line", "story", "colours", "cover", "campaign"], at, err);
    if (!isStr(c.name) || !isStr(c.line)) err(at, "name and a one-line description");
    const ids = new Set();
    idList(c.colours, `${at}.colours`, err, (x, cat) => {
      onlyKeys(x, ["id", "name", "hex"], cat, err);
      if (!isStr(x.name)) err(`${cat}.name`, "the colour's name, e.g. Noir");
      if (!HEX.test(x.hex ?? "")) err(`${cat}.hex`, "the swatch colour, #rrggbb");
      ids.add(x.id);
    });
    colours.set(c.id, ids);
    photo(c.cover, `${at}.cover`, err);
    if (c.campaign !== undefined) {
      if (!Array.isArray(c.campaign) || c.campaign.length < 2) err(`${at}.campaign`, "two or more photographs for the collection's page");
      else c.campaign.forEach((/** @type {unknown} */ p, /** @type {number} */ i) => photo(p, `${at}.campaign[${i}]`, err));
    }
    if (c.story !== undefined && !isStr(c.story)) err(`${at}.story`, "a short paragraph");
  });
  idList(site.pieces, "pieces", err, (p, at) => { pieceIds.add(p.id); checkPiece(p, at, err, colours.get(p.collection)); });
}

/** One piece. @param {Record<string, any>} p @param {string} at @param {Report} err @param {Set<string>|undefined} cols the collection's colour ids */
function checkPiece(p, at, err, cols) {
  onlyKeys(p, ["id", "collection", "style", "colour", "colours", "price", "category", "photo", "photos", "sizes", "fit", "newSeason", "preorder", "buyUrl"], at, err);
  if (!cols) err(`${at}.collection`, `"${p.collection}" isn't one of collections`);
  if (!isStr(p.style)) err(`${at}.style`, "e.g. Balconette");
  if (cols && !cols.has(p.colour)) err(`${at}.colour`, `"${p.colour}" isn't one of that collection's colours`);
  if (p.colours !== undefined && (!Array.isArray(p.colours) || (cols && !p.colours.every((/** @type {string} */ x) => cols.has(x))))) err(`${at}.colours`, "the collection's colour ids it also comes in");
  if (!isNum(p.price, 1, 20000)) err(`${at}.price`, "the shop's price in pounds");
  if (!CATEGORIES.includes(p.category)) err(`${at}.category`, CATEGORIES.join(", "));
  photo(p.photo, `${at}.photo`, err);
  if (p.photos !== undefined) (Array.isArray(p.photos) ? p.photos : [null]).forEach((/** @type {unknown} */ x, /** @type {number} */ i) => photo(x, `${at}.photos[${i}]`, err));
  if (!isStr(p.sizes)) err(`${at}.sizes`, 'the sizes it comes in, e.g. "30–38 band, A–G cup"');
  pieceOptions(p, at, err);
}

/** A piece's optional settings. @param {Record<string, any>} p @param {string} at @param {Report} err */
function pieceOptions(p, at, err) {
  if (p.fit !== undefined && !isStr(p.fit)) err(`${at}.fit`, "the fitters' note, e.g. firm band");
  if (p.newSeason !== undefined && typeof p.newSeason !== "boolean") err(`${at}.newSeason`, "true or leave out");
  if (p.buyUrl !== undefined && !HTTPS.test(p.buyUrl)) err(`${at}.buyUrl`, "the piece on the brand's own shop, https");
  if (p.preorder === undefined) return;
  if (!isObj(p.preorder) || !isStr(p.preorder.ships)) err(`${at}.preorder`, '{ "ships": when it ships, e.g. "early December", "payLink": a payLinks id }');
  else onlyKeys(p.preorder, ["ships", "payLink"], `${at}.preorder`, err);
}

/** A [smallest, largest] band and cup span taken from the guide's own lists. @param {any} s @param {any} g */
function isSpan(s, g) {
  const two = (/** @type {unknown} */ x) => Array.isArray(x) && x.length === 2;
  return isObj(s) && two(s.bands) && two(s.cups) && s.bands.every((/** @type {unknown} */ b) => (g.bands ?? []).includes(b)) && s.cups.every((/** @type {unknown} */ c) => (g.cups ?? []).includes(c));
}

/** @param {any} g @param {Report} err */
function checkSizeGuide(g, err) {
  if (!isObj(g)) { err("sizeGuide", "{ bands, cups, stock, order?, how, note }"); return; }
  onlyKeys(g, ["bands", "cups", "stock", "order", "how", "note"], "sizeGuide", err);
  if (!Array.isArray(g.bands) || !g.bands.length || !g.bands.every((/** @type {unknown} */ b) => isInt(b, 26, 56))) err("sizeGuide.bands", "UK band sizes, e.g. [28, 30, 32]");
  if (!Array.isArray(g.cups) || !g.cups.length || !g.cups.every((/** @type {unknown} */ c) => typeof c === "string" && /^[A-K]{1,2}$/.test(c))) err("sizeGuide.cups", 'UK cups in order, e.g. ["A", "B", "C", "D", "DD", "E"]');
  for (const k of ["stock", "order"]) if (!(k === "order" && g[k] === undefined) && !isSpan(g[k], g)) err(`sizeGuide.${k}`, '{ "bands": [smallest, largest], "cups": [smallest, largest] } from the lists above');
  if (!Array.isArray(g.how) || !g.how.length || !g.how.every(isStr)) err("sizeGuide.how", "how the fitters measure, a few steps");
  if (!isStr(g.note)) err("sizeGuide.note", "one line, e.g. that a fitting beats any chart");
}

/** @param {any} f @param {Report} err */
function checkFitting(f, err) {
  if (!isObj(f)) { err("fitting", "{ minutes, price, kinds, times, guestsMax, note }"); return; }
  onlyKeys(f, ["minutes", "price", "kinds", "times", "guestsMax", "note", "video"], "fitting", err);
  if (!isInt(f.minutes, 10, 240)) err("fitting.minutes", "how long a fitting is");
  if (!isNum(f.price, 0, 500)) err("fitting.price", "pounds; 0 if fittings are free");
  for (const k of ["kinds", "times"]) if (!Array.isArray(f[k]) || !f[k].length || !f[k].every(isStr)) err(`fitting.${k}`, k === "kinds" ? 'what it\'s for, e.g. ["Everyday", "Bridal"]' : 'parts of the day, e.g. ["Morning", "Afternoon"]');
  if (!isInt(f.guestsMax, 0, 4)) err("fitting.guestsMax", "guests she can bring, 0–4");
  if (!isStr(f.note)) err("fitting.note", "one line, in the shop's words");
  if (f.video !== undefined && (!isObj(f.video) || !isInt(f.video.minutes, 5, 90) || !isStr(f.video.note))) err("fitting.video", "{ minutes, note } for online brands' video fittings");
}

/** @param {any} h @param {Report} err */
function checkHer(h, err) {
  if (!isObj(h)) { err("her", "{ wears, budgets, occasions, note, photo }"); return; }
  onlyKeys(h, ["wears", "budgets", "occasions", "note", "photo"], "her", err);
  for (const k of ["wears", "budgets", "occasions"]) if (!Array.isArray(h[k]) || !h[k].length || !h[k].every(isStr)) err(`her.${k}`, "a list of choices");
  if (!isStr(h.note)) err("her.note", "what happens next, in the shop's words");
  photo(h.photo, "her.photo", err);
}

/** @param {any} site @param {Report} err @param {(id: unknown, at: string) => void} pieceRef */
function checkGuides(site, err, pieceRef) {
  const g = site.guides;
  if (!isObj(g)) { err("guides", "{ <page>: { kicker, title, intro, opener, sections, pieces? } }"); return; }
  onlyKeys(g, Object.keys(GUIDE_PAGES), "guides", err);
  for (const [page, feature] of Object.entries(GUIDE_PAGES)) {
    const x = g[page];
    const at = `guides.${page}`;
    if (x === undefined) { if ((site.features ?? []).includes(feature)) err(at, `required by feature "${feature}"`); continue; }
    if (!isObj(x)) { err(at, "{ kicker, title, intro, description, opener, sections, pieces? }"); continue; }
    onlyKeys(x, ["kicker", "title", "intro", "description", "opener", "sections", "pieces"], at, err);
    for (const k of ["kicker", "title", "intro", "description"]) if (!isStr(x[k])) err(`${at}.${k}`, "text");
    photo(x.opener, `${at}.opener`, err);
    if (!Array.isArray(x.sections) || !x.sections.length) err(`${at}.sections`, "the guide, a few { title, text, photo? }");
    else x.sections.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
      const sa = `${at}.sections[${i}]`;
      if (!isObj(s)) { err(sa, "{ title, text, photo? }"); return; }
      onlyKeys(s, ["title", "text", "photo"], sa, err);
      if (!isStr(s.title) || !isStr(s.text)) err(sa, "title and text");
      if (s.photo !== undefined) photo(s.photo, `${sa}.photo`, err);
    });
    if (x.pieces !== undefined) (Array.isArray(x.pieces) ? x.pieces : [null]).forEach((/** @type {unknown} */ id, /** @type {number} */ i) => pieceRef(id, `${at}.pieces[${i}]`));
  }
}

/** @param {any} site @param {Report} err */
function checkPassport(site, err) {
  const p = site.passport;
  if (!isObj(p)) { err("passport", '{ "source": "sheet", "csvUrl", "staleAfterHours"?, "note" }'); return; }
  onlyKeys(p, ["source", "csvUrl", "sample", "exampleCode", "note"], "passport", err);
  if (!["sheet", "sample"].includes(p.source)) err("passport.source", '"sheet" (or "sample" on demo sites)');
  if (p.source === "sample" && site.mode !== "demo") err("passport.source", 'sample data is only allowed on demo sites; use "sheet"');
  if (p.source === "sheet" && !SHEET.test(p.csvUrl ?? "")) err("passport.csvUrl", "a published Google Sheet CSV link (columns: code, shape, size, updated_at; no names)");
  if (p.source === "sample") {
    if (!Array.isArray(p.sample) || p.sample.length < 2 || !p.sample.every((/** @type {unknown} */ r) => Array.isArray(r))) err("passport.sample", "rows like the sheet's, header first");
    if (!isPassportCode(p.exampleCode)) err("passport.exampleCode", "a code from the sample rows, 8 characters, no 0, O, 1 or I");
  } else if (p.sample !== undefined || p.exampleCode !== undefined) err("passport", "sample and exampleCode are for demo sites");
  if (!isStr(p.note)) err("passport.note", "who can see the sizes and how to stop sharing them, in the shop's words");
}

/** @param {any} site @param {Report} err @param {(id: unknown, at: string) => void} payRef */
function checkEvenings(site, err, payRef) {
  const e = site.evenings;
  if (!isObj(e)) { err("evenings", '{ "source": "sheet", "csvUrl", "staleAfterHours", "minutes", "guestsMax", "photo", "note" }'); return; }
  onlyKeys(e, ["source", "csvUrl", "staleAfterHours", "sample", "minutes", "guestsMax", "photo", "note", "deposit"], "evenings", err);
  if (!["sheet", "sample"].includes(e.source)) err("evenings.source", '"sheet" (or "sample" on demo sites)');
  if (e.source === "sample" && site.mode !== "demo") err("evenings.source", 'sample data is only allowed on demo sites; use "sheet"');
  if (e.source === "sheet" && !SHEET.test(e.csvUrl ?? "")) err("evenings.csvUrl", "a published Google Sheet CSV link (columns: date, start, status, updated_at)");
  if (e.source === "sample" && (!Array.isArray(e.sample) || !e.sample.every((/** @type {any} */ r) => isObj(r) && DATE.test(r.date ?? "") && /^\d{2}:\d{2}$/.test(r.start ?? "") && ["free", "held"].includes(r.status)))) {
    err("evenings.sample", 'demo evenings: [{ "date", "start", "status": "free" or "held" }]');
  }
  if (!isInt(e.staleAfterHours, 1, 336)) err("evenings.staleAfterHours", "hours after which the sheet is too old to show, 1–336");
  if (!isInt(e.minutes, 30, 240)) err("evenings.minutes", "how long the evening is");
  if (!isInt(e.guestsMax, 0, 4)) err("evenings.guestsMax", "guests she can bring, 0–4");
  photo(e.photo, "evenings.photo", err);
  if (!isStr(e.note)) err("evenings.note", "one line, in the shop's words");
  if (e.deposit !== undefined) {
    if (!isObj(e.deposit) || !isNum(e.deposit.amount, 1, 5000)) err("evenings.deposit", '{ "amount": pounds, "payLink": a payLinks id }');
    else { onlyKeys(e.deposit, ["amount", "payLink", "note"], "evenings.deposit", err); payRef(e.deposit.payLink, "evenings.deposit.payLink"); }
  }
}
