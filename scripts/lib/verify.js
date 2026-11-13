// @ts-check
/**
 * Checks a built site before it can ship: no template accidents, no missing
 * images, and no demo-only content on client sites.
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

/** Strings that only ever belong on demo sites. */
export const DEMO_MARKERS = ["data-demo-ribbon", "data-wa-preview", "data-tier-gate", "Fictional business", "447700900", "7700 900"];
/** The credit every page carries: a link to sitefloor.com reading "Website by Sitefloor". */
export const SITEFLOOR_CREDIT = /<a\b[^>]*href="https:\/\/sitefloor\.com\/?"[^>]*>\s*Website by\s*(?:<[^>]+>\s*)*Sitefloor/;
const TEMPLATE_ACCIDENTS = /REPLACE_ME|\bundefined\b|\bNaN\b|\[object Object\]/;

/**
 * Blank headings or title parts mean copy is missing from site.json.
 * @param {string} html @returns {string[]}
 */
export function emptyText(html) {
  const text = (/** @type {string} */ s) => s.replace(/<[^>]*>/g, "").replace(/&nbsp;|\s/g, "");
  /** @type {string[]} */
  const out = [];
  const title = /<title>([\s\S]*?)<\/title>/.exec(html)?.[1] ?? "";
  if (title.split("·").some((part) => !part.trim())) out.push(`has an empty part in its <title> ("${title.trim()}")`);
  for (const [, tag, inner] of html.matchAll(/<(h1|h2)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
    if (!text(inner)) out.push(`has an empty <${tag}>`);
  }
  return out;
}

/**
 * @param {any} site @param {string} outDir @param {string[]} pages page names without .html
 * @returns {Promise<string[]>} problems found
 */
export async function verifyOutput(site, outDir, pages) {
  /** @type {string[]} */
  const problems = [];
  for (const page of pages) {
    const html = await readFile(path.join(outDir, `${page}.html`), "utf8");
    const visible = html.replace(/<script type="application\/json"[\s\S]*?<\/script>/g, "");
    if (TEMPLATE_ACCIDENTS.test(visible)) problems.push(`${page}.html contains "undefined", "NaN", "[object Object]" or a placeholder`);
    problems.push(...emptyText(visible).map((m) => `${page}.html ${m}`));
    // The one visible thing every site keeps, whatever its look (CLAUDE.md rule 4).
    if (!SITEFLOOR_CREDIT.test(html)) problems.push(`${page}.html has no "Website by Sitefloor" credit linking to https://sitefloor.com`);
    if (site.mode === "client") for (const m of DEMO_MARKERS) if (html.includes(m)) problems.push(`${page}.html contains demo-only content: ${m}`);
    for (const [, src] of html.matchAll(/(?:src|srcset|href)="([^"#?]+\.(?:webp|jpe?g|png|svg|css|js|woff2?|mp4))"/g)) {
      if (/^(https?:|data:)/.test(src)) continue;
      if (!existsSync(path.join(outDir, src.replace(/^\//, "")))) problems.push(`${page}.html references missing file ${src}`);
    }
  }
  return problems;
}
