// @ts-check
/**
 * The pop-up kit's logic, with no DOM: a run of dates in one place (and a tour of several), whether it is on now, the
 * entry times for a day, the brand's sheets (stock and the queue) and the calendar file. Every date, hour, price and
 * figure is the brand's own; this only works out what follows from them for the moment someone looks.
 */
import { rangesFor, formatTime12 } from "../../../core/lib/hours.js";

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

/** "2026-11-26 14:05" (UK time on the sheet) to ms, near enough for a staleness check. @param {string} s */
const sheetTime = (s) => { const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/.exec(s); return m ? Date.parse(`${m[1]}T${m[2]}:${m[3]}:00Z`) : NaN; };

/**
 * Sold out, from the brand's stock sheet (columns: id, sold_out, updated_at). Fails closed: an empty or old sheet
 * (more than `staleDays` since its last update) gives { ok: false } and nothing is marked either way.
 * @param {string} csv @param {number} nowMs @param {number} staleDays
 * @returns {{ ok: true, soldOut: string[] } | { ok: false }}
 */
export function stockFromCsv(csv, nowMs, staleDays = 3) {
  const rows = csvRows(csv);
  if (!rows.length || !("id" in rows[0]) || !("sold_out" in rows[0])) return { ok: false };
  const newest = Math.max(...rows.map((r) => sheetTime(r.updated_at ?? "")).filter((x) => !Number.isNaN(x)));
  if (!Number.isFinite(newest) || nowMs - newest > staleDays * DAY + 2 * 36e5) return { ok: false };
  return { ok: true, soldOut: rows.filter((r) => /^(yes|y|true|1|sold out)$/i.test(r.sold_out)).map((r) => r.id) };
}

/**
 * The queue, from the brand's sheet (columns: minutes, updated_at; the newest row counts). Fails closed: a row older
 * than `staleMinutes` (or none) gives { ok: false } and the line is hidden.
 * @param {string} csv @param {number} nowMs @param {number} staleMinutes
 * @returns {{ ok: true, minutes: number, at: string } | { ok: false }}
 */
export function lineFromCsv(csv, nowMs, staleMinutes = 30) {
  const rows = csvRows(csv).map((r) => ({ m: Number(r.minutes), t: sheetTime(r.updated_at ?? ""), at: (r.updated_at ?? "").slice(11, 16) }))
    .filter((r) => Number.isFinite(r.m) && r.m >= 0 && r.m <= 240 && !Number.isNaN(r.t)).sort((a, b) => b.t - a.t);
  const r = rows[0];
  if (!r || nowMs - r.t > staleMinutes * 6e4 + 36e5 || r.t - nowMs > 36e5 + 6e4) return { ok: false };
  return { ok: true, minutes: r.m, at: r.at };
}

/** The queue in words. @param {number} m @param {string} at */
export function lineWords(m, at) {
  const a = formatTime12(toMinutes(at));
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
