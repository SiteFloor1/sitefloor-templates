// @ts-check
/**
 * The car-film kit's logic, no DOM: the light on a road (golden hour, sunset, blue hour), "tonight" that moves on to
 * tomorrow once the light has gone, the film's timecode, delivery dates in working days, the viewfinder's frame
 * geometry and the cloud forecast at golden hour. Shared by the build (first paint) and the browser. Tested in
 * tests/unit/carfilm.test.js.
 */
import { solarAngles } from "../../../core/lib/sun.js";
import { bankHolidays, regionFromPostcode } from "../../../core/lib/bank-holidays.js";

/** Heights of the sun that bound the light we shoot in (degrees). Golden hour: 6° above to 4° below; blue hour: 4° to 6° below. */
export const LIGHT = { goldTop: 6, sunset: -0.833, goldBottom: -4, blueBottom: -6 };

const DAY = 86_400_000;
const ymdFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" });
const hmFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const hourFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", hourCycle: "h23" });

/** The UK calendar date of a moment. @param {number} ms */
export const ukYmd = (ms) => ymdFmt.format(ms);
/** The UK clock time of a moment, "16:04"; a dash when there is none. @param {number|null} ms */
export const ukHm = (ms) => (ms === null ? "–" : hmFmt.format(ms));

/** The moment UK midnight starts a date (GMT or BST). @param {string} ymd */
export function ukMidnight(ymd) {
  const guess = Date.parse(`${ymd}T00:00:00Z`);
  const h = Number(hourFmt.format(guess));
  return guess - (h > 12 ? h - 24 : h) * 3_600_000;
}

/**
 * The light on one UK day at a place: when the sun crosses each height, minute by minute (accurate to the minute).
 * Morning and evening golden hour, sunrise and sunset, the end of blue hour, and the day's highest sun. A time is null
 * when the sun never crosses that height that day (a Scottish December noon never reaches 6°).
 * @param {string} ymd @param {number} lat @param {number} lon
 */
export function dayLight(ymd, lat, lon) {
  const t0 = ukMidnight(ymd);
  const end = ukMidnight(new Date(Date.parse(`${ymd}T12:00:00Z`) + DAY).toISOString().slice(0, 10));
  const minutes = Math.round((end - t0) / 60_000); // 1380, 1440 or 1500 on the days the clocks change
  /** @type {number[]} */ const e = [];
  for (let m = 0; m <= minutes; m++) e.push(solarAngles(t0 + m * 60_000, lat, lon).elevation);
  /** @param {number} level @param {boolean} rising */
  const cross = (level, rising) => {
    for (let m = 1; m <= minutes; m++) {
      const a = e[m - 1], b = e[m];
      if (rising ? a < level && b >= level : a >= level && b < level) return Math.round(t0 + (m - 1 + (level - a) / (b - a)) * 60_000);
    }
    return null;
  };
  return {
    ymd, max: Math.max(...e),
    goldAmStart: cross(LIGHT.goldBottom, true), sunrise: cross(LIGHT.sunset, true), goldAmEnd: cross(LIGHT.goldTop, true),
    goldPmStart: cross(LIGHT.goldTop, false), sunset: cross(LIGHT.sunset, false), goldPmEnd: cross(LIGHT.goldBottom, false),
    bluePmEnd: cross(LIGHT.blueBottom, false),
  };
}

/**
 * "Tonight" at a road: today's evening light until its blue hour is over, then tomorrow's, so the page never offers a
 * time that has passed. @param {number} nowMs @param {number} lat @param {number} lon
 * @returns {{ when: "tonight"|"tomorrow", light: ReturnType<typeof dayLight> }}
 */
export function evening(nowMs, lat, lon) {
  const today = dayLight(ukYmd(nowMs), lat, lon);
  const over = today.bluePmEnd ?? today.goldPmEnd ?? today.sunset;
  if (over !== null && nowMs < over) return { when: "tonight", light: today };
  return { when: "tomorrow", light: dayLight(ukYmd(nowMs + DAY), lat, lon) };
}

/**
 * The evening's light as words and times the page shows: the golden window (or "low sun all day" when the sun never
 * reaches 6°), sunset and blue hour. @param {ReturnType<typeof dayLight>} l
 */
export function eveningLine(l) {
  const low = l.max < LIGHT.goldTop;
  return {
    low,
    gold: low ? `${ukHm(l.sunrise)} – ${ukHm(l.sunset)}` : `${ukHm(l.goldPmStart)} – ${ukHm(l.goldPmEnd)}`,
    sunset: ukHm(l.sunset),
    blue: `${ukHm(l.goldPmEnd)} – ${ukHm(l.bluePmEnd)}`,
  };
}

/** SMPTE-style timecode for a moment in a film, "00:00:03:12" at the film's own frame rate. @param {number} seconds @param {number} fps */
export function timecode(seconds, fps) {
  const f = Math.max(0, Math.floor(seconds * fps + 1e-6));
  const s = Math.floor(f / fps);
  const p = (/** @type {number} */ n) => String(n).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}:${p(f % fps)}`;
}

/** A film's length as minutes and seconds, "00:29", "02:05". @param {number} seconds */
export function runtime(seconds) {
  const s = Math.round(seconds);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** A section marker in editors' timecode from hour one (01:00:00:00), one step per section. @param {number} n @param {number} [step] seconds between sections */
export function sectionMark(n, step = 12) {
  return `01:${timecode(n * step, 25).slice(3)}`;
}

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/**
 * The date a delivery is due: a number of the studio's working days after the shoot, skipping UK bank holidays for
 * the studio's nation (from its postcode). @param {string} shootYmd @param {number} days @param {string[]} workdays e.g. ["mon","tue",…]
 * @param {string} postcode
 */
export function deliveryDate(shootYmd, days, workdays, postcode) {
  const region = regionFromPostcode(postcode);
  const hols = new Set([0, 1].flatMap((k) => bankHolidays(Number(shootYmd.slice(0, 4)) + k, region)));
  let t = Date.parse(`${shootYmd}T12:00:00Z`), left = days;
  while (left > 0) {
    t += DAY;
    const ymd = new Date(t).toISOString().slice(0, 10);
    if (workdays.includes(WEEKDAYS[new Date(t).getUTCDay()]) && !hols.has(ymd)) left--;
  }
  return new Date(t).toISOString().slice(0, 10);
}

/**
 * Where the viewfinder's frame sits for a format: as large as fits inside the picture (with a margin), centred on a
 * point the visitor can move, never past the edges. Pixels, rounded so the 1px guides stay crisp.
 * @param {number} ratio width ÷ height @param {number} W @param {number} H @param {number} cx 0–1 @param {number} cy 0–1 @param {number} [fill]
 */
export function frameBox(ratio, W, H, cx, cy, fill = 0.88) {
  let w = W * fill, h = w / ratio;
  if (h > H * fill) { h = H * fill; w = h * ratio; }
  const left = Math.min(Math.max(cx * W - w / 2, 0), W - w), top = Math.min(Math.max(cy * H - h / 2, 0), H - h);
  return { left: Math.round(left), top: Math.round(top), width: Math.round(w), height: Math.round(h) };
}

/** "2.39:1", "16:9", "4:5" → width ÷ height; NaN when it isn't a ratio. @param {string} s */
export function ratioOf(s) {
  const m = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec(s ?? "");
  return m ? Number(m[1]) / Number(m[2]) : NaN;
}

/**
 * Cloud cover at golden hour from MET Norway's Locationforecast (compact): the forecast hour nearest the middle of the
 * evening's golden window, if the forecast reaches it and was made in the last 12 hours. Null otherwise, and the
 * page then says nothing about the weather.
 * @param {any} json the API's reply @param {ReturnType<typeof dayLight>} l @param {number} nowMs
 * @returns {{ cloud: number, at: number, updated: number } | null}
 */
export function cloudAtGolden(json, l, nowMs) {
  const series = json?.properties?.timeseries;
  const updated = Date.parse(json?.properties?.meta?.updated_at ?? "");
  if (!Array.isArray(series) || !Number.isFinite(updated) || nowMs - updated > 12 * 3_600_000) return null;
  if (l.goldPmStart === null || l.goldPmEnd === null) return null;
  const best = nearestHour(series, (l.goldPmStart + l.goldPmEnd) / 2);
  return best ? { ...best, updated } : null;
}

/** The forecast hour nearest a moment (within 90 minutes) and its cloud cover. @param {any[]} series @param {number} mid */
function nearestHour(series, mid) {
  let best = null, gap = 90 * 60_000;
  for (const s of series) {
    const t = Date.parse(s?.time ?? ""), c = s?.data?.instant?.details?.cloud_area_fraction;
    if (Number.isFinite(t) && typeof c === "number" && Math.abs(t - mid) <= gap) { gap = Math.abs(t - mid); best = { cloud: Math.round(c), at: t }; }
  }
  return best;
}

/** Cloud cover in words a person would use, from the forecast's percentage. @param {number} pct */
export function cloudWords(pct) {
  if (pct <= 12) return "clear";
  if (pct <= 37) return "mostly clear";
  if (pct <= 62) return "partly cloudy";
  if (pct <= 87) return "mostly cloudy";
  return "overcast";
}

/** Fill a studio's message template: {road}, {date}, {gold}, {sunset}, {shots}, {name}. @param {string} t @param {Record<string, string>} v */
export function fill(t, v) {
  return t.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));
}

/** A UK date in words, "Fri 27 Nov". @param {string} ymd */
export function shortDay(ymd) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(Date.parse(`${ymd}T12:00:00Z`));
}
