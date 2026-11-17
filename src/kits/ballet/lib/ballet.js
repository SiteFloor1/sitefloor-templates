// @ts-check
/**
 * The ballet kit's logic, with no DOM: ages and classes, the words for days and times, the year's dates and their
 * calendar file, places left and the show-day sheet (both read from the school's published Google Sheet, failing
 * closed), catch-up classes and the classes a dancer usually moves through. Shared by the build (filters) and the
 * browser (feature scripts), and unit-tested in tests/unit/ballet.test.js.
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";
import { addDaysYmd, MONTHS } from "../../../core/lib/diary.js";

export const DAYS = /** @type {const} */ (["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
/** @type {Record<string, string>} */
export const DAY_NAMES = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };
/** What the year's dates are; the ring and the calendar name each one this way when the school writes no label of its own. */
export const KINDS = /** @type {const} */ (["term", "half-term", "holiday", "show", "exam", "other"]);

/**
 * @typedef {{ day: string, time: string }} Session
 * @typedef {{ id: string, name: string, ages: [number, number], level: number, minutes: number, sessions: Session[], text?: string }} BalletClass
 * @typedef {{ id: string, date: string, end?: string, label: string, kind: string }} YearItem
 */

/** "16:00" → "4.00pm"; "12:30" → "12.30pm"; "09:15" → "9.15am". @param {string} hhmm */
export function timeWords(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}.${String(m).padStart(2, "0")}${h < 12 ? "am" : "pm"}`;
}

/** 40 → "40 minutes"; 60 → "1 hour"; 75 → "1 hour 15"; 90 → "1 hour 30". @param {number} min */
export function lengthWords(min) {
  if (min < 60) return `${min} minutes`;
  const h = Math.floor(min / 60), r = min % 60;
  return `${h} hour${h > 1 ? "s" : ""}${r ? ` ${r}` : ""}`;
}

/** "Tuesday 4.00pm". @param {Session} s */
export const sessionWords = (s) => `${DAY_NAMES[s.day]} ${timeWords(s.time)}`;

/** A class's sessions, in the week's order: "Tuesdays 4.00pm or Saturdays 10.00am". @param {Session[]} sessions */
export function sessionsWords(sessions) {
  return weekOrder(sessions).map((s) => `${DAY_NAMES[s.day]}s ${timeWords(s.time)}`).join(" or ");
}

/** Sessions sorted Monday first, then by time. @template {Session} T @param {T[]} list @returns {T[]} */
export function weekOrder(list) {
  return [...list].sort((a, b) => DAYS.indexOf(/** @type {any} */ (a.day)) - DAYS.indexOf(/** @type {any} */ (b.day)) || a.time.localeCompare(b.time));
}

/** [3, 4] → "3–4"; [2, 2] → "2"; [15, 18] → "15–18". @param {[number, number]} ages */
export const ageLabel = (ages) => (ages[0] === ages[1] ? String(ages[0]) : `${ages[0]}–${ages[1]}`);

/** [3, 4] → "3 to 4"; [2, 2] → "2" (for a WhatsApp message, where a dash may not survive). @param {[number, number]} ages */
export const ageText = (ages) => (ages[0] === ages[1] ? String(ages[0]) : `${ages[0]} to ${ages[1]}`);

/**
 * The finder's age groups: every distinct age range the classes cover, youngest first, each with its classes.
 * @param {BalletClass[]} classes
 * @returns {{ label: string, ages: [number, number], classes: BalletClass[] }[]}
 */
export function ageGroups(classes) {
  /** @type {Map<string, { label: string, ages: [number, number], classes: BalletClass[] }>} */
  const groups = new Map();
  for (const c of classes) {
    const key = c.ages.join("-");
    if (!groups.has(key)) groups.set(key, { label: ageLabel(c.ages), ages: c.ages, classes: [] });
    groups.get(key)?.classes.push(c);
  }
  return [...groups.values()].sort((a, b) => a.ages[0] - b.ages[0] || a.ages[1] - b.ages[1]);
}

/**
 * The trial request, ready for WhatsApp. With a class: the age, the class and when; without one, a plain question.
 * @param {string} opening the school's own opening, e.g. "Hello Wrenna,"
 * @param {{ ages?: [number, number], name?: string, when?: string }} pick
 */
export function trialText(opening, pick) {
  if (!pick.name || !pick.ages) return `${opening} could my child come to a trial class?`;
  return `${opening} could my child (age ${ageText(pick.ages)}) try ${pick.name}${pick.when ? `, ${pick.when}` : ""}?`;
}

/** "2026-12-12" → "Saturday 12 December" (or "12 Dec" short). @param {string} ymd @param {"long"|"short"|"year"} [form] */
export function dateWords(ymd, form = "long") {
  const d = new Date(`${ymd}T12:00:00Z`);
  const month = MONTHS[d.getUTCMonth()];
  if (form === "short") return `${d.getUTCDate()} ${month.slice(0, 3)}`;
  const day = DAY_NAMES[DAYS[(d.getUTCDay() + 6) % 7]];
  return `${day} ${d.getUTCDate()} ${month}${form === "year" ? ` ${d.getUTCFullYear()}` : ""}`;
}

/**
 * Everything on the year's ring, in date order: the school's term dates, and its shows and exams when those features
 * are on. Items that have ended are left out.
 * @param {YearItem[]} year @param {{ id: string, date: string, name: string }[]} shows @param {{ id: string, date: string, label: string }[]} exams @param {string} today
 * @returns {YearItem[]}
 */
export function yearItems(year, shows, exams, today) {
  /** @type {YearItem[]} */
  const all = [
    ...year,
    ...shows.map((s) => ({ id: `show-${s.id}`, date: s.date, label: s.name, kind: "show" })),
    ...exams.map((e) => ({ id: `exam-${e.id}`, date: e.date, label: e.label, kind: "exam" })),
  ];
  return all.filter((x) => (x.end ?? x.date) >= today).sort((a, b) => a.date.localeCompare(b.date));
}

/** The next item on or after today, or null. @param {YearItem[]} items @param {string} today */
export const nextItem = (items, today) => items.find((x) => x.date >= today) ?? null;

/** @param {string} s */
const icsText = (s) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/**
 * One calendar file for the whole year: every item as an all-day event (a term or a holiday runs to its end date).
 * @param {{ items: YearItem[], school: string, place: string, stamp: string }} o stamp = UTC "YYYYMMDDTHHMMSSZ"
 */
export function yearIcs(o) {
  const slug = o.school.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Sitefloor//${icsText(o.school)} dates//EN`, "CALSCALE:GREGORIAN"];
  for (const x of o.items) {
    lines.push("BEGIN:VEVENT", `UID:${x.id}-${x.date}@${slug}`, `DTSTAMP:${o.stamp}`,
      `DTSTART;VALUE=DATE:${x.date.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${addDaysYmd(x.end ?? x.date, 1).replace(/-/g, "")}`,
      `SUMMARY:${icsText(`${x.label} · ${o.school}`)}`, `LOCATION:${icsText(o.place)}`, "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

/** "20261117T091500Z" for a calendar file's DTSTAMP. @param {number} ms */
export const icsStamp = (ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** A session's key in the places sheet. @param {string} classId @param {Session} s */
export const placeKey = (classId, s) => `${classId}|${s.day}|${s.time}`;

/**
 * @typedef {{ ok: false } | { ok: true, places: Record<string, number|"full">, updatedAt: number }} PlacesResult
 */

/**
 * The school's places sheet: class,day,time,places,updated_at (places a number, or "full"). Fails closed: a missing
 * column, a word it doesn't know or a newest update older than `staleAfterDays` returns { ok: false }.
 * @param {string} csv @param {number} now ms @param {number} staleAfterDays @param {string} timeZone
 * @returns {PlacesResult}
 */
export function placesFromCsv(csv, now, staleAfterDays, timeZone) {
  const rows = parseCsv(csv);
  const head = (rows.shift() ?? []).map((h) => h.trim().toLowerCase());
  if (["class", "day", "time", "places"].some((n) => !head.includes(n))) return { ok: false };
  /** @type {Record<string, number|"full">} */
  const places = {};
  let updatedAt = NaN;
  for (const r of rows) {
    const row = placesRow(head, r);
    if (row === "skip") continue;
    if (!row) return { ok: false };
    places[row.key] = row.value;
    const t = parseSheetTime(row.updated, timeZone);
    if (Number.isFinite(t) && !(t <= updatedAt)) updatedAt = t;
  }
  if (!Number.isFinite(updatedAt) || now - updatedAt > staleAfterDays * 86_400_000) return { ok: false };
  return { ok: true, places, updatedAt };
}

/**
 * One row of the places sheet: its key and value, "skip" for a blank row, or null for one it can't read.
 * @param {string[]} head @param {string[]} r
 * @returns {{ key: string, value: number|"full", updated: string } | "skip" | null}
 */
function placesRow(head, r) {
  const cell = (/** @type {string} */ n) => (head.includes(n) ? (r[head.indexOf(n)] ?? "").trim() : "");
  const cls = cell("class"), day = cell("day").toLowerCase().slice(0, 3), time = cell("time"), raw = cell("places").toLowerCase();
  if (!cls && !day) return "skip";
  if (!DAYS.includes(/** @type {any} */ (day)) || !/^\d{1,2}:\d{2}$/.test(time)) return null;
  const value = raw === "full" ? "full" : /^\d{1,2}$/.test(raw) ? Number(raw) : null;
  if (value === null) return null;
  return { key: `${cls}|${day}|${time.padStart(5, "0")}`, value: value === 0 ? "full" : value, updated: cell("updated_at") };
}

/** "Full", "1 place left", "3 places left"; null when the school hasn't said. @param {number|"full"|undefined} v */
export function placesWords(v) {
  if (v === undefined) return null;
  if (v === "full") return { state: "full", words: "Full: join the list" };
  return { state: v <= 2 ? "few" : "open", words: `${v} place${v === 1 ? "" : "s"} left` };
}

/**
 * Where else this week a missed class can be made up: the class's other sessions, then the classes at the same level.
 * @param {BalletClass[]} classes @param {string} classId @param {Session} missed
 * @returns {{ cls: BalletClass, session: Session }[]}
 */
export function catchUps(classes, classId, missed) {
  const own = classes.find((c) => c.id === classId);
  if (!own) return [];
  const out = [];
  for (const c of [own, ...classes.filter((c) => c.id !== own.id && c.level === own.level)]) {
    for (const s of weekOrder(c.sessions)) if (!(c.id === own.id && s.day === missed.day && s.time === missed.time)) out.push({ cls: c, session: s });
  }
  return out;
}

/**
 * The classes a dancer of `age` usually moves through, year by year, as runs of ages: [{ from, to, cls }]. Where two
 * classes take the same age (a boys' class beside the main one), the main line is the first class listed.
 * @param {BalletClass[]} classes @param {number} age
 */
export function pathFrom(classes, age) {
  const top = Math.max(...classes.map((c) => c.ages[1]));
  /** @type {{ from: number, to: number, cls: BalletClass }[]} */
  const runs = [];
  for (let a = age; a <= top; a++) {
    const cls = classes.find((c) => a >= c.ages[0] && a <= c.ages[1]);
    if (!cls) continue;
    const last = runs[runs.length - 1];
    if (last && last.cls.id === cls.id && last.to === a - 1) last.to = a;
    else runs.push({ from: a, to: a, cls });
  }
  return runs;
}

export const SHOW_DAY_COLUMNS = ["code", "class", "arrive", "door", "costume", "hair", "collect", "notes"];

/**
 * @typedef {{ code: string, class: string, arrive: string, door: string, costume: string, hair: string, collect: string, notes: string }} ShowDayRow
 * @typedef {{ ok: false } | { ok: true, rows: ShowDayRow[], updatedAt: number }} ShowDayResult
 */

/** A class code as typed: "lb tue" → "LB-TUE". @param {string} s */
export const normaliseCode = (s) => s.trim().toUpperCase().replace(/[\s_]+/g, "-").replace(/[^A-Z0-9-]/g, "");

/**
 * The show-day sheet: code,class,arrive,door,costume,hair,collect,notes,updated_at, one row per class. Fails closed:
 * a missing column or a newest update older than `staleAfterDays` returns { ok: false }.
 * @param {string} csv @param {number} now ms @param {number} staleAfterDays @param {string} timeZone
 * @returns {ShowDayResult}
 */
export function showDayFromCsv(csv, now, staleAfterDays, timeZone) {
  const rows = parseCsv(csv);
  const head = (rows.shift() ?? []).map((h) => h.trim().toLowerCase());
  if (["code", "class", "arrive", "collect"].some((n) => !head.includes(n))) return { ok: false };
  const cell = (/** @type {string[]} */ r, /** @type {string} */ n) => (head.includes(n) ? (r[head.indexOf(n)] ?? "").trim() : "");
  /** @type {ShowDayRow[]} */
  const out = [];
  let updatedAt = NaN;
  for (const r of rows) {
    const code = normaliseCode(cell(r, "code"));
    if (!code) continue;
    out.push(/** @type {ShowDayRow} */ (Object.fromEntries(SHOW_DAY_COLUMNS.map((n) => [n, n === "code" ? code : cell(r, n)]))));
    const t = parseSheetTime(cell(r, "updated_at"), timeZone);
    if (Number.isFinite(t) && !(t <= updatedAt)) updatedAt = t;
  }
  if (!out.length || !Number.isFinite(updatedAt) || now - updatedAt > staleAfterDays * 86_400_000) return { ok: false };
  return { ok: true, rows: out, updatedAt };
}

/** The row for a code, or null. @param {ShowDayResult} r @param {string} code */
export const showDayRow = (r, code) => (r.ok ? r.rows.find((x) => x.code === normaliseCode(code)) ?? null : null);
