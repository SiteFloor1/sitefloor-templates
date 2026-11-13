import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkCustomPages, paragraphs } from "../../src/core/lib/custom-pages.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const catalog = loadCatalog(new URL("../..", import.meta.url).pathname);
const page = (slug) => ({ slug, title: "About us", description: "Who we are.", blocks: [{ type: "text", body: "Hello." }] });

test("general pages: slugs, text, photos and blocks are checked", () => {
  const e = [];
  checkCustomPages([
    { slug: "About Us", title: "", description: "x".repeat(200), blocks: [] },
    { slug: "privacy", title: "P", description: "P", blocks: [{ type: "video" }] },
    { slug: "about", title: "A", description: "A", blocks: [{ type: "photo", src: "img/missing.webp", alt: "" }, { type: "list", items: [] }, { type: "book" }] },
    { slug: "about", title: "B", description: "B", blocks: [{ type: "text", body: "Hi" }] },
  ], (p, m) => e.push(`${p}: ${m}`), (rel) => rel !== "img/missing.webp");
  for (const f of ["pages[0].slug", "pages[0].title", "pages[0].description", "pages[0].blocks", "pages[1].slug", "pages[1].blocks[0].type", "pages[2].blocks[0].src", "pages[2].blocks[0].alt", "pages[2].blocks[1].items", "pages[2].blocks[2].text", "pages[3].slug"]) {
    assert.ok(e.some((x) => x.startsWith(f)), f);
  }
  assert.deepEqual(paragraphs("One.\n\nTwo.\n \nThree."), ["One.", "Two.", "Three."]);
});

test("each general page counts towards the plan: Plus can now reach five pages, and no more", () => {
  const client = JSON.parse(readFileSync(new URL("../fixtures/sites/test-barber-client/site.json", import.meta.url), "utf8"));
  const plus = { ...client, plan: "plus", addons: [], features: ["price-list", "visit", "questions", "plan-visit", "gallery", "work", "team", "price-page", "custom-pages"] };
  const pageErrors = (s) => validateSite(s, { catalog }).filter((x) => x.includes("pages, but the plus plan includes 5"));
  assert.deepEqual(pageErrors({ ...plus, pages: [page("about")] }), []); // home + work + team + prices + about = 5
  assert.equal(pageErrors({ ...plus, pages: [page("about"), page("vouchers")] }).length, 1); // 6
  // General pages are sold one at a time: on Starter, each needs an extra page bought in addonPages.
  const starter = { ...plus, plan: "starter", features: ["price-list", "visit", "questions", "plan-visit", "custom-pages"], addons: ["custom-pages"], pages: [page("about"), page("vouchers")] };
  assert.match(validateSite(starter, { catalog }).join(), /3 pages, but the starter plan includes 1/);
  assert.deepEqual(validateSite({ ...starter, addonPages: 2 }, { catalog }).filter((x) => x.includes("pages, but")), []);
  assert.match(validateSite({ ...plus, pages: [page("about"), page("b")], addonPages: 1 }, { catalog }).join(), /^(?!.*pages, but)/s);
});

test("menu links must point at a page the site builds; headlines fit the look on a phone", () => {
  const client = JSON.parse(readFileSync(new URL("../fixtures/sites/test-barber-client/site.json", import.meta.url), "utf8"));
  const errs = (s) => validateSite(s, { catalog }).join("\n");
  assert.match(errs({ ...client, nav: [...client.nav, { label: "About", page: "about-us" }] }), /"about-us" isn't a page on this site/);
  assert.doesNotMatch(errs(client), /isn't a page/);
  assert.match(errs({ ...client, hero: { ...client.hero, title: "Northgate *test.*" } }), /hero\.title: the line "Northgate test\." is 15 characters/);
});
