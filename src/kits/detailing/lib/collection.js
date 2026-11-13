// @ts-check
/**
 * Collection and delivery by postcode district and day, from the studio's sheet: one row per district it collects
 * from (`district`, e.g. KT13), the `days` it does (e.g. "mon thu"), an optional `fee` in whole pounds each way (0 for
 * none, blank to leave unsaid) and `updated_at`. A stale or unreadable sheet answers "ask us", never a wrong yes.
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";

/** How far ahead of now a sheet's updated_at may be (clocks differ a little) before it's treated as a typo. */
export const FUTURE_SLACK_MS = 10 * 60_000;
export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export const DAY_NAMES = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };

/** A UK postcode's district (its first half): "kt13 8xx" → "KT13", "SW1A 1AA" → "SW1A"; "" if it isn't one. @param {unknown} v */
export function districtOf(v) {
  const s = String(v ?? "").toUpperCase().replace(/[^A-Z0-9 ]/g, "").trim();
  const full = /^([A-Z]{1,2}\d[A-Z\d]?) ?\d[A-Z]{2}$/.exec(s);
  if (full) return full[1];
  const half = /^([A-Z]{1,2}\d[A-Z\d]?)$/.exec(s.replace(/\s+/g, ""));
  return half ? half[1] : "";
}

/** @typedef {{ days: string[], fee: number|null }} District */
/** @typedef {{ ok: true, districts: Map<string, District> } | { ok: false, reason: "unreadable"|"stale"|"empty" }} Rounds */

/** @param {string} text @param {number} nowMs @param {string} timeZone @param {number} staleAfterHours @returns {Rounds} */
export function collectionFromCsv(text, nowMs, timeZone, staleAfterHours) {
  const rows = parseCsv(text);
  if (rows.length < 2) return { ok: false, reason: "empty" };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const [d, ds, f, u] = ["district", "days", "fee", "updated_at"].map((k) => head.indexOf(k));
  if (d < 0 || ds < 0 || u < 0) return { ok: false, reason: "unreadable" };
  /** @type {Map<string, District>} */ const districts = new Map();
  let updated = NaN;
  for (const r of rows.slice(1)) {
    const district = districtOf(r[d]);
    const days = String(r[ds] ?? "").toLowerCase().split(/[\s,;/]+/).map((x) => x.slice(0, 3)).filter((x) => DAYS.includes(x));
    if (!district || !days.length) continue;
    const raw = f < 0 ? "" : String(r[f] ?? "").replace(/[£\s]/g, "");
    const fee = raw === "" ? null : Number.isInteger(Number(raw)) && Number(raw) >= 0 ? Number(raw) : null;
    districts.set(district, { days: DAYS.filter((x) => days.includes(x)), fee });
    const t = parseSheetTime(r[u] ?? "", timeZone);
    if (!Number.isNaN(t)) updated = Number.isNaN(updated) ? t : Math.max(updated, t);
  }
  if (!districts.size) return { ok: false, reason: "empty" };
  if (Number.isNaN(updated)) return { ok: false, reason: "unreadable" };
  // A date ahead of now is a typo (it would never go stale), so the sheet can't be trusted.
  if (updated - nowMs > FUTURE_SLACK_MS) return { ok: false, reason: "unreadable" };
  if (nowMs - updated > staleAfterHours * 3600_000) return { ok: false, reason: "stale" };
  return { ok: true, districts };
}

/**
 * The answer for one district and day, in plain words.
 * @param {Map<string, District>} districts @param {string} district @param {string} day
 * @returns {{ kind: "yes"|"other-days"|"no", words: string }}
 */
export function collectionAnswer(districts, district, day) {
  const r = districts.get(district);
  const list = (/** @type {string[]} */ ds) => ds.map((x) => /** @type {any} */ (DAY_NAMES)[x]).join(ds.length === 2 ? " and " : ", ");
  if (!r) return { kind: "no", words: `We don't usually collect from ${district}. Ask us: we'll say if we can.` };
  const fee = r.fee === null ? "" : r.fee === 0 ? " No charge." : ` £${r.fee} each way.`;
  if (!r.days.includes(day)) return { kind: "other-days", words: `Not on ${/** @type {any} */ (DAY_NAMES)[day]}s. We collect from ${district} on ${list(r.days)}.${fee}` };
  return { kind: "yes", words: `Yes: we collect from ${district} on ${/** @type {any} */ (DAY_NAMES)[day]}s.${fee}` };
}
