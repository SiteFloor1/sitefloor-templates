#!/usr/bin/env node
// @ts-check
/**
 * Prints suggested seasonal modes for a year, as JSON to copy into a site's "seasons".
 *   npm run seasons -- --year 2027
 */
import { parseArgs } from "node:util";
import { suggestSeasons } from "../src/core/lib/seasons.js";

const { values } = parseArgs({ options: { year: { type: "string" } } });
const year = Number(values.year ?? new Date().getFullYear());
if (!Number.isInteger(year) || year < 2026 || year > 2100) throw new Error("--year: a year from 2026, e.g. --year 2027");
const list = suggestSeasons(year);
console.log(JSON.stringify(list.map((s) => ({ name: s.name, from: s.from, to: s.to, tint: s.tint, banner: s.banner })), null, 2));
const approx = list.filter((s) => s.approximate).map((s) => s.name);
if (approx.length) console.error(`\nApproximate (confirm with the client, can move by a day): ${approx.join(", ")}`);
const missing = ["Ramadan", "Eid al-Fitr", "Eid al-Adha", "Diwali", "Lunar New Year"].filter((n) => !list.some((s) => s.name === n));
if (missing.length) console.error(`No dates on file for ${year}: ${missing.join(", ")}. Add them to LUNAR in src/core/lib/seasons.js.`);
