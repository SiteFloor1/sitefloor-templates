// @ts-check
/**
 * Free and booked nights for each home (HOL-7, Signature), read from the company's own Google Sheet. The sheet has
 * one row per booked stay (home, first night, night after the last, updated_at); a company can fill it by hand or pull
 * each listing's calendar link into it. When the sheet hasn't been updated for a day and a half, nothing is shown as
 * free: a stale calendar fails closed.
 */

/** @typedef {{ home: string, from: string, to: string }} Stay */

/** @param {string} line */
function cells(line) {
  /** @type {string[]} */ const out = []; let cur = "", q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === "," && !q) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** @param {string} csv @returns {{ stays: Stay[], updated: number|null }} */
export function staysFromCsv(csv) {
  const rows = csv.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  if (!rows.length) return { stays: [], updated: null };
  const head = cells(rows[0]).map((h) => h.toLowerCase());
  const at = (/** @type {string} */ k) => head.indexOf(k);
  const [h, f, t, u] = ["home", "from", "to", "updated_at"].map(at);
  if ([h, f, t, u].some((i) => i < 0)) return { stays: [], updated: null };
  /** @type {Stay[]} */ const stays = []; let updated = null;
  for (const line of rows.slice(1)) {
    const c = cells(line);
    const when = Date.parse(c[u] ?? "");
    if (!Number.isNaN(when)) updated = Math.max(updated ?? 0, when);
    if (c[h] && YMD.test(c[f] ?? "") && YMD.test(c[t] ?? "") && c[t] > c[f]) stays.push({ home: c[h], from: c[f], to: c[t] });
  }
  return { stays, updated };
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
 * @returns {{ from: string, to: string, nights: number }[]}
 */
export function freeRuns(stays, home, today, o = {}) {
  const min = o.min ?? 3, weeks = o.weeks ?? 12, max = o.max ?? 3;
  /** @type {{ from: string, to: string, nights: number }[]} */ const out = [];
  let start = -1;
  for (let i = 0; i <= weeks * 7; i++) {
    const free = i < weeks * 7 && !isBooked(stays, home, addDays(today, i));
    if (free && start < 0) start = i;
    if (!free && start >= 0) {
      if (i - start >= min) out.push({ from: addDays(today, start), to: addDays(today, i), nights: i - start });
      start = -1;
    }
    if (out.length >= max) break;
  }
  return out;
}

/** "13 to 20 Dec" (the night after the last is the leaving day) @param {{ from: string, to: string }} run */
export function runText(run) {
  const f = new Date(`${run.from}T12:00:00Z`), t = new Date(`${run.to}T12:00:00Z`);
  const day = (/** @type {Date} */ d) => d.toLocaleDateString("en-GB", { day: "numeric", timeZone: "UTC" });
  const mon = (/** @type {Date} */ d) => d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
  return f.getUTCMonth() === t.getUTCMonth() ? `${day(f)} to ${day(t)} ${mon(t)}` : `${day(f)} ${mon(f)} to ${day(t)} ${mon(t)}`;
}
