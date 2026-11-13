// @ts-check
/**
 * Seasonal modes: dated banners (and a tint the look can pick up) that switch
 * themselves on and off. A site lists its seasons with explicit dates in
 * site.json; the presets below only suggest those dates (npm run seasons).
 */

/** @typedef {"festive"|"winter"|"spring"|"summer"|"autumn"|"gold"} Tint */
/** @typedef {{ name: string, from: string, to: string, banner: string, link?: { label: string, href: string }, tint?: Tint }} Season */

export const TINTS = /** @type {const} */ (["festive", "winter", "spring", "summer", "autumn", "gold"]);
const MAX_DAYS = 120;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** @param {string} iso @param {number} days */
const addDays = (iso, days) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
/** @param {number} y @param {number} m 1–12 @param {number} d */
const ymd = (y, m, d) => new Date(Date.UTC(y, m - 1, d, 12)).toISOString().slice(0, 10);

/**
 * The season showing on a date: the one covering it that started most recently,
 * so a short event (Black Friday) wins over a long one (Christmas) it sits inside.
 * @param {Season[]} seasons @param {string} isoDate shop-local YYYY-MM-DD
 * @returns {number} index into seasons, or -1
 */
export function activeSeason(seasons, isoDate) {
  let best = -1;
  seasons.forEach((s, i) => {
    if (s.from <= isoDate && isoDate <= s.to && (best === -1 || s.from >= seasons[best].from)) best = i;
  });
  return best;
}

/** Easter Sunday (Gregorian, Meeus/Jones/Butcher). @param {number} y @returns {string} */
export function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return ymd(y, month, day);
}

/** nth weekday (0 = Sunday) of a month. @param {number} y @param {number} m @param {number} weekday @param {number} n */
function nthWeekday(y, m, weekday, n) {
  const first = new Date(Date.UTC(y, m - 1, 1, 12)).getUTCDay();
  return ymd(y, m, 1 + ((weekday - first + 7) % 7) + (n - 1) * 7);
}

/**
 * Dates that move with the moon. These follow the expected UK dates and can
 * shift by a day once the moon is sighted: always confirm with the client.
 * @type {Record<string, Record<number, [string, string]>>}
 */
const LUNAR = {
  ramadan: { 2026: ["2026-02-18", "2026-03-19"], 2027: ["2027-02-08", "2027-03-09"] },
  "eid-al-fitr": { 2026: ["2026-03-18", "2026-03-22"], 2027: ["2027-03-08", "2027-03-12"] },
  "eid-al-adha": { 2026: ["2026-05-24", "2026-05-29"], 2027: ["2027-05-14", "2027-05-19"] },
  diwali: { 2026: ["2026-11-04", "2026-11-09"], 2027: ["2027-10-25", "2027-10-30"] },
  "lunar-new-year": { 2026: ["2026-02-14", "2026-02-18"], 2027: ["2027-02-03", "2027-02-07"] },
};

/**
 * @typedef {{ id: string, name: string, tint: Tint, banner: string, dates: (y: number) => [string, string] | null, approximate?: boolean }} Preset
 */

/** @type {Preset[]} */
export const PRESETS = [
  { id: "new-year", name: "New year", tint: "winter", banner: "New year, new cut. Book your first appointment of the year.", dates: (y) => [ymd(y, 1, 1), ymd(y, 1, 14)] },
  { id: "lunar-new-year", name: "Lunar New Year", tint: "gold", banner: "Happy Lunar New Year. Book ahead for the celebrations.", dates: (y) => LUNAR["lunar-new-year"][y] ?? null, approximate: true },
  { id: "valentines", name: "Valentine's Day", tint: "festive", banner: "Valentine's weekend: book ahead, the best slots go first.", dates: (y) => [ymd(y, 2, 1), ymd(y, 2, 14)] },
  { id: "ramadan", name: "Ramadan", tint: "gold", banner: "Ramadan Mubarak. Late opening this month: see our hours.", dates: (y) => LUNAR.ramadan[y] ?? null, approximate: true },
  { id: "eid-al-fitr", name: "Eid al-Fitr", tint: "gold", banner: "Eid Mubarak. Book your Eid cut early, the week before Eid is our busiest.", dates: (y) => LUNAR["eid-al-fitr"][y] ?? null, approximate: true },
  { id: "mothers-day", name: "Mother's Day", tint: "spring", banner: "Mother's Day is coming: gift vouchers available in the shop.", dates: (y) => [addDays(easter(y), -35), addDays(easter(y), -21)] },
  { id: "easter", name: "Easter", tint: "spring", banner: "Easter holidays: kids' cuts all week. Book ahead.", dates: (y) => [addDays(easter(y), -7), addDays(easter(y), 1)] },
  { id: "eid-al-adha", name: "Eid al-Adha", tint: "gold", banner: "Eid Mubarak. Book early for Eid al-Adha.", dates: (y) => LUNAR["eid-al-adha"][y] ?? null, approximate: true },
  { id: "fathers-day", name: "Father's Day", tint: "summer", banner: "Father's Day: book a cut together, or treat him to a hot towel shave.", dates: (y) => [addDays(nthWeekday(y, 6, 0, 3), -10), nthWeekday(y, 6, 0, 3)] },
  { id: "summer", name: "Summer holidays", tint: "summer", banner: "Summer holidays: we're open all week. Book ahead for Saturdays.", dates: (y) => [ymd(y, 7, 20), ymd(y, 8, 14)] },
  { id: "back-to-school", name: "Back to school", tint: "autumn", banner: "Back to school: get the kids sorted before term starts.", dates: (y) => [ymd(y, 8, 15), ymd(y, 9, 7)] },
  { id: "half-term", name: "October half-term", tint: "autumn", banner: "Half-term: kids' cuts all week. Book ahead, it gets busy.", dates: (y) => [addDays(nthWeekday(y, 10, 1, 4), -7), addDays(nthWeekday(y, 10, 1, 4), 6)] },
  { id: "diwali", name: "Diwali", tint: "gold", banner: "Happy Diwali. Book early for the festival weekend.", dates: (y) => LUNAR.diwali[y] ?? null, approximate: true },
  { id: "black-friday", name: "Black Friday", tint: "winter", banner: "Black Friday weekend: gift vouchers available.", dates: (y) => { const bf = addDays(nthWeekday(y, 11, 4, 4), 1); return [addDays(bf, -4), addDays(bf, 3)]; } },
  { id: "christmas", name: "Christmas", tint: "festive", banner: "Christmas hours are on. Book early, December fills up fast.", dates: (y) => [ymd(y, 12, 1), ymd(y, 12, 31)] },
];

/**
 * Suggested seasons for a year, ready to paste into site.json.
 * @param {number} year @returns {(Season & { preset: string, approximate: boolean })[]}
 */
export function suggestSeasons(year) {
  return PRESETS.flatMap((p) => {
    const d = p.dates(year);
    return d ? [{ preset: p.id, name: p.name, from: d[0], to: d[1], banner: p.banner, tint: p.tint, approximate: Boolean(p.approximate) }] : [];
  });
}

/**
 * @param {any} seasons @param {(path: string, msg: string) => void} err
 * @param {(href: any) => boolean} safeHref
 */
export function checkSeasons(seasons, err, safeHref) {
  if (!Array.isArray(seasons)) { err("seasons", "a list of { name, from, to, banner }"); return; }
  seasons.forEach((s, i) => checkSeason(s, `seasons[${i}]`, err, safeHref));
}

/** @param {any} v */
const text = (v) => typeof v === "string" && v.trim().length > 0;

/** @param {any} s @param {string} p @param {(path: string, msg: string) => void} err @param {(href: any) => boolean} safeHref */
function checkSeason(s, p, err, safeHref) {
  if (!text(s?.name)) err(`${p}.name`, "required text is missing");
  if (!text(s?.banner) || s.banner.length > 140) err(`${p}.banner`, "one short sentence, up to 140 characters");
  if (s?.tint !== undefined && !TINTS.includes(s.tint)) err(`${p}.tint`, `one of ${TINTS.join(", ")}`);
  if (s?.link !== undefined && !(text(s.link?.label) && safeHref(s.link?.href))) err(`${p}.link`, "needs a label and an href (#anchor, /page or https://)");
  const problem = datesProblem(s?.from, s?.to);
  if (problem) err(p, problem);
}

/** @param {any} from @param {any} to @returns {string} empty when fine */
function datesProblem(from, to) {
  if (!ISO.test(from ?? "") || !ISO.test(to ?? "")) return "from and to as YYYY-MM-DD";
  if (to < from) return "ends before it starts";
  if (addDays(from, MAX_DAYS) < to) return `runs for more than ${MAX_DAYS} days; seasons are short`;
  return "";
}
