// @ts-check
/**
 * The hair kit's arithmetic, with no DOM: prices by length and stylist level, times, the colour year, the skin-test
 * day, the stylist match, the stylists' next free days from the salon's published sheet, and the words for each.
 * Every figure comes from the salon's own site.json; nothing here invents a price, a time or a rule.
 */
import { addDaysYmd, daysBetween, MONTHS } from "../../../core/lib/diary.js";
import { parseCsv } from "../../../core/lib/sheet.js";

/** @typedef {{ id: string, name: string, line?: string }} Named */
/** @typedef {{ id: string, name: string, group: string, text?: string, prices: Record<string, number|number[]>|null, minutes: number|number[], skinTest?: boolean }} Service */
/** @typedef {{ lengths: Named[], levels: Named[], groups: Named[], services: Service[] }} Menu */
/** @typedef {{ id: string, name: string, level: string, does: string[], textures?: string[], order?: number }} Stylist */

/** Whole pounds as the salon writes them. @param {number} n */
export const money = (n) => `£${n.toLocaleString("en-GB")}`;

/** Minutes in words: "45 min", "1 hr", "1 hr 30 min". @param {number} m */
export function hm(m) {
  const h = Math.floor(m / 60), r = m % 60;
  return [h ? `${h} hr` : "", r ? `${r} min` : ""].filter(Boolean).join(" ");
}

/** Does this service's price change with length? @param {Service} s */
export const byLength = (s) => Boolean(s.prices) && Object.values(/** @type {object} */ (s.prices)).some(Array.isArray);

/**
 * The price for one level and length, or null when the salon prices it at a consultation or that level doesn't do it.
 * @param {Service} s @param {string} level @param {number} lengthIndex
 */
export function priceAt(s, level, lengthIndex) {
  const p = s.prices?.[level];
  if (p === undefined) return null;
  return Array.isArray(p) ? p[lengthIndex] ?? null : p;
}

/** The time for a length. @param {Service} s @param {number} lengthIndex */
export const minutesAt = (s, lengthIndex) => (Array.isArray(s.minutes) ? s.minutes[lengthIndex] ?? s.minutes[s.minutes.length - 1] : s.minutes);

/** The lowest price anywhere on the service's grid, or null. @param {Service} s */
export function fromPrice(s) {
  if (!s.prices) return null;
  const all = Object.values(s.prices).flatMap((p) => (Array.isArray(p) ? p : [p]));
  return all.length ? Math.min(...all) : null;
}

/** The shortest time on the service. @param {Service} s */
export const fewestMinutes = (s) => (Array.isArray(s.minutes) ? Math.min(...s.minutes) : s.minutes);

/** "From £68 · about 1 hr" or the consultation line. @param {Service} s */
export function fromWords(s) {
  const p = fromPrice(s);
  return p === null ? "Priced at a free consultation" : `From ${money(p)} · about ${hm(fewestMinutes(s))}`;
}

/**
 * The booking message: the salon's opening line, then what the visitor chose, in plain words.
 * @param {string} opening @param {{ service?: string, level?: string, length?: string, stylist?: string, extra?: string[] }} o
 */
export function bookText(opening, o) {
  const parts = [opening.trim()];
  if (o.service) parts.push(`${o.service}${o.level ? ` with a ${o.level.toLowerCase()}` : ""}${o.stylist ? ` with ${o.stylist}` : ""}.`);
  else if (o.stylist) parts.push(`I'd like to book with ${o.stylist}.`);
  if (o.length) parts.push(`Length: ${o.length.toLowerCase()}.`);
  for (const x of o.extra ?? []) if (x) parts.push(x);
  return parts.join(" ");
}

/**
 * The next visits in the coming months, every `weeks` from the last colour, from tomorrow on.
 * @param {string} last YYYY-MM-DD @param {number} weeks @param {string} today @param {number} [months]
 * @returns {string[]}
 */
export function upkeepVisits(last, weeks, today, months = 12) {
  if (!(weeks > 0)) return [];
  const end = addDaysYmd(today, Math.round(months * 30.44));
  const out = [];
  for (let d = addDaysYmd(last, 7 * weeks); d <= end && out.length < 60; d = addDaysYmd(d, 7 * weeks)) if (d > today) out.push(d);
  return out;
}

/** The latest day for the skin test before a colour appointment, by the salon's rule in hours. @param {string} colour @param {number} hours */
export const skinTestDay = (colour, hours) => addDaysYmd(colour, -Math.ceil(hours / 24));

/**
 * The stylist whose work fits: they must do the service (and the texture, when asked); then the first free day or the
 * most senior level, as the visitor prefers; ties go to the salon's own order.
 * @param {Stylist[]} stylists @param {string[]} levelOrder lowest level first
 * @param {{ doing: string, texture?: string, want: "soon"|"senior" }} a
 * @param {Record<string, string>} [free] stylist id → next free day (YYYY-MM-DD)
 * @returns {Stylist|null}
 */
export function matchStylist(stylists, levelOrder, a, free = {}) {
  const can = stylists.filter((s) => s.does.includes(a.doing));
  const tx = a.texture;
  const fit = tx ? can.filter((s) => !s.textures || s.textures.includes(tx)) : can;
  const pool = fit.length ? fit : can;
  if (!pool.length) return null;
  const rank = (/** @type {Stylist} */ s) => levelOrder.indexOf(s.level);
  const order = (/** @type {Stylist} */ s) => stylists.indexOf(s);
  const day = (/** @type {Stylist} */ s) => free[s.id] ?? "9999-12-31";
  return [...pool].sort((x, y) => (a.want === "soon"
    ? (day(x) < day(y) ? -1 : day(x) > day(y) ? 1 : rank(y) - rank(x) || order(x) - order(y))
    : rank(y) - rank(x) || (day(x) < day(y) ? -1 : day(x) > day(y) ? 1 : order(x) - order(y))))[0];
}

/**
 * Next free days from the salon's published sheet: a header row, then one row per stylist with their id, the next free
 * day (YYYY-MM-DD or DD/MM/YYYY) and the day that row was last updated. Fails closed, row by row: a row updated more
 * than `staleDays` ago, updated in the future (a typo like 2027), or with no readable date is left out, so that stylist
 * shows nothing; so is a next free day already past. No usable row returns { ok: false }.
 * @param {string} csv @param {string} today @param {number} staleDays
 * @returns {{ ok: true, days: Record<string, string> } | { ok: false }}
 */
export function freeDaysFromCsv(csv, today, staleDays) {
  /** @type {Record<string, string>} */ const days = {};
  for (const [id, next, updated] of parseCsv(csv).slice(1)) {
    const d = ymdOf(next ?? ""), u = ymdOf((updated ?? "").slice(0, 10));
    if (!id?.trim() || !d || !u || u > today || daysBetween(u, today) > staleDays || d < today) continue;
    days[id.trim().toLowerCase()] = d;
  }
  return Object.keys(days).length ? { ok: true, days } : { ok: false };
}

/**
 * Chairs free today from the salon's published sheet: a header row, then one row per free slot with the service id
 * (from the salon's own list), the time (HH:MM), the stylist id and when the row was updated ("YYYY-MM-DD HH:MM").
 * Fails closed: a row updated on another day or later than now, a slot already started, a time outside the salon's
 * opening hours today, or a service or stylist the salon hasn't listed is left out. Sorted by time; nothing usable
 * returns { ok: false }.
 * @param {string} csv @param {{ date: string, minutes: number }} now the salon's today and minutes since midnight
 * @param {{ services: string[], stylists: string[], open: [number, number][] }} allow opening ranges in minutes
 * @returns {{ ok: true, slots: { service: string, time: string, stylist: string }[] } | { ok: false }}
 */
export function chairsFromCsv(csv, now, allow) {
  const slots = [];
  for (const [service, time, stylist, updated] of parseCsv(csv).slice(1)) {
    const t = minutesOf(time ?? ""), u = (updated ?? "").trim();
    const uDay = ymdOf(u.slice(0, 10)), uMin = minutesOf(u.slice(11, 16));
    if (t < 0 || uDay !== now.date || uMin < 0 || uMin > now.minutes || t <= now.minutes) continue;
    const sv = (service ?? "").trim().toLowerCase(), st = (stylist ?? "").trim().toLowerCase();
    if (!allow.services.includes(sv) || !allow.stylists.includes(st) || !allow.open.some(([a, b]) => t >= a && t < b)) continue;
    slots.push({ service: sv, time: (time ?? "").trim().padStart(5, "0"), stylist: st });
  }
  slots.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
  return slots.length ? { ok: true, slots } : { ok: false };
}

/** "14:30" → 870, or -1 when unreadable. @param {string} s */
export function minutesOf(s) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  return m && Number(m[1]) < 24 && Number(m[2]) < 60 ? Number(m[1]) * 60 + Number(m[2]) : -1;
}

/** @param {string} s @returns {string} YYYY-MM-DD or "" */
function ymdOf(s) {
  const t = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : "";
}

/** "today", "tomorrow", "Thursday" (this week) or "18 November". @param {string} ymd @param {string} today */
export function freeWords(ymd, today) {
  const n = daysBetween(today, ymd);
  if (n <= 0) return "today";
  if (n === 1) return "tomorrow";
  const d = new Date(`${ymd}T12:00:00Z`);
  if (n < 7) return d.toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" });
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** A short month for the colour year. @param {string} ymd */
export const monthShort = (ymd) => MONTHS[Number(ymd.slice(5, 7)) - 1].slice(0, 3);

/** @param {string} s */
const icsText = (s) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/**
 * All-day events as a calendar file (no times, so no time zone can move them).
 * @param {{ salon: string, place: string, stamp: string, events: { id: string, date: string, title: string, note?: string }[] }} o stamp = UTC "YYYYMMDDTHHMMSSZ"
 */
export function eventsIcs(o) {
  const host = o.salon.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Sitefloor//${icsText(o.salon)}//EN`, "CALSCALE:GREGORIAN",
    ...o.events.flatMap((e) => [
      "BEGIN:VEVENT", `UID:${e.id}-${e.date}@${host}`, `DTSTAMP:${o.stamp}`,
      `DTSTART;VALUE=DATE:${e.date.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${addDaysYmd(e.date, 1).replace(/-/g, "")}`,
      `SUMMARY:${icsText(`${e.title} · ${o.salon}`)}`, ...(e.note ? [`DESCRIPTION:${icsText(e.note)}`] : []), `LOCATION:${icsText(o.place)}`, "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ].join("\r\n") + "\r\n";
}

/** Now as an iCalendar UTC stamp. @param {Date} [d] */
export const icsStamp = (d = new Date()) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
