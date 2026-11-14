#!/usr/bin/env node
// @ts-check
/**
 * Builds one site (or all) from its site.json into dist/<site-path>/.
 *
 *   npm run build -- --site demos/barber
 *   npm run build -- --site clients/kings-cuts --env production
 *   npm run build:all                     (every site + test fixtures)
 *
 * Options
 *   --site <path>     folder under sites/ (or tests/fixtures/sites/ with --fixtures)
 *   --all             build every site.json under sites/
 *   --fixtures        also build tests/fixtures/sites/* into dist/_fixtures/
 *   --today <date>    build as if on that day (YYYY-MM-DD): a demo's sample dates are moved ahead of it
 *   --as-written      keep demo sample dates as written (the browser tests use this with --today, see test-day.json)
 *   --env <name>      production | preview (default: $SITE_ENV or "preview").
 *                     Only production builds of indexable client sites are indexable.
 *   --links <style>   pretty (/team, for Cloudflare) | html (team.html, for file previews)
 *
 * Steps: validate config → bundle CSS/JS with esbuild → render pages with
 * Eleventy → copy images → write robots.txt, sitemap.xml, _headers →
 * verify the output (demo content cannot leak into client builds).
 */
import { readFile, writeFile, mkdir, rm, cp, readdir, stat } from "node:fs/promises";
import { existsSync, statSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { validateSite } from "../src/core/lib/config.js";
import { loadCatalog } from "./lib/catalog.js";
import { shouldIndex, robotsTxt, sitemapXml, headersFile, unlistedPages } from "../src/core/lib/seo.js";
import { bundleAssets } from "./lib/bundle.js";
import { renderPages } from "./lib/render.js";
import { verifyOutput } from "./lib/verify.js";
import { rollDemoDates } from "../src/demo/dates.js";
import { FEATURES, KITS } from "../src/features/registry.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITES_DIR = path.join(ROOT, "sites");
const FIXTURES_DIR = path.join(ROOT, "tests", "fixtures", "sites");
const DIST = path.join(ROOT, "dist");
const WORK = path.join(ROOT, ".build");

/**
 * @param {string} siteDir absolute path to a folder containing site.json
 * @param {{ outDir: string, env: "production"|"preview", links: "pretty"|"html", label: string, today?: string, manifest?: boolean, asWritten?: boolean }} o
 *   `today` (YYYY-MM-DD, default the real day) is what a demo's sample dates are moved ahead of; `asWritten` keeps them
 *   as the demo's site.json has them (the browser tests, which pin their clocks to the days those dates were written for)
 */
export async function buildSite(siteDir, o) {
  assertOutsideSources(o.outDir, siteDir);
  // Build-time code that needs "now" reads it from here (src/core/lib/build-day.js), so --today pins all of it.
  if (o.today) process.env.SITEFLOOR_BUILD_DAY = o.today; else delete process.env.SITEFLOOR_BUILD_DAY;
  // A demo's forward-looking sample dates are moved ahead of today (src/demo/dates.js); a client's are its own.
  const raw = JSON.parse(await readFile(path.join(siteDir, "site.json"), "utf8"));
  const site = o.asWritten ? raw : rollDemoDates(raw, o.today ?? new Date().toISOString().slice(0, 10));
  const errors = validateSite(site, {
    catalog: loadCatalog(ROOT),
    fileExists: (rel) => existsSync(path.join(siteDir, rel)),
    fileSize: (rel) => (existsSync(path.join(siteDir, rel)) ? statSync(path.join(siteDir, rel)).size : null),
    fileText: (rel) => readFileSync(path.join(siteDir, rel), "utf8"),
  });
  if (errors.length) throw new Error(`${o.label}: site.json is invalid\n  - ${errors.join("\n  - ")}`);

  const work = path.join(WORK, site.id);
  await rm(o.outDir, { recursive: true, force: true });
  await mkdir(o.outDir, { recursive: true });
  await mkdir(work, { recursive: true });

  const assets = await bundleAssets(site, { root: ROOT, work, outDir: o.outDir, catalog: loadCatalog(ROOT) });
  const indexable = shouldIndex(site, o.env);
  const today = o.today ?? new Date().toISOString().slice(0, 10);
  await renderPages(site, { root: ROOT, work, outDir: o.outDir, assets, links: o.links, env: o.env, indexable, today });

  if (existsSync(path.join(siteDir, "img"))) {
    await cp(path.join(siteDir, "img"), path.join(o.outDir, "img"), { recursive: true, filter: (src) => !src.endsWith("CREDITS.md") });
  }
  // A trade's own photographs (e.g. the car studio's cars and driver's-seat views), shared by every site of that trade.
  const kitAssets = path.join(ROOT, "src", "kits", site.kit, "assets");
  if (existsSync(kitAssets)) {
    await cp(kitAssets, path.join(o.outDir, "img", "kit"), { recursive: true, filter: (src) => !/\.(md|py)$/.test(src) });
  }
  // Shared models a kit draws (e.g. the 3D cars in src/core/assets/cars), copied only when its kit.js lists them.
  for (const name of KITS.find((k) => k.id === site.kit)?.sharedAssets ?? []) {
    const shared = path.join(ROOT, "src", "core", "assets", name);
    if (!existsSync(shared)) throw new Error(`${site.kit} kit: sharedAssets "${name}" isn't a folder in src/core/assets`);
    await cp(shared, path.join(o.outDir, "img", name), { recursive: true, filter: (src) => !/\.(md|py)$/.test(src) });
  }
  // A trade's own build step (e.g. the restaurant's printed menu, made from site.json).
  const kitBuild = path.join(ROOT, "src", "kits", site.kit, "build.js");
  if (existsSync(kitBuild)) await (await import(pathToFileURL(kitBuild).href)).afterBuild({ site, outDir: o.outDir, root: ROOT, look: loadCatalog(ROOT).looks[site.look] });
  const favicon = path.join(ROOT, "src", "looks", site.look, "favicon.svg");
  if (existsSync(favicon)) await cp(favicon, path.join(o.outDir, "favicon.svg"));
  // Pages in folders too (a fleet's /fleet/<class> and /cars/<car>), so every generated page is checked and listed.
  const pages = (await readdir(o.outDir, { recursive: true })).map((f) => f.split(path.sep).join("/"))
    .filter((f) => f.endsWith(".html") && f !== "404.html" && !f.startsWith("assets/") && !f.startsWith("img/")).map((f) => f.replace(/\.html$/, "")).sort();
  await writeFile(path.join(o.outDir, "robots.txt"), robotsTxt(site, o.env));
  // The site's own unlisted pages, and their collections (named "<page>-<id>"), stay out of the sitemap and search.
  const unlisted = unlistedPages(pages, FEATURES, site.features ?? []);
  if (indexable) await writeFile(path.join(o.outDir, "sitemap.xml"), sitemapXml(site, pages.filter((p) => !unlisted.includes(p)).map((p) => (p === "index" ? "/" : `/${p}`)), today));
  await writeFile(path.join(o.outDir, "_headers"), headersFile(site, o.env));

  const problems = await verifyOutput(site, o.outDir, pages.concat("404"));
  if (problems.length) throw new Error(`${o.label}: output check failed\n  - ${problems.join("\n  - ")}`);

  const manifest = { id: site.id, label: o.label, mode: site.mode, plan: site.plan, kit: site.kit, url: site.url, name: site.business.name,
    whatsapp: site.contact.whatsapp, phone: site.contact.phone, booking: site.booking ?? { provider: "whatsapp" }, indexable, pages, unlisted, features: site.features, links: o.links,
    outDir: path.relative(ROOT, o.outDir) };
  if (o.manifest !== false) { // the browser tests find built sites by these; the published demo site doesn't add any
    await mkdir(path.join(WORK, "manifests"), { recursive: true });
    await writeFile(path.join(WORK, "manifests", `${o.label.replace(/[\\/]/g, "__")}.json`), JSON.stringify(manifest, null, 2));
  }
  return manifest;
}

/** Whether `child` is `parent` or inside it. @param {string} child @param {string} parent */
const within = (child, parent) => { const r = path.relative(parent, child); return r === "" || (!r.startsWith("..") && !path.isAbsolute(r)); };

/**
 * The build empties its output folder first, so it must never point at site sources: not inside `sites/` or the
 * test fixtures, and not a folder that holds them (`--site ../sites/demos/barber` would otherwise delete that demo).
 * @param {string} outDir @param {string} siteDir
 */
export function assertOutsideSources(outDir, siteDir) {
  const out = path.resolve(outDir);
  for (const src of [SITES_DIR, FIXTURES_DIR, path.resolve(siteDir)]) {
    if (within(out, src) || within(src, out)) {
      throw new Error(`Refusing to build into ${path.relative(ROOT, out) || "."}: it is or holds site sources (${path.relative(ROOT, src)}), `
        + "and the build empties its output folder. Build into dist/ (e.g. npm run build -- --site demos/barber).");
    }
  }
}

/** @param {string} dir @returns {Promise<string[]>} folders (relative to dir) that contain site.json */
async function findSites(dir) {
  /** @type {string[]} */
  const found = [];
  if (!existsSync(dir)) return found;
  /** @param {string} rel */
  async function walk(rel) {
    const abs = path.join(dir, rel);
    if (existsSync(path.join(abs, "site.json"))) { found.push(rel); return; }
    for (const name of await readdir(abs)) {
      if (name.startsWith(".") || name === "img") continue;
      if ((await stat(path.join(abs, name))).isDirectory()) await walk(path.join(rel, name));
    }
  }
  await walk("");
  return found.sort();
}

async function main() {
  const { values } = parseArgs({ options: {
    site: { type: "string" }, all: { type: "boolean" }, fixtures: { type: "boolean" },
    env: { type: "string" }, links: { type: "string" }, today: { type: "string" }, "as-written": { type: "boolean" },
  } });
  // --today YYYY-MM-DD: build as if on that day (demo dates, "upcoming" lists); for checking a demo's dates ahead.
  if (values.today !== undefined && !/^\d{4}-\d\d-\d\d$/.test(values.today)) throw new Error(`--today must be YYYY-MM-DD, got "${values.today}"`);
  const env = /** @type {"production"|"preview"} */ (values.env ?? process.env.SITE_ENV ?? "preview");
  if (!["production", "preview"].includes(env)) throw new Error(`--env must be production or preview, got "${env}"`);
  const links = /** @type {"pretty"|"html"} */ (values.links ?? "pretty");
  if (!["pretty", "html"].includes(links)) throw new Error(`--links must be pretty or html, got "${links}"`);

  /** @type {{ dir: string, out: string, label: string }[]} */
  const targets = [];
  if (values.site) targets.push({ dir: path.join(SITES_DIR, values.site), out: path.join(DIST, values.site), label: values.site });
  if (values.all) for (const rel of await findSites(SITES_DIR)) targets.push({ dir: path.join(SITES_DIR, rel), out: path.join(DIST, rel), label: rel });
  if (values.fixtures) for (const rel of await findSites(FIXTURES_DIR)) targets.push({ dir: path.join(FIXTURES_DIR, rel), out: path.join(DIST, "_fixtures", rel), label: `_fixtures/${rel}` });
  if (!targets.length) throw new Error("Nothing to build. Use --site <path>, --all or --fixtures.");

  if (values.all) await rm(path.join(WORK, "manifests"), { recursive: true, force: true });
  for (const t of targets) {
    if (!existsSync(path.join(t.dir, "site.json"))) throw new Error(`No site.json in ${path.relative(ROOT, t.dir)}`);
    const m = await buildSite(t.dir, { outDir: t.out, env, links, label: t.label, today: values.today, asWritten: values["as-written"] });
    console.log(`✓ ${t.label}  (${m.mode}, ${m.plan}, ${m.pages.length} pages, ${m.indexable ? "indexable" : "noindex"}) → ${path.relative(ROOT, t.out)}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(`✗ ${e.message}`); process.exit(1); });
}
