// @ts-check
/**
 * The build's weather step (src/core/lib/met.js). A client site gets weather/places.json, the only places its /weather
 * function answers for. A demo (GitHub Pages runs no functions) gets weather/<id>.json: MET Norway's forecast fetched
 * now, with the same named sender, when SITEFLOOR_WEATHER=fetch (the daily demo rebuild sets it). Other builds (tests,
 * local, CI) fetch nothing, so the demo shows no forecast line. A failed fetch never fails the build.
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { MET_AGENT, metUrl, readMet, weatherPlaces } from "../../src/core/lib/met.js";

/**
 * @param {any} site @param {any} kit @param {string} outDir
 * @param {{ fetchNow?: boolean, fetch?: typeof fetch, log?: (m: string) => void }} [o]
 * @returns {Promise<{ places: number, fetched: number }>}
 */
export async function writeWeather(site, kit, outDir, o = {}) {
  const places = weatherPlaces(site, kit);
  if (!places.length) return { places: 0, fetched: 0 };
  const dir = path.join(outDir, "weather");
  if (site.mode !== "demo") {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "places.json"), JSON.stringify(Object.fromEntries(places.map((p) => [p.id, { lat: p.lat, lon: p.lon }]))));
    return { places: places.length, fetched: 0 };
  }
  const fetchNow = o.fetchNow ?? process.env.SITEFLOOR_WEATHER === "fetch";
  if (!fetchNow) return { places: places.length, fetched: 0 };
  await mkdir(dir, { recursive: true });
  const get = o.fetch ?? fetch;
  let fetched = 0;
  for (const p of places) {
    try {
      const res = await get(metUrl(p.lat, p.lon), { headers: { "user-agent": MET_AGENT, accept: "application/json" }, signal: AbortSignal.timeout(10_000) });
      const w = res.ok ? readMet(await res.json(), Date.now()) : null;
      if (!w) throw new Error(`MET answered ${res.status}`);
      await writeFile(path.join(dir, `${p.id}.json`), JSON.stringify(w));
      fetched++;
    } catch (e) {
      (o.log ?? console.warn)(`${site.id}: no forecast for ${p.id} (${/** @type {Error} */ (e).message}); the page shows none`);
    }
  }
  return { places: places.length, fetched };
}
