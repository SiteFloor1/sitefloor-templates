import { test } from "node:test";
import assert from "node:assert/strict";
import { bankHolidays, regionFromPostcode } from "../../src/core/lib/bank-holidays.js";

// Expected dates from gov.uk/bank-holidays.
test("England and Wales: 2026, 2027 (Christmas on a Saturday) and 2022 (Christmas on a Sunday)", () => {
  assert.deepEqual(bankHolidays(2026, "england-wales"), ["2026-01-01", "2026-04-03", "2026-04-06", "2026-05-04", "2026-05-25", "2026-08-31", "2026-12-25", "2026-12-28"]);
  assert.deepEqual(bankHolidays(2027, "england-wales"), ["2027-01-01", "2027-03-26", "2027-03-29", "2027-05-03", "2027-05-31", "2027-08-30", "2027-12-27", "2027-12-28"]);
  // 2022 also had two one-off holidays (state funeral, jubilee), which are added as exceptions.
  assert.deepEqual(bankHolidays(2022, "england-wales").filter((d) => d >= "2022-12-01"), ["2022-12-26", "2022-12-27"]);
});

test("Scotland: 2 January, first Monday in August, St Andrew's Day; no Easter Monday", () => {
  assert.deepEqual(bankHolidays(2026, "scotland"), ["2026-01-01", "2026-01-02", "2026-04-03", "2026-05-04", "2026-05-25", "2026-08-03", "2026-11-30", "2026-12-25", "2026-12-28"]);
  assert.deepEqual(bankHolidays(2022, "scotland").slice(0, 2), ["2022-01-03", "2022-01-04"]); // 1 Jan Sat, 2 Jan Sun
});

test("Northern Ireland: St Patrick's Day and the Twelfth, with substitutes", () => {
  const ni = bankHolidays(2026, "northern-ireland");
  assert.ok(ni.includes("2026-03-17"));
  assert.ok(ni.includes("2026-07-13")); // 12 July 2026 is a Sunday
  assert.equal(ni.length, 10);
});

test("region from postcode", () => {
  assert.equal(regionFromPostcode("LS1 6BY"), "england-wales");
  assert.equal(regionFromPostcode("G1 1AA"), "scotland");
  assert.equal(regionFromPostcode("eh1 1aa"), "scotland");
  assert.equal(regionFromPostcode("BT1 1AA"), "northern-ireland");
  assert.equal(regionFromPostcode("GL1 1AA"), "england-wales"); // GL is Gloucester, not Glasgow
});
