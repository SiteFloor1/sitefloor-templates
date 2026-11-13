// @ts-check
/**
 * Customer questions: the site's own list, plus one written from the team
 * page's filters ("who's best for Afro hair?") so that answer always matches
 * the staff list.
 */

import { checkArrival } from "./arrival.js";

/** @typedef {{ topic: string, q: string, a: string, home?: boolean }} Question */

const HOME_MAX = 6;

/** "Kofi", "Kofi and Ash", "Kofi, Ash and Rio" @param {string[]} names */
export function listJoin(names) {
  return names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/**
 * @param {any} site
 * @returns {Question|null}
 */
export function teamQuestion(site) {
  const filters = site.team?.filters ?? [];
  if (!site.features?.includes("team") || !filters.length) return null;
  const lines = filters.flatMap((/** @type {{ tag: string, label: string }} */ f) => {
    const names = (site.staff ?? []).filter((/** @type {any} */ s) => (s.tags ?? []).includes(f.tag)).map((/** @type {any} */ s) => s.name);
    return names.length ? [`${f.label}: ${listJoin(names)}.`] : [];
  });
  if (!lines.length) return null;
  return { topic: site.team.filtersTopic ?? "Choosing who to book", q: site.team.filtersQuestion ?? "Who should I book?", a: lines.join(" "), home: true };
}

/** @param {any} site @returns {Question[]} */
export function allQuestions(site) {
  const team = teamQuestion(site);
  return [...(team ? [team] : []), ...(site.questions ?? [])];
}

/** Up to six for the home page: those marked home, or the first six. @param {any} site */
export function homeQuestions(site) {
  const all = allQuestions(site);
  const marked = all.filter((q) => q.home);
  return (marked.length ? marked : all).slice(0, HOME_MAX);
}

/** Questions grouped by topic, in the order topics first appear. @param {any} site */
export function questionTopics(site) {
  /** @type {Map<string, Question[]>} */
  const groups = new Map();
  for (const q of allQuestions(site)) groups.set(q.topic, [...(groups.get(q.topic) ?? []), q]);
  return [...groups].map(([topic, items]) => ({ topic, items }));
}

/**
 * @param {any} site @param {(path: string, msg: string) => void} err
 */
export function checkQuestions(site, err) {
  if (site.questions !== undefined) checkQuestionList(site.questions, err);
  if (site.visitInfo !== undefined) checkVisitInfo(site.visitInfo, err, site.mode === "client");
  if (site.pricesPage !== undefined && !text(site.pricesPage?.title)) err("pricesPage.title", "heading for the prices page is missing");
  for (const [i, f] of (site.team?.filters ?? []).entries()) {
    if (!/^[a-z0-9-]+$/.test(f?.tag ?? "")) err(`team.filters[${i}].tag`, "lowercase letters, numbers and dashes");
    if (!text(f?.label)) err(`team.filters[${i}].label`, "required text is missing");
  }
}

/** @param {any} v */
const text = (v) => typeof v === "string" && v.trim().length > 0;

/** @param {any} list @param {(path: string, msg: string) => void} err */
function checkQuestionList(list, err) {
  if (!Array.isArray(list)) { err("questions", "a list of { topic, q, a, home? }"); return; }
  list.forEach((/** @type {any} */ q, /** @type {number} */ i) => {
    for (const k of ["topic", "q", "a"]) if (!text(q?.[k])) err(`questions[${i}].${k}`, "required text is missing");
    if (text(q?.q) && !q.q.trim().endsWith("?")) err(`questions[${i}].q`, "write it as the customer would ask it, ending with ?");
  });
}

/** @param {any} v @param {(path: string, msg: string) => void} err @param {boolean} isClient */
function checkVisitInfo(v, err, isClient) {
  if (!text(v?.title)) err("visitInfo.title", "heading for the Plan your visit page is missing");
  const has = (/** @type {string} */ k) => Array.isArray(v?.[k]) && v[k].length > 0;
  if (!has("journeys") && !has("parking") && !has("access") && !text(v?.payment)) err("visitInfo", "give at least one of journeys, parking, access, payment");
  for (const k of ["journeys", "parking", "access"]) if (v?.[k] !== undefined && !Array.isArray(v[k])) err(`visitInfo.${k}`, "a list");
  checkArrival(v, err, isClient);
}
