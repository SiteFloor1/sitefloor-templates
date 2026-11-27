import { test } from "node:test";
import assert from "node:assert/strict";
import { homesFromCsv, COLUMNS } from "../../src/kits/residences/lib/homes.js";
import { quote, headline, pounds } from "../../src/kits/residences/lib/stay.js";
import { sunWindow } from "../../src/kits/residences/lib/light.js";
import { walk, layout } from "../../src/kits/residences/lib/map.js";
import { arrivalIcs } from "../../src/kits/residences/lib/arrival.js";
import { RULES } from "../../src/kits/residences/lib/rules.js";

const TZ = "Europe/London";
const NOW = Date.parse("2026-11-26T12:00:00Z");
const row = (o) => COLUMNS.map((c) => o[c] ?? "").join(",");
const base = { ref: "4W", name: "Four West", floor: "4", status: "free", beds: "2", baths: "2", size_m2: "112", free_from: "now", stays: "both", night: "640", clean: "220", min_nights: "3", rent_pcm: "7950", faces: "270", updated_at: "2026-11-26 09:15" };
const csv = (...rows) => [COLUMNS.join(","), ...rows.map(row)].join("\n");

test("residences sheet: a free home is read with its prices, bearings and quiet notes", () => {
  const r = homesFromCsv(csv({ ...base, side: "Courtyard" }), NOW, TZ, {});
  assert.equal(r.ok, true);
  const h = r.homes[0];
  assert.deepEqual([h.night, h.clean, h.minNights, h.rent, h.short, h.long], [640, 220, 3, 7950, true, true]);
  assert.deepEqual(h.faces, [270]);
  assert.deepEqual(h.quiet, [["Side", "Courtyard"]]);
});

test("residences sheet: fails closed when stale, unreadable or missing a column", () => {
  assert.deepEqual(homesFromCsv(csv({ ...base, updated_at: "2026-11-24 09:15" }), NOW, TZ, {}), { ok: false, reason: "stale" });
  assert.deepEqual(homesFromCsv(csv({ ...base, updated_at: "11/26/2026 09:15" }), NOW, TZ, {}), { ok: false, reason: "unreadable" });
  assert.deepEqual(homesFromCsv("ref,name\n1,x", NOW, TZ, {}), { ok: false, reason: "unreadable" });
});

test("residences sheet: a home missing a price or with an unreadable date is never shown as free", () => {
  const r = homesFromCsv(csv({ ...base, night: "", stays: "short" }, { ...base, ref: "2E", free_from: "soon" }, { ...base, ref: "PH", status: "let" }), NOW, TZ, {});
  assert.equal(r.ok && r.homes.length, 0);
});

test("short stays: the total holds every charge; the headline is the shortest stay's all-in night", () => {
  const h = homesFromCsv(csv(base), NOW, TZ, {}).homes[0];
  assert.deepEqual(quote(h, 14), { kind: "short", nights: 14, total: 9180, perNight: 9180 / 14 });
  assert.equal(quote(h, 2).kind, "none");
  assert.deepEqual(headline(h), { night: { perNight: 714, nights: 3 }, month: 7950 });
  assert.equal(pounds(9180), "£9,180");
});

test("long lets: priced by the month, deposits within the Tenant Fees Act caps", () => {
  const h = homesFromCsv(csv(base), NOW, TZ, {}).homes[0];
  const q = quote(h, "long");
  assert.equal(q.kind, "long");
  // £7,950 a month is £95,400 a year: from £50,000, so six weeks; one week for the holding deposit
  assert.equal(q.deposit, Math.floor((7950 * 12 / 52) * 6));
  assert.equal(q.holding, Math.floor(7950 * 12 / 52));
  const lower = homesFromCsv(csv({ ...base, rent_pcm: "3000" }), NOW, TZ, {}).homes[0];
  assert.equal(quote(lower, "long").depositWeeks, 5);
  const high = homesFromCsv(csv({ ...base, rent_pcm: "9000" }), NOW, TZ, {}).homes[0];
  assert.deepEqual(quote(high, "long"), { kind: "none", why: "above-limit" });
  assert.match(RULES.fees.url, /^https:\/\/www\.gov\.uk\//);
  assert.match(RULES.rolling.url, /^https:\/\/www\.gov\.uk\//);
});

test("sun on the windows: west windows get the afternoon, east the morning, none at night", () => {
  const place = { lat: 51.522, lng: -0.155 };
  const west = sunWindow([270], "2026-11-26", place, TZ);
  const east = sunWindow([90], "2026-11-26", place, TZ);
  assert.ok(west && west.on > "11:00" && west.off < "16:30", JSON.stringify(west));
  assert.ok(east && east.on < "09:00" && east.off < "13:00", JSON.stringify(east));
  assert.equal(sunWindow([], "2026-11-26", place, TZ), null);
  const summer = sunWindow([270], "2026-06-21", place, TZ);
  assert.ok(summer && summer.off > "20:00", JSON.stringify(summer));
});

test("neighbourhood map: given minutes are kept; others are an 'about' estimate", () => {
  const c = { lat: 51.522, lng: -0.155 };
  assert.deepEqual(walk(c, { lat: 51.53, lng: -0.15, minutes: 9 }), { minutes: 9, about: false });
  const w = walk(c, { lat: 51.5265, lng: -0.155 }); // 500 m north
  assert.equal(w.about, true);
  assert.equal(w.minutes, Math.ceil((0.0045 * 110540 * 1.3) / 80));
  const [p] = layout(c, [{ name: "North", lat: 51.5265, lng: -0.155 }], 600, 15);
  assert.equal(p.cx, 300);
  assert.ok(p.cy < 300);
});

test("arrival card: one floating-time event with the concierge's hours and steps", () => {
  const ics = arrivalIcs({ day: "2026-12-04", time: "18:30", name: "Sevrell", place: "Marylebone, London", steps: ["Come to the front desk"], concierge: "07:00 to midnight", stamp: "20261126T120000Z" });
  assert.match(ics, /DTSTART:20261204T183000\r\n/);
  assert.match(ics, /DESCRIPTION:Concierge: 07:00 to midnight\\n1\. Come to the front desk/);
});
