// @ts-check
/**
 * Event designers and producers: pure logic, no DOM. Dates (free, held, booked) from the agency's sheet, the next free
 * day, the brief as one message, key dates worked back from the event into a calendar file, the room drawn for a number
 * of guests, and the private proposal sheet. Every date, room, venue and figure is the agency's own; nothing here
 * invents a fact, and the room plan is a guide that says so (the venue's own capacity and rules decide).
 */
import { parseCsv } from "../../../core/lib/sheet.js";

const DAY = 86_400_000;
export const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
export const LAYOUTS = { long: "Long tables", round: "Round tables", standing: "Standing" };

/** A real calendar date written YYYY-MM-DD (2027-02-30 is not). @param {any} s */
export function realDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s))) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
/** @param {string} ymd @param {number} n */
export function addDays(ymd, n) { return new Date(Date.parse(`${ymd}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10); }
/** Whole days from one date to another. @param {string} from @param {string} to */
export function daysTo(from, to) { return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY); }
/** @param {string} ymd */
export function weekday(ymd) { return WEEKDAYS[new Date(`${ymd}T12:00:00Z`).getUTCDay()]; }
/** "Saturday 12 June 2027". @param {string} ymd */
export function longDate(ymd) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${ymd}T12:00:00Z`)).replace(",", "");
}
/** "12 June". @param {string} ymd */
export function dayMonth(ymd) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${ymd}T12:00:00Z`));
}

/**
 * The agency's dates sheet, published as CSV: `date, status, updated` where status is held or booked (any date not
 * listed is free). Fails closed: no `updated`, an updated date in the future, or older than `staleAfterDays` means
 * the page can't say, so it asks them to message.
 * @param {string} csv @param {string} today @param {number} staleAfterDays
 * @returns {{ ok: true, taken: Record<string, "held"|"booked">, updated: string } | { ok: false, reason: "stale"|"unreadable" }}
 */
export function datesFromCsv(csv, today, staleAfterDays) {
  const rows = parseCsv(String(csv));
  if (!rows.length) return { ok: false, reason: "unreadable" };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const at = (/** @type {string} */ k) => head.indexOf(k);
  if (at("date") < 0 || at("status") < 0 || at("updated") < 0) return { ok: false, reason: "unreadable" };
  /** @type {Record<string, "held"|"booked">} */ const taken = {};
  let updated = "";
  for (const r of rows.slice(1)) {
    if (r.every((c) => !String(c ?? "").trim())) continue;
    const uText = (r[at("updated")] ?? "").trim();
    const u = sheetDay(uText);
    if (uText && !u) return { ok: false, reason: "unreadable" };
    if (u > updated) updated = u;
    const d = sheetDay(r[at("date")] ?? ""), s = (r[at("status")] ?? "").trim().toLowerCase();
    // A row we can't read is never taken as free: the whole sheet is refused and the visitor is asked to message.
    if (!d || !STATUSES.includes(s)) return { ok: false, reason: "unreadable" };
    if (s === "held" || s === "booked") taken[d] = s === "booked" || taken[d] === "booked" ? "booked" : "held";
  }
  if (!updated) return { ok: false, reason: "unreadable" };
  const age = daysTo(updated, today);
  if (age < 0) return { ok: false, reason: "unreadable" };
  if (age > staleAfterDays) return { ok: false, reason: "stale" };
  return { ok: true, taken, updated };
}
/** The statuses a dates sheet may use. */
export const STATUSES = ["held", "booked", "free"];

/**
 * A day as a sheet writes it: 2027-06-12, or the UK form 12/06/2027 (Google Sheets' default for a UK sheet), with or
 * without a time after it. "" when it isn't a real day.
 * @param {string} text
 */
export function sheetDay(text) {
  const s = String(text).trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T][\d:.]+Z?)?$/.exec(s);
  if (m) return realDate(`${m[1]}-${m[2]}-${m[3]}`) ? `${m[1]}-${m[2]}-${m[3]}` : "";
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?: [\d:]+)?$/.exec(s);
  if (!m) return "";
  const ymd = `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return realDate(ymd) ? ymd : "";
}

/** @param {Record<string, string>} taken @param {string} ymd @returns {"free"|"held"|"booked"} */
export function statusOf(taken, ymd) { return /** @type {any} */ (taken[ymd]) ?? "free"; }

/**
 * The first free day on one of the agency's usual weekdays, at least `leadDays` ahead (null if none in a year).
 * @param {Record<string, string>} taken @param {string} today @param {string[]} days e.g. ["sat"] @param {number} leadDays
 */
export function nextFree(taken, today, days, leadDays) {
  for (let i = leadDays; i < leadDays + 366; i++) {
    const d = addDays(today, i);
    if (days.includes(weekday(d)) && !taken[d]) return d;
  }
  return null;
}

/** What the date check says for a chosen date. @param {"free"|"held"|"booked"} s @param {string} ymd */
export function dateWords(s, ymd) {
  const d = longDate(ymd);
  if (s === "free") return `${d} is free.`;
  if (s === "held") return `${d} is on hold for another client. Ask us and we'll tell you if it comes free.`;
  return `${d} is taken.`;
}

/**
 * The brief as one plain message. Only what the visitor chose; nothing they left blank.
 * @param {string} business @param {{ type?: string, date?: string, flexible?: boolean, guests?: number, budget?: string, venue?: string, name?: string, note?: string }} b
 */
export function briefMessage(business, b) {
  const lines = [`Hello ${business}, we're planning ${b.type ? aOrAn(b.type.toLowerCase()) : "an event"}.`];
  if (b.date && realDate(b.date)) lines.push(`Date: ${longDate(b.date)}${b.flexible ? " (we could move it)" : ""}`);
  else lines.push("Date: not fixed yet");
  if (Number.isInteger(b.guests) && /** @type {number} */ (b.guests) > 0) lines.push(`Guests: about ${b.guests}`);
  if (b.budget) lines.push(`Budget: ${b.budget}`);
  if (b.venue) lines.push(`Venue: ${b.venue}`);
  if (b.note && b.note.trim()) lines.push(b.note.trim().slice(0, 400));
  if (b.name && b.name.trim()) lines.push(`From ${b.name.trim().slice(0, 80)}`);
  return lines.join("\n");
}
/** @param {string} w */
function aOrAn(w) { return `${/^[aeiou]/.test(w) ? "an" : "a"} ${w}`; }

/**
 * Key dates worked back from the event: each `weeksBefore` the date, only those still ahead of today.
 * @param {string} eventDate @param {{ label: string, weeksBefore: number }[]} items @param {string} today
 */
export function keyDates(eventDate, items, today) {
  return items
    .map((k) => ({ label: k.label, date: addDays(eventDate, -7 * k.weeksBefore) }))
    .filter((k) => k.date >= today)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

/**
 * A calendar file (iCalendar, RFC 5545) of all-day events. Lines folded at 75 octets; text escaped.
 * @param {string} business @param {{ label: string, date: string }[]} dates @param {string} stamp YYYYMMDDTHHMMSSZ @param {string} host
 */
export function icsFile(business, dates, stamp, host) {
  const esc = (/** @type {string} */ s) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  const fold = (/** @type {string} */ line) => {
    const out = []; let s = line;
    while (new TextEncoder().encode(s).length > 75) {
      let n = 75; while (new TextEncoder().encode(s.slice(0, n)).length > 75) n--;
      out.push(s.slice(0, n)); s = ` ${s.slice(n)}`;
    }
    out.push(s); return out.join("\r\n");
  };
  const ymd = (/** @type {string} */ d) => d.replace(/-/g, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//${esc(business)}//Key dates//EN`, "CALSCALE:GREGORIAN"];
  dates.forEach((k, i) => {
    lines.push("BEGIN:VEVENT", `UID:${ymd(k.date)}-${i}@${host}`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${ymd(k.date)}`,
      `DTEND;VALUE=DATE:${ymd(addDays(k.date, 1))}`, `SUMMARY:${esc(k.label)}`, "TRANSP:TRANSPARENT", "END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

/**
 * The room drawn for a number of guests: where tables, a dance floor and a bar would go in a rectangular room.
 * A planning guide only. Spacing: long tables 1.2 m wide with 0.6 m a guest a side and 3 m between table centres;
 * rounds of ten, 1.8 m across, on a 3.2 m grid; standing at 0.8 m² a guest. A clear 1 m round the walls; a dance
 * floor at one end when the room is long enough (8 × 8 m from 24 m, 6 × 6 m from 16 m).
 * @param {{ length: number, width: number }} room metres @param {number} guests @param {"long"|"round"|"standing"} layout
 */
export function drawRoom(room, guests, layout) {
  const L = room.length, W = room.width, edge = 1;
  const df = layout === "standing" ? 0 : L >= 24 && W >= 10 ? 8 : L >= 16 && W >= 8 ? 6 : 0;
  const floor = df ? { x: L - edge - df, y: (W - df) / 2, w: df, h: df } : null;
  const usableL = L - 2 * edge - (df ? df + 1 : 0), usableW = W - 2 * edge;
  /** @type {{ x: number, y: number, w: number, h: number, seats: number, shape: "rect"|"round"|"high" }[]} */ const tables = [];
  let capacity;
  if (layout === "long") {
    const rows = Math.max(0, Math.floor((usableW - 1.2) / 3) + 1), perSide = Math.max(0, Math.floor((usableL - 0.3) / 0.6));
    capacity = rows * perSide * 2;
    let left = Math.min(guests, capacity);
    const gap = rows > 1 ? (usableW - 1.2) / (rows - 1) : 0;
    for (let r = 0; r < rows && left > 0; r++) {
      const seats = Math.min(left, perSide * 2); left -= seats;
      const len = Math.ceil(seats / 2) * 0.6 + 0.3;
      tables.push({ x: edge + (usableL - len) / 2, y: edge + (rows > 1 ? r * gap : (usableW - 1.2) / 2), w: len, h: 1.2, seats, shape: "rect" });
    }
  } else if (layout === "round") {
    const cols = Math.max(0, Math.floor(usableL / 3.2)), rows = Math.max(0, Math.floor(usableW / 3.2));
    capacity = cols * rows * 10;
    let left = Math.min(guests, capacity);
    const ox = edge + (usableL - cols * 3.2) / 2, oy = edge + (usableW - rows * 3.2) / 2;
    for (let r = 0; r < rows && left > 0; r++) for (let c = 0; c < cols && left > 0; c++) {
      const seats = Math.min(10, left); left -= seats;
      tables.push({ x: ox + c * 3.2 + 0.7, y: oy + r * 3.2 + 0.7, w: 1.8, h: 1.8, seats, shape: "round" });
    }
  } else {
    capacity = Math.floor((usableL * usableW) / 0.8);
    const n = Math.ceil(Math.min(guests, capacity) / 12);
    const cols = Math.max(1, Math.ceil(Math.sqrt((n * usableL) / usableW))), rows = Math.ceil(n / cols);
    for (let k = 0; k < n; k++) {
      const c = k % cols, r = Math.floor(k / cols);
      tables.push({ x: edge + ((c + 0.5) * usableL) / cols - 0.35, y: edge + ((r + 0.5) * usableW) / rows - 0.35, w: 0.7, h: 0.7, seats: 0, shape: "high" });
    }
  }
  const fits = guests <= capacity;
  const bar = layout === "standing" ? { x: L - edge - 6, y: edge - 0.5, w: 6, h: 0.8 } : { x: edge, y: W - edge + 0.1, w: Math.min(6, L / 3), h: 0.7 };
  return { length: L, width: W, guests, layout, fits, capacity, tables, floor, bar };
}

/** What the drawn room says beneath it. @param {ReturnType<typeof drawRoom>} p @param {string} roomName */
export function roomWords(p, roomName) {
  if (!p.fits) return p.capacity > 0
    ? `${roomName} takes about ${p.capacity} ${p.layout === "standing" ? "standing" : "seated"} this way. Try another layout, or ask us about a larger room.`
    : `${roomName} is too small for this layout.`;
  if (p.layout === "standing") return `${p.guests} standing, ${p.tables.length} high tables and a long bar.`;
  const n = p.tables.length, kind = p.layout === "long" ? "long table" : "round table";
  return `${p.guests} seated at ${n} ${kind}${n === 1 ? "" : "s"}${p.floor ? `, with a dance floor ${p.floor.w} × ${p.floor.h} m` : ""}.`;
}

/** A proposal code: 6–12 letters and numbers, read without spaces or dashes, in capitals. @param {any} raw */
export function cleanCode(raw) {
  const c = String(raw ?? "").replace(/[\s-]/g, "").toUpperCase();
  return /^[A-Z0-9]{6,12}$/.test(c) ? c : "";
}

/** The only columns a proposal sheet may fill. */
export const PROPOSAL_COLUMNS = ["code", "visuals", "date", "updated", "room", "layout", "guests"];

/**
 * The agency's proposals sheet, published as CSV: `code, visuals, room, guests, layout, date, updated`. Nothing
 * personal by design: a code is not a password. Fails closed on an unknown code, a visual set or room the site doesn't
 * have, a bad date, or a row not updated for `staleAfterDays`.
 * @param {string} csv @param {string} code @param {string[]} sets @param {string[]} rooms @param {string} today @param {number} staleAfterDays
 */
export function proposalFromCsv(csv, code, sets, rooms, today, staleAfterDays) {
  const rows = parseCsv(String(csv));
  if (!rows.length) return { ok: false, reason: "unreadable" };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const at = (/** @type {string} */ k) => head.indexOf(k);
  if (["code", "visuals", "date", "updated"].some((k) => at(k) < 0)) return { ok: false, reason: "unreadable" };
  // The published sheet can be read by anyone holding its link, so it may hold nothing beyond these columns (no names,
  // no notes): any filled cell in another column refuses the whole sheet.
  const extra = head.map((h, i) => (PROPOSAL_COLUMNS.includes(h) ? -1 : i)).filter((i) => i >= 0);
  if (rows.slice(1).some((r) => r.slice(head.length).some((c) => String(c ?? "").trim()) || extra.some((i) => String(r[i] ?? "").trim()))) return { ok: false, reason: "unreadable" };
  const matches = rows.slice(1).filter((r) => cleanCode(r[at("code")]) === code);
  if (matches.length > 1) return { ok: false, reason: "unreadable" }; // one code, one proposal: never guess which row
  const row = matches[0];
  if (!row) return { ok: false, reason: "unknown" };
  const cell = (/** @type {string} */ k) => (at(k) >= 0 ? (row[at(k)] ?? "").trim() : "");
  const visuals = cell("visuals"), date = sheetDay(cell("date")), updated = sheetDay(cell("updated")), room = cell("room"), layout = cell("layout") || "long";
  if (!sets.includes(visuals) || !realDate(date) || !realDate(updated)) return { ok: false, reason: "unreadable" };
  if (room && !rooms.includes(room)) return { ok: false, reason: "unreadable" };
  if (!(layout in LAYOUTS)) return { ok: false, reason: "unreadable" };
  const age = daysTo(updated, today);
  if (age < 0) return { ok: false, reason: "unreadable" };
  if (age > staleAfterDays) return { ok: false, reason: "stale" };
  const gText = cell("guests"), g = Number(gText);
  if (gText && !(Number.isInteger(g) && g > 0 && g <= 2000)) return { ok: false, reason: "unreadable" };
  return { ok: true, visuals, room: room || null, layout, date, updated, guests: gText ? g : 0 };
}

/** Rooms from the portfolio that suit a number of guests: from two thirds to half as many again, closest first. @param {any[]} rooms @param {number} guests @param {string} [occasion] */
export function roomsFor(rooms, guests, occasion) {
  return rooms
    .filter((r) => (!occasion || r.occasion === occasion) && (!guests || (r.guests >= guests * 0.67 && r.guests <= guests * 1.5)))
    .sort((a, b) => Math.abs(a.guests - guests) - Math.abs(b.guests - guests));
}

/**
 * The drawn room as SVG markup (inside an <svg> whose viewBox is `planBox(p)`), the same on first paint and in the
 * browser: walls, a scale bar, tables and chairs, the dance floor dashed, the bar solid. Units are metres.
 * @param {ReturnType<typeof drawRoom>} p
 */
export function roomSvg(p) {
  const f = (/** @type {number} */ n) => Math.round(n * 100) / 100;
  const out = [`<rect class="ev-pl-wall" x="0" y="0" width="${f(p.length)}" height="${f(p.width)}"/>`];
  if (p.floor) out.push(`<rect class="ev-pl-floor" x="${f(p.floor.x)}" y="${f(p.floor.y)}" width="${p.floor.w}" height="${p.floor.h}"/><text class="ev-pl-lab" x="${f(p.floor.x + p.floor.w / 2)}" y="${f(p.floor.y + p.floor.h / 2)}">Dance floor</text>`);
  out.push(`<rect class="ev-pl-bar" x="${f(p.bar.x)}" y="${f(p.bar.y)}" width="${f(p.bar.w)}" height="${p.bar.h}"/><text class="ev-pl-lab" x="${f(p.bar.x + p.bar.w / 2)}" y="${f(p.bar.y + p.bar.h + 0.75)}">Bar</text>`);
  for (const t of p.tables) {
    if (t.shape === "round") {
      const cx = t.x + 0.9, cy = t.y + 0.9;
      out.push(`<circle class="ev-pl-t" cx="${f(cx)}" cy="${f(cy)}" r="0.9"/>`);
      for (let i = 0; i < t.seats; i++) { const a = (i / 10) * Math.PI * 2; out.push(`<circle class="ev-pl-s" cx="${f(cx + Math.cos(a) * 1.25)}" cy="${f(cy + Math.sin(a) * 1.25)}" r="0.2"/>`); }
    } else if (t.shape === "high") {
      out.push(`<circle class="ev-pl-t" cx="${f(t.x + 0.35)}" cy="${f(t.y + 0.35)}" r="0.35"/>`);
    } else {
      out.push(`<rect class="ev-pl-t" x="${f(t.x)}" y="${f(t.y)}" width="${f(t.w)}" height="${t.h}"/>`);
      const side = Math.ceil(t.seats / 2);
      for (let i = 0; i < side; i++) {
        const x = t.x + 0.45 + i * 0.6;
        out.push(`<circle class="ev-pl-s" cx="${f(x)}" cy="${f(t.y - 0.35)}" r="0.2"/>`);
        if (i < t.seats - side) out.push(`<circle class="ev-pl-s" cx="${f(x)}" cy="${f(t.y + t.h + 0.35)}" r="0.2"/>`);
      }
    }
  }
  const step = p.length > 40 ? 10 : 5;
  for (let m = 0; m <= p.length + 0.01; m += step) out.push(`<line class="ev-pl-tick" x1="${m}" y1="${f(p.width + 0.6)}" x2="${m}" y2="${f(p.width + 0.9)}"/><text class="ev-pl-m" x="${m}" y="${f(p.width + 1.7)}">${m === 0 ? "0" : `${m} m`}</text>`);
  out.push(`<line class="ev-pl-tick" x1="0" y1="${f(p.width + 0.75)}" x2="${f(Math.floor(p.length / step) * step)}" y2="${f(p.width + 0.75)}"/>`);
  return out.join("");
}
/** The viewBox for a drawn room, with room for the bar's label and the scale beneath. @param {{ length: number, width: number }} p */
export function planBox(p) { return `-0.6 -1.2 ${Math.round((p.length + 1.2) * 100) / 100} ${Math.round((p.width + 3.4) * 100) / 100}`; }
