// @ts-check
/**
 * The tailor kit's logic, no DOM: the cloth book's seasons, the appointment and swatch messages, trunk-show dates and
 * calendar files, and "your commission, by code" read from the house's published Google Sheet.
 *
 *   code,stage,next_fitting,cloth,updated_at
 *   FL4K7M2Q,forward,2026-11-12 11:00,midnight,2026-11-03 16:20
 *
 * A published sheet can be opened by anyone with its link, so it holds only a random code, a stage id, the next fitting
 * time, a cloth id from the site's own cloth book and when it was updated: never a name, a measurement or a note. A
 * sheet with anything in any other column, headed or not, is refused. Fails closed: an unreadable sheet, an unknown
 * code or stage, or an update older than `staleAfterDays` says to call.
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";
import { addDaysYmd, ukDate } from "../../../core/lib/diary.js";
import { zonedNow, wallTimeToUtc } from "../../../core/lib/hours.js";

/** The seasons a cloth can be for, in the order the filter lists them. */
export const SEASONS = { "all-year": "All year", spring: "Spring", summer: "Summer", autumn: "Autumn", winter: "Winter" };

/** "Spring and summer", "All year" @param {string[]} seasons */
export function seasonWords(seasons) {
  const w = seasons.map((s) => /** @type {Record<string, string>} */ (SEASONS)[s]).filter(Boolean);
  if (!w.length) return "";
  const rest = w.slice(1).map((x) => x.toLowerCase());
  return w.length === 1 ? w[0] : `${[w[0], ...rest.slice(0, -1)].join(", ")} and ${rest[rest.length - 1]}`;
}

/** Cloths for one season; "all-year" cloths suit every season. @param {{ seasons: string[] }[]} items @param {string} season */
export function clothsFor(items, season) {
  if (!season) return items;
  return items.filter((c) => c.seasons.includes(season) || c.seasons.includes("all-year"));
}

/** £1,850 @param {number} n */
export const pounds = (n) => `£${n.toLocaleString("en-GB")}`;

/** "From £3,600", or "" when the house prices it at the appointment. @param {number|null|undefined} n */
export const fromPrice = (n) => (n ? `From ${pounds(n)}` : "");

/**
 * The first-appointment message: the house's opening line, then what the visitor chose. Never says "booked".
 * @param {string} opening @param {{ garments: string[], when: string, wedding?: string }} o
 */
export function appointmentText(opening, o) {
  return [
    opening,
    o.garments.length ? `I'm thinking of: ${o.garments.join(", ")}.` : "",
    o.when ? `Best for me: ${o.when}.` : "",
    o.wedding ? `It's for a wedding on ${ukDate(o.wedding)}.` : "",
  ].filter(Boolean).join("\n");
}

/** Asking for a swatch of one cloth. @param {string} opening @param {{ name: string, cloth: string }} c */
export const swatchText = (opening, c) => `${opening}\nCould you send me a swatch of ${c.name} (${c.cloth.toLowerCase()})?`;

/** Asking for a slot at a trunk show. @param {string} opening @param {{ city: string, venue: string, from: string, to: string }} t */
export const travelText = (opening, t) => `${opening}\nI'd like an appointment when you're in ${t.city} (${t.venue}, ${showDates(t)}).`;

/** "12–14 November 2026", "30 November – 2 December 2026" @param {{ from: string, to: string }} t */
export function showDates(t) {
  if (t.from === t.to) return ukDate(t.from);
  const a = ukDate(t.from, false).split(" "), b = ukDate(t.to, false).split(" ");
  if (a[2] !== b[2]) return `${ukDate(t.from, false)} – ${ukDate(t.to, false)}`;
  return a[1] === b[1] ? `${a[0]}–${b[0]} ${b[1]} ${b[2]}` : `${a[0]} ${a[1]} – ${b[0]} ${b[1]} ${b[2]}`;
}

/** Trunk shows that haven't finished on `today`, soonest first. @template {{ from: string, to: string }} T @param {T[]} items @param {string} today */
export const upcoming = (items, today) => items.filter((t) => t.to >= today).sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : 0));

/** @param {string} s */
const icsText = (s) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
/** @param {string} house */
const uidOf = (house) => house.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/**
 * A trunk show as an all-day calendar event across its days (no time, so no time zone can move it).
 * @param {{ id: string, city: string, venue: string, from: string, to: string }} t @param {string} house @param {string} stamp UTC "YYYYMMDDTHHMMSSZ"
 */
export function travelIcs(t, house, stamp) {
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Sitefloor//${icsText(house)} trunk shows//EN`, "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:${t.id}-${t.from}@${uidOf(house)}`, `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${t.from.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${addDaysYmd(t.to, 1).replace(/-/g, "")}`,
    `SUMMARY:${icsText(`${house} in ${t.city}`)}`, `LOCATION:${icsText(t.venue)}`, "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n") + "\r\n";
}

const utc = (/** @type {number} */ ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** "the shoes, a shirt and your order card". @param {string[]} items */
const listWords = (items) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`);

/** "Bring the shoes you'll wear with it and your order card." @param {string[]} items */
export function bringLine(items) {
  return items.length ? `Bring ${listWords(items)}.` : "";
}

/** "6pm", "6:30pm" for "18:00", "18:30". @param {string} at HH:MM */
export function clockWords(at) {
  const [h, m] = at.split(":").map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`;
}

/** When the evening-before reminder sounds: `at` on the day before the fitting, in the house's time zone. @param {number} startMs @param {string} at HH:MM @param {string} timeZone */
export function eveningBefore(startMs, at, timeZone) {
  const [y, mo, d] = addDaysYmd(zonedNow(new Date(startMs), timeZone).date, -1).split("-").map(Number);
  const [hour, minute] = at.split(":").map(Number);
  return wallTimeToUtc({ year: y, month: mo, day: d, hour, minute }, timeZone);
}

/**
 * A calendar alarm (VALARM): the calendar itself shows it, nothing is sent from the site.
 * @param {string} trigger a full TRIGGER line @param {string} what e.g. "Baste fitting at Fennick & Lowe tomorrow." @param {string[]} items
 */
export function alarmLines(trigger, what, items) {
  return ["BEGIN:VALARM", "ACTION:DISPLAY", trigger, `DESCRIPTION:${icsText([what, bringLine(items)].filter(Boolean).join(" "))}`, "END:VALARM"];
}

/** For an all-day event (it starts at midnight): the trigger that sounds at `at` the evening before. @param {string} at HH:MM */
export function allDayTrigger(at) {
  const [h, m] = at.split(":").map(Number);
  const before = 24 * 60 - (h * 60 + m);
  return `TRIGGER:-PT${Math.floor(before / 60)}H${before % 60 ? `${before % 60}M` : ""}`;
}

/**
 * Adds the evening-before alarm to the all-day events whose ids are listed (the wedding party's fittings).
 * @param {string} ics @param {string[]} stepIds @param {{ at: string, items: string[] }} reminder @param {string} house
 */
export function withReminders(ics, stepIds, reminder, house) {
  const lines = ics.split("\r\n");
  const out = [];
  let id = "", title = "";
  for (const line of lines) {
    if (line.startsWith("UID:")) id = line.slice(4);
    if (line.startsWith("SUMMARY:")) title = line.slice(8).split(" · ")[0];
    if (line === "END:VEVENT" && stepIds.some((s) => id.startsWith(`${s}-`))) out.push(...alarmLines(allDayTrigger(reminder.at), `${title.replace(/\\([\\;,])/g, "$1")} at ${house} tomorrow.`, reminder.items));
    out.push(line);
  }
  return out.join("\r\n");
}

/**
 * The next fitting as a timed calendar event, written in UTC so every calendar shows it at the right hour; with the
 * house's reminder, an alarm the evening before with what to bring.
 * @param {{ code: string, startMs: number, minutes: number, title: string, place: string, house: string, reminder?: { atMs: number, items: string[] } | null }} o @param {string} stamp
 */
export function fittingIcs(o, stamp) {
  const r = o.reminder;
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Sitefloor//${icsText(o.house)} fittings//EN`, "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:${o.code}-${utc(o.startMs)}@${uidOf(o.house)}`, `DTSTAMP:${stamp}`,
    `DTSTART:${utc(o.startMs)}`, `DTEND:${utc(o.startMs + o.minutes * 60_000)}`,
    `SUMMARY:${icsText(`${o.title} · ${o.house}`)}`, `LOCATION:${icsText(o.place)}`,
    ...(r && r.items.length ? [`DESCRIPTION:${icsText(bringLine(r.items))}`] : []),
    ...(r ? alarmLines(`TRIGGER;VALUE=DATE-TIME:${utc(r.atMs)}`, `${o.title} at ${o.house} tomorrow.`, r.items) : []),
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n") + "\r\n";
}

/** @param {string} s @returns {string} the code as typed, cleaned, or "" */
export function cleanCode(s) {
  const c = String(s ?? "").replace(/[\s-]/g, "").toUpperCase();
  return /^[A-Z0-9]{8,12}$/.test(c) ? c : "";
}

/**
 * @typedef {{ ok: true, stage: number, next: number|null, cloth: string, updatedAt: number }} Commission
 * @typedef {{ ok: false, reason: "unreadable" | "unknown" | "stale" }} NoCommission
 */

const COLUMNS = ["code", "stage", "next_fitting", "cloth", "updated_at"];

/**
 * @param {string} csv @param {string} code @param {string[]} stages stage ids in order @param {string[]} cloths the cloth book's ids
 * @param {number} nowMs @param {number} staleAfterDays @param {string} timeZone
 * @returns {Commission | NoCommission}
 */
export function commissionFromCsv(csv, code, stages, cloths, nowMs, staleAfterDays, timeZone) {
  const rows = parseCsv(csv);
  const head = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
  const at = (/** @type {string} */ k) => head.indexOf(k);
  if (at("code") < 0 || at("stage") < 0 || at("updated_at") < 0) return { ok: false, reason: "unreadable" };
  const allowed = new Set(COLUMNS.map(at).filter((i) => i >= 0));
  if (rows.slice(1).some((r) => r.some((cell, i) => !allowed.has(i) && String(cell ?? "").trim() !== ""))) return { ok: false, reason: "unreadable" };
  const mine = rows.slice(1).filter((r) => code && cleanCode(r[at("code")] ?? "") === code);
  if (mine.length !== 1) return { ok: false, reason: "unknown" };
  const r = mine[0];
  const cell = (/** @type {string} */ k) => (at(k) < 0 ? "" : (r[at(k)] ?? "").trim());
  const stage = stages.indexOf(cell("stage").toLowerCase());
  const updatedAt = parseSheetTime(cell("updated_at"), timeZone);
  const nextText = cell("next_fitting");
  const next = nextText ? parseSheetTime(nextText, timeZone) : null;
  const cloth = cell("cloth").toLowerCase();
  if (stage < 0 || !Number.isFinite(updatedAt) || updatedAt > nowMs + 5 * 60_000) return { ok: false, reason: "unreadable" };
  if (next !== null && !Number.isFinite(next)) return { ok: false, reason: "unreadable" };
  if (cloth && !cloths.includes(cloth)) return { ok: false, reason: "unreadable" };
  if (nowMs - updatedAt > staleAfterDays * 86_400_000) return { ok: false, reason: "stale" };
  return { ok: true, stage, next: next !== null && next > nowMs ? next : null, cloth, updatedAt };
}

/** "Thursday 12 November 2026, 11:00" in the house's time zone. @param {number} ms @param {string} timeZone */
export function fittingWhen(ms, timeZone) {
  const d = new Date(ms);
  const part = (/** @type {Intl.DateTimeFormatOptions} */ o) => d.toLocaleString("en-GB", { ...o, timeZone });
  return `${part({ weekday: "long" })} ${part({ day: "numeric", month: "long", year: "numeric" })}, ${part({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" })}`;
}

/**
 * Ordering again from the pattern the house keeps: the code, the garment, the cloth and any change, never a measurement.
 * @param {string} opening @param {{ code: string, garment: string, cloth: string|null, changes: string }} o cloth: null when the house has no cloth book, "" to choose at the house
 */
export function reorderText(opening, o) {
  const change = o.changes.trim().replace(/\s+/g, " ");
  return [
    opening,
    `I'd like to order again from my pattern${o.garment ? `: ${aGarment(o.garment)}` : ""}.`,
    `Order code: ${o.code}`,
    ...(o.cloth === null ? [] : [`Cloth: ${o.cloth || "I'd like help choosing at the house"}`]),
    ...(change ? [`Change: ${change}`] : []),
  ].join("\n");
}

/** The most cloths one swatch request may hold. */
export const SWATCH_SET_MAX = 5;

/** Asking for a set of swatches in one message. @param {string} opening @param {{ name: string, cloth: string }[]} set */
export function swatchSetText(opening, set) {
  const list = set.slice(0, SWATCH_SET_MAX);
  if (list.length === 1) return swatchText(opening, list[0]);
  return [opening, "Could you send me swatches of these cloths?", ...list.map((c) => `· ${c.name} (${c.cloth.toLowerCase()})`)].join("\n");
}

/** "a suit", "an overcoat", "a pair of trousers": the article for a garment's name. @param {string} garment */
export function aGarment(garment) {
  const g = garment.toLowerCase();
  if (/^(trousers|shorts|jeans|braces)$/.test(g)) return `a pair of ${g}`;
  return `${/^[aeiou]/.test(g) ? "an" : "a"} ${g}`;
}

/**
 * The specification card as a message: one line per choice, then the cloth.
 * @param {string} opening @param {{ group: string, label: string }[]} choices @param {{ name: string, cloth: string }|null} cloth @param {string} garment
 */
export function specText(opening, choices, cloth, garment) {
  return [
    opening,
    `My specification${garment ? ` for ${aGarment(garment)}` : ""}:`,
    ...choices.map((c) => `${c.group}: ${c.label}`),
    cloth ? `Cloth: ${cloth.name} (${cloth.cloth.toLowerCase()})` : "",
  ].filter(Boolean).join("\n");
}

/**
 * Extra weeks the house adds to the last day to start for a party of this size (its own rule: the largest `from` that
 * the party reaches). @param {number} size @param {{ from: number, extraWeeks: number }[]} rules
 */
export function partyExtraWeeks(size, rules) {
  return [...rules].sort((a, b) => b.from - a.from).find((r) => size >= r.from)?.extraWeeks ?? 0;
}

/**
 * The wedding steps for a party: the start step moved earlier by the party's extra weeks; the others as the house sets
 * them. @template {{ id: string, weeksBefore: number }} T @param {T[]} steps @param {string} startId @param {number} extra @returns {T[]}
 */
export const partySteps = (steps, startId, extra) => steps.map((s) => (s.id === startId ? { ...s, weeksBefore: s.weeksBefore + extra } : s));

/** The wedding party as a message. @param {string} opening @param {{ wedding: string, size: number, cloth: string, lines: string[] }} o */
export function partyText(opening, o) {
  const head = [
    opening,
    `Our wedding is on ${ukDate(o.wedding)}: ${o.size === 1 ? "a suit for me" : `suits for ${o.size} of us`}.`,
    ...(o.cloth ? [`The cloth for everyone: ${o.cloth}.`] : []),
  ];
  return [...head, ...(o.lines.length ? ["", ...o.lines] : [])].join("\n");
}
