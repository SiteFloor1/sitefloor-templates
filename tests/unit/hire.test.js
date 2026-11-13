import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { classesOf, leadingClass, fromPrice, filterFlags, matches, sorted } from "../../src/kits/hire/lib/fleet.js";
import { hireParts, isWeekend, mileage, extraParts, quote, chauffeurHours, spanMinutes, money } from "../../src/kits/hire/lib/quote.js";
import { checkDriver, driverLine, outward, zoneFor } from "../../src/kits/hire/lib/rules.js";
import { availabilityFromCsv, weekendState, thisWeekend, depositFromCsv, cleanRef } from "../../src/kits/hire/lib/sheet.js";
import { carsFromCsv } from "../../src/kits/hire/lib/import.js";
import { handoverFor, requestMessage } from "../../src/kits/hire/lib/request.js";
import { imageSize } from "../../src/kits/hire/tools/import-fleet.js";
import { fleetFile, fleetUrl } from "../../src/kits/hire/eleventy.js";
import { checkHire } from "../../src/kits/hire/config.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";
import { HOME_PARTS, homeOrderProblem } from "../../src/kits/hire/home.js";
import { requestText } from "../../src/kits/hire/features/hire-request/hire-request.js";
import { chauffeurText } from "../../src/kits/hire/features/chauffeur-page/chauffeur-page.js";
import { checklistText } from "../../src/kits/hire/features/bring-list/bring-list.js";

const car = {
  id: "gt3rs", make: "Porsche", model: "911 GT3 RS", year: 2023, class: "performance", seats: 2, power: 518,
  photos: { card: { src: "img/x.webp", width: 10, height: 10, alt: "x" } },
  rates: { day: 1150, weekend: 2600, week: 6200, month: 19000 }, deposit: 7500,
  driver: { minAge: 30, licenceYears: 5, maxPoints: 6 },
  insurance: { cover: "Fully comprehensive", excess: 5000, reduction: { price: 95, per: "day", to: 1500 } },
  miles: { perDay: 100, extra: 4 }, fuelPolicy: "Full to full", lateReturn: "Charged by the hour", delivery: true,
};
const rules = { weekDays: 7, monthDays: 28, weekend: { pickUp: ["fri"], returnOn: ["mon"], maxDays: 3 } };

test("quote: the weekend rate only when the client's weekend rule fits", () => {
  assert.equal(isWeekend(rules, { from: "2026-11-06", to: "2026-11-09", periods: 3 }), true); // Fri → Mon
  assert.equal(isWeekend(rules, { from: "2026-11-07", to: "2026-11-09", periods: 2 }), false); // Sat start
  assert.deepEqual(hireParts(car, rules, { from: "2026-11-06", to: "2026-11-09", periods: 3 }), [{ label: "Weekend rate", amount: 2600 }]);
  assert.equal(hireParts(car, { ...rules, weekend: undefined }, { from: "2026-11-06", to: "2026-11-09", periods: 3 })?.[0].amount, 3450);
});

test("quote: months, then weeks, then days, each at the car's own rate; a missing rate is never assumed", () => {
  const parts = hireParts(car, rules, { from: "2026-11-02", to: "2026-12-11", periods: 39 });
  assert.deepEqual(parts?.map((p) => p.amount), [19000, 6200, 4 * 1150]); // 28 + 7 + 4
  const noDay = { ...car, rates: { week: 6200 } };
  assert.equal(hireParts(noDay, rules, { from: "2026-11-02", to: "2026-11-05", periods: 3 }), null);
  assert.equal(hireParts(noDay, rules, { from: "2026-11-02", to: "2026-11-09", periods: 7 })?.[0].amount, 6200);
});

test("quote: extra miles beyond what's included, extras per day or per hire, delivery, the deposit apart", () => {
  assert.deepEqual(mileage(car, 3, 250), { included: 300, over: 0, part: null });
  assert.equal(mileage(car, 3, 420).part?.amount, 480);
  assert.equal(mileage({ ...car, miles: { perDay: "unlimited" } }, 3, 9999).included, "unlimited");
  const extras = [{ id: "driver", label: "Extra driver", price: 25, per: "day" }, { id: "ribbons", label: "Ribbons", price: 40, per: "hire" }];
  assert.deepEqual(extraParts(extras, ["driver", "ribbons"], 3).map((p) => p.amount), [75, 40]);
  const q = quote({ car, rules, range: { from: "2026-11-06", to: "2026-11-09", periods: 3 }, extras, chosen: ["driver"], expectedMiles: 0, handover: { label: "Delivery", fee: 90 } });
  assert.equal(q.ok, true);
  assert.equal(q.total, 2600 + 90 + 75);
  assert.equal(q.deposit, 7500, "the deposit is listed, never added to the total");
});

test("chauffeur hours: rounded up to the client's step, never below the minimum; times past midnight", () => {
  assert.equal(chauffeurHours(130, { minHours: 3 }, 30), 3);
  assert.equal(chauffeurHours(250, { minHours: 3 }, 30), 4.5);
  assert.equal(chauffeurHours(250, { minHours: 3 }, 60), 5);
  assert.equal(spanMinutes(["13:00", "14:30", "23:30", "00:30"]), 690);
  assert.equal(spanMinutes(["13:00", "25:00"]), null);
  assert.equal(money(1150), "£1,150");
  assert.equal(money(1.5), "£1.50");
});

test("fleet: classes in rail order with counts, the lead car, flags, filters and sort", () => {
  const fleet = {
    lead: "performance",
    classes: [{ id: "suv", name: "SUV" }, { id: "performance", name: "Performance" }, { id: "supercar", name: "Supercar" }],
    cars: [{ ...car, id: "a" }, { ...car, id: "b", lead: true, rates: { day: 400 } }, { ...car, id: "c", class: "suv", seats: 5, power: 641, rates: { day: 650 } },
      { ...car, id: "d", class: "chauffeur", chauffeurOnly: true, chauffeur: { hourly: 180, minHours: 3 }, seats: 4 }],
  };
  assert.deepEqual(classesOf(fleet).map((k) => [k.id, k.cars.length]), [["performance", 2], ["suv", 1]]); // empty Supercar left out
  assert.equal(leadingClass(fleet)?.big.id, "b");
  assert.deepEqual(fromPrice(fleet.cars[3]), { amount: 180, per: "hour" });
  assert.deepEqual(filterFlags(fleet.cars[2]), ["seats-2", "seats-4", "seats-5", "power-300", "power-450", "power-600", "budget-1000", "budget-2000"]);
  assert.equal(matches(fleet.cars[2], { seats: 5, power: 600, budget: 1000 }), true);
  assert.equal(matches(fleet.cars[0], { q: "porsche gt3" }), true);
  assert.equal(matches(fleet.cars[0], { q: "ferrari" }), false);
  assert.deepEqual(sorted(fleet.cars, "low").map((c) => c.id), ["d", "b", "c", "a"]);
});

test("driver checker: reads the rules back, never decides", () => {
  assert.deepEqual(checkDriver(car.driver, { age: 31, licenceYears: 6, points: 3 }), { fits: true, misses: [] });
  assert.equal(checkDriver(car.driver, { age: 25, licenceYears: 2, points: 9 }).misses.length, 3);
  assert.equal(driverLine(car.driver), "30 or over, five years' full licence, up to six points");
  assert.equal(driverLine({ minAge: 25, licenceYears: 1, maxPoints: 0 }), "25 or over, one year's full licence, no points");
});

test("postcode zones: district, district family and area; the most specific wins", () => {
  const zones = [{ name: "Zone A", fee: 60, districts: ["SW11", "SW8"] }, { name: "Zone B", fee: 90, districts: ["SW1", "SE"] }, { name: "Zone C", fee: 150, districts: ["SW"] }];
  assert.equal(outward("sw11 4nq"), "SW11");
  assert.equal(outward("SW1A 2AA"), "SW1A");
  assert.equal(outward("nonsense"), null);
  assert.deepEqual(zoneFor("SW11 4NQ", zones), { ok: true, zone: { name: "Zone A", fee: 60 }, district: "SW11" });
  assert.equal(zoneFor("SW1A 2AA", zones).zone?.name, "Zone B");
  assert.equal(zoneFor("SW19 1AA", zones).zone?.name, "Zone C");
  assert.equal(zoneFor("N1 9GU", zones).zone, null);
  assert.equal(zoneFor("??", zones).ok, false);
  assert.equal(handoverFor({ kind: "deliver", postcode: "N1 9GU" }, { zones }).ok, false);
  assert.deepEqual(handoverFor({ kind: "airport", airport: "lhr" }, { zones, airports: [{ id: "lhr", name: "Heathrow", fee: 120 }] }), { ok: true, handover: { label: "Meet and greet, Heathrow", fee: 120, words: "meet and greet at Heathrow" } });
});

test("availability Sheet: taken days per car; old, future-dated or unreadable data fails closed", () => {
  const now = Date.parse("2026-10-29T12:00:00Z");
  const csv = "car,from,to,updated_at\ngt3rs,2026-11-06,2026-11-08,2026-10-29 10:00\nurus,2026-11-07,,2026-10-28 09:00\n";
  const a = availabilityFromCsv(csv, now, "Europe/London", 24);
  assert.equal(a.ok, true);
  assert.deepEqual(a.ok && a.taken.gt3rs, ["2026-11-06", "2026-11-07", "2026-11-08"]);
  assert.deepEqual(a.ok && a.taken.urus, ["2026-11-07"]);
  assert.equal(availabilityFromCsv(csv, now + 30 * 3_600_000, "Europe/London", 24).ok, false, "older than the client's limit");
  assert.equal(availabilityFromCsv("car,from\ngt3rs,2026-11-06", now, "Europe/London", 24).ok, false, "missing columns");
  assert.equal(availabilityFromCsv(`${csv}x,07/11/2026,,2026-10-29 10:00\n`, now, "Europe/London", 24).ok, false, "a row we can't read");
  assert.deepEqual(thisWeekend({ date: "2026-10-29", weekday: 4 }), ["2026-10-31", "2026-11-01"]);
  assert.deepEqual(thisWeekend({ date: "2026-11-01", weekday: 0 }), ["2026-11-01"]);
  assert.equal(weekendState(a, "gt3rs", ["2026-11-07", "2026-11-08"]), "taken");
  assert.equal(weekendState(a, "m5", ["2026-11-07", "2026-11-08"]), "free");
  assert.equal(weekendState({ ok: false }, "m5", ["2026-11-07"]), "ask");
  assert.equal(weekendState(null, "m5", ["2026-11-07"]), "ask");
});

test("deposit status: by reference only; a held deposit must be fresh, a returned one is final", () => {
  const now = Date.parse("2026-10-29T12:00:00Z");
  const csv = "ref,status,date,updated_at\nDH-4821,checked,2026-10-27,2026-10-28 18:00\nDH-1000,returned,2026-09-01,2026-09-01 10:00\n";
  assert.deepEqual(depositFromCsv(csv, "dh 4821", now, "Europe/London", 72), { ok: true, stage: 1, date: "2026-10-27" });
  assert.deepEqual(depositFromCsv(csv, "DH-1000", now, "Europe/London", 72), { ok: true, stage: 2, date: "2026-09-01" });
  assert.deepEqual(depositFromCsv(csv, "DH-9999", now, "Europe/London", 72), { ok: false, reason: "unknown" });
  assert.deepEqual(depositFromCsv(csv, "DH-4821", now + 100 * 3_600_000, "Europe/London", 72), { ok: false, reason: "error" });
  // A published tab is public: one with any other column (a name, a note) is refused, so the page says "ask us".
  const named = "ref,name,status,date,updated_at\nDH-4821,Jane Doe,checked,2026-10-27,2026-10-28 18:00\n";
  assert.deepEqual(depositFromCsv(named, "DH-4821", now, "Europe/London", 72), { ok: false, reason: "error" });
  assert.equal(availabilityFromCsv("car,from,to,updated_at,customer\nm5,2026-11-06,2026-11-08,2026-10-29 10:00,Jane\n", now, "Europe/London", 24).ok, false);
  // …and a name in a column with no header at all is refused too; empty extra columns (Sheets pads them) are fine.
  assert.equal(availabilityFromCsv("car,from,to,updated_at,\nm5,2026-11-06,2026-11-08,2026-10-29 10:00,Jane Smith\n", now, "Europe/London", 24).ok, false);
  assert.deepEqual(depositFromCsv("ref,status,date,updated_at,\nDH-4821,checked,2026-10-27,2026-10-28 18:00,Jane\n", "DH-4821", now, "Europe/London", 72), { ok: false, reason: "error" });
  assert.equal(availabilityFromCsv("car,from,to,updated_at,,\nm5,2026-11-06,2026-11-08,2026-10-29 10:00,,\n", now, "Europe/London", 24).ok, true);
  assert.equal(cleanRef(" dh-48<21> "), "DH-4821");
});

test("fleet import: rows to cars; empty cells stay out, bad cells and unknown columns are reported", () => {
  const size = () => ({ width: 1900, height: 1267 });
  const head = "id,make,model,year,class,seats,photo,photo_alt,day,deposit,min_age,licence_years,max_points,insurance,excess,excess_reduction,miles_per_day,extra_mile,fuel_policy,late_return,delivery,colours";
  const ok = carsFromCsv(`${head}\nM5,BMW,M5,2024,Performance,5,car-m5.webp,A BMW M5 at night,"£380",2500,25,3,6,Fully comprehensive,2500,none,150,1.50,Full to full,By the hour,yes,Black|Grey`, size);
  assert.deepEqual(ok.errors, []);
  const c = ok.cars[0];
  assert.equal(c.id, "m5"); assert.equal(c.class, "performance"); assert.equal(c.rates.day, 380);
  assert.equal(c.insurance.reduction, false); assert.deepEqual(c.colours, ["Black", "Grey"]);
  assert.equal("weekend" in c.rates, false, "an empty cell is never filled in");
  assert.equal("power" in c, false);
  assert.match(carsFromCsv(`${head},colour\n`, size).errors[0], /column "colour"/);
  assert.match(carsFromCsv(`${head}\nm5,BMW,M5,2024,performance,five,car.webp,x,380,2500,25,3,6,a,1,none,1,1,a,a,yes,`, size).errors.join(), /"seats" should be a number/);
  assert.match(carsFromCsv(`${head}\nm5,BMW,M5,2024,performance,5,car.webp,x,380,2500,25,3,6,a,1,none,1,1,a,a,maybe,`, size).errors.join(), /yes or no/);
});

test("image sizes from headers (the import needs no image library)", () => {
  const webp = readFileSync(new URL("../fixtures/img/m5.webp", import.meta.url));
  assert.deepEqual(imageSize(webp), { width: 950, height: 950 });
  assert.equal(imageSize(Buffer.from("not an image")), null);
});

test("fleet page addresses: folders for Cloudflare, flat files for previews", () => {
  assert.equal(fleetFile("cars", "bmw-m5", "pretty"), "cars/bmw-m5.html");
  assert.equal(fleetUrl("cars", "bmw-m5", "pretty"), "/cars/bmw-m5");
  assert.equal(fleetFile("fleet", "suv", "html"), "fleet-suv.html");
  assert.equal(fleetUrl("fleet", "suv", "html"), "fleet-suv.html");
});

test("messages: requests, never bookings; dated in full; the reference that matches the deposit", () => {
  const t = requestText({ car: "BMW M5", from: "2026-11-06", to: "2026-11-09", where: "SW11" }, "Datum Hire");
  assert.match(t, /Friday 6 November 2026 to Monday 9 November 2026/);
  assert.match(t, /request until you confirm/);
  assert.doesNotMatch(t, /\b(booked|confirmed|reserved|this weekend)\b/i);
  const q = quote({ car, rules, range: { from: "2026-11-06", to: "2026-11-09", periods: 3 }, extras: [], chosen: [], expectedMiles: 0, handover: null });
  const m = requestMessage({ business: "Datum Hire", car: "Porsche 911 GT3 RS", range: { from: "2026-11-06", to: "2026-11-09", selection: { fromTime: "18:00", toTime: "18:00" } }, handover: "collection", quote: q, ref: "gt3rs_2026-11-06_2026-11-09" });
  assert.match(m, /Friday 6 November 2026 at 18:00/);
  assert.match(m, /Total: £2,600/);
  assert.match(m, /Deposit \(returned\): £7,500/);
  assert.match(m, /Reference: gt3rs_2026-11-06_2026-11-09/);
  assert.doesNotMatch(m, /\b(booked|confirmed|reserved)\b/i);
  assert.match(chauffeurText("Hello, a chauffeur quote please.", { from: "Claridge's", date: "2026-11-14", time: "13:00", hours: "4" }), /Saturday 14 November 2026 at 13:00/);
  assert.equal(checklistText("Datum Hire", ["Your licence"], "SW11").split("\n")[2], "[ ] Your licence");
});

test("home order: every section once", () => {
  assert.equal(homeOrderProblem(Object.keys(HOME_PARTS)), null);
  assert.match(String(homeOrderProblem(["fleet"])), /leaves out/);
  const look = JSON.parse(readFileSync(new URL("../../src/looks/datum/look.json", import.meta.url), "utf8"));
  assert.equal(homeOrderProblem(look.homeOrder), null);
});

/** A minimal valid hire site, built up in each test. */
function hireSite() {
  return JSON.parse(readFileSync(new URL("../fixtures/sites/test-hire-client/site.json", import.meta.url), "utf8"));
}
const check = (/** @type {any} */ site) => { const errs = /** @type {string[]} */ ([]); checkHire(site, (p, m) => errs.push(`${p}: ${m}`)); return errs; };

test("the fixture client site is valid", () => {
  const site = hireSite();
  assert.deepEqual(validateSite(site, { catalog: loadCatalog(new URL("../..", import.meta.url).pathname) }), []);
});

test("every rule comes from the client: a car that leaves one out is refused, never defaulted", () => {
  for (const [key, re] of [["deposit", /deposit/], ["driver", /driver/], ["insurance", /insurance/], ["miles", /miles/], ["fuelPolicy", /fuel/], ["lateReturn", /late/], ["delivery", /delivered/]]) {
    const site = hireSite();
    const c = site.fleet.cars.find((/** @type {any} */ x) => !x.chauffeurOnly);
    delete c[key];
    assert.ok(check(site).some((e) => re.test(e)), `${key} missing should be refused`);
  }
  const site = hireSite();
  site.fleet.cars[0].insurance.reduction = undefined;
  assert.ok(check(site).some((e) => /reduction/.test(e)), "the excess reduction must be stated, or false");
  site.fleet.cars[0].typical = true;
  assert.ok(check(site).some((e) => /unknown setting/.test(e)), "unknown keys refused");
});

test("live data: simulated refused on client sites; demo examples only on demos; chauffeur cars need the client's rate", () => {
  const site = hireSite();
  site.hire.availability = { source: "simulated", staleAfterHours: 24 };
  assert.ok(check(site).some((e) => /simulated data is only allowed on demo sites/.test(e)));
  const s2 = hireSite();
  s2.fleet.cars.push({ ...s2.fleet.cars[0], id: "a-chauffeur-car", class: "chauffeur", chauffeurOnly: true });
  assert.ok(check(s2).some((e) => /chauffeur/.test(e)));
  const s3 = hireSite();
  s3.fleet.cars[0].payLink = "nope";
  assert.ok(check(s3).some((e) => /payLinks/.test(e)));
});

test("handover checklist: records what was seen, lists what changed, never a verdict", async () => {
  const { fuelWords, differences, recordText, cleanMiles, storeKey } = await import("../../src/kits/hire/lib/check.js");
  const panels = ["Front bumper", "Bonnet", "Wheels"];
  const a = { at: "2026-10-30 18:05", fuel: 8, miles: "12,034", marks: { "Front bumper": "Stone chip, left" } };
  const b = { at: "2026-11-02 18:10", fuel: 6, miles: "12410", marks: { "Front bumper": "Stone chip, left", Wheels: "Kerbed, front right" } };
  assert.equal(fuelWords(6), "3/4"); assert.equal(fuelWords(12), "Full");
  assert.equal(cleanMiles("12,034 mi"), "12034");
  const d = differences(panels, { ...a, miles: cleanMiles(a.miles) }, b);
  assert.deepEqual(d, ['Wheels: new, "Kerbed, front right"', "Fuel: Full at collection, 3/4 at return", "Driven: 376 miles"]);
  const t = recordText({ business: "Datum Hire", ref: "DH-4821", car: "BMW M5", panels, collection: { ...a, miles: "12034" }, back: b });
  assert.match(t, /At collection, 2026-10-30 18:05/);
  assert.match(t, /Bonnet: nothing seen/);
  assert.match(t, /Changes since collection:\n- Wheels: new/);
  assert.doesNotMatch(t, /\b(damage charge|liable|deducted|approved)\b/i);
  assert.equal(storeKey("DH-4821", "bmw-m5"), "sf-check:DH-4821:bmw-m5");
});
