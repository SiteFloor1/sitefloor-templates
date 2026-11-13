// @ts-check
/**
 * Aftercare: the studio's own steps for each kind of work ("day" counted from the day it was fitted),
 * grouped into stages for the page, and written into a calendar file (.ics) as reminders.
 * Calendar times are written in UTC ("Z"), which every calendar app reads the same way.
 */
import { addDays, wallTimeToUtc } from "../../../core/lib/hours.js";

/** @typedef {{ day: number, title: string, body: string }} Step */
/** @typedef {{ id: string, name: string, steps: Step[] }} Service */

/** Local time of day a reminder goes off. */
export const REMIND_AT = { hour: 9, minute: 0 };

/** @param {number} day @returns {string} */
export function stageOf(day) {
  if (day <= 0) return "On the day";
  if (day <= 7) return "First week";
  if (day <= 31) return "First month";
  if (day <= 92) return "First three months";
  return day <= 186 ? "Six months" : "Every year";
}

/**
 * Steps in order, grouped by stage.
 * @param {Step[]} steps @returns {{ stage: string, steps: Step[] }[]}
 */
export function stages(steps) {
  /** @type {{ stage: string, steps: Step[] }[]} */
  const out = [];
  for (const s of [...steps].sort((a, b) => a.day - b.day)) {
    const stage = stageOf(s.day);
    const last = out[out.length - 1];
    if (last?.stage === stage) last.steps.push(s); else out.push({ stage, steps: [s] });
  }
  return out;
}

/** "Day 3", "Week 2", "Month 6". @param {number} day */
export function dayLabel(day) {
  if (day <= 0) return "Day 1";
  if (day < 14) return `Day ${day + 1}`;
  if (day < 60) return `Week ${Math.round(day / 7)}`;
  return `Month ${Math.round(day / 30.4)}`;
}

/**
 * A calendar file with one reminder per step after the fitting day.
 * @param {{ service: Service, fitted: string, place: string, business: string, timeZone: string, stamp: Date }} o fitted is YYYY-MM-DD
 * @returns {string}
 */
export function aftercareIcs(o) {
  const utc = (/** @type {number} */ ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (/** @type {string} */ s) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const events = o.service.steps.filter((s) => s.day >= 1).flatMap((s) => {
    const [year, month, day] = addDays(o.fitted, s.day).split("-").map(Number);
    const start = wallTimeToUtc({ year, month, day, ...REMIND_AT }, o.timeZone);
    return [
      "BEGIN:VEVENT", `UID:${o.service.id}-${o.fitted}-${s.day}@sitefloor`, `DTSTAMP:${utc(o.stamp.getTime())}`,
      `DTSTART:${utc(start)}`, `DTEND:${utc(start + 15 * 60_000)}`,
      `SUMMARY:${esc(`${o.service.name}: ${s.title}`)}`, `LOCATION:${esc(o.place)}`, `DESCRIPTION:${esc(`${s.body}\n\nFrom ${o.business}.`)}`,
      "BEGIN:VALARM", "TRIGGER:PT0M", "ACTION:DISPLAY", `DESCRIPTION:${esc(s.title)}`, "END:VALARM",
      "END:VEVENT",
    ];
  });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sitefloor//Aftercare//EN", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR", ""].join("\r\n");
}
