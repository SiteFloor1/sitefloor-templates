import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { family, fontProblems, staleDocs, generate } from "../../scripts/docs-index.js";

/** A copy of the docs sources in a temporary folder, to change without touching the repo. */
function copy() {
  const root = mkdtempSync(path.join(tmpdir(), "sf-docs-"));
  for (const d of ["docs", "case-studies"]) cpSync(d, path.join(root, d), { recursive: true });
  return root;
}

test("the committed docs indexes are what the generator makes", () => {
  assert.deepEqual(staleDocs(process.cwd()), []);
});

test("other cuts of a family count as the same family; Display and Text families stay separate", () => {
  assert.equal(family("Castoro Titling"), family("Castoro"));
  assert.equal(family("Playfair Display SC"), family("Playfair Display"));
  assert.notEqual(family("Red Hat Display"), family("Red Hat Text"));
});

test("two trades claiming the same family fail, and so does a hand edit to a generated index", () => {
  const root = copy();
  assert.deepEqual(fontProblems(root), []);
  mkdirSync(path.join(root, "docs/trades/topiary"), { recursive: true });
  writeFileSync(path.join(root, "docs/trades/topiary/trade.json"), '{"name":"Topiarists","kit":null}\n');
  writeFileSync(path.join(root, "docs/trades/topiary/fonts.md"), "# Topiarists: fonts\n\n| Look or design | Status | Branch | Display | Body |\n|---|---|---|---|---|\n| Hedge | approved | trade/topiary | Castoro Titling | Sora |\n");
  const problems = fontProblems(root);
  assert.ok(problems.some((p) => p.includes('"Castoro Titling"') && p.includes("trade construction")), problems.join("\n"));
  assert.ok(problems.some((p) => p.includes('"Sora"') && p.includes("trade detailing")), problems.join("\n"));

  // A new trade's files appear in the indexes once generated; until then they are stale.
  assert.ok(staleDocs(root).includes("docs/trades/README.md"));
  assert.match(generate(root).get("docs/CLAIMED-FONTS.md") ?? "", /\| Hedge \| trade\/topiary \| Castoro Titling \| Sora \|/);
});

test("a case study may use its own demo's fonts and a named exception; any other shared font fails", () => {
  const root = copy();
  assert.deepEqual(fontProblems(root), []); // Ottoline (own demo) and the named exceptions pass
  const add = (slug, trade, display, body) => {
    mkdirSync(path.join(root, `case-studies/${slug}`), { recursive: true });
    writeFileSync(path.join(root, `case-studies/${slug}/fonts.md`), `| Case study | Source | Trade | Display | Body | Other |\n|---|---|---|---|---|---|\n| X | case-studies/${slug} | ${trade} | ${display} | ${body} | |\n`);
  };
  add("own-demo", "law", "Marcellus", "Source Sans 3"); // the law trade's Portland look
  assert.deepEqual(fontProblems(root), []);
  add("borrowed", "law", "Gloock", "Newsreader"); // the café's Counter look, and Verrall's case study
  const problems = fontProblems(root);
  assert.ok(problems.some((p) => p.includes('"Gloock"') && p.includes("trade cafe")), problems.join("\n"));
  // Between two case studies, the one later by folder name is the one reported.
  assert.ok(problems.some((p) => p.includes('"Newsreader"') && /case study (verrall|borrowed)/.test(p) && /case-studies\/(borrowed|verrall)\/fonts\.md/.test(p)), problems.join("\n"));
});

test("a named exception covers only that case study and that family", () => {
  const root = copy();
  writeFileSync(path.join(root, "case-studies/marese/fonts.md"), "| Case study | Source | Trade | Display | Body | Other |\n|---|---|---|---|---|---|\n| Marese | case-studies/marese | lingerie | Gilda Display | Red Hat Text | |\n");
  const problems = fontProblems(root);
  assert.equal(problems.length, 1, problems.join("\n")); // Red Hat Text is excepted for Marese; Gilda Display is not
  assert.match(problems[0], /"Gilda Display".*trade bridal/);
});
