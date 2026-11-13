import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { priceFor, buildTotal, builderText, paintText, daysLabel, filmPricesFromCsv, filmText } from "../../src/kits/detailing/lib/packages.js";
import { diaryFromCsv, nextStart, careIcs, maintenanceIcs, weekdayOf, addMonths, dueOn, daysUntil, dueWords, dueIcs } from "../../src/kits/detailing/lib/dates.js";
import { paintChartFromCsv } from "../../src/kits/detailing/lib/paint.js";
import { LEASE_ITEMS, LEASE_SOURCE, leasePricesFromCsv, leaseTotal, leaseText } from "../../src/kits/detailing/lib/lease.js";
import { districtOf, collectionFromCsv, collectionAnswer } from "../../src/kits/detailing/lib/collection.js";
import { carFromCsv, stageStates, normaliseCode, updatedAgo } from "../../src/kits/detailing/lib/progress.js";
import { HOME_PARTS, homeOrderProblem, onPagesProblem } from "../../src/kits/detailing/home.js";
import { csp, pageData } from "../../src/kits/detailing/kit.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/detailing/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-detailing-client/site.json", "utf8"));
const look = JSON.parse(readFileSync("src/looks/mackerel/look.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const TZ = "Europe/London";
const pkg = { id: "correct", name: "Correct", days: 3, prices: { small: 780, medium: 890 } };
const extra = (id, days, prices) => ({ id, name: id, days, prices });
const STAGES = [{ id: "wash", name: "Wash" }, { id: "correction", name: "Correction" }, { id: "protection", name: "Coating or film" }, { id: "handover", name: "Handover" }];

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("Mackerel's home order lists every section once, and its onPages only move what a page can hold", () => {
  assert.equal(homeOrderProblem(look.homeOrder), null);
  assert.equal(onPagesProblem(look.onPages), null);
  assert.match(homeOrderProblem(look.homeOrder.slice(1)) ?? "", /leaves out/);
  assert.match(onPagesProblem({ "film-page": ["visit"] }) ?? "", /only protection-3d/);
  assert.equal(Object.keys(HOME_PARTS).length, look.homeOrder.length);
});

test("prices come from the studio, by size, and an unpriced size is never guessed", () => {
  assert.equal(priceFor(pkg, "small"), 780);
  assert.equal(priceFor(pkg, "large"), null);
  const t = buildTotal({ pkg, extras: [extra("wheels", 1, { small: 220 }), extra("glass", 0, { medium: 90 })], size: "small" });
  assert.equal(t.total, 1000);
  assert.equal(t.days, 4);
  assert.deepEqual(t.unpriced, ["glass"]);
  assert.equal(buildTotal({ pkg, extras: [], size: "large" }).total, null);
  assert.equal(daysLabel(1), "1 day");
});

test("the builder's message carries every choice and says what's left to quote", () => {
  const m = builderText({ opening: "Hello, a quote please.", size: { id: "small", name: "Hatch" }, pkg, extras: [extra("Glass", 0, { medium: 90 })], car: "  Golf GTI " });
  assert.match(m, /^Hello, a quote please\.\n\nCar: Golf GTI \(Hatch\)\nPackage: Correct\nExtras: Glass\nWebsite price: from £780 plus Glass \(to quote\)\nAbout 3 days with you\.$/);
  assert.match(builderText({ opening: "Hi", size: { id: "large", name: "SUV" }, pkg, extras: [] }), /Price: please quote/);
});

test("the paint request lists the photos to send next and trims what it's given", () => {
  const m = paintText({ opening: "Hi", car: "Porsche 911", colour: "Black", concerns: ["Swirls"], kept: "Outside", note: "x".repeat(400), photos: ["Side", "Bonnet"] });
  assert.match(m, /Car: Porsche 911, Black\nWhat bothers me: Swirls\nKept: Outside\nNote: x{280}\n\nI'll send 2 photos next:\n1\. Side\n2\. Bonnet$/);
});

test("the diary: free runs from the sheet, never from a stale or unreadable one", () => {
  const now = Date.parse("2026-11-04T10:00:00Z");
  const csv = ["date,status,updated_at", "2026-11-05,free,2026-11-04 09:00", "2026-11-06,booked,2026-11-04 09:00", "2026-11-09,free,2026-11-04 09:00", "2026-11-10,free,2026-11-04 09:00", "2026-11-11,free,2026-11-04 09:00"].join("\n");
  const d = diaryFromCsv(csv, now, TZ, 48);
  assert.ok(d.ok);
  if (!d.ok) return;
  const work = ["mon", "tue", "wed", "thu", "fri"];
  assert.deepEqual(nextStart(d.days, "2026-11-05", 1, work), { start: "2026-11-05", end: "2026-11-05" });
  assert.deepEqual(nextStart(d.days, "2026-11-05", 2, work), { start: "2026-11-09", end: "2026-11-10" });
  assert.deepEqual(nextStart(d.days, "2026-11-05", 3, work), { start: "2026-11-09", end: "2026-11-11" });
  assert.equal(nextStart(d.days, "2026-11-05", 4, work), null);
  // A weekend inside a run is skipped, not counted and not a break.
  const fri = diaryFromCsv(["date,status,updated_at", "2026-11-06,free,2026-11-04 09:00", "2026-11-09,free,2026-11-04 09:00"].join("\n"), now, TZ, 48);
  assert.ok(fri.ok && nextStart(fri.days, "2026-11-05", 2, work)?.end === "2026-11-09");
  assert.equal(weekdayOf("2026-11-07"), "sat");
  assert.deepEqual(diaryFromCsv(csv, now + 72 * 3600_000, TZ, 48), { ok: false, reason: "stale" });
  assert.deepEqual(diaryFromCsv("date,status\n2026-11-05,free", now, TZ, 48), { ok: false, reason: "unreadable" });
  assert.deepEqual(diaryFromCsv("date,status,updated_at", now, TZ, 48), { ok: false, reason: "empty" });
});

test("care reminders and maintenance visits as calendar files, at 9am the studio's time", () => {
  const care = careIcs({ steps: [{ day: 7, title: "First wash", text: "Two buckets, no brushes." }], handover: "2026-06-01", business: "Varnell", place: "Weybridge", tz: TZ, stamp: new Date("2026-06-01T00:00:00Z") });
  assert.match(care, /DTSTART:20260608T080000Z/); // 9am BST
  assert.match(care, /SUMMARY:First wash \(Varnell\)/);
  assert.match(care, /DESCRIPTION:Two buckets\\, no brushes\./);
  const plan = maintenanceIcs({ plan: { id: "monthly", name: "Monthly", every: 4, text: "Most cars." }, from: "2026-12-01", count: 12, business: "Varnell", place: "Weybridge", tz: TZ, stamp: new Date() });
  assert.match(plan, /DTSTART:20261229T090000Z/); // 9am GMT, four weeks on
  assert.match(plan, /RRULE:FREQ=WEEKLY;INTERVAL=4;COUNT=12/);
});

test("your car: one row by its code; unknown, stale and unreadable show nothing", () => {
  const now = Date.parse("2026-11-04T12:00:00Z");
  const csv = ["code,car,work,stage,stage_name,note,photo,handover,updated_at",
    "VAR-0417,Green coupé,Full front,protection,Film,Bonnet done.,https://lh3.googleusercontent.com/x,Friday,2026-11-04 11:20",
    "VAR-0099,Black saloon,Enhance,wash,,,javascript:alert(1),,2026-11-01 10:00"].join("\n");
  const r = carFromCsv(csv, " var-0417 ", now, TZ, 48, STAGES);
  assert.ok(r.ok);
  if (r.ok) { assert.equal(r.car.stageName, "Film"); assert.equal(r.car.photo, "https://lh3.googleusercontent.com/x"); }
  assert.deepEqual(carFromCsv(csv, "NOPE", now, TZ, 48, STAGES), { ok: false, reason: "unknown" });
  assert.deepEqual(carFromCsv(csv, "VAR-0099", now, TZ, 48, STAGES), { ok: false, reason: "stale" });
  const late = carFromCsv(csv, "VAR-0099", Date.parse("2026-11-01T12:00:00Z"), TZ, 48, STAGES);
  assert.ok(late.ok && late.car.photo === "", "only https photo links are shown");
  assert.deepEqual(carFromCsv("code,stage\nA,wash", "A", now, TZ, 48, STAGES), { ok: false, reason: "unreadable" });
  assert.deepEqual(stageStates(STAGES, "protection", "Film").map((s) => `${s.name}:${s.state}`), ["Wash:done", "Correction:done", "Film:now", "Handover:next"]);
  assert.deepEqual(stageStates(STAGES, "").map((s) => s.state), ["next", "next", "next", "next"]);
  assert.equal(normaliseCode("var 0417<script>"), "VAR0417SCRIPT");
  assert.equal(updatedAgo(now - 40 * 60_000, now), "Updated 40 minutes ago");
});

test("the checks keep the data honest", () => {
  assert.match(errorsFor((s) => { s.mode = "client"; }, demo), /availability\.source: client sites read the studio's own sheet/);
  assert.match(errorsFor((s) => { s.packages.items[0].prices.huge = 10; }), /prices\.huge: not one of the sizes/);
  assert.match(errorsFor((s) => { s.packages.items[0].prices.small = "£340"; }), /whole pounds/);
  assert.match(errorsFor((s) => { s.availability.message = "Hello"; }), /availability\.message/);
  assert.match(errorsFor((s) => { s.progress.example = "X"; }, client), /progress\.example/);
  assert.match(errorsFor((s) => { s.inspection.after.width = 1200; }, client), /must be the same size/);
  assert.match(errorsFor((s) => { s.inspection.after.src = s.inspection.before.src; }, client), /the same file/);
  assert.match(errorsFor((s) => { s.protection.coverages[0].area = "bonnet"; }), /front-end, full-front, track, whole/);
  assert.match(errorsFor((s) => { s.correction.package = "nope"; }), /one of the package ids/);
  assert.match(errorsFor((s) => { s.packages.items[0].colour = "red"; }), /unknown setting/);
  assert.match(errorsFor((s) => { s.filmPrices.source = "simulated"; s.mode = "client"; }), /filmPrices\.source: client sites/);
  assert.match(errorsFor((s) => { s.collection.source = "simulated"; s.mode = "client"; }), /collection\.source: client sites/);
  assert.match(errorsFor((s) => { s.dueCheck.items[0].months = 6; }), /either months/);
  assert.match(errorsFor((s) => { s.maintenance.plans[0].payLink = "https://buy.stripe.com/abc"; }), /test-mode link/);
  assert.match(errorsFor((s) => { delete s.maintenance.plans[0].monthly; }), /monthly and payLink go together/);
  assert.match(errorsFor((s) => { s.wheelsPage.priceFrom = { addOn: "nope" }; }), /one of the addOns ids/);
  assert.match(errorsFor((s) => { s.newCarPage.priceFrom = { package: "enhance" }; }), /prices or priceFrom, not both/);
});

test("film prices: by package and car from the sheet; a typo or a missing price is left out, never guessed", () => {
  const csv = "package,body,price,days\nfull-front,suv,2295,3\nfull-front,van,999,1\nwhole,suv,£6750,7\ntrack,saloon,abc,3";
  const r = filmPricesFromCsv(csv, ["front-end", "full-front", "track", "whole"], ["suv", "saloon", "hatch"]);
  assert.ok(r.ok);
  assert.deepEqual([...r.prices.keys()], ["full-front|suv", "whole|suv"]);
  assert.deepEqual(r.prices.get("whole|suv"), { price: 6750, days: 7 });
  assert.equal(filmPricesFromCsv("package,body\nwhole,suv", ["whole"], ["suv"]).ok, false);
  assert.match(filmText({ opening: "Hi", body: "SUV", pkg: "Full front", price: 2295, days: 3 }), /Car: SUV\nFilm: Full front\nWebsite price: from £2,295, about 3 days/);
  assert.match(filmText({ opening: "Hi", body: "SUV", pkg: "Track pack", price: null, days: null }), /Price: please quote/);
});

test("is my car due: the studio's interval from the last visit, months kept to the month's end, and a 9am reminder", () => {
  assert.equal(addMonths("2027-01-31", 1), "2027-02-28");
  assert.equal(addMonths("2028-01-31", 1), "2028-02-29");
  assert.equal(addMonths("2026-11-15", 12), "2027-11-15");
  assert.equal(dueOn("2026-10-01", { id: "w", name: "Wash", weeks: 4, text: "" }), "2026-10-29");
  assert.equal(daysUntil("2026-11-10", "2026-11-04"), 6);
  assert.equal(dueWords(0), "Due today");
  assert.equal(dueWords(1), "Due in 1 day");
  assert.equal(dueWords(-12), "Overdue by 12 days");
  const ics = dueIcs({ item: { id: "topup", name: "Coating top-up", months: 12, text: "A fresh layer." }, due: "2027-07-01", business: "Varnell", place: "Weybridge", tz: TZ, stamp: new Date("2026-11-04T10:00:00Z") });
  assert.match(ics, /DTSTART:20270701T080000Z/); // 9am BST
  assert.match(ics, /SUMMARY:Coating top-up due \(Varnell\)/);
});

test("collection: by postcode district and day from the sheet; stale or unreadable never says yes", () => {
  assert.equal(districtOf("kt13 8xx"), "KT13");
  assert.equal(districtOf("SW1A 1AA"), "SW1A");
  assert.equal(districtOf("kt13"), "KT13");
  assert.equal(districtOf("hello"), "");
  const now = Date.parse("2026-11-04T12:00:00Z");
  const csv = "district,days,fee,updated_at\nKT13,mon thu,0,2026-11-04 10:00\nKT11,Tuesday,25,2026-11-04 10:00\nXX,mon,,2026-11-04 10:00";
  const r = collectionFromCsv(csv, now, TZ, 48);
  assert.ok(r.ok);
  assert.deepEqual(r.districts.get("KT11"), { days: ["tue"], fee: 25 });
  assert.equal(r.districts.has("XX"), false);
  assert.deepEqual(collectionAnswer(r.districts, "KT13", "thu"), { kind: "yes", words: "Yes: we collect from KT13 on Thursdays. No charge." });
  assert.equal(collectionAnswer(r.districts, "KT13", "fri").kind, "other-days");
  assert.match(collectionAnswer(r.districts, "KT13", "fri").words, /Monday and Thursday/);
  assert.equal(collectionAnswer(r.districts, "GU1", "mon").kind, "no");
  assert.equal(collectionFromCsv(csv, now + 72 * 3600_000, TZ, 48).ok, false);
  // An updated_at typed a year ahead is untrusted, not fresh for a year; a few minutes of clock difference is fine.
  assert.deepEqual(collectionFromCsv(csv.replace(/2026-11-04 10:00/g, "2027-11-04 10:00"), now, TZ, 48), { ok: false, reason: "unreadable" });
  assert.ok(collectionFromCsv(csv.replace(/2026-11-04 10:00/g, "2026-11-04 12:05"), now, TZ, 48).ok);
  assert.deepEqual(diaryFromCsv("date,status,updated_at\n2026-11-09,free,2027-11-04 10:00", now, TZ, 48), { ok: false, reason: "unreadable" });
  assert.deepEqual(collectionFromCsv("district,days\nKT13,mon", now, TZ, 48), { ok: false, reason: "unreadable" });
});

test("page data carries only what the features on the page use; 3D adds blob: and wasm to the policy", () => {
  const starter = { ...structuredClone(client), features: ["packages", "visit", "plan-visit", "questions"] };
  const d = pageData(starter).detailing;
  assert.equal(d.diary, null);
  assert.equal(d.progress, null);
  assert.deepEqual(d.extras, []);
  assert.deepEqual(csp(client), { sheets: true, img: ["https://*.googleusercontent.com", "blob:"], connect: ["blob:"], script: ["'wasm-unsafe-eval'"] });
  assert.deepEqual(csp(starter), { sheets: false, img: [], connect: [], script: [] });
});

test("paint chart: the studio's names and colours, a bad colour skipped, metallic when no finish is given", () => {
  const r = paintChartFromCsv("name,hex,finish\nBay green,23473c,\nWhite,#E9E8E3,pearl\nOops,#12345,solid\n,#000000,solid\nBay green,000000,solid");
  assert.ok(r.ok);
  assert.deepEqual(r.colours, [{ id: "bay-green", name: "Bay green", hex: "#23473C", finish: "metallic" }, { id: "white", name: "White", hex: "#E9E8E3", finish: "pearl" }]);
  assert.equal(paintChartFromCsv("name,colour\nRed,ff0000").ok, false);
});

test("lease return: only the studio's prices, \"Ask us\" when missing, and nothing priced that a detailer doesn't fix", () => {
  assert.equal(LEASE_SOURCE.edition, "updated December 2022");
  assert.match(LEASE_SOURCE.checked, /^\d{4}-\d{2}-\d{2}$/);
  const r = leasePricesFromCsv("item,price\nscratches,95\ntyres,120\nwheels,£85\nnope,10\nchips,abc");
  assert.ok(r.ok);
  assert.deepEqual([...r.prices], [["scratches", 95], ["wheels", 85]]);
  const t = leaseTotal(["scratches", "wheels", "dents", "papers"], r.prices);
  assert.equal(t.total, 180);
  assert.deepEqual(t.ask, ["Dents"]);
  assert.deepEqual(t.notOurs, ["Keys, papers and service history"]);
  const msg = leaseText({ opening: "Hi", ticked: ["scratches", "dents"], prices: r.prices, returnBy: "2027-01-15" });
  assert.equal(msg, "Hi\n\nCar goes back: 15/01/2027\nScratches: from £95\nPlease quote: Dents\nWebsite total: from £95");
  assert.ok(LEASE_ITEMS.every((x) => x.looks.length > 10));
  assert.match(errorsFor((s) => { s.features = s.features.filter((f) => !/-3d$/.test(f)); }), /paint-chart colours the 3D car/);
  assert.match(errorsFor((s) => { s.leasePrices.source = "simulated"; s.mode = "client"; }), /leasePrices\.source: client sites/);
});
