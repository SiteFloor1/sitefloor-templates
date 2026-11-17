// @ts-check
/**
 * Modest fashion kit: the pure logic behind the hem line, the length guide, the Eid last order dates, private
 * appointments, complete the look and the Eid family list. No DOM: the browser scripts and the build both use it.
 * Every chart, length, price, cut-off and time comes from the shop's site.json; the kit only does the sums.
 */
import { addDaysYmd, daysBetween, ukDate } from "../../../core/lib/diary.js";

/** Inches to the nearest half, as the shop writes them: 56, 56½. @param {number} n */
export function inches(n) {
  const h = Math.round(n * 2) / 2;
  const whole = Math.floor(h);
  return (whole || !(h % 1) ? String(whole) : "") + (h % 1 ? "½" : "");
}

/** Pounds as the UK writes them, without pence when whole: £345, £1,175, £12.50. @param {number} n */
export function pounds(n) {
  const whole = Number.isInteger(n);
  return "£" + n.toLocaleString("en-GB", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 });
}

/** "1 day", "5 days". @param {number} n */
export function daysWords(n) {
  return `${n} ${n === 1 ? "day" : "days"}`;
}

/** Today in the shop's time zone, as "YYYY-MM-DD". @param {number} ms @param {string} [timeZone] */
export function ymdIn(ms, timeZone = "Europe/London") {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms));
}

/**
 * The length to wear: the longest of the shop's lengths that still clears the floor by `clear` inches.
 * `reach` is shoulder to floor plus the shoes' heel. Null when even the shortest length would touch the floor.
 * @param {number[]} lengths @param {number} reach @param {number} [clear]
 */
export function pickLength(lengths, reach, clear = 0.5) {
  let best = null;
  for (const l of [...lengths].sort((a, b) => a - b)) if (reach - l >= clear) best = l;
  return best;
}

/**
 * The hem line's answer, in words: "Wear the 56. It stops 1″ above the floor in 2″ heels."
 * @param {{ lengths: number[], clear?: number }} chart @param {number} shoulderToFloor @param {{ label: string, heel: number }} shoe
 * @returns {{ length: number|null, gap: number|null, reach: number, words: string }}
 */
export function hemAnswer(chart, shoulderToFloor, shoe) {
  const reach = shoulderToFloor + shoe.heel;
  const length = pickLength(chart.lengths, reach, chart.clear ?? 0.5);
  if (length === null) return { length, gap: null, reach, words: "Shorter than our shortest length. Ask us about taking one up." };
  const gap = reach - length;
  return { length, gap, reach, words: `Wear the ${length}. It stops ${inches(gap)}″ above the floor${shoe.heel ? ` in ${shoe.label}` : ""}.` };
}

/**
 * The ruler beside the hem photograph: each of the shop's lengths that reaches no further than the floor, where it
 * sits, and the floor, as fractions of the ruler's height (0 at the top). The last inches only, to scale.
 * @param {number[]} lengths @param {number} reach @param {number|null} best
 */
export function rulerMarks(lengths, reach, best) {
  const lo = Math.min(...lengths) - 3;
  const hi = Math.max(reach, Math.min(...lengths)) + 2.5;
  const at = (/** @type {number} */ i) => (i - lo) / (hi - lo);
  return {
    lines: lengths.filter((l) => l <= reach).map((l) => ({ length: l, at: at(l), on: l === best })),
    floor: at(reach),
    gap: best === null ? null : { words: `${inches(reach - best)}″`, at: at((best + reach) / 2) },
  };
}

/**
 * The row of the shop's height chart that a shoulder-to-floor measurement falls in, if any.
 * @param {{ height: string, from: number, to: number, length: number }[]} rows @param {number} shoulderToFloor
 */
export function chartRow(rows, shoulderToFloor) {
  return rows.find((r) => shoulderToFloor >= r.from && shoulderToFloor <= r.to) ?? null;
}

/**
 * Eid's next expected window on or after today, from the build's list of lunar windows (src/core/lib/seasons.js),
 * with the shop's last order dates counted back from the window's first day. A cut-off that has passed is marked
 * closed. Null when the list holds no Eid ahead (the section then stays hidden: never a guessed date).
 * @param {{ name: string, from: string, to: string }[]} windows @param {{ label: string, daysBefore: number }[]} cutoffs @param {string} today
 */
export function eidOrderDates(windows, cutoffs, today) {
  const next = [...windows].sort((a, b) => (a.from < b.from ? -1 : 1)).find((w) => w.to >= today);
  if (!next) return null;
  const rows = cutoffs.map((c) => {
    const by = addDaysYmd(next.from, -c.daysBefore);
    const left = daysBetween(today, by);
    return { label: c.label, by, byWords: ukDate(by), left, open: left >= 0 };
  });
  return { name: next.name, from: next.from, to: next.to, words: `${next.name} is expected between ${ukDate(next.from, false)} and ${ukDate(next.to, false)}, when the moon is sighted.`, rows };
}

/** "today", "tomorrow", "in 12 days", "closed". @param {{ left: number, open: boolean }} r */
export function leftWords(r) {
  if (!r.open) return "closed";
  if (r.left === 0) return "today";
  if (r.left === 1) return "tomorrow";
  return `in ${r.left} days`;
}

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/**
 * The shop's standing appointment times on the coming dates: each day from tomorrow for `days` days whose weekday
 * has times, skipping the shop's closed dates. Times are requests, confirmed by message.
 * @param {Record<string, string[]>} weekly @param {string} today @param {number} days @param {string[]} [closed]
 */
export function appointmentDates(weekly, today, days, closed = []) {
  const out = [];
  for (let i = 1; i <= days; i++) {
    const date = addDaysYmd(today, i);
    const day = DAYS[new Date(`${date}T12:00:00Z`).getUTCDay()];
    const times = weekly[day] ?? [];
    if (times.length && !closed.includes(date)) out.push({ date, words: ukDate(date), times });
  }
  return out;
}

/**
 * The request a private appointment sends.
 * @param {string} shop @param {{ words: string }|undefined} day @param {string} time @param {number} n @param {string} why
 */
export function appointmentMessage(shop, day, time, n, why) {
  if (!day || !time) return `Hello ${shop}, I'd like to ask about a private appointment.`;
  return `Hello ${shop}, I'd like to request a private appointment on ${day.words} at ${time}, for ${n} ${n === 1 ? "person" : "people"}. It's for: ${why}.`;
}

/** What the page shows above the button. @param {{ words: string }|undefined} day @param {string} time @param {number} n */
export function appointmentSummary(day, time, n) {
  if (!day || !time) return "No times in the coming weeks; message us for one.";
  return `${day.words} at ${time}, for ${n === 1 ? "one" : n}.`;
}

/**
 * Complete the look: the chosen pieces and the total. `chosen` maps an item index to true; required items always count.
 * @param {{ name: string, price: number, optional?: boolean }[]} items @param {boolean[]} chosen
 */
export function lookTotal(items, chosen) {
  const picked = items.filter((x, i) => !x.optional || chosen[i]);
  return { picked, total: picked.reduce((s, x) => s + x.price, 0) };
}

/**
 * The message that sends a look to the shop.
 * @param {string} shop @param {string} look @param {{ name: string, price: number }[]} picked @param {number|null} length @param {number} total
 */
export function lookMessage(shop, look, picked, length, total) {
  const names = picked.map((x, i) => (i === 0 && length ? `${x.name} in the ${length}` : x.name));
  return `Hello ${shop}, I'd like to order ${look}: ${names.join(", ")}. That's ${pounds(total)}.`;
}

/**
 * The Eid family list lives only in the page's address (#…), so it can be sent round the family and nothing is
 * stored. Each person: a first name, a piece id and a length (or 0 for "not sure"). Names are trimmed and capped.
 * @typedef {{ name: string, piece: string, length: number }} Person
 */

/** @param {Person[]} people */
export function encodeFamily(people) {
  return people.map((p) => [p.name, p.piece, p.length].map((v) => encodeURIComponent(String(v)).replace(/~/g, "%7E")).join("~")).join("|");
}

/**
 * @param {string} hash @param {{ id: string, lengths: number[] }[]} pieces @param {number} [max]
 * @returns {Person[]}
 */
export function decodeFamily(hash, pieces, max = 10) {
  const out = [];
  for (const part of hash.replace(/^#/, "").split("|")) {
    if (!part) continue;
    let name, piece, length;
    try { [name, piece, length] = part.split("~").map((v) => decodeURIComponent(v)); } catch { continue; }
    const p = pieces.find((x) => x.id === piece);
    if (!p) continue;
    const n = Number(length);
    out.push({ name: String(name ?? "").trim().slice(0, 24), piece, length: p.lengths.includes(n) ? n : 0 });
    if (out.length >= max) break;
  }
  return out;
}

/**
 * The family's order as one message, with the total.
 * @param {string} shop @param {Person[]} people @param {{ id: string, name: string, price: number }[]} pieces
 */
export function familyMessage(shop, people, pieces) {
  const lines = people.map((p) => {
    const piece = pieces.find((x) => x.id === p.piece);
    return `${p.name || "Someone"}: ${piece?.name ?? p.piece}, ${p.length ? `the ${p.length}` : "length to check"}`;
  });
  const total = people.reduce((s, p) => s + (pieces.find((x) => x.id === p.piece)?.price ?? 0), 0);
  return { total, text: `Hello ${shop}, our family's Eid order:\n${lines.join("\n")}\nThat's ${pounds(total)} for ${people.length} ${people.length === 1 ? "piece" : "pieces"}.` };
}
