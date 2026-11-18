// @ts-check
/**
 * Country outlines for the drawn maps (build time only, never shipped to the browser): Natural Earth 1:50m admin-0
 * countries, public domain, simplified to about 2.5 km and rounded to 0.01°. Keyed by ISO 3166 alpha-3. How it was
 * made: data/README.md.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** @type {Record<string, { name: string, rings: number[][][] }>} */
export const COUNTRIES = JSON.parse(readFileSync(fileURLToPath(new URL("../data/countries.json", import.meta.url)), "utf8"));
