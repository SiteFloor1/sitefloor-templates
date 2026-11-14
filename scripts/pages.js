#!/usr/bin/env node
// @ts-check
/**
 * Builds the published demo site (GitHub Pages, .github/workflows/demos.yml): every demo in sites/demos/, each in its
 * own folder with relative links (`--links html`), an index of them, and a robots.txt that blocks crawling. Demos are
 * fictional businesses with fictional addresses and numbers, so every page must say noindex: the build fails if one
 * doesn't. Demo dates are worked out for the day it runs (src/demo/dates.js), which is why it runs daily.
 *   node scripts/pages.js --out _site [--only barber,cafe] [--today YYYY-MM-DD]
 */
import { readFile, writeFile, readdir, rm, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { buildSite } from "./build.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const ROBOTS = "User-agent: *\nDisallow: /\n";
const NOINDEX = /<meta name="robots" content="noindex/;

/** @param {string} dir @returns {Promise<string[]>} */
async function files(dir) {
  return (await readdir(dir, { recursive: true, withFileTypes: true })).filter((e) => e.isFile()).map((e) => path.join(e.parentPath, e.name));
}

/** Pages under `out` without a robots noindex tag. @param {string} out @returns {Promise<string[]>} */
export async function indexablePages(out) {
  const bad = [];
  for (const f of (await files(out)).filter((x) => x.endsWith(".html"))) if (!NOINDEX.test(await readFile(f, "utf8"))) bad.push(path.relative(out, f));
  return bad;
}

const esc = (/** @type {string} */ s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);

/**
 * @param {{ out: string, only?: string[], today?: string }} o
 * @returns {Promise<{ demos: string[] }>}
 */
export async function buildPages(o) {
  const out = path.resolve(o.out);
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  const all = (await readdir(path.join(ROOT, "sites/demos"), { withFileTypes: true })).filter((e) => e.isDirectory() && existsSync(path.join(ROOT, "sites/demos", e.name, "site.json"))).map((e) => e.name).sort();
  const demos = o.only ? all.filter((d) => o.only?.includes(d)) : all;
  /** @type {{ slug: string, name: string, kit: string }[]} */
  const list = [];
  for (const slug of demos) {
    const m = await buildSite(path.join(ROOT, "sites/demos", slug), { outDir: path.join(out, slug), env: "preview", links: "html", label: `pages/${slug}`, today: o.today, manifest: false });
    await rm(path.join(out, slug, "_headers"), { force: true }); // Cloudflare's file; GitHub Pages would only serve it
    list.push({ slug, name: m.name, kit: m.kit });
  }
  await writeFile(path.join(out, "robots.txt"), ROBOTS);
  await writeFile(path.join(out, ".nojekyll"), "");
  await writeFile(path.join(out, "index.html"), `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Sitefloor demos</title>
<style>body{font:16px/1.5 system-ui,sans-serif;margin:48px auto;max-width:640px;padding:0 20px;color:#0E0F11;background:#FBFAF7}a{color:inherit}li{margin:6px 0}small{color:#555}</style></head>
<body><h1>Sitefloor demos</h1><p>Fictional businesses, made to show what each kit does. Not real shops: the names, addresses and numbers are invented.</p>
<ul>${list.map((d) => `<li><a href="${d.slug}/index.html">${esc(d.name)}</a> <small>${esc(d.kit)}</small></li>`).join("")}</ul>
<p><small>Website by Sitefloor</small></p></body></html>
`);
  const bad = await indexablePages(out);
  if (bad.length) throw new Error(`pages without noindex (demos must never be indexed): ${bad.join(", ")}`);
  return { demos: list.map((d) => d.slug) };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const { values } = parseArgs({ options: { out: { type: "string" }, only: { type: "string" }, today: { type: "string" } } });
  if (!values.out) throw new Error("--out <folder> is required, e.g. --out _site");
  buildPages({ out: values.out, only: values.only?.split(","), today: values.today })
    .then((r) => console.log(`✓ ${r.demos.length} demos → ${values.out} (noindex everywhere, robots.txt blocks crawling)`))
    .catch((e) => { console.error(`✗ ${e.message}`); process.exit(1); });
}
