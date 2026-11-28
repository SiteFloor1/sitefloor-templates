// @ts-check
/**
 * The pop-up kit's logic, with no DOM: a run of dates in one place (and a tour of several), whether it is on now, the
 * entry times for a day, the brand's sheets (stock and the queue) and the calendar file. Every date, hour, price and
 * figure is the brand's own; this only works out what follows from them for the moment someone looks.
 */
import { rangesFor, formatTime12, zonedNow } from "../../../core/lib/hours.js";
import { parseSheetTime } from "../../../core/lib/sheet.js";

const DAY = 864e5;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** @typedef {{ id: string, city: string, place: string, area: string, postcode: string, start: string, end: string, lat: number, lon: number, note?: string, photo?: any, booking?: string }} Stop */
/** @typedef {{ date: string, minutes: number }} Now */
/** @typedef {{ kind: "on"|"soon"|"ended", days: number }} StopState */

/** @param {string} ymd */
const utc = (ymd) => Date.parse(`${ymd}T12:00:00Z`);
/** @param {string} ymd @param {number} n */
export const addDays = (ymd, n) => new Date(utc(ymd) + n * DAY).toISOString().slice(0, 10);
/** Whole days from a to b. @param {string} a @param {string} b */
export const daysBetween = (a, b) => Math.round((utc(b) - utc(a)) / DAY);
/** "20 November" @param {string} ymd */
export const longDate = (ymd) => { const d = new Date(utc(ymd)); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`; };
/** "20 Nov" @param {string} ymd */
export const shortDate = (ymd) => { const d = new Date(utc(ymd)); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)}`; };
/** "Thu" @param {string} ymd */
export const shortDay = (ymd) => WEEKDAYS[new Date(utc(ymd)).getUTCDay()].slice(0, 3);
/** "Thursday 4 December" @param {string} ymd */
export const fullDate = (ymd) => `${WEEKDAYS[new Date(utc(ymd)).getUTCDay()]} ${longDate(ymd)}`;
/** The day of the month. @param {string} ymd */
export const dayOfMonth = (ymd) => new Date(utc(ymd)).getUTCDate();

/**
 * The stops as dates. A client's stops carry dates ("2027-01-09"); a demo's carry days from today (-6, 13), so its
 * pop-up is always on now, worked out on the day (the build day for the first paint, the visitor's day in the browser).
 * @param {any} popup site.popup @param {string} today
 * @returns {Stop[]}
 */
export function resolveStops(popup, today) {
  return (popup?.stops ?? []).map((/** @type {any} */ s) => ({
    ...s,
    start: typeof s.start === "number" ? addDays(today, s.start) : s.start,
    end: typeof s.end === "number" ? addDays(today, s.end) : s.end,
  }));
}

/** @param {Stop} s @param {string} today @returns {StopState} */
export function stopState(s, today) {
  if (today < s.start) return { kind: "soon", days: daysBetween(today, s.start) };
  if (today > s.end) return { kind: "ended", days: daysBetween(s.end, today) };
  return { kind: "on", days: daysBetween(today, s.end) };
}

/** The stop the home page is about: on now, else the next to open, else the last to end. @param {Stop[]} stops @param {string} today */
export function currentStop(stops, today) {
  const on = stops.find((s) => stopState(s, today).kind === "on");
  if (on) return on;
  const soon = stops.filter((s) => s.start > today).sort((a, b) => a.start.localeCompare(b.start))[0];
  if (soon) return soon;
  return [...stops].sort((a, b) => b.end.localeCompare(a.end))[0] ?? null;
}

/** The next stop to open after today, for the countdown. @param {Stop[]} stops @param {string} today */
export const nextOpening = (stops, today) => stops.filter((s) => s.start > today).sort((a, b) => a.start.localeCompare(b.start))[0] ?? null;

/** The tour in order: on now first, then the openings soonest first, then the ended ones, latest first. @param {Stop[]} stops @param {string} today */
export function tourOrder(stops, today) {
  const rank = { on: 0, soon: 1, ended: 2 };
  return [...stops].sort((a, b) => {
    const A = stopState(a, today), B = stopState(b, today);
    if (A.kind !== B.kind) return rank[A.kind] - rank[B.kind];
    return A.kind === "ended" ? b.end.localeCompare(a.end) : a.start.localeCompare(b.start);
  });
}

/**
 * The site's opening hours limited to its stops, for every page's open/closed status: no weekly hours, and each day of
 * each stop as its own entry (the usual week's hours, or the brand's own exception for that day). A demo's stops are
 * days from today and always surround today, so a demo keeps its usual week.
 * @param {any} site
 */
export function runHours(site) {
  const hours = site.hours, stops = site.popup?.stops ?? [];
  if (!stops.length || stops.some((/** @type {any} */ s) => typeof s.start === "number")) return hours;
  const KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const own = new Map((hours.exceptions ?? []).map((/** @type {any} */ e) => [e.date, e]));
  /** @type {Map<string, any>} */ const days = new Map();
  for (const s of stops) for (let d = s.start; d <= s.end; d = addDays(d, 1))
    days.set(d, own.get(d) ?? { date: d, ranges: hours.weekly[KEYS[new Date(utc(d)).getUTCDay()]] ?? [] });
  return { ...hours, weekly: Object.fromEntries(KEYS.map((k) => [k, []])), exceptions: [...days.values()].sort((a, b) => a.date.localeCompare(b.date)) };
}

/** "HH:MM" to minutes. @param {string} t */
export const toMinutes = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

/** The opening ranges for a day of the run, in minutes; none outside it. @param {any} hours @param {Stop} s @param {string} ymd @returns {[number, number][]} */
export function dayRanges(hours, s, ymd) {
  if (!s || ymd < s.start || ymd > s.end) return [];
  return rangesFor(hours, ymd).ranges.map((/** @type {any} */ r) => /** @type {[number, number]} */ ([toMinutes(r[0]), toMinutes(r[1])]));
}

/**
 * The one line on whether to go: "Open now, until 9pm", "Opens at 11am today", "Closed now. Opens tomorrow at 11am",
 * "Opens 9 January", "Ended 9 December". Only the run's own days count.
 * @param {any} hours @param {Stop} s @param {Now} now
 */
export function runLine(hours, s, now) {
  if (!s) return "";
  const st = stopState(s, now.date);
  if (st.kind === "ended") return `Ended ${longDate(s.end)}`;
  if (st.kind === "soon") return `Opens ${longDate(s.start)}`;
  for (const [a, b] of dayRanges(hours, s, now.date)) {
    if (now.minutes < a) return `Opens at ${formatTime12(a)} today`;
    if (now.minutes < b) return `Open now, until ${formatTime12(b)}`;
  }
  for (let k = 1; k <= 14; k++) {
    const d = addDays(now.date, k), r = dayRanges(hours, s, d)[0];
    if (r) return `Closed now. Opens ${k === 1 ? "tomorrow" : WEEKDAYS[new Date(utc(d)).getUTCDay()]} at ${formatTime12(r[0])}`;
  }
  return "Closed now. That was the last day";
}

/** Is the pop-up open this minute? @param {any} hours @param {Stop} s @param {Now} now */
export const isOpen = (hours, s, now) => dayRanges(hours, s, now.date).some(([a, b]) => now.minutes >= a && now.minutes < b);

/**
 * Entry times for a day: every `every` minutes from opening, the last one `lastBefore` minutes before closing. On
 * today, times already gone are left out.
 * @param {any} hours @param {Stop} s @param {string} ymd @param {Now|null} now @param {number} every @param {number} lastBefore
 * @returns {number[]}
 */
export function entryTimes(hours, s, ymd, now, every = 30, lastBefore = 60) {
  const out = [];
  for (const [a, b] of dayRanges(hours, s, ymd)) for (let t = a; t <= b - lastBefore; t += every) out.push(t);
  return now && now.date === ymd ? out.filter((t) => t > now.minutes) : out;
}

/** The days left in the run from today, each with whether it opens. @param {any} hours @param {Stop} s @param {string} today */
export function runDays(hours, s, today) {
  const from = today > s.start ? today : s.start, out = [];
  for (let d = from; d <= s.end && out.length < 60; d = addDays(d, 1)) out.push({ date: d, open: dayRanges(hours, s, d).length > 0 });
  return out;
}

/**
 * Where a time goes: the brand's booking page, with the day and time filled in when its link has {date} and {time}.
 * @param {string} url @param {string} ymd @param {number} minutes
 */
export function slotHref(url, ymd, minutes) {
  const hhmm = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  return url.replaceAll("{date}", encodeURIComponent(ymd)).replaceAll("{time}", encodeURIComponent(hhmm));
}

/** @param {string} s */
export const slug = (s) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
/** @param {string} s */
const icsText = (s) => s.replace(/\\/g, "\\\\").replace(/[,;]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");

/**
 * The run as an all-day calendar entry (or one time, when `minutes` is given).
 * @param {Stop} s @param {string} business @param {number} stampMs @param {{ date: string, minutes: number }} [at]
 */
export function stopIcs(s, business, stampMs, at) {
  const d = (/** @type {string} */ ymd) => ymd.replace(/-/g, "");
  const stamp = new Date(stampMs).toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const t = (/** @type {number} */ m) => `${String(Math.floor(m / 60)).padStart(2, "0")}${String(m % 60).padStart(2, "0")}00`;
  const when = at
    ? [`DTSTART;TZID=Europe/London:${d(at.date)}T${t(at.minutes)}`, `DTEND;TZID=Europe/London:${d(at.date)}T${t(at.minutes + 60)}`]
    : [`DTSTART;VALUE=DATE:${d(s.start)}`, `DTEND;VALUE=DATE:${d(addDays(s.end, 1))}`];
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sitefloor//Pop-up//EN", "BEGIN:VEVENT",
    `UID:${slug(business)}-${s.id}-${at ? `${at.date}-${at.minutes}` : s.start}@sitefloor.com`, `DTSTAMP:${stamp}`, ...when,
    `SUMMARY:${icsText(`${business}, ${s.city}`)}`, `LOCATION:${icsText(`${s.place}, ${s.area} ${s.postcode}`)}`,
    "END:VEVENT", "END:VCALENDAR"].join("\r\n");
}

/** A maps search for the address. @param {Stop} s */
export const mapsHref = (s) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.place}, ${s.area} ${s.postcode}`)}`;

/** "£18", "£18.50". @param {number} n */
export const pounds = (n) => `£${Number.isInteger(n) ? n : n.toFixed(2)}`;

/** Total minutes of a visit, from the rooms. @param {{ minutes: number }[]} rooms */
export const visitMinutes = (rooms) => rooms.reduce((a, r) => a + r.minutes, 0);

/**
 * A plain CSV reader (quoted fields, commas and new lines inside quotes).
 * @param {string} csv @returns {Record<string, string>[]}
 */
export function csvRows(csv) {
  const rows = [], cur = []; let field = "", q = false;
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (q) { if (c === '"' && csv[i + 1] === '"') { field += '"'; i++; } else if (c === '"') q = false; else field += c; continue; }
    if (c === '"') q = true; else if (c === ",") { cur.push(field); field = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && csv[i + 1] === "\n") i++; cur.push(field); rows.push([...cur]); cur.length = 0; field = ""; }
    else field += c;
  }
  if (field || cur.length) { cur.push(field); rows.push([...cur]); }
  const [head, ...body] = rows.filter((r) => r.some((x) => x.trim()));
  if (!head) return [];
  const keys = head.map((k) => k.trim().toLowerCase());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

const SOLD = /^(yes|y|true|1|sold out)$/i, IN_STOCK = /^(no|n|false|0|in stock)?$/i;

/**
 * Sold out, from the brand's stock sheet (columns: id, sold_out, updated_at; times are UK time). Fails closed, so the
 * page marks nothing either way, when: the sheet is empty or misses a column; a row names a piece the site doesn't
 * have, has a sold_out value other than yes/no, or an unreadable time; a time is in the future; or the newest update
 * is more than `staleDays` old.
 * @param {string} csv @param {number} nowMs @param {string[]} ids the site's pieces @param {number} staleDays @param {string} [tz]
 * @returns {{ ok: true, soldOut: string[] } | { ok: false }}
 */
export function stockFromCsv(csv, nowMs, ids, staleDays = 3, tz = "Europe/London") {
  const rows = csvRows(csv);
  if (!rows.length || !("id" in rows[0]) || !("sold_out" in rows[0]) || !("updated_at" in rows[0])) return { ok: false };
  const known = new Set(ids), out = [];
  let newest = -Infinity;
  for (const r of rows) {
    const t = parseSheetTime(r.updated_at, tz);
    if (!known.has(r.id) || Number.isNaN(t) || t > nowMs + 5 * 6e4) return { ok: false };
    if (SOLD.test(r.sold_out)) out.push(r.id);
    else if (!IN_STOCK.test(r.sold_out)) return { ok: false };
    newest = Math.max(newest, t);
  }
  if (nowMs - newest > staleDays * DAY) return { ok: false };
  return { ok: true, soldOut: out };
}

/**
 * The queue, from the brand's sheet (columns: minutes, updated_at; a Google Form adds rows at the bottom, so the last
 * row is the newest; times are UK time). Fails closed: no rows, a last row that can't be read, a time in the future,
 * or a last row more than `staleMinutes` old gives { ok: false } and the line is hidden.
 * @param {string} csv @param {number} nowMs @param {number} staleMinutes @param {string} [tz]
 * @returns {{ ok: true, minutes: number, at: number } | { ok: false }}
 */
export function lineFromCsv(csv, nowMs, staleMinutes = 30, tz = "Europe/London") {
  const rows = csvRows(csv);
  const r = rows.at(-1);
  if (!r || !("minutes" in r) || !("updated_at" in r)) return { ok: false };
  const m = /^\d{1,3}$/.test(r.minutes) ? Number(r.minutes) : NaN, t = parseSheetTime(r.updated_at, tz);
  if (!(m >= 0 && m <= 240) || Number.isNaN(t) || t > nowMs + 5 * 6e4 || nowMs - t > staleMinutes * 6e4) return { ok: false };
  return { ok: true, minutes: m, at: zonedNow(new Date(t), tz).minutes };
}

/** The queue in words. @param {number} m @param {number} atMinutes minutes after midnight, UK time */
export function lineWords(m, atMinutes) {
  const a = formatTime12(atMinutes);
  if (m <= 0) return `No queue right now (at ${a})`;
  return `Queue about ${m} minutes (at ${a})`;
}

/** Map of Britain: longitude and latitude to the outline's coordinates (lib/gb-outline.js). @param {number} lon @param {number} lat */
export function project(lon, lat) {
  const k = 60, c = Math.cos((54.5 * Math.PI) / 180);
  return { x: Math.round((lon + 8.3) * k * c * 10) / 10, y: Math.round((60.95 - lat) * k * 10) / 10 };
}

/** The line under a stop: on now / opens in N days / ended. @param {StopState} st @param {Stop} s */
export function stateWords(st, s) {
  if (st.kind === "on") return st.days === 0 ? "On now, last day today" : `On now, ${st.days} ${st.days === 1 ? "day" : "days"} left`;
  if (st.kind === "soon") return st.days === 1 ? "Opens tomorrow" : `Opens in ${st.days} days`;
  return `Ended ${longDate(s.end)}`;
}

/** The WhatsApp text for an invitation, from the chosen time. @param {string} business @param {Stop} s @param {string} ymd @param {number} minutes */
export function inviteText(business, s, ymd, minutes) {
  return `Come with me to ${business}: ${fullDate(ymd)} at ${formatTime12(minutes)}, ${s.place}, ${s.area}. (Not a ticket: book your own time on their site.)`;
}

export { formatTime12 };
