import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lightingQuote, estimateRange, evCheck, cablePrice, houseQuote, quoteText, pounds } from "../../src/kits/electrician/lib/quotes.js";
import { cleanCode, certsFromCsv, nextInspection, inspectionIcs, ukDate } from "../../src/kits/electrician/lib/certificates.js";
import { HOME_PARTS, homeOrderProblem, onPagesProblem } from "../../src/kits/electrician/home.js";
import { ROOMS, SCENE_LEVELS } from "../../src/kits/electrician/lib/house.js";
import { validateSite } from "../../src/core/lib/config.js";
import { headersFile } from "../../src/core/lib/seo.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/electrician/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-electrician-client/site.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("the look's home order and pages are complete and allowed", () => {
  const look = catalog.looks.bluehour;
  assert.equal(homeOrderProblem(look.homeOrder), null);
  assert.equal(onPagesProblem(look.onPages), null);
  assert.match(String(homeOrderProblem(Object.keys(HOME_PARTS).slice(1))), /leaves out/);
  assert.match(String(onPagesProblem({ "projects-page": ["circuits"] })), /only/);
});

test("the room designer prices only the client's own fittings, with one keypad for two layers or more", () => {
  const d = demo.designer;
  const one = lightingQuote(d, "m", ["down"]);
  assert.deepEqual(one.lines, [{ name: "Downlights", count: 8, each: 145, total: 1160 }]);
  assert.equal(one.total, 1160);
  const two = lightingQuote(d, "m", ["down", "wall"]);
  assert.equal(two.lines.at(-1)?.name, "A scene keypad");
  assert.equal(two.total, 1160 + 4 * 260 + 420);
  assert.deepEqual(lightingQuote(d, "m", []).lines, []);
  assert.equal(quoteText(two.lines).split("\n")[0], "8 × Downlights: £1,160");
});

test("the estimate is a range rounded out to £50, never a single price, and needs a choice", () => {
  const e = demo.estimate;
  const r = estimateRange(e, "terrace", 3, ["rewire"]);
  assert.deepEqual([r?.min, r?.max], [3200 + 3 * 1100, 4200 + 3 * 1500]);
  const flat = estimateRange(e, "flat", 2, ["rewire"]);
  assert.equal((flat?.min ?? 1) % 50, 0); assert.equal((flat?.max ?? 1) % 50, 0);
  assert.ok((flat?.min ?? 0) <= (3200 + 2200) * 0.8 && (flat?.max ?? 0) >= (4200 + 3000) * 0.8);
  assert.equal(estimateRange(e, "terrace", 3, []), null);
  assert.equal(estimateRange(e, "castle", 3, ["rewire"]), null);
  const big = estimateRange(e, "terrace", 40, ["rewire"]);
  assert.equal(big?.min, 3200 + 7 * 1100, "bedrooms are capped at the client's limit");
});

test("the EV check: a drive and a short run is standard at the client's price; anything uncertain is a survey, never a yes", () => {
  const ev = demo.ev;
  const std = evCheck(ev, { parking: "drive", metres: 8, fuse: 100, loads: 0 });
  assert.deepEqual([std.verdict, std.price, std.reasons.length], ["standard", 1195, 0]);
  const longer = evCheck(ev, { parking: "drive", metres: 14, fuse: 100, loads: 0 });
  assert.deepEqual([longer.verdict, longer.extraMetres, longer.price], ["standard", 4, 1195 + 4 * 28]);
  assert.equal(evCheck(ev, { parking: "drive", metres: 8, fuse: 0, loads: 0 }).verdict, "survey");
  assert.equal(evCheck(ev, { parking: "drive", metres: 8, fuse: 60, loads: 0 }).verdict, "survey");
  assert.equal(evCheck(ev, { parking: "drive", metres: 8, fuse: 100, loads: 1 }).verdict, "survey");
  const far = evCheck(ev, { parking: "drive", metres: 45, fuse: 100, loads: 0 });
  assert.deepEqual([far.verdict, far.price], ["survey", null]);
  assert.equal(evCheck(ev, { parking: "street", metres: 5, fuse: 100, loads: 0 }).verdict, "no");
  assert.equal(evCheck(ev, { parking: "shared", metres: 5, fuse: 100, loads: 0 }).verdict, "no");
  assert.deepEqual(cablePrice(ev, 10.2), { extraMetres: 1, price: 1195 + 28 });
});

test("the house in 3D prices the fittings in the lit rooms only, and knows every room it is given", () => {
  const h = demo.house3d;
  for (const r of h.rooms) assert.ok(r.id in ROOMS);
  const none = houseQuote(h.types, h.rooms, []);
  assert.equal(none.total, 0);
  const kitchen = houseQuote(h.types, h.rooms, ["kitchen"]);
  assert.equal(kitchen.total, 6 * 145 + 2 * 340 + 220 + 420);
  const cinema = Object.keys(SCENE_LEVELS.cinema);
  assert.ok(cinema.includes("cinema") && (SCENE_LEVELS.cinema.cinema ?? 1) < 0.5, "the cinema scene keeps the cinema low");
  assert.equal(pounds(10395), "£10,395");
});

test("certificates: codes are cleaned, rows for other codes and bad rows are never shown, newest first", () => {
  assert.equal(cleanCode(" hx7-q2m "), "HX7Q2M");
  assert.equal(cleanCode("abc"), "");
  const csv = "code,kind,issued,next_due,note\nHX7Q2M,eicr,2021-03-14,2026-03-14,Satisfactory\nHX7Q2M,part-p,2022-01-05,,Kitchen\nHX7Q2M,ghost,2023-01-01,,Unknown kind\nHX7Q2M,eic,2023-02-30,,Impossible date\nAAA111,eicr,2024-01-01,,Someone else";
  const r = certsFromCsv(csv, "HX7Q2M");
  assert.ok(r.ok);
  if (r.ok) assert.deepEqual(r.certs.map((c) => c.kind), ["part-p", "eicr"]);
  assert.deepEqual(certsFromCsv(csv, "ZZZ999"), { ok: false, reason: "unknown" });
  assert.deepEqual(certsFromCsv("name,date\nx,y", "HX7Q2M"), { ok: false, reason: "unreadable" });
});

test("the next inspection: the date on the report, else the client's interval; only for an EICR", () => {
  assert.equal(nextInspection({ kind: "eicr", issued: "2021-03-14", nextDue: "2026-03-14", note: "" }, 10), "2026-03-14");
  assert.equal(nextInspection({ kind: "eicr", issued: "2024-02-29", nextDue: "", note: "" }, 10), "2034-02-28");
  assert.equal(nextInspection({ kind: "part-p", issued: "2024-02-29", nextDue: "", note: "" }, 10), "");
  assert.equal(ukDate("2031-03-14"), "14 March 2031");
});

test("the inspection reminder is a valid calendar file in UTC, weeks before the due date at 10am UK time", () => {
  const ics = inspectionIcs({ due: "2031-07-14", weeksBefore: 6, business: "Corbel Light & Power", phone: "+44 7700 900137", place: "2 Ashgrove Yard, London", code: "HX7Q2M", timeZone: "Europe/London", stamp: new Date("2026-11-02T10:00:00Z") });
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /DTSTART:20310602T090000Z/, "2 June 2031 10:00 BST is 09:00 UTC");
  for (const line of ics.split("\r\n")) assert.ok(new TextEncoder().encode(line).length <= 75, `line too long: ${line}`);
});

test("settings are the client's own and can't mislead", () => {
  assert.match(errorsFor((s) => { s.ev.colour = "red"; }), /ev\.colour: unknown setting/);
  assert.match(errorsFor((s) => { s.registers[0].url = "https://corbel.example/our-badges"; }), /public register/);
  assert.match(errorsFor((s) => { s.registers[0].scheme = "best-electricians"; }), /registers\[0\]\.scheme/);
  assert.match(errorsFor((s) => { s.faultGuide.cases[0].tell.push("Reset the switch on the board."); }), /repair instruction/);
  for (const line of ["Swap the fuse in the plug for a 13 A one.", "Push the trip switch back up.", "Switch the breaker back on.", "Take the cover off the board.", "Try putting the switch back to ON.", "Tighten the loose terminal."]) {
    assert.match(errorsFor((s) => { s.faultGuide.cases[0].tell.push(line); }), /repair instruction/, line);
  }
  assert.match(errorsFor((s) => { s.faultGuide.cases[0].label = "Trip switch down? Push it back up"; }), /cases\[0\]\.label: reads like a repair/);
  assert.match(errorsFor((s) => { s.faultGuide.message = "Hello, I've already reset the board."; }), /faultGuide\.message: reads like a repair/);
  assert.match(errorsFor((s) => { s.faultGuide.safety = "If it trips, reset the RCD and replace the fuse yourself."; }), /faultGuide\.safety: reads like a repair/);
  for (const ok of ["Switch it off at the socket and call us.", "Turn off the main switch, if it's safe to, and keep clear.", "Please don't reset or repair anything yourself; call us now."]) {
    assert.doesNotMatch(errorsFor((s) => { s.faultGuide.safety = ok; }), /faultGuide\.safety/, ok);
  }
  assert.match(errorsFor((s) => { s.ev.grantUrl = "https://grants.example.com"; }), /gov\.uk/);
  assert.match(errorsFor((s) => { s.estimate.works[0].base = { min: 5000, max: 4000 }; }), /max ≥ min/);
  assert.match(errorsFor((s) => { s.house3d.rooms[0].id = "ballroom"; }), /model's rooms/);
  assert.match(errorsFor((s) => { s.dimmer.frames[1].width = 999; }), /same size/);
  assert.match(errorsFor((s) => { s.hero.scenes[0].label = "A VERY LONG KEY NAME"; }), /up to 10 characters/);
  assert.match(errorsFor((s) => { s.certificates.landlord.source = "https://landlords.example"; }), /gov\.uk/);
});

test("a client site never still names the demo business", () => {
  assert.match(errorsFor((s) => { s.ev.message = "Hello Corbel, about a car charger."; }, client), /ev\.message: still names the demo business/);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("simulated certificates are refused on a client site, and the sheet is allowed only when used", () => {
  assert.match(errorsFor((s) => { s.certificates.source = "simulated"; s.certificates.example = "HX7Q2M"; }, client), /only allowed on demo sites/);
  const csp = headersFile(client, "production");
  assert.match(csp, /connect-src[^\n]*docs\.google\.com/);
  const noSheet = structuredClone(client); noSheet.features = noSheet.features.filter((/** @type {string} */ f) => f !== "certificates"); noSheet.addons = [];
  assert.doesNotMatch(headersFile(noSheet, "production"), /docs\.google\.com/);
  assert.match(headersFile(demo, "preview"), /wasm-unsafe-eval/, "the 3D charger's car needs its decoder");
});
