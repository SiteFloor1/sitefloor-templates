// @ts-check
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildPages, indexablePages, ROBOTS } from "../../scripts/pages.js";
import { hosting, demoUrl, demoLinkProblems, rewriteDemoLinks } from "../../scripts/demo-links.js";

test("the published demo site: noindex on every page, robots.txt blocks crawling, no Cloudflare files", async () => {
  const out = mkdtempSync(path.join(tmpdir(), "sf-pages-"));
  const r = await buildPages({ out, only: ["cafe", "wealth"] });
  assert.deepEqual(r.demos, ["cafe", "wealth"]);
  assert.equal(readFileSync(path.join(out, "robots.txt"), "utf8"), ROBOTS);
  assert.match(ROBOTS, /^User-agent: \*\nDisallow: \/\n$/);
  for (const d of r.demos) {
    assert.match(readFileSync(path.join(out, d, "robots.txt"), "utf8"), /Disallow: \//);
    assert.ok(!existsSync(path.join(out, d, "_headers")));
    assert.ok(readdirSync(path.join(out, d)).some((f) => f.endsWith(".html")));
  }
  assert.deepEqual(await indexablePages(out), []);
  // A page without the tag is caught, so the build can't publish it.
  writeFileSync(path.join(out, "cafe", "stray.html"), "<!doctype html><title>x</title>");
  assert.deepEqual(await indexablePages(out), [path.join("cafe", "stray.html")]);
});

test("demo links come from one setting, and moving it is one command that rules enforces", () => {
  assert.equal(demoUrl("cafe"), `${hosting().base}/cafe/`);
  assert.deepEqual(demoLinkProblems(), []);
  const root = mkdtempSync(path.join(tmpdir(), "sf-links-"));
  const old = "https://sitefloor1.github.io/sitefloor-templates", now = "https://demos.example";
  const write = (/** @type {string} */ rel, /** @type {string} */ text) => { const p = path.join(root, rel); mkdirSync(path.dirname(p), { recursive: true }); writeFileSync(p, text); };
  write("demo-hosting.json", JSON.stringify({ base: now, previous: [old] }));
  write("case-studies/x/index.html", `<a href="${old}/cafe/">Morrow</a> <a href="https://claude.ai/artifact/other">case</a>`);
  write("docs/a.md", `Demo: ${old}/cafe/`);
  assert.equal(demoLinkProblems(root).length, 2);
  assert.deepEqual(rewriteDemoLinks(root).sort(), [path.join("case-studies", "x", "index.html"), path.join("docs", "a.md")]);
  assert.deepEqual(demoLinkProblems(root), []);
  assert.equal(readFileSync(path.join(root, "docs/a.md"), "utf8"), `Demo: ${now}/cafe/`);
  assert.match(readFileSync(path.join(root, "case-studies/x/index.html"), "utf8"), /claude\.ai\/artifact\/other/);
});

test("no demo is still linked as a claude.ai artifact in case studies or docs", () => {
  // The 28 demos as they were published before GitHub Pages (claude.ai artifacts).
  const ids = /https:\/\/claude\.ai\/artifact\/(GTogmprMRnzb6F6fWActow|GtxCKFj5dom8wRjo81WqF1|VuUkftwgffnh7B5m7BThdP|6fSaqCLa8WbErfEjhGMwhY|UsuRk74pyM7cCjpRp8uRs8|QjWw2Ako8ePR3Fw7Na4z9V|XpcdBjCkvT8odETKjQayFY|R1nSCMpoKargZwJphvGoCY|5pAWxZ8gjSmVU8ws3EXSJb|VNHc8UZrMqqFNcX2gjYrYS|AbZCTHyJGS2JW3LgRgKtRh|BXpdaHsb9EwWCd7kho96DF|JN8honZCcWaKkGjChPySSG|BieXTaWEqq2Koj9p6J7b7Z|CXfMWwEjB2nzcew7kd6vXp|Js8b5tmvjG7X1MymbaFcnT|QMzhvrUqBUVdV3YpVqE1kL|PX7JHUXczJjqsuWnRGxQBP|GXyXTKTbH26eeBqNSoW758|Q57GaMM1UAr6AKkDmSGvUo|SUwNHXX7u4CFr7xrpqi4Bv|6aER6f7X5GECRf1LrLpqGC|LhksJVeyG8aEbnr4SHnyjW|V4zUgDK79z3VdVXZGpmTGF|NwX54TQkEmdEqMva9hYFoH|HYwCeY518NeouSpqyD6cJv|7hLCR77pPQLJtQPYDVWvpJ|KUMpJgtqzSBM4DwXvS2UFD)/;
  const walk = (/** @type {string} */ d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  const left = [...walk("case-studies"), ...walk("docs")].filter((f) => /\.(md|html)$/.test(f) && ids.test(readFileSync(f, "utf8")));
  assert.deepEqual(left, []);
});
