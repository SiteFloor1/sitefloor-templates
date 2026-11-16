// @ts-check
/**
 * The bridal hair and makeup artist's logic, with no DOM: the date check (the artist's own Google Sheet, read as CSV),
 * the wedding morning worked back from the ceremony, the party quote, travel by postcode district, the trial window,
 * the skin prep dates, calendar files and every WhatsApp message. Days are YYYY-MM-DD handled in UTC so a clock change
 * never moves a date; times on the morning are minutes after midnight, local to the wedding.
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";
import { addDaysYmd, daysBetween, isYmd, ukDate, ymdOf } from "../../../core/lib/diary.js";

export { addDaysYmd, daysBetween, isYmd, ukDate, ymdOf };

/** @typedef {{ ok: true, days: Record<string, "held"|"taken">, updatedAt: number } | { ok: false }} DatesResult */

const STATUS = /** @type {Record<string, "open"|"held"|"taken">} */ ({ open: "open", free: "open", held: "held", hold: "held", "on hold": "held", pencilled: "held", taken: "taken", booked: "taken", full: "taken" });

/**
 * The artist's diary from a published Google Sheet (CSV), a row per date that isn't simply open:
 *
 *   date,status,updated_at
 *   2027-06-12,taken,2026-11-02 09:12
 *   2027-06-19,held,
 *
 * `status` is open, held (another bride has it until her booking fee is in) or taken; any date not listed is open. The
 * newest `updated_at` says when the sheet was last looked after. Fails closed: an unreadable sheet, a missing column, an
 * unknown word, a bad date or an update older than `staleAfterDays` returns { ok: false }.
 * @param {string} csv @param {number} nowMs @param {number} staleAfterDays @param {string} timeZone @returns {DatesResult}
 */
export function datesFromCsv(csv, nowMs, staleAfterDays, timeZone) {
  const rows = parseCsv(csv);
  const head = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
  const di = head.indexOf("date"), si = head.indexOf("status"), ui = head.indexOf("updated_at");
  if (di < 0 || si < 0 || ui < 0) return { ok: false };
  /** @type {Record<string, "held"|"taken">} */
  const days = {};
  let updatedAt = NaN;
  for (const row of rows.slice(1)) {
    const at = (row[ui] ?? "").trim();
    if (at) {
      const t = parseSheetTime(at, timeZone);
      if (!Number.isFinite(t)) return { ok: false };
      if (!(t <= updatedAt)) updatedAt = t;
    }
    const date = (row[di] ?? "").trim();
    if (!date) continue;
    if (!isYmd(date)) return { ok: false };
    const s = STATUS[(row[si] ?? "").trim().toLowerCase()];
    if (!s) return { ok: false };
    if (s !== "open") days[date] = s;
  }
  if (!Number.isFinite(updatedAt) || updatedAt > nowMs + 5 * 60_000 || nowMs - updatedAt > staleAfterDays * 86_400_000) return { ok: false };
  return { ok: true, days, updatedAt };
}

/**
 * What the cover says about one day: a word for the cover line and a sentence under it. Never "booked": the artist
 * confirms by message. A diary that can't be read says so and asks the bride to message.
 * @param {string} ymd @param {string} today @param {DatesResult|null} r null while the diary loads
 * @returns {{ state: "past"|"open"|"held"|"taken"|"unknown"|"loading", word: string, words: string }}
 */
export function dayAnswer(ymd, today, r) {
  if (ymd < today) return { state: "past", word: "Gone.", words: "That day has passed. Choose your wedding date." };
  if (!r) return { state: "loading", word: "…", words: "Checking the diary." };
  if (!r.ok) return { state: "unknown", word: "Ask me.", words: "The diary can't be read just now. Ask, and I'll reply with the day." };
  const s = r.days[ymd] ?? "open";
  if (s === "taken") return { state: "taken", word: "Taken.", words: "I'm with another bride that day. The Friday or Sunday may be free, and I keep a short waiting list." };
  if (s === "held") return { state: "held", word: "On hold.", words: "Another bride has it until her booking fee is in. Ask, and I'll tell you the moment it frees." };
  return { state: "open", word: "Open.", words: "Free so far. Ask, and I'll hold it while you decide." };
}

/**
 * The cover's first date before the bride chooses hers: the first open Saturday at least `after` days ahead in the
 * artist's diary, so the line is true when it says "Open." An unread diary gives "".
 * @param {string} today @param {DatesResult|null} r @param {number} [after]
 */
export function nextOpenSaturday(today, r, after = 180) {
  if (!r || !r.ok) return "";
  let d = addDaysYmd(today, after);
  while (new Date(`${d}T12:00:00Z`).getUTCDay() !== 6) d = addDaysYmd(d, 1);
  for (let i = 0; i < 80; i++, d = addDaysYmd(d, 7)) if (!r.days[d]) return d;
  return "";
}

/** "14:00" → 840. @param {string} hm */
export const minutesOf = (hm) => { const [h, m] = hm.split(":").map(Number); return h * 60 + m; };
/** 445 → "7:25", 840 → "2:00". @param {number} m */
export const clock = (m) => { const x = ((m % 1440) + 1440) % 1440, h = Math.floor(x / 60), mi = x % 60; return `${((h + 11) % 12) + 1}:${String(mi).padStart(2, "0")}`; };
/** 445 → "7:25am", 840 → "2pm", 870 → "2:30pm". @param {number} m */
export const clockWords = (m) => {
  const x = ((m % 1440) + 1440) % 1440, h = Math.floor(x / 60), mi = x % 60;
  return `${((h + 11) % 12) + 1}${mi ? `:${String(mi).padStart(2, "0")}` : ""}${x < 720 ? "am" : "pm"}`;
};
/** "2 hrs 30", "1 hr", "45 min". @param {number} minutes */
export function hoursWords(minutes) {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  if (!h) return `${m} min`;
  return `${h} hr${h > 1 ? "s" : ""}${m ? ` ${m}` : ""}`;
}
/** "£1,080" @param {number} n */
export const pounds = (n) => `£${n.toLocaleString("en-GB")}`;
const WORDS = ["no one", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
/** 4 → "four" @param {number} n */
export const numberWord = (n) => WORDS[n] ?? String(n);

/**
 * @typedef {{ label: string, minutes: number }} Chair
 * @typedef {{ ceremony: number, bride: number, guests: Chair[], travel: number, dress: number, buffer: number, artists: 1|2 }} MorningIn
 * @typedef {{ label: string, start: number, end: number, lane: number, bride?: boolean }} MorningRow
 */
/**
 * The wedding morning worked back from the ceremony: out of the door `travel` minutes before it, dressed `dress`
 * minutes before that, `buffer` minutes spare, the bride last in the chair; everyone else before her, in the order
 * given. With two artists the guests are shared between two chairs so both finish when the bride starts.
 * @param {MorningIn} m @returns {{ start: number, ready: number, dressAt: number, leave: number, rows: MorningRow[] }}
 */
export function morningPlan(m) {
  const leave = m.ceremony - m.travel, dressAt = leave - m.dress, ready = dressAt - m.buffer, brideStart = ready - m.bride;
  /** @type {MorningRow[]} */
  const rows = [];
  if (m.artists === 1) {
    let t = brideStart - m.guests.reduce((s, g) => s + g.minutes, 0);
    for (const g of m.guests) { rows.push({ label: g.label, start: t, end: t + g.minutes, lane: 0 }); t += g.minutes; }
  } else {
    // Fill two chairs backwards from the bride: each next guest goes to the chair that is free latest.
    const ends = [brideStart, brideStart];
    for (const g of [...m.guests].reverse()) {
      const lane = ends[0] >= ends[1] ? 0 : 1;
      rows.unshift({ label: g.label, start: ends[lane] - g.minutes, end: ends[lane], lane });
      ends[lane] -= g.minutes;
    }
    rows.sort((a, b) => a.start - b.start);
  }
  rows.push({ label: "", start: brideStart, end: ready, lane: 0, bride: true });
  return { start: Math.min(brideStart, ...rows.map((r) => r.start)), ready, dressAt, leave, rows };
}

/**
 * How many artists the morning needs: one, unless one artist would start before the artist's own earliest start
 * (`earliest`, minutes) and she offers a second.
 * @param {Omit<MorningIn, "artists">} m @param {number} earliest @param {boolean} secondOffered @returns {1|2}
 */
export function artistsFor(m, earliest, secondOffered) {
  return secondOffered && morningPlan({ ...m, artists: 1 }).start < earliest ? 2 : 1;
}

/** What the cover, the party quote and the morning page say instead of a start time she couldn't make. */
export const PLANNING = "This one needs planning — message me.";

/**
 * The morning from the page's data (pageData: packages and morning) and the bride's choices: her service, the ceremony
 * time and how many of each party service. Brings in a second artist when the artist offers one and one alone would
 * start before her earliest; names the early-start fee when the start falls before the artist's cut-off. `tooEarly`:
 * even so the morning would start before the second artist's earliest (or 5am when there's no second artist), so the
 * site shows no start time and asks the bride to message.
 * @param {{ packages: { bride: any[], party: any[] }, morning: { travel: number, dress: number, buffer: number, early: { before: string, fee: number }, second: { earliest: string, fee: number }|null } }} d
 * @param {{ service: string, ceremony: number, counts: Record<string, number> }} s
 */
export function morningFor(d, s) {
  const bride = d.packages.bride.find((x) => x.id === s.service) ?? d.packages.bride[0];
  const guests = d.packages.party.flatMap((p) => Array.from({ length: s.counts[p.id] ?? 0 }, () => ({ label: p.one ?? p.name, minutes: p.minutes })));
  const base = { ceremony: s.ceremony, bride: bride.minutes, guests, travel: d.morning.travel, dress: d.morning.dress, buffer: d.morning.buffer };
  const second = d.morning.second;
  const artists = second ? artistsFor(base, minutesOf(second.earliest), true) : 1;
  const plan = morningPlan({ ...base, artists });
  const early = plan.start < minutesOf(d.morning.early.before) && d.morning.early.fee > 0;
  const tooEarly = plan.start < minutesOf(second?.earliest ?? "05:00");
  return { plan, artists, early, tooEarly, bride, guests, earlyFee: early ? d.morning.early.fee : 0, secondFee: artists > 1 && second ? second.fee : 0 };
}

/**
 * The party quote: the bride's package, everyone else at their price, the early-start fee when the morning starts
 * before the artist's cut-off, a second artist when one is needed. Every figure is the artist's own; this only adds up.
 * @param {{ bride: number, lines: { price: number, count: number }[], early: number, second: number }} q
 */
export function quoteTotal(q) {
  return q.bride + q.lines.reduce((s, l) => s + l.price * l.count, 0) + q.early + q.second;
}

/** The outward part of a UK postcode, "sw4 0ab" → "SW4", "SW1A" stays; "" if it isn't one. @param {string} pc */
export function districtOf(pc) {
  const s = pc.toUpperCase().replace(/\s+/g, "");
  const m = /^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})?$/.exec(s);
  return m ? m[1] : "";
}

/**
 * Travel to the getting-ready address, from the artist's own districts and fees. Unknown districts ask.
 * @param {string} pc @param {{ free: string[], zones: { districts: string[], fee: number }[] }} cfg
 * @returns {{ state: "bad"|"free"|"fee"|"ask", district: string, fee: number }}
 */
export function travelFor(pc, cfg) {
  const d = districtOf(pc);
  if (!d) return { state: "bad", district: "", fee: 0 };
  const matches = (/** @type {string[]} */ list) => list.some((x) => x === d || (x.endsWith("*") && d.startsWith(x.slice(0, -1)) && /\d/.test(d.slice(x.length - 1, x.length))));
  if (matches(cfg.free)) return { state: "free", district: d, fee: 0 };
  const z = cfg.zones.find((z) => matches(z.districts));
  return z ? { state: "fee", district: d, fee: z.fee } : { state: "ask", district: d, fee: 0 };
}

/**
 * When to have the trial: between `earliestWeeks` and `latestWeeks` before the wedding, never before today.
 * @param {string} wedding @param {{ earliestWeeks: number, latestWeeks: number }} cfg @param {string} today
 * @returns {{ from: string, to: string, late: boolean }} late: the window has already closed
 */
export function trialWindow(wedding, cfg, today) {
  const from = addDaysYmd(wedding, -7 * cfg.earliestWeeks), to = addDaysYmd(wedding, -7 * cfg.latestWeeks);
  return { from: from < today ? today : from, to, late: to < today };
}

/** @typedef {{ id: string, label: string, daysBefore: number, text: string }} PrepStep */
/**
 * The skin prep countdown: each step's day, worked back from the wedding by the artist's own days, earliest first,
 * marked past when it's before today.
 * @param {string} wedding @param {PrepStep[]} steps @param {string} today
 */
export function prepDates(wedding, steps, today) {
  return steps
    .map((s) => { const date = addDaysYmd(wedding, -s.daysBefore); return { ...s, date, past: date < today }; })
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** @param {string} s */
const icsText = (s) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
/** "20261109T091200Z" @param {Date} d */
export const icsStamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/**
 * A calendar file. All-day events carry a date only; timed ones (the chair on the morning) carry a local time with no
 * zone, so they stay at the time the artist planned wherever the phone is.
 * @param {{ artist: string, place: string, stamp: string, events: { id: string, date: string, start?: number, end?: number, title: string, note?: string }[] }} o
 */
export function calendar(o) {
  const slug = o.artist.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const hm = (/** @type {number} */ m) => `${String(Math.floor(m / 60)).padStart(2, "0")}${String(m % 60).padStart(2, "0")}00`;
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Sitefloor//${icsText(o.artist)}//EN`, "CALSCALE:GREGORIAN",
    ...o.events.flatMap((e) => [
      "BEGIN:VEVENT",
      `UID:${e.id}-${e.date}@${slug}`,
      `DTSTAMP:${o.stamp}`,
      ...(e.start === undefined
        ? [`DTSTART;VALUE=DATE:${e.date.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${addDaysYmd(e.date, 1).replace(/-/g, "")}`]
        : [`DTSTART:${e.date.replace(/-/g, "")}T${hm(e.start)}`, `DTEND:${e.date.replace(/-/g, "")}T${hm(e.end ?? e.start + 30)}`]),
      `SUMMARY:${icsText(e.title)}`,
      ...(e.note ? [`DESCRIPTION:${icsText(e.note)}`] : []),
      ...(o.place ? [`LOCATION:${icsText(o.place)}`] : []),
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ].join("\r\n") + "\r\n";
}

// ---------------------------------------------------------------- the messages (the artist's own opening first)

/** @param {string} opening @param {string} ymd @param {string} [service] */
export function dateText(opening, ymd, service = "") {
  const what = service ? ` for ${service.toLowerCase()}` : "";
  return ymd ? `${opening} is ${ukDate(ymd)} free${what}?` : `${opening} I'd like to check a date${what}.`;
}

/**
 * @param {string} opening
 * @param {{ wedding?: string, service: string, ceremony?: string, people: { label: string, count: number }[], start?: string, total: number }} q
 */
export function quoteText(opening, q) {
  const when = q.wedding && isYmd(q.wedding) ? ` on ${ukDate(q.wedding)}` : "";
  const who = q.people.filter((p) => p.count).map((p) => `${p.count} ${p.label.toLowerCase()}`).join(", ");
  const time = q.ceremony ? ` Ceremony at ${q.ceremony}${q.start ? `, so a ${q.start} start` : ""}.` : "";
  return `${opening} a quote for my wedding${when}: me (${q.service.toLowerCase()})${who ? `, ${who}` : ""}.${time} From ${pounds(q.total)} on your site. Could you confirm?`;
}

/** @param {string} opening @param {{ wedding: string, ceremony: string, start: string, people: number, artists: number }} m */
export function morningText(opening, m) {
  const when = isYmd(m.wedding) ? ` on ${ukDate(m.wedding)}` : "";
  return `${opening} our morning${when}: ceremony at ${m.ceremony}, ${m.people} in the chair${m.artists > 1 ? ", two artists" : ""}${m.start ? `, starting at ${m.start}` : ""}. ${m.start ? "Does that work for you?" : "How early would we need to start?"}`;
}

/** @param {string} opening @param {{ wedding: string, where: string, guests: string }} t */
export function trialText(opening, t) {
  const when = isYmd(t.wedding) ? ` My wedding is ${ukDate(t.wedding)}.` : "";
  return `${opening} I'd like to book a trial.${when}${t.where ? ` ${t.where}.` : ""}${t.guests ? ` ${t.guests}.` : ""}`;
}

/** @param {string} opening @param {string} look */
export const lookText = (opening, look) => `${opening} I'd love a look like "${look}" for my wedding. Is my date free?`;

/** @param {string} opening @param {string} district */
export const travelText = (opening, district) => `${opening} we're getting ready in ${district || "…"}. What would travel be?`;

/** @param {string} opening @param {string} wedding @param {string} [first] */
export function skinText(opening, wedding, first = "") {
  return isYmd(wedding) ? `${opening} my wedding is ${ukDate(wedding)}.${first ? ` ${first}` : ""} Could we talk about my skin before the trial?` : `${opening} could we talk about my skin before the trial?`;
}

/**
 * Number repeated labels so each chair is one person: Bridesmaid, Bridesmaid → Bridesmaid 1, Bridesmaid 2.
 * @param {string[]} labels
 */
export function numbered(labels) {
  const total = /** @type {Record<string, number>} */ ({}), seen = /** @type {Record<string, number>} */ ({});
  for (const l of labels) total[l] = (total[l] ?? 0) + 1;
  return labels.map((l) => (total[l] > 1 ? `${l} ${(seen[l] = (seen[l] ?? 0) + 1)}` : l));
}

/**
 * The morning for the bride's group chat: who's in the chair when, the dress, the door and the ceremony.
 * @param {string} artist @param {string} wedding @param {{ label: string, start: number }[]} rows @param {{ dressAt: number, leave: number, ceremony: number }} t
 */
export function groupText(artist, wedding, rows, t) {
  const when = isYmd(wedding) ? ` (${ukDate(wedding)})` : "";
  return `Our wedding morning${when}, with ${artist}: ${rows.map((r) => `${r.label} ${clockWords(r.start)}`).join(", ")}. Dresses on at ${clockWords(t.dressAt)}, out of the door at ${clockWords(t.leave)}, ceremony ${clockWords(t.ceremony)}.`;
}
