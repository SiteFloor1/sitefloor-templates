// @ts-check
/**
 * The forecast for one of the site's places (src/core/lib/met.js), for any feature: on a client site from its own
 * /weather (the shared Cloudflare function), on a demo from the copy the build fetched (weather/<id>.json). The
 * visitor's browser never calls MET Norway. Fails closed: null, and the feature shows no forecast line.
 */
import { isWeather, MET_CREDIT } from "../lib/met.js";

const TIMEOUT_MS = 6000;
/** @type {Map<string, Promise<import("../lib/met.js").Weather|null>>} */ const memo = new Map();

/** @param {{ data: any }} ctx @param {string} id @returns {Promise<import("../lib/met.js").Weather|null>} */
export function loadWeather(ctx, id) {
  if (!memo.has(id)) memo.set(id, get(ctx.data.mode === "demo" ? new URL(`../weather/${id}.json`, import.meta.url).href : `/weather?place=${encodeURIComponent(id)}`));
  return /** @type {Promise<import("../lib/met.js").Weather|null>} */ (memo.get(id));
}

/** @param {string} url */
async function get(url) {
  try {
    const res = await fetch(url, { credentials: "omit", signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return null;
    const w = await res.json();
    // A forecast made more than 36 hours ago (a demo whose daily rebuild stopped) is not shown.
    return isWeather(w) && Date.now() - Date.parse(w.updated) < 36 * 3_600_000 ? w : null;
  } catch {
    return null;
  }
}

/**
 * The credit the licence asks for, as nodes to append after a forecast line: "MET Norway (CC BY 4.0), updated 08:00."
 * A demo says when the build fetched it instead. @param {import("../lib/met.js").Weather} w @param {boolean} demo
 * @param {string} timeZone @returns {(string|HTMLAnchorElement)[]}
 */
export function weatherCredit(w, demo, timeZone) {
  const a = (/** @type {string} */ href, /** @type {string} */ text) => Object.assign(document.createElement("a"), { href, textContent: text, rel: "noopener" });
  const at = (/** @type {string} */ iso) => new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));
  const when = demo ? `fetched ${demoWhen(w.fetched, timeZone)}` : `updated ${at(w.updated)}`;
  return [a(MET_CREDIT.href, MET_CREDIT.name), " (", a(MET_CREDIT.licenceHref, MET_CREDIT.licence), `), ${when}.`];
}

/** "04:23 today" or "04:23 on Fri 27 Nov": a demo's copy can be a day old. @param {string} iso @param {string} timeZone */
function demoWhen(iso, timeZone) {
  const day = (/** @type {Date} */ d) => new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const d = new Date(iso);
  const hm = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
  if (day(d) === day(new Date())) return `${hm} today`;
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "short", day: "numeric", month: "short" }).formatToParts(d).map((p) => [p.type, p.value]));
  return `${hm} on ${parts.weekday} ${parts.day} ${parts.month}`;
}

/**
 * Local "YYYY-MM-DDTHH:MM" for a forecast hour (UTC), so features compare it with their own local times.
 * @param {string} iso @param {string} timeZone
 */
export function localHour(iso, timeZone) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
