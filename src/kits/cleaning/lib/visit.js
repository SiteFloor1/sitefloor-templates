// @ts-check
/**
 * One source of truth for a cleaning visit: every room's minutes, the extras' minutes, the total, and the price.
 * Minutes are whole numbers and add up exactly; the price is worked out once from the minutes charged (the total, or the
 * company's shortest visit) at its hourly rate and rounded once, to whole pounds. Every figure a site shows (the room
 * strip, its ruler, the line above it, the bill, the WhatsApp text, the 3D card, the "what's included" page) reads from
 * here and is written by `hm` and `gbp`, so no two figures can disagree.
 */

/** @typedef {"week"|"fortnight"|"once"} Freq */
/** @typedef {{ name: string, min: number, extraMin?: number, tasks: string[], not?: string }} RoomType */
/** @typedef {{ id: string, name: string, min: number, perBed?: boolean }} Extra */
/** @typedef {{ rates: Record<Freq, number>, minimum: number, deep: number, rooms: { kitchen: RoomType, hall: RoomType, bed: RoomType, bath: RoomType }, extras: Extra[] }} VisitSettings */
/** @typedef {{ beds: number, baths: number, freq: Freq, extras?: string[] }} Choice */
/** @typedef {{ id: string, name: string, min: number, tasks: string[], not: string, extra?: boolean }} Part */
/** @typedef {{ rooms: Part[], extras: Part[], work: number, charged: number, rate: number, price: number, deep: boolean }} Visit */

export const FREQS = /** @type {const} */ (["week", "fortnight", "once"]);
export const MAX_BEDS = 6;
export const MAX_BATHS = 4;
const ORD = ["one", "two", "three", "four", "five", "six"];

/** Up to the next 5 minutes. @param {number} m */
const up5 = (m) => Math.ceil(m / 5) * 5;

/**
 * Every part of one visit, in the order it is cleaned, and its price.
 * @param {VisitSettings} s @param {Choice} c @returns {Visit}
 */
export function visit(s, c) {
  const deep = c.freq === "once";
  const t = (/** @type {number} */ m) => (deep ? up5(m * s.deep) : m);
  /** @param {string} id @param {RoomType} r @param {string} name @param {number} min @returns {Part} */
  const part = (id, r, name, min) => ({ id, name, min: t(min), tasks: r.tasks, not: r.not ?? "" });
  const R = s.rooms;
  const rooms = [part("kitchen", R.kitchen, R.kitchen.name, R.kitchen.min), part("hall", R.hall, R.hall.name, R.hall.min)];
  for (let i = 0; i < c.beds; i++) rooms.push(part(`bed${i + 1}`, R.bed, `${R.bed.name} ${ORD[i]}`, i ? R.bed.extraMin ?? R.bed.min : R.bed.min));
  for (let i = 0; i < c.baths; i++) rooms.push(part(i ? `bath${i + 1}` : "bath", R.bath, i ? `${R.bath.name} ${ORD[i]}` : R.bath.name, i ? R.bath.extraMin ?? R.bath.min : R.bath.min));
  /** @type {Part[]} */
  const extras = s.extras.filter((e) => (c.extras ?? []).includes(e.id))
    .map((e) => ({ id: e.id, name: e.name, min: e.perBed ? e.min * c.beds : e.min, tasks: [], not: "", extra: true }));
  const work = [...rooms, ...extras].reduce((n, r) => n + r.min, 0);
  const charged = Math.max(s.minimum, work);
  const rate = s.rates[c.freq];
  return { rooms, extras, work, charged, rate, price: Math.round((charged * rate) / 60), deep };
}

/** The one way a duration is written: "2 h 25", "45 min", "2 h 00". @param {number} m */
export const hm = (m) => (m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}` : `${m} min`);

/** The one way a price is written: "£60", "£1,240". @param {number} n */
export const gbp = (n) => `£${n.toLocaleString("en-GB")}`;

/** "two-bedroom home with one bathroom". @param {Choice} c */
export function homeWords(c) {
  return `${ORD[c.beds - 1]}-bedroom home with ${c.baths === 1 ? "one bathroom" : `${ORD[c.baths - 1]} bathrooms`}`;
}

/** "fortnightly" @param {Freq} f */
export const oftenWords = (f) => ({ week: "weekly", fortnight: "fortnightly", once: "one deep clean" })[f];

/**
 * The line above the strip, and the WhatsApp text, from the same visit.
 * @param {Choice} c @param {Visit} v @param {string} business @returns {{ home: string, figures: string, message: string }}
 */
export function visitWords(c, v, business) {
  const home = `${homeWords(c)}, ${oftenWords(c.freq)}`;
  const figures = `${hm(v.work)}, ${gbp(v.price)}`;
  const extras = v.extras.length ? `, plus ${v.extras.map((e) => e.name.toLowerCase()).join(", ")}` : "";
  return { home, figures, message: `Hello ${business}. A ${home}${extras}: ${figures}. When could you start?` };
}

/** A tick every 5 minutes, a label every 30, none too near the end (which shows the total). @param {number} work */
export function ruler(work) {
  /** @type {{ at: number, label: string|null }[]} */
  const ticks = [];
  for (let m = 0; m <= work; m += 5) ticks.push({ at: (m / work) * 100, label: m % 30 === 0 && m <= work - 12 ? (m ? hm(m) : "0") : null });
  return ticks;
}

/** Whether a choice is one a site offers. @param {any} c */
export function validChoice(c) {
  return !!c && Number.isInteger(c.beds) && c.beds >= 1 && c.beds <= MAX_BEDS && Number.isInteger(c.baths) && c.baths >= 1 && c.baths <= MAX_BATHS && FREQS.includes(c.freq);
}

/** The lowest hourly rate the company charges: from visit.rates, else the services' own rates. @param {any} site @returns {number|null} */
export function fromRate(site) {
  const r = site.visit?.rates && typeof site.visit.rates === "object" ? Object.values(site.visit.rates) : (site.cleans?.items ?? []).map((/** @type {any} */ x) => x?.rate);
  const ok = r.filter((x) => typeof x === "number" && x > 0);
  return ok.length ? Math.min(...ok) : null;
}
