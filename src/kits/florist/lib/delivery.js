// @ts-check
/**
 * Same-day delivery, honestly: only the florist's own cut-off times, closed days and postcode districts decide what a
 * customer is told. Nothing here guesses: an unknown postcode is "not by hand", a past cut-off is "next delivery day".
 */
import { DAY_KEYS, DAY_NAMES, toMinutes, addDays } from "../../../core/lib/hours.js";

/**
 * @typedef {object} Delivery
 * @property {string[]} zones postcode districts delivered by hand, e.g. ["SW1", "SW3"]
 * @property {Record<string, string|null>} cutoffs per day key ("mon"…"sun"): "13:00", or null for no deliveries
 * @property {string[]} [closed] dates with no deliveries (YYYY-MM-DD)
 * @property {Record<string, string|null>} [dates] one-off cut-offs for single dates ("2026-12-24": "11:00"), null for none
 */

/** The cut-off on a date: the florist's one-off for that date, else the day's. @param {Delivery} d @param {string} date @param {number} weekday */
export const cutoffOn = (d, date, weekday) => (d.dates && date in d.dates ? d.dates[date] : d.cutoffs[DAY_KEYS[weekday]]);
/** @typedef {{ open: true, cutoff: string, left: number } | { open: false, next: { date: string, label: string, cutoff: string } | null }} SameDay */

/** "13:00" → "1pm", "11:30" → "11.30am" (UK style). @param {string} hhmm */
export function cutoffLabel(hhmm) {
  const m = toMinutes(hhmm);
  const h = Math.floor(m / 60), min = m % 60;
  return `${h % 12 || 12}${min ? `.${String(min).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`;
}

/** Minutes as "2 h 14 min" / "45 min". @param {number} n */
export function leftLabel(n) {
  return n >= 60 ? `${Math.floor(n / 60)} h ${n % 60} min` : `${n} min`;
}

/**
 * Today's state from the florist's own settings.
 * @param {Delivery} d @param {{ date: string, weekday: number, minutes: number }} now shop time
 * @param {string[]} [holidays] bank holidays to treat as closed (only if the florist closes on them)
 * @returns {SameDay}
 */
export function sameDay(d, now, holidays = []) {
  const shut = new Set([...(d.closed ?? []), ...holidays]);
  const today = cutoffOn(d, now.date, now.weekday);
  if (today && !shut.has(now.date) && now.minutes < toMinutes(today)) return { open: true, cutoff: cutoffLabel(today), left: toMinutes(today) - now.minutes };
  for (let i = 1; i <= 21; i++) {
    const date = addDays(now.date, i);
    const wd = (now.weekday + i) % 7;
    const c = cutoffOn(d, date, wd);
    if (c && !shut.has(date)) return { open: false, next: { date, label: i === 1 ? "tomorrow" : DAY_NAMES[wd], cutoff: cutoffLabel(c) } };
  }
  return { open: false, next: null };
}

/**
 * The outward code of a UK postcode ("sw6 1aa" → "SW6", "SW1A1AA" → "SW1A", "SW6" → "SW6"), or null if it isn't one.
 * @param {string} input
 */
export function outward(input) {
  const s = String(input).toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z]{1,2}\d[A-Z\d]?(\d[A-Z]{2})?$/.test(s)) return null;
  return s.length >= 5 && /\d[A-Z]{2}$/.test(s) ? s.slice(0, -3) : s;
}

/**
 * Whether an outward code is in the delivery districts. "SW1" covers SW1A–SW1Y but not SW10 or SW11.
 * @param {string} code @param {string[]} zones
 */
export function inZone(code, zones) {
  return zones.some((z) => code === z || (code.length === z.length + 1 && code.startsWith(z) && /[A-Z]$/.test(code)));
}

/** A district written the way the florist would ("SW1", "W8", "EC1A"). @param {string} z */
export const isDistrict = (z) => /^[A-Z]{1,2}\d[A-Z\d]?$/.test(z);

/**
 * @typedef {object} Area one delivery area's own settings, where the florist has them
 * @property {string} district e.g. "W8"
 * @property {number} [fee] the area's delivery charge, if not the usual one
 * @property {Record<string, string|null>} [cutoffs] days whose cut-off differs for this area
 */

/** The florist's own area for an outward code, if they've described one. @param {string} code @param {Area[]} [areas] */
export const areaFor = (code, areas = []) => areas.find((a) => inZone(code, [a.district])) ?? null;

/** The delivery settings for one area: its own cut-offs where it has them. @param {Delivery} d @param {Area|null} area @returns {Delivery} */
export const withArea = (d, area) => (area?.cutoffs ? { ...d, cutoffs: { ...d.cutoffs, ...area.cutoffs } } : d);

/** "£12 delivery" / "free delivery" / "" when the florist hasn't said. @param {number|undefined} fee */
export const feeLabel = (fee) => (fee === undefined ? "" : fee === 0 ? "Free delivery." : `Delivery £${fee}.`);

/**
 * What to say to someone who typed a postcode. An area with its own cut-offs is answered from those (pass `now`).
 * @param {string} input @param {Delivery & { areas?: Area[], fee?: number }} d @param {SameDay} state
 * @param {{ date: string, weekday: number, minutes: number }} [now] @param {string[]} [holidays]
 * @returns {{ ok: boolean, text: string }}
 */
export function postcodeAnswer(input, d, state, now, holidays = []) {
  const code = outward(input);
  if (!code) return { ok: false, text: "Enter a postcode such as SW6 or SW6 1AA." };
  if (!inZone(code, d.zones)) return { ok: false, text: `We don't deliver by hand to ${code}. Collect from the studio, or message us and we'll find a way.` };
  const area = areaFor(code, d.areas);
  const s = area?.cutoffs && now ? sameDay(withArea(d, area), now, holidays) : state;
  const fee = feeLabel(area?.fee ?? d.fee);
  const tail = fee ? ` ${fee}` : "";
  if (s.open) return { ok: true, text: `Yes, ${code} today if you order by ${s.cutoff}.${tail}` };
  return { ok: true, text: s.next ? `Yes, ${code}: next delivery ${s.next.label}, order by ${s.next.cutoff}.${tail}` : `Yes, we deliver to ${code}.${tail}` };
}

const DAYS3 = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS3 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "Fri 6 Nov", the same in every browser (not the browser's own date format). @param {string} date YYYY-MM-DD */
export function shortDate(date) {
  const d = new Date(`${date}T12:00:00Z`);
  return `${DAYS3[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS3[d.getUTCMonth()]}`;
}

/** How far ahead the site takes a delivery date; later dates are a conversation. */
export const AHEAD_DAYS = 90;

/**
 * A delivery date the customer picked, checked against the florist's own days, cut-offs and closed dates.
 * @param {string} date YYYY-MM-DD @param {Delivery} d @param {{ date: string, weekday: number, minutes: number }} now
 * @param {string[]} [holidays]
 * @returns {{ ok: boolean, text: string, label?: string }}
 */
export function deliveryOn(date, d, now, holidays = []) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, text: "Choose a date." };
  if (date < now.date) return { ok: false, text: "That date has passed." };
  const label = shortDate(date);
  if (date === now.date) {
    const s = sameDay(d, now, holidays);
    if (s.open) return { ok: true, text: `Today, if you order by ${s.cutoff}.`, label: "today" };
    return { ok: false, text: s.next ? `Today's deliveries have gone. The next is ${s.next.label}.` : "Today's deliveries have gone." };
  }
  if (date > addDays(now.date, AHEAD_DAYS)) return { ok: false, text: "That's a while off: message us and we'll put it in the diary." };
  const shut = new Set([...(d.closed ?? []), ...holidays]);
  const wd = new Date(`${date}T12:00:00Z`).getUTCDay();
  if (shut.has(date) || !cutoffOn(d, date, wd)) return { ok: false, text: `We don't deliver on ${label}. Choose another day.` };
  return { ok: true, text: `Delivered on ${label}.`, label };
}

/**
 * The delivery day for an order: the chosen date checked against the area of the postcode typed (its own cut-offs,
 * where the florist set them), at this moment. Run again when the order is sent, so "today" never goes on an order
 * after the cut-off.
 * @param {string} date YYYY-MM-DD @param {string} postcode as typed (may be empty)
 * @param {Delivery & { areas?: Area[] }} d @param {{ date: string, weekday: number, minutes: number }} now @param {string[]} [holidays]
 */
export function orderDay(date, postcode, d, now, holidays = []) {
  const code = outward(postcode);
  if (date && code && !inZone(code, d.zones)) return { ok: false, text: `We don't deliver by hand to ${code}. Collect from the studio, or message us and we'll find a way.` };
  return deliveryOn(date, withArea(d, code ? areaFor(code, d.areas) : null), now, holidays);
}
