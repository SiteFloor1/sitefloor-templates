// @ts-check
/**
 * Gym kit logic, no DOM: lawful membership prices, the count in the club (usual and live), places left, this week's
 * classes, UK dates and the Hyrox race plan. Every figure is the club's own (site.json or its Google Sheet); nothing here
 * estimates a price, a count or a result.
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";
import { isTime, toMinutes, zonedNow, wallTimeToUtc, DAY_KEYS } from "../../../core/lib/hours.js";
import { isYmd, addDaysYmd, daysBetween, MONTHS } from "../../../core/lib/diary.js";

/* ------------------------------------------------------------------------------------------------------------------
 * Prices. The DMCC Act 2024 (CMA209, 18 Nov 2025): a headline price is the total the member must pay, every mandatory
 * fee in (joining, admin, induction). Never "£129 + £30 joining fee". A contract membership leads with the total over
 * its minimum term; a rolling one with the first month's total, at the same size as the monthly price after it.
 * ------------------------------------------------------------------------------------------------------------------ */

/** @typedef {{ name: string, amount: number }} Fee */
/** @typedef {{ monthly: number, minimumMonths: number, mandatoryFees: Fee[] }} Priced */
/** @typedef {{ kind: "term", total: number, months: number, monthly: number, fees: Fee[], feeTotal: number } | { kind: "rolling", first: number, monthly: number, fees: Fee[], feeTotal: number }} Total */

/** @param {number} n */
export const pounds = (n) => `£${n.toLocaleString("en-GB")}`;

/** The lawful total of a membership. @param {Priced} p @returns {Total} */
export function membershipTotal(p) {
  const feeTotal = p.mandatoryFees.reduce((s, f) => s + f.amount, 0);
  if (p.minimumMonths > 0) return { kind: "term", total: p.monthly * p.minimumMonths + feeTotal, months: p.minimumMonths, monthly: p.monthly, fees: p.mandatoryFees, feeTotal };
  return { kind: "rolling", first: p.monthly + feeTotal, monthly: p.monthly, fees: p.mandatoryFees, feeTotal };
}

/** "joining fee" / "joining fee and admin fee" / "joining, admin and induction fees" @param {Fee[]} fees */
export function feeWords(fees) {
  const n = fees.map((f) => f.name.toLowerCase().replace(/\s*fee$/, ""));
  if (n.length === 1) return `${n[0]} fee`;
  return `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]} fees`;
}

/**
 * The words a price is shown in. `headline` is the total (the big figure), `then` sits beside it at the same size
 * (rolling memberships), `fine` is the breakdown under it.
 * @param {Priced} p @returns {{ headline: string, then: string, fine: string }}
 */
export function priceWords(p) {
  const t = membershipTotal(p);
  const included = t.fees.length ? `, ${feeWords(t.fees)} included` : "";
  const parts = t.fees.map((f) => `${f.name.toLowerCase()} ${pounds(f.amount)}`);
  if (t.kind === "term") {
    return {
      headline: `${pounds(t.total)} for ${t.months} months${included}`,
      then: "",
      fine: [`${pounds(t.monthly)} a month for ${t.months} months`, ...parts].join(" · ") + (t.fees.length ? "" : " · no joining fee"),
    };
  }
  return {
    headline: `${pounds(t.first)} the first month${included}`,
    then: `then ${pounds(t.monthly)} a month`,
    fine: [`${pounds(t.monthly)} a month, no minimum term`, ...parts].join(" · ") + (t.fees.length ? "" : " · no joining fee"),
  };
}

/* ------------------------------------------------------------------------------------------------------------------
 * The count. "Usually": the club's own average for this hour of this weekday (busy.usual). Live: the door count from
 * the club's sheet, only while it is fresh (15 minutes at most); older, unreadable or impossible, and the page says
 * "usually" instead. Never an estimate.
 * ------------------------------------------------------------------------------------------------------------------ */

/** @typedef {{ capacity: number, usual: Record<string, (number|null)[]> }} Busy */
/** @typedef {{ ok: true, count: number, at: number } | { ok: false }} LiveCount */

/** The usual count at a weekday (0 = Sunday) and hour, or null when the club gave none (closed). @param {Busy} busy @param {number} weekday @param {number} hour */
export function usualAt(busy, weekday, hour) {
  const v = busy.usual[DAY_KEYS[weekday]]?.[hour];
  return typeof v === "number" ? v : null;
}

/**
 * How a count compares with the usual for that hour, in words. Within a fifth either way is "about as busy".
 * @param {number} count @param {number|null} usual @param {string} dayName e.g. "Monday"
 */
export function compareWords(count, usual, dayName) {
  if (usual === null || usual === 0) return "";
  const r = count / usual;
  if (r < 0.8) return `Quieter than a usual ${dayName}.`;
  if (r > 1.2) return `Busier than a usual ${dayName}.`;
  return `About as busy as a usual ${dayName}.`;
}

/**
 * The quietest stretch still to come today, in words ("Usually quiet after 8pm."), from the usual counts.
 * @param {Busy} busy @param {number} weekday @param {number} fromHour
 */
export function quietWords(busy, weekday, fromHour) {
  const row = busy.usual[DAY_KEYS[weekday]] ?? [];
  const open = row.map((v, h) => ({ v, h })).filter((x) => typeof x.v === "number");
  if (!open.length) return "";
  const peak = Math.max(...open.map((x) => /** @type {number} */ (x.v)));
  const later = open.filter((x) => x.h > fromHour && /** @type {number} */ (x.v) <= peak * 0.4);
  if (!later.length) return "";
  return `Usually quiet from ${hourWords(later[0].h)}.`;
}

/**
 * A day's usual counts for the open hours, with each hour's share of the day's busiest, and the day in words:
 * "Usually busiest 5pm to 8pm; quietest 10am to 4pm."
 * @param {Busy} busy @param {string} day "mon"…"sun"
 */
export function busyDay(busy, day) {
  const row = busy.usual[day] ?? [];
  const hours = row.map((v, h) => ({ h, v })).filter((x) => typeof x.v === "number").map((x) => /** @type {{ h: number, v: number }} */ (x));
  if (!hours.length) return { hours: [], words: "Closed." };
  const peak = Math.max(...hours.map((x) => x.v)) || 1;
  const out = hours.map((x) => ({ h: x.h, v: x.v, pct: Math.round((x.v / peak) * 100), label: hourWords(x.h) }));
  const run = (/** @type {(p: number) => boolean} */ test) => {
    let best = { from: -1, to: -1 }, cur = { from: -1, to: -1 };
    for (const x of out) {
      if (test(x.pct)) { cur = cur.from < 0 ? { from: x.h, to: x.h } : { from: cur.from, to: x.h }; if (cur.to - cur.from > best.to - best.from) best = cur; }
      else cur = { from: -1, to: -1 };
    }
    return best.from < 0 ? "" : `${hourWords(best.from)} to ${hourWords(best.to + 1)}`;
  };
  const busiest = run((p) => p >= 75), quietest = run((p) => p <= 35);
  const words = [busiest && `Usually busiest ${busiest}`, quietest && `quietest ${quietest}`].filter(Boolean).join("; ");
  return { hours: out, words: words ? `${words}.` : "" };
}

/** "6am", "noon", "8pm" @param {number} h */
export function hourWords(h) {
  if (h === 0) return "midnight";
  if (h === 12) return "noon";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

/** The ages of a count in words: "counted just now", "counted 2 minutes ago". @param {number} minutes */
export function agoWords(minutes) {
  if (minutes < 1) return "counted just now";
  return `counted ${minutes === 1 ? "a minute" : `${minutes} minutes`} ago`;
}

/**
 * The live count from the club's sheet: `updated_at,count`, the newest row wins. Fails closed: a sheet with other
 * columns filled, or a newest row that is in the future, older than `staleAfterMinutes`, or not a whole number from 0
 * to the club's capacity, gives { ok: false }. Rows whose time can't be read are skipped.
 * @param {string} csv @param {number} nowMs @param {string} tz @param {number} staleAfterMinutes @param {number} capacity
 * @returns {LiveCount}
 */
export function countFromCsv(csv, nowMs, tz, staleAfterMinutes, capacity) {
  const rows = parseCsv(csv);
  if (rows.length < 2) return { ok: false };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const iAt = head.indexOf("updated_at"), iN = head.indexOf("count");
  if (iAt < 0 || iN < 0 || extraFilled(rows, [iAt, iN])) return { ok: false };
  // The newest row wins, whatever it says; an older unreadable row doesn't matter, a newest one turns the count off.
  /** @type {{ raw: string, at: number }|null} */
  let best = null;
  for (const r of rows.slice(1)) {
    const at = parseSheetTime(r[iAt] ?? "", tz);
    if (Number.isNaN(at)) continue;
    if (!best || at >= best.at) best = { raw: (r[iN] ?? "").trim(), at };
  }
  if (!best || best.at > nowMs + 60_000 || nowMs - best.at > staleAfterMinutes * 60_000) return { ok: false };
  if (!/^\d{1,4}$/.test(best.raw) || Number(best.raw) > capacity) return { ok: false };
  return { ok: true, count: Number(best.raw), at: best.at };
}

/** True when any row has something written outside the expected columns. @param {string[][]} rows @param {number[]} cols */
export function extraFilled(rows, cols) {
  const keep = new Set(cols);
  return rows.slice(1).some((r) => r.some((v, j) => !keep.has(j) && String(v ?? "").trim() !== ""));
}

/* ------------------------------------------------------------------------------------------------------------------
 * Places left, from the club's sheet: `date,time,class,left,updated_at`, one row per class or recovery slot. Same rule
 * as the count: the newest row for a session wins, and shows only if it is fresh (15 minutes by default), readable and
 * within the class's size, for a session still to start; otherwise that session says nothing and keeps "Book in the app".
 * ------------------------------------------------------------------------------------------------------------------ */

/** @typedef {{ ok: true, left: Record<string, number> } | { ok: false }} Places */

/** @param {string} date @param {string} time @param {string} id */
export const sessionKey = (date, time, id) => `${date} ${time} ${id}`;

/**
 * @param {string} csv @param {number} nowMs @param {string} tz @param {number} staleAfterMinutes
 * @param {Record<string, number>} sizes the most places each class or slot id can have
 * @returns {Places}
 */
export function placesFromCsv(csv, nowMs, tz, staleAfterMinutes, sizes) {
  const rows = parseCsv(csv);
  if (!rows.length) return { ok: false };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const c = ["date", "time", "class", "left", "updated_at"].map((n) => head.indexOf(n));
  if (c.some((i) => i < 0) || extraFilled(rows, c)) return { ok: false };
  const now = zonedNow(new Date(nowMs), tz);
  // The newest row for each session wins, whatever it says: a later "full" or an impossible count must not leave an
  // older "4 left" showing. Rows whose session or time can't be read can't be placed, so they are skipped.
  /** @type {Record<string, { raw: string, id: string, at: number }>} */
  const newest = {};
  for (const r of rows.slice(1)) {
    const [date, time, id, raw] = c.slice(0, 4).map((i) => (r[i] ?? "").trim());
    const at = parseSheetTime(r[c[4]] ?? "", tz);
    if (!isYmd(date) || !isTime(time) || !id || Number.isNaN(at)) continue;
    const key = sessionKey(date, time, id);
    if (date < now.date || (date === now.date && toMinutes(time) <= now.minutes)) continue; // started or past
    if (!newest[key] || at >= newest[key].at) newest[key] = { raw, id, at };
  }
  const usable = Object.entries(newest).filter(([, row]) => placeRowShows(row, nowMs, staleAfterMinutes, sizes));
  return { ok: true, left: Object.fromEntries(usable.map(([key, row]) => [key, Number(row.raw)])) };
}

/**
 * A session's newest row shows only when it is fresh, not in the future, a whole number and within the class's size.
 * @param {{ raw: string, id: string, at: number }} row @param {number} nowMs @param {number} staleAfterMinutes @param {Record<string, number>} sizes
 */
function placeRowShows(row, nowMs, staleAfterMinutes, sizes) {
  if (row.at > nowMs + 60_000 || nowMs - row.at > staleAfterMinutes * 60_000) return false;
  return /^\d{1,3}$/.test(row.raw) && row.id in sizes && Number(row.raw) <= sizes[row.id];
}

/** "4 places left" / "1 place left" / "Full" @param {number} n */
export const placesWords = (n) => (n === 0 ? "Full" : `${n} ${n === 1 ? "place" : "places"} left`);

/* ------------------------------------------------------------------------------------------------------------------
 * This week's sessions from a weekly list ({ mon: [{ time, … }] }), skipping days the club is closed.
 * ------------------------------------------------------------------------------------------------------------------ */

/**
 * The next `days` days from `today`, each with its sessions in time order.
 * @template {{ time: string }} T
 * @param {Record<string, T[]>} weekly @param {{ weekly: Record<string, any[]>, exceptions?: { date: string, ranges: any[] }[] }} hours
 * @param {string} today YYYY-MM-DD @param {number} [days]
 * @returns {{ date: string, weekday: number, sessions: T[] }[]}
 */
export function weekOf(weekly, hours, today, days = 7) {
  return Array.from({ length: days }, (_, i) => {
    const date = addDaysYmd(today, i);
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    const closed = (hours.exceptions ?? []).some((e) => e.date === date && !e.ranges.length);
    const sessions = closed ? [] : [...(weekly[DAY_KEYS[weekday]] ?? [])].sort((a, b) => (a.time < b.time ? -1 : 1));
    return { date, weekday, sessions };
  });
}

/* ------------------------------------------------------------------------------------------------------------------
 * UK dates: typed as dd/mm/yyyy (never the browser's own format), shown as "Saturday 14 March 2027".
 * ------------------------------------------------------------------------------------------------------------------ */

/** "14/03/2027" (also 14-03-2027, 14.3.2027) → "2027-03-14", or "" when it isn't a real day. @param {string} text */
export function parseUkDate(text) {
  const m = /^\s*(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\s*$/.exec(text ?? "");
  if (!m) return "";
  const v = `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return isYmd(v) ? v : "";
}

/** "2027-03-14" → "14/03/2027" @param {string} ymd */
export const ukNumeric = (ymd) => `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}/${ymd.slice(0, 4)}`;

/** "14 Mar" @param {string} ymd */
export const shortDate = (ymd) => `${Number(ymd.slice(8, 10))} ${MONTHS[Number(ymd.slice(5, 7)) - 1].slice(0, 3)}`;

const NUMBER_WORDS = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty"];
/** "Seventeen" (up to twenty), else the figure. @param {number} n */
export const numberWords = (n) => NUMBER_WORDS[n] ?? String(n);

/* ------------------------------------------------------------------------------------------------------------------
 * The Hyrox race plan: whole weeks from the coming Monday to the race, shared between the club's phases (each a share of
 * the weeks before the taper), the taper last. Sessions are the club's own classes of each phase, from the timetable.
 * Nothing about results, weights or health.
 * ------------------------------------------------------------------------------------------------------------------ */

/** @typedef {{ name: string, share: number, text: string, classes: string[] }} Phase */
/** @typedef {{ name: string, text: string, classes: string[], from: string, to: string, weeks: number }} PlanPhase */

/**
 * @param {string} today @param {string} race @param {{ phases: Phase[], taper: { name: string, text: string, classes: string[], weeks: number }, minWeeks: number, maxWeeks: number }} cfg
 * @returns {{ ok: true, weeks: number, start: string, phases: PlanPhase[] } | { ok: false, reason: "past"|"short"|"long", weeks: number }}
 */
export function racePlan(today, race, cfg) {
  const days = daysBetween(today, race);
  if (days <= 0) return { ok: false, reason: "past", weeks: 0 };
  // Start on the next Monday (today, if it is one), so each week is a training week.
  const wd = new Date(`${today}T12:00:00Z`).getUTCDay();
  const start = addDaysYmd(today, (8 - wd) % 7);
  const weeks = Math.floor(daysBetween(start, race) / 7);
  if (weeks < cfg.minWeeks) return { ok: false, reason: "short", weeks: Math.max(0, weeks) };
  if (weeks > cfg.maxWeeks) return { ok: false, reason: "long", weeks };
  const before = weeks - cfg.taper.weeks;
  const total = cfg.phases.reduce((s, p) => s + p.share, 0);
  const counts = cfg.phases.map((p) => Math.max(1, Math.round((p.share / total) * before)));
  // Round so the phases fill exactly the weeks before the taper: the longest phase takes the difference.
  const diff = before - counts.reduce((s, n) => s + n, 0);
  counts[counts.indexOf(Math.max(...counts))] += diff;
  let at = start;
  /** @type {PlanPhase[]} */
  const phases = [];
  const all = [...cfg.phases.map((p, i) => ({ ...p, weeks: counts[i] })), { ...cfg.taper }];
  all.forEach((p, i) => {
    const to = addDaysYmd(at, 7 * p.weeks - 1);
    // The taper runs to the day before the race, whatever is left of the last week.
    phases.push({ name: p.name, text: p.text, classes: p.classes, from: at, to: i === all.length - 1 ? addDaysYmd(race, -1) : to, weeks: p.weeks });
    at = addDaysYmd(to, 1);
  });
  return { ok: true, weeks, start, phases };
}

/** The sample race the planner opens on: the Saturday about sixteen weeks from today. @param {string} today */
export function sampleRace(today) {
  return addDaysYmd(today, 16 * 7 + ((6 - new Date(`${today}T12:00:00Z`).getUTCDay() + 7) % 7));
}

/** The planner's opening plan, for the sample race. @param {any} cfg @param {string} today */
export function samplePlan(cfg, today) {
  const race = sampleRace(today);
  return { race, plan: racePlan(today, race, cfg) };
}

/**
 * The plan's sessions: each week of a phase, one session of each of the phase's classes, at the first time it runs that
 * week from 5pm (after work), or its first time that week; closed days left out. So a phase of three classes is three
 * sessions a week, all of them on the club's own timetable.
 * @param {PlanPhase[]} phases @param {Record<string, { time: string, class: string }[]>} weekly
 * @param {{ weekly: Record<string, any[]>, exceptions?: { date: string, ranges: any[] }[] }} hours
 * @param {{ date: string, minutes: number }} [now] sessions that have already started are left out
 * @returns {{ date: string, time: string, class: string, phase: string }[]}
 */
export function planSessions(phases, weekly, hours, now) {
  /** @type {{ date: string, time: string, class: string, phase: string }[]} */
  const out = [];
  for (const p of phases) {
    const n = daysBetween(p.from, p.to) + 1;
    for (let w = 0; w < n; w += 7) {
      const days = weekOf(weekly, hours, addDaysYmd(p.from, w), Math.min(7, n - w));
      for (const c of p.classes) {
        const all = days.flatMap((d) => d.sessions.filter((s) => s.class === c).map((s) => ({ date: d.date, time: s.time })))
          .filter((s) => !now || s.date > now.date || (s.date === now.date && toMinutes(s.time) > now.minutes));
        const pick = all.find((s) => s.time >= "17:00") ?? all[0];
        if (pick) out.push({ ...pick, class: c, phase: p.name });
      }
    }
  }
  return out.sort((a, b) => (a.date + a.time < b.date + b.time ? -1 : 1));
}

/** @param {string} s */
const icsText = (s) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
/** @param {number} ms */
const icsUtc = (ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/**
 * The plan as a calendar file: every session at the club's own time (UTC, so no time zone moves it) and race day.
 * @param {{ sessions: { date: string, time: string, class: string, phase: string }[], names: Record<string, { name: string, minutes: number }>, race: string, club: string, place: string, tz: string, stamp: string }} o
 */
export function planIcs(o) {
  const slug = o.club.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const ev = o.sessions.flatMap((s) => {
    const [y, m, d] = s.date.split("-").map(Number), [h, mi] = s.time.split(":").map(Number);
    const startMs = wallTimeToUtc({ year: y, month: m, day: d, hour: h, minute: mi }, o.tz);
    const c = o.names[s.class];
    return ["BEGIN:VEVENT", `UID:${s.date}-${s.time.replace(":", "")}-${s.class}@${slug}`, `DTSTAMP:${o.stamp}`, `DTSTART:${icsUtc(startMs)}`, `DTEND:${icsUtc(startMs + c.minutes * 60_000)}`,
      `SUMMARY:${icsText(`${c.name} · ${o.club}`)}`, `DESCRIPTION:${icsText(`${s.phase}. Book it in the club's app.`)}`, `LOCATION:${icsText(o.place)}`, "END:VEVENT"];
  });
  const raceDay = ["BEGIN:VEVENT", `UID:race-${o.race}@${slug}`, `DTSTAMP:${o.stamp}`, `DTSTART;VALUE=DATE:${o.race.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${addDaysYmd(o.race, 1).replace(/-/g, "")}`, "SUMMARY:Race day", "END:VEVENT"];
  return ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Sitefloor//${icsText(o.club)} race plan//EN`, "CALSCALE:GREGORIAN", ...ev, ...raceDay, "END:VCALENDAR"].join("\r\n") + "\r\n";
}
