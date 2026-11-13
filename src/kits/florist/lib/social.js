// @ts-check
/**
 * Logic for florists who sell on Instagram and TikTok: today's bouquets and what's left of each, the order written
 * out for WhatsApp or an Instagram DM, "can you make this one?" from a post's link, the weekly drop and the florist's
 * LIVE sessions. Pure functions, no DOM; nothing here guesses a number the florist didn't give.
 */
import { wallTimeToUtc, addDays, DAY_KEYS } from "../../../core/lib/hours.js";

/** @typedef {{ state: "available"|"few"|"sold"|"hidden", left?: number, label: string }} Status */

/**
 * A bouquet's status. The florist's Sheet decides when it says something we understand ("sold", "few:2", "2",
 * "available", "hidden") and its counts are fresh: a count or "sold" is only believed while the Sheet's
 * `bouquet,updated` time is recent (`fresh`), and a count must be 1–99. "hidden" and "available" always count (they
 * claim nothing). Anything else, or a stale count, falls back to the site's own value; a client's site carries none
 * (config.js refuses it), so a stale Sheet never shows "2 left" days later.
 * @param {{ status?: string, left?: number }} item @param {string} [sheet] @param {boolean} [fresh]
 * @returns {Status}
 */
export function bouquetStatus(item, sheet, fresh = true) {
  const read = (/** @type {string|undefined} */ v, /** @type {number|undefined} */ n) => {
    const s = String(v ?? "").trim().toLowerCase();
    if (s === "sold" || s === "sold out") return { state: /** @type {const} */ ("sold"), label: "Sold out", claim: true };
    if (s === "hidden") return { state: /** @type {const} */ ("hidden"), label: "", claim: false };
    const few = /^(?:few:)?(\d{1,3})$/.exec(s);
    const count = few ? Number(few[1]) : s === "few" && Number.isInteger(n) ? Number(n) : null;
    if (count === 0) return { state: /** @type {const} */ ("sold"), label: "Sold out", claim: true };
    if (count !== null && count >= 1 && count <= 99) return { state: /** @type {const} */ ("few"), left: count, label: `${count} left`, claim: true };
    if (s === "" || s === "available") return { state: /** @type {const} */ ("available"), label: "", claim: false };
    return null;
  };
  const strip = (/** @type {any} */ x) => { const { claim, ...rest } = x; void claim; return /** @type {Status} */ (rest); };
  const fromSheet = sheet === undefined || String(sheet).trim() === "" ? null : read(sheet, undefined);
  if (fromSheet && (fresh || !fromSheet.claim)) return strip(fromSheet);
  const own = read(item.status, item.left);
  return own ? strip(own) : { state: "available", label: "" };
}

/**
 * Whether the florist's bouquet counts are recent enough to show: the Sheet's `bouquet,updated` time (shop time, as
 * `sheetTime` reads it) within `staleMinutes`, and not in the future.
 * @param {string|undefined} updated @param {number} staleMinutes @param {number} nowMs @param {string} timeZone
 */
export function countsFresh(updated, staleMinutes, nowMs, timeZone) {
  const at = sheetTime(updated ?? "", timeZone);
  return at !== null && at <= nowMs + 60000 && nowMs - at <= staleMinutes * 60000;
}

/** An Instagram handle as typed ("@laleh.studio" → "laleh.studio"), or null if it isn't one. @param {string} h */
export function igHandle(h) {
  const s = String(h ?? "").trim().replace(/^@/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(s) ? s : null;
}

/** The Instagram DM link for a handle. Instagram can't take the words with it, so the page copies them first. @param {string} h */
export const igDm = (h) => { const x = igHandle(h); return x ? `https://ig.me/m/${x}` : null; };

const POST_HOSTS = /^(?:www\.|m\.|vm\.|vt\.|uk\.)?(tiktok\.com|instagram\.com|pinterest\.(?:com|co\.uk)|pin\.it)$/;

/**
 * A link to a TikTok, Instagram or Pinterest post, cleaned (https, no tracking query), or null for anything else.
 * @param {string} input @returns {{ href: string, from: "TikTok"|"Instagram"|"Pinterest" } | null}
 */
export function postLink(input) {
  let u;
  try { u = new URL(String(input ?? "").trim()); } catch { return null; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const m = POST_HOSTS.exec(u.hostname.toLowerCase());
  if (!m) return null;
  const from = m[1].startsWith("tiktok") ? "TikTok" : m[1].startsWith("instagram") ? "Instagram" : "Pinterest";
  return { href: `https://${u.hostname.toLowerCase()}${u.pathname}`, from };
}

/**
 * "Can you make this one?": one message with the link, the budget and the day.
 * @param {{ lead: string, link: string, budget?: string, when?: string }} o
 */
export function makeThisMessage(o) {
  const when = `for ${o.when || "a day to agree"}.`;
  return `${o.lead} ${o.link} ${o.budget ? `Budget ${o.budget}, ${when}` : when.charAt(0).toUpperCase() + when.slice(1)}`;
}

/**
 * The next weekly drop window around now: it opens on the florist's day and time and stays open for `hours` (or until
 * sold out). Returns the window that's open now, else the next one.
 * @param {{ day: string, time: string, hours: number }} when e.g. { day: "fri", time: "19:00", hours: 48 }
 * @param {number} nowMs @param {string} timeZone
 * @returns {{ opens: number, closes: number }}
 */
export function dropWindow(when, nowMs, timeZone) {
  const wd = DAY_KEYS.indexOf(/** @type {any} */ (when.day));
  if (wd < 0) throw new Error(`drop day "${when.day}" isn't a day key`);
  const [hh, mm] = when.time.split(":").map(Number);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(nowMs));
  const todayWd = new Date(`${today}T12:00:00Z`).getUTCDay();
  const at = (/** @type {string} */ date) => { const [y, m, d] = date.split("-").map(Number); return wallTimeToUtc({ year: y, month: m, day: d, hour: hh, minute: mm }, timeZone); };
  // This week's opening (may be in the past), then step a week at a time until its window hasn't closed yet.
  let date = addDays(today, (wd - todayWd + 7) % 7 - 7);
  for (let i = 0; i < 3; i++) {
    const opens = at(date), closes = opens + when.hours * 3600000;
    if (closes > nowMs) return { opens, closes };
    date = addDays(date, 7);
  }
  const opens = at(date);
  return { opens, closes: opens + when.hours * 3600000 };
}

/**
 * What the drop says now, from the florist's own numbers. Before it opens: a countdown. While open: how many are left,
 * only if the count is fresh; a stale or missing count says "check our Instagram" rather than a number.
 * @param {{ opens: number, closes: number, made: number, left?: number|null, updated?: number|null, staleMinutes: number, nowMs: number }} o
 * @returns {{ phase: "soon", ms: number } | { phase: "open", left: number, of: number } | { phase: "unknown" } | { phase: "sold" }}
 */
export function dropState(o) {
  if (o.nowMs < o.opens) return { phase: "soon", ms: o.opens - o.nowMs };
  const fresh = o.updated !== null && o.updated !== undefined && o.nowMs - o.updated <= o.staleMinutes * 60000 && o.updated <= o.nowMs + 60000;
  if (o.left === 0 && fresh) return { phase: "sold" };
  if (!fresh || o.left === null || o.left === undefined || !Number.isInteger(o.left) || o.left < 0 || o.left > o.made) return { phase: "unknown" };
  return { phase: "open", left: o.left, of: o.made };
}

/** Days, hours, minutes and seconds in a span, for the countdown. @param {number} ms */
export function countdownParts(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/**
 * The florist's LIVE sessions still to come, soonest first (a session drops off when it ends).
 * @template {{ date: string, time: string, minutes?: number }} S
 * @param {S[]} sessions @param {{ date: string, minutes: number }} now shop time
 * @returns {S[]}
 */
export function upcomingLives(sessions, now) {
  const toMin = (/** @type {string} */ t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  return sessions
    .filter((s) => s.date > now.date || (s.date === now.date && toMin(s.time) + (s.minutes ?? 60) > now.minutes))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

/** @param {number} ms */
const utc = (ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
/** @param {string} s */
const esc = (s) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

/**
 * One event as a calendar file the customer keeps (nothing is sent anywhere), with a reminder before it.
 * @param {{ startMs: number, minutes: number, summary: string, description: string, url: string, alarm: string, alarmMinutes: number, stamp: Date, uid: string }} o
 */
export function eventIcs(o) {
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sitefloor//Florist//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT", `UID:${o.uid}`, `DTSTAMP:${utc(o.stamp.getTime())}`, `DTSTART:${utc(o.startMs)}`,
    `DTEND:${utc(o.startMs + o.minutes * 60000)}`, `SUMMARY:${esc(o.summary)}`,
    `DESCRIPTION:${esc(o.description)}`, `URL:${o.url}`,
    "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(o.alarm)}`, `TRIGGER:-PT${o.alarmMinutes}M`, "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ];
  return `${lines.join("\r\n")}\r\n`;
}

/**
 * One LIVE session as a calendar file.
 * @param {{ date: string, time: string, minutes?: number, where: string, what: string, url: string, business: string, timeZone: string, stamp: Date, uid: string }} o
 */
export function liveIcs(o) {
  const [y, m, d] = o.date.split("-").map(Number);
  const [hh, mm] = o.time.split(":").map(Number);
  const startMs = wallTimeToUtc({ year: y, month: m, day: d, hour: hh, minute: mm }, o.timeZone);
  return eventIcs({ startMs, minutes: o.minutes ?? 60, summary: `${o.business} LIVE on ${o.where}`, description: `${o.what}. ${o.url}`, url: o.url,
    alarm: `${o.business} is LIVE in 15 minutes`, alarmMinutes: 15, stamp: o.stamp, uid: o.uid });
}

/**
 * A time typed in the florist's Sheet, in shop time: "2026-11-06 19:20", "2026-11-06T19:20" or "06/11/2026 19:20:05"
 * (UK order, as Google Sheets writes NOW()). Null if it isn't one.
 * @param {string} v @param {string} timeZone @returns {number|null}
 */
export function sheetTime(v, timeZone) {
  const s = String(v ?? "").trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s);
  let y, mo, d;
  if (m) [y, mo, d] = [m[1], m[2], m[3]].map(Number);
  else {
    m = /^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s);
    if (!m) return null;
    [d, mo, y] = [m[1], m[2], m[3]].map(Number);
  }
  const [h, mi, se] = [Number(m[4]), Number(m[5]), Number(m[6] ?? 0)];
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;
  return wallTimeToUtc({ year: y, month: mo, day: d, hour: h, minute: mi, second: se }, timeZone);
}
