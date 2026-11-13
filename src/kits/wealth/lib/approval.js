// @ts-check
/**
 * The compliance gate for anything the firm publishes from its own sheet (insights, events): a row shows only when
 * "Approved" is ticked, someone is named in "Approved by" and "Approved on" is a real date that isn't in the future.
 * Pure: no DOM.
 */
export const YMD = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/** "yes", "y", "true", "✓", "ticked" (a Sheets checkbox exports TRUE). @param {string} v */
export const isTicked = (v) => /^(yes|y|true|✓|✔|ticked|approved)$/i.test(v.trim());

/** Why a row isn't approved, or null when it is. @param {Record<string, string>} r @param {string} today YYYY-MM-DD */
export function approvalHold(r, today) {
  if (!isTicked(r.approved ?? "")) return "not approved";
  if (!(r["approved by"] ?? "").trim()) return "approved, but no name in Approved by";
  if (!YMD.test((r["approved on"] ?? "").trim())) return "approved, but Approved on isn't a date (YYYY-MM-DD)";
  if ((r["approved on"] ?? "").trim() > today) return "approval dated in the future";
  return null;
}
