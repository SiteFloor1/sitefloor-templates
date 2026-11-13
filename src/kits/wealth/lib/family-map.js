// @ts-check
/**
 * The family map: who is who before a first meeting (family by generation, and the people already advising them). It
 * lives only in the visitor's browser; nothing is sent. Pure helpers for the page script and its tests.
 */

/** Generations, oldest first. */
export const GENERATIONS = ["Grandparents", "Parents", "Children", "Grandchildren"];

/** Advisers a family usually already has. */
export const ADVISERS = ["Solicitor", "Accountant", "Trustee", "Executor", "Another adviser"];

/** @typedef {{ id: string, name: string, gen: number, note: string }} Person */
/** @typedef {{ id: string, role: string, name: string }} Adviser */
/** @typedef {{ v: 1, people: Person[], advisers: Adviser[] }} FamilyMap */

/** @returns {FamilyMap} */
export const emptyMap = () => ({ v: 1, people: [], advisers: [] });

const clip = (/** @type {unknown} */ s, n = 60) => (typeof s === "string" ? s.replace(/\s+/g, " ").trim().slice(0, n) : "");

/** Whatever was stored, read safely: unknown shapes become an empty map. @param {unknown} raw @returns {FamilyMap} */
export function readMap(raw) {
  /** @type {any} */ let m;
  try { m = typeof raw === "string" ? JSON.parse(raw) : raw; } catch { return emptyMap(); }
  if (!m || m.v !== 1 || !Array.isArray(m.people) || !Array.isArray(m.advisers)) return emptyMap();
  return {
    v: 1,
    people: m.people.slice(0, 40).map((/** @type {any} */ p, /** @type {number} */ i) => ({ id: clip(p?.id, 20) || `p${i}`, name: clip(p?.name), gen: Math.max(0, Math.min(GENERATIONS.length - 1, Number(p?.gen) | 0)), note: clip(p?.note, 80) })).filter((/** @type {Person} */ p) => p.name),
    advisers: m.advisers.slice(0, 12).map((/** @type {any} */ a, /** @type {number} */ i) => ({ id: clip(a?.id, 20) || `a${i}`, role: ADVISERS.includes(a?.role) ? a.role : ADVISERS[ADVISERS.length - 1], name: clip(a?.name) })).filter((/** @type {Adviser} */ a) => a.name),
  };
}

/** The map by generation, oldest first, for drawing. @param {FamilyMap} m */
export const byGeneration = (m) => GENERATIONS.map((label, gen) => ({ label, gen, people: m.people.filter((p) => p.gen === gen) }));

/** The map as plain text, to copy into an email to themselves or to print. @param {FamilyMap} m @param {string} firm */
export function mapText(m, firm) {
  const out = [`Our family, for a first meeting with ${firm}`, ""];
  for (const g of byGeneration(m)) if (g.people.length) out.push(`${g.label}: ${g.people.map((p) => (p.note ? `${p.name} (${p.note})` : p.name)).join(", ")}`);
  if (m.advisers.length) out.push("", "Advisers we already have:", ...m.advisers.map((a) => `${a.role}: ${a.name}`));
  return out.join("\n");
}
