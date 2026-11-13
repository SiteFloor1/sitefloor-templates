// @ts-check
/**
 * Members' tools, kept out of any database: the reformer settings card (the settings live in the link the teacher
 * sends; nothing is stored), the class passport (one row per member code in the studio's published sheet, with no
 * names), the pack calculator, and dates such as a retreat's balance or a workshop in the calendar. Every price,
 * allowance, milestone and setting comes from the studio's own site.json or sheet.
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";
import { extraFilled } from "./places.js";

/* ------------------------------------------------------------------ reformer settings, in the link */

/**
 * The studio's machine, from site.json: its spring names (heaviest first), and how many footbar, headrest, strap and
 * gear positions it has.
 * @typedef {{ springs: { id: string, name: string }[], maxPerSpring: number, footbar: number, headrest: string[], straps: string[], gear: number }} Machine
 */
/** @typedef {{ name: string, springs: Record<string, number>, footbar: number, headrest: string, straps: string, gear: number, note: string }} Settings */

const SAFE = /[^\p{L}\p{N} .,'’()&\-/+:;!?]/gu;
/** Free text cut to length, with anything that isn't plain words removed. @param {unknown} s @param {number} max */
export const cleanText = (s, max) => String(s ?? "").replace(SAFE, "").replace(/\s+/g, " ").trim().slice(0, max);

/**
 * Settings as a link's hash: short keys, only what the machine allows.
 * @param {Settings} s @param {Machine} m @returns {string} without the leading "#"
 */
export function settingsToHash(s, m) {
  const p = new URLSearchParams();
  if (s.name) p.set("n", cleanText(s.name, 30));
  for (const sp of m.springs) if (s.springs[sp.id]) p.set(`s-${sp.id}`, String(s.springs[sp.id]));
  p.set("f", String(s.footbar));
  p.set("h", s.headrest);
  p.set("t", s.straps);
  p.set("g", String(s.gear));
  if (s.note) p.set("x", cleanText(s.note, 140));
  return p.toString();
}

/**
 * Reads a settings link. Anything out of range or unknown is dropped; a link with no valid setting returns null, so
 * the page never shows a made-up card.
 * @param {string} hash with or without "#" @param {Machine} m @returns {Settings|null}
 */
export function settingsFromHash(hash, m) {
  const p = new URLSearchParams(String(hash ?? "").replace(/^#/, ""));
  const int = (/** @type {string} */ k, /** @type {number} */ lo, /** @type {number} */ hi) => {
    const v = p.get(k);
    if (v === null || !/^\d{1,2}$/.test(v)) return null;
    const n = Number(v);
    return n >= lo && n <= hi ? n : null;
  };
  /** @type {Record<string, number>} */
  const springs = {};
  for (const sp of m.springs) { const n = int(`s-${sp.id}`, 1, m.maxPerSpring); if (n) springs[sp.id] = n; }
  const footbar = int("f", 1, m.footbar), gear = int("g", 1, m.gear);
  const headrest = m.headrest.includes(p.get("h") ?? "") ? /** @type {string} */ (p.get("h")) : "";
  const straps = m.straps.includes(p.get("t") ?? "") ? /** @type {string} */ (p.get("t")) : "";
  if (!Object.keys(springs).length && footbar === null && gear === null && !headrest && !straps) return null;
  return { name: cleanText(p.get("n"), 30), springs, footbar: footbar ?? 0, headrest, straps, gear: gear ?? 0, note: cleanText(p.get("x"), 140) };
}

/* ------------------------------------------------------------------ the class passport, by code */

/** A code as a member might type it: spaces and dashes dropped, capitals; 8–12 letters and digits, or "". @param {unknown} s */
export function cleanCode(s) {
  const c = String(s ?? "").replace(/[\s-]/g, "").toUpperCase();
  return /^[A-Z0-9]{8,12}$/.test(c) ? c : "";
}

/**
 * @typedef {{ ok: true, card: string, left: number|null, expires: string, total: number, month: number, updatedAt: number }
 *   | { ok: false, reason: "unreadable"|"unknown"|"stale" }} Passport
 */

/**
 * One member's passport from the studio's sheet:
 *
 *   code,card,left,expires,total,month,updated_at
 *   K7M2QX4P,Ten classes,4,2027-01-31,38,6,2026-11-02 09:10
 *
 * `left` is blank for a membership with no count. Fails closed: an unreadable sheet, an unknown code, or a row older
 * than `staleAfterHours` returns { ok: false } with the reason, and the page says to ask at the desk. So does a code
 * that appears twice, anything written in a column the passport doesn't expect, an expiry that isn't a real date,
 * and more classes this month than in all.
 * @param {string} csv @param {string} code @param {number} nowMs @param {string} tz @param {number} staleAfterHours
 * @returns {Passport}
 */
export function passportFromCsv(csv, code, nowMs, tz, staleAfterHours) {
  const rows = parseCsv(csv);
  if (!rows.length) return { ok: false, reason: "unreadable" };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const col = (/** @type {string} */ n) => head.indexOf(n);
  const i = { code: col("code"), card: col("card"), left: col("left"), expires: col("expires"), total: col("total"), month: col("month"), at: col("updated_at") };
  if (Object.values(i).some((x) => x < 0) || extraFilled(rows, Object.values(i))) return { ok: false, reason: "unreadable" };
  const want = cleanCode(code);
  const found = want ? rows.slice(1).filter((r) => cleanCode(r[i.code]) === want) : [];
  if (found.length > 1) return { ok: false, reason: "unreadable" }; // two members, one code: never guess
  const row = found[0];
  if (!row) return { ok: false, reason: "unknown" };
  const at = parseSheetTime(row[i.at] ?? "", tz);
  if (Number.isNaN(at) || at > nowMs + 60_000) return { ok: false, reason: "unreadable" };
  if (nowMs - at > staleAfterHours * 3_600_000) return { ok: false, reason: "stale" };
  return readPassport(row, i, at);
}

/**
 * The row's numbers and dates, or unreadable when any can't be trusted.
 * @param {string[]} row @param {Record<"card"|"left"|"expires"|"total"|"month", number>} i @param {number} at @returns {Passport}
 */
function readPassport(row, i, at) {
  const num = (/** @type {string} */ v) => (/^\d{1,4}$/.test((v ?? "").trim()) ? Number(v.trim()) : null);
  const total = num(row[i.total]), month = num(row[i.month]), left = num(row[i.left]);
  const expires = (row[i.expires] ?? "").trim();
  const leftBad = (row[i.left] ?? "").trim() !== "" && left === null;
  if (total === null || month === null || month > total || leftBad || (expires !== "" && !realDate(expires))) return { ok: false, reason: "unreadable" };
  return { ok: true, card: String(row[i.card] ?? "").trim().slice(0, 40), left, expires, total, month, updatedAt: at };
}

/** A real calendar date as YYYY-MM-DD (not 2027-02-30). @param {string} s */
function realDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** The next of the studio's milestones after `total`, and how many classes to go; null past the last. @param {number} total @param {number[]} milestones */
export function nextMilestone(total, milestones) {
  const next = [...milestones].sort((a, b) => a - b).find((m) => m > total);
  return next === undefined ? null : { at: next, toGo: next - total };
}

/** "1st", "2nd", "23rd", "50th", "111th". @param {number} n */
export function ordinal(n) {
  const t = n % 100;
  const suf = t >= 11 && t <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" })[/** @type {1|2|3} */ (n % 10)] ?? "th";
  return `${n}${suf}`;
}

/* ------------------------------------------------------------------ packs and memberships */

/**
 * @typedef {{ id: string, name: string, classes: number, price: number, months: number }} Pack
 * @typedef {{ id: string, name: string, monthly: number, classes: number|"unlimited", minMonths?: number }} Membership
 * @typedef {{ id: string, name: string, kind: "single"|"pack"|"membership", perMonth: number, perClass: number, note: string }} Option
 */

/**
 * What each way of paying costs a month for someone coming `perWeek` times a week, cheapest first. A pack that
 * would expire before it's used up is counted as bought each time it expires (the unused classes are lost); classes
 * beyond a membership's allowance are paid at the single price. Whole pence.
 * @param {number} perWeek @param {{ single: number, packs: Pack[], memberships: Membership[] }} prices @returns {Option[]}
 */
export function packOptions(perWeek, prices) {
  const perMonth = (perWeek * 52) / 12;
  const pence = (/** @type {number} */ n) => Math.round(n * 100) / 100;
  /** @type {Option[]} */
  const out = [{ id: "single", name: "Pay as you go", kind: "single", perMonth: pence(perMonth * prices.single), perClass: prices.single, note: "" }];
  for (const p of prices.packs) {
    const usedUp = p.classes / perMonth; // months to use the pack
    const buys = usedUp > p.months ? 1 / p.months : perMonth / p.classes; // packs a month
    const lost = usedUp > p.months ? Math.round(p.classes - perMonth * p.months) : 0;
    const cost = pence(buys * p.price);
    out.push({ id: p.id, name: p.name, kind: "pack", perMonth: cost, perClass: pence(cost / perMonth), note: lost > 0 ? `${lost} ${lost === 1 ? "class runs" : "classes run"} out before you use them` : "" });
  }
  for (const m of prices.memberships) {
    const extra = m.classes === "unlimited" ? 0 : Math.max(0, perMonth - m.classes);
    const cost = pence(m.monthly + extra * prices.single);
    out.push({ id: m.id, name: m.name, kind: "membership", perMonth: cost, perClass: pence(cost / perMonth), note: extra > 0 ? `includes ${Math.round(extra)} more at the single price` : m.minMonths ? `${m.minMonths}-month minimum` : "" });
  }
  return out.sort((a, b) => a.perMonth - b.perMonth);
}

/* ------------------------------------------------------------------ dates */

const DAY = 86_400_000;
/** Whole days from `today` to `date` (both YYYY-MM-DD). @param {string} today @param {string} date */
export const daysUntil = (today, date) => Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / DAY);

/** @param {string} s */
const icsText = (s) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/**
 * One workshop as a calendar file, at the studio's time.
 * @param {{ id: string, title: string, date: string, from: string, to: string, studio: string, place: string, tz: string, stamp: string }} w
 */
export function workshopIcs(w) {
  const t = (/** @type {string} */ hhmm) => `${w.date.replace(/-/g, "")}T${hhmm.replace(":", "")}00`;
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Sitefloor//${icsText(w.studio)} workshops//EN`, "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${w.id}-${w.date}@${w.studio.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    `DTSTAMP:${w.stamp}`,
    `DTSTART;TZID=${w.tz}:${t(w.from)}`,
    `DTEND;TZID=${w.tz}:${t(w.to)}`,
    `SUMMARY:${icsText(`${w.title} · ${w.studio}`)}`,
    `LOCATION:${icsText(w.place)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n") + "\r\n";
}
