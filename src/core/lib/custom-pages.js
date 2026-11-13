// @ts-check
/**
 * General pages any business can have: About us, Services, Gift vouchers, Events…
 * Each is a list of simple blocks, so the page always looks like the rest of the
 * site and nothing is hand-coded per client.
 *
 *   "pages": [{ "slug": "about", "title": "About|us*.*", "kicker": "Our story",
 *     "description": "…", "intro": "…",
 *     "blocks": [ { "type": "text", "heading": "How it started", "body": "Para.\n\nPara." },
 *                 { "type": "photo", "src": "img/shop.webp", "alt": "…", "caption": "…" },
 *                 { "type": "list", "heading": "What we do", "items": ["…"] },
 *                 { "type": "book", "text": "…", "label": "Book a cut" } ] }]
 */

/** Page names already used by kits and every site. */
export const RESERVED = ["index", "404", "privacy", "visit", "work", "team", "prices", "style-guide", "assets", "img", "sitemap", "robots"];
export const BLOCK_TYPES = ["text", "photo", "list", "book"];
const MAX_PAGES = 20;

/** @param {any} x */
const text = (x) => typeof x === "string" && x.trim().length > 0;

/** Paragraphs from a body written with blank lines between them. @param {string} body */
export const paragraphs = (body) => body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

/** @param {any} b @param {string} at @param {(path: string, msg: string) => void} err @param {((rel: string) => boolean)|undefined} exists */
function checkBlock(b, at, err, exists) {
  if (!BLOCK_TYPES.includes(b?.type)) { err(`${at}.type`, `one of ${BLOCK_TYPES.join(", ")}`); return; }
  if (b.type === "text" && !text(b.body)) err(`${at}.body`, "required text is missing");
  if (b.type === "photo") {
    if (!/^img\/[a-z0-9-]+\.webp$/.test(b.src ?? "")) err(`${at}.src`, 'a WebP in img/, e.g. "img/shop.webp"');
    else if (exists && !exists(b.src)) err(`${at}.src`, `file not found: ${b.src}`);
    if (!text(b.alt)) err(`${at}.alt`, "describe the photo for people who can't see it");
  }
  if (b.type === "list" && (!Array.isArray(b.items) || !b.items.length || !b.items.every(text))) err(`${at}.items`, "one or more short lines");
  if (b.type === "book" && !text(b.text)) err(`${at}.text`, "a line inviting people to book");
}

/**
 * @param {any} pages @param {(path: string, msg: string) => void} err @param {((rel: string) => boolean)} [exists]
 */
export function checkCustomPages(pages, err, exists) {
  if (!Array.isArray(pages) || !pages.length) { err("pages", "a list of pages, each { slug, title, description, blocks }"); return; }
  if (pages.length > MAX_PAGES) err("pages", `at most ${MAX_PAGES}`);
  /** @type {Set<string>} */
  const seen = new Set();
  pages.forEach((/** @type {any} */ p, /** @type {number} */ i) => {
    const at = `pages[${i}]`;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p?.slug ?? "")) err(`${at}.slug`, 'lowercase words joined by dashes, e.g. "about-us"');
    else if (RESERVED.includes(p.slug)) err(`${at}.slug`, `"${p.slug}" is already a page on every site; choose another`);
    else if (seen.has(p.slug)) err(`${at}.slug`, `"${p.slug}" is used twice`);
    seen.add(p?.slug);
    if (!text(p?.title)) err(`${at}.title`, "required text is missing");
    if (!text(p?.description) || p.description.length > 160) err(`${at}.description`, "one sentence for Google, up to 160 characters");
    if (!Array.isArray(p?.blocks) || !p.blocks.length) { err(`${at}.blocks`, "one or more blocks: text, photo, list, book"); return; }
    p.blocks.forEach((/** @type {any} */ b, /** @type {number} */ j) => checkBlock(b, `${at}.blocks[${j}]`, err, exists));
  });
}
