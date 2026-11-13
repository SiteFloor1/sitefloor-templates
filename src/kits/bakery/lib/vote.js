// @ts-check
/**
 * The flavour vote, counted from the shop's own Google Form responses (the Form's Sheet, published as CSV). Each row
 * is one answer: a timestamp and the flavour chosen. Only answers in this week's window count, and only for flavours
 * on the list; an unreadable sheet gives { ok: false } so the page shows no numbers rather than wrong ones.
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";

/** @typedef {{ id: string, name: string }} Candidate */
/** @typedef {{ ok: true, counts: Record<string, number>, total: number } | { ok: false }} Votes */

/**
 * @param {string} csv @param {Candidate[]} candidates @param {{ from: number, to: number }} window ms, inclusive
 * @param {string} timeZone @returns {Votes}
 */
export function votesFromCsv(csv, candidates, window, timeZone) {
  const rows = parseCsv(csv);
  if (rows.length < 1 || (rows[0] ?? []).length < 2) return { ok: false };
  const byName = new Map(candidates.flatMap((c) => [[c.name.trim().toLowerCase(), c.id], [c.id, c.id]]));
  /** @type {Record<string, number>} */ const counts = Object.fromEntries(candidates.map((c) => [c.id, 0]));
  let total = 0;
  for (const r of rows.slice(1)) {
    const at = parseSheetTime((r[0] ?? "").trim(), timeZone);
    if (!Number.isFinite(at) || at < window.from || at > window.to) continue;
    const id = byName.get((r[r.length - 1] ?? "").trim().toLowerCase());
    if (!id) continue;
    counts[id] += 1; total += 1;
  }
  return { ok: true, counts, total };
}

/**
 * The share of each flavour, rounded so they add up to 100, and the leader (none on a tie or with no votes).
 * @param {Record<string, number>} counts @returns {{ shares: Record<string, number>, leader: string|null }}
 */
export function voteShares(counts) {
  const ids = Object.keys(counts), total = ids.reduce((s, id) => s + counts[id], 0);
  if (!total) return { shares: Object.fromEntries(ids.map((id) => [id, 0])), leader: null };
  const raw = ids.map((id) => ({ id, v: (counts[id] / total) * 100 }));
  const floor = raw.map((r) => ({ ...r, f: Math.floor(r.v) }));
  let left = 100 - floor.reduce((s, r) => s + r.f, 0);
  for (const r of [...floor].sort((a, b) => (b.v - b.f) - (a.v - a.f))) { if (left <= 0) break; r.f += 1; left -= 1; }
  const top = Math.max(...ids.map((id) => counts[id]));
  const leaders = ids.filter((id) => counts[id] === top);
  return { shares: Object.fromEntries(floor.map((r) => [r.id, r.f])), leader: leaders.length === 1 ? leaders[0] : null };
}

/** The pre-filled Form link for one flavour. @param {string} formUrl @param {string} field @param {string} name */
export function voteLink(formUrl, field, name) {
  const u = new URL(formUrl);
  u.searchParams.set("usp", "pp_url");
  u.searchParams.set(field, name);
  return u.href;
}

/** This week's window: the 7 days ending at the end of `closes` (the shop's last voting day). @param {string} closes YYYY-MM-DD @param {string} timeZone */
export function voteWindow(closes, timeZone) {
  const end = parseSheetTime(`${closes} 23:59:59`, timeZone);
  return { from: end - 7 * 86_400_000 + 1000, to: end };
}
