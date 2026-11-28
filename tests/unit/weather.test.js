// @ts-check
// The shared weather: MET Norway read into one shape, the /weather function (cache, named sender, fallbacks, only the
// site's own places), the build's step (places for clients, a fetched copy for demos) and local hours.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { MET_AGENT, metUrl, readMet, isWeather, weatherPlaces } from "../../src/core/lib/met.js";
import { weather, ttlFrom } from "../../src/core/lib/weather-edge.js";
import { writeWeather } from "../../scripts/lib/weather.js";
import { localHour } from "../../src/core/js/weather.js";

const NOW = Date.parse("2026-11-28T09:00:00Z");
const MET = { properties: { meta: { updated_at: "2026-11-28T08:12:00Z" }, timeseries: [
  { time: "2026-11-28T09:00:00Z", data: { instant: { details: { cloud_area_fraction: 62.5 } }, next_1_hours: { details: { precipitation_amount: 0.4 } } } },
  { time: "2026-12-04T12:00:00Z", data: { instant: { details: { cloud_area_fraction: 10 } }, next_6_hours: { details: { precipitation_amount: 1 } } } },
] } };

test("MET's answer is read into hours with cloud and next-hour rain", () => {
  assert.equal(metUrl(51.50721, -0.12759), "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=51.507&lon=-0.128");
  const w = readMet(MET, NOW);
  assert.deepEqual(w, { updated: "2026-11-28T08:12:00Z", fetched: "2026-11-28T09:00:00Z", hours: [
    { time: "2026-11-28T09:00:00Z", cloud: 62.5, rain: 0.4 }, { time: "2026-12-04T12:00:00Z", cloud: 10, rain: null }] });
  assert.ok(isWeather(w));
  assert.equal(readMet({ properties: {} }, NOW), null);
  assert.equal(readMet(null, NOW), null);
  assert.equal(isWeather({ updated: "x", fetched: "x", hours: [{ time: "x", cloud: "62", rain: null }] }), false);
  assert.match(MET_AGENT, /^Sitefloor\/1\.0 hello@sitefloor\.com$/);
});

test("a kit's places are checked: ids, UK coordinates, each once", () => {
  const kit = (/** @type {any[]} */ list) => ({ weather: () => list });
  assert.deepEqual(weatherPlaces({}, undefined), []);
  assert.equal(weatherPlaces({}, kit([{ id: "kirkgate", lat: 53.79, lon: -1.54 }])).length, 1);
  assert.throws(() => weatherPlaces({}, kit([{ id: "Kirk Gate", lat: 53.79, lon: -1.54 }])), /needs an id/);
  assert.throws(() => weatherPlaces({}, kit([{ id: "paris", lat: 48.85, lon: 2.35 }])), /UK lat and lon/);
  assert.throws(() => weatherPlaces({}, kit([{ id: "a", lat: 53, lon: -1 }, { id: "a", lat: 54, lon: -1 }])), /each id once/);
});

/** A fake Cloudflare: the site's places file, a cache that honours nothing but keys, MET answering as told. */
function edge(/** @type {(url: string, init: any) => Response|Promise<Response>} */ met) {
  /** @type {Map<string, Response>} */ const store = new Map();
  /** @type {{ url: string, init: any }[]} */ const calls = [];
  /** @type {Promise<unknown>[]} */ const pending = [];
  const d = {
    now: () => NOW,
    assets: { fetch: async (/** @type {any} */ u) => (String(u).endsWith("/weather/places.json") ? Response.json({ kirkgate: { lat: 53.796, lon: -1.541 } }) : new Response("", { status: 404 })) },
    cache: { match: async (/** @type {Request} */ k) => store.get(k.url)?.clone(), put: async (/** @type {Request} */ k, /** @type {Response} */ r) => { store.set(k.url, r); } },
    fetch: /** @type {any} */ (async (/** @type {string} */ url, /** @type {any} */ init) => { calls.push({ url, init }); return met(url, init); }),
    waitUntil: (/** @type {Promise<unknown>} */ p) => { pending.push(p); },
  };
  const ask = async (/** @type {string} */ q) => { const r = await weather(new Request(`https://kerrow.co.uk/weather${q}`), d); await Promise.all(pending); return r; };
  return { ask, calls, store };
}
const metOk = () => Response.json(MET, { headers: { expires: "Sat, 28 Nov 2026 09:20:00 GMT", "last-modified": "Sat, 28 Nov 2026 08:12:00 GMT" } });

test("/weather: one call to MET, named, then the cache serves until MET's Expires", async () => {
  const e = edge(metOk);
  const r = await e.ask("?place=kirkgate");
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("cache-control"), "public, max-age=1200");
  assert.deepEqual((await r.json()).hours[0], { time: "2026-11-28T09:00:00Z", cloud: 62.5, rain: 0.4 });
  assert.equal(e.calls.length, 1);
  assert.equal(e.calls[0].url, "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=53.796&lon=-1.541");
  assert.equal(e.calls[0].init.headers["user-agent"], MET_AGENT);
  assert.equal((await e.ask("?place=kirkgate")).status, 200);
  assert.equal(e.calls.length, 1, "the second visitor is served from the cache");
});

test("/weather: a refresh asks If-Modified-Since; MET down serves the kept answer, then 503", async () => {
  let mode = "ok";
  const e = edge((_u, init) => (mode === "ok" ? metOk() : mode === "same" ? (assert.equal(init.headers["if-modified-since"], "Sat, 28 Nov 2026 08:12:00 GMT"), new Response(null, { status: 304, headers: { expires: "Sat, 28 Nov 2026 09:30:00 GMT" } })) : new Response("", { status: 500 })));
  await e.ask("?place=kirkgate");
  for (const k of e.store.keys()) if (k.includes("/fresh")) e.store.delete(k); // MET's Expires passed
  mode = "same";
  const same = await e.ask("?place=kirkgate");
  assert.equal(same.status, 200);
  assert.equal((await same.json()).updated, "2026-11-28T08:12:00Z");
  for (const k of e.store.keys()) if (k.includes("/fresh")) e.store.delete(k);
  mode = "down";
  const kept = await e.ask("?place=kirkgate");
  assert.equal(kept.status, 200);
  assert.equal(kept.headers.get("cache-control"), "public, max-age=60");
  e.store.clear();
  assert.equal((await e.ask("?place=kirkgate")).status, 503);
});

test("/weather answers only for the site's own places", async () => {
  const e = edge(metOk);
  assert.equal((await e.ask("?place=elsewhere")).status, 404);
  assert.equal((await e.ask("?place=../x")).status, 400);
  assert.equal((await e.ask("")).status, 400);
  assert.equal(e.calls.length, 0);
  assert.equal(ttlFrom(null, NOW), 60);
  assert.equal(ttlFrom("Sat, 28 Nov 2026 12:00:00 GMT", NOW), 3600);
});

test("the build writes a client's places, and a demo's forecast only when asked to fetch", async () => {
  const kit = { weather: () => [{ id: "kirkgate", lat: 53.796, lon: -1.541 }] };
  const client = await mkdtemp(path.join(tmpdir(), "wx-"));
  await writeWeather({ id: "c", mode: "client" }, kit, client, { fetchNow: true, fetch: () => { throw new Error("a client build never fetches"); } });
  assert.deepEqual(JSON.parse(await readFile(path.join(client, "weather/places.json"), "utf8")), { kirkgate: { lat: 53.796, lon: -1.541 } });

  const quiet = await mkdtemp(path.join(tmpdir(), "wx-"));
  assert.deepEqual(await writeWeather({ id: "d", mode: "demo" }, kit, quiet, { fetchNow: false }), { places: 1, fetched: 0 });
  assert.deepEqual(await readdir(quiet), [], "nothing is written");

  const demo = await mkdtemp(path.join(tmpdir(), "wx-"));
  /** @type {any[]} */ const seen = [];
  await writeWeather({ id: "d", mode: "demo" }, kit, demo, { fetchNow: true, fetch: /** @type {any} */ (async (/** @type {string} */ u, /** @type {any} */ i) => { seen.push([u, i.headers["user-agent"]]); return metOk(); }) });
  assert.deepEqual(seen, [[metUrl(53.796, -1.541), MET_AGENT]]);
  assert.ok(isWeather(JSON.parse(await readFile(path.join(demo, "weather/kirkgate.json"), "utf8"))));

  const down = await mkdtemp(path.join(tmpdir(), "wx-"));
  /** @type {string[]} */ const logs = [];
  assert.deepEqual(await writeWeather({ id: "d", mode: "demo" }, kit, down, { fetchNow: true, fetch: /** @type {any} */ (async () => new Response("", { status: 503 })), log: (m) => logs.push(m) }), { places: 1, fetched: 0 });
  assert.match(logs[0], /no forecast for kirkgate/);
});

test("forecast hours are read in local time", () => {
  assert.equal(localHour("2026-07-04T14:00:00Z", "Europe/London"), "2026-07-04T15:00");
  assert.equal(localHour("2026-11-28T14:00:00Z", "Europe/London"), "2026-11-28T14:00");
});
