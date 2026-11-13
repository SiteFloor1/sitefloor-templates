// @ts-check
/**
 * Events the firm runs (seminars, next-generation evenings), from its own Google Sheet (published as CSV) or written
 * into site.json. Like insights, a row shows only once compliance has approved it; it also needs a real date and times,
 * and only upcoming events show. Each gets a calendar file with its times in UTC. Pure: no DOM.
 */
import { parseCsv } from "../../../core/lib/sheet.js";
import { wallTimeToUtc } from "../../../core/lib/hours.js";
import { promises } from "./fca.js";
import { YMD, approvalHold } from "./approval.js";
import { slugOf } from "./insights.js";

const HM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** @typedef {{ id: string, title: string, kind: string, date: string, start: string, end: string, place: string, summary: string, reply: string, approvedBy: string, approvedOn: string }} WealthEvent */

/** Why a sheet row can't be shown, or null. @param {Record<string, string>} r @param {string} today */
export function eventHold(r, today) {
  const gate = approvalHold(r, today);
  if (gate) return gate;
  if (!(r.title ?? "").trim()) return "no title";
  if (!YMD.test((r.date ?? "").trim())) return "Date isn't a date (YYYY-MM-DD)";
  if (r.date.trim() < today) return "already happened";
  if (!HM.test((r.start ?? "").trim()) || !HM.test((r.end ?? "").trim())) return "Start and End need times like 18:30";
  if (r.end.trim() <= r.start.trim()) return "ends before it starts";
  if (!(r.place ?? "").trim() || !(r.summary ?? "").trim()) return "no place or summary";
  if (promises(`${r.title} ${r.summary}`)) return "promises a return or performance";
  return null;
}

/** @param {string} csv @param {string} today @returns {{ items: WealthEvent[], held: { row: number, why: string }[] }} */
export function eventsFromCsv(csv, today) {
  const rows = parseCsv(csv);
  if (!rows.length) return { items: [], held: [] };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  if (!head.includes("title") || !head.includes("approved")) throw new Error("the sheet needs at least Title and Approved columns");
  /** @type {WealthEvent[]} */ const items = [];
  /** @type {{ row: number, why: string }[]} */ const held = [];
  rows.slice(1).forEach((cells, i) => {
    /** @type {Record<string, string>} */ const r = {};
    head.forEach((h, j) => { r[h] = (cells[j] ?? "").trim(); });
    const why = eventHold(r, today);
    if (why) { held.push({ row: i + 2, why }); return; }
    items.push({ id: `${r.date}-${slugOf(r.title)}`.slice(0, 50), title: r.title, kind: r.kind || "Event", date: r.date, start: r.start, end: r.end, place: r.place, summary: r.summary, reply: r.reply ?? "", approvedBy: r["approved by"], approvedOn: r["approved on"] });
  });
  return { items: upcoming(items, today), held };
}

/** Upcoming events, soonest first. @param {WealthEvent[]} items @param {string} today */
export const upcoming = (items, today) => items.filter((e) => e.date >= today).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));

/** A reply that is an email address becomes a pre-written email; a link (the firm's form) stays as it is. @param {WealthEvent} e @param {string} fallback */
export function replyHref(e, fallback) {
  const to = e.reply || fallback;
  if (/^https:\/\//.test(to)) return to;
  return `mailto:${to}?subject=${encodeURIComponent(`${e.title}, ${e.date}`)}&body=${encodeURIComponent(`I'd like to come to ${e.title} on ${e.date}.\n\nName:\nGuests:`)}`;
}

/** The calendar file for one event, times in UTC. @param {{ event: WealthEvent, firm: string, timeZone: string, stamp: Date }} o */
export function eventIcs(o) {
  const utc = (/** @type {number} */ ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (/** @type {string} */ s) => s.replace(/\\/g, "\\\\").replace(/[;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, "\\n");
  const [year, month, day] = o.event.date.split("-").map(Number);
  const at = (/** @type {string} */ hm) => wallTimeToUtc({ year, month, day, hour: Number(hm.slice(0, 2)), minute: Number(hm.slice(3, 5)) }, o.timeZone);
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Sitefloor//${esc(o.firm)} events//EN`, "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:${o.event.id}@${o.firm.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, `DTSTAMP:${utc(o.stamp.getTime())}`,
    `DTSTART:${utc(at(o.event.start))}`, `DTEND:${utc(at(o.event.end))}`,
    `SUMMARY:${esc(`${o.event.title}, ${o.firm}`)}`, `LOCATION:${esc(o.event.place)}`, `DESCRIPTION:${esc(o.event.summary)}`,
    "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
}
