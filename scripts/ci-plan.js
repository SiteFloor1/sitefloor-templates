#!/usr/bin/env node
// @ts-check
/**
 * Decides which browser tests a CI run needs, so a pull request that only touches one trade
 * doesn't re-test every kit.
 *
 *   node scripts/ci-plan.js --all                      every browser test (the daily full run)
 *   node scripts/ci-plan.js --files changed.txt [--base REF]
 *        from changed files (one path a line): a pull request's files, or on main everything since `production`.
 *        REF is the commit those files changed from; it lets a package.json / lockfile change that only adds or
 *        bumps @fontsource fonts count as the kits whose looks load them. Without it package files run everything.
 *   ... --since pushed.txt --since-base SHA
 *        a later push to a pull request: SHA is the PR's last commit with a green `check`, pushed.txt what changed
 *        since. The PR's browser tests run again only if those changes reach its kits (or shared code);
 *        reports, docs and merges of main that bring in only other kits' files run none.
 *
 * Rules (docs/ARCHITECTURE.md, "CI"):
 *  - Shared code (src/core, src/features, scripts, tests/e2e helpers and the cross-site specs, CI and build
 *    config, package changes beyond fonts) → everything.
 *  - A kit, one of its looks, demos, fixtures, client sites or its own spec → that kit's spec(s), the
 *    every-page and accessibility checks for that kit's sites, and a smoke test of every site. Also kit-scoped:
 *    a src/demo file that only kits' own files wire in, a src/core/assets folder only kits list in `sharedAssets`,
 *    and font-only package changes (the kits whose looks load those fonts).
 *  - Paths with no effect on a built page (docs, audits, case studies, tools, unit tests, markdown) → nothing.
 *  - Anything else → everything (when in doubt, test it all).
 *
 * Prints JSON { all, kits, specs, why } and, inside GitHub Actions, writes `kits` and `specs` to $GITHUB_OUTPUT.
 */
import { readFileSync, readdirSync, existsSync, appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const E2E = "tests/e2e";
/** Specs that check every site; when a run is narrowed they only see the selected kits' sites. */
const CROSS_SITE = ["a11y.spec.js", "all-sites.spec.js"];
const SMOKE = "smoke.spec.js";
const NO_EFFECT = [/^docs\//, /^audits\//, /^case-studies\//, /^tools\//, /^tests\/unit\//, /\.md$/i, /^\.gitignore$/, /^LICENSE/];
const SHARED = [/^src\/core\//, /^src\/features\//, /^src\/demo\//, /^scripts\//, /^package(-lock)?\.json$/, /^\.nvmrc$/,
  /^playwright\.config\.js$/, /^\.github\//, /^eslint\.config\.js$/, /^tsconfig\.json$/, /^tests\/fixtures\/[^/]+$/];

const readJson = (/** @type {string} */ f) => JSON.parse(readFileSync(f, "utf8"));
const dirs = (/** @type {string} */ d) => (existsSync(d) ? readdirSync(d, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name) : []);

/** Site folder → kit, for demos, fixtures and clients. */
function siteKits() {
  /** @type {Record<string, string>} */
  const kits = {};
  for (const [root, label] of [["sites/demos", "demos"], ["tests/fixtures/sites", "_fixtures"], ["sites/clients", "clients"]]) {
    for (const d of dirs(root)) {
      const f = path.join(root, d, "site.json");
      if (existsSync(f)) kits[`${label}/${d}`] = readJson(f).kit;
    }
  }
  return kits;
}

/** Look → the kits it serves (look.json → kits). */
function lookKits() {
  /** @type {Record<string, string[]>} */
  const kits = {};
  for (const d of dirs("src/looks")) {
    const f = path.join("src/looks", d, "look.json");
    kits[d] = existsSync(f) ? (readJson(f).kits ?? []) : [];
  }
  return kits;
}

/** Kit spec file → the kits whose sites it opens (from its site("…") calls). */
function specKits(/** @type {Record<string, string>} */ sites) {
  /** @type {Record<string, string[]>} */
  const out = {};
  for (const f of readdirSync(E2E).filter((n) => n.endsWith(".spec.js") && !CROSS_SITE.includes(n) && n !== SMOKE)) {
    const labels = [...readFileSync(path.join(E2E, f), "utf8").matchAll(/\bsite\(\s*"([^"]+)"\s*\)/g)].map((m) => m[1]);
    out[f] = [...new Set(labels.map((l) => sites[l]).filter(Boolean))];
  }
  return out;
}

/** Source files under src/, scripts/ and tests/e2e (code only; READMEs and credits don't wire anything in). */
let codeCache;
function codeFiles() {
  if (codeCache) return codeCache;
  codeCache = [];
  for (const root of ["src", "scripts", E2E]) {
    if (!existsSync(root)) continue;
    for (const f of readdirSync(root, { recursive: true, withFileTypes: true })) {
      if (!f.isFile() || !/\.(m?js|njk|json|css|html)$/.test(f.name)) continue;
      const p = path.join(f.parentPath, f.name).split(path.sep).join("/");
      codeCache.push({ path: p, text: readFileSync(p, "utf8") });
    }
  }
  return codeCache;
}

/**
 * The kits that use `needle`, or null when anything outside a kit or look uses it (or nothing does).
 * A file under src/kits/<kit>/ counts for that kit; under src/looks/<look>/ for the look's kits.
 * @param {string} needle @param {string} self the changed file itself @param {Record<string, string[]>} looks
 */
function usedOnlyByKits(needle, self, looks) {
  const kits = new Set();
  let used = false;
  for (const { path: p, text } of codeFiles()) {
    if (p === self || !text.includes(needle)) continue;
    used = true;
    let m;
    if ((m = p.match(/^src\/kits\/([^/]+)\//))) kits.add(m[1]);
    else if ((m = p.match(/^src\/looks\/([^/]+)\//)) && looks[m[1]]?.length) looks[m[1]].forEach((k) => kits.add(k));
    else return null;
  }
  return used ? [...kits] : null;
}

/** Folder in src/core/assets → the kits whose kit.js lists it in `sharedAssets` (the only way the build copies it). */
function assetKits(/** @type {string} */ name) {
  const kits = [];
  for (const k of dirs("src/kits")) {
    const f = path.join("src/kits", k, "kit.js");
    const list = existsSync(f) ? readFileSync(f, "utf8").match(/sharedAssets\s*=\s*\[([^\]]*)\]/) : null;
    if (list && [...list[1].matchAll(/["']([^"']+)["']/g)].some((m) => m[1] === name)) kits.push(k);
  }
  return kits;
}

const FONT = /^@fontsource\//;
const sortKeys = (/** @type {any} */ v) => (v && typeof v === "object" && !Array.isArray(v)
  ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])])) : v);
const same = (/** @type {any} */ a, /** @type {any} */ b) => JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b));

/**
 * The @fontsource packages a package.json or package-lock.json change adds, removes or bumps, or null when it changes
 * anything else (another dependency, a script, engines, a nested package…).
 * @param {string} file @param {string} before @param {string} after
 * @returns {string[] | null}
 */
export function fontChanges(file, before, after) {
  let a, b;
  try { a = JSON.parse(before); b = JSON.parse(after); } catch { return null; }
  const changed = new Set();
  /** Takes the font entries out of one dependency map, noting any that differ. */
  const strip = (/** @type {any} */ x, /** @type {any} */ y) => {
    for (const k of new Set([...Object.keys(x ?? {}), ...Object.keys(y ?? {})])) {
      if (!FONT.test(k)) continue;
      if (!same(x?.[k], y?.[k])) changed.add(k);
      if (x) delete x[k];
      if (y) delete y[k];
    }
  };
  const SECTIONS = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];
  if (file === "package.json") {
    for (const s of SECTIONS) strip(a[s], b[s]);
  } else {
    for (const s of SECTIONS) strip(a.packages?.[""]?.[s], b.packages?.[""]?.[s]);
    for (const k of new Set([...Object.keys(a.packages ?? {}), ...Object.keys(b.packages ?? {})])) {
      const m = k.match(/^node_modules\/(@fontsource\/[^/]+)$/);
      if (!m) continue;
      if (!same(a.packages?.[k], b.packages?.[k])) changed.add(m[1]);
      if (a.packages) delete a.packages[k];
      if (b.packages) delete b.packages[k];
    }
  }
  return same(a, b) ? [...changed].sort() : null;
}

/**
 * Shared-looking paths that often belong to kits: font-only package changes, src/demo files and src/core/assets folders.
 * @param {string} f @param {Record<string, string[]>} looks @param {{ baseFile?: (file: string) => string | undefined }} opts
 * @returns {{ kits: string[], why: string } | { all: string } | undefined} undefined: not one of these paths
 */
function narrowShared(f, looks, opts) {
  let m;
  // Fonts only: the kits whose looks load them. Any other package change, or no way to see the old file, is shared.
  if (/^package(-lock)?\.json$/.test(f)) {
    const before = opts.baseFile?.(f);
    const after = existsSync(f) ? readFileSync(f, "utf8") : undefined;
    const fonts = before !== undefined && after !== undefined ? fontChanges(f, before, after) : null;
    if (!fonts) return { all: `shared: ${f}${before === undefined ? " (no base to compare)" : " (not fonts only)"}` };
    const kits = new Set();
    for (const pkg of fonts) {
      const k = usedOnlyByKits(`${pkg}/`, f, looks);
      // A font nothing loads any more (or never did) can't change a page; one loaded by shared code runs everything.
      if (k === null && codeFiles().some((c) => c.text.includes(`${pkg}/`))) return { all: `font used by shared code: ${pkg}` };
      (k ?? []).forEach((x) => kits.add(x));
    }
    return { kits: [...kits], why: `${f}: ${fonts.join(", ")} → ${[...kits].join(", ") || "no look"}` };
  }
  // Demo-only code (src/demo) that only kits' own files wire in, e.g. a provider named in one kit's kit.js.
  if ((m = f.match(/^src\/demo\/([^/]+\.js)$/))) {
    const k = usedOnlyByKits(m[1], f, looks);
    return k?.length ? { kits: k, why: `${f} → ${k.join(", ")}` } : { all: `shared: ${f} (used outside a kit, or by nothing)` };
  }
  // A shared model folder (src/core/assets/<name>/…) reaches only the kits that list it in sharedAssets.
  if ((m = f.match(/^src\/core\/assets\/([^/]+)\//))) {
    const k = assetKits(m[1]);
    return k.length ? { kits: k, why: `${f} → ${k.join(", ")}` } : { all: `shared: ${f} (no kit lists "${m[1]}" in sharedAssets)` };
  }
  return undefined;
}

/**
 * @param {string[]} files changed paths, relative to the repo root
 * @param {{ baseFile?: (file: string) => string | undefined }} [opts] the files as they were before the change
 * @returns {{ all: boolean, kits: string[], specs: string[], why: string[] }}
 */
export function plan(files, opts = {}) {
  const sites = siteKits();
  const looks = lookKits();
  const specs = specKits(sites);
  const kits = new Set();
  /** @type {string[]} */
  const why = [];
  const everything = (/** @type {string} */ reason) => ({ all: true, kits: [], specs: [], why: [...why, reason] });

  for (const f of files.map((x) => x.trim()).filter(Boolean)) {
    if (NO_EFFECT.some((r) => r.test(f))) continue;
    let m;
    const narrowed = narrowShared(f, looks, opts);
    if (narrowed && "all" in narrowed) return everything(narrowed.all);
    if (narrowed) { narrowed.kits.forEach((x) => kits.add(x)); why.push(narrowed.why); continue; }
    if (SHARED.some((r) => r.test(f))) return everything(`shared: ${f}`);
    if ((m = f.match(/^src\/kits\/([^/]+)\//))) { kits.add(m[1]); why.push(`${f} → ${m[1]}`); continue; }
    if ((m = f.match(/^src\/looks\/([^/]+)\//))) {
      const k = looks[m[1]];
      if (!k?.length) return everything(`look with no kit: ${f}`);
      k.forEach((x) => kits.add(x)); why.push(`${f} → ${k.join(", ")}`); continue;
    }
    if ((m = f.match(/^(sites\/(demos|clients)|tests\/fixtures\/sites)\/([^/]+)\//))) {
      const label = `${m[1] === "tests/fixtures/sites" ? "_fixtures" : m[2]}/${m[3]}`;
      const k = sites[label];
      if (!k) return everything(`site removed or unknown: ${f}`);
      kits.add(k); why.push(`${f} → ${k}`); continue;
    }
    if ((m = f.match(/^tests\/e2e\/([^/]+\.spec\.js)$/)) && specs[m[1]]?.length) {
      specs[m[1]].forEach((x) => kits.add(x)); why.push(`${f} → ${specs[m[1]].join(", ")}`); continue;
    }
    return everything(`not mapped to a kit: ${f}`);
  }

  const chosen = [...kits].sort();
  const specFiles = Object.entries(specs).filter(([, k]) => k.some((x) => kits.has(x))).map(([f]) => f).sort();
  return {
    all: false,
    kits: chosen,
    // No browser-relevant change at all: nothing to run.
    specs: chosen.length ? [...specFiles, ...CROSS_SITE, SMOKE].map((f) => `${E2E}/${f}`) : [],
    why,
  };
}

/**
 * A later push to a pull request that already has a green `check`: run the PR's browser tests again only if what
 * changed since that green commit reaches the PR's kits, or is shared code. A PR that itself changes shared code
 * reruns for any change that reaches a page (a kit merged in from main hasn't met its shared change yet).
 * @param {ReturnType<typeof plan>} pr the whole PR's plan
 * @param {ReturnType<typeof plan>} since the plan for what changed since the last green commit
 * @param {string} sha that commit
 */
export function sincePlan(pr, since, sha) {
  const short = sha.slice(0, 7);
  if (!pr.all && !pr.specs.length) return pr;
  const reaches = since.all || (pr.all ? since.kits.length > 0 : since.kits.some((k) => pr.kits.includes(k)));
  if (reaches) return { ...pr, why: [...pr.why, `changed since ${short} (green): ${since.all ? since.why.at(-1) : since.kits.join(", ")}`] };
  return { all: false, kits: [], specs: [], why: [`nothing since ${short} (green) reaches this PR's kits${since.kits.length ? ` (only ${since.kits.join(", ")})` : ""}`] };
}

/** Reads a file as it was at a git commit, for --base and --since-base. */
const gitFile = (/** @type {string} */ ref) => (/** @type {string} */ f) => {
  try { return execFileSync("git", ["show", `${ref}:${f}`], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] }); } catch { return undefined; }
};

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  const args = process.argv.slice(2);
  const arg = (/** @type {string} */ name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
  const lines = (/** @type {string} */ f) => readFileSync(f, "utf8").split("\n");
  const files = arg("--files");
  const base = arg("--base");
  const since = arg("--since");
  const sinceBase = arg("--since-base");
  let result = args.includes("--all") || !files
    ? { all: true, kits: [], specs: [], why: ["full run requested"] }
    : plan(lines(files), { baseFile: base ? gitFile(base) : undefined });
  if (since && sinceBase && !args.includes("--all")) result = sincePlan(result, plan(lines(since), { baseFile: gitFile(sinceBase) }), sinceBase);
  console.log(JSON.stringify(result, null, 2));
  if (process.env.GITHUB_OUTPUT) {
    // An empty `specs` with all=false means no browser tests are needed.
    const specs = result.all ? E2E : result.specs.join(" ");
    appendFileSync(process.env.GITHUB_OUTPUT, `all=${result.all}\nkits=${result.kits.join(",")}\nspecs=${specs}\n`);
  }
}
