#!/usr/bin/env node
// @ts-check
/**
 * Compares two build folders byte for byte, for refactors that must not change any site's output.
 *
 *   node tools/compare-builds.js <before-dist> <after-dist>
 *
 * The only bytes allowed to differ are the PDF menus' creation date and file ID, which pdfkit stamps with
 * the time of the build; those two fields are masked before comparing. Exits 1 on any other difference.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const [a, b] = process.argv.slice(2);
if (!a || !b) { console.error("usage: node tools/compare-builds.js <before-dist> <after-dist>"); process.exit(2); }

/** @param {string} dir @returns {string[]} */
const files = (dir) => readdirSync(dir, { recursive: true }).map(String).filter((f) => statSync(path.join(dir, f)).isFile()).sort();
/** @param {string} f @param {Buffer} buf */
const norm = (f, buf) => (f.endsWith(".pdf")
  ? Buffer.from(buf.toString("latin1").replace(/\(D:\d{14}Z\)/g, "(D:)").replace(/\/ID \[<[0-9a-f]+> <[0-9a-f]+>\]/gi, "/ID []"), "latin1")
  : buf);

const fa = files(a), fb = files(b);
const sa = new Set(fa), sb = new Set(fb);
const onlyA = fa.filter((f) => !sb.has(f)), onlyB = fb.filter((f) => !sa.has(f));
const differ = fa.filter((f) => sb.has(f) && !norm(f, readFileSync(path.join(a, f))).equals(norm(f, readFileSync(path.join(b, f)))));
for (const f of onlyA) console.log(`only in before: ${f}`);
for (const f of onlyB) console.log(`only in after:  ${f}`);
for (const f of differ) console.log(`differs:        ${f}`);
console.log(`${fa.length} files before, ${fb.length} after; ${onlyA.length + onlyB.length + differ.length} differences`);
process.exit(onlyA.length + onlyB.length + differ.length ? 1 : 0);
