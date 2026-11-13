import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { contrast, inkFor, accentProblems, checkBrand, brandCss } from "../../src/core/lib/brand.js";

const noir = JSON.parse(readFileSync(new URL("../../src/looks/barber-noir/look.json", import.meta.url), "utf8")).brand;
const run = (brand, files) => { const e = []; checkBrand({ look: "barber-noir", brand }, noir, (p, m) => e.push(`${p}: ${m}`), files); return e; };

test("contrast follows WCAG", () => {
  assert.equal(contrast("#000000", "#FFFFFF").toFixed(0), "21");
  assert.equal(contrast("#777777", "#777777"), 1);
  assert.equal(inkFor("#C9A46A", noir.accent.inks), "#140F0A");
});

test("every suggested accent and the default are readable on the look", () => {
  for (const c of [noir.accent.default, ...noir.accent.suggested.map((s) => s.hex)]) assert.deepEqual(accentProblems(c, noir), [], c);
});

test("a client's accent must be readable: too dark on Noir is refused with a hint", () => {
  assert.match(run({ accent: "#2E7D6B" }).join(), /brand\.accent: too dark .* try a lighter shade/);
  assert.match(run({ accent: "teal" }).join(), /brand\.accent/);
  assert.deepEqual(run({ accent: "#8FBF9F", type: "garamond" }), []);
});

test("type must be one the look offers; unknown settings are refused", () => {
  assert.match(run({ type: "comic" }).join(), /brand\.type: one of classic, garamond, modern/);
  assert.match(run({ colour: "#fff" }).join(), /brand\.colour: unknown setting/);
});

test("logo: in img/, small, and no script inside an SVG", () => {
  const files = (size, text = "<svg></svg>") => ({ size: () => size, read: () => text });
  assert.deepEqual(run({ logo: "img/logo.svg" }, files(2000)), []);
  assert.match(run({ logo: "logo.jpg" }, files(2000)).join(), /brand\.logo: a file in img\//);
  assert.match(run({ logo: "img/logo.svg" }, files(null)).join(), /file not found/);
  assert.match(run({ logo: "img/logo.webp" }, files(90 * 1024)).join(), /under 40 KB/);
  assert.match(run({ logo: "img/logo.svg" }, files(900, '<svg onload="alert(1)"></svg>')).join(), /script or event handlers/);
});

test("brand CSS sets the accent, a lighter partner and readable button text", () => {
  assert.equal(brandCss({ brand: {} }, noir), "");
  const css = brandCss({ brand: { accent: "#8FBF9F" } }, noir);
  assert.match(css, /--accent:#8FBF9F/);
  assert.match(css, /--on-accent:#140F0A/);
});
