// @ts-check
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { idsIn, treeIds, branchIds, featureIdProblems } from "../../scripts/lib/feature-ids.js";
import { FEATURES, KITS } from "../../src/features/registry.js";

test("the source reader finds exactly the registry's ids, shared and per kit", () => {
  const t = treeIds(process.cwd());
  assert.deepEqual([...t.shared], FEATURES.filter((f) => f.dir.startsWith("src/features")).map((f) => f.id));
  for (const k of KITS) assert.deepEqual(t.kits.get(k.id), k.features.filter((f) => typeof f !== "string").map((f) => /** @type {any} */ (f).id), k.id);
  assert.deepEqual(idsIn('{ id: f.id, name: x }, { id: "a-b", section: "s", dir: `${D}/a-b` }'), ["a-b"]);
});

test("a kit feature id that another kit, a shared feature or another open branch has fails, naming the other kit", () => {
  const root = mkdtempSync(path.join(tmpdir(), "sf-ids-"));
  cpSync("src/features/registry.js", path.join(root, "src/features/registry.js"));
  const kit = (/** @type {string} */ k, /** @type {string[]} */ ids) => {
    mkdirSync(path.join(root, `src/kits/${k}`), { recursive: true });
    writeFileSync(path.join(root, `src/kits/${k}/kit.js`), `const D = "src/kits/${k}/features";\nexport const features = [\n${ids.map((id) => `  { id: "${id}", dir: \`\${D}/${id}\`, kits: ["${k}"] },`).join("\n")}\n];\n`);
  };
  const git = (/** @type {string[]} */ ...a) => execFileSync("git", ["-C", root, "-c", "user.name=t", "-c", "user.email=t@t.example", ...a], { encoding: "utf8" });
  kit("alpha", ["alpha-menu"]);
  git("init", "-q", "-b", "work"); git("add", "-A"); git("commit", "-qm", "base");
  assert.deepEqual(featureIdProblems(root, branchIds(root, "work")), []);

  // Another builder's open branch adds a beta kit with "services".
  kit("beta", ["services"]); git("add", "-A"); git("commit", "-qm", "beta");
  git("update-ref", "refs/remotes/origin/trade/beta", "HEAD"); git("reset", "-q", "--hard", "HEAD~1");
  assert.deepEqual(featureIdProblems(root, branchIds(root, "work")), []);

  // This branch's alpha kit picks the same id, and a shared one.
  kit("alpha", ["alpha-menu", "services", "gallery"]);
  const problems = featureIdProblems(root, branchIds(root, "work"));
  assert.ok(problems.some((p) => p.startsWith('src/kits/alpha/kit.js: feature "services" is also a feature of the beta kit on origin/trade/beta') && p.includes('"alpha-services"')), problems.join("\n"));
  assert.ok(problems.some((p) => p.startsWith('src/kits/alpha/kit.js: feature "gallery" has the id of a shared feature')), problems.join("\n"));
  assert.equal(problems.length, 2, problems.join("\n"));

  // Two kits in one tree.
  kit("beta", ["alpha-menu"]);
  assert.ok(featureIdProblems(root, []).some((p) => p.includes('"alpha-menu" is also a feature of the alpha kit')));
  // Checked on main, open branches never fail it.
  assert.deepEqual(branchIds(root, "main"), []);
});
