// @ts-check
/**
 * Street-food and dessert stalls: the pure logic every stalls feature shares (no DOM). Stops come from the stall's own
 * Google Sheet (or a weekly pattern on demos); sold-out lines and party dates likewise. Everything fails closed: an old
 * or unreadable sheet never shows as this week's stops.
 */

export const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** The UK's 14 allergens, by the one-letter or two-letter code a stall prints on its board. */
export const ALLERGENS = {
  G: "Gluten", Cr: "Crustaceans", E: "Egg", F: "Fish", P: "Peanuts", S: "Soya", M: "Milk", N: "Tree nuts",
  Ce: "Celery", Mu: "Mustard", Se: "Sesame", Su: "Sulphites", L: "Lupin", Mo: "Molluscs",
};

/** @typedef {{ date: string, place: string, open: string, close: string, cancelled?: boolean, note?: string }} Stop */
/** @typedef {{ ok: true, stops: Stop[], updatedAt: number|null } | { ok: false }} StopsResult */
/** @typedef {{ date: string, minutes: number }} Now */

/** @param {string} ymd */
const utc = (ymd) => new Date(`${ymd}T12:00:00Z`);
/** @param {string} ymd @param {number} n */
export function addDays(ymd, n) {
  const d = utc(ymd);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
/** @param {string} hhmm */
export const minutesOf = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
/** @param {string} ymd */
export const weekdayOf = (ymd) => utc(ymd).getUTCDay();

/** "Saturday 21 November". @param {string} ymd */
export function longDay(ymd) {
  const d = utc(ymd);
  return `${DAY_NAMES[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}
/** "Sat". @param {string} ymd */
export const shortDay = (ymd) => DAY_NAMES[weekdayOf(ymd)].slice(0, 3);

/** "Today", "Tomorrow", or the weekday within the week, else the long date. @param {string} ymd @param {string} today */
export function dayWord(ymd, today) {
  if (ymd === today) return "Today";
  if (ymd === addDays(today, 1)) return "Tomorrow";
  if (ymd > today && ymd <= addDays(today, 6)) return DAY_NAMES[weekdayOf(ymd)];
  return longDay(ymd);
}

/**
 * The stall's usual week, laid out on real dates from today: [{ day: "sat", place, open, close }] → stops.
 * @param {{ day: string, place: string, open: string, close: string }[]} pattern @param {string} today @param {number} [days]
 * @returns {Stop[]}
 */
export function weekFromPattern(pattern, today, days = 8) {
  /** @type {Stop[]} */ const out = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(today, i);
    for (const p of pattern) if (DAYS.indexOf(p.day) === weekdayOf(date)) out.push({ date, place: p.place, open: p.open, close: p.close });
  }
  return out;
}

/**
 * Stops still to come (or trading now), soonest first; cancelled ones stay, marked, so nobody makes a wasted trip.
 * @param {Stop[]} stops @param {Now} now @param {number} [limit]
 * @returns {(Stop & { live: boolean })[]}
 */
export function upcoming(stops, now, limit = 6) {
  return stops
    .filter((s) => s.date > now.date || (s.date === now.date && minutesOf(s.close) > now.minutes))
    .sort((a, b) => (a.date + a.open < b.date + b.open ? -1 : 1))
    .slice(0, limit)
    .map((s) => ({ ...s, live: !s.cancelled && s.date === now.date && minutesOf(s.open) <= now.minutes }));
}

/** The next stop that isn't cancelled. @param {Stop[]} stops @param {Now} now */
export const nextStop = (stops, now) => upcoming(stops, now, 20).find((s) => !s.cancelled) ?? null;

/** Minutes from now until a stop opens (0 when it's open). @param {Stop} s @param {Now} now */
export function minutesUntil(s, now) {
  const days = Math.round((utc(s.date).getTime() - utc(now.date).getTime()) / 86_400_000);
  return Math.max(0, days * 1440 + minutesOf(s.open) - now.minutes);
}

/** "1d 10h 52m", "3h 5m", "12m". @param {number} mins */
export function untilWords(mins) {
  const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
  return d ? `${d}d ${h}h ${m}m` : h ? `${h}h ${m}m` : `${m}m`;
}

/** A maps search for a place: no paid map, works on every phone. @param {{ name: string, market?: string, postcode: string }} p */
export const mapsHref = (p) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([p.market, p.name, p.postcode].filter(Boolean).join(" "))}`;

/** @param {number} n */
const pad = (n) => String(n).padStart(2, "0");
/** Floating local time in the calendar file, so a phone shows the stall's own clock. @param {string} ymd @param {string} hhmm */
const icsTime = (ymd, hhmm) => `${ymd.replace(/-/g, "")}T${hhmm.replace(":", "")}00`;
/** @param {string} s */
const icsText = (s) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

/**
 * One stop as a calendar file (.ics).
 * @param {Stop} s @param {{ name: string, market?: string, postcode: string }} place @param {string} business @param {number} stamp ms
 */
export function stopIcs(s, place, business, stamp) {
  const d = new Date(stamp);
  const dtstamp = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sitefloor//Stalls//EN", "BEGIN:VEVENT",
    `UID:${s.date}-${s.open.replace(":", "")}-${slug(place.name)}@sitefloor`, `DTSTAMP:${dtstamp}`,
    `DTSTART:${icsTime(s.date, s.open)}`, `DTEND:${icsTime(s.date, s.close)}`,
    `SUMMARY:${icsText(`${business} at ${place.name}`)}`,
    `LOCATION:${icsText([place.market, place.name, place.postcode].filter(Boolean).join(", "))}`,
    "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
}
/** @param {string} s */
export const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ---------------------------------------------------------------- reading the sheets

/** Minimal CSV: quoted fields, commas and newlines inside quotes. @param {string} text @returns {string[][]} */
export function csvRows(text) {
  /** @type {string[][]} */ const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ""));
}

/** @param {string[][]} rows @param {string[]} need */
function header(rows, need) {
  const head = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
  const at = Object.fromEntries(need.map((k) => [k, head.indexOf(k)]));
  return need.every((k) => at[k] >= 0) ? at : null;
}

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const HM = /^([01]\d|2[0-3]):[0-5]\d$/;
/** "2026-11-02 09:12" in the stall's time zone, roughly: good enough to tell a fresh sheet from an old one. @param {string} s */
const stampOf = (s) => { const t = Date.parse(s.trim().replace(" ", "T") + (s.includes("Z") ? "" : "Z")); return Number.isFinite(t) ? t : null; };

/**
 * The stall's stops sheet: date, place, open, close, status (on or cancelled), note, updated_at. A row it can't read,
 * or a newest updated_at older than staleAfterDays, fails the whole sheet (better "check Instagram" than a wrong stop).
 * @param {string} text @param {number} now ms @param {number} staleAfterDays @returns {StopsResult}
 */
export function stopsFromCsv(text, now, staleAfterDays) {
  const rows = csvRows(text);
  const at = header(rows, ["date", "place", "open", "close", "status", "updated_at"]);
  if (!at) return { ok: false };
  const noteAt = (rows[0] ?? []).map((h) => h.trim().toLowerCase()).indexOf("note");
  /** @type {Stop[]} */ const stops = [];
  let newest = null;
  for (const r of rows.slice(1)) {
    const date = (r[at.date] ?? "").trim(), open = (r[at.open] ?? "").trim(), close = (r[at.close] ?? "").trim();
    const status = (r[at.status] ?? "").trim().toLowerCase(), place = (r[at.place] ?? "").trim();
    if (!YMD.test(date) || !HM.test(open) || !HM.test(close) || !place || !["on", "cancelled", ""].includes(status)) return { ok: false };
    const t = stampOf(r[at.updated_at] ?? "");
    if (t !== null && (newest === null || t > newest)) newest = t;
    stops.push({ date, place, open, close, cancelled: status === "cancelled", note: noteAt >= 0 ? (r[noteAt] ?? "").trim() : "" });
  }
  if (newest === null || now - newest > staleAfterDays * 86_400_000) return { ok: false };
  return { ok: true, stops, updatedAt: newest };
}

/**
 * Sold out today: the stall's Form writes item, time and the date; only today's rows count, so nothing carries over.
 * @param {string} text @param {string} today @returns {{ ok: true, out: Record<string, string> } | { ok: false }}
 */
export function soldOutFromCsv(text, today) {
  const rows = csvRows(text);
  const at = header(rows, ["date", "item", "time"]);
  if (!at) return { ok: false };
  /** @type {Record<string, string>} */ const out = {};
  for (const r of rows.slice(1)) {
    const date = (r[at.date] ?? "").trim(), item = (r[at.item] ?? "").trim(), time = (r[at.time] ?? "").trim();
    if (date !== today || !item) continue;
    if (!HM.test(time)) return { ok: false };
    out[item.toLowerCase()] = time;
  }
  return { ok: true, out };
}

/**
 * Party dates the stall has already promised: date, status (taken or few), updated_at. Not listed = free so far.
 * @param {string} text @param {number} now @param {number} staleAfterDays
 * @returns {{ ok: true, days: Record<string, "taken"|"few"> } | { ok: false }}
 */
export function partyDatesFromCsv(text, now, staleAfterDays) {
  const rows = csvRows(text);
  const at = header(rows, ["date", "status", "updated_at"]);
  if (!at) return { ok: false };
  /** @type {Record<string, "taken"|"few">} */ const days = {};
  let newest = null;
  for (const r of rows.slice(1)) {
    const date = (r[at.date] ?? "").trim(), status = (r[at.status] ?? "").trim().toLowerCase();
    if (!YMD.test(date) || !["taken", "few", "open"].includes(status)) return { ok: false };
    const t = stampOf(r[at.updated_at] ?? "");
    if (t !== null && (newest === null || t > newest)) newest = t;
    if (status !== "open") days[date] = /** @type {"taken"|"few"} */ (status);
  }
  if (newest === null || now - newest > staleAfterDays * 86_400_000) return { ok: false };
  return { ok: true, days };
}

/**
 * The party date check's answer. Never says booked: a taken day still asks, because a stall can sometimes send a
 * second pair of hands.
 * @param {string} date @param {string} today @param {{ ok: boolean, days?: Record<string, string> }|null} diary
 * @returns {{ state: "idle"|"past"|"unknown"|"open"|"few"|"taken", words: string }}
 */
export function partyAnswer(date, today, diary) {
  if (!date) return { state: "idle", words: "Choose the day of your party." };
  if (date < today) return { state: "past", words: "That day has gone. Choose a day ahead." };
  if (!diary || !diary.ok) return { state: "unknown", words: "We can't see the diary just now. Ask, and we'll reply with the day." };
  const s = diary.days?.[date];
  if (s === "taken") return { state: "taken", words: "Already promised. Ask anyway: the evening or the next day may work." };
  if (s === "few") return { state: "few", words: "One booking already; there may be room for yours." };
  return { state: "open", words: "Free so far. Send the details and we'll confirm." };
}

// ---------------------------------------------------------------- words and messages

/** "£7.50", "£6". @param {number} n */
export const pounds = (n) => `£${Number.isInteger(n) ? n : n.toFixed(2)}`;

/** "G E M" → "Gluten, egg, milk". @param {string} codes */
export function allergenWords(codes) {
  const list = codes.split(/\s+/).filter(Boolean).map((c) => /** @type {Record<string,string>} */ (ALLERGENS)[c]).filter(Boolean);
  if (!list.length) return "None of the 14 allergens";
  return list.map((w, i) => (i ? w.toLowerCase() : w)).join(", ");
}

/**
 * The party enquiry on WhatsApp. @param {string} opening
 * @param {{ date?: string, guests?: string|number, postcode?: string, kind?: string }} d
 */
export function partyText(opening, d) {
  const lines = [opening];
  if (d.kind) lines.push(`It's for: ${d.kind}`);
  if (d.date) lines.push(`Date: ${longDay(d.date)} ${d.date.slice(0, 4)}`);
  if (d.guests) lines.push(`Guests: about ${d.guests}`);
  if (d.postcode) lines.push(`Postcode: ${d.postcode.toUpperCase()}`);
  return lines.join("\n");
}

/** The set-up card as plain text for an organiser. @param {string} business @param {{ label: string, value: string }[]} rows */
export const setupText = (business, rows) => [`${business}: what we need on the day`, ...rows.map((r) => `${r.label}: ${r.value}`)].join("\n");

/**
 * Rain on a stop's hours from an hourly forecast ({ time: "2026-11-21T14:00", p: 70 }[]). Never cancels anything.
 * @param {{ time: string, p: number }[]} hours @param {Stop} s
 */
export function rainWords(hours, s) {
  const inHours = hours.filter((h) => h.time.slice(0, 10) === s.date && minutesOf(h.time.slice(11, 16)) >= minutesOf(s.open) - 60 && minutesOf(h.time.slice(11, 16)) < minutesOf(s.close));
  if (!inHours.length) return "";
  const wet = inHours.find((h) => h.p >= 60);
  if (wet) return `Rain likely from ${wet.time.slice(11, 16)}, by the forecast.`;
  return "Dry, by the forecast.";
}
