import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { priceLabel, factLines, specLine, claimIn, countWords, shortlist, partyTotal } from "../../src/kits/jeweller/lib/pieces.js";
import { sizeFromCircumference, sizeFromDiameter, pxPerMm, UK_SIZES, CARD_MM } from "../../src/kits/jeweller/lib/sizes.js";
import { appointmentText, hintText, trayText, briefText, proposalText, engraving, longDate, partyText, giftText } from "../../src/kits/jeweller/lib/messages.js";
import { nextYearly, anniversaryIcs, aftercareIcs } from "../../src/kits/jeweller/lib/reminders.js";
import { appointmentDays, slotsWithin, occasionOrder } from "../../src/kits/jeweller/lib/calendar.js";
import { HOME_PARTS, HOME_ELSEWHERE, homeOrderProblem } from "../../src/kits/jeweller/home.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const root = new URL("../..", import.meta.url).pathname;
const catalog = loadCatalog(root);
const load = (/** @type {string} */ rel) => JSON.parse(readFileSync(path.join(root, rel, "site.json"), "utf8"));
const check = (/** @type {any} */ site, /** @type {string} */ rel) => validateSite(site, { catalog, fileExists: (f) => existsSync(path.join(root, rel, f)) });
const DEMO = "sites/demos/jeweller";
const CLIENT = "tests/fixtures/sites/test-jeweller-client";

test("a price shows only as the client sets it", () => {
  assert.equal(priceLabel({ price: 4200 }), "£4,200");
  assert.equal(priceLabel({ price: 18500, priceFrom: true }), "From £18,500");
  assert.equal(priceLabel({ onRequest: true }), "Price on request");
  assert.equal(priceLabel({}), "");
});

test("facts: only the ones the client filled, in a fixed order; the spec line from metal, carat and cut", () => {
  const p = { facts: { carat: "1.01 ct", metal: "Platinum", stones: " ", cut: "Oval" } };
  assert.deepEqual(factLines(p), [["Metal", "Platinum"], ["Carat", "1.01 ct"], ["Cut", "Oval"]]);
  assert.equal(specLine(p), "Platinum · 1.01 ct · Oval");
  assert.equal(countWords(3), "Three pieces");
  assert.equal(countWords(14), "14 pieces");
});

test("claim words are recognised and tied to the field they belong in", () => {
  assert.equal(claimIn("Fully hallmarked in London"), "hallmark");
  assert.equal(claimIn("Comes with a GIA report"), "certificate");
  assert.equal(claimIn("Conflict-free and recycled gold"), "sourcing");
  assert.equal(claimIn("Lab-grown centre stone"), "sourcing");
  assert.equal(claimIn("A lifetime guarantee"), "aftercare");
  assert.equal(claimIn("Four claws on a tapered band"), null);
});

test("ring sizes: nearest UK letter from a length or a diameter; off the chart says so", () => {
  assert.equal(UK_SIZES.length, 19);
  assert.equal(sizeFromCircumference(51.87)?.letter, "M");
  assert.equal(sizeFromCircumference(52.5)?.between, "M–N");
  assert.equal(sizeFromCircumference(51.9)?.between, null);
  assert.equal(sizeFromDiameter(17.35)?.letter, "O");
  assert.equal(sizeFromCircumference(30), null);
  assert.equal(sizeFromCircumference(80), null);
});

test("screen scale from a bank card: refuses widths no screen gives", () => {
  assert.equal(CARD_MM, 85.6);
  assert.ok(Math.abs(/** @type {number} */ (pxPerMm(428)) - 5) < 1e-9);
  assert.equal(pxPerMm(50), null);
  assert.equal(pxPerMm(5000), null);
});

test("messages are requests, never bookings, and name what the customer chose", () => {
  const a = appointmentText({ house: "Aldous Marr", reason: "An engagement ring", when: "A Saturday", pieces: ["The Solitaire", "The Oval Halo"], name: "Sam" });
  assert.match(a, /request a private appointment/);
  assert.match(a, /The Solitaire, The Oval Halo/);
  assert.match(a, /let me know what you can offer/);
  assert.doesNotMatch(a, /confirm(ed)? (my|the) booking|today/i);
  assert.match(trayText({ house: "Aldous Marr", pieces: ["Pearl Studs"] }), /Pearl Studs/);
  const h = hintText({ house: "Aldous Marr", piece: "Pearl Studs", price: "£480", url: "https://x.example/piece-pearl-studs" });
  assert.match(h, /Pearl Studs \(£480\), from Aldous Marr/);
  assert.match(briefText({ house: "Aldous Marr", kind: "A pendant", by: "2027-02-14" }), /Would like it by: Sunday 14 February/);
  assert.match(proposalText({ house: "Aldous Marr", sizeKnown: false }), /don't know their ring size/);
  assert.match(proposalText({ house: "Aldous Marr", date: "2026-12-24", size: "L" }), /Thursday 24 December[\s\S]*size: L/);
  assert.equal(longDate("2026-11-14"), "Saturday 14 November");
});

test("engraving keeps to the house's letter limit", () => {
  assert.deepEqual(engraving("  Always,   A.", 24), { text: "Always, A.", over: false });
  assert.deepEqual(engraving("x".repeat(30), 24), { text: "x".repeat(24), over: true });
});

test("calendar files: yearly, in UTC, at 10am shop time", () => {
  assert.equal(nextYearly("2019-06-12", "2026-10-29"), "2027-06-12");
  assert.equal(nextYearly("2020-11-02", "2026-10-29"), "2026-11-02");
  assert.equal(nextYearly("2020-02-29", "2026-10-29"), "2027-02-28");
  const stamp = new Date("2026-10-29T12:00:00Z");
  const ics = anniversaryIcs({ date: "2018-06-20", weeksBefore: 4, label: "Our anniversary", business: "Aldous Marr", place: "Mayfair", url: "https://x.example", timeZone: "Europe/London", today: "2026-10-29", stamp });
  assert.match(ics, /DTSTART:20270523T090000Z/); // 10am BST
  assert.match(ics, /RRULE:FREQ=YEARLY/);
  assert.match(ics, /SUMMARY:Our anniversary on 20 June: 4 weeks to go/);
  const winter = aftercareIcs({ collected: "2026-01-10", piece: "My ring", business: "Aldous Marr", place: "Mayfair", timeZone: "Europe/London", stamp, note: "A clean and check" });
  assert.match(winter, /DTSTART:20270110T100000Z/); // 10am GMT
  assert.ok(!/[^\r]\n/.test(ics), "lines end with CRLF");
});

test("appointment days: notice, closed days and exceptions; times inside the hours", () => {
  const hours = { weekly: { sun: [], mon: [], tue: [["10:00", "18:00"]], wed: [["10:00", "18:00"]], thu: [["10:00", "20:00"]], fri: [["10:00", "18:00"]], sat: [["10:00", "17:00"]] }, exceptions: [{ date: "2026-10-31", ranges: [] }] };
  assert.deepEqual(appointmentDays(hours, "2026-10-29", { notice: 1, horizon: 6 }), ["2026-10-30", "2026-11-03", "2026-11-04"]);
  assert.deepEqual(slotsWithin([["10:00", "17:00"]], ["10:30", "15:30", "16:30", "18:00"], 60), ["10:30", "15:30"]);
});

test("occasions: the one on now leads, past ones drop off", () => {
  const list = [{ id: "a", from: "2026-10-01", to: "2026-10-20" }, { id: "b", from: "2026-12-01", to: "2026-12-24" }, { id: "c", from: "2026-10-25", to: "2026-11-09" }, { id: "d", from: "2026-01-01", to: "2027-12-31" }];
  const o = occasionOrder(list, "2026-10-29");
  assert.equal(o.lead?.id, "c");
  assert.deepEqual(o.rest.map((x) => x.id), ["d", "b"]);
  assert.equal(occasionOrder([{ from: "2025-01-01", to: "2025-02-01" }], "2026-10-29").lead, null);
});

test("the Nacre look puts every section once, on the home page or Plan your visit; the home page stays short", () => {
  const look = JSON.parse(readFileSync(path.join(root, "src/looks/nacre/look.json"), "utf8"));
  assert.equal(homeOrderProblem(look.homeOrder, look.visitOrder), null);
  assert.equal(Object.keys(HOME_PARTS).length, look.homeOrder.length + look.visitOrder.length);
  assert.ok(look.homeOrder.length <= 6);
  assert.match(String(homeOrderProblem(["collections"])), /leave out/);
  assert.match(String(homeOrderProblem(["collections"], ["collections"])), /unknown|twice|leave out/);
  for (const id of Object.keys(HOME_ELSEWHERE)) assert.ok(HOME_PARTS[/** @type {keyof typeof HOME_PARTS} */ (id)], id);
});

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(check(load(DEMO), DEMO), []);
  assert.deepEqual(check(load(CLIENT), CLIENT), []);
});

test("a demo can't carry hallmarks, certificates or sourcing claims", () => {
  const site = load(DEMO);
  site.pieces.items[0].facts.hallmark = "Hallmarked in London";
  site.pieces.items[1].facts.sourcing = "Conflict-free";
  const errs = check(site, DEMO).join("\n");
  assert.match(errs, /items\[0\]\.facts\.hallmark: a demo never carries/);
  assert.match(errs, /items\[1\]\.facts\.sourcing: a demo never carries/);
});

test("claims outside their own field are refused, on a client site too", () => {
  const site = load(CLIENT);
  site.pieces.items[1].line = "Ethically sourced, GIA certified";
  site.pieces.items[0].facts.metal = "Recycled 18ct gold";
  site.pieces.items[0].photo.alt = "A hallmarked ring";
  const errs = check(site, CLIENT).join("\n");
  assert.match(errs, /items\[1\]\.line: makes a (certificate|sourcing) claim/);
  assert.match(errs, /items\[0\]\.facts\.metal: makes a sourcing claim; put it in facts\.sourcing/);
  assert.match(errs, /items\[0\]\.photo: makes a hallmark claim/);
});

test("prices, demo data and settings are as the client sets them", () => {
  const site = load(CLIENT);
  site.pieces.demoData = true;
  site.pieces.items[0].onRequest = true; // with a price
  site.pieces.items[1].priceFrom = true; // with no price
  site.pieces.items[2].price = "£650";
  site.pieces.items[2].colour = "gold";
  site.appointments.slots = ["10am"];
  const errs = check(site, CLIENT).join("\n");
  assert.match(errs, /pieces\.demoData: a client site shows only the client's own facts/);
  assert.match(errs, /items\[0\]\.onRequest/);
  assert.match(errs, /items\[1\]\.priceFrom/);
  assert.match(errs, /items\[2\]\.price: a number of pounds/);
  assert.match(errs, /items\[2\]\.colour: unknown setting/);
  assert.match(errs, /appointments\.slots/);
});

test("Signature parts need what they show; references must exist", () => {
  const site = load(DEMO);
  for (const p of site.pieces.items) { delete p.hand; delete p.pairs; delete p.photos; }
  site.bespoke.deposit.pay = "nope";
  site.hero.piece = "missing";
  const errs = check(site, DEMO).join("\n");
  assert.match(errs, /"on-a-hand" is on but no piece has a "hand" photo/);
  assert.match(errs, /"pair-it" is on but no piece lists "pairs"/);
  assert.match(errs, /"the-piece" is on but no piece has macro "photos"/);
  assert.match(errs, /bespoke\.deposit\.pay/);
  assert.match(errs, /hero\.piece/);
});

test("three within a band: priced gift pieces only, the occasion's own first, dearest first", () => {
  const items = [{ id: "a", price: 900, gift: true }, { id: "b", price: 400 }, { id: "c", price: 950, onRequest: true }, { id: "d" }, { id: "e", price: 700, gift: true }, { id: "f", price: 300 }, { id: "g", price: 1200 }];
  assert.deepEqual(shortlist(items, { max: 999 }).map((p) => p.id), ["a", "e"]);
  assert.deepEqual(shortlist(items, { max: 999 }, ["f", "c"]).map((p) => p.id), ["f", "a", "e"]);
  assert.deepEqual(shortlist(items, { min: 1000 }).map((p) => p.id), []);
  assert.deepEqual(shortlist(items, { min: 1000 }, ["g"]).map((p) => p.id), ["g"]);
});

test("a bridal party order: the count, the total at listed prices, and a request that names each role", () => {
  assert.deepEqual(partyTotal([{ n: 5, price: 480 }, { n: 2, price: 2600 }, { n: 0 }]), { count: 7, total: 7600 });
  assert.deepEqual(partyTotal([{ n: 5, price: 480 }, { n: 1, onRequest: true, price: 10 }]), { count: 6, total: null });
  assert.deepEqual(partyTotal([{ n: 0, price: 480 }]), { count: 0, total: null });
  const t = partyText({ house: "Aldous Marr", date: "2027-06-12", rows: [{ role: "bridesmaids", piece: "Pearl Studs", n: 5 }, { role: "flower girls", piece: "Pearl Studs", n: 0 }], names: "Ana, Bea" });
  assert.match(t, /pieces for my bridal party[\s\S]*The wedding: Saturday 12 June[\s\S]*5 × Pearl Studs, for bridesmaids/);
  assert.doesNotMatch(t, /flower girls/);
  assert.match(t, /Names for the boxes: Ana, Bea[\s\S]*if they can be ready in time/);
});

test("the gift, arranged, and the appointment day: requests that carry the customer's own choices", () => {
  const g = giftText({ house: "Aldous Marr", occasion: "Valentine's", piece: "Pearl Studs", by: "2027-02-13", card: "Always" });
  assert.match(g, /arrange a gift for Valentine's[\s\S]*The piece: Pearl Studs[\s\S]*I need it by: Saturday 13 February[\s\S]*"Always"[\s\S]*how to pay/);
  const a = appointmentText({ house: "Aldous Marr", day: "2026-11-14", time: "12:00", when: "A Saturday" });
  assert.match(a, /The day I'd like: Saturday 14 November at 12:00, or the nearest you can offer/);
  assert.doesNotMatch(a, /When suits/);
});

test("calendar lines are folded at 75 octets; the shortlist goes in the reminder", () => {
  const ics = anniversaryIcs({ date: "2018-06-20", weeksBefore: 4, label: "Our anniversary", business: "Aldous Marr", place: "Mayfair", url: "https://x.example", timeZone: "Europe/London", today: "2026-10-29", stamp: new Date("2026-10-29T12:00:00Z"), ideas: ["The Sapphire Halo, £7,900: https://x.example/piece-sapphire-halo"] });
  for (const line of ics.split("\r\n")) assert.ok(new TextEncoder().encode(line).length <= 75, line);
  assert.match(ics.replace(/\r\n /g, ""), /Your shortlist from Aldous Marr:\\nThe Sapphire Halo\\, £7\\,900/);
});

test("the date picker needs the house's own times and its bank-holiday rule; a party needs its pieces", () => {
  const site = load(DEMO);
  delete site.appointments.bankHolidays;
  site.appointments.notice = 45;
  site.party.pieces = ["nope"];
  site.party.max = 0;
  const errs = check(site, DEMO).join("\n");
  assert.match(errs, /appointments\.bankHolidays: the date picker is on/);
  assert.match(errs, /appointments\.notice/);
  assert.match(errs, /party\.pieces\[0\]: no piece "nope"/);
  assert.match(errs, /party\.max/);
  const off = load(DEMO);
  off.features = off.features.filter((/** @type {string} */ f) => f !== "date-range");
  delete off.appointments.bankHolidays;
  assert.match(check(off, DEMO).join("\n"), /appointments\.when/);
});
