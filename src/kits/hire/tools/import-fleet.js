#!/usr/bin/env node
// @ts-check
/**
 * Imports a hire client's fleet from their Google Sheet (one row per car) into site.json's `fleet.cars`, then checks the
 * whole site. It fails, and leaves site.json untouched, if a column is misspelt, a cell isn't readable, a photo is
 * missing or any car leaves out one of the client's rules (deposit, driver, insurance, mileage, fuel, late return…).
 *
 *   node src/kits/hire/tools/import-fleet.js --site demos/car-hire                 (reads sites/demos/car-hire/fleet.csv)
 *   node src/kits/hire/tools/import-fleet.js --site clients/<slug> --url "https://docs.google.com/…output=csv"
 *   node src/kits/hire/tools/import-fleet.js --site clients/<slug> --csv ~/Downloads/fleet.csv --check   (no write)
 *
 * The Sheet's columns are listed in src/kits/hire/lib/import.js (COLUMNS) and docs/CONFIG.md. Lists inside a cell
 * (gallery photos, colours, first-ten notes) are separated by "|". Prices in pounds, power in bhp, 0–62 in seconds.
 */
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { carsFromCsv } from "../lib/import.js";
import { validateSite } from "../../../core/lib/config.js";
import { loadCatalog } from "../../../../scripts/lib/catalog.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

/**
 * Pixel size of a WebP, JPEG or PNG from its header (no image library needed).
 * @param {Buffer} b @returns {{ width: number, height: number } | null}
 */
export function imageSize(b) {
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const kind = b.toString("ascii", 12, 16);
    if (kind === "VP8X") return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
    if (kind === "VP8 ") return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    if (kind === "VP8L") { const n = b.readUInt32LE(21); return { width: (n & 0x3fff) + 1, height: ((n >> 14) & 0x3fff) + 1 }; }
    return null;
  }
  if (b[0] === 0x89 && b.toString("ascii", 1, 4) === "PNG") return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) return null;
      const marker = b[i + 1];
      const len = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) };
      i += 2 + len;
    }
  }
  return null;
}

async function main() {
  const { values } = parseArgs({ options: { site: { type: "string" }, csv: { type: "string" }, url: { type: "string" }, check: { type: "boolean" } } });
  if (!values.site) throw new Error("Use --site <folder under sites/>, e.g. --site demos/car-hire");
  const siteDir = path.join(ROOT, "sites", values.site);
  const file = path.join(siteDir, "site.json");
  if (!existsSync(file)) throw new Error(`No site.json in sites/${values.site}`);
  const site = JSON.parse(readFileSync(file, "utf8"));
  if (site.kit !== "hire") throw new Error(`sites/${values.site} isn't a car hire site (kit "${site.kit}")`);

  let csv;
  if (values.url) {
    if (!/^https:\/\/docs\.google\.com\/spreadsheets\/.+output=csv/.test(values.url)) throw new Error("--url must be the Sheet's published CSV link (File → Share → Publish to web → CSV)");
    const res = await fetch(values.url);
    if (!res.ok) throw new Error(`Couldn't read the Sheet (HTTP ${res.status})`);
    csv = await res.text();
  } else {
    const src = values.csv ? path.resolve(values.csv) : path.join(siteDir, "fleet.csv");
    if (!existsSync(src)) throw new Error(`No fleet CSV at ${path.relative(ROOT, src)}; use --csv or --url`);
    csv = readFileSync(src, "utf8");
  }

  const sizeOf = (/** @type {string} */ rel) => {
    const p = path.join(siteDir, rel);
    return existsSync(p) ? imageSize(readFileSync(p)) : null;
  };
  const { cars, errors } = carsFromCsv(csv, sizeOf);
  if (errors.length) throw new Error(`The fleet Sheet has ${errors.length} problem(s):\n  - ${errors.join("\n  - ")}`);

  const next = { ...site, fleet: { ...site.fleet, cars, imported: new Date().toISOString().slice(0, 10) } };
  const problems = validateSite(next, {
    catalog: loadCatalog(ROOT),
    fileExists: (rel) => existsSync(path.join(siteDir, rel)),
    fileSize: (rel) => (existsSync(path.join(siteDir, rel)) ? statSync(path.join(siteDir, rel)).size : null),
    fileText: (rel) => readFileSync(path.join(siteDir, rel), "utf8"),
  });
  if (problems.length) throw new Error(`Imported ${cars.length} cars, but the site isn't valid with them (site.json not changed):\n  - ${problems.join("\n  - ")}`);
  if (!values.check) writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`✓ ${cars.length} cars from the Sheet${values.check ? " are valid (not written: --check)" : ` → sites/${values.site}/site.json`}`);
}

if (process.argv[1] && import.meta.url === new URL(`file://${path.resolve(process.argv[1])}`).href) {
  main().catch((e) => { console.error(`✗ ${e.message}`); process.exit(1); });
}
