// @ts-check
/**
 * The old pensions list: the visitor lists past employers (and any personal pensions they remember) and gets a tidy list
 * to trace them, with the government's free Pension Tracing Service and what to ask each scheme. Everything stays in
 * the browser; nothing is stored or sent, and nothing here searches for or promises to find a pension.
 * Checked 16 Nov 2026: https://www.gov.uk/find-pension-contact-details (the Pension Tracing Service, free).
 */
export const TRACING = "https://www.gov.uk/find-pension-contact-details";
export const CHECKED = "2026-11-16";

/** What to ask each scheme once it's found. */
export const ASK = [
  "Do you hold a pension for me? My National Insurance number and dates of employment are below.",
  "What is it worth today, and what would it be worth if I transferred it?",
  "Is there a guaranteed annuity rate, a protected tax-free cash amount or any other special feature?",
  "Are there exit charges or penalties for moving it?",
  "Who is down to receive it if I die?",
];

/** @typedef {{ employer: string, from: string, to: string, kind: "workplace" | "personal" }} Entry */

const YEAR = /^(19[5-9]\d|20\d\d)$/;

/** Cleans what the visitor typed; a row with no name is dropped, a year that isn't one becomes blank. @param {any[]} rows @returns {Entry[]} */
export function readEntries(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((r) => ({
      employer: String(r?.employer ?? "").trim().slice(0, 80),
      from: YEAR.test(String(r?.from ?? "").trim()) ? String(r.from).trim() : "",
      to: YEAR.test(String(r?.to ?? "").trim()) ? String(r.to).trim() : "",
      kind: /** @type {"workplace"|"personal"} */ (r?.kind === "personal" ? "personal" : "workplace"),
    }))
    .filter((r) => r.employer)
    .slice(0, 20);
}

/** The list as plain text, to copy into a note or an email to themselves. @param {Entry[]} entries @param {string} firm */
export function tracingText(entries, firm) {
  if (!entries.length) return "";
  const years = (/** @type {Entry} */ e) => (e.from || e.to ? ` (${e.from || "?"}–${e.to || "?"})` : "");
  return [
    "My old pensions to trace",
    "",
    ...entries.map((e, i) => `${i + 1}. ${e.employer}${years(e)}, ${e.kind === "personal" ? "personal pension" : "workplace pension"}`),
    "",
    `Find each scheme's contact details with the Pension Tracing Service (free): ${TRACING}`,
    "",
    "What to ask each one:",
    ...ASK.map((q) => `- ${q}`),
    "",
    `Prepared on ${firm}'s website. General information, not advice.`,
  ].join("\n");
}
