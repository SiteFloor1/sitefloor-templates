#!/usr/bin/env node
// @ts-check
/**
 * Demo links come from one setting: demo-hosting.json `base`. Every link to a demo in this repo's case studies and
 * docs is `<base>/<demo folder>/`. After changing `base` (with the old one listed in `previous`), run
 *   npm run demo-links            rewrite every link on an old base to the new one
 * `npm run rules` reports any link still on an old base (demoLinkProblems).
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** @param {string} root @returns {{ base: string, previous: string[] }} */
export function hosting(root = ROOT) {
  const h = JSON.parse(readFileSync(path.join(root, "demo-hosting.json"), "utf8"));
  if (!/^https:\/\/[^/]+(\/[^/]+)*$/.test(h.base ?? "")) throw new Error('demo-hosting.json: "base" must be an https address without a trailing slash');
  return { base: h.base, previous: h.previous ?? [] };
}

/** A demo's address. @param {string} demo the folder in sites/demos @param {string} [root] */
export const demoUrl = (demo, root = ROOT) => `${hosting(root).base}/${demo}/`;

/** The files that may link to demos: case studies and docs. @param {string} root */
function files(root) {
  /** @type {string[]} */
  const out = [];
  const walk = (/** @type {string} */ rel) => {
    for (const e of readdirSync(path.join(root, rel), { withFileTypes: true })) {
      const r = path.join(rel, e.name);
      if (e.isDirectory()) walk(r);
      else if (/\.(md|html)$/.test(e.name)) out.push(r);
    }
  };
  for (const d of ["case-studies", "docs"]) if (existsSync(path.join(root, d))) walk(d);
  return out.concat(["README.md"].filter((f) => existsSync(path.join(root, f))));
}

const escape = (/** @type {string} */ s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Links still on an old base, as "file: link". @param {string} [root] @returns {string[]} */
export function demoLinkProblems(root = ROOT) {
  const { previous } = hosting(root);
  if (!previous.length) return [];
  const old = new RegExp(`(${previous.map(escape).join("|")})/[a-z0-9-]+/`, "g");
  return files(root).flatMap((f) => [...readFileSync(path.join(root, f), "utf8").matchAll(old)].map((m) => `${f}: ${m[0]} is on an old demo address; run npm run demo-links`));
}

/** Rewrites links on an old base to the current one. @param {string} [root] @returns {string[]} files changed */
export function rewriteDemoLinks(root = ROOT) {
  const { base, previous } = hosting(root);
  if (!previous.length) return [];
  const old = new RegExp(`(${previous.map(escape).join("|")})(/[a-z0-9-]+/)`, "g");
  return files(root).filter((f) => {
    const text = readFileSync(path.join(root, f), "utf8"), next = text.replace(old, (_, __, tail) => `${base}${tail}`);
    if (next !== text) writeFileSync(path.join(root, f), next);
    return next !== text;
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const changed = rewriteDemoLinks();
  console.log(changed.length ? `Demo links moved to ${hosting().base} in:\n  ${changed.join("\n  ")}` : `Every demo link already uses ${hosting().base}.`);
}
