// @ts-check
/**
 * What kits and looks exist, read from the folders themselves so adding a kit
 * or a look never means editing a shared list. Each look describes itself in
 * src/looks/<look>/look.json ({ name, kits, themeColor, summary }).
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";

/** @typedef {{ name: string, kits: string[], themeColor: string, summary: string, heroLineMax?: number, homeOrder?: string[], heroParts?: string[], onPages?: Record<string, string[]>, print?: Record<string, string>, brand?: import("../../src/core/lib/brand.js").LookBrand, week?: { ground: string, ink: string } }} LookMeta */
/** @typedef {{ kits: string[], looks: Record<string, LookMeta>, demoNames?: string[] }} Catalog */

/** @param {string} root repo root @returns {Catalog} */
export function loadCatalog(root) {
  const dirs = (/** @type {string} */ d) => readdirSync(d, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
  const kits = dirs(path.join(root, "src/kits")).filter((k) => existsSync(path.join(root, "src/kits", k, "pages")));
  /** @type {Record<string, LookMeta>} */
  const looks = {};
  for (const id of dirs(path.join(root, "src/looks"))) {
    const file = path.join(root, "src/looks", id, "look.json");
    if (existsSync(file)) looks[id] = JSON.parse(readFileSync(file, "utf8"));
  }
  // The demos' business names, so a client site can't carry one (a README example copied in, say).
  const demos = path.join(root, "sites/demos");
  const demoNames = existsSync(demos) ? dirs(demos).map((d) => path.join(demos, d, "site.json")).filter(existsSync)
    .map((f) => JSON.parse(readFileSync(f, "utf8")).business?.name).filter((n) => typeof n === "string" && n.trim()) : [];
  return { kits, looks, demoNames };
}
