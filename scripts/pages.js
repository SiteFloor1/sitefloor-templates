#!/usr/bin/env node
// @ts-check
/**
 * Builds the published demo site (GitHub Pages, .github/workflows/demos.yml): every demo in sites/demos/, each in its
 * own folder with relative links (`--links html`), the case studies under case-studies/, and an index. Demos are
 * fictional businesses with fictional addresses and numbers, so every page must say noindex: the build fails if one
 * doesn't. robots.txt allows crawling on purpose: a crawler that may not fetch a page never sees its noindex.
 * Demo dates are worked out for the day it runs (src/demo/dates.js), which is why it runs daily.
 * A case study is published only when every file it uses is in the repo (some media still live only in their old
 * claude.ai artifacts); the others are listed as skipped. The build also fails on any local link that leads nowhere,
 * and leaves PDFs out (they can't say noindex). CI runs it on every pull request (check.yml, build job).
 *   node scripts/pages.js --out _site [--only barber,cafe] [--today YYYY-MM-DD]
 */
import { readFile, writeFile, readdir, rm, mkdir, cp } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { buildSite } from "./build.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Crawlers may read every page, so they see each page's noindex and drop it (a Disallow would hide the noindex).
export const ROBOTS = "User-agent: *\nAllow: /\n";
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

/** Local files a page uses (src, href, poster, srcset), without links out, anchors or script-built names. @param {string} html */
export function localRefs(html) {
  const refs = [...html.matchAll(/\b(?:src|href|poster)="([^"]+)"|\bsrcset="([^"]+)"/g)]
    .flatMap((m) => (m[1] ? [m[1]] : m[2].split(",").map((c) => c.trim().split(/\s+/)[0])))
    .map((r) => r.split("#")[0].split("?")[0])
    .filter((r) => r && !/^(?:[a-z]+:|\/\/|#)/i.test(r) && !r.includes("${"));
  return [...new Set(refs)];
}

/**
 * Local links and files that lead nowhere: every href, src, poster and srcset on every page, resolved from the page's
 * own folder ("x/" means "x/index.html"). @param {string} out @returns {Promise<string[]>} "page: target"
 */
export async function brokenLinks(out) {
  const bad = [];
  for (const f of (await files(out)).filter((x) => x.endsWith(".html"))) {
    const html = await readFile(f, "utf8");
    for (const ref of localRefs(html)) {
      const target = path.resolve(path.dirname(f), ref.endsWith("/") ? `${ref}index.html` : ref);
      if (!target.startsWith(out + path.sep) || !existsSync(target)) bad.push(`${path.relative(out, f)}: ${ref}`);
    }
  }
  return [...new Set(bad)];
}

/**
 * A PDF can't carry noindex and GitHub Pages can't send an X-Robots-Tag header, so the published demos have none:
 * each is removed and links to it point at the page of the same name (menu.pdf → menu.html) or at the demo's home.
 * @param {string} dir a demo's folder
 */
async function dropPdfs(dir) {
  const pdfs = (await files(dir)).filter((f) => f.endsWith(".pdf")).map((f) => path.relative(dir, f));
  if (!pdfs.length) return;
  for (const pdf of pdfs) await rm(path.join(dir, pdf), { force: true });
  for (const f of (await files(dir)).filter((x) => x.endsWith(".html"))) {
    let html = await readFile(f, "utf8");
    for (const pdf of pdfs) {
      const page = pdf.replace(/\.pdf$/, ".html"), to = existsSync(path.join(dir, page)) ? page : "index.html";
      html = html.split(`href="${pdf}"`).join(`href="${to}"`);
    }
    await writeFile(f, html);
  }
}

/** A page with a robots noindex tag (added after <head> if it has none). @param {string} html */
const withNoindex = (html) => {
  if (NOINDEX.test(html)) return html;
  const tag = '\n<meta name="robots" content="noindex, nofollow">';
  // After <head>, or (HTML lets a page leave <head> out) after <html> or the doctype.
  for (const re of [/<head\b[^>]*>/i, /<html\b[^>]*>/i, /<!doctype html>/i]) if (re.test(html)) return html.replace(re, (m) => m + tag);
  return tag.trim() + "\n" + html;
};

/**
 * Copies each complete case study into out/case-studies/<slug>/ with noindex. Its demo links are already
 * <demo-hosting.json base>/<demo>/ (scripts/demo-links.js keeps them so).
 * @param {string} out @returns {Promise<{ published: string[], skipped: { slug: string, missing: string[] }[] }>}
 */
async function caseStudies(out) {
  const dir = path.join(ROOT, "case-studies");
  const slugs = (await readdir(dir, { withFileTypes: true })).filter((e) => e.isDirectory() && existsSync(path.join(dir, e.name, "index.html"))).map((e) => e.name).sort();
  /** @type {string[]} */ const published = [];
  /** @type {{ slug: string, missing: string[] }[]} */ const skipped = [];
  for (const slug of slugs) {
    const src = path.join(dir, slug), html = await readFile(path.join(src, "index.html"), "utf8");
    const missing = localRefs(html).filter((r) => !existsSync(path.join(src, r)));
    if (missing.length) { skipped.push({ slug, missing }); continue; }
    const to = path.join(out, "case-studies", slug);
    await cp(src, to, { recursive: true, filter: (f) => !/(README|fonts)\.md$/.test(f) });
    await writeFile(path.join(to, "index.html"), withNoindex(html));
    published.push(slug);
  }
  return { published, skipped };
}

const esc = (/** @type {string} */ s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);

/**
 * @param {{ out: string, only?: string[], today?: string, caseStudies?: boolean }} o
 * @returns {Promise<{ demos: string[], caseStudies: string[], skipped: { slug: string, missing: string[] }[] }>}
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
    // Cloudflare's file (GitHub Pages would only serve it), and the site's own robots.txt, which blocks crawling and
    // would hide its noindex; crawlers read only the one at the domain's root anyway.
    await rm(path.join(out, slug, "_headers"), { force: true });
    await rm(path.join(out, slug, "robots.txt"), { force: true });
    await dropPdfs(path.join(out, slug));
    list.push({ slug, name: m.name, kit: m.kit });
  }
  const cases = o.caseStudies === false ? { published: [], skipped: [] } : await caseStudies(out);
  await writeFile(path.join(out, "robots.txt"), ROBOTS);
  await writeFile(path.join(out, ".nojekyll"), "");
  await writeFile(path.join(out, "index.html"), `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Sitefloor demos</title>
<style>body{font:16px/1.5 system-ui,sans-serif;margin:48px auto;max-width:640px;padding:0 20px;color:#0E0F11;background:#FBFAF7}a{color:inherit}li{margin:6px 0}small{color:#555}</style></head>
<body><h1>Sitefloor demos</h1><p>Fictional businesses, made to show what each kit does. Not real shops: the names, addresses and numbers are invented.</p>
<ul>${list.map((d) => `<li><a href="${d.slug}/index.html">${esc(d.name)}</a> <small>${esc(d.kit)}</small></li>`).join("")}</ul>
${cases.published.length ? `<h2>Case studies</h2><ul>${cases.published.map((c) => `<li><a href="case-studies/${c}/index.html">${esc(c)}</a></li>`).join("")}</ul>` : ""}
<p><small>Website by Sitefloor</small></p></body></html>
`);
  const bad = await indexablePages(out);
  if (bad.length) throw new Error(`pages without noindex (demos must never be indexed): ${bad.join(", ")}`);
  const broken = await brokenLinks(out);
  if (broken.length) throw new Error(`links to nothing on the published site:\n  ${broken.slice(0, 40).join("\n  ")}`);
  return { demos: list.map((d) => d.slug), caseStudies: cases.published, skipped: cases.skipped };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const { values } = parseArgs({ options: { out: { type: "string" }, only: { type: "string" }, today: { type: "string" } } });
  if (!values.out) throw new Error("--out <folder> is required, e.g. --out _site");
  buildPages({ out: values.out, only: values.only?.split(","), today: values.today })
    .then((r) => {
      console.log(`✓ ${r.demos.length} demos and ${r.caseStudies.length} case studies → ${values.out} (noindex on every page)`);
      for (const c of r.skipped) console.log(`  skipped case study ${c.slug}: ${c.missing.length} file(s) not in the repo, e.g. ${c.missing[0]}`);
    })
    .catch((e) => { console.error(`✗ ${e.message}`); process.exit(1); });
}
