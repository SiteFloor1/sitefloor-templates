// @ts-check
/**
 * The day's light at a place, calculated, never typed in: sunrise, sunset, golden hour and blue hour for a date,
 * latitude and longitude, given in that place's own time zone. The sun's position follows NOAA's solar calculator
 * (Meeus); times are to the nearest minute (checked against the astral library in tests/unit/weddingfilm.test.js).
 *
 * Definitions, stated on the page: sunrise and sunset when the sun's centre is 0.833° below the horizon (refraction
 * and the sun's radius); golden hour while the sun is between 6° above and 4° below the horizon; blue hour from 4° to
 * 6° below. Near the poles some of these never happen on a date; those come back as null and the page says so.
 */

import { wallTimeToUtc } from "../../../core/lib/hours.js";
import { solarAngles } from "../../../core/lib/sun.js";

const STEP = 15_000; // search the day in 15-second steps

/**
 * The sun's elevation above the horizon, in degrees, at an instant. @param {number} ms ms since epoch
 * @param {number} lat degrees north @param {number} lon degrees east
 */
export function elevation(ms, lat, lon) {
  return solarAngles(ms, lat, lon).elevation; // the shared NOAA calculation (src/core/lib/sun.js)
}

/** "HH:MM" on the wall clock of `tz`, rounded to the nearest minute. @param {number} ms @param {string} tz */
export function clock(ms, tz) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(ms + 30_000));
}

/**
 * @typedef {object} Light the evening's light at a place on a date ("HH:MM" local, or null when it doesn't happen)
 * @property {string|null} sunrise
 * @property {string|null} sunset
 * @property {string|null} goldenFrom the sun drops below 6°
 * @property {string|null} goldenTo the sun drops below −4° (blue hour starts)
 * @property {string|null} blueTo the sun drops below −6°
 */

/**
 * The light on a calendar day at a place. Searches the 24 hours around local solar noon.
 * @param {string} ymd YYYY-MM-DD @param {number} lat @param {number} lon @param {string} tz IANA time zone
 * @returns {Light}
 */
export function dayLight(ymd, lat, lon, tz) {
  const [y, m, d] = ymd.split("-").map(Number);
  const noon = Date.UTC(y, m - 1, d, 12) - lon * 4 * 60_000; // solar noon, near enough to split morning from evening
  /** @type {Light} */ const out = { sunrise: null, sunset: null, goldenFrom: null, goldenTo: null, blueTo: null };
  let prev = elevation(noon - 12 * 3_600_000, lat, lon);
  for (let t = noon - 12 * 3_600_000 + STEP; t <= noon + 12 * 3_600_000; t += STEP) {
    const e = elevation(t, lat, lon);
    if (t < noon) { if (prev < -0.833 && e >= -0.833 && !out.sunrise) out.sunrise = clock(t, tz); }
    else {
      if (prev >= 6 && e < 6 && !out.goldenFrom) out.goldenFrom = clock(t, tz);
      if (prev >= -0.833 && e < -0.833 && !out.sunset) out.sunset = clock(t, tz);
      if (prev >= -4 && e < -4 && !out.goldenTo) out.goldenTo = clock(t, tz);
      if (prev >= -6 && e < -6 && !out.blueTo) out.blueTo = clock(t, tz);
    }
    prev = e;
  }
  return out;
}

/** @param {string} hhmm @returns {number} minutes after midnight */
export const minutesOf = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** @param {number} n minutes after midnight @returns {string} "HH:MM" */
export const hhmmOf = (n) => `${String(Math.floor(n / 60) % 24).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

/**
 * The portraits the studio would keep free: from `start` minutes after golden hour begins, for `length` minutes (the
 * studio's own numbers, in site.json). Null when there's no golden hour. @param {Light} l @param {number} start @param {number} length
 * @returns {{ from: string, to: string }|null}
 */
export function portraitWindow(l, start, length) {
  if (!l.goldenFrom) return null;
  const from = minutesOf(l.goldenFrom) + start;
  return { from: hhmmOf(from), to: hhmmOf(from + length) };
}

/**
 * Where a time falls on the day's line, 0–100, the line running from `from` to `to` minutes after midnight.
 * @param {string} hhmm @param {number} [from] @param {number} [to]
 */
export function along(hhmm, from = 240, to = 1380) {
  return Math.max(0, Math.min(100, ((minutesOf(hhmm) - from) / (to - from)) * 100));
}

/** iCalendar text escaping. @param {string} s */
export const icsText = (s) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/**
 * "HH:MM" on a date at a place, as an iCalendar UTC time (20270619T194000Z). @param {string} ymd @param {string} hhmm @param {string} tz
 */
export function icsUtc(ymd, hhmm, tz) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(wallTimeToUtc({ year: y, month: m, day: d, hour: Number(hhmm.slice(0, 2)), minute: Number(hhmm.slice(3, 5)) }, tz)).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * A calendar file for the wedding day's golden hour (and the portrait window inside it, if the studio keeps one), at
 * the place's own time. Times are written in UTC, so the couple's calendar shows them right wherever they are.
 * @param {{ date: string, placeName: string, tz: string, light: Light, portrait: { from: string, to: string }|null, studio: string, stamp: string }} o
 * @returns {string|null} null when the day has no golden hour
 */
export function lightIcs(o) {
  if (!o.light.goldenFrom || !o.light.goldenTo) return null;
  const utc = (/** @type {string} */ hhmm) => icsUtc(o.date, hhmm, o.tz);
  const slug = o.studio.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  /** @param {string} id @param {string} from @param {string} to @param {string} title @param {string} note */
  const ev = (id, from, to, title, note) => ["BEGIN:VEVENT", `UID:${id}-${o.date}@${slug}`, `DTSTAMP:${o.stamp}`, `DTSTART:${utc(from)}`, `DTEND:${utc(to)}`, `SUMMARY:${icsText(title)}`, `DESCRIPTION:${icsText(note)}`, `LOCATION:${icsText(o.placeName)}`, "END:VEVENT"];
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Sitefloor//${icsText(o.studio)} light planner//EN`, "CALSCALE:GREGORIAN",
    ...ev("golden-hour", o.light.goldenFrom, o.light.goldenTo, "Golden hour", `Sunset ${o.light.sunset ?? ""}. Calculated for ${o.placeName}.`),
    ...(o.portrait ? ev("portraits", o.portrait.from, o.portrait.to, `Portraits with ${o.studio}`, "The time we keep free for your portraits.") : []),
    "END:VCALENDAR",
  ].join("\r\n") + "\r\n";
}

/**
 * The planner's WhatsApp message. @param {string} opening
 * @param {{ date: string, placeName: string, light: Light, portrait: { from: string, to: string }|null }} o
 */
export function lightText(opening, o) {
  const lines = [opening.trim(), "", `Wedding: ${o.date}`, `Where: ${o.placeName}`];
  if (o.light.sunset) lines.push(`Sunset: ${o.light.sunset}`);
  if (o.light.goldenFrom && o.light.goldenTo) lines.push(`Golden hour: ${o.light.goldenFrom} to ${o.light.goldenTo}`);
  if (o.portrait) lines.push(`Portraits: ${o.portrait.from} to ${o.portrait.to}`);
  return lines.join("\n");
}
