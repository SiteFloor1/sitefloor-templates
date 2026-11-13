// @ts-check
/**
 * A look owns everything a visitor sees (CLAUDE.md rule 4). This builds the folder Eleventy includes templates from:
 * a copy of every template in src/, with the look's own versions laid over the shared ones. Logic stays shared; only
 * markup is replaced, and a look that supplies nothing builds exactly as before.
 *
 *   src/looks/<look>/header.njk              → the site header and navigation   (core/partials/header.njk)
 *   src/looks/<look>/footer.njk              → the footer                        (core/partials/footer.njk)
 *   src/looks/<look>/mobile-bar.njk          → the phone action bar              (core/partials/mobile-bar.njk)
 *   src/looks/<look>/section-head.njk        → how sections are introduced       (core/partials/section-head.njk)
 *   src/looks/<look>/features/<id>.njk       → a feature's markup                (<feature dir>/<id>.njk)
 *   src/looks/<look>/features/<id>/<f>.njk   → any other template of a feature   (<feature dir>/<f>.njk, e.g. a home part)
 *
 * A look's footer must keep the "Website by Sitefloor" credit (scripts/lib/verify.js checks every page).
 */
import { readdir, mkdir, copyFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

/** Shared partials a look may replace, by the file name it uses. */
/** Top-level templates a look may have: its hero plus the partials it can replace. */
export const LOOK_FILES = ["hero.njk", "header.njk", "footer.njk", "mobile-bar.njk", "section-head.njk"];
export const LOOK_PARTIALS = { "header.njk": "core/partials/header.njk", "footer.njk": "core/partials/footer.njk", "mobile-bar.njk": "core/partials/mobile-bar.njk", "section-head.njk": "core/partials/section-head.njk" };

/** @param {string} dir @returns {Promise<string[]>} .njk files under dir, relative to it */
async function templates(dir) {
  /** @type {string[]} */ const out = [];
  /** @param {string} rel */
  async function walk(rel) {
    for (const e of await readdir(path.join(dir, rel), { withFileTypes: true })) {
      const r = path.join(rel, e.name);
      if (e.isDirectory()) await walk(r);
      else if (e.name.endsWith(".njk")) out.push(r);
    }
  }
  await walk("");
  return out;
}

/**
 * What a look replaces: shared template (relative to src/) → the look's file (absolute).
 * @param {string} root repo root @param {string} look @param {{ id: string, dir: string }[]} features the registry
 * @returns {Promise<Map<string, string>>}
 */
export async function lookOverrides(root, look, features) {
  const lookDir = path.join(root, "src", "looks", look);
  /** @type {Map<string, string>} */ const map = new Map();
  // A look's own top-level templates: its hero and the four partials. Anything else (a typo like heder.njk) is refused
  // rather than silently ignored.
  if (existsSync(lookDir)) for (const e of await readdir(lookDir, { withFileTypes: true })) {
    if (e.isFile() && e.name.endsWith(".njk") && !LOOK_FILES.includes(e.name)) throw new Error(`src/looks/${look}/${e.name}: not a template a look can supply (${LOOK_FILES.join(", ")}, or features/<id>.njk)`);
  }
  for (const [file, target] of Object.entries(LOOK_PARTIALS)) if (existsSync(path.join(lookDir, file))) map.set(target, path.join(lookDir, file));
  const fdir = path.join(lookDir, "features");
  if (!existsSync(fdir)) return map;
  for (const rel of await templates(fdir)) {
    const parts = rel.split(path.sep);
    const id = parts.length === 1 ? parts[0].replace(/\.njk$/, "") : parts[0];
    const f = features.find((x) => x.id === id);
    if (!f) throw new Error(`src/looks/${look}/features/${rel}: there is no feature "${id}" (src/features/registry.js)`);
    const featureRel = path.relative(path.join(root, "src"), path.join(root, f.dir));
    const file = parts.length === 1 ? `${id}.njk` : parts.slice(1).join(path.sep);
    const target = path.join(featureRel, file);
    if (!existsSync(path.join(root, "src", target))) throw new Error(`src/looks/${look}/features/${rel}: ${f.dir} has no ${file} to replace`);
    map.set(target.split(path.sep).join("/"), path.join(fdir, rel));
  }
  return map;
}

/**
 * Copies every template in src/ to `out`, the look's versions in place of the shared ones.
 * @param {{ root: string, out: string, look: string, features: { id: string, dir: string }[] }} o
 * @returns {Promise<string[]>} the shared templates the look replaced
 */
export async function buildIncludes(o) {
  const src = path.join(o.root, "src");
  const overrides = await lookOverrides(o.root, o.look, o.features);
  await rm(o.out, { recursive: true, force: true });
  for (const rel of await templates(src)) {
    const to = path.join(o.out, rel);
    await mkdir(path.dirname(to), { recursive: true });
    await copyFile(overrides.get(rel.split(path.sep).join("/")) ?? path.join(src, rel), to);
  }
  return [...overrides.keys()].sort();
}
