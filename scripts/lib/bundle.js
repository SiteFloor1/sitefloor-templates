// @ts-check
/**
 * Bundles one site's CSS and JS with esbuild, including only the features
 * that site uses. Demo-only code is added only for mode "demo".
 */
import { writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import * as esbuild from "esbuild";
import { KITS, featuresFor } from "../../src/features/registry.js";
import { brandCss } from "../../src/core/lib/brand.js";

/**
 * @param {any} site
 * @param {{ root: string, work: string, outDir: string, catalog?: import("./catalog.js").Catalog }} o
 * @returns {Promise<Record<string, string>>} entry name ("site.css" / "site.js") → hashed path relative to outDir
 */
export async function bundleAssets(site, o) {
  const enabled = new Set(site.features);
  const features = featuresFor(site.kit).filter((f) => enabled.has(f.id));
  const src = (/** @type {string} */ rel) => path.join(o.root, "src", rel);
  const lookDir = src(`looks/${site.look}`);

  const lookBrand = o.catalog?.looks[site.look]?.brand;
  // Type options: a client site gets the one it chose; the demo gets them all so visitors can try them.
  const types = Object.entries(lookBrand?.types ?? {})
    .filter(([id, t]) => t.css && (site.mode === "demo" || id === (site.brand?.type ?? "classic")))
    .map(([, t]) => path.join(lookDir, /** @type {string} */ (t.css)));
  const brand = brandCss(site, lookBrand);
  if (brand) await writeFile(path.join(o.work, "brand.css"), brand);
  const kitCss = src(`kits/${site.kit}/kit.css`); // visuals every feature of a trade shares
  const css = [
    src("core/css/core.css"),
    ...(existsSync(kitCss) ? [kitCss] : []),
    ...features.map((f) => path.join(o.root, f.dir, `${f.id}.css`)).filter((p) => existsSync(p)),
    path.join(lookDir, "fonts.css"),
    path.join(lookDir, "look.css"), // after features, so the look can refine feature defaults
    ...types,
    ...(brand ? [path.join(o.work, "brand.css")] : []), // the client's own accent, last
    ...(site.mode === "demo" ? [src("demo/demo.css")] : []),
  ];
  await writeFile(path.join(o.work, "site.css"), css.map((f) => `@import ${JSON.stringify(f)};`).join("\n"));

  /** Import specifier from the work folder to a source file. @param {string} file */
  const spec = (file) => JSON.stringify(path.relative(o.work, file).split(path.sep).join("/"));
  const jsFeatures = features.filter((f) => f.js);
  const providers = providerLines(site, enabled, o.root, spec);
  const entry = [
    `import { boot } from ${spec(src("core/js/core.js"))};`,
    ...jsFeatures.map((f, i) => `import { init as f${i} } from ${spec(path.join(o.root, f.dir, `${f.id}.js`))};`),
    ...providers.lines,
    site.mode === "demo" ? `import { initDemo } from ${spec(src("demo/demo.js"))};` : "const initDemo = null;",
    `boot({ features: { ${jsFeatures.map((f, i) => `${JSON.stringify(f.id)}: f${i}`).join(", ")} }, providers: { ${providers.boot} }, demo: initDemo });`,
  ].join("\n");
  await writeFile(path.join(o.work, "site.js"), entry);

  const result = await esbuild.build({
    entryPoints: [path.join(o.work, "site.css"), path.join(o.work, "site.js")],
    bundle: true, minify: true, format: "esm", target: "es2020", sourcemap: false, legalComments: "none",
    // splitting: a feature can load a heavy part only when a visitor asks for it (a 3D model, say).
    splitting: true, chunkNames: "chunks/[name]-[hash]",
    external: ["../img/*"], // CSS pictures that live in the site's img/ folder (samples a kit's CSS points at)
    outdir: path.join(o.outDir, "assets"), entryNames: "[name]-[hash]", assetNames: "fonts/[name]-[hash]",
    loader: { ".woff2": "file", ".woff": "file" }, metafile: true, logLevel: "silent", absWorkingDir: o.root,
  });
  /** @type {Record<string, string>} */
  const assets = {};
  for (const [out, meta] of Object.entries(result.metafile.outputs)) {
    if (meta.entryPoint) assets[path.basename(meta.entryPoint)] = path.relative(o.outDir, path.join(o.root, out)).split(path.sep).join("/");
  }
  if (!assets["site.css"] || !assets["site.js"]) throw new Error("esbuild did not produce site.css and site.js");
  return assets;
}

/**
 * Live data a shared feature reads. Kits declare their own in src/kits/<kit>/kit.js (`providers`).
 * @type {import("../../src/features/registry.js").Provider[]}
 */
const SHARED_PROVIDERS = [
  {
    key: "queue",
    on: (_site, enabled) => enabled.has("walk-in-queue"),
    simulated: (site) => site.queue?.source === "simulated",
    demo: { from: "src/demo/queue-provider.js", name: "simulatedQueue" },
    live: { from: "src/features/walk-in-queue/sheet-provider.js", name: "sheetQueue" },
  },
];

/**
 * Where each provider goes in the generated entry file. These are the providers that existed when kits started
 * registering themselves, kept in the order the entry file had then so every site's bundle stayed byte for byte the
 * same. Any provider added since goes after them, sorted by key. Never edit these two lists: a new provider needs
 * nothing here.
 */
const FIRST_IMPORTS = ["chairBoard", "queue", "bay", "tracker", "tonight", "bakes", "places", "passport", "vote", "fleet", "slot", "matter"];
const FIRST_KEYS = ["chairBoard", "queue", "bay", "tracker", "tonight", "bakes", "vote", "fleet", "slot", "matter", "places", "passport"];

/** @param {string[]} first @returns {(a: { key: string }, b: { key: string }) => number} */
const byOrder = (first) => (a, b) => {
  const ia = first.indexOf(a.key), ib = first.indexOf(b.key);
  if (ia >= 0 || ib >= 0) return (ia < 0 ? Infinity : ia) - (ib < 0 ? Infinity : ib);
  return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
};

/**
 * Live-data providers as import lines: simulated on demos, the client's Google Sheet otherwise, null when off.
 * The first providers (FIRST_KEYS) are listed for every site, null when off, so those sites' bundles stay as they
 * were; any provider added since is listed only on sites that use it, so a new kit's providers add no bytes to
 * every other site. A feature reads an unlisted provider as undefined, which it treats the same as null.
 * @param {any} site @param {Set<string>} enabled @param {string} root @param {(file: string) => string} spec
 * @returns {{ lines: string[], boot: string }}
 */
function providerLines(site, enabled, root, spec) {
  const all = [...SHARED_PROVIDERS, ...KITS.flatMap((k) => k.providers ?? [])];
  const keys = new Set();
  for (const p of all) { if (keys.has(p.key)) throw new Error(`two live-data providers are called "${p.key}"`); keys.add(p.key); }
  const name = (/** @type {import("../../src/features/registry.js").Provider} */ p) => p.local ?? `${p.key}Provider`;
  const listed = all.filter((p) => FIRST_KEYS.includes(p.key) || p.on(site, enabled));
  const lines = [...listed].sort(byOrder(FIRST_IMPORTS)).map((p) => {
    if (!p.on(site, enabled)) return `const ${name(p)} = null;`;
    const m = p.simulated(site) ? p.demo : p.live;
    return `import { ${m.name} as ${name(p)} } from ${spec(path.join(root, m.from))};`;
  });
  const boot = [...listed].sort(byOrder(FIRST_KEYS)).map((p) => `${p.key}: ${name(p)}`).join(", ");
  return { lines, boot };
}
