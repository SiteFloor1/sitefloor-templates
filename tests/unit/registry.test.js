import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { FEATURES, forKit, clientOnlyFor, featuresFor, getFeature, namespaceKits, KITS as KIT_MODULES } from "../../src/features/registry.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const { kits: KITS, looks: LOOKS } = loadCatalog(process.cwd());

test("every registered feature has its template, styles, README and (if needed) script", () => {
  for (const f of FEATURES) {
    for (const file of [`${f.id}.njk`, `${f.id}.css`, "README.md"]) assert.ok(existsSync(path.join(f.dir, file)), `${f.dir}/${file} is missing`);
    assert.equal(existsSync(path.join(f.dir, `${f.id}.js`)), f.js, `${f.id}: js flag does not match the files`);
  }
});

test("page features have a page template in every kit that offers them", () => {
  for (const f of FEATURES.filter((x) => x.page)) {
    const kits = KITS.filter((k) => forKit(f, k));
    for (const k of kits) {
      const where = [`src/kits/${k}/pages/${f.page}.njk`, `src/core/pages/${f.page}.njk`];
      assert.ok(where.some((p) => existsSync(p)), `no ${f.page}.njk for kit ${k} (kit pages or core pages)`);
    }
  }
});

test("every kit has pages, a client template and at least one complete look", () => {
  for (const k of KITS) {
    assert.ok(existsSync(`src/kits/${k}/pages/index.njk`));
    assert.ok(existsSync(`src/kits/${k}/client-template.json`));
    const looks = Object.entries(LOOKS).filter(([, meta]) => meta.kits.includes(k)).map(([id]) => id);
    assert.ok(looks.length, `kit ${k} has no look`);
    for (const look of looks) for (const file of ["look.css", "look.json", "fonts.css", "hero.njk", "favicon.svg", "README.md"]) assert.ok(existsSync(`src/looks/${look}/${file}`), `${look}/${file}`);
  }
});

test("every look describes itself: name, kits it suits, browser theme colour", () => {
  for (const [id, meta] of Object.entries(LOOKS)) {
    assert.ok(meta.name && meta.summary, `${id}: name and summary`);
    assert.ok(meta.kits.every((k) => KITS.includes(k)), `${id}: unknown kit in ${meta.kits}`);
    assert.match(meta.themeColor, /^#[0-9a-f]{6}$/i, `${id}: themeColor`);
  }
});

test("every feature id is used once: two kits can't register the same id", () => {
  const seen = new Map();
  for (const f of FEATURES) {
    assert.ok(!seen.has(f.id), `"${f.id}" is registered twice (${seen.get(f.id)} and ${f.dir})`);
    seen.set(f.id, f.dir);
  }
});

test("client-only features are one kit.js list, of features the trade offers (own or shared)", () => {
  assert.deepEqual([...clientOnlyFor("garden")].sort(), ["before-after", "through-the-year"]);
  assert.deepEqual([...clientOnlyFor("detailing")], ["inspection-light"]);
  assert.equal(clientOnlyFor("barber").size, 0);
  assert.deepEqual(FEATURES.filter((f) => "clientOnly" in f).map((f) => f.id), [], "no per-feature flag any more");
  for (const k of KIT_MODULES) for (const id of k.clientOnly ?? []) assert.ok(featuresFor(k.id).some((f) => f.id === id && forKit(f, k.id)), `${k.id}: ${id}`);
});

test("kit features are namespaced automatically; short ids resolve in the site's kit first", () => {
  for (const k of KIT_MODULES) for (const f of k.features) if (typeof f !== "string") assert.equal(f.key, `${k.id}:${f.id}`);
  assert.equal(new Set(FEATURES.map((f) => f.key)).size, FEATURES.length, "every key is unique");
  assert.equal(getFeature("gallery")?.key, "gallery");
  assert.equal(getFeature("chair-board", "barber")?.key, "barber:chair-board");
  assert.equal(getFeature("barber:chair-board")?.id, "chair-board");
  assert.equal(getFeature("chair-board", "florist"), undefined, "another kit's feature is never found through a site's kit");
  assert.equal(getFeature("gallery", "florist")?.key, "gallery");
  const f = (id, kit) => ({ id, dir: `src/kits/${kit}/features/${id}`, minPlan: "starter", kits: [kit], requires: [], js: false, summary: "" });
  const shared = [{ id: "visit", dir: "src/features/visit", minPlan: "starter", kits: ["*"], requires: [], js: false, summary: "" }];
  // Two kits may now use the same short id…
  const a = f("services", "a"), b = f("services", "b");
  namespaceKits(structuredClone(shared), [{ id: "a", features: [a] }, { id: "b", features: [b] }]);
  assert.deepEqual([a.key, b.key], ["a:services", "b:services"]);
  // …but not a shared id, a repeat within one kit, a written prefix or another kit's name in `kits`.
  assert.throws(() => namespaceKits(structuredClone(shared), [{ id: "a", features: [f("visit", "a")] }]), /id of a shared feature/);
  assert.throws(() => namespaceKits(structuredClone(shared), [{ id: "a", features: [f("x", "a"), f("x", "a")] }]), /listed twice/);
  assert.throws(() => namespaceKits(structuredClone(shared), [{ id: "a", features: [f("a:x", "a")] }]), /write the short id/);
  assert.throws(() => namespaceKits(structuredClone(shared), [{ id: "a", features: [f("x", "b")] }]), /lists only its kit/);
});
