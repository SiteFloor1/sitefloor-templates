// @ts-check
/**
 * The fragrance kit's logic, with no DOM: the notes as one sentence, prices and sizes, the organ's matches, launch
 * dates and engraving. Everything here works from the house's own entries in site.json; nothing is guessed.
 */

/** "£95", "£4.50". @param {number} n */
export function pounds(n) {
  return Number.isInteger(n) ? `£${n.toLocaleString("en-GB")}` : `£${n.toFixed(2)}`;
}

/** "a", "a and b", "a, b and c". @param {string[]} list */
export function joinAnd(list) {
  if (list.length <= 1) return list.join("");
  return `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
}

/**
 * The house's notes as one sentence in three clauses, top to base, each to be set at its height on the bottle:
 * "It opens on bergamot and sea salt," / "settles into iris and ambrette," / "and dries down to cedarwood and white musk."
 * A missing tier drops its clause and the sentence still reads; no notes at all gives no sentence.
 * @param {{ top?: string[], heart?: string[], base?: string[] }} notes
 * @returns {{ tier: "top"|"heart"|"base", lead: string, notes: string[], end: string }[]}
 */
export function notesClauses(notes) {
  const tiers = /** @type {const} */ (["top", "heart", "base"]).filter((t) => (notes?.[t] ?? []).length);
  const leads = { top: ["It opens on"], heart: ["It settles into", "settles into"], base: ["It dries down to", "dries down to", "and dries down to"] };
  return tiers.map((tier, i) => {
    const first = i === 0, last = i === tiers.length - 1;
    let lead;
    if (tier === "top") lead = leads.top[0];
    else if (tier === "heart") lead = first ? leads.heart[0] : leads.heart[1];
    else lead = first ? leads.base[0] : (tiers.length > 1 ? leads.base[2] : leads.base[1]);
    return { tier, lead, notes: /** @type {string[]} */ (notes[tier]), end: last ? "." : "," };
  });
}

/** The whole sentence as plain text (for the page's description and tests). @param {any} notes */
export function notesSentence(notes) {
  return notesClauses(notes).map((c) => `${c.lead} ${joinAnd(c.notes)}${c.end}`).join(" ");
}

/** Every note of a fragrance, top to base. @param {any} f @returns {string[]} */
export const allNotes = (f) => [...(f.notes?.top ?? []), ...(f.notes?.heart ?? []), ...(f.notes?.base ?? [])];

/** Notes compare without case or extra spaces ("White musk" is "white musk"). @param {string} s */
export const noteKey = (s) => s.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * The other fragrances in the house that list a note, in the house's order.
 * @param {any[]} items @param {string} note @param {string} [except] a fragrance id to leave out
 */
export function alsoIn(items, note, except) {
  const k = noteKey(note);
  return items.filter((f) => f.id !== except && allNotes(f).some((n) => noteKey(n) === k));
}

/** The line shown when a note is tapped: "Iris is also in No. 2 Poudre and No. 7 Pluie." @param {any[]} items @param {string} note @param {string} except */
export function alsoInLine(items, note, except) {
  const others = alsoIn(items, note, except).map((f) => f.name);
  const n = note.charAt(0).toUpperCase() + note.slice(1);
  return others.length ? `${n} is also in ${joinAnd(others)}.` : `${n} is only in this one.`;
}

/**
 * The price for every 10 ml, from the house's own price and size, rounded to the penny ("£19.00").
 * @param {number} price @param {number} ml
 */
export function per10ml(price, ml) {
  return `£${((price / ml) * 10).toFixed(2)}`;
}

/**
 * How tall to draw each size beside the largest, to scale by volume: a bottle of the same shape grows with the cube
 * root of what it holds, so 100 ml is about 1.26 times as tall as 50 ml, not twice.
 * @param {number} ml @param {number} maxMl @returns {number} 0–1
 */
export function sizeScale(ml, maxMl) {
  return Math.round(Math.cbrt(ml / maxMl) * 1000) / 1000;
}

/**
 * The organ: the fragrances that have any of the chosen notes, those with the most of them first (the house's
 * order otherwise). A fragrance with none of them is left out.
 * @param {any[]} items @param {string[]} picked @returns {{ item: any, matched: string[] }[]}
 */
export function organMatches(items, picked) {
  const keys = picked.map(noteKey);
  return items
    .map((item, i) => ({ item, i, matched: allNotes(item).filter((n) => keys.includes(noteKey(n))) }))
    .filter((m) => m.matched.length)
    .sort((a, b) => b.matched.length - a.matched.length || a.i - b.i)
    .map(({ item, matched }) => ({ item, matched }));
}

/** Days between two UK calendar days ("YYYY-MM-DD"). @param {string} from @param {string} to */
export function daysBetween(from, to) {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);
}

/**
 * Launch mode: before the house's date the site takes waiting-list names and pre-orders; from the date it is the
 * normal shop, and the launch scents are marked new for the house's number of weeks.
 * @param {{ date: string, newWeeks?: number }} launch @param {string} today YYYY-MM-DD
 * @returns {{ state: "before"|"open", daysTo: number, isNew: boolean }}
 */
export function launchState(launch, today) {
  const d = daysBetween(today, launch.date);
  return { state: d > 0 ? "before" : "open", daysTo: Math.max(d, 0), isNew: d <= 0 && -d < (launch.newWeeks ?? 0) * 7 };
}

/** "1 March" from "2027-03-01". @param {string} ymd */
export function dayMonth(ymd) {
  return new Date(`${ymd}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
}

/** Initials for engraving: "Ottilie · 1 May" → "O." ; "Ada Lovelace" → "A.L.". @param {string} words @param {number} [max] */
export function initials(words, max = 3) {
  const w = words.split(/[\s·,.\-/]+/).filter((x) => /^\p{L}/u.test(x)).slice(0, max);
  return w.length ? `${w.map((x) => x[0].toUpperCase()).join(".")}.` : "";
}

/**
 * The words as they will be engraved in the house's style, cut to the house's letter limit (counting every character
 * the engraver cuts, spaces included).
 * @param {string} words @param {"caps"|"lower"|"initials"} style @param {number} max
 */
export function engraved(words, style, max) {
  const w = words.slice(0, max);
  if (style === "initials") return initials(w);
  if (style === "caps") return w.toUpperCase();
  return w;
}

/** A message in the house's words with its {placeholders} filled; unknown ones are left as they are. @param {string} t @param {Record<string, string|number>} v */
export function fill(t, v) {
  return t.replace(/\{(\w+)\}/g, (m, k) => (v[k] === undefined ? m : String(v[k])));
}
