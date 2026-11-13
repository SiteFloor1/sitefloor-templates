import { test } from "node:test";
import assert from "node:assert/strict";
import { priceCut, orderMessage, extrasFor } from "../../src/kits/barber/lib/cut.js";
import { boardFromCsv, parseCsv, parseSheetTime, simulatedBoard } from "../../src/kits/barber/lib/chairs.js";
import { wallTimeToUtc } from "../../src/core/lib/hours.js";
import { profileSVG, FADE_TOP } from "../../src/kits/barber/lib/profile-svg.js";
import { faceSVG } from "../../src/kits/barber/lib/face-svg.js";
import { FACE_SHAPES } from "../../src/kits/barber/data/style-guide.js";

const menu = {
  services: [
    { id: "skin", name: "Skin fade", price: 22, minutes: 40, fade: true },
    { id: "kids", name: "Kids cut", price: 15, minutes: 30, fade: true, kids: true },
    { id: "buzz", name: "Buzz cut", price: 14, minutes: 20, fade: false, buzz: true },
  ],
  extras: [
    { id: "beard", name: "Beard shape-up", price: 12, minutes: 15, adultOnly: true },
    { id: "wash", name: "Wash and style", price: 5, minutes: 10 },
  ],
};

test("cut price and time add up service plus extras", () => {
  const q = priceCut(menu, { service: "skin", fade: "mid", length: 3, extras: ["beard", "wash"], barber: "any" });
  assert.equal(q.price, 39);
  assert.equal(q.minutes, 65);
});

test("adult-only extras are dropped from a kids' cut, even if ticked", () => {
  const q = priceCut(menu, { service: "kids", fade: "low", length: 2, extras: ["beard", "wash"], barber: "any" });
  assert.deepEqual(q.extras.map((e) => e.id), ["wash"]);
  assert.equal(q.price, 20);
  assert.deepEqual(extrasFor(menu.extras, menu.services[1]).map((e) => e.id), ["wash"]);
});

test("unknown service throws instead of quoting a wrong price", () => {
  assert.throws(() => priceCut(menu, { service: "x", fade: "mid", length: 3, extras: [], barber: "any" }));
});

test("order message lists everything the customer chose", () => {
  const sel = { service: "skin", fade: "high", length: 6, extras: ["beard"], barber: "Kofi" };
  const msg = orderMessage(priceCut(menu, sel), sel, "earliest 15:40 with Kofi");
  assert.match(msg, /Skin fade \(high fade\), 6cm on top/);
  assert.match(msg, /• Beard shape-up/);
  assert.match(msg, /About 55 min · £34/);
  assert.match(msg, /With Kofi if possible\./);
  const buzz = { service: "buzz", fade: "mid", length: 3, extras: [], barber: "any" };
  assert.match(orderMessage(priceCut(menu, buzz), buzz, "x"), /grade 1 all over/);
});

const NOW = Date.parse("2026-10-22T15:20:00Z"); // 16:20 in London (BST)
const TZ = "Europe/London";
const csv = (rows) => ["barber,status,free_at,updated_at", ...rows].join("\n");
const board = (rows, now = NOW) => boardFromCsv(csv(rows), now, 20, TZ);
const statusOf = (r, name) => r.rows.find((x) => x.barber === name)?.status;

test("chair sheet: valid rows are parsed", () => {
  const r = board(["Kofi,busy,16:40,2026-10-22T15:12:00Z", "Danny,free,,2026-10-22T15:10:00Z", "Ash,off,,2026-10-22T09:00:00Z"]);
  assert.equal(r.ok, true);
  assert.deepEqual(r.rows.map((x) => x.status), ["busy", "free", "off"]);
  assert.equal(r.rows[0].freeAt, "16:40");
});

test("chair sheet: one barber's fresh row does not keep another's old row live", () => {
  const r = board(["Kofi,free,,2026-10-22T08:00:00Z", "Danny,free,,2026-10-22T15:15:00Z"]);
  assert.equal(r.ok, true);
  assert.equal(statusOf(r, "Kofi"), "unknown");
  assert.equal(statusOf(r, "Danny"), "free");
  assert.equal(r.updatedAt, Date.parse("2026-10-22T15:15:00Z"));
});

test("chair sheet: a busy-until time that has passed is never offered", () => {
  const r = board(["Kofi,busy,16:10,2026-10-22T15:00:00Z", "Danny,busy,16:20,2026-10-22T15:00:00Z", "Ash,busy,16:45,2026-10-22T15:00:00Z"]);
  assert.equal(statusOf(r, "Kofi"), "unknown");
  assert.equal(statusOf(r, "Danny"), "unknown");
  assert.equal(statusOf(r, "Ash"), "busy");
  assert.equal(r.rows[0].freeAt, null);
});

test("chair sheet: busy stays live until its time without mid-cut updates; free goes stale", () => {
  const r = board(["Kofi,busy,17:00,2026-10-22T15:00:00Z", "Danny,free,,2026-10-22T14:50:00Z"]);
  assert.equal(statusOf(r, "Kofi"), "busy"); // set 40 min ago, still before 17:00
  assert.equal(statusOf(r, "Danny"), "unknown"); // said free 30 min ago
});

test("chair sheet: anything set before today, or in the future, is not live", () => {
  const r = board(["Kofi,off,,2026-10-21T17:00:00Z", "Danny,free,,2026-10-22T15:40:00Z", "Ash,free,,2026-10-22T15:19:00Z"]);
  assert.equal(statusOf(r, "Kofi"), "unknown");
  assert.equal(statusOf(r, "Danny"), "unknown");
  assert.equal(statusOf(r, "Ash"), "free");
});

test("chair sheet: UK-locale Google Sheet timestamps are read as shop time", () => {
  const r = board(["Kofi,busy,16:40,22/10/2026 16:12:00", "Danny,free,,22/10/2026 16:15", "Ash,free,,2026-10-22 16:18:30"]);
  assert.deepEqual(r.rows.map((x) => x.status), ["busy", "free", "free"]);
  assert.equal(parseSheetTime("22/10/2026 16:12:00", TZ), Date.parse("2026-10-22T15:12:00Z")); // BST
  assert.equal(parseSheetTime("05/01/2026 09:30", TZ), Date.parse("2026-01-05T09:30:00Z")); // GMT
  assert.equal(parseSheetTime("2026-10-22T16:12:00+01:00", TZ), Date.parse("2026-10-22T15:12:00Z"));
});

test("chair sheet: ambiguous or impossible timestamps are rejected, not guessed", () => {
  for (const bad of ["10/22/2026 16:12", "31/02/2026 10:00", "22/10/2026 25:00", "yesterday", "", "2026-10-22"]) {
    assert.ok(Number.isNaN(parseSheetTime(bad, TZ)), bad);
  }
});

test("chair sheet: unreadable rows become unknown; no live rows or bad header fails closed", () => {
  const r = board(["Kofi,napping,,2026-10-22T15:12:00Z", "Danny,busy,soon,2026-10-22T15:12:00Z", "Ash,free,,2026-10-22T15:12:00Z"]);
  assert.deepEqual(r.rows.map((x) => x.status), ["unknown", "unknown", "free"]);
  assert.deepEqual(board(["Kofi,busy,16:40,2026-10-22T08:00:00Z", "Danny,free,,2026-10-22T14:00:00Z"]), { ok: false, reason: "stale" });
  assert.deepEqual(boardFromCsv("name,state\nKofi,busy", NOW, 20, TZ), { ok: false, reason: "malformed" });
  assert.deepEqual(boardFromCsv("", NOW, 20, TZ), { ok: false, reason: "empty" });
});

test("wall clock to UTC handles both sides of the clocks changing", () => {
  assert.equal(wallTimeToUtc({ year: 2026, month: 3, day: 29, hour: 0, minute: 30 }, TZ), Date.parse("2026-03-29T00:30:00Z"));
  assert.equal(wallTimeToUtc({ year: 2026, month: 3, day: 29, hour: 3, minute: 0 }, TZ), Date.parse("2026-03-29T02:00:00Z"));
  assert.equal(wallTimeToUtc({ year: 2026, month: 10, day: 25, hour: 12, minute: 0 }, TZ), Date.parse("2026-10-25T12:00:00Z"));
});

test("CSV parser handles quotes, commas and CRLF", () => {
  assert.deepEqual(parseCsv('a,b\r\n"x, y","say ""hi"""\r\n'), [["a", "b"], ["x, y", 'say "hi"']]);
});

test("simulated board is deterministic and always shows a plausible mix", () => {
  const a = simulatedBoard(["A", "B", "C", "D"], 600);
  assert.deepEqual(a, simulatedBoard(["A", "B", "C", "D"], 600));
  for (const c of a) if (c.status === "busy") assert.ok(c.freeAtMinutes > 600);
  const day = Array.from({ length: 600 }, (_, i) => simulatedBoard(["A", "B", "C", "D"], 540 + i));
  assert.ok(day.some((b) => b.some((c) => c.status === "free")));
});

test("profile diagram: valid SVG for every option, no NaN, unique ids", () => {
  for (const kid of [false, true]) for (const buzz of [false, true]) for (const fade of ["none", "line", "taper", "burst", "drop"]) {
    const svg = profileSVG({ id: `t${kid}${buzz}${fade}`, kid, buzz, fade, fadeTop: FADE_TOP.adult.low, length: 28, beard: true, towel: false, lengthLabel: "6CM" });
    assert.match(svg, /^<svg[^>]*role="img"/);
    assert.ok(!svg.includes("NaN") && !svg.includes("undefined"), `bad number for ${kid}/${buzz}/${fade}`);
    assert.ok(svg.includes(`id="g-t${kid}${buzz}${fade}"`));
  }
});

test("profile diagram: kids never get a beard and buzz cuts are stubble, not solid hair", () => {
  const kid = profileSVG({ id: "k", kid: true, beard: true });
  assert.ok(!kid.includes('opacity=".9"/>'), "kid diagram should not draw a beard");
  const buzz = profileSVG({ id: "b", buzz: true });
  assert.match(buzz, /class="dg-stop-buzz"/);
});

test("profile diagram: labels cannot inject markup", () => {
  assert.ok(!profileSVG({ id: "x", lengthLabel: "<img onerror=1>", label: '"><script>' }).includes("<img"));
});

test("face-shape diagrams render for every shape", () => {
  for (const f of FACE_SHAPES) {
    const svg = faceSVG(f.shape, `${f.name} face`);
    assert.match(svg, /^<svg class="face"/);
    assert.ok(!svg.includes("NaN"));
  }
});

test("chair sheet: a busy-until set more than 2 hours ahead is not trusted", () => {
  const r = board(["Kofi,busy,18:30,2026-10-22T15:00:00Z", "Danny,busy,18:00,2026-10-22T15:00:00Z"]);
  assert.equal(statusOf(r, "Kofi"), "unknown"); // set 16:00 for 18:30
  assert.equal(statusOf(r, "Danny"), "busy"); // set 16:00 for 18:00
});

test("chair sheet: a Google Form's responses sheet works, newest answer per barber wins", () => {
  const form = [
    "Timestamp,Barber,Status,Free at",
    "22/10/2026 15:50:12,Kofi,Free,",
    "22/10/2026 16:05:40,Kofi,Busy,16:45:00",
    "22/10/2026 16:10:02,Danny,Free,",
    "22/10/2026 09:01:00,Ash,Off today,",
    "22/10/2026 16:12:00,Rio,Busy,9:40",
  ].join("\n");
  const r = boardFromCsv(form, NOW, 20, TZ);
  assert.equal(r.ok, true);
  assert.equal(statusOf(r, "Kofi"), "busy");
  assert.equal(r.rows.find((x) => x.barber === "Kofi").freeAt, "16:45");
  assert.equal(statusOf(r, "Danny"), "free");
  assert.equal(statusOf(r, "Ash"), "off");
  assert.equal(statusOf(r, "Rio"), "unknown"); // 09:40 has passed
  assert.equal(r.rows.length, 4);
});

test("home order: every barber look lists every home section exactly once", async () => {
  const { HOME_PARTS, homeOrderProblem } = await import("../../src/kits/barber/home.js");
  const { loadCatalog } = await import("../../scripts/lib/catalog.js");
  const { existsSync } = await import("node:fs");
  for (const path of Object.values(HOME_PARTS)) assert.ok(existsSync(new URL(`../../src/${path}`, import.meta.url)), path);
  for (const [id, look] of Object.entries(loadCatalog(new URL("../..", import.meta.url).pathname).looks)) {
    if (look.kits.includes("barber")) assert.equal(homeOrderProblem(look.homeOrder), null, id);
  }
  const all = Object.keys(HOME_PARTS);
  assert.equal(homeOrderProblem(undefined), null);
  assert.match(homeOrderProblem(all.slice(1)) ?? "", /leaves out: chair-board/);
  assert.match(homeOrderProblem([...all, "galery"]) ?? "", /unknown sections: galery/);
  assert.match(homeOrderProblem([...all, all[0]]) ?? "", /twice/);
  assert.match(homeOrderProblem("visit") ?? "", /must be a list/);
});
