import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CARS, fits, pickBay, spareCm, answer, reserveMessage, bayRects, route, along, cone, clockWords, chargedBy, chargerWords, planSvg, addDays, icsFile, moveInEvents, layingUpEvents, fleetMessage, careCardMessage, nightBayLine, withFree, baysFromCsv, updatedWords } from "../../src/kits/garage/lib/garage.js";
import { HOME_PARTS, homeOrderProblem } from "../../src/kits/garage/home.js";
import { frameMap } from "../../src/kits/garage/features/garage-aerial/map.js";
import { pageData } from "../../src/kits/garage/kit.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/elsden/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-garage-client/site.json", "utf8"));
const look = JSON.parse(readFileSync("src/looks/elsden/look.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const hall = demo.hall;

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("the look's home order lists every section once", () => {
  assert.equal(homeOrderProblem(look.homeOrder), null);
  assert.match(homeOrderProblem(look.homeOrder.slice(1)) ?? "", /leaves out/);
  assert.equal(Object.keys(HOME_PARTS).length, look.homeOrder.length);
});

test("a car fits with 30 cm either side (40 cm from 1.95 m wide) and 20 cm to spare in length", () => {
  assert.equal(fits(CARS.estate, { n: 1, width: 2.45 }, 5.2), true);
  assert.equal(fits(CARS.estate, { n: 1, width: 2.44 }, 5.2), false);
  assert.equal(fits(CARS.suv, { n: 1, width: 2.6 }, 5.2), false);
  assert.equal(fits(CARS.suv, { n: 1, width: 2.8 }, 5.2), true);
  assert.equal(fits(CARS.van, { n: 1, width: 3 }, 5.2), false, "5.4 m won't go in a 5.2 m bay");
});

test("each car gets the first free bay that fits, in the hall's own order", () => {
  assert.equal(pickBay(hall, CARS.hatch)?.n, 4);
  assert.equal(pickBay(hall, CARS.estate)?.n, 7);
  assert.equal(pickBay(hall, CARS.suv)?.n, 14);
  assert.equal(pickBay(hall, CARS.van), null);
  assert.equal(spareCm(CARS.estate, { n: 7, width: 2.6 }), 38);
});

test("the answer names the bay, the room either side and the charger; a van gets the waiting list", () => {
  assert.equal(answer(CARS.estate, pickBay(hall, CARS.estate), 5.2).text, "Bay 7 takes it, with 38 cm either side. Free now, with a 7 kW charger.");
  assert.equal(answer(CARS.hatch, pickBay(hall, CARS.hatch), 5.2).text, "Bay 4 takes it, with 30 cm either side. Free now.");
  assert.match(answer(CARS.van, null, 5.2).text, /^No free bay takes a van tonight: our bays are 5\.2 m deep\. Join the waiting list/);
  assert.equal(reserveMessage("Elsden", CARS.estate, { n: 7, width: 2.6 }), "Hello Elsden, I’d like to reserve bay 7 for my family estate.");
  assert.match(reserveMessage("Elsden", CARS.van, null), /waiting list/);
});

test("the live list: free bays from the client's sheet, failing closed", () => {
  const known = [1, 2, 3, 4, 7], now = Date.parse("2026-11-18T09:00:00Z"), read = (/** @type {string} */ t) => (/^\d{4}-\d\d-\d\d \d\d:\d\d$/.test(t) ? Date.parse(t.replace(" ", "T") + ":00Z") : NaN);
  const csv = "Bay,Status,Updated at\n1,let,2026-11-18 08:40\n4,free,2026-11-18 08:40\n7,FREE,2026-11-18 08:10\n";
  assert.deepEqual(baysFromCsv(csv, known, now, 24, read), { ok: true, free: [4, 7], updatedAt: Date.parse("2026-11-18T08:40:00Z") });
  assert.equal(baysFromCsv(csv.replace("1,let", "9,let"), known, now, 24, read).ok, false, "a bay the hall doesn't have");
  assert.equal(baysFromCsv(csv.replace("4,free", "4,maybe"), known, now, 24, read).ok, false, "a status it can't read");
  assert.equal(baysFromCsv(csv.replace("2026-11-18 08:40\n4", "soon\n4"), known, now, 24, read).ok, false, "a time it can't read");
  assert.equal(baysFromCsv(csv, known, now + 25 * 3_600_000, 24, read).ok, false, "older than a day");
  assert.equal(baysFromCsv("bay,status\n4,free\n", known, now, 24, read).ok, false, "no updated_at column");
  const live = withFree(hall, [9]);
  assert.equal(pickBay(live, CARS.hatch)?.n, 9, "bay 4 let today, so the hatchback goes to 9");
  assert.equal(pickBay(live, CARS.estate), null);
  assert.equal(withFree(hall, null), hall);
  assert.equal(updatedWords(Date.parse("2026-11-18T08:40:00Z"), now, "Europe/London"), "Updated 08:40");
  assert.equal(updatedWords(Date.parse("2026-11-17T18:05:00Z"), now, "Europe/London"), "Updated yesterday, 18:05");
});

test("arriving at night names the charger only when the bay has one, and the car when there's no bay", () => {
  assert.equal(nightBayLine(CARS.estate, pickBay(hall, CARS.estate)), "Bay 7 is lit and waiting, its charger on.");
  assert.equal(nightBayLine(CARS.hatch, pickBay(hall, CARS.hatch)), "Bay 4 is lit and waiting.");
  assert.equal(nightBayLine(CARS.van, null), "No free bay takes a van tonight: join the waiting list.");
  assert.equal(nightBayLine(CARS.suv, null), "No free bay takes a large SUV tonight: join the waiting list.");
});

test("bays sit where the plan puts them, north row against the north wall", () => {
  const r = bayRects(hall);
  assert.deepEqual([r[1].x0, r[1].y1, r[1].north], [0.88, 16.5, true]);
  assert.equal(+r[7].cx.toFixed(2), 17.18);
  assert.deepEqual([r[8].y0, r[8].y1, r[8].north], [0, 5.2, false]);
  assert.equal(+r[14].x1.toFixed(2), 18.68);
});

test("the drive starts outside the gate, runs along the aisle and ends nose first in the bay", () => {
  const r = route(hall, 7), P = r.points, end = P[P.length - 1];
  assert.ok(P[0][0] < 0 && P[0][1] === hall.depth / 2, "starts outside, on the aisle's line");
  assert.deepEqual(end, [17.18, 13.9]);
  const last = along(r, r.lengths[r.lengths.length - 1]);
  assert.ok(last.dx === 0 && last.dy > 0, "faces the north wall when parked");
  const south = along(route(hall, 14), Infinity);
  assert.ok(south.dy < 0, "a south-row bay is entered heading south");
  for (let i = 1; i < r.lengths.length; i++) assert.ok(r.lengths[i] >= r.lengths[i - 1]);
});

test("camera coverage is a fan from the camera", () => {
  const c = cone({ x: 10, y: 5, facing: 90 });
  assert.deepEqual(c[0], [10, 5]);
  assert.equal(c.length, 18);
  assert.ok(c.slice(1).every(([, y]) => y > 5), "facing north, the fan is north of the camera");
});

test("charging is said as the client set it", () => {
  assert.equal(clockWords("22:00"), "10pm");
  assert.equal(clockWords("07:30"), "7.30am");
  assert.equal(clockWords("12:00"), "12pm");
  assert.equal(chargedBy(demo.charging), "Plug in by 10pm, charged by 7am.");
  assert.equal(chargerWords(hall), "Six bays with chargers: five at 7 kW, bay 14 at 22 kW.");
});

test("the drawn plan carries every bay, the chargers and the cameras, and no raw colour", () => {
  const svg = planSvg(hall, { cameras: demo.security.cameras });
  assert.equal((svg.match(/data-bay="/g) ?? []).length, 14);
  assert.equal((svg.match(/data-charger="/g) ?? []).length, 6);
  assert.equal((svg.match(/data-camera="/g) ?? []).length, 4);
  assert.equal((svg.match(/class="gp-bay is-free"/g) ?? []).length, 5);
  assert.doesNotMatch(svg, /fill="#|stroke="#/);
});

test("calendar files: moving in and laying up, dated from the visitor's days", () => {
  assert.equal(addDays("2026-12-30", 3), "2027-01-02");
  const ev = moveInEvents("2026-12-01", demo.moveIn.steps);
  assert.deepEqual(ev.map((e) => e.date), ["2026-11-28", "2026-11-30", "2026-12-01", "2026-12-01", "2026-12-29"]);
  const ics = icsFile("Elsden", ev, "20261117T090000Z");
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, 5);
  assert.match(ics, /DTSTART;VALUE=DATE:20261201\r\nDTEND;VALUE=DATE:20261202/);
  assert.match(ics, /SUMMARY:Send a photo of your driving licence and the car’s V5C/);
  const lu = layingUpEvents("2026-12-01", "2027-03-01", { every: 30, visit: "Check", back: "Back" });
  assert.deepEqual(lu.map((e) => e.date), ["2026-12-31", "2027-01-30", "2027-03-01"]);
  assert.deepEqual(layingUpEvents("2027-03-01", "2026-12-01", { every: 30, visit: "Check", back: "Back" }), []);
});

test("the business enquiry and the care card ask in one message", () => {
  assert.equal(fleetMessage("Elsden", { company: "Hale Couriers", vehicles: "Four to ten", when: "Every hour", invoice: true, note: " Two vans. " }),
    "Hello Elsden, a business enquiry from Hale Couriers. Vehicles: Four to ten. Access: Every hour. We’d like a monthly invoice. Two vans.");
  assert.equal(careCardMessage("Elsden", 7), "Hello Elsden, could you send this month’s check for the car in bay 7?");
});

test("the aerial frame maps hall metres onto the renders, desktop and phone", () => {
  const d = pageData(demo);
  const desk = frameMap(d, false), phone = frameMap(d, true);
  assert.equal(desk.viewBox, "0 0 34.5 18.1");
  assert.deepEqual(desk.map(0, 17.3), [12.5, 0]);
  assert.equal(phone.viewBox, "0 0 18.1 27.5");
  assert.deepEqual(phone.map(22, 17.3), [0, 0]);
  assert.deepEqual(phone.map(0, 8.25).map((v) => +v.toFixed(2)), [9.05, 22], "the gate sits at the bottom on a phone");
});

test("the checks refuse what would mislead or can't be drawn", () => {
  assert.match(errorsFor((s) => { s.hall.rows[0].bays[0].n = 2; }), /bay 2 is listed twice/);
  assert.match(errorsFor((s) => { s.hall.rows[0].bays[6].width = 6; }), /past the 21\.2 m wall/);
  assert.match(errorsFor((s) => { s.hall.rows[0].bays[0].charger = 9; }), /3, 7, 11, 22 or 50/);
  assert.match(errorsFor((s) => { s.hall.rows[0].bays[0].free = "yes"; }), /true \(free now\) or false/);
  assert.match(errorsFor((s) => { s.security.recorded = "Watch the live feed online"; }), /never offers a live camera feed/);
  assert.match(errorsFor((s) => { s.layingUp.links[0].url = "https://example.com/sorn"; }), /GOV\.UK page/);
  assert.match(errorsFor((s) => { s.insurerLetter = { file: "img/x.pdf", label: "Letter" }; }), /client sites only/);
  assert.match(errorsFor((s) => { s.aerial.frame.width = 30; }), /doesn't match the render's shape/);
  assert.match(errorsFor((s) => { s.aerial.empty.day.width = 2000; }), /same size as aerial\.day/);
  assert.match(errorsFor((s) => { delete s.aerial.empty; }), /every bay empty/);
  assert.match(errorsFor((s) => { s.liveBays = { source: "sheet", csvUrl: "https://example.com/bays.csv" }; }), /published CSV link/);
  assert.match(errorsFor((s) => { s.liveBays = { source: "simulated" }; }, client), /simulated free bays are for demos/);
  assert.match(errorsFor((s) => { s.features = s.features.filter((/** @type {string} */ f) => f !== "garage-pick"); }), /garage-aerial needs garage-pick/);
  assert.match(errorsFor((s) => { s.charging.readyBy = "7am"; }), /charging\.readyBy: a time/);
  assert.match(errorsFor((s) => { delete s.hero.photo; s.features = s.features.filter((/** @type {string} */ f) => f !== "garage-aerial"); }), /hero\.photo/);
  assert.match(errorsFor((s) => { s.hall.wings = 2; }), /hall\.wings: unknown setting/);
});

test("page data carries only what the features that are on need", () => {
  const starter = structuredClone(client);
  starter.plan = "starter";
  delete starter.liveBays;
  starter.features = ["garage-spaces", "garage-access", "garage-kept", "garage-move-in", "visit", "plan-visit", "questions"];
  const d = pageData(starter);
  assert.equal(d.hall, null);
  assert.deepEqual(d.cameras, []);
  assert.equal(d.aerial, null);
  assert.ok(Array.isArray(d.moveIn));
  assert.equal(d.liveBays, null);
  starter.liveBays = client.liveBays;
  const live = pageData(starter);
  assert.ok(live.hall, "the live list needs the hall's bays");
  assert.deepEqual(live.liveBays.listed, [4, 7, 9, 11, 14]);
  assert.equal(live.liveBays.staleHours, 24);
});
