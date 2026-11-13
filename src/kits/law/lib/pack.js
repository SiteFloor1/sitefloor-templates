// @ts-check
/**
 * The first-meeting pack lives in the link the firm sends (after #), so nothing about the client is stored or
 * published: a published Google Sheet is public, which a law firm cannot use for who is meeting whom. The page reads
 * the link in the visitor's browser only; the part after # never reaches a server.
 *
 * A pack holds: the date and time, how long, who meets the client (a person's id), which way in (an arrival id),
 * what to bring (ids from the firm's list) and, if the firm wants, the client's first name. Anything else is refused.
 */
import { wallTimeToUtc } from "../../../core/lib/hours.js";

/** @typedef {{ v: 1, d: string, t: string, m: number, p: string, e?: string, b: string[], n?: string }} Pack */

const ID = /^[a-z0-9-]{1,40}$/;
const NAME = /^[\p{L}][\p{L}' -]{0,39}$/u;

/** @param {string} s */
const isYmd = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(`${s}T12:00:00Z`).toISOString().slice(0, 10) === s;

/**
 * Checks a pack against the firm's own lists. @param {any} p
 * @param {{ people: string[], ways: string[], bring: string[] }} known
 * @returns {string|null} what's wrong, or null
 */
export function packProblem(p, known) {
  if (!p || typeof p !== "object" || p.v !== 1) return "not a meeting pack";
  for (const k of Object.keys(p)) if (!["v", "d", "t", "m", "p", "e", "b", "n"].includes(k)) return `unknown part "${k}"`;
  if (!isYmd(p.d)) return "the date";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(p.t ?? "")) return "the time";
  if (!Number.isInteger(p.m) || p.m < 15 || p.m > 240) return "the length";
  if (!ID.test(p.p ?? "") || !known.people.includes(p.p)) return "who you are meeting";
  if (p.e !== undefined && !known.ways.includes(p.e)) return "the way in";
  if (!Array.isArray(p.b) || p.b.length > 12 || !p.b.every((/** @type {any} */ x) => known.bring.includes(x))) return "what to bring";
  if (p.n !== undefined && !NAME.test(p.n)) return "the name";
  return null;
}

/** @param {string} s */
const toB64Url = (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
/** @param {string} s */
const fromB64Url = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)));

/** The part after # for a pack. @param {Pack} p */
export const encodePack = (p) => toB64Url(JSON.stringify(p));

/**
 * @param {string} hash the link's part after # (with or without the #)
 * @param {{ people: string[], ways: string[], bring: string[] }} known
 * @returns {{ ok: true, pack: Pack } | { ok: false, why: string }}
 */
export function decodePack(hash, known) {
  const raw = hash.replace(/^#/, "").trim();
  if (!raw) return { ok: false, why: "empty" };
  if (raw.length > 600 || !/^[\w-]+$/.test(raw)) return { ok: false, why: "not a meeting pack" };
  let p;
  try { p = JSON.parse(fromB64Url(raw)); } catch { return { ok: false, why: "not a meeting pack" }; }
  const problem = packProblem(p, known);
  return problem ? { ok: false, why: problem } : { ok: true, pack: p };
}

/** "Thursday 12 November 2026, 10:30" @param {Pack} p */
export function packWhen(p) {
  const at = new Date(`${p.d}T12:00:00Z`);
  const part = (/** @type {Intl.DateTimeFormatOptions} */ o) => at.toLocaleDateString("en-GB", { ...o, timeZone: "UTC" });
  return `${part({ weekday: "long" })} ${part({ day: "numeric", month: "long", year: "numeric" })}, ${p.t}`;
}

/**
 * A calendar file for the meeting, in UTC so every calendar app reads it right.
 * @param {{ pack: Pack, who: string, firm: string, place: string, timeZone: string, stamp: Date }} o
 */
export function packIcs(o) {
  const utc = (/** @type {number} */ ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (/** @type {string} */ s) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const [year, month, day] = o.pack.d.split("-").map(Number);
  const start = wallTimeToUtc({ year, month, day, hour: Number(o.pack.t.slice(0, 2)), minute: Number(o.pack.t.slice(3, 5)) }, o.timeZone);
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sitefloor//Meeting//EN", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:meeting-${o.pack.d}-${o.pack.t.replace(":", "")}-${o.pack.p}@sitefloor`, `DTSTAMP:${utc(o.stamp.getTime())}`,
    `DTSTART:${utc(start)}`, `DTEND:${utc(start + o.pack.m * 60_000)}`,
    `SUMMARY:${esc(`Meeting with ${o.who}, ${o.firm}`)}`, `LOCATION:${esc(o.place)}`,
    "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
}
