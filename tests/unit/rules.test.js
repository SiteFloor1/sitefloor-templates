import { test } from "node:test";
import assert from "node:assert/strict";
import { rawColours, tokenValue, fillerIn, checkRules } from "../../scripts/rules-check.js";

test("raw colours are found, but not in comments", () => {
  assert.deepEqual(rawColours(".a { color: #fff; background: rgba(0,0,0,.5); } /* #123 */"), ["#fff", "rgba("]);
  assert.deepEqual(rawColours(".a { color: var(--accent); }"), []);
});

test("look tokens are read as their first value", () => {
  assert.equal(tokenValue(':root { --font-display: "Playfair Display", Georgia, serif; }', "--font-display"), "Playfair Display");
  assert.equal(tokenValue(":root { --accent: #C9A46A; }", "--accent"), "#C9A46A");
});

test("filler copy is caught as whole phrases only", () => {
  assert.deepEqual(fillerIn("Elevate your look with a seamless experience"), ["elevate", "seamless"]);
  assert.deepEqual(fillerIn("Unlock the bay with the code we send you"), []);
  assert.deepEqual(fillerIn("A world class fade"), ["world-class"]);
});

test("the repo passes its own house rules", async () => {
  assert.deepEqual(await checkRules(process.cwd()), []);
});

test("colours written into markup by kit code are caught, anchors and comments are not", async () => {
  const { colourInMarkup } = await import("../../scripts/rules-check.js");
  assert.deepEqual(colourInMarkup('`<path fill="#141210"/>` + `<stop stop-color="#abc"/>`'), ["#141210", "#abc"]);
  assert.deepEqual(colourInMarkup('el.style.background = "rgba(0,0,0,.5)"'), ["rgba("]);
  assert.deepEqual(colourInMarkup('href="#fade" // fill="#fff"\n/* stroke="#000" */ class="dg-ink"'), []);
});

test("shared build files name no kit: a kit's name is caught as a word, not inside other words", async () => {
  const { kitNamesIn } = await import("../../scripts/rules-check.js");
  assert.deepEqual(kitNamesIn('import x from "../kits/car/features/next-bay/sheet-provider.js";', ["car", "law"]), ["car"]);
  assert.deepEqual(kitNamesIn("// the Law kit's matters", ["car", "law"]), ["law"]);
  assert.deepEqual(kitNamesIn("a scarf on the lawn; chairProvider", ["car", "law", "hire"]), []);
});
