// @ts-check
/**
 * The shared weather source: MET Norway's Locationforecast 2.0 (free, commercial use allowed, CC BY 4.0, credited
 * wherever a forecast shows). No visitor's browser calls MET: client sites read their own `/weather` (the Cloudflare
 * Pages Function in functions/weather.js, cached until MET's Expires), demos read a copy fetched at build time.
 * Pure: runs in the browser, in the build and in the function.
 */

/** MET's terms ask every caller to name itself and give a contact. */
export const MET_AGENT = "Sitefloor/1.0 hello@sitefloor.com";
/** The credit the data licence asks for: the source and the licence, both linked. */
export const MET_CREDIT = { name: "MET Norway", href: "https://www.met.no/en", licence: "CC BY 4.0", licenceHref: "https://creativecommons.org/licenses/by/4.0/" };

/**
 * @typedef {{ time: string, cloud: number|null, rain: number|null }} WeatherHour time in UTC ("2026-11-28T15:00:00Z"),
 *   cloud cover in per cent, rain in mm over the next hour (null past the hourly range)
 * @typedef {{ updated: string, fetched: string, hours: WeatherHour[] }} Weather updated: when MET made the forecast
 * @typedef {{ id: string, lat: number, lon: number }} WeatherPlace a point a site reads the forecast for
 */

/** MET asks for at most 4 decimals; 3 (about 100 m) is plenty and lets nearby requests share a cache entry. */
const r3 = (/** @type {number} */ n) => Math.round(n * 1000) / 1000;

/** @param {number} lat @param {number} lon */
export const metUrl = (lat, lon) => `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${r3(lat)}&lon=${r3(lon)}`;

/** "2026-11-28T09:00:00Z", to the second. @param {number} ms */
const iso = (ms) => `${new Date(ms).toISOString().slice(0, 19)}Z`;

const num = (/** @type {unknown} */ v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/**
 * MET's answer, read into the small shape every site uses. null when anything needed is missing.
 * @param {any} json @param {number} fetchedMs @returns {Weather|null}
 */
export function readMet(json, fetchedMs) {
  const series = json?.properties?.timeseries;
  const updated = Date.parse(json?.properties?.meta?.updated_at ?? "");
  if (!Array.isArray(series) || !Number.isFinite(updated)) return null;
  /** @type {WeatherHour[]} */ const hours = [];
  for (const t of series) {
    const at = Date.parse(t?.time ?? "");
    if (!Number.isFinite(at)) continue;
    const d = t?.data;
    hours.push({ time: iso(at), cloud: num(d?.instant?.details?.cloud_area_fraction), rain: num(d?.next_1_hours?.details?.precipitation_amount) });
  }
  return hours.length ? { updated: iso(updated), fetched: iso(fetchedMs), hours } : null;
}

/**
 * The shape check for what a page receives (from /weather or the build's copy).
 * @param {any} w @returns {w is Weather}
 */
export const isWeather = (w) => typeof w?.updated === "string" && typeof w?.fetched === "string" && Array.isArray(w?.hours)
  && w.hours.every((/** @type {any} */ h) => typeof h?.time === "string" && (h.cloud === null || typeof h.cloud === "number") && (h.rain === null || typeof h.rain === "number"));

/** A place id: lowercase letters, digits and hyphens, as it appears in /weather?place=<id> and weather/<id>.json. */
export const PLACE_ID = /^[a-z0-9][a-z0-9-]{0,39}$/;

/**
 * The points a site reads the forecast for, from its kit (kit.js → weather). Ids and UK coordinates are checked.
 * @param {any} site @param {{ weather?: (site: any) => WeatherPlace[] } | undefined} kit @returns {WeatherPlace[]}
 */
export function weatherPlaces(site, kit) {
  const list = kit?.weather?.(site) ?? [];
  for (const p of list) {
    if (!PLACE_ID.test(p.id) || !(p.lat >= 49 && p.lat <= 61) || !(p.lon >= -9 && p.lon <= 2.5)) throw new Error(`weather place ${JSON.stringify(p)}: needs an id (a-z, 0-9, -) and a UK lat and lon`);
  }
  if (new Set(list.map((p) => p.id)).size !== list.length) throw new Error("weather places: each id once");
  return list;
}
