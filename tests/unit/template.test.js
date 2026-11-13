import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { validateSite as validate } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const root = new URL("../..", import.meta.url).pathname;
const catalog = loadCatalog(root);

/** What a busy builder might do: overwrite every REPLACE_ME string with plausible text and nothing else. */
const fillBlindly = (v) => {
  if (typeof v === "string") return v.includes("REPLACE_ME") ? "Filled in" : v;
  if (Array.isArray(v)) return v.map(fillBlindly);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fillBlindly(x)]));
  return v;
};

for (const kit of readdirSync(`${root}src/kits`)) {
  test(`${kit} client template: facts customers act on can't ship unchecked`, () => {
    const site = fillBlindly(JSON.parse(readFileSync(`${root}src/kits/${kit}/client-template.json`, "utf8")));
    Object.assign(site, { id: "probe-cuts", plan: "starter", url: "https://probe-cuts.co.uk" });
    const errors = validate(site, { catalog }).join("\n");
    for (const field of ["hours.weekly.mon", "visitInfo.journeys[0].minutes", "visitInfo.parking[0].walk", "visitInfo.parking[0].paid", "visitInfo.access[0]", "visitInfo.checked"]) {
      assert.match(errors, new RegExp(field.replace(/[[\].]/g, "\\$&")), `${field} should be rejected until a real value is entered`);
    }
  });
}
