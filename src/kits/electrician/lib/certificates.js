// @ts-check
/**
 * Your home's certificates, by code: what the electrician has certified at a home and when the next inspection is
 * due, from the client's published Google Sheet (CSV), one row per certificate:
 *
 *   code,kind,issued,next_due,note
 *   HX7Q2M,eicr,2026-03-14,2031-03-14,Satisfactory. Two C3 observations, explained on page 3.
 *   HX7Q2M,part-p,2026-03-20,,Kitchen circuits, notified to building control
 *
 * The published CSV can be opened by anyone who has its link, so it never holds names, addresses, phone numbers or
 * links to the certificates themselves (those carry the address): only a random code, the kind, the dates and a
 * short note. The homeowner asks for a copy on WhatsApp with their code.
 * Fails closed: an unreadable sheet or an unknown code returns { ok: false } and the page says to message the client.
 */
import { parseCsv } from "../../../core/lib/sheet.js";
import { wallTimeToUtc } from "../../../core/lib/hours.js";

/** The kinds of paperwork the page knows. The client may word each one differently in site.json. */
export const KINDS = /** @type {const} */ ({
  "eicr": "Electrical Installation Condition Report (EICR)",
  "eic": "Electrical Installation Certificate",
  "part-p": "Building Regulations compliance (Part P)",
  "minor-works": "Minor works certificate",
  "ev": "Charger installation and commissioning record",
  "warranty": "Workmanship warranty",
});

/** A code as typed: spaces and dashes dropped, capitals; 6–10 letters and digits, or "". @param {string} s */
export function cleanCode(s) {
  const c = String(s ?? "").replace(/[\s-]/g, "").toUpperCase();
  return /^[A-Z0-9]{6,10}$/.test(c) ? c : "";
}

/** @param {string} s */
const isYmd = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(`${s}T12:00:00Z`).toISOString().slice(0, 10) === s;

/**
 * @typedef {{ kind: string, issued: string, nextDue: string, note: string }} Cert
 * @typedef {{ ok: true, certs: Cert[] }} Found
 * @typedef {{ ok: false, reason: "unreadable" | "unknown" }} NotFound
 */

/**
 * The rows for one code, newest first. Rows with an unknown kind or an impossible date are left out, never shown wrong.
 * @param {string} csv @param {string} code from cleanCode @returns {Found | NotFound}
 */
export function certsFromCsv(csv, code) {
  const rows = parseCsv(csv);
  const head = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
  const at = (/** @type {string} */ k) => head.indexOf(k);
  if (at("code") < 0 || at("kind") < 0 || at("issued") < 0) return { ok: false, reason: "unreadable" };
  const cell = (/** @type {string[]} */ r, /** @type {string} */ k) => (at(k) < 0 ? "" : (r[at(k)] ?? "").trim());
  const certs = rows.slice(1)
    .filter((r) => code && cleanCode(cell(r, "code")) === code)
    .map((r) => ({ kind: cell(r, "kind").toLowerCase(), issued: cell(r, "issued"), nextDue: cell(r, "next_due"), note: cell(r, "note").slice(0, 280) }))
    .filter((c) => c.kind in KINDS && isYmd(c.issued) && (c.nextDue === "" || (isYmd(c.nextDue) && c.nextDue > c.issued)))
    .sort((a, b) => (a.issued < b.issued ? 1 : -1));
  return certs.length ? { ok: true, certs } : { ok: false, reason: "unknown" };
}

/**
 * The next inspection date: the one on the certificate when the electrician wrote one, otherwise the issue date
 * plus the client's own interval in years. Only for an EICR (the report that says when the next one is due).
 * @param {Cert} c @param {number} intervalYears @returns {string} YYYY-MM-DD, or "" for other kinds
 */
export function nextInspection(c, intervalYears) {
  if (c.kind !== "eicr") return "";
  if (c.nextDue) return c.nextDue;
  const [y, m, d] = c.issued.split("-").map(Number);
  const day = Math.min(d, new Date(Date.UTC(y + intervalYears, m, 0)).getUTCDate());
  return `${y + intervalYears}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** 14 March 2031. @param {string} ymd */
export function ukDate(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** @param {number} ms */
const utc = (ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
/** @param {string} s */
const esc = (s) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

/**
 * A calendar reminder (.ics, times in UTC) at 10am on a day `weeksBefore` weeks ahead of the due date, so there's
 * time to book the visit.
 * @param {{ due: string, weeksBefore: number, business: string, phone: string, place: string, code: string, timeZone: string, stamp: Date }} o
 */
export function inspectionIcs(o) {
  const [y, m, d] = o.due.split("-").map(Number);
  const dueMs = Date.UTC(y, m - 1, d);
  const remind = new Date(dueMs - o.weeksBefore * 7 * 86_400_000);
  const start = wallTimeToUtc({ year: remind.getUTCFullYear(), month: remind.getUTCMonth() + 1, day: remind.getUTCDate(), hour: 10, minute: 0, second: 0 }, o.timeZone);
  const title = `Electrical inspection due ${ukDate(o.due)}`;
  const body = `Your next electrical inspection (EICR) is due on ${ukDate(o.due)}. Book it with ${o.business}: ${o.phone}. Your code: ${o.code}.`;
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sitefloor//Electrician//EN", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:eicr-${o.code}-${o.due}@sitefloor`, `DTSTAMP:${utc(o.stamp.getTime())}`,
    `DTSTART:${utc(start)}`, `DTEND:${utc(start + 15 * 60_000)}`,
    `SUMMARY:${esc(title)}`, `LOCATION:${esc(o.place)}`, `DESCRIPTION:${esc(body)}`,
    "BEGIN:VALARM", "TRIGGER:PT0M", "ACTION:DISPLAY", `DESCRIPTION:${esc(title)}`, "END:VALARM",
    "END:VEVENT", "END:VCALENDAR", "",
  ].map(fold).join("\r\n");
}

/** Folds a content line at 75 octets, as the calendar format asks (continuations start with a space). @param {string} line */
function fold(line) {
  const enc = new TextEncoder();
  /** @type {string[]} */ const out = [];
  let cur = "", size = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (size + n > (out.length ? 74 : 75)) { out.push(cur); cur = ""; size = 0; }
    cur += ch; size += n;
  }
  return [...out, cur].join("\r\n ");
}
