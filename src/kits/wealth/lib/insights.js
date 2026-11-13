// @ts-check
/**
 * Insights a firm publishes itself, from its own Google Sheet (published as CSV). A row shows on the site only when the
 * firm's compliance officer has ticked it: "Approved" is yes or TRUE, with who approved it and the date. Rows that make a
 * performance promise, or are missing their date or title, stay off the site whatever the tick says. Pure: no DOM.
 */
import { parseCsv } from "../../../core/lib/sheet.js";
import { promises } from "./fca.js";
import { YMD, isTicked, approvalHold } from "./approval.js";

export { isTicked };

/** The sheet's columns, by heading (any order, any case). */
export const COLUMNS = ["title", "category", "date", "summary", "body", "author", "photo", "approved", "approved by", "approved on"];


/** A web address segment for an insight, from its title: whole words, 40 characters at most. @param {string} title */
export function slugOf(title) {
  const words = title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, " and ").replace(/['’]/g, "").split(/[^a-z0-9]+/).filter(Boolean);
  let out = "";
  for (const w of words) { const next = out ? `${out}-${w}` : w; if (next.length > 40) break; out = next; }
  return out || words[0]?.slice(0, 40) || "";
}

/**
 * @typedef {{ id: string, title: string, category: string, date: string, summary: string, body: string[], author: string, photo: string, approvedBy: string, approvedOn: string }} Insight
 * @typedef {{ items: Insight[], held: { row: number, why: string }[] }} Read
 */

/**
 * Why a row can't be shown, or null when it can.
 * @param {Record<string, string>} r @param {string} today YYYY-MM-DD in the firm's time zone
 */
export function holdReason(r, today) {
  const gate = approvalHold(r, today);
  if (gate) return gate;
  if (!(r.title ?? "").trim()) return "no title";
  if (!YMD.test((r.date ?? "").trim())) return "Date isn't a date (YYYY-MM-DD)";
  if (r.date.trim() > today) return "not published yet (dated in the future)";
  if (!(r.summary ?? "").trim() || !(r.body ?? "").trim()) return "no summary or body";
  if (promises(`${r.title} ${r.summary} ${r.body}`)) return "promises a return or performance";
  return null;
}

/**
 * Reads the firm's sheet. Unknown photo names fall back to the first of the site's own insight photos, so a typo never
 * leaves a gap or loads an image from elsewhere.
 * @param {string} csv @param {{ today: string, photos: string[] }} o @returns {Read}
 */
export function insightsFromCsv(csv, o) {
  const rows = parseCsv(csv);
  if (!rows.length) return { items: [], held: [] };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  if (!head.includes("title") || !head.includes("approved")) throw new Error("the sheet needs at least Title and Approved columns");
  /** @type {Insight[]} */ const items = [];
  /** @type {{ row: number, why: string }[]} */ const held = [];
  const seen = new Set();
  rows.slice(1).forEach((cells, i) => {
    /** @type {Record<string, string>} */ const r = {};
    head.forEach((h, j) => { r[h] = (cells[j] ?? "").trim(); });
    const why = holdReason(r, o.today);
    if (why) { held.push({ row: i + 2, why }); return; }
    let id = slugOf(r.title) || `insight-${i + 2}`;
    while (seen.has(id)) id = `${id}-2`;
    seen.add(id);
    items.push({
      id, title: r.title, category: r.category || "Insight", date: r.date, summary: r.summary,
      body: r.body.split(/\n\s*\n|\r\n\s*\r\n/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean),
      author: r.author ?? "", photo: o.photos.includes(r.photo) ? r.photo : (o.photos[0] ?? ""),
      approvedBy: r["approved by"], approvedOn: r["approved on"],
    });
  });
  items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return { items, held };
}

/** "28 October 2026" @param {string} ymd */
export const ukDate = (ymd) => new Date(`${ymd}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
