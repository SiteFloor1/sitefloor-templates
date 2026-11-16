// @ts-check
/**
 * The trainer kit's logic, no DOM: the diary week (the trainer's open hours from their Google Sheet) and the first
 * month (first session, the sessions after it, what it costs, a calendar file). Every price, place and hour is the
 * trainer's own; nothing here invents a figure.
 *
 * The diary sheet, published as CSV, lists only the hours the trainer has open:
 *
 *   date,time,updated_at
 *   2026-11-16,06:00,2026-11-15 21:10
 *   2026-11-18,07:00,2026-11-15 21:10
 *
 * Fails closed: an unreadable sheet, an old one (older than `staleAfterHours`), or anything written in a column it
 * doesn't expect (a client's name, a phone number) returns { ok: false } and the page shows no open hours.
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";
import { isTime, toMinutes, wallTimeToUtc } from "../../../core/lib/hours.js";
import { addDaysYmd, isYmd } from "../../../core/lib/diary.js";
import { bankHolidays, regionFromPostcode } from "../../../core/lib/bank-holidays.js";

/** @typedef {{ date: string, time: string }} Hour an open hour: "YYYY-MM-DD", "HH:MM" */
/** @typedef {{ ok: true, open: Hour[], updatedAt: number } | { ok: false }} Diary */

export const WEEKDAYS = /** @type {const} */ (["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];

/** "Five", or the figure past twelve. @param {number} n */
export const countWord = (n) => WORDS[n] ?? String(n);

/** Monday = 0 … Sunday = 6, from a "YYYY-MM-DD". @param {string} ymd */
export function weekdayIndex(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

/**
 * The week the diary shows: this week's working days, or next week's once the trainer's last working day has gone.
 * @param {string} today "YYYY-MM-DD" in the trainer's time zone
 * @param {string[]} days the trainer's working days, e.g. ["mon", …, "sat"]
 * @returns {string} the Monday of the week shown
 */
export function weekStart(today, days) {
  const wd = weekdayIndex(today);
  const monday = addDaysYmd(today, -wd);
  const last = Math.max(...days.map((d) => WEEKDAYS.indexOf(/** @type {any} */ (d))));
  return wd > last ? addDaysYmd(monday, 7) : monday;
}

/** Whole hours from `from` to `to`, both included: "06:00" … "20:00". @param {string} from @param {string} to */
export function hoursOf(from, to) {
  const out = [];
  for (let m = toMinutes(from); m <= toMinutes(to); m += 60) out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  return out;
}

/**
 * The diary's page: each working day with its date and each hour, marked open (from the sheet), passed (gone today or
 * an earlier day) or neither (spoken for, shown quietly).
 * @param {{ days: string[], from: string, to: string }} cfg
 * @param {Hour[]} open @param {string} today @param {number} nowMinutes minutes past midnight, trainer's time
 */
export function diaryWeek(cfg, open, today, nowMinutes) {
  const monday = weekStart(today, cfg.days);
  const hours = hoursOf(cfg.from, cfg.to);
  const isOpen = new Set(open.map((h) => `${h.date} ${h.time}`));
  const days = cfg.days.map((key) => {
    const date = addDaysYmd(monday, WEEKDAYS.indexOf(/** @type {any} */ (key)));
    const cells = hours.map((time) => {
      const passed = date < today || (date === today && toMinutes(time) <= nowMinutes);
      return { time, passed, open: !passed && isOpen.has(`${date} ${time}`) };
    });
    return { key, date, gone: date < today, cells };
  });
  const free = days.flatMap((d) => d.cells.filter((c) => c.open).map((c) => ({ date: d.date, time: c.time })));
  return { monday, hours, days, open: free };
}

/**
 * Reads the trainer's published sheet. Rows for hours outside the diary (another week, before `from`, after `to`, a
 * day off, not on the hour) are ignored; a row with something written outside date, time and updated_at, or a sheet
 * older than `staleAfterHours`, refuses the whole sheet.
 * @param {string} csv @param {number} nowMs @param {string} tz @param {number} staleAfterHours
 * @returns {Diary}
 */
export function diaryFromCsv(csv, nowMs, tz, staleAfterHours) {
  const rows = parseCsv(csv);
  if (rows.length < 1) return { ok: false };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const at = { date: head.indexOf("date"), time: head.indexOf("time"), updated: head.indexOf("updated_at") };
  if (at.date < 0 || at.time < 0 || at.updated < 0) return { ok: false };
  const keep = new Set([at.date, at.time, at.updated]);
  if (rows.slice(1).some((r) => r.some((v, j) => !keep.has(j) && String(v ?? "").trim() !== ""))) return { ok: false };
  let updatedAt = 0;
  /** @type {Hour[]} */
  const open = [];
  const seen = new Set();
  for (const r of rows.slice(1)) {
    const stamp = parseSheetTime(String(r[at.updated] ?? ""), tz);
    if (Number.isFinite(stamp)) updatedAt = Math.max(updatedAt, stamp);
    const date = String(r[at.date] ?? "").trim(), time = String(r[at.time] ?? "").trim();
    if (!isYmd(date) || !isTime(time) || toMinutes(time) % 60 !== 0) continue;
    const key = `${date} ${time}`;
    if (!seen.has(key)) { seen.add(key); open.push({ date, time }); }
  }
  if (!updatedAt || updatedAt > nowMs + 5 * 60_000 || nowMs - updatedAt > staleAfterHours * 3_600_000) return { ok: false };
  open.sort((a, b) => (a.date + a.time < b.date + b.time ? -1 : 1));
  return { ok: true, open, updatedAt };
}

/**
 * The first month: the first session, then the sessions in the four weeks after it, on the same weekday pattern,
 * at the same time, and what it all costs from the trainer's own prices.
 * @param {{ date: string, time: string }} first
 * @param {number} perWeek 1, 2 or 3
 * @param {{ first: number, session: Record<string, number>, travel?: number }} prices session per sessions a week
 * @param {boolean} away true when the trainer comes to the client (travel added if the trainer charges it)
 */
export function firstMonth(first, perWeek, prices, away) {
  const pattern = weekPattern(weekdayIndex(first.date), perWeek);
  const dates = [];
  for (let i = 1; i < 28; i++) {
    const date = addDaysYmd(first.date, i);
    if (pattern.includes(weekdayIndex(date))) dates.push(date);
  }
  const travel = away ? prices.travel ?? 0 : 0;
  const firstPrice = prices.first + travel;
  const each = (prices.session[String(perWeek)] ?? 0) + travel;
  return { first: { ...first, price: firstPrice }, dates, each, total: firstPrice + each * dates.length, sessions: dates.length + 1 };
}

/** @param {string} s */
const icsText = (s) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** "20261116T060000Z" for a wall time in the trainer's zone. @param {string} date @param {string} time @param {string} tz */
export function utcStamp(date, time, tz) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(wallTimeToUtc({ year, month, day, hour, minute }, tz)).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Sessions as a calendar file: one timed event each, in UTC so no phone can shift them.
 * @param {{ sessions: { date: string, time: string, title: string }[], minutes: number, name: string, place: string, tz: string, stamp: string }} o
 */
export function sessionsIcs(o) {
  const slug = o.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const end = (/** @type {string} */ t) => { const m = toMinutes(t) + o.minutes; return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Sitefloor//${icsText(o.name)} sessions//EN`, "CALSCALE:GREGORIAN",
    ...o.sessions.flatMap((s) => [
      "BEGIN:VEVENT",
      `UID:${s.date}-${s.time.replace(":", "")}@${slug}`,
      `DTSTAMP:${o.stamp}`,
      `DTSTART:${utcStamp(s.date, s.time, o.tz)}`,
      `DTEND:${utcStamp(s.date, end(s.time), o.tz)}`,
      `SUMMARY:${icsText(s.title)}`,
      `LOCATION:${icsText(o.place)}`,
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ].join("\r\n") + "\r\n";
}

/**
 * The weekdays (Mon = 0) of n sessions a week, starting on weekday `wd` and spaced out (twice: three days apart;
 * three times: every other day). A Sunday moves to the Monday.
 * @param {number} wd @param {number} perWeek @returns {number[]}
 */
export function weekPattern(wd, perWeek) {
  const gaps = { 1: [0], 2: [0, 3], 3: [0, 2, 4] }[/** @type {1|2|3} */ (perWeek)] ?? [0];
  return [...new Set(gaps.map((g) => { const d = (wd + g) % 7; return d === 6 ? 0 : d; }))];
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/**
 * The goal finder's sample week: n sessions from Monday, spaced out, each with the programme's session focus in turn.
 * @param {number} perWeek @param {string[]} focuses @returns {{ day: string, focus: string }[]}
 */
export function sampleWeek(perWeek, focuses) {
  return weekPattern(0, perWeek).map((d, i) => ({ day: DAY_NAMES[d], focus: focuses.length ? focuses[i % focuses.length] : "" }));
}

/**
 * A UK postcode's district (the part before the space: "SW3" from "SW3 2QF"), from a full postcode or a district on
 * its own; null if it isn't one.
 * @param {string} postcode @returns {string|null}
 */
export function districtOf(postcode) {
  const s = String(postcode ?? "").toUpperCase().replace(/\s+/g, "");
  const full = s.match(/^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})$/);
  if (full) return full[1];
  return /^[A-Z]{1,2}\d[A-Z\d]?$/.test(s) ? s : null;
}

/**
 * Which of the trainer's travelling places reach a postcode: each area lists the districts it covers, in the trainer's
 * own list. Null for something that isn't a postcode.
 * @param {string} postcode @param {{ id: string, label: string, districts: string[] }[]} areas
 * @returns {{ district: string, areas: { id: string, label: string, covered: boolean }[] } | null}
 */
export function coverageFor(postcode, areas) {
  const district = districtOf(postcode);
  if (!district) return null;
  return { district, areas: areas.map((a) => ({ id: a.id, label: a.label, covered: a.districts.map((x) => x.toUpperCase()).includes(district) })) };
}

/**
 * Twelve weeks (or `weeks`) laid out from a first session: n sessions a week on the same weekdays at the same time.
 * Bank holidays (from the studio's postcode) and days the studio is closed are marked and not booked. Each week carries the phase the trainer names
 * for it. Nothing about outcomes: only dates.
 * @param {{ start: string, perWeek: number, weeks?: number, postcode: string, closed?: string[], phases: { from: number, to: number, name: string }[] }} o
 * @returns {{ weeks: { n: number, phase: string, sessions: { date: string, holiday: boolean }[] }[], booked: string[], holidays: string[], finish: string }}
 */
export function timeline(o) {
  const total = o.weeks ?? 12;
  const pattern = weekPattern(weekdayIndex(o.start), o.perWeek);
  const region = regionFromPostcode(o.postcode);
  const y = Number(o.start.slice(0, 4));
  const hols = new Set([...bankHolidays(y, region), ...bankHolidays(y + 1, region), ...(o.closed ?? [])]);
  /** @type {{ n: number, phase: string, sessions: { date: string, holiday: boolean }[] }[]} */
  const weeks = [];
  for (let w = 0; w < total; w++) {
    const phase = o.phases.find((p) => w + 1 >= p.from && w + 1 <= p.to)?.name ?? "";
    const sessions = [];
    for (let d = 0; d < 7; d++) {
      const date = addDaysYmd(o.start, w * 7 + d);
      if (pattern.includes(weekdayIndex(date))) sessions.push({ date, holiday: hols.has(date) });
    }
    weeks.push({ n: w + 1, phase, sessions });
  }
  const all = weeks.flatMap((w) => w.sessions);
  const booked = all.filter((x) => !x.holiday).map((x) => x.date);
  return { weeks, booked, holidays: all.filter((x) => x.holiday).map((x) => x.date), finish: booked[booked.length - 1] ?? o.start };
}

/**
 * A block of sessions on the price list: what each session works out at, and per person when two train together.
 * Whole pounds, rounded to the nearest pound (the trainer's own totals are never changed).
 * @param {{ sessions: number, price: number, duo?: number }} b
 * @returns {{ sessions: number, total: number, each: number, duoTotal: number|null, duoEach: number|null }}
 */
export function blockRow(b) {
  return {
    sessions: b.sessions, total: b.price, each: Math.round(b.price / b.sessions),
    duoTotal: b.duo ?? null, duoEach: b.duo ? Math.round(b.duo / b.sessions / 2) : null,
  };
}
