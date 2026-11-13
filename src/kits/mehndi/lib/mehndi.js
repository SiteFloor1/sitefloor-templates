// @ts-check
/**
 * The mehndi artist's logic, with no DOM: the date check (the artist's own Google Sheet, read as CSV), when to have the
 * mehndi so it's darkest on the day, the guest mehndi sum, the wedding week planner and every WhatsApp message. Days
 * are YYYY-MM-DD handled in UTC so a clock change never moves a date; calendar files use all-day events.
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";
import { addDaysYmd, isYmd, ukDate, ymdOf } from "../../../core/lib/diary.js";

export { addDaysYmd, isYmd, ukDate, ymdOf };

/**
 * The NHS on "black henna", quoted in our own short words and linked, with the day we last checked the page. Every
 * client site shows the same line; it changes only when the page is checked again.
 */
export const NHS_PPD = {
  text: "We never use “black henna”. The NHS says it contains high levels of PPD, which can make a reaction to hair dye more likely later.",
  source: "NHS, Hair dye reactions",
  url: "https://www.nhs.uk/conditions/hair-dye-reactions/",
  checked: "2026-11-06",
};

/** @typedef {"open"|"few"|"taken"} DayStatus */
/** @typedef {{ ok: true, days: Record<string, "few"|"taken">, updatedAt: number } | { ok: false }} DatesResult */

const STATUS = /** @type {Record<string, "open"|"few"|"taken">} */ ({ open: "open", free: "open", few: "few", "a few": "few", "few left": "few", taken: "taken", full: "taken" });

/**
 * The artist's diary from a published Google Sheet (CSV). A row per date that isn't simply open:
 *
 *   date,status,updated_at
 *   2027-06-12,taken,2026-11-02 09:12
 *   2027-06-19,few,
 *
 * `status` is open, few or taken; any date not listed is open. The newest `updated_at` on the sheet says when it was
 * last looked after. Fails closed: an unreadable sheet, a missing column, an unknown word, a bad date or an update
 * older than `staleAfterDays` returns { ok: false }, and the page asks the bride to message instead.
 * @param {string} csv @param {number} nowMs @param {number} staleAfterDays @param {string} timeZone @returns {DatesResult}
 */
export function datesFromCsv(csv, nowMs, staleAfterDays, timeZone) {
  const rows = parseCsv(csv);
  const head = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
  const di = head.indexOf("date"), si = head.indexOf("status"), ui = head.indexOf("updated_at");
  if (di < 0 || si < 0 || ui < 0) return { ok: false };
  /** @type {Record<string, "few"|"taken">} */
  const days = {};
  let updatedAt = NaN;
  for (const row of rows.slice(1)) {
    const at = (row[ui] ?? "").trim();
    if (at) {
      const t = parseSheetTime(at, timeZone);
      if (!Number.isFinite(t)) return { ok: false };
      if (!(t <= updatedAt)) updatedAt = t;
    }
    const date = (row[di] ?? "").trim();
    if (!date) continue;
    if (!isYmd(date)) return { ok: false };
    const s = STATUS[(row[si] ?? "").trim().toLowerCase()];
    if (!s) return { ok: false };
    if (s !== "open") days[date] = s;
  }
  if (!Number.isFinite(updatedAt) || updatedAt > nowMs + 5 * 60_000 || nowMs - updatedAt > staleAfterDays * 86_400_000) return { ok: false };
  return { ok: true, days, updatedAt };
}

/**
 * What the date check says about one day. Never "booked": the artist confirms by message.
 * @param {string} ymd @param {string} today @param {DatesResult|null} r null while the diary loads
 * @returns {{ state: "past"|"open"|"few"|"taken"|"unknown", words: string }}
 */
export function dayAnswer(ymd, today, r) {
  if (ymd < today) return { state: "past", words: "That date has gone." };
  if (!r || !r.ok) return { state: "unknown", words: "We can't see the diary just now. Ask, and we'll reply with the day." };
  const s = r.days[ymd] ?? "open";
  if (s === "taken") return { state: "taken", words: "Taken for bridal mehndi. Guest mehndi, or the evening before, may still be free." };
  if (s === "few") return { state: "few", words: "A few hours left on this day. Ask soon." };
  return { state: "open", words: "Free so far. Ask, and we'll hold it while you decide." };
}

/**
 * When to have the mehndi so the stain is darkest on the day: the artist's own number of days before.
 * @param {string} wedding @param {number} daysBefore
 */
export function mehndiDay(wedding, daysBefore) {
  return addDaysYmd(wedding, -daysBefore);
}

/**
 * The guest mehndi sum: how many artists and about how long, from the artist's own minutes per design and how long one
 * artist works on a night. More guests than the team can do in a night says so (`over`) rather than promising.
 * @param {number} guests @param {number} minutesEach @param {number} perArtistMinutes @param {number} maxArtists
 * @returns {{ artists: number, minutes: number, over: boolean }} minutes = the night's length, rounded up to ten
 */
export function guestPlan(guests, minutesEach, perArtistMinutes, maxArtists) {
  const total = Math.max(0, guests) * minutesEach;
  const need = Math.max(1, Math.ceil(total / perArtistMinutes));
  const artists = Math.min(need, maxArtists);
  return { artists, minutes: Math.ceil(total / artists / 10) * 10, over: need > maxArtists };
}

/** "2 hrs 30", "1 hr", "50 min". @param {number} minutes */
export function hoursWords(minutes) {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  if (!h) return `${m} min`;
  return `${h} hr${h > 1 ? "s" : ""}${m ? ` ${m}` : ""}`;
}

const NUMBER_WORDS = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight"];
/** "Two artists" @param {number} n */
export const artistsWords = (n) => `${NUMBER_WORDS[n - 1] ?? n} artist${n === 1 ? "" : "s"}`;

/** "£1,080" @param {number} n */
export const pounds = (n) => `£${n.toLocaleString("en-GB")}`;

/** @typedef {{ id: string, label: string, daysBefore: number, text?: string, mehndi?: boolean }} PlanStep */
/**
 * The wedding week planner: each step's day, worked back from the wedding by the artist's own days, earliest first,
 * marked past if it falls before today.
 * @param {string} wedding @param {PlanStep[]} steps @param {string} today
 */
export function planDates(wedding, steps, today) {
  return steps
    .map((s) => { const date = addDaysYmd(wedding, -s.daysBefore); return { ...s, date, past: date < today }; })
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** @param {string} s */
const icsText = (s) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/**
 * A calendar file of all-day events (no time, so no time zone can move them).
 * @param {{ artist: string, place: string, stamp: string, events: { id: string, date: string, title: string, note?: string }[] }} o
 *   stamp = UTC "YYYYMMDDTHHMMSSZ"
 */
export function weekIcs(o) {
  const slug = o.artist.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Sitefloor//${icsText(o.artist)} wedding week//EN`, "CALSCALE:GREGORIAN",
    ...o.events.flatMap((e) => [
      "BEGIN:VEVENT",
      `UID:${e.id}-${e.date}@${slug}`,
      `DTSTAMP:${o.stamp}`,
      `DTSTART;VALUE=DATE:${e.date.replace(/-/g, "")}`,
      `DTEND;VALUE=DATE:${addDaysYmd(e.date, 1).replace(/-/g, "")}`,
      `SUMMARY:${icsText(e.title)}`,
      ...(e.note ? [`DESCRIPTION:${icsText(e.note)}`] : []),
      `LOCATION:${icsText(o.place)}`,
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ].join("\r\n") + "\r\n";
}

/** "20261109T091200Z" @param {Date} d */
export const icsStamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

// ---------------------------------------------------------------- the messages (the artist's own opening first)

/** @param {string} opening @param {string} ymd */
export function dateText(opening, ymd) {
  return ymd ? `${opening} is ${ukDate(ymd)} free for bridal mehndi?` : `${opening} I'd like to check a date for bridal mehndi.`;
}

/**
 * @param {string} opening
 * @param {{ guests: number, size: string, minutes: number, price: number, wedding?: string }} q
 */
export function guestText(opening, q) {
  const when = q.wedding && isYmd(q.wedding) ? ` on ${ukDate(q.wedding)}` : "";
  return `${opening} guest mehndi${when}: ${q.guests} ${q.guests === 1 ? "guest" : "guests"}, ${q.size.toLowerCase()} each (about ${q.minutes} min, from ${pounds(q.price)}). Could you quote for us?`;
}

/** @param {string} opening @param {string} design */
export function designText(opening, design) {
  return `${opening} I'd like to ask about the ${design} design.`;
}

/**
 * The planner, to the artist: the wedding and the mehndi day it suggests.
 * @param {string} opening @param {string} wedding @param {string} [mehndi]
 */
export function plannerText(opening, wedding, mehndi) {
  if (!wedding) return `${opening} I'd like to plan my bridal mehndi.`;
  return `${opening} our wedding is ${ukDate(wedding)}.${mehndi ? ` Could we hold ${ukDate(mehndi)} for my mehndi?` : ""}`;
}

/**
 * The planner, to the family: every step on its day, one line each.
 * @param {string} artist @param {{ label: string, date: string }[]} dates @param {string} wedding
 */
export function familyText(artist, dates, wedding) {
  return [`Our mehndi week, from ${artist}:`, ...dates.map((d) => `${ukDate(d.date)}: ${d.label}`), `${ukDate(wedding)}: the wedding`].join("\n");
}

/**
 * The personal details request.
 * @param {string} opening
 * @param {{ kinds: string[], details: string, where: string, wedding?: string }} p
 */
export function personalText(opening, p) {
  const parts = [`${opening} I'd like something personal hidden in my bridal mehndi.`];
  if (p.kinds.length) parts.push(`What: ${p.kinds.join(", ")}.`);
  if (p.details) parts.push(`Details: ${p.details}${/[.!?]$/.test(p.details) ? "" : "."}`);
  if (p.where) parts.push(`Where: ${p.where}.`);
  if (p.wedding && isYmd(p.wedding)) parts.push(`Our wedding is ${ukDate(p.wedding)}.`);
  parts.push("I'll send reference photos here.");
  return parts.join(" ");
}
