#!/usr/bin/env node
// @ts-check
/**
 * House-rules check (CLAUDE.md rules 4 and 6, and the "no AI slop" rules in
 * sitefloor-internal/docs/TEMPLATE-ROADMAP.md). Catches the mechanical breaks a person would
 * otherwise have to spot by eye. It runs on the source, in well under a second.
 * Taste still needs a person: this does not judge whether a look is good.
 *
 *   npm run rules
 *
 * 1. Features use design tokens only: no raw colours in feature CSS.
 * 2. Looks don't use the stock fonts that make sites look machine-made.
 * 3. No two looks share a display font, body font or accent colour.
 * 4. No filler marketing phrases in site copy or templates.
 * 5. Every look has a favicon; every site's photos are listed in img/CREDITS.md.
 * 6. Between them, a kit's demos show every feature of that kit (each demo can show a different set).
 * 7. The shared build files name no kit: each kit registers itself in src/kits/<kit>/kit.js.
 * 8. The generated docs indexes are current, and no two trades or case studies claim the same font family
 *    (scripts/docs-index.js).
 */
import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { FEATURES, forKit } from "../src/features/registry.js";
import { KITS } from "../src/features/registry.js";
import { docsProblems } from "./docs-index.js";
import { pathToFileURL } from "node:url";

const RAW_COLOUR = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?)\(/gi;
export const BANNED_FONTS = ["Inter", "DM Sans", "Poppins", "Montserrat"];
export const FILLER = [
  "elevate", "seamless", "unlock your", "unleash", "game-changer", "game changer", "cutting-edge", "world-class",
  "look no further", "next level", "one-stop", "nestled", "fast-paced", "tailored to your needs", "we've got you covered",
];

/** @param {string} css @returns {string[]} raw colours found outside comments */
export function rawColours(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "").match(RAW_COLOUR) ?? [];
}

/**
 * First value in a token, e.g. --font-display: "Playfair Display", serif → Playfair Display
 * @param {string} css @param {string} token @returns {string|null}
 */
export function tokenValue(css, token) {
  const m = new RegExp(`${token}\\s*:\\s*([^;]+);`).exec(css);
  return m ? m[1].split(",")[0].trim().replace(/^["']|["']$/g, "") : null;
}

/** Colour values inside fill/stroke/stop-color/style attributes or rgb()/hsl() calls in JS source. @param {string} js @returns {string[]} */
export function colourInMarkup(js) {
  const code = js.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(?<![:"'`])\/\/.*$/gm, ""); // comments, but not the // in https://
  return [...code.matchAll(/(?:fill|stroke|stop-color|color|background)\s*[=:]\s*["'`]?\s*(#[0-9a-f]{3,8}\b|(?:rgba?|hsla?)\()/gi)].map((m) => m[1]);
}

/** @param {string} text @returns {string[]} filler phrases found (case-insensitive, whole words) */
export function fillerIn(text) {
  const lower = text.toLowerCase();
  return FILLER.filter((f) => new RegExp(`(^|[^a-z])${f.replace(/[-]/g, "[- ]?")}([^a-z]|$)`).test(lower));
}

/**
 * Files every kit goes through. They find kits by themselves (src/features/registry.js → KITS), so a kit's name,
 * even in a comment, means a kit is being wired in by hand and two kits will collide on the same lines again.
 */
export const SHARED_REGISTRATION = ["scripts/lib/bundle.js", "scripts/lib/render.js", "src/core/lib/config.js", "src/core/lib/config-extras.js", "src/core/lib/seo.js", "src/features/registry.js"];

/** @param {string} text @param {string[]} kits @returns {string[]} kit names found as whole words (any case) */
export function kitNamesIn(text, kits) {
  return kits.filter((k) => new RegExp(`(^|[^a-z0-9_-])${k}([^a-z0-9_]|$)`, "i").test(text));
}

/** @param {string} dir @param {(f: string) => boolean} keep @returns {Promise<string[]>} */
async function walk(dir, keep) {
  /** @type {string[]} */
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p, keep)));
    else if (keep(p)) out.push(p);
  }
  return out;
}

/** @param {string} root repo root @returns {Promise<string[]>} problems */
export async function checkRules(root) {
  /** @type {string[]} */
  const problems = [];
  const rel = (/** @type {string} */ p) => path.relative(root, p);

  const kitIds = (await readdir(path.join(root, "src/kits"), { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  for (const f of SHARED_REGISTRATION) {
    const found = kitNamesIn(await readFile(path.join(root, f), "utf8"), kitIds);
    if (found.length) problems.push(`${f}: names the kit ${found.join(", ")}; put kit-specific code in src/kits/<kit>/kit.js (and keep comments trade-neutral)`);
  }

  problems.push(...docsProblems(root));

  const featureCss = [
    ...(await walk(path.join(root, "src/features"), (f) => f.endsWith(".css"))),
    ...(await walk(path.join(root, "src/kits"), (f) => f.endsWith(".css") && f.includes(`${path.sep}features${path.sep}`))),
  ];
  for (const f of featureCss) {
    const found = rawColours(await readFile(f, "utf8"));
    if (found.length) problems.push(`${rel(f)}: raw colour ${[...new Set(found)].join(", ")}; use a token (--accent, --on-photo, …) so every look can restyle it`);
  }

  // Colours written into markup by kit or feature code (SVG diagrams, generated HTML) must come
  // from CSS classes too, or a second look of the same trade inherits the first look's colours.
  const featureJs = [
    ...(await walk(path.join(root, "src/features"), (f) => f.endsWith(".js"))),
    ...(await walk(path.join(root, "src/kits"), (f) => f.endsWith(".js"))),
  ];
  for (const f of featureJs) {
    const found = colourInMarkup(await readFile(f, "utf8"));
    if (found.length) problems.push(`${rel(f)}: colour written into markup (${[...new Set(found)].join(", ")}); use a dg-*/token class instead`);
  }

  /** @type {Record<string, string[]>} */
  const seen = { "--font-display": [], "--font-body": [], "--accent": [] };
  const looks = (await readdir(path.join(root, "src/looks"), { withFileTypes: true })).filter((d) => d.isDirectory());
  for (const look of looks) {
    const css = await readFile(path.join(root, "src/looks", look.name, "look.css"), "utf8");
    for (const font of BANNED_FONTS) {
      if (new RegExp(`["']${font}["']|font-family:\\s*${font}\\b`, "i").test(css)) problems.push(`src/looks/${look.name}: uses ${font}, a stock font that reads as a template`);
    }
    for (const token of Object.keys(seen)) {
      const v = tokenValue(css, token);
      if (!v) { problems.push(`src/looks/${look.name}/look.css: missing ${token}`); continue; }
      const clash = seen[token].find((s) => s.split("=")[1].toLowerCase() === v.toLowerCase());
      if (clash) problems.push(`src/looks/${look.name}: ${token} ${v} is already used by ${clash.split("=")[0]}; every look must be unrecognisably different`);
      seen[token].push(`${look.name}=${v}`);
    }
  }

  const copy = [
    ...(await walk(path.join(root, "sites"), (f) => f.endsWith("site.json"))),
    ...(await walk(path.join(root, "src"), (f) => f.endsWith(".njk") || f.endsWith("client-template.json") || f.includes(`${path.sep}data${path.sep}`))),
  ];
  for (const f of copy) {
    const found = fillerIn(await readFile(f, "utf8"));
    if (found.length) problems.push(`${rel(f)}: filler copy "${found.join('", "')}"; say what the business actually does`);
  }
  for (const look of looks) {
    if (!existsSync(path.join(root, "src/looks", look.name, "favicon.svg"))) problems.push(`src/looks/${look.name}: missing favicon.svg`);
  }

  problems.push(...(await demoCoverage(root)));

  for (const imgDir of [...(await walkDirs(path.join(root, "sites"), "img")), ...(await walkDirs(path.join(root, "src/kits"), "assets"))]) {
    const images = (await readdir(imgDir)).filter((f) => /\.(webp|jpe?g|png|avif|svg|mp4)$/i.test(f));
    if (!images.length) continue;
    const credits = path.join(imgDir, "CREDITS.md");
    if (!existsSync(credits)) { problems.push(`${rel(imgDir)}: no CREDITS.md saying where its photos came from`); continue; }
    const text = await readFile(credits, "utf8");
    for (const f of images) if (!text.includes(f)) problems.push(`${rel(credits)}: ${f} is not listed`);
  }
  return problems;
}

/** Between them, a kit's demos show every feature of the kit. @param {string} root @returns {Promise<string[]>} */
async function demoCoverage(root) {
  /** @type {string[]} */
  const problems = [];
  /** @type {Record<string, Set<string>>} */
  const shown = {};
  for (const f of await walk(path.join(root, "sites/demos"), (f) => f.endsWith("site.json"))) {
    const site = JSON.parse(await readFile(f, "utf8"));
    for (const id of site.features ?? []) (shown[site.kit] ??= new Set()).add(id);
  }
  for (const [kit, ids] of Object.entries(shown)) {
    const missing = FEATURES.filter((f) => forKit(f, kit) && !ids.has(f.id)).map((f) => f.id);
    // A feature that only works with the client's own material (e.g. a matched before/after photo pair) can't be shown
    // honestly on a demo; it is covered by the kit's client test fixture instead.
    for (let i = missing.length - 1; i >= 0; i--) if (FEATURES.find((f) => f.id === missing[i])?.clientOnly) missing.splice(i, 1);
    // The same for a shared feature one trade offers only to clients (kit.js `clientOnly`).
    for (let i = missing.length - 1; i >= 0; i--) if ((KITS.find((k) => k.id === kit)?.clientOnly ?? []).includes(missing[i])) missing.splice(i, 1);
    if (missing.length) problems.push(`sites/demos: no ${kit} demo shows ${missing.join(", ")}; every kit feature needs a demo`);
  }
  return problems;
}

/** Folders named `name` anywhere under dir. @param {string} dir @param {string} name @returns {Promise<string[]>} */
async function walkDirs(dir, name) {
  /** @type {string[]} */
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    if (!e.isDirectory()) continue;
    const p = path.join(dir, e.name);
    if (e.name === name) out.push(p);
    else out.push(...(await walkDirs(p, name)));
  }
  return out;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const problems = await checkRules(process.cwd());
  if (problems.length) {
    console.error(`House rules: ${problems.length} problem(s)\n  ${problems.join("\n  ")}`);
    process.exit(1);
  }
  console.log("House rules: OK (tokens in features, fonts, look uniqueness, copy, no kit names in shared build files, docs indexes current, fonts claimed once)");
}
