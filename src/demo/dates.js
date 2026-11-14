// @ts-check
/**
 * DEMO ONLY. Keeps a demo's dated sample data in the future: run on a demo's site.json before it is checked and built
 * (scripts/build.js), never on a client's, which keeps its real dates. The demo site is rebuilt and republished every
 * day (.github/workflows/demos.yml), so "the next three Fridays" are always the next three.
 *
 * Every dated field a demo carries is listed below, in one of three groups:
 *  - FORWARD: dates that must be ahead of today. Each rule moves its dates the same way:
 *      week      a set of one-off dates (events, trunk shows, workshops): moved together by whole weeks, so weekdays and
 *                the gaps between them stay, until the earliest is today or later. An item on a fixed calendar day
 *                (Christmas Eve, New Year's Eve, Valentine's Day…) or named after an occasion ("The first Christmas
 *                tea") moves by whole years instead, so it keeps its time of year.
 *      annual    a calendar day (a Christmas closure, a bank-holiday opening): moved by whole years until it's ahead.
 *      season    a dated window named after an occasion (a seasonal banner, an occasion, a pre-order window): moved to
 *                that occasion's next date (src/core/lib/seasons.js knows Easter-based and lunar dates), keeping its
 *                distance from the day itself; an occasion it doesn't know moves by whole years.
 *      recent    a "last updated" stamp that a page treats as stale after some days: moved by whole weeks into the last
 *                seven days.
 *      month     a "YYYY-MM" for "this month's" content: today's month.
 *  - PAST: dates that are rightly in the past (an article's date, when a fact was checked); never moved, never future.
 *  - IGNORED: strings that contain a date but aren't one (an id).
 * tests/unit/demo-dates.test.js fails if a demo carries a date in a field none of these lists names, so a new dated
 * field must be classed here first.
 */
import { PRESETS } from "../core/lib/seasons.js";

/**
 * A value is a date ("YYYY-MM-DD") or a date and time ("YYYY-MM-DDTHH:MM"): only the date part moves.
 * @typedef {{ kind: "week"|"annual"|"recent"|"month", paths: string[] }
 *   | { kind: "season", list: string, keys: string[], name: string, sameWeekday?: string }
 *   | { kind: "csv-week", path: string, columns: string[] }} Rule
 */

/** @type {Rule[]} */
export const FORWARD = [
  { kind: "annual", paths: ["hours.exceptions[].date", "delivery.closed[]", "visitInfo.parking[].closures.dates[]"] },
  { kind: "season", list: "seasons", keys: ["from", "to"], name: "name" },
  { kind: "season", list: "occasions.items", keys: ["from", "to"], name: "id" },
  { kind: "season", list: "tea.seasons", keys: ["from", "to"], name: "id" },
  // A pre-order's delivery day keeps its weekday (the shop delivers on set days), so the window moves to the nearest one.
  { kind: "season", list: "preorder.windows", keys: ["opens", "orderBy", "day"], name: "id", sameWeekday: "day" },
  { kind: "season", list: "takeovers", keys: ["from", "to", "orderBy", "collectBy"], name: "id" },
  { kind: "week", paths: ["events.items[].date"] },
  { kind: "week", paths: ["trunkShows.items[].from", "trunkShows.items[].to"] },
  { kind: "week", paths: ["workshops.items[].date"] },
  { kind: "week", paths: ["live.sessions[].date"] },
  { kind: "week", paths: ["evenings.sample[].date"] },
  { kind: "week", paths: ["retreats.items[].from", "retreats.items[].to", "retreats.items[].balanceDue"] },
  { kind: "week", paths: ["travels.items[].from", "travels.items[].to"] },
  { kind: "week", paths: ["weddings.taken[]"] },
  { kind: "week", paths: ["lightPlanner.date"] },
  { kind: "week", paths: ["vote.closes"] },
  { kind: "week", paths: ["drop.at", "drop.ends"] },
  { kind: "annual", paths: ["advent.orderBy", "advent.collectFrom"] },
  { kind: "csv-week", path: "events.sample", columns: ["Date"] },
  { kind: "recent", paths: ["calendar.nextStart.updated"] },
  { kind: "month", paths: ["edit.month"] },
];

/** Fields whose dates are rightly past: when something was written, checked, approved, imported or delivered. */
export const PAST = [
  "journal.items[].date", "journal.items[].sources[].checked", "insights.items[].date", "insights.items[].approvedOn",
  "insights.sample", "guides.items[].date", "guides.items[].reviewed", "events.items[].approvedOn", "films.items[].date",
  "menu.chartChecked", "desserts.chartChecked", "dressCode.checked", "planning.checked", "certificates.landlord.checked",
  "fleet.imported", "hire.driverForm.checkCode.checked", "retreats.items[].placesChecked", "passport.sample[][]",
  "drop.archive[].opens",
];

/** Strings that contain a date without being one. */
export const IGNORED = ["events.items[].id"];

/** Calendar days an event keeps whatever the year (its name usually says so). */
const FIXED_DAYS = new Set(["12-24", "12-25", "12-26", "12-31", "01-01", "02-14", "10-31", "11-05"]);
/** An event named after an occasion ("The first Christmas tea") keeps its time of year. */
const OCCASION = /christmas|new year|valentine|halloween|bonfire|easter|mother'?s day|father'?s day|diwali|eid|advent/i;
/** Names a demo uses for an occasion that seasons.js calls something else. */
const ALIAS = { valentine: "valentines", "valentine-s-day": "valentines", eid: "eid-al-fitr", "mother-s-day": "mothers-day", "father-s-day": "fathers-day" };

const DAY = 86400000;
const ms = (/** @type {string} */ d) => Date.parse(`${d}T00:00:00Z`);
const iso = (/** @type {number} */ t) => new Date(t).toISOString().slice(0, 10);
/** Moves the date part, keeping any time. @param {string} d @param {number} n */
const addDays = (d, n) => iso(ms(d.slice(0, 10)) + n * DAY) + d.slice(10);
const daysBetween = (/** @type {string} */ a, /** @type {string} */ b) => Math.round((ms(b.slice(0, 10)) - ms(a.slice(0, 10))) / DAY);
/** The same calendar day `n` years on (29 February becomes 28 February). @param {string} d @param {number} n */
const addYears = (d, n) => {
  const y = Number(d.slice(0, 4)) + n, md = d.slice(5, 10);
  return (md === "02-29" && !(y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)) ? `${y}-02-28` : `${y}-${md}`) + d.slice(10);
};
const isDate = (/** @type {unknown} */ v) => typeof v === "string" && /^\d{4}-\d\d-\d\d(T\d\d:\d\d)?$/.test(v);
/** Compare by date only. */
const day = (/** @type {string} */ d) => d.slice(0, 10);
const latest = (/** @type {string[]} */ ds) => ds.map(day).reduce((a, b) => (a > b ? a : b));
const slug = (/** @type {unknown} */ s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Each item of the array at h[k], as [array, index]. @param {[any, string|number]} slot @returns {[any, number][]} */
const items = ([h, k]) => (Array.isArray(h[k]) ? h[k].map((/** @type {unknown} */ _, /** @type {number} */ j) => /** @type {[any, number]} */ ([h[k], j])) : []);

/**
 * Every place a path names: [holder, key] pairs, so a value can be read and replaced. "a.b[].c" walks each item of
 * a.b; "a[]" each item of a; "a[][]" each item of each item. @param {any} root @param {string} path
 * @returns {[any, string|number][]}
 */
export function slots(root, path) {
  /** @type {[any, string|number][]} */
  let at = [[{ root }, "root"]];
  for (const part of path.split(".")) {
    const [key, ...arrays] = part.split("[]");
    /** @type {[any, string|number][]} */
    let next = [];
    for (const [h, k] of at) { const v = h?.[k]; if (v && typeof v === "object" && key in v) next.push([v, key]); }
    for (let i = 0; i < arrays.length; i++) next = next.flatMap(items);
    at = next;
  }
  return at;
}

/**
 * Whole weeks to add so a set's earliest date is today or later. A date set more than four weeks before the rest is a
 * deliberately past example (an event that already happened, to show it drops off the page): it moves with the set
 * but doesn't count as the earliest, so it stays in the past. @param {string[]} dates @param {string} today
 */
const weeksToCatchUp = (dates, today) => {
  const sorted = dates.map(day).sort();
  let i = 0;
  while (i < sorted.length - 1 && daysBetween(sorted[i], sorted[i + 1]) > 28) i++;
  return Math.max(0, Math.ceil(daysBetween(sorted[i], today) / 7));
};

/** The occasion a window is named after, if seasons.js knows it. @param {unknown} name */
function preset(name) {
  const s = slug(name);
  const id = /** @type {Record<string, string>} */ (ALIAS)[s] ?? s;
  return PRESETS.find((p) => p.id === id || slug(p.name) === id);
}

/**
 * A window's dates moved to the occasion's next date on or after today, keeping their distance from the occasion's
 * last day. @param {string[]} dates @param {unknown} name @param {string} today @returns {string[]}
 */
function nextOccasion(dates, name, today) {
  const last = latest(dates);
  if (last >= today) return dates;
  const p = preset(name);
  const year = Number(last.slice(0, 4));
  // The occurrence this window belongs to: the preset's end nearest the window's last date.
  const ends = p ? [year - 1, year, year + 1].map((y) => [y, p.dates(y)?.[1]]).filter(([, e]) => e) : [];
  if (p && ends.length) {
    const [y0, e0] = /** @type {[number, string]} */ (ends.sort((a, b) => Math.abs(daysBetween(String(a[1]), last)) - Math.abs(daysBetween(String(b[1]), last)))[0]);
    for (let y = y0 + 1; y <= y0 + 12; y++) {
      const e = p.dates(y)?.[1];
      if (!e) continue; // no dates on file for that year (lunar): try the next
      const moved = dates.map((d) => addDays(d, daysBetween(e0, e)));
      if (latest(moved) >= today) return moved;
    }
  }
  // An occasion seasons.js doesn't know, or none on file: the same calendar days in a later year.
  for (let n = 1; n <= 12; n++) { const moved = dates.map((d) => addYears(d, n)); if (latest(moved) >= today) return moved; }
  return dates;
}

/**
 * A copy of a demo's site.json with its forward-looking dates moved ahead of `today` (YYYY-MM-DD).
 * A client's site.json is returned unchanged. @param {any} site @param {string} today @returns {any}
 */
export function rollDemoDates(site, today) {
  if (site?.mode !== "demo") return site;
  const out = structuredClone(site);
  for (const rule of FORWARD) {
    if (rule.kind === "season") {
      const items = slots(out, rule.list).flatMap(([h, k]) => (Array.isArray(h[k]) ? h[k] : []));
      for (const item of items) rollWindow(item, rule, today);
    } else if (rule.kind === "csv-week") {
      for (const [h, k] of slots(out, rule.path)) if (typeof h[k] === "string") h[k] = rollCsv(h[k], rule.columns, today);
    } else {
      const found = rule.paths.flatMap((p) => slots(out, p)).filter(([h, k]) => isDate(h[k]) || (rule.kind === "month" && /^\d{4}-\d\d$/.test(h[k])));
      ROLL[rule.kind](found, today);
    }
  }
  return out;
}

/** The next calendar day on or after today with the same month and day. @param {string} d @param {string} today */
const nextYearly = (d, today) => { let n = 0; while (day(addYears(d, n)) < today && n < 12) n++; return addYears(d, n); };

/** @type {Record<"week"|"annual"|"recent"|"month", (found: [any, string|number][], today: string) => void>} */
const ROLL = {
  month: (found, today) => { for (const [h, k] of found) h[k] = today.slice(0, 7); },
  annual: (found, today) => { for (const [h, k] of found) h[k] = nextYearly(h[k], today); },
  recent: (found, today) => { for (const [h, k] of found) h[k] = addDays(h[k], 7 * Math.max(0, Math.floor(daysBetween(h[k], today) / 7))); },
  // Items on a fixed calendar day or named after an occasion keep their day (by years); the rest move together by weeks.
  week: (found, today) => {
    const fixed = found.filter(([h, k]) => FIXED_DAYS.has(h[k].slice(5, 10)) || OCCASION.test(`${h.title ?? ""} ${h.name ?? ""}`));
    for (const [h, k] of fixed) h[k] = nextYearly(h[k], today);
    const loose = found.filter((s) => !fixed.includes(s));
    if (!loose.length) return;
    const w = weeksToCatchUp(loose.map(([h, k]) => h[k]), today);
    for (const [h, k] of loose) h[k] = addDays(h[k], 7 * w);
  },
};

/**
 * A dated window (a season, an occasion, a pre-order) moved to its occasion's next date.
 * @param {any} item @param {Extract<Rule, { kind: "season" }>} rule @param {string} today
 */
function rollWindow(item, rule, today) {
  const keys = rule.keys.filter((key) => isDate(item?.[key]));
  if (!keys.length) return;
  let moved = nextOccasion(keys.map((key) => item[key]), item[rule.name] ?? item.id ?? item.name, today);
  const anchor = rule.sameWeekday ? keys.indexOf(rule.sameWeekday) : -1;
  if (rule.sameWeekday && anchor >= 0) {
    // The nearest earlier day (or the same) on the original weekday: a delivery is never moved past the occasion.
    const want = new Date(ms(day(item[rule.sameWeekday]))).getUTCDay();
    const by = [0, -1, -2, -3, -4, -5, -6].find((n) => new Date(ms(day(addDays(moved[anchor], n)))).getUTCDay() === want) ?? 0;
    moved = moved.map((d) => addDays(d, by));
  }
  keys.forEach((key, i) => { item[key] = moved[i]; });
}

/** A sample sheet (CSV text) with the named date columns moved together by whole weeks. @param {string} csv @param {string[]} columns @param {string} today */
function rollCsv(csv, columns, today) {
  const lines = csv.split("\n");
  const head = lines[0].split(",").map((c) => c.trim());
  const at = columns.map((c) => head.indexOf(c)).filter((i) => i >= 0);
  // Only columns before the first quoted cell are read by position; the sample's date columns come first.
  const cells = lines.slice(1).map((l) => l.split(","));
  const dates = cells.flatMap((c) => at.map((i) => c[i]).filter(isDate));
  if (!dates.length) return csv;
  const w = weeksToCatchUp(dates, today);
  return [lines[0], ...cells.map((c) => c.map((v, i) => (at.includes(i) && isDate(v) ? addDays(v, 7 * w) : v)).join(","))].join("\n");
}
