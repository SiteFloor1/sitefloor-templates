// @ts-check
/**
 * The garden kit's plain logic: months, the studio's "next start" line (hidden once it is out of date), the start-by
 * planner, the planting palette's filters and season words, the maintenance rota and every WhatsApp message. Every
 * figure (weeks, prices, visits) is the studio's own from site.json; nothing here invents one.
 */
import { MONTHS, daysBetween, ymdOf, addDaysYmd, ukDate, isYmd } from "../../../core/lib/diary.js";
import { gbp } from "../../../core/lib/text.js";

export { MONTHS };
export const MONTH_SHORT = MONTHS.map((m) => m.slice(0, 3));
/** How much light a plant wants, and the words for it. */
export const LIGHT = { sun: "Full sun", part: "Part shade", shade: "Shade" };
/** How much looking after a plant needs. */
export const CARE = { low: "Little care", some: "Some care", more: "Regular care" };

/** @param {string} ymd @returns {number} 1–12 */
export const monthOf = (ymd) => Number(ymd.slice(5, 7));

/**
 * The studio's "next start" line is shown only while it is fresh: a date it was last checked, and how many days it
 * stays true. Old or missing means hidden, never shown as current.
 * @param {string|undefined} updated YYYY-MM-DD @param {string} today @param {number} days
 */
export function isFresh(updated, today, days) {
  if (!updated || !isYmd(updated) || !isYmd(today)) return false;
  const age = daysBetween(updated, today);
  return age >= 0 && age <= days;
}

/**
 * Months as words, wrapping round the year: [5,6,7] → "May to July", [11,12,1,2] → "November to February",
 * [4, 9] → "April and September", all twelve → "All year".
 * @param {number[]} months 1–12
 */
export function monthsWords(months) {
  const set = [...new Set(months)].filter((m) => m >= 1 && m <= 12).sort((a, b) => a - b);
  if (!set.length) return "";
  if (set.length === 12) return "All year";
  // find runs of consecutive months, joining December to January
  /** @type {number[][]} */ const runs = [];
  for (const m of set) { const last = runs[runs.length - 1]; if (last && last[last.length - 1] === m - 1) last.push(m); else runs.push([m]); }
  if (runs.length > 1 && runs[0][0] === 1 && runs[runs.length - 1].at(-1) === 12) runs[0] = [...(/** @type {number[]} */ (runs.pop())), ...runs[0]];
  const words = runs.map((r) => (r.length === 1 ? MONTHS[r[0] - 1] : `${MONTHS[r[0] - 1]} to ${MONTHS[r[r.length - 1] - 1]}`));
  return words.length === 1 ? words[0] : `${words.slice(0, -1).join(", ")} and ${words.at(-1)}`;
}

/**
 * The planting palette, narrowed: plants of interest in a month (0 = any) and for a light (empty = any).
 * @template {{ months: number[], light: string[] }} P @param {P[]} items @param {{ month?: number, light?: string }} f
 */
export function paletteFor(items, f) {
  return items.filter((p) => (!f.month || p.months.includes(f.month)) && (!f.light || p.light.includes(f.light)));
}

/**
 * Start by: work back from the month the client wants the garden ready, through the studio's own weeks for design,
 * the wait before a build can start, and the build, to the day to get in touch. Too late is said plainly.
 * @param {{ year: number, month: number }} target @param {{ design: number, lead: number, build: number }} weeks
 * @param {string} today YYYY-MM-DD
 * @returns {{ talkBy: string, late: boolean, weeks: number }}
 */
export function startBy(target, weeks, today) {
  const total = weeks.design + weeks.lead + weeks.build;
  const talkBy = addDaysYmd(ymdOf(target.year, target.month, 1), -7 * total);
  return { talkBy, late: daysBetween(today, talkBy) < 0, weeks: total };
}

/** The months to offer as "ready by": from next month, a year and a half ahead. @param {string} today */
export function readyMonths(today) {
  let y = Number(today.slice(0, 4)), m = monthOf(today);
  /** @type {{ year: number, month: number, label: string }[]} */ const out = [];
  for (let i = 0; i < 18; i++) { m += 1; if (m > 12) { m = 1; y += 1; } out.push({ year: y, month: m, label: `${MONTHS[m - 1]} ${y}` }); }
  return out;
}

/** @param {string} opening @param {{ ready: string, talkBy: string, late: boolean }} o */
export function startByText(opening, o) {
  return [opening.trim(), "", `I'd like the garden ready by ${o.ready}.`, o.late ? "I know that's soon. Could you tell me what's possible?" : `Your planner says to get in touch by ${ukDate(o.talkBy)}.`].join("\n");
}

/** "£45 a visit", "£160 a month", or "" when the studio prices it after a visit. @param {number|null|undefined} price @param {string} per */
export function priceWords(price, per) {
  if (typeof price !== "number") return "";
  return `${gbp(price)} ${{ visit: "a visit", month: "a month", year: "a year" }[per] ?? ""}`.trim();
}

/**
 * A maintenance plan laid on the year: for each month whether a visit falls in it, and what the studio does that
 * month (its own task list).
 * @param {{ visits: number[] }} plan @param {string[][]} tasks twelve lists
 */
export function rota(plan, tasks) {
  return MONTHS.map((name, i) => ({ month: i + 1, name, visit: plan.visits.includes(i + 1), tasks: tasks[i] ?? [] }));
}

/** @param {string} opening @param {{ plan: string, size: string, postcode: string }} o */
export function planText(opening, o) {
  const lines = [opening.trim(), "", `I'm interested in the ${o.plan} plan.`];
  if (o.size) lines.push(`Garden: ${o.size}`);
  if (o.postcode) lines.push(`Postcode: ${o.postcode.toUpperCase().trim()}`);
  return lines.join("\n");
}

/** @param {string} opening @param {string[]} names */
export function samplesText(opening, names) {
  return names.length ? [opening.trim(), "", `Could I see samples of: ${names.join(", ")}?`].join("\n") : opening.trim();
}

/** The sun study's question for the studio. @param {string} opening @param {{ facing: string, size: string, spot: string }} o */
export function spotText(opening, o) {
  return [opening.trim(), "", `My garden faces ${o.facing} and is about ${o.size}.`, o.spot ? `I'd like to plant ${o.spot}.` : ""].filter((l, i) => i < 3 || l).join("\n");
}
