import { test } from "node:test";
import assert from "node:assert/strict";
import { sunPosition, solarAngles } from "../../src/core/lib/sun.js";

// Checked against NOAA's solar calculator (gml.noaa.gov/grad/solcalc), to within half a degree.
test("the sun's position: London at the solstices and equinox", () => {
  const london = [51.5074, -0.1278];
  const june = sunPosition(Date.parse("2026-06-21T12:02:00Z"), london[0], london[1]);
  assert.ok(Math.abs(june.elevation - 61.9) < 0.5, `June noon elevation ${june.elevation}`);
  assert.ok(Math.abs(june.azimuth - 180) < 2, `June noon azimuth ${june.azimuth}`);
  const dec = sunPosition(Date.parse("2026-12-21T11:57:00Z"), london[0], london[1]);
  assert.ok(Math.abs(dec.elevation - 15.0) < 0.5, `December noon elevation ${dec.elevation}`);
  const march = sunPosition(Date.parse("2026-03-20T06:05:00Z"), london[0], london[1]);
  assert.ok(Math.abs(march.elevation) < 1.5 && Math.abs(march.azimuth - 90) < 3, `March sunrise ${JSON.stringify(march)}`);
  const night = sunPosition(Date.parse("2026-06-21T00:00:00Z"), london[0], london[1]);
  assert.ok(night.elevation < 0);
});

test("the sun's position: Edinburgh's midsummer sun is lower than London's", () => {
  const at = Date.parse("2026-06-21T12:15:00Z");
  assert.ok(sunPosition(at, 55.95, -3.19).elevation < sunPosition(at, 51.51, -0.13).elevation);
});

test("the exact angles are unrounded; the position is the same angles to a tenth of a degree (all three kits share them)", () => {
  for (const iso of ["2026-06-21T12:02:00Z", "2026-12-21T15:40:00Z", "2026-03-20T06:05:00Z", "2026-09-23T19:30:00Z"]) {
    const ms = Date.parse(iso), exact = solarAngles(ms, 51.5074, -0.1278), round = sunPosition(ms, 51.5074, -0.1278);
    assert.equal(round.elevation, Math.round(exact.elevation * 10) / 10);
    assert.equal(round.azimuth, Math.round(exact.azimuth * 10) / 10);
  }
  assert.notEqual(solarAngles(Date.parse("2026-06-21T12:02:00Z"), 51.5074, -0.1278).elevation % 0.1, 0);
});
