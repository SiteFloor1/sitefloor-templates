// @ts-check
/**
 * The /weather function (functions/weather.js runs this on Cloudflare Pages, free plan): /weather?place=<id> answers
 * with MET Norway's forecast for one of the site's own places (weather/places.json, written by the build), so it can't
 * be used as an open proxy. One call to MET serves every visitor until MET's Expires time: the answer is kept in
 * Cloudflare's cache (per data centre; the cache is skipped on *.pages.dev previews). When MET is down or slow, the
 * last answer (kept 6 hours) is served; past that, 503 and the page shows no forecast line. A refresh asks MET with
 * If-Modified-Since, as its terms ask.
 */
import { MET_AGENT, metUrl, readMet, PLACE_ID } from "./met.js";

const STALE_S = 6 * 3600;
const TIMEOUT_MS = 8000;

/**
 * @typedef {{ match: (key: Request) => Promise<Response|undefined>, put: (key: Request, res: Response) => Promise<void> }} EdgeCache
 * @typedef {{ assets: { fetch: (req: Request|URL) => Promise<Response> }, cache: EdgeCache, fetch: typeof fetch, waitUntil: (p: Promise<unknown>) => void, now?: () => number }} EdgeDeps
 */

const json = (/** @type {unknown} */ body, /** @type {number} */ status, /** @type {number} */ maxAge) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": maxAge ? `public, max-age=${maxAge}` : "no-store", "x-content-type-options": "nosniff" } });

/** Seconds until MET's Expires, kept between 1 minute and 1 hour. @param {string|null} expires @param {number} now */
export const ttlFrom = (expires, now) => Math.min(3600, Math.max(60, Math.round(((Date.parse(expires ?? "") || 0) - now) / 1000)));

/** @param {Request} request @param {EdgeDeps} d @returns {Promise<Response>} */
export async function weather(request, d) {
  const id = new URL(request.url).searchParams.get("place") ?? "";
  if (!PLACE_ID.test(id)) return json({ error: "place" }, 400, 0);
  const listed = await d.assets.fetch(new URL("/weather/places.json", request.url)).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const p = listed?.[id];
  if (typeof p?.lat !== "number" || typeof p?.lon !== "number") return json({ error: "place" }, 404, 0);
  const url = metUrl(p.lat, p.lon);
  const q = new URL(url).search.slice(1);
  const fresh = new Request(`https://sitefloor-weather.cache/fresh?${q}`), kept = new Request(`https://sitefloor-weather.cache/kept?${q}`);
  return (await d.cache.match(fresh)) ?? refresh(url, fresh, kept, d);
}

/** Ask MET (If-Modified-Since the kept answer), keep what comes back, or fall back. @param {string} url @param {Request} fresh @param {Request} kept @param {EdgeDeps} d */
async function refresh(url, fresh, kept, d) {
  const now = d.now?.() ?? Date.now();
  const last = await d.cache.match(kept);
  const lastModified = last?.headers.get("x-met-last-modified") || null;
  const headers = { "user-agent": MET_AGENT, accept: "application/json", ...(lastModified ? { "if-modified-since": lastModified } : {}) };
  const res = await d.fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) }).catch(() => null);
  const body = res?.status === 304 && last ? await last.json() : res?.ok ? readMet(await res.json().catch(() => null), now) : null;
  if (!body) return last ? withAge(last, 60) : json({ error: "forecast unavailable" }, 503, 0);
  const answer = json(body, 200, ttlFrom(res?.headers.get("expires") ?? null, now));
  const keep = json(body, 200, STALE_S);
  keep.headers.set("x-met-last-modified", res?.headers.get("last-modified") ?? lastModified ?? "");
  d.waitUntil(Promise.all([d.cache.put(fresh, answer.clone()), d.cache.put(kept, keep)]));
  return answer;
}

/** The kept answer, served for a minute while MET can't be reached. @param {Response} r @param {number} maxAge */
const withAge = async (r, maxAge) => json(await r.json(), 200, maxAge);
