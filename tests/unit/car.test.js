import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { minimumLight, isLegal, darkestLegal, ruleText } from "../../src/kits/car/lib/legality.js";
import { priceBuild, buildMessage, planProtection, hoursText, line, jobById } from "../../src/kits/car/lib/pricing.js";
import { stages, aftercareIcs, dayLabel } from "../../src/kits/car/lib/aftercare.js";
import { bayFromCsv, dayWords } from "../../src/kits/car/lib/bay.js";
import { postsFor } from "../../src/kits/car/lib/finder.js";
import { BODIES, BODY, SALOON, STUDIO_CAR, CARS, PANELS, PANEL_SHAPES, POV, polyPath } from "../../src/kits/car/lib/bodies.js";
import { glassOpacity, partOf, VIEWS } from "../../src/kits/car/features/showroom/studio-3d.js";
import { lawText } from "../../src/kits/car/features/driver-view/driver-view.js";
import { existsSync } from "node:fs";
import { CAR_BODIES, CAR_PANELS } from "../../src/kits/car/config.js";
import { resolvePriceItem } from "../../src/core/lib/prices.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";
import { HOME_PARTS, homeOrderProblem } from "../../src/kits/car/home.js";

const demo = JSON.parse(readFileSync("sites/demos/car-studio/site.json", "utf8"));
const cfg = { jobs: demo.jobs, tint: demo.tint, wrap: demo.wrap, showroom: demo.showroom };
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };

test("UK tint rules: 70% fronts, 75% windscreen from 1985, 70% before, none for rear", () => {
  assert.equal(minimumLight("fronts", false), 70);
  assert.equal(minimumLight("windscreen", false), 75);
  assert.equal(minimumLight("windscreen", true), 70);
  assert.equal(minimumLight("rear", false), null);
  assert.ok(isLegal("fronts", { id: "a", name: "70%", light: 70 }, false));
  assert.ok(!isLegal("fronts", { id: "a", name: "50%", light: 50 }, false));
  assert.ok(isLegal("rear", { id: "a", name: "5%", light: 5 }, false));
  assert.ok(isLegal("windscreen", null, false), "no film is legal");
  assert.equal(darkestLegal("fronts", demo.tint.shades, false)?.light, 70);
  assert.match(ruleText("rear", false), /No legal limit/);
});

test("hours read as people say them", () => {
  assert.equal(hoursText(0.75), "45 min");
  assert.equal(hoursText(1), "1 hour");
  assert.equal(hoursText(2.5), "2½ hours");
  assert.equal(hoursText(36), "5 working days");
});

test("a Showroom build is priced from the studio's own jobs, and illegal front shades are left out", () => {
  const b = { vehicle: "saloon", before1985: false, tint: { rear: "t20", fronts: "t35" }, wrap: { colour: "nardo", finish: "satin" }, wheels: null, dechrome: true };
  const r = priceBuild(b, cfg);
  const job = (/** @type {string} */ id) => jobById(demo.jobs, id);
  assert.equal(r.price, job("tint-rear").prices.saloon + job("wrap-satin").prices.saloon + job("dechrome").prices.saloon);
  assert.equal(r.refused.length, 1);
  assert.match(r.refused[0].window, /Front/);
  const msg = buildMessage({ vehicle: demo.vehicles[1], make: "BMW 320d", ...r });
  assert.doesNotMatch(msg, /Front side windows/, "the refused shade is not in the message");
  assert.match(msg, /BMW 320d/);
  assert.match(msg, new RegExp(`£${r.price}`));
  assert.equal(priceBuild({ ...b, tint: { fronts: "t70" } , wrap: null, dechrome: false }, cfg).refused.length, 0);
  assert.throws(() => line({ id: "x", name: "X", prices: {}, hours: {} }, "saloon"), /no price/);
});

test("PPF: packs are used only when they cost less, and the saving is the studio's own numbers", () => {
  const p = demo.protection;
  const one = planProtection(["bonnet"], p, demo.jobs, "hatch");
  assert.equal(one.price, jobById(demo.jobs, "ppf-bonnet").prices.hatch);
  const front = planProtection(["bumper", "bonnet", "wings", "mirrors", "lights"], p, demo.jobs, "hatch");
  assert.equal(front.lines.length, 1);
  assert.equal(front.price, jobById(demo.jobs, "ppf-full-front").prices.hatch);
  assert.ok(front.separately > front.price);
  assert.equal(planProtection([], p, demo.jobs, "hatch").price, 0);
});

test("aftercare: stages in order and calendar reminders at 9am studio time, written in UTC", () => {
  const svc = demo.aftercare.services[0];
  assert.deepEqual(stages(svc.steps).map((g) => g.stage), ["On the day", "First week", "First month"]);
  assert.equal(dayLabel(0), "Day 1");
  const ics = aftercareIcs({ service: svc, fitted: "2026-10-20", place: "Apex", business: "Apex Studio", timeZone: "Europe/London", stamp: new Date("2026-10-20T10:00:00Z") });
  assert.match(ics, /DTSTART:20261024T080000Z/, "24 Oct is still BST: 9am = 08:00Z");
  assert.match(ics, /DTSTART:20261103T090000Z/, "3 Nov is GMT: 9am = 09:00Z");
  assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, svc.steps.filter((s) => s.day >= 1).length);
});

test("next free bay fails closed: old, future-dated, past or unreadable sheets show no date", () => {
  const now = Date.parse("2026-10-26T12:00:00Z");
  const csv = (/** @type {string} */ date, /** @type {string} */ at) => `next_free,updated_at\n${date},${at}\n`;
  assert.deepEqual(bayFromCsv(csv("2026-10-29", "2026-10-26 09:00"), now, 48, "Europe/London", "2026-10-26").ok, true);
  assert.equal(bayFromCsv(csv("2026-10-29", "2026-10-20 09:00"), now, 48, "Europe/London", "2026-10-26").ok, false);
  assert.equal(bayFromCsv(csv("2026-10-25", "2026-10-26 09:00"), now, 48, "Europe/London", "2026-10-26").ok, false);
  assert.equal(bayFromCsv(csv("29/10/2026", "2026-10-26 09:00"), now, 48, "Europe/London", "2026-10-26").ok, false);
  assert.equal(bayFromCsv(csv("2026-10-29", "2026-10-27 09:00"), now, 48, "Europe/London", "2026-10-26").ok, false);
  assert.equal(bayFromCsv("nope", now, 48, "Europe/London", "2026-10-26").ok, false);
  assert.equal(dayWords("2026-10-27", "2026-10-26"), "Tomorrow");
  assert.equal(dayWords("2026-10-29", "2026-10-26"), "Thursday 29 October");
});

test("model finder matches only the studio's hashtags", () => {
  const posts = [{ tags: ["bmw", "bmwm3"] }, { tags: ["bmwx6"] }, { tags: ["audi"] }];
  const bmw = demo.models.makes[0];
  const r = postsFor(posts, bmw, bmw.models[0]);
  assert.equal(r.exact.length, 1);
  assert.equal(r.sameMake.length, 1, "an X6 post counts as another BMW");
  assert.equal(postsFor(posts, bmw, bmw.models[2]).exact.length, 0);
});

test("pictures: every file exists, traced shapes sit inside their photos, and the validator knows the same lists", () => {
  assert.deepEqual([...BODIES], CAR_BODIES);
  assert.deepEqual(PANELS, CAR_PANELS);
  const asset = (/** @type {string} */ f) => (f.startsWith("img/cars/") ? `src/core/assets/cars/${f.slice(9)}` : `src/kits/car/assets/${f.replace(/^img\/kit\//, "")}`);
  for (const f of [SALOON.src, STUDIO_CAR.model]) assert.ok(existsSync(asset(f)), f);
  for (const b of BODIES) { const c = CARS[b]; assert.ok(c, `a 3D car for ${b}`); for (const f of [c.model, c.poster, c.small]) assert.ok(existsSync(asset(f)), f); }
  for (const ph of Object.values(BODY)) for (const f of [ph.src, ph.front, ph.rear]) if (f) assert.ok(existsSync(asset(f)), f);
  const inside = (/** @type {[number, number][][]} */ polys, /** @type {number} */ w, /** @type {number} */ h) => polys.flat().every(([x, y]) => x >= 0 && x <= w && y >= 0 && y <= h);
  for (const w of ["fronts", "rear", "windscreen"]) for (const t of ["day", "night"]) {
    const s = POV[`${w}-${t}`];
    assert.ok(s && existsSync(asset(`${s.file}.webp`)), `${w}-${t}`);
    assert.ok(inside(s.glass, s.w, s.h), `${w}-${t} glass`);
  }
  for (const [id, s] of Object.entries(PANEL_SHAPES)) {
    if (s.top) assert.ok(inside(s.top, 599, 1200), `${id} top`);
    if (s.side) assert.ok(inside(s.side, SALOON.w, SALOON.h), `${id} side`);
  }
  assert.equal(polyPath([[[0, 0], [1, 0], [1, 1]]]), "M0 0L1 0L1 1Z");
});

test("3D Showroom: glass darkens with the shade, taps find the right part, every view has a camera", () => {
  assert.ok(glassOpacity(100) < glassOpacity(75) && glassOpacity(75) < glassOpacity(35) && glassOpacity(35) < glassOpacity(5));
  assert.ok(glassOpacity(5) <= 1 && glassOpacity(100) > 0);
  assert.equal(partOf("Glass", "BodyWindshield"), "windscreen");
  assert.equal(partOf("Glass", "BodyDoorLWindow"), "fronts");
  assert.equal(partOf("Glass", "BodyRearwindow"), "rear");
  assert.equal(partOf("Paint 1 Carmine", "BodyHood"), "wrap");
  assert.equal(partOf("Rim2", "WheelFrontLRim"), "wheels");
  assert.equal(partOf("Interior 1", "InteriorDashMid"), null);
  for (const v of ["wrap", "windscreen", "fronts", "rear", "wheels"]) assert.ok(VIEWS[/** @type {keyof typeof VIEWS} */ (v)], v);
});

test("driver view: the legal note for each window", () => {
  const shade = (/** @type {number} */ light) => ({ id: "x", name: `${light}%`, light });
  assert.equal(lawText("fronts", shade(70)).ok, true);
  assert.equal(lawText("fronts", shade(50)).ok, false);
  assert.match(lawText("windscreen", shade(76)).text, /meter/);
  assert.equal(lawText("windscreen", shade(72)).ok, false);
  assert.match(lawText("rear", shade(5)).text, /no legal limit/);
});

test("price lists show a job's cheapest price as a 'from' price", () => {
  assert.equal(resolvePriceItem({ job: "tint-rear" }, demo).price, `from £${Math.min(...Object.values(jobById(demo.jobs, "tint-rear").prices))}`);
  assert.match(errorsFor((s) => { s.priceList[0].items.push({ job: "nope" }); }), /job "nope"/);
});

test("car settings: the demo is valid; typos, demo data on clients and illegal first builds are refused", () => {
  assert.equal(validateSite(demo, { catalog }).join("\n"), "");
  assert.match(errorsFor((s) => { s.tint.shade = []; }), /tint\.shade: unknown setting/);
  assert.match(errorsFor((s) => { s.jobs[0].prices.van = "£159"; }), /jobs\[0\]\.prices\.van/);
  assert.match(errorsFor((s) => { s.showroom.start.tint = { fronts: "t20" }; }), /must be legal/);
  assert.match(errorsFor((s) => { s.bay.deposit.link = "https://buy.stripe.com/live_x"; }), /test-mode link/);
  assert.match(errorsFor((s) => { s.mode = "client"; }), /bay\.source: simulated data is only allowed on demo/);
  assert.match(errorsFor((s) => { s.mode = "client"; s.bay.source = "sheet"; s.bay.csvUrl = "https://docs.google.com/spreadsheets/d/x/pub?output=csv"; }), /bay\.deposit\.link: is a Stripe test-mode link/);
  assert.match(errorsFor((s) => { s.protection.panels[0].id = "spoiler"; }), /a panel traced on the photos/);
  assert.match(errorsFor((s) => { s.vehicles[0].body = "coupe"; }), /the vehicle.s shape/);
  assert.match(errorsFor((s) => { s.features.push("walk-in-queue"); }), /not available for kit "car"/);
  assert.match(errorsFor((s) => { s.tint.shades[0].sheen = "violet"; }), /tint\.shades\[0\]\.sheen/);
  assert.match(errorsFor((s) => { s.ppfPage.films[0].finish = "shiny"; }), /ppfPage\.films/);
  assert.match(errorsFor((s) => { s.tintPage.lights = { points: [] }; }), /tintPage\.lights/);
});

test("car looks order every home section exactly once", () => {
  for (const [id, look] of Object.entries(catalog.looks)) if (look.kits.includes("car")) assert.equal(homeOrderProblem(look.homeOrder), null, id);
  assert.match(homeOrderProblem(Object.keys(HOME_PARTS).slice(1)) ?? "", /leaves out: price-list/);
});

test("your car, live: codes, the sheet row, photos and failing closed", async () => {
  const { cleanCode, photoUrl, jobFromCsv, agoText } = await import("../../src/kits/car/lib/tracker.js");
  assert.equal(cleanCode(" k7m-2qx "), "K7M2QX");
  assert.equal(cleanCode("ab"), "");
  assert.equal(cleanCode("<script>"), "");
  assert.equal(photoUrl("https://drive.google.com/file/d/1AbCdEfGhIjK_lm/view?usp=sharing"), "https://lh3.googleusercontent.com/d/1AbCdEfGhIjK_lm");
  assert.equal(photoUrl("https://lh3.googleusercontent.com/abc=w1200"), "https://lh3.googleusercontent.com/abc=w1200");
  assert.equal(photoUrl("https://evil.example/x.jpg"), "");
  const stages = ["in", "fitting", "ready"], now = Date.parse("2026-10-19T09:30:00Z"), tz = "Europe/London";
  const csv = "code,stage,updated_at,note,photo\nK7M2QX,Fitting,2026-10-19 10:10,Fronts done,https://drive.google.com/open?id=1AbCdEfGhIjK_lm\nZZ99AA,ready,2026-10-19 09:00,,\n";
  const r = jobFromCsv(csv, "K7M2QX", stages, now, 24, tz);
  assert.deepEqual(r, { ok: true, stage: 1, updatedAt: Date.parse("2026-10-19T09:10:00Z"), note: "Fronts done", photo: "https://lh3.googleusercontent.com/d/1AbCdEfGhIjK_lm" });
  assert.deepEqual(jobFromCsv(csv, "NOPE11", stages, now, 24, tz), { ok: false, reason: "unknown" });
  assert.deepEqual(jobFromCsv(csv + "K7M2QX,in,2026-10-19 08:00,,\n", "K7M2QX", stages, now, 24, tz), { ok: false, reason: "unknown" }, "a code used twice is never guessed");
  assert.deepEqual(jobFromCsv(csv.replace("Fitting", "painting"), "K7M2QX", stages, now, 24, tz), { ok: false, reason: "unreadable" });
  assert.deepEqual(jobFromCsv(csv, "K7M2QX", stages, now + 30 * 3_600_000, 24, tz), { ok: false, reason: "stale" });
  assert.deepEqual(jobFromCsv("hello\n", "K7M2QX", stages, now, 24, tz), { ok: false, reason: "unreadable" });
  assert.equal(agoText(30_000), "just now");
  assert.equal(agoText(12 * 60_000), "12 minutes ago");
  assert.equal(agoText(3 * 3_600_000), "3 hours ago");
});


test("chip test: a chip is a closed outline around where the stone hit", async () => {
  const { chipShape } = await import("../../src/kits/car/features/chip-test/chip-test.js");
  const pts = chipShape(0.5, 0.6, 0.01);
  assert.ok(pts.length >= 7 && pts.length <= 10);
  for (const [x, y] of pts) assert.ok(Math.hypot(x - 0.5, (y - 0.6) / 0.8) <= 0.0116);
});

test("chip test and your car, live: settings are checked", () => {
  assert.match(errorsFor((s) => { s.chipTest.job = "nope"; }), /chipTest\.job/);
  assert.match(errorsFor((s) => { s.jobTracker.stages = [s.jobTracker.stages[0]]; }), /jobTracker\.stages/);
  assert.match(errorsFor((s) => { s.mode = "client"; }), /jobTracker\.source|jobTracker\.example/);
  assert.match(errorsFor((s) => { s.jobTracker.stages[1].id = s.jobTracker.stages[0].id; }), /used twice/);
});

test("3D download progress: a percentage when the size is sent, megabytes of the button's size when not", async () => {
  const { progressText } = await import("../../src/kits/car/features/showroom/showroom.js");
  assert.equal(progressText(1_250_000, 2_500_000, "2.4"), "50%");
  assert.equal(progressText(3_000_000, 2_500_000, "2.4"), "100%");
  assert.equal(progressText(1153434, 0, "2.4"), "1.1 of 2.4 MB");
  assert.equal(progressText(9e9, 0, "2.4"), "2.4 of 2.4 MB");
});
