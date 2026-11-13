#!/usr/bin/env node
// @ts-check
/**
 * Page-weight budget for every built site. Fails (exit 1) if any site goes
 * over, so a heavy change is caught before it ships.
 *
 *   npm run budget            (after npm run build:all)
 *
 * Sizes are measured on the built files; "gz" is gzip level 9, close to what
 * Cloudflare actually sends. Images are counted per page (lazy or not).
 */
import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { pathToFileURL } from "node:url";

/**
 * Budgets in kilobytes. Change only with a reason recorded in docs/platform/speed.md.
 * onTapGz: code a page loads only when the visitor asks for it (today only the car studio's 3D Showroom:
 * three.js and the model loader). It never slows the first view; the model file itself is shown on the button.
 * modelKb: the biggest 3D car file a site serves (img/kit/*.glb, img/cars/*.glb), also loaded only on tap; about 2.3 s on typical 4G.
 */
export const BUDGET_KB = { jsGz: 25, cssGz: 25, htmlGz: 30, imagesFirst: 400, imagesPerPage: 2000, fontsTotal: 300, onTapGz: 200, modelKb: 2600 };

const kb = (/** @type {number} */ bytes) => Math.round((bytes / 1024) * 10) / 10;

/** @param {string} outDir */
async function measure(outDir) {
  const assets = path.join(outDir, "assets");
  const files = await readdir(assets);
  const sizeOf = async (/** @type {string} */ f) => { const b = await readFile(path.join(assets, f)); return { raw: b.length, gz: gzipSync(b, { level: 9 }).length }; };
  const js = await sizeOf(/** @type {string} */ (files.find((f) => f.startsWith("site-") && f.endsWith(".js"))));
  // Everything else is loaded on tap: other entry files, plus anything in chunks/.
  let onTap = 0;
  for (const f of files.filter((f) => f.endsWith(".js") && !f.startsWith("site-"))) onTap += (await sizeOf(f)).gz;
  if (existsSync(path.join(assets, "chunks"))) for (const f of await readdir(path.join(assets, "chunks"))) onTap += (await sizeOf(path.join("chunks", f))).gz;
  const css = await sizeOf(/** @type {string} */ (files.find((f) => f.startsWith("site-") && f.endsWith(".css"))));
  let fonts = 0; // woff2 files only: that is what browsers download
  if (existsSync(path.join(assets, "fonts"))) for (const f of await readdir(path.join(assets, "fonts"))) fonts += (await stat(path.join(assets, "fonts", f))).size;

  const pages = [];
  // Pages in folders too: a fleet's class and car pages are budgeted like any other page.
  for (const f of (await readdir(outDir, { recursive: true })).map((n) => n.split(path.sep).join("/")).filter((n) => n.endsWith(".html") && !/^(assets|img)\//.test(n)).sort()) {
    const html = await readFile(path.join(outDir, f));
    // src and srcset only: a data-src picture loads only when the visitor asks for it (e.g. another view in the car driver view).
    // "First" is what the browser fetches straight away (no loading="lazy"; a <picture> follows its <img>), so the first
    // screen stays fast; lazy pictures load as the visitor scrolls and only count towards the page total.
    const text = html.toString();
    /** @type {Map<string, boolean>} */ const srcs = new Map(); // file → fetched straight away
    const add = (/** @type {string} */ tag, /** @type {boolean} */ eager) => {
      for (const m of tag.matchAll(/(?<![\w-])(?:src|srcset)="([^"]+)"/g)) for (const part of m[1].split(",")) {
        const file = part.trim().split(/\s+/)[0].replace(/^\//, "");
        if (/\.(?:webp|jpe?g|png|avif)$/.test(file)) srcs.set(file, (srcs.get(file) ?? false) || eager);
      }
    };
    const rest = text.replace(/<picture[^]*?<\/picture>/g, (pic) => { add(pic, !/<img[^>]*loading="lazy"/.test(pic)); return ""; });
    for (const m of rest.matchAll(/<(?:img|source)\b[^>]*>/g)) add(m[0], !/loading="lazy"/.test(m[0]));
    let images = 0, first = 0;
    for (const [s, eager] of srcs) if (existsSync(path.join(outDir, s))) { const n = (await stat(path.join(outDir, s))).size; images += n; if (eager) first += n; }
    pages.push({ page: f, htmlGz: gzipSync(html, { level: 9 }).length, images, first });
  }
  let model = 0; // the biggest 3D car file
  for (const dir of [path.join(outDir, "img", "kit"), path.join(outDir, "img", "cars")]) {
    if (existsSync(dir)) for (const f of (await readdir(dir)).filter((n) => n.endsWith(".glb"))) model = Math.max(model, (await stat(path.join(dir, f))).size);
  }
  return { js, css, fonts, pages, onTap, model };
}

/**
 * Measure one built site against the budget.
 * @param {string} outDir @returns {Promise<{ lines: string[], over: string[] }>}
 */
export async function budgetReport(outDir) {
  const r = await measure(outDir);
  const over = [];
  if (kb(r.js.gz) > BUDGET_KB.jsGz) over.push(`JS ${kb(r.js.gz)} KB gz > ${BUDGET_KB.jsGz}`);
  if (kb(r.css.gz) > BUDGET_KB.cssGz) over.push(`CSS ${kb(r.css.gz)} KB gz > ${BUDGET_KB.cssGz}`);
  if (kb(r.onTap) > BUDGET_KB.onTapGz) over.push(`on-tap JS ${kb(r.onTap)} KB gz > ${BUDGET_KB.onTapGz}`);
  if (kb(r.model) > BUDGET_KB.modelKb) over.push(`3D car file ${kb(r.model)} KB > ${BUDGET_KB.modelKb}`);
  if (kb(r.fonts) > BUDGET_KB.fontsTotal) over.push(`fonts ${kb(r.fonts)} KB > ${BUDGET_KB.fontsTotal}`);
  for (const p of r.pages) {
    if (kb(p.htmlGz) > BUDGET_KB.htmlGz) over.push(`${p.page} HTML ${kb(p.htmlGz)} KB gz > ${BUDGET_KB.htmlGz}`);
    if (kb(p.first) > BUDGET_KB.imagesFirst) over.push(`${p.page} first-screen images ${kb(p.first)} KB > ${BUDGET_KB.imagesFirst}`);
    if (kb(p.images) > BUDGET_KB.imagesPerPage) over.push(`${p.page} images ${kb(p.images)} KB > ${BUDGET_KB.imagesPerPage}`);
  }
  const lines = [`    JS ${kb(r.js.raw)} KB (${kb(r.js.gz)} gz) · CSS ${kb(r.css.raw)} KB (${kb(r.css.gz)} gz) · fonts ${kb(r.fonts)} KB${r.onTap ? ` · on tap ${kb(r.onTap)} KB gz` : ""}${r.model ? ` · biggest 3D car ${kb(r.model)} KB` : ""}`];
  for (const p of r.pages) lines.push(`    ${p.page.padEnd(18)} HTML ${kb(p.htmlGz)} KB gz · images ${kb(p.images)} KB (first ${kb(p.first)})`);
  for (const o of over) lines.push(`    OVER BUDGET: ${o}`);
  return { lines, over };
}

async function main() {
  const manifests = path.join(".build", "manifests");
  if (!existsSync(manifests)) throw new Error("No builds found. Run npm run build:all first.");
  let failed = false;
  for (const f of (await readdir(manifests)).sort()) {
    const m = JSON.parse(await readFile(path.join(manifests, f), "utf8"));
    if (!existsSync(m.outDir)) { console.log(`✗ ${m.label}: no build found at ${m.outDir}; run npm run build:all`); failed = true; continue; }
    const { lines, over } = await budgetReport(m.outDir);
    console.log(`${over.length ? "✗" : "✓"} ${m.label}`);
    console.log(lines.join("\n"));
    if (over.length) failed = true;
  }
  if (failed) process.exit(1);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((e) => { console.error(`✗ ${e.message}`); process.exit(1); });
}
