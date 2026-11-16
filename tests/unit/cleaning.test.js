import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { build } from "esbuild";
import { visit, hm, gbp, ruler, visitWords, homeWords, validChoice, fromRate } from "../../src/kits/cleaning/lib/visit.js";
import { outward, covered, freeDaysFromCsv, areaAnswer, dayWords } from "../../src/kits/cleaning/lib/areas.js";
import { moveOut, officeWindow, officeZones, clock, cleanIcs } from "../../src/kits/cleaning/lib/plan.js";
import { claimProblem } from "../../src/kits/cleaning/config.js";
import { HOME_PARTS, homeOrderProblem } from "../../src/kits/cleaning/home.js";
import { MODEL_3D_KB } from "../../src/kits/cleaning/kit.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/cleaning/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-cleaning-client/site.json", "utf8"));
const look = JSON.parse(readFileSync("src/looks/plumb/look.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const V = demo.visit;

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("the look's home order lists every section once", () => {
  assert.equal(homeOrderProblem(look.homeOrder), null);
  assert.match(homeOrderProblem(look.homeOrder.slice(1)) ?? "", /leaves out/);
  assert.equal(Object.keys(HOME_PARTS).length, look.homeOrder.length);
});

test("the default home: 2 h 25 and £60, written the same way everywhere", () => {
  const c = V.defaults, v = visit(V, c);
  assert.deepEqual(v.rooms.map((r) => [r.id, r.min]), [["kitchen", 45], ["hall", 10], ["bed1", 20], ["bed2", 15], ["bath", 30], ["bath2", 25]]);
  assert.equal(v.work, 145);
  assert.equal(v.price, 60); // 145 min at £25 an hour = £60.42, rounded once
  const w = visitWords(c, v, "Linnet");
  assert.equal(w.figures, "2 h 25, £60");
  assert.equal(w.home, "two-bedroom home with two bathrooms, fortnightly");
  assert.match(w.message, /2 h 25, £60/);
});

test("for every choice, the parts add up to the total and the price comes from the total, rounded once", () => {
  for (let beds = 1; beds <= 6; beds++) for (let baths = 1; baths <= 4; baths++) for (const freq of /** @type {const} */ (["week", "fortnight", "once"])) {
    for (const extras of [[], ["oven", "linen", "windows"]]) {
      const v = visit(V, { beds, baths, freq, extras });
      assert.equal(v.work, [...v.rooms, ...v.extras].reduce((n, r) => n + r.min, 0));
      assert.ok([...v.rooms, ...v.extras].every((r) => Number.isInteger(r.min) && r.min > 0));
      assert.equal(v.charged, Math.max(V.minimum, v.work));
      assert.equal(v.price, Math.round((v.charged * V.rates[freq]) / 60));
      assert.equal(v.rooms.length, 2 + beds + baths);
    }
  }
});

test("a deep clean takes each room half as long again, up to the next 5 minutes; linen is per bed", () => {
  const v = visit(V, { beds: 1, baths: 1, freq: "once" });
  assert.deepEqual(v.rooms.map((r) => r.min), [70, 15, 30, 45]);
  assert.equal(v.deep, true);
  const x = visit(V, { beds: 3, baths: 1, freq: "week", extras: ["linen"] });
  assert.equal(x.extras[0].min, 30);
});

test("a small home pays for the shortest visit, and the bill says so", () => {
  const v = visit({ ...V, minimum: 180 }, { beds: 1, baths: 1, freq: "week" });
  assert.equal(v.work, 105);
  assert.equal(v.charged, 180);
  assert.equal(v.price, 72);
});

test("durations and prices have one way of being written", () => {
  assert.equal(hm(145), "2 h 25");
  assert.equal(hm(120), "2 h 00");
  assert.equal(hm(45), "45 min");
  assert.equal(gbp(1240), "£1,240");
  assert.equal(homeWords({ beds: 1, baths: 1, freq: "week" }), "one-bedroom home with one bathroom");
  const t = ruler(145);
  assert.equal(t[0].label, "0");
  assert.equal(t.find((x) => x.label === "2 h 00")?.at, (120 / 145) * 100);
  assert.equal(t.filter((x) => x.label).length, 5); // 0, 30 min, 1 h 00, 1 h 30, 2 h 00; none near the end
  assert.equal(validChoice({ beds: 7, baths: 1, freq: "week" }), false);
});

test("postcodes: outward codes, coverage (SW1 covers SW1A, not SW10)", () => {
  assert.equal(outward("sw4 7aa"), "SW4");
  assert.equal(outward("SW1A1AA"), "SW1A");
  assert.equal(outward("sw11"), "SW11");
  assert.equal(outward("hello"), null);
  assert.ok(covered("SW1A", ["SW1"]));
  assert.ok(!covered("SW10", ["SW1"]));
  assert.ok(covered("SW4", ["SW4"]));
});

test("free days fail closed: old, unreadable or missing sheets never give a date", () => {
  const csv = "district,date,updated_at\nSW4,2026-11-17,2026-11-15 07:45\nSW4,2026-11-14,2026-11-15\nSW9,2026-11-19,2026-11-15";
  const ok = freeDaysFromCsv(csv, "2026-11-15", 3);
  assert.deepEqual(ok, { ok: true, days: { SW4: ["2026-11-17"], SW9: ["2026-11-19"] } });
  assert.deepEqual(freeDaysFromCsv(csv, "2026-11-20", 3), { ok: false });
  assert.deepEqual(freeDaysFromCsv("nonsense", "2026-11-15", 3), { ok: false });
  assert.deepEqual(freeDaysFromCsv("district,date,updated_at\nSW4,2026-11-17,", "2026-11-15", 3), { ok: false });
  const d = ["SW4", "SW9"];
  assert.equal(areaAnswer("SW4 7AA", d, ok).text, `Yes, we clean in SW4. Next free: ${dayWords("2026-11-17")}.`);
  assert.equal(areaAnswer("SW4 7AA", d, { ok: false }).text, "Yes, we clean in SW4. Ask us for the next free day.");
  assert.equal(areaAnswer("SW4", d, null).text, "Yes, we clean in SW4.");
  assert.equal(areaAnswer("E1 6AN", d, ok).state, "no");
  assert.equal(areaAnswer("x", d, ok).state, "invalid");
  assert.equal(dayWords("2026-11-17"), "Tuesday 17 November");
});

test("the move-out planner, the office window and the calendar files", () => {
  assert.deepEqual(moveOut("2026-12-20", "2026-11-15", { cleanDaysBefore: 1, bookDaysBefore: 7 }), { clean: "2026-12-19", bookBy: "2026-12-12", daysLeft: 27, late: false, past: false });
  assert.equal(moveOut("2026-11-20", "2026-11-15", { cleanDaysBefore: 1, bookDaysBefore: 7 }).late, true);
  assert.equal(moveOut("2026-11-15", "2026-11-15", { cleanDaysBefore: 1, bookDaysBefore: 7 }).past, true);
  const zones = officeZones(demo.offices.zones, { desks: 40, washrooms: 2 });
  assert.equal(zones.reduce((n, z) => n + z.min, 0), 128);
  assert.deepEqual(officeWindow({ open: 480, close: 1080 }, "before", 128, 15), { start: 337, end: 465, words: "You open at 08:00. We're in from 05:37 and gone by 07:45." });
  assert.equal(officeWindow({ open: 480, close: 1080 }, "after", 60, 30).words, "You close at 18:00. We arrive at 18:30 and lock up by 19:30.");
  assert.equal(clock(1440 + 75), "01:15");
  const ics = cleanIcs({ date: "2026-11-17", start: 540, minutes: 145, every: 2, title: "Cleaning · Linnet", place: "", business: "Linnet", stamp: "20261115T000000Z" });
  assert.match(ics, /DTSTART:20261117T090000\r\nDTEND:20261117T112500\r\n/);
  assert.match(ics, /RRULE:FREQ=WEEKLY;INTERVAL=2/);
  assert.ok(!/LOCATION/.test(ics));
  const day = cleanIcs({ date: "2026-12-19", start: 0, minutes: 0, every: 0, title: "End-of-tenancy clean", place: "", business: "Linnet", stamp: "20261115T000000Z" });
  assert.match(day, /DTSTART;VALUE=DATE:20261219\r\nDTEND;VALUE=DATE:20261220/);
});

test("settings are checked: whole minutes, rates, a deposit never promised, no simulation on a client", () => {
  assert.match(errorsFor((s) => { s.visit.rooms.bath.min = 12.5; }), /visit\.rooms\.bath\.min/);
  assert.match(errorsFor((s) => { s.visit.rates.week = 0; }), /visit\.rates\.week/);
  assert.match(errorsFor((s) => { s.visit.defaults.beds = 9; }), /visit\.defaults/);
  assert.match(errorsFor((s) => { s.visit.rooms.hall.tasks = []; }), /visit\.rooms\.hall\.tasks/);
  assert.match(errorsFor((s) => { s.visit.extras.push({ id: "oven", name: "Again", min: 5 }); }), /used twice/);
  assert.match(errorsFor((s) => { s.cleans.items[0].intro = "x"; }), /unknown setting/);
  assert.match(errorsFor((s) => { s.cleans.items[1].id = "offices"; }), /already a page's name/);
  assert.match(errorsFor((s) => { delete s.cleans.items[3].page; }), /needs its page/);
  // a service with a worked example takes its price from `visit`, never its own
  assert.match(errorsFor((s) => { s.cleans.items[0].rate = 22; }), /worked out from `visit`/);
  assert.match(errorsFor((s) => { s.cleans.items[2].example.beds = 2; }), /smallest home/);
  assert.match(errorsFor((s) => { s.cleans.items[0].example.extras = ["polish"]; }), /not one of visit\.extras/);
  assert.match(errorsFor((s) => { s.cleans.items[2].page = { intro: "x", sections: [] }; }), /not both/);
  assert.match(errorsFor((s) => { s.cleans.items[0].line = "Deposit back guarantee on every clean."; }), /never promise a deposit/);
  assert.equal(errorsFor((s) => { s.tenancy.terms = "If we miss something we come back free."; }), "");
  assert.match(errorsFor((s) => { s.tenancy.depositLink = "https://example.com"; }), /gov\.uk/);
  assert.match(errorsFor((s) => { s.tenancy.checked = "Nov 2026"; }), /tenancy\.checked/);
  assert.match(errorsFor((s) => { s.offices.rate = 25; }), /site survey/);
  assert.match(errorsFor((s) => { s.areas.districts.push("Clapham"); }), /areas\.districts/);
  assert.match(errorsFor((s) => { s.areas.days.source = "simulated"; }, client), /simulated free days are for demos/);
  assert.match(errorsFor((s) => { s.areas.days.csvUrl = "https://example.com/x.csv"; }, client), /csvUrl/);
  assert.equal(claimProblem("100% deposit back"), "never promise a deposit back; quote the company's own re-clean terms in tenancy.terms");
  assert.equal(claimProblem("We come back to put it right."), null);
  // the whole site is checked, not only the kit's own settings (K-01)
  assert.match(errorsFor((s) => { s.business.description = "Deposit back guarantee."; }), /business\.description: never promise a deposit/);
  assert.match(errorsFor((s) => { s.messages.price = "Hi, can you guarantee my deposit back?"; }), /messages\.price: never promise a deposit/);
  assert.match(errorsFor((s) => { s.visitInfo.title = "Pass your inspection first time"; }), /visitInfo\.title: never promise a pass/);
  assert.match(errorsFor((s) => { s.seasons[0].message = "Landlord-approved cleans all December."; }), /seasons\[0\]\.message: no "landlord-approved"/);
  assert.match(errorsFor((s) => { s.pageLinks[0].title = "Agency approved"; }), /pageLinks\[0\]\.title: no "landlord-approved"/);
  assert.equal(errorsFor((s) => { s.tenancy.terms = "We make sure you pass check-out or we come back."; }), "");
  // an offices link carries no price (K-03); hourly prices come from the rates, never typed (K-04)
  assert.match(errorsFor((s) => { s.cleans.items[4].rate = 30; }), /offices link carries no price/);
  assert.match(errorsFor((s) => { s.cleans.items[4].from = 300; }), /offices link carries no price/);
  assert.match(errorsFor((s) => { s.cleans.items[4].example = { beds: 2, baths: 2, freq: "fortnight" }; }), /items\[4\]\.example: an offices link carries no price/);
  assert.match(errorsFor((s) => { s.business.description = "Cleaning from £24 an hour."; }), /business\.description: don't type an hourly price/);
  assert.match(errorsFor((s) => { s.questions[0].a = "£25/hour, fortnightly."; }), /questions\[0\]\.a: don't type an hourly price/);
  assert.match(errorsFor((s) => { s.cleans.items[0].line = "Weekly, {from}."; }), /filled in hero\.intro only/);
  assert.equal(fromRate({ visit: { rates: { week: 24, fortnight: 25, once: 30 } } }), 24);
  assert.equal(fromRate({ cleans: { items: [{ rate: 27 }, { from: 180 }, { rate: 22 }] } }), 22);
  assert.equal(fromRate({ cleans: { items: [{ from: 180 }] } }), null);
  // and the wider wording
  for (const [said, why] of [
    ["We make sure you get your deposit back.", /deposit back/], ["Your deposit returned in full, guaranteed.", /deposit back/],
    ["Deposit back or we pay the difference.", /deposit back/], ["We'll ensure the full deposit is refunded.", /deposit back/],
    ["Guaranteed to pass inspection.", /pass at inspection/], ["Cleans that pass check-out.", /pass at inspection/], ["Passes the checkout.", /pass at inspection/],
    ["Get your deposit back.", /deposit back/], ["We help you get your deposit back.", /deposit back/], ["We'll get your bond back.", /deposit back/],
    ["Most of our customers get their deposit back.", /deposit back/], ["Bond back guarantee.", /deposit back/],
    ["Landlord-approved cleaners.", /landlord-approved/], ["An agency-approved checklist.", /landlord-approved/], ["Letting agent approved.", /landlord-approved/]]) assert.match(claimProblem(said) ?? "", why, said);
  for (const fine of ["We can't promise what a landlord decides.", "Agents check the oven first.", "Ask your agent for the check-out report.", "Get your deposit protection certificate.", "Will I get my deposit back?", "Worried about getting your deposit back? Start with the inventory."]) assert.equal(claimProblem(fine), null, fine);
});

test("the 3D link's size is the chunk's real size, within 15%", async () => {
  const out = await build({ entryPoints: ["src/kits/cleaning/features/cleaning-3d/model-3d.js"], bundle: true, format: "esm", minify: true, write: false, logLevel: "silent" });
  const kb = gzipSync(out.outputFiles[0].contents).length / 1024;
  assert.ok(Math.abs(kb - MODEL_3D_KB) / MODEL_3D_KB < 0.15, `the chunk is ${kb.toFixed(0)} KB gzipped; the link says ${MODEL_3D_KB} KB`);
});
