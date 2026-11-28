// @ts-check
/**
 * Free and booked nights for each home (HOL-7, Signature), read from the company's own Google Sheet. The sheet has
 * one row per booked stay (home, first night, night after the last, updated_at); a company can fill it by hand or pull
 * each listing's calendar link into it. When the sheet hasn't been updated for a day and a half, nothing is shown as
 * free: a stale calendar fails closed.
 */

import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";

/** @typedef {{ home: string, from: string, to: string }} Stay */

/** A first night or leaving day: 2026-11-27 or 27/11/2026 (how UK Google Sheets publish dates); anything else is null. @param {string} text */
export function sheetDate(text) {
  const s = text.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s), uk = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  const [y, mo, d] = iso ? [iso[1], iso[2], iso[3]] : uk ? [uk[3], uk[2], uk[1]] : [];
  if (!y) return null;
  const ymd = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const t = new Date(`${ymd}T12:00:00Z`);
  return !Number.isNaN(t.getTime()) && t.toISOString().slice(0, 10) === ymd ? ymd : null;
}

/**
 * Reads the sheet. Any row it can't read with certainty (a date it can't read, a home that isn't on the site, a stay
 * that ends before it starts, an updated_at it can't read or that is in the future) refuses the whole sheet: `updated`
 * is null, so the calendar shows nothing as free. Home names match the site's ids whatever their capitals.
 * @param {string} csv @param {{ homes: string[], timeZone: string, now: number }} o
 * @returns {{ stays: Stay[], updated: number|null, problem: string|null }}
 */
export function staysFromCsv(csv, o) {
  const refuse = (/** @type {string} */ problem) => ({ stays: [], updated: null, problem });
  const rows = parseCsv(csv.replace(/^\uFEFF/, ""));
  if (!rows.length) return refuse("empty sheet");
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const [h, f, t, u] = ["home", "from", "to", "updated_at"].map((k) => head.indexOf(k));
  if ([h, f, t, u].some((i) => i < 0)) return refuse("missing column");
  const ids = new Map(o.homes.map((id) => [id.toLowerCase(), id]));
  /** @type {Stay[]} */ const stays = []; let updated = 0;
  for (const [i, c] of rows.slice(1).entries()) {
    const row = `row ${i + 2}`;
    const home = ids.get((c[h] ?? "").trim().toLowerCase());
    if (!home) return refuse(`${row}: unknown home`);
    const from = sheetDate(c[f] ?? ""), to = sheetDate(c[t] ?? "");
    if (!from || !to) return refuse(`${row}: unreadable date`);
    if (to <= from) return refuse(`${row}: leaves before it starts`);
    const when = parseSheetTime(c[u] ?? "", o.timeZone);
    if (Number.isNaN(when)) return refuse(`${row}: unreadable updated_at`);
    if (when > o.now + 10 * 60_000) return refuse(`${row}: updated_at in the future`);
    updated = Math.max(updated, when);
    stays.push({ home, from, to });
  }
  return updated ? { stays, updated, problem: null } : refuse("no stays");
}

/** @param {number|null} updated @param {number} now @param {number} [hours] */
export const isStale = (updated, now, hours = 36) => updated === null || now - updated > hours * 3600_000;

/** @param {string} ymd @param {number} days */
export function addDays(ymd, days) {
  const d = new Date(`${ymd}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** @param {Stay[]} stays @param {string} home @param {string} night */
export const isBooked = (stays, home, night) => stays.some((s) => s.home === home && s.from <= night && night < s.to);

/**
 * The next free runs of at least `min` nights for one home, within `weeks` weeks of today. @param {Stay[]} stays
 * @param {string} home @param {string} today @param {{ min?: number, weeks?: number, max?: number }} [o]
 * A run still free at the end of the window is `open` (it is shown as "from 20 Dec", not as ending there).
 * @returns {{ from: string, to: string, nights: number, open?: boolean }[]}
 */
export function freeRuns(stays, home, today, o = {}) {
  const min = o.min ?? 3, weeks = o.weeks ?? 12, max = o.max ?? 3;
  /** @type {{ from: string, to: string, nights: number, open?: boolean }[]} */ const out = [];
  let start = -1;
  for (let i = 0; i <= weeks * 7; i++) {
    const free = i < weeks * 7 && !isBooked(stays, home, addDays(today, i));
    if (free && start < 0) start = i;
    if (!free && start >= 0) {
      if (i - start >= min) out.push({ from: addDays(today, start), to: addDays(today, i), nights: i - start, ...(i === weeks * 7 ? { open: true } : {}) });
      start = -1;
    }
    if (out.length >= max) break;
  }
  return out;
}

/** "13 to 20 Dec" (the night after the last is the leaving day); "from 20 Dec" when still free at the window's end
 * @param {{ from: string, to: string, open?: boolean }} run */
export function runText(run) {
  const f = new Date(`${run.from}T12:00:00Z`), t = new Date(`${run.to}T12:00:00Z`);
  const day = (/** @type {Date} */ d) => d.toLocaleDateString("en-GB", { day: "numeric", timeZone: "UTC" });
  const mon = (/** @type {Date} */ d) => d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
  if (run.open) return `from ${day(f)} ${mon(f)}`;
  return f.getUTCMonth() === t.getUTCMonth() ? `${day(f)} to ${day(t)} ${mon(t)}` : `${day(f)} ${mon(f)} to ${day(t)} ${mon(t)}`;
}

/** "today", "yesterday" or "on 25 Nov", by calendar day in the company's time zone. @param {number} updated @param {string} today @param {string} timeZone */
export function updatedWord(updated, today, timeZone) {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone }).format(updated);
  if (ymd === today) return "today";
  if (ymd === addDays(today, -1)) return "yesterday";
  return `on ${new Date(`${ymd}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}`;
}
