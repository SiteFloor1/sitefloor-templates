// @ts-check
/**
 * Tour operators: pure logic, no DOM. Months, which journeys fit, local time and the gap to London, sunrise and
 * sunset, the drawn map of a country with a journey's route, the shortlist message and the private trip sheet.
 * Every journey, month pick, price and checklist is the operator's own; nothing here invents a fact.
 */

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const WHO = /** @type {const} */ ({ couple: "Two of us", family: "Family", friends: "Friends", solo: "Just me" });
const short = (/** @type {number} */ m) => MONTHS[m - 1].slice(0, 3);

/**
 * The months a journey is at its best, in words: runs of months joined ("Oct–Mar", "May–Oct"), two single months
 * with "and" ("Apr and Nov"), every month "all year". Months are 1–12; a run may cross the new year.
 * @param {number[]} go
 */
export function monthWords(go) {
  const s = new Set(go.filter((m) => Number.isInteger(m) && m >= 1 && m <= 12));
  if (!s.size) return "";
  if (s.size === 12) return "all year";
  const first = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].find((m) => !s.has(m)) ?? 1;
  /** @type {[number, number][]} */ const runs = [];
  for (let k = 1; k <= 12; k++) {
    const m = ((first - 1 + k) % 12) + 1, prev = ((m + 10) % 12) + 1;
    if (!s.has(m)) continue;
    if (!s.has(prev)) runs.push([m, m]); else runs[runs.length - 1][1] = m;
  }
  const f = (/** @type {[number, number]} */ [a, b]) => (a === b ? short(a) : `${short(a)}–${short(b)}`);
  if (runs.length === 2 && runs.every(([a, b]) => a === b)) return `${f(runs[0])} and ${f(runs[1])}`;
  return runs.map(f).join(", ");
}

/** For each month 1–12: part of a run, and whether it starts or ends one (for the year drawn as lines). @param {number[]} go */
export function monthMarks(go) {
  const s = new Set(go);
  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1, on = s.has(m);
    return { month: m, on, start: on && !s.has(((m + 10) % 12) + 1), end: on && !s.has((m % 12) + 1) };
  });
}

/**
 * Does a journey fit a month, who's going and roughly how long? Nights within 3 of what they asked for.
 * @param {{ go: number[], who: string[], nights: number }} j @param {{ month: number, who: string, nights: number }} q
 */
export function fits(j, q) {
  return j.go.includes(q.month) && j.who.includes(q.who) && Math.abs(j.nights - q.nights) <= 3;
}

/** The journeys that fit first, the rest after, each group in the operator's order. @template {{ go: number[], who: string[], nights: number }} T @param {T[]} js @param {{ month: number, who: string, nights: number }} q */
export function byFit(js, q) {
  return [...js.filter((j) => fits(j, q)), ...js.filter((j) => !fits(j, q))];
}

/**
 * A time zone's offset from UTC in hours at a moment, from the browser's (or Node's) own time-zone data.
 * @param {string} tz @param {number} at ms
 */
export function tzOffset(tz, at) {
  const part = new Intl.DateTimeFormat("en-GB", { timeZone: tz, timeZoneName: "longOffset" }).formatToParts(new Date(at)).find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const m = part.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
  return m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) + Number(m[3] ?? 0) / 60) : 0;
}

/** "3 hours behind London", "9 hours ahead of London", "5½ hours ahead…", "same time as London". @param {string} tz @param {number} at */
export function gapWords(tz, at) {
  const h = tzOffset(tz, at) - tzOffset("Europe/London", at);
  if (h === 0) return "same time as London";
  const a = Math.abs(h), whole = Math.floor(a), frac = a - whole;
  const n = frac === 0.5 ? `${whole || ""}½` : frac === 0.75 ? `${whole}¾` : frac === 0.25 ? `${whole}¼` : String(whole);
  return `${n} ${a === 1 ? "hour" : "hours"} ${h > 0 ? "ahead of" : "behind"} London`;
}

/** "Local time 22:08 · 3 hours behind London". @param {string} tz @param {number} at */
export function localLine(tz, at) {
  const t = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(at));
  return `Local time ${t} · ${gapWords(tz, at)}`;
}

/** Is this a time zone the runtime knows? @param {string} tz */
export function knownZone(tz) {
  try { new Intl.DateTimeFormat("en-GB", { timeZone: tz }); return true; } catch { return false; }
}

/**
 * Sunrise and sunset in UTC minutes after midnight, for a date (NOAA's solar position equations, accurate to a minute
 * or two away from the poles). Returns { polar: "day"|"night" } when the sun doesn't rise or set that day.
 * @param {number} lat @param {number} lon @param {string} ymd
 * @returns {{ rise: number, set: number } | { polar: "day"|"night" }}
 */
export function sunTimes(lat, lon, ymd) {
  const [y, mo, d] = ymd.split("-").map(Number);
  const day = Math.round((Date.UTC(y, mo - 1, d) - Date.UTC(y, 0, 0)) / 86_400_000);
  const g = (2 * Math.PI / 365) * (day - 1);
  const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const r = (/** @type {number} */ x) => (x * Math.PI) / 180;
  const cosH = (Math.cos(r(90.833)) / (Math.cos(r(lat)) * Math.cos(dec))) - Math.tan(r(lat)) * Math.tan(dec);
  if (cosH > 1) return { polar: "night" };
  if (cosH < -1) return { polar: "day" };
  const ha = (Math.acos(cosH) * 180) / Math.PI;
  const noon = 720 - 4 * lon - eq;
  return { rise: noon - 4 * ha, set: noon + 4 * ha };
}

/**
 * Daylight on the 15th of a month at a place, in its own clock: "Sunrise 05:41 · sunset 21:12 · 15 h 31 min of light".
 * @param {number} lat @param {number} lon @param {string} tz @param {number} month 1–12 @param {number} year
 */
export function daylight(lat, lon, tz, month, year) {
  const ymd = `${year}-${String(month).padStart(2, "0")}-15`;
  const s = sunTimes(lat, lon, ymd);
  if ("polar" in s) return { words: s.polar === "day" ? "The sun doesn't set" : "The sun doesn't rise", minutes: s.polar === "day" ? 1440 : 0 };
  const base = Date.UTC(year, month - 1, 15);
  const fmt = (/** @type {number} */ min) => new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(base + min * 60_000));
  const len = Math.round(s.set - s.rise), h = Math.floor(len / 60), m = len % 60;
  return { words: `Sunrise ${fmt(s.rise)} · sunset ${fmt(s.set)} · ${h} h ${m} min of light`, minutes: len };
}

/**
 * The drawn map: one country's outline (Natural Earth, public domain) and a journey's points, projected flat with the
 * width corrected for latitude, fitted to 1000 units on its longer side. Pure numbers in, SVG path text out.
 * @param {{ rings: number[][][] }} country @param {{ name: string, lat: number, lon: number }[]} points
 */
export function drawMap(country, points) {
  const all = country.rings.flat();
  for (const p of points) all.push([p.lon, p.lat]);
  const lons = all.map((c) => c[0]), lats = all.map((c) => c[1]);
  const lo0 = Math.min(...lons), lo1 = Math.max(...lons), la0 = Math.min(...lats), la1 = Math.max(...lats);
  const k = Math.cos((((la0 + la1) / 2) * Math.PI) / 180);
  const s = 1000 / Math.max((lo1 - lo0) * k, la1 - la0);
  const P = (/** @type {number} */ lo, /** @type {number} */ la) => [Math.round((lo - lo0) * k * s * 10) / 10, Math.round((la1 - la) * s * 10) / 10];
  const land = country.rings.map((r) => `M${r.map(([x, y]) => P(x, y).join(" ")).join("L")}Z`).join("");
  const pts = points.map((p) => ({ name: p.name, xy: P(p.lon, p.lat) }));
  const route = pts.length > 1 ? `M${pts.map((p) => p.xy.join(" ")).join("L")}` : "";
  const W = Math.round((lo1 - lo0) * k * s), H = Math.round((la1 - la0) * s);
  return { land, route, pts, width: W, height: H, tall: H > W * 1.6 };
}

/** The route's length along its points, and how far along each point sits (0–1), for drawing it to a stop. @param {{ xy: number[] }[]} pts */
export function routeShares(pts) {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p.xy[0] - pts[i].xy[0], p.xy[1] - pts[i].xy[1]));
  const total = seg.reduce((a, b) => a + b, 0);
  let run = 0;
  return pts.map((_, i) => { if (i) run += seg[i - 1]; return total ? Math.round((run / total) * 1000) / 1000 : 0; });
}

/** The shortlist sent to the operator on WhatsApp. @param {string} business @param {{ name: string, nights: number }[]} js */
export function shortlistMessage(business, js) {
  if (!js.length) return `Hello ${business}, I'd like to talk about a journey.`;
  return `Hello ${business}, these are the journeys we like:\n${js.map((j) => `· ${j.name} (${j.nights} nights)`).join("\n")}\nCould we talk about dates?`;
}

/**
 * The trip builder's summary: regions with nights, the total, and the months they're thinking of.
 * @param {string} business @param {{ name: string, nights: number }[]} picks @param {number|null} month @param {string} who
 */
export function builderMessage(business, picks, month, who) {
  const total = picks.reduce((t, p) => t + p.nights, 0);
  const lines = picks.map((p) => `· ${p.name}, ${p.nights} ${p.nights === 1 ? "night" : "nights"}`);
  const when = month ? ` in ${MONTHS[month - 1]}` : "";
  const party = WHO[/** @type {keyof typeof WHO} */ (who)] ?? "";
  return `Hello ${business}, we're thinking of a trip${when}${party ? ` (${party.toLowerCase()})` : ""}:\n${lines.join("\n")}\n${total} nights in all. Could you suggest how to put it together?`;
}

/** A trip code as the operator prints it: letters and numbers, 6 to 12, upper case. @param {string} raw */
export function cleanCode(raw) {
  const c = String(raw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return c.length >= 6 && c.length <= 12 ? c : "";
}

/** One CSV line into cells (quotes allowed). @param {string} line */
function cells(line) {
  /** @type {string[]} */ const out = []; let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
    else if (ch === '"') q = true; else if (ch === ",") { out.push(cur); cur = ""; } else cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

/**
 * The private trip page by code, from the operator's published sheet: code, journey, start (YYYY-MM-DD),
 * travellers, updated (YYYY-MM-DD). Holds nothing personal by design. Fails closed: unknown code, a journey the site
 * doesn't have, a bad date, or a row not updated for `staleAfterDays` days.
 * @param {string} csv @param {string} code @param {string[]} journeyIds @param {string} today YYYY-MM-DD @param {number} staleAfterDays
 * @returns {{ ok: true, journey: string, start: string, travellers: number, updated: string } | { ok: false, reason: "unknown"|"stale"|"unreadable" }}
 */
export function tripFromCsv(csv, code, journeyIds, today, staleAfterDays) {
  const rows = String(csv).split(/\r?\n/).filter((l) => l.trim()).map(cells);
  if (!rows.length) return { ok: false, reason: "unreadable" };
  const head = rows[0].map((h) => h.toLowerCase());
  const at = (/** @type {string} */ k) => head.indexOf(k);
  if (["code", "journey", "start", "updated"].some((k) => at(k) < 0)) return { ok: false, reason: "unreadable" };
  const row = rows.slice(1).find((r) => cleanCode(r[at("code")]) === code);
  if (!row) return { ok: false, reason: "unknown" };
  const journey = row[at("journey")], start = row[at("start")], updated = row[at("updated")];
  const ymd = /^\d{4}-\d{2}-\d{2}$/;
  if (!journeyIds.includes(journey) || !ymd.test(start) || !ymd.test(updated)) return { ok: false, reason: "unreadable" };
  const age = (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${updated}T00:00:00Z`)) / 86_400_000;
  if (!(age <= staleAfterDays)) return { ok: false, reason: "stale" };
  const n = at("travellers") >= 0 ? Number(row[at("travellers")]) : 0;
  return { ok: true, journey, start, travellers: Number.isInteger(n) && n > 0 && n < 40 ? n : 0, updated };
}

/** Whole days from today to a start date (negative once it has begun). @param {string} today @param {string} start */
export function daysTo(today, start) {
  return Math.round((Date.parse(`${start}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

/** "Tuesday 9 March 2027". @param {string} ymd */
export function longDate(ymd) {
  const d = new Date(`${ymd}T12:00:00Z`);
  const f = (/** @type {Intl.DateTimeFormatOptions} */ o) => new Intl.DateTimeFormat("en-GB", { ...o, timeZone: "UTC" }).format(d);
  return `${f({ weekday: "long" })} ${f({ day: "numeric" })} ${f({ month: "long" })} ${f({ year: "numeric" })}`;
}

/** gov.uk foreign travel advice, and only that: https://www.gov.uk/foreign-travel-advice/<country>. @param {string} url */
export function isTravelAdvice(url) {
  return /^https:\/\/www\.gov\.uk\/foreign-travel-advice\/[a-z0-9-]+$/.test(String(url));
}

/** "£8,900". @param {number} n */
export const pounds = (n) => `£${Math.round(n).toLocaleString("en-GB")}`;
