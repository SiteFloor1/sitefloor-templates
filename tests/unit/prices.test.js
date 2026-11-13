import { test } from "node:test";
import assert from "node:assert/strict";
import { resolvePriceItem, checkPriceList } from "../../src/core/lib/prices.js";

const menu = { services: [{ id: "skin", name: "Skin fade", price: 22, minutes: 40 }], extras: [{ id: "beard", name: "Beard shape-up", price: 12.5, minutes: 15 }] };
const errorsFor = (priceList) => { const out = []; checkPriceList({ ...menu, priceList }, (p, m) => out.push(`${p}: ${m}`)); return out; };

test("price-list lines that point at the cut builder take its name and price", () => {
  assert.deepEqual(resolvePriceItem({ service: "skin", note: "Foil to zero" }, menu), { name: "Skin fade", price: "£22", note: "Foil to zero", minutes: 40 });
  assert.deepEqual(resolvePriceItem({ extra: "beard", name: "Beard trim" }, menu), { name: "Beard trim", price: "£12.50", note: undefined, minutes: 15 });
  assert.deepEqual(resolvePriceItem({ name: "Cut and beard", price: "£32" }, menu), { name: "Cut and beard", price: "£32", note: undefined });
  assert.throws(() => resolvePriceItem({ service: "nope" }, menu));
});

test("a price can only be entered once, and lines must be readable", () => {
  assert.deepEqual(errorsFor([{ group: "Cuts", items: [{ service: "skin" }, { name: "Cut and beard", price: "£32" }] }]), []);
  assert.match(errorsFor([{ group: "Cuts", items: [{ name: "Skin fade", price: "£20" }] }])[0], /also in the cut builder/);
  assert.match(errorsFor([{ group: "Cuts", items: [{ service: "fade" }] }])[0], /doesn't exist/);
  assert.match(errorsFor([{ group: "Cuts", items: [{ name: "Senior", price: 14 }] }])[0], /\.price/);
  assert.match(errorsFor([])[0], /priceList/);
});
