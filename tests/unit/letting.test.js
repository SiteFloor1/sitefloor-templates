// Letting kit: the Tenant Fees Act caps at their boundaries (GOV.UK, checked 15 Nov 2026), the agent's own terms
// refused above the caps, the owner's side from published fees, the homes sheet failing closed, and the settings
// a letting agent's site must have (fees always on, both schemes named, real numbers on a client site).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";
import { RULES, moveIn, tenantSide, ownerSide, landlordView, tenantTermsProblem, rentFrom } from "../../src/kits/letting/lib/fees.js";
import { homesFromCsv, partA, updatedText, freeOn, sqft } from "../../src/kits/letting/lib/homes.js";
import { plan, planIcs, DEPOSIT_RULE } from "../../src/kits/letting/lib/moveday.js";
import { valuationText, checklistText } from "../../src/kits/letting/lib/owners.js";
import { repairText } from "../../src/kits/letting/lib/repairs.js";
import { HOME_PARTS, homeOrderProblem } from "../../src/kits/letting/home.js";
import { pageData, csp } from "../../src/kits/letting/kit.js";
import { demoCsv } from "../../src/demo/letting-provider.js";

const demo = JSON.parse(readFileSync("sites/demos/letting/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-letting-client/site.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const TZ = "Europe/London";
const NOW = Date.parse("2026-11-16T10:00:00Z"); // a Monday morning
const CFG = { staleAfterHours: 36, buildings: [{ id: "b", floors: ["G", "1"] }] };
const HEAD = "ref,building,floor,name,status,rent_pcm,beds,baths,size_m2,available_from,council_tax,epc,furnished,parking,broadband,mobile,heating,outside,pets,notes,updated_at";

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("the rules carry their GOV.UK source and the dates they were updated and checked", () => {
  assert.equal(RULES.source, "https://www.gov.uk/guidance/fees-you-can-charge-as-part-of-a-tenancy");
  assert.match(RULES.updated, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(RULES.checked, /^\d{4}-\d{2}-\d{2}$/);
});

test("deposits: five weeks below £50,000 a year, six from £50,000, outside the rules only above £100,000", () => {
  // £4,166 a month is £49,992 a year: five weeks
  const m = moveIn(4166);
  assert.equal(m.outside, false);
  assert.equal(m.depositWeeks, 5);
  assert.equal(m.deposit, Math.floor((4166 * 12) / 52 * 5));
  // £4,167 a month is £50,004 a year: six weeks
  assert.equal(/** @type {any} */ (moveIn(4167)).depositWeeks, 6);
  // exactly £50,000 a year (as a whole-pound monthly rent can't be, so check the yearly rule through the cap)
  assert.equal(/** @type {any} */ (moveIn(50000 / 12)).depositWeeks, 6);
  // exactly £100,000 a year is still inside the rules; anything more is outside
  assert.equal(moveIn(100000 / 12).outside, false);
  assert.equal(moveIn(8334).outside, true); // £100,008 a year
});

test("holding deposit is one week, rounded down so it never exceeds the cap; the first month is the rent", () => {
  const m = /** @type {any} */ (moveIn(1150));
  assert.equal(m.holding, Math.floor((1150 * 12) / 52)); // £265.38 → £265
  assert.equal(m.first, 1150);
  assert.equal(m.beforeKeys, m.deposit + 1150);
  assert.ok(m.holding <= (1150 * 12) / 52);
  assert.ok(m.deposit <= ((1150 * 12) / 52) * 5);
});

test("an agent asking for less than the cap gets its own figure; more than the cap is refused in settings", () => {
  assert.equal(/** @type {any} */ (moveIn(1000, { depositWeeksBelow: 4 })).depositWeeks, 4);
  assert.equal(/** @type {any} */ (moveIn(1000, { depositWeeksBelow: 9 })).depositWeeks, 5); // never above the cap
  assert.match(tenantTermsProblem({ depositWeeksBelow: 6 }) ?? "", /depositWeeksBelow/);
  assert.match(tenantTermsProblem({ depositWeeksFrom: 7 }) ?? "", /depositWeeksFrom/);
  assert.match(tenantTermsProblem({ holdingWeeks: 2 }) ?? "", /holdingWeeks/);
  assert.match(tenantTermsProblem({ changeFee: 75 }) ?? "", /changeFee/);
  assert.equal(tenantTermsProblem({ holdingWeeks: 1, depositWeeksBelow: 5, depositWeeksFrom: 6, changeFee: 50 }), null);
  assert.match(errorsFor((s) => { s.fees.tenant.depositWeeksBelow = 6; }), /Tenant Fees Act/);
});

test("the tenant's side in words, and 'Ask us' above £100,000 a year", () => {
  const t = tenantSide(6250);
  assert.deepEqual(t.rows.map((r) => r[1]), ["£1,442", "£8,653", "£6,250"]);
  assert.equal(t.total, "£14,903");
  assert.match(t.note, /Six weeks applies from £50,000 a year/);
  assert.equal(tenantSide(9000).total, "Ask us");
  assert.equal(rentFrom("£6,250 pcm"), 6250);
  assert.equal(rentFrom(""), 0);
});

test("the owner's side: a monthly percentage, or a share of a year's rent once", () => {
  assert.deepEqual(landlordView(2000, { basis: "monthly", percent: 18 }), { basis: "monthly", base: 2000, fee: 360, net: 1640 });
  const once = ownerSide(2000, { basis: "year-once", percent: 12 });
  assert.deepEqual(once.rows, [["A year's rent", "£24,000.00"], ["Our fee once, 12% with VAT", "−£2,880.00"]]);
  assert.equal(once.total, "£2,000");
});

test("the sheet: free homes need a rent, a council tax band and an EPC; unknown buildings and floors are left out", () => {
  const csv = [HEAD,
    "A,b,1,Flat A,available,1500,2,1,70,now,C,C,,,,,,,,,2026-11-16 09:15",
    "B,b,1,Flat B,available,,2,1,70,now,C,C,,,,,,,,,2026-11-16 09:15", // no rent
    "C,b,1,Flat C,available,1500,2,1,70,now,,C,,,,,,,,,2026-11-16 09:15", // no council tax band
    "D,b,9,Flat D,available,1500,2,1,70,now,C,C,,,,,,,,,2026-11-16 09:15", // no such floor
    "E,x,1,Flat E,available,1500,2,1,70,now,C,C,,,,,,,,,2026-11-16 09:15", // no such building
    "F,b,G,Flat F,let,,1,1,40,,,,,,,,,,,,2026-11-16 09:15",
  ].join("\n");
  const r = homesFromCsv(csv, NOW, TZ, CFG);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.deepEqual(r.homes.map((h) => h.ref), ["A", "F"]);
  assert.deepEqual(freeOn(r.homes, "b", "1").map((h) => h.ref), ["A"]);
  assert.equal(partA(r.homes[0]), "Holding deposit £346 · Deposit £1,730 (5 weeks) · Council tax C · EPC C");
  assert.equal(sqft(70), 753);
});

test("the sheet fails closed: stale, unreadable, empty or missing columns show nothing as free", () => {
  const old = [HEAD, "A,b,1,Flat A,available,1500,2,1,70,now,C,C,,,,,,,,,2026-11-14 17:40"].join("\n");
  assert.deepEqual(homesFromCsv(old, NOW, TZ, CFG), { ok: false, reason: "stale" });
  assert.deepEqual(homesFromCsv(old, Date.parse("2026-11-15T12:00:00Z"), TZ, CFG).ok, true); // under 36 hours
  assert.deepEqual(homesFromCsv(HEAD + "\nA,b,1,Flat A,available,1500,2,1,70,now,C,C,,,,,,,,,yesterday", NOW, TZ, CFG), { ok: false, reason: "unreadable" });
  assert.deepEqual(homesFromCsv("ref,name\nA,B", NOW, TZ, CFG), { ok: false, reason: "unreadable" });
  assert.deepEqual(homesFromCsv(HEAD, NOW, TZ, CFG), { ok: false, reason: "empty" });
});

test("the demo sheet is written on the day: office hours, and three days old with #stale", () => {
  const cfg = { staleAfterHours: 36, buildings: demo.homes.buildings };
  const at = (/** @type {string} */ iso, /** @type {boolean} */ stale) => homesFromCsv(demoCsv(Date.parse(iso), TZ, stale), Date.parse(iso), TZ, cfg);
  const morning = at("2026-11-16T10:00:00Z", false);
  assert.equal(morning.ok, true);
  if (morning.ok) {
    assert.equal(updatedText(morning.updatedAt, Date.parse("2026-11-16T10:00:00Z"), TZ), "Updated 09:15 today");
    assert.equal(morning.homes.filter((h) => h.building === "sjw" && h.status === "available").length, 5);
  }
  const early = at("2026-11-16T07:00:00Z", false);
  if (early.ok) assert.equal(updatedText(early.updatedAt, Date.parse("2026-11-16T07:00:00Z"), TZ), "Updated 17:40 yesterday");
  assert.deepEqual(at("2026-11-16T10:00:00Z", true), { ok: false, reason: "stale" });
});

test("settings: fees always on, both schemes, real numbers on a client and a copy of the CMP certificate", () => {
  assert.match(errorsFor((s) => { s.features = s.features.filter((/** @type {string} */ f) => f !== "letting-fees"); }), /letting-fees/);
  assert.match(errorsFor((s) => { s.schemes.redress.name = "A scheme of our own"; }), /government-approved/);
  assert.match(errorsFor((s) => { s.schemes.cmp.member = "123456"; }), /demo sites are fictional/);
  assert.match(errorsFor((s) => { s.schemes.cmp.member = "000000"; }, client), /demo number/);
  assert.match(errorsFor((s) => { delete s.schemes.cmp.certificate; }, client), /certificate/);
  assert.match(errorsFor((s) => { s.homes.source = "simulated"; }, client), /Google Sheet/);
  assert.match(errorsFor((s) => { s.homes.csvUrl = "https://example.com/homes.csv"; }, client), /published CSV/);
  assert.match(errorsFor((s) => { s.homes.buildings[0].floors[1].units.push("GA"); }), /in two places/);
  assert.match(errorsFor((s) => { delete s.homes.buildings[0].model; }), /model/);
  assert.match(errorsFor((s) => { s.fees.services[0].percent = 120; }), /percentage/);
  assert.match(errorsFor((s) => { s.fees.services[0].basis = "weekly"; }), /monthly/);
  assert.match(errorsFor((s) => { s.fees.tenant.extra = 1; }), /unknown setting/);
});

test("home order, page data and the security policy", () => {
  assert.equal(homeOrderProblem(Object.keys(HOME_PARTS)), null);
  assert.match(homeOrderProblem(["letting-net"]) ?? "", /leaves out/);
  const d = pageData(demo);
  assert.equal(d.homes.hero, "sjw");
  assert.equal(d.homes.buildings.length, 3);
  assert.equal(d.fees.example, 6250);
  assert.equal(csp(demo).sheets, false);
  assert.equal(csp(client).sheets, true);
});

test("a repair report: one message, empty answers left out; the out-of-hours number must be a UK number", () => {
  assert.equal(repairText("Hello, a repair.", { home: "Flat 2", what: "Tap drips", where: "", keys: "Yes, you may use your keys" }),
    "Hello, a repair.\nHome: Flat 2\nWhat's wrong: Tap drips\nAccess: Yes, you may use your keys");
  assert.match(errorsFor((s) => { s.repairs.outOfHours = "07700 900000"; }), /outOfHours/);
});

test("move-in planner: dates from the keys day, timed steps first, the deposit check 30 days after it was paid", () => {
  const steps = [{ id: "meters", label: "Meters", offset: 0 }, { id: "checkin", label: "Check-in", offset: 0, time: "10:00" }, { id: "council", label: "Council tax", offset: 1 }];
  const p = plan("2026-12-01", steps);
  assert.deepEqual(p.map((x) => x.id), ["checkin", "meters", "council", "deposit"]);
  assert.equal(p[3].date, "2026-12-31");
  assert.equal(p[0].when, "Tuesday 1 December 2026");
  assert.equal(plan("2026-12-01", steps, "2026-11-20").at(-1)?.date, "2026-12-20"); // paid earlier: 30 days from then
  assert.equal(plan("2026-12-01", steps, "2026-12-09").at(-1)?.date, "2026-12-31"); // a later "paid" date is ignored
  assert.deepEqual(plan("2026-02-30", steps), []);
  assert.equal(DEPOSIT_RULE.days, 30);
  const ics = planIcs({ planned: p, agent: "Halvern", place: "Halvern, High Street, London", stamp: "20261116T100000Z", tz: "Europe/London" });
  assert.match(ics, /DTSTART;TZID=Europe\/London:20261201T100000/);
  assert.match(ics, /DTEND;TZID=Europe\/London:20261201T110000/);
  assert.match(ics, /DTSTART;VALUE=DATE:20261231/);
  assert.match(ics, /BEGIN:VTIMEZONE\r\nTZID:Europe\/London/);
  assert.ok(ics.indexOf("END:VTIMEZONE") < ics.indexOf("BEGIN:VEVENT"));
  // folded by UTF-8 bytes: a long note full of £ and curly quotes never passes 75 bytes a line
  const long = planIcs({ planned: plan("2026-12-01", [{ id: "x", label: "Pay £1,000 “before” the keys ".repeat(8), offset: 0 }]), agent: "Halvern", place: "Here", stamp: "20261116T100000Z", tz: "Europe/London" });
  const enc = new TextEncoder();
  assert.ok(long.split("\r\n").every((l) => enc.encode(l).length <= 75));
  assert.doesNotMatch(long, /VTIMEZONE/); // nothing timed, all-day only
});

test("valuation request and onboarding checklist: messages only, no figure", () => {
  const t = valuationText("Hello, a valuation please.", { address: "Flat 2, Park Row", postcode: "ls1 5hd", kind: "Flat", beds: "2", baths: "1", size: "70", unit: "m2", outside: "Balcony", furnished: "", when: "", service: "Fully managed" });
  assert.equal(t, "Hello, a valuation please.\n\nAddress: Flat 2, Park Row, LS1 5HD\nThe home: 2 bedrooms, 1 bathroom, flat, about 70 m²\nOutside: Balcony\nInterested in: Fully managed");
  assert.doesNotMatch(t, /£/);
  assert.equal(checklistText("Hi", ["EPC"], ["Gas safety record"]), "Hi\n\nReady:\n- EPC\n\nStill to sort:\n- Gas safety record");
});

test("new pages' settings: real owners only on a client, GOV.UK sources, areas' buildings and slugs", () => {
  const withStories = (/** @type {any} */ s) => { s.features.push("letting-stories"); s.plan = "signature"; s.stories = structuredClone(demo.stories); };
  assert.match(errorsFor((s) => { withStories(s); }, client), /consent/);
  assert.equal(errorsFor((s) => { withStories(s); s.stories.items.forEach((/** @type {any} */ x) => { x.consent = true; }); }, client).includes("consent"), false);
  assert.match(errorsFor((s) => { s.journal.items[0].sources[0].url = "https://example.com/rules"; }), /GOV.UK/);
  assert.match(errorsFor((s) => { s.journal.items[0].checked = "15 Nov"; }), /YYYY-MM-DD/);
  assert.match(errorsFor((s) => { s.areas.items[0].buildings = ["nowhere"]; }), /no building/);
  assert.match(errorsFor((s) => { s.areas.items[0].slug = "fees"; }), /already a page/);
  assert.match(errorsFor((s) => { s.journal.items[0].slug = "kensington"; }), /already an area/);
  assert.match(errorsFor((s) => { s.areas.items[0].notes = s.areas.items[0].notes.slice(0, 2); }), /thin/);
  assert.match(errorsFor((s) => { s.moveday.steps[0].id = "deposit"; }), /deposit/);
  assert.match(errorsFor((s) => { s.moveday.steps[0].offset = 90; }), /-60 to 60/);
});
