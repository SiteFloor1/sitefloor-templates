import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildIncludes, lookOverrides } from "../../scripts/lib/look-layout.js";
import { SITEFLOOR_CREDIT } from "../../scripts/lib/verify.js";

/** A tiny repo: shared partials and two features, and a look that replaces some of them. */
async function fixture(files) {
  const root = await mkdtemp(path.join(tmpdir(), "look-layout-"));
  const all = {
    "src/core/partials/header.njk": "shared header", "src/core/partials/footer.njk": "shared footer",
    "src/core/partials/mobile-bar.njk": "shared bar", "src/core/partials/section-head.njk": "shared head",
    "src/features/gallery/gallery.njk": "shared gallery", "src/kits/k/features/menu/menu.njk": "shared menu",
    "src/kits/k/features/menu/menu-home.njk": "shared menu home", "src/looks/plain/hero.njk": "hero",
    ...files,
  };
  for (const [f, text] of Object.entries(all)) { await mkdir(path.dirname(path.join(root, f)), { recursive: true }); await writeFile(path.join(root, f), text); }
  return root;
}
const FEATURES = [{ id: "gallery", dir: "src/features/gallery" }, { id: "menu", dir: "src/kits/k/features/menu" }];
const read = (root, f) => readFile(path.join(root, "out", f), "utf8");

test("a look that supplies nothing gets every shared template unchanged", async () => {
  const root = await fixture({});
  const replaced = await buildIncludes({ root, out: path.join(root, "out"), look: "plain", features: FEATURES });
  assert.deepEqual(replaced, []);
  for (const [f, t] of [["core/partials/header.njk", "shared header"], ["features/gallery/gallery.njk", "shared gallery"], ["kits/k/features/menu/menu-home.njk", "shared menu home"], ["looks/plain/hero.njk", "hero"]]) assert.equal(await read(root, f), t);
  await rm(root, { recursive: true });
});

test("a look's header, footer, phone bar, section heads and feature markup replace the shared ones; the rest fall back", async () => {
  const root = await fixture({
    "src/looks/plain/header.njk": "my header", "src/looks/plain/footer.njk": "my footer", "src/looks/plain/mobile-bar.njk": "my bar",
    "src/looks/plain/section-head.njk": "my head", "src/looks/plain/features/gallery.njk": "my gallery",
    "src/looks/plain/features/menu/menu-home.njk": "my menu home",
  });
  const replaced = await buildIncludes({ root, out: path.join(root, "out"), look: "plain", features: FEATURES });
  assert.deepEqual(replaced, ["core/partials/footer.njk", "core/partials/header.njk", "core/partials/mobile-bar.njk", "core/partials/section-head.njk", "features/gallery/gallery.njk", "kits/k/features/menu/menu-home.njk"]);
  assert.equal(await read(root, "core/partials/header.njk"), "my header");
  assert.equal(await read(root, "core/partials/section-head.njk"), "my head");
  assert.equal(await read(root, "features/gallery/gallery.njk"), "my gallery");
  assert.equal(await read(root, "kits/k/features/menu/menu-home.njk"), "my menu home");
  assert.equal(await read(root, "kits/k/features/menu/menu.njk"), "shared menu", "files the look doesn't supply fall back");
  await rm(root, { recursive: true });
});

test("a look can't replace a feature that doesn't exist or a template a feature doesn't have", async () => {
  const a = await fixture({ "src/looks/plain/features/nope.njk": "x" });
  await assert.rejects(lookOverrides(a, "plain", FEATURES), /there is no feature "nope"/);
  const b = await fixture({ "src/looks/plain/features/menu/extra.njk": "x" });
  await assert.rejects(lookOverrides(b, "plain", FEATURES), /has no extra\.njk to replace/);
  await rm(a, { recursive: true }); await rm(b, { recursive: true });
});

test("a misspelt look template is refused, not silently ignored", async () => {
  for (const name of ["heder.njk", "Footer.njk"]) {
    const root = await fixture({ [`src/looks/plain/${name}`]: "x" });
    await assert.rejects(lookOverrides(root, "plain", FEATURES), new RegExp(`${name.replace(".", "\\.")}: not a template a look can supply`));
    await rm(root, { recursive: true });
  }
});

test("every page must carry the Sitefloor credit, however the look draws its footer", () => {
  assert.ok(SITEFLOOR_CREDIT.test('<a class="by" href="https://sitefloor.com" rel="noopener">Website by <b>Sitefloor</b></a>'));
  assert.ok(SITEFLOOR_CREDIT.test('<p><a href="https://sitefloor.com">Website by Sitefloor</a></p>'));
  assert.ok(!SITEFLOOR_CREDIT.test('<p>Website by Sitefloor</p>'));
  assert.ok(!SITEFLOOR_CREDIT.test('<a href="https://example.com">Website by Sitefloor</a>'));
});
