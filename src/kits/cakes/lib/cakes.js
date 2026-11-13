// @ts-check
/**
 * Pure logic for the cakes kit (celebration cake designers who work to commission). No DOM.
 * Every portion count, price, delivery area and date is the studio's own (site.json or its sheet); these functions
 * only combine them, and say "ask us" whenever the studio's own figures don't give an answer.
 */
import { parseCsv } from "../../../core/lib/sheet.js";

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * @typedef {{ size: number, finger: number, dessert: number }} Tier  one round tier: its diameter in inches and the
 *   portions the studio cuts from it
 * @typedef {{ tiers: number, from: number }} FromPrice  the studio's "from" price for a cake of that many tiers
 * @typedef {{ tiers: Tier[], maxTiers: number, prices: FromPrice[] }} Chart
 * @typedef {{ sizes: number[], portions: number, from: number|null }} Plan
 */

/**
 * The smallest cake from the studio's own chart that feeds `guests`: consecutive tier sizes (no gaps), at most
 * `maxTiers`, fewest portions over, and on a tie the more tiers. Null when even the biggest won't do (then: ask us).
 * @param {number} guests @param {"finger"|"dessert"} portion @param {Chart} chart @returns {Plan|null}
 */
export function planCake(guests, portion, chart) {
  if (!Number.isFinite(guests) || guests < 1) return null;
  const tiers = [...chart.tiers].sort((a, b) => a.size - b.size);
  /** @type {Plan|null} */
  let best = null;
  for (let n = 1; n <= Math.min(chart.maxTiers, tiers.length); n++) {
    for (let start = 0; start + n <= tiers.length; start++) {
      const run = tiers.slice(start, start + n);
      const portions = run.reduce((sum, t) => sum + t[portion], 0);
      if (portions < guests) continue;
      if (!best || portions < best.portions || (portions === best.portions && n > best.sizes.length)) {
        best = { sizes: run.map((t) => t.size), portions, from: chart.prices.find((p) => p.tiers === n)?.from ?? null };
      }
    }
  }
  return best;
}

/** "6, 8 and 10 in". @param {number[]} sizes */
export function sizesWords(sizes) {
  if (!sizes.length) return "";
  if (sizes.length === 1) return `${sizes[0]} in`;
  return `${sizes.slice(0, -1).join(", ")} and ${sizes[sizes.length - 1]} in`;
}

/** "3 tiers" / "1 tier". @param {number} n */
export const tiersWords = (n) => `${n} ${n === 1 ? "tier" : "tiers"}`;

/** "£1,050". @param {number} n */
export const pounds = (n) => `£${n.toLocaleString("en-GB")}`;

/**
 * @typedef {{ ok: true, left: Record<string, number>, updated: string } | { ok: false }} Dates
 */

/**
 * The studio's diary from its published sheet: one row per date it has filled or part-filled, `date,left,updated_at`
 * (left = cakes it can still take that day; dates not listed are free). Fails closed: a missing column, a bad row, an
 * `updated_at` older than `staleAfterDays` or later than today gives { ok: false }, and the site says "ask us"
 * instead of "free". So the sheet always keeps at least one dated row, even when nothing is booked.
 * @param {string} csv @param {string} today YYYY-MM-DD in the studio's time zone @param {number} staleAfterDays
 * @returns {Dates}
 */
export function datesFromCsv(csv, today, staleAfterDays) {
  const rows = parseCsv(csv);
  const head = (rows.shift() ?? []).map((h) => h.trim().toLowerCase());
  const iDate = head.indexOf("date"), iLeft = head.indexOf("left"), iUpd = head.indexOf("updated_at");
  if (iDate < 0 || iLeft < 0 || iUpd < 0) return { ok: false };
  /** @type {Record<string, number>} */
  const left = {};
  let updated = "";
  for (const r of rows) {
    if (r.every((c) => !c.trim())) continue;
    const d = (r[iDate] ?? "").trim(), n = Number((r[iLeft] ?? "").trim()), u = (r[iUpd] ?? "").trim().slice(0, 10);
    if (!isYmd(d) || !Number.isInteger(n) || n < 0) return { ok: false };
    left[d] = n;
    if (isYmd(u) && u > updated) updated = u;
  }
  // Stale, or dated after today (a typo like 2027 for 2026 would otherwise read as fresh for a year): unreadable.
  if (!updated || updated > today || daysBetween(updated, today) > staleAfterDays) return { ok: false };
  return { ok: true, left, updated };
}

/**
 * What to say about one date. "past" and "soon" come first (a date inside the lead time can't be promised from a
 * sheet), then the diary: none left, one left, or free.
 * @param {Dates} dates @param {string} date @param {string} today @param {number} minDays the studio's shortest notice
 * @returns {"past"|"soon"|"unknown"|"booked"|"one"|"free"}
 */
export function dateStatus(dates, date, today, minDays) {
  if (!isYmd(date)) return "unknown";
  if (date < today) return "past";
  if (daysBetween(today, date) < minDays) return "soon";
  if (!dates.ok) return "unknown";
  const n = Object.hasOwn(dates.left, date) ? dates.left[date] : null;
  if (n === 0) return "booked";
  if (n === 1) return "one";
  return "free";
}

/**
 * The outward part of a UK postcode ("SW3" from "sw3 4hx", "RG9" from "RG9"), or null.
 * @param {string} input
 */
export function outward(input) {
  const v = String(input ?? "").toUpperCase().replace(/\s+/g, "");
  const m = v.match(/^([A-Z]{1,2})(\d[A-Z\d]?)(\d[A-Z]{2})?$/);
  return m ? m[1] + m[2] : null; // a full postcode's inward part (m[3]) is dropped
}

/**
 * @typedef {{ name: string, districts: string[], from: number, arrive: string }} Area  the studio's own delivery area:
 *   postcode areas ("SW") or districts ("RG9"), its starting charge and when it arrives before the meal
 */

/**
 * The studio's delivery area for a postcode: an exact district ("RG9") wins over its area letters ("RG").
 * @param {string} input @param {Area[]} areas @returns {{ district: string, area: Area|null } | null} null when it isn't a postcode
 */
export function areaFor(input, areas) {
  const district = outward(input);
  if (!district) return null;
  const letters = district.replace(/\d.*$/, "");
  const exact = areas.find((a) => a.districts.includes(district));
  const broad = areas.find((a) => a.districts.includes(letters));
  return { district, area: exact ?? broad ?? null };
}

/**
 * Flavours on in a month: those without months are on all year.
 * @template {{ months?: number[]|null }} T
 * @param {T[]} items @param {number} month 1–12 @returns {T[]}
 */
export function inSeason(items, month) {
  return items.filter((f) => !f.months || f.months.includes(month));
}

/** "Jan to Mar", "All year". @param {number[]|undefined} months */
export function seasonWords(months) {
  if (!months || !months.length) return "All year";
  const s = [...months].sort((a, b) => a - b);
  const contiguous = s.every((m, i) => i === 0 || m === s[i - 1] + 1);
  const short = (/** @type {number} */ m) => MONTHS[m - 1].slice(0, 3);
  if (s.length === 1) return MONTHS[s[0] - 1];
  if (contiguous) return `${short(s[0])} to ${short(s[s.length - 1])}`;
  return s.map(short).join(", ");
}

/**
 * The brief as one WhatsApp message, in the order a designer quotes from. Blank answers are left out.
 * @param {{ intro: string, date?: string, guests?: number, portion?: "finger"|"dessert", sizes?: number[],
 *   flavours?: string[], finish?: string, venue?: string, notes?: string }} b
 */
export function briefText(b) {
  const lines = [b.intro];
  if (b.date) lines.push(`Date: ${longDate(b.date)}`);
  if (b.guests) lines.push(`Guests: ${b.guests}${b.portion ? ` (${b.portion === "dessert" ? "as the dessert" : "with coffee"})` : ""}`);
  if (b.sizes?.length) lines.push(`Cake: ${tiersWords(b.sizes.length)}, ${sizesWords(b.sizes)}`);
  const fl = (b.flavours ?? []).filter(Boolean);
  if (fl.length) lines.push(fl.length === 1 ? `Flavour: ${fl[0]}` : `Flavours, top to bottom: ${fl.join("; ")}`);
  if (b.finish) lines.push(`Finish: ${b.finish}`);
  if (b.venue) lines.push(`Venue: ${b.venue}`);
  if (b.notes?.trim()) lines.push(`Notes: ${b.notes.trim()}`);
  return lines.join("\n");
}

/** "Saturday 12 June 2027". @param {string} ymd */
export function longDate(ymd) {
  if (!isYmd(ymd)) return ymd;
  const d = new Date(`${ymd}T12:00:00Z`);
  return `${d.toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" })} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** @param {unknown} v @returns {v is string} */
export function isYmd(v) {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(`${v}T12:00:00Z`).toISOString().startsWith(v);
}

/** Whole days from a to b (YYYY-MM-DD). @param {string} a @param {string} b */
export function daysBetween(a, b) {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
}

/** YYYY-MM-DD plus n days. @param {string} ymd @param {number} n */
export function addDays(ymd, n) {
  return new Date(Date.parse(`${ymd}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
}
