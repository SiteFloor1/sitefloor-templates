import { test } from "node:test";
import assert from "node:assert/strict";
import { payRef, withRef } from "../../src/core/lib/pay-ref.js";
import { checkPayLinks } from "../../src/kits/bakery/config.js";

test("a deposit reference is something Stripe accepts and carries no stray characters", () => {
  assert.equal(payRef(["911 Turbo", "2026-11-06", "2026-11-09"]), "911-turbo_2026-11-06_2026-11-09");
  assert.equal(payRef(["A/B & C", undefined, "", "x"]), "a-b-c_x");
  assert.ok(payRef(["x".repeat(300)]).length <= 200);
  assert.match(payRef(["Café: 10:00"]), /^[A-Za-z0-9_-]+$/);
});

test("the reference goes on the link as client_reference_id, and comes off when cleared", () => {
  const url = "https://buy.stripe.com/abc123";
  assert.equal(withRef(url, "911_2026-11-06"), "https://buy.stripe.com/abc123?client_reference_id=911_2026-11-06");
  assert.equal(withRef(withRef(url, "a"), ""), url);
});

test("a deposit can hold a request; nothing else can", () => {
  const errs = [];
  const err = (/** @type {string} */ p, /** @type {string} */ m) => errs.push(`${p}: ${m}`);
  const item = (/** @type {any} */ x) => ({ note: "Paid on Stripe.", items: [{ id: "d", label: "Deposit", amount: 500, kind: "deposit", url: "https://buy.stripe.com/abc", ...x }] });
  checkPayLinks(item({ holds: "request" }), "client", err);
  assert.deepEqual(errs, []);
  checkPayLinks(item({ holds: "booking" }), "client", err);
  checkPayLinks(item({ holds: "request", kind: "full" }), "client", err);
  assert.equal(errs.length, 2);
  assert.ok(errs.every((e) => e.startsWith("payLinks.items[0].holds")));
});
