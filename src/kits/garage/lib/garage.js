// @ts-check
import { parseCsv } from "../../../core/lib/sheet.js";
/**
 * The garage kit's pure logic (no DOM), shared by the build and the browser: which free bay fits a car, the words for
 * it, the hall's geometry in metres (bays, the route in through the gate, camera coverage), the drawn plan as SVG,
 * calendar files for moving in and laying up, and the WhatsApp messages. Every size, price, charger and camera comes
 * from the client's site.json; the car sizes are typical ones, and the page says so.
 */

/** Typical sizes in metres, mirrors folded (UK manufacturers' published figures for common models, rounded up). */
export const CARS = {
  hatch: { name: "small hatchback", length: 4.1, width: 1.8 },
  estate: { name: "family estate", length: 4.8, width: 1.85 },
  suv: { name: "large SUV", length: 4.9, width: 2.0 },
  van: { name: "van", length: 5.4, width: 2.05 },
};

/** @typedef {{ n: number, width: number, free?: boolean, price?: number, charger?: number }} Bay */
/** @typedef {{ side: "north"|"south", x: number, bays: Bay[] }} Row */
/** @typedef {{ name: string, width: number, depth: number, bayDepth: number, gate: { y: number, width: number }, rows: Row[], columns?: number[][], unknown?: boolean }} Hall */
/** @typedef {{ name?: string, length: number, width: number }} Car */

/** Room each side a car needs to open its doors: 30 cm, or 40 cm for a car 1.95 m wide or more. @param {Car} car */
export const sideGap = (car) => (car.width >= 1.95 ? 0.4 : 0.3);

/** A car fits a bay with the side room above and 20 cm to spare in length. @param {Car} car @param {Bay} bay @param {number} depth */
export const fits = (car, bay, depth) => bay.width - car.width >= 2 * sideGap(car) - 1e-9 && depth - car.length >= 0.2 - 1e-9;

/**
 * The hall with today's free bays from the live list: a bay is free only if the list says so. Without a live list
 * (null), the hall as the client last listed it. When the live list can't be trusted ("unknown"), no bay is free
 * and the hall is marked unknown, so nothing promises a bay.
 * @param {Hall} hall @param {number[]|null|"unknown"} free
 * @returns {Hall}
 */
export function withFree(hall, free) {
  if (!free) return hall;
  if (free === "unknown") return { ...hall, unknown: true, rows: hall.rows.map((r) => ({ ...r, bays: r.bays.map((b) => ({ ...b, free: false })) })) };
  const set = new Set(free);
  return { ...hall, rows: hall.rows.map((r) => ({ ...r, bays: r.bays.map((b) => ({ ...b, free: set.has(b.n) })) })) };
}

/**
 * The client's published Google Sheet of bays (PARK-1): one row per bay, `bay`, `status` ("free" or "let") and
 * `updated_at`. Fails closed: an unknown bay, an unreadable status, no time or a list older than `staleHours`
 * returns { ok: false }, and the site says when its list was last published instead.
 * @param {string} csv @param {number[]} known the hall's bay numbers @param {number} nowMs @param {number} staleHours
 * @param {(text: string) => number} readTime parses an updated_at cell (the shop's time zone), NaN if unsure
 * @returns {{ ok: true, free: number[], updatedAt: number, soon: { n: number, from: number }[] } | { ok: false }}
 */
export function baysFromCsv(csv, known, nowMs, staleHours, readTime) {
  const rows = parseCsv(csv);
  if (rows.length < 2) return { ok: false };
  const head = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const iBay = head.indexOf("bay"), iStatus = head.indexOf("status"), iTime = head.indexOf("updated_at"), iFrom = head.indexOf("free_from");
  if (iBay < 0 || iStatus < 0 || iTime < 0) return { ok: false };
  /** @type {number[]} */ const free = [];
  /** @type {{ n: number, from: number }[]} */ const soon = [];
  const seen = new Set();
  let updatedAt = 0;
  for (const r of rows.slice(1)) {
    const n = Number(String(r[iBay] ?? "").trim()), st = String(r[iStatus] ?? "").trim().toLowerCase(), t = readTime(String(r[iTime] ?? ""));
    if (!known.includes(n) || seen.has(n) || !["free", "let"].includes(st) || !Number.isFinite(t)) return { ok: false };
    // each row on its own date: one bay updated today doesn't vouch for a bay last touched weeks ago
    if (nowMs - t > staleHours * 3_600_000 || t - nowMs > 10 * 60_000) return { ok: false };
    seen.add(n);
    if (st === "free") free.push(n);
    // a let bay the owner expects back: optional, a date (or date and time) in the free_from column
    const fromText = iFrom < 0 ? "" : String(r[iFrom] ?? "").trim();
    if (fromText && st === "let") {
      const from = readTime(/^\d{4}-\d\d-\d\d$/.test(fromText) ? `${fromText} 09:00` : /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(fromText) ? `${fromText} 09:00` : fromText);
      if (!Number.isFinite(from)) return { ok: false };
      if (from > nowMs && from - nowMs <= 180 * 86_400_000) soon.push({ n, from }); // a past date or one over six months out says nothing
    }
    updatedAt = Math.max(updatedAt, t);
  }
  if (!updatedAt) return { ok: false };
  soon.sort((a, b) => a.from - b.from || a.n - b.n);
  return { ok: true, free, updatedAt, soon };
}

/** "Updated 18:40" today, "Updated yesterday, 18:40", else the date. @param {number} ms @param {number} nowMs @param {string} timeZone */
export function updatedWords(ms, nowMs, timeZone) {
  const day = (/** @type {number} */ t) => new Date(t).toLocaleDateString("en-CA", { timeZone });
  const clock = new Date(ms).toLocaleTimeString("en-GB", { timeZone, hour: "2-digit", minute: "2-digit" });
  if (day(ms) === day(nowMs)) return `Updated ${clock}`;
  if (day(ms) === day(nowMs - 86_400_000)) return `Updated yesterday, ${clock}`;
  return `Updated ${new Date(ms).toLocaleDateString("en-GB", { timeZone, day: "numeric", month: "long" })}, ${clock}`;
}

/** Every bay in the order the hall lists them. @param {Hall} hall @returns {Bay[]} */
export const allBays = (hall) => hall.rows.flatMap((r) => r.bays);

/** The first free bay that fits, in the hall's own order, or null. @param {Hall} hall @param {Car} car */
export function pickBay(hall, car) {
  return allBays(hall).find((b) => b.free === true && fits(car, b, hall.bayDepth)) ?? null;
}

/** Centimetres either side of the car, rounded. @param {Car} car @param {Bay} bay */
export const spareCm = (car, bay) => Math.round(((bay.width - car.width) / 2) * 100 + 1e-6); // 47.4999… is 48

/** "£260" @param {number} n */
export const pounds = (n) => `£${Number.isInteger(n) ? n : n.toFixed(2)}`;

/**
 * The answer line under the picker.
 * @param {Car} car @param {Bay|null} bay @param {number} depth @param {boolean} [unknown] the live list can't be trusted
 * @param {{ n: number, on: string }|null} [next] the first let bay that fits and is expected back, with its date in words
 */
export function answer(car, bay, depth, unknown = false, next = null) {
  if (unknown) return { bay: null, text: `We can’t confirm a free bay right now. Ask us and we’ll check one for your ${car.name ?? "car"}.` };
  if (!bay && next) return { bay: null, text: `No free bay takes a ${car.name ?? "car that size"} today. Bay ${next.n} fits it and should be free from ${next.on}: join the waiting list and we’ll message you.` };
  if (!bay) {
    const tooLong = depth - car.length < 0.2;
    return { bay: null, text: `No free bay takes a ${car.name ?? "car that size"} tonight${tooLong ? `: our bays are ${metres(depth)} deep` : ""}. Join the waiting list and we’ll message you when one opens.` };
  }
  const kw = bay.charger ? `, with a ${bay.charger} kW charger` : "";
  return { bay: bay.n, text: `Bay ${bay.n} takes it, with ${spareCm(car, bay)} cm either side. Free now${kw}.` };
}

/** "5.2 m" @param {number} m */
export const metres = (m) => `${Number(m.toFixed(2))} m`;

/** Arriving at night: the line for the visitor's bay, with the charger only if the bay has one. @param {Car} car @param {Bay|null} bay @param {boolean} [unknown] */
export function nightBayLine(car, bay, unknown = false) {
  if (unknown) return "We can’t confirm a free bay right now: ask us before you come.";
  if (!bay) return `No free bay takes a ${car.name ?? "car that size"} tonight: join the waiting list.`;
  return `Bay ${bay.n} is lit and waiting${bay.charger ? ", its charger on" : ""}.`;
}

/** @param {string} shop @param {Car} car @param {Bay|null} bay @param {boolean} [unknown] @param {{ n: number, on: string }|null} [next] */
export function reserveMessage(shop, car, bay, unknown = false, next = null) {
  if (unknown) return `Hello ${shop}, is there a free bay for my ${car.name ?? "car"}?`;
  if (!bay && next) return `Hello ${shop}, please add me to the waiting list for bay ${next.n} (free from ${next.on}) for my ${car.name ?? "car"}.`;
  return bay
    ? `Hello ${shop}, I’d like to reserve bay ${bay.n} for my ${car.name ?? "car"}.`
    : `Hello ${shop}, please add me to the waiting list for a bay for my ${car.name ?? "car"}.`;
}

/**
 * Each bay's rectangle in hall metres (x along the hall from the gate wall, y from the south wall), its centre and the
 * row it sits in. North-row bays have their back to the north wall; south-row bays to the south wall.
 * @param {Hall} hall
 * @returns {Record<number, { n: number, x0: number, x1: number, y0: number, y1: number, cx: number, cy: number, north: boolean, width: number }>}
 */
export function bayRects(hall) {
  /** @type {Record<number, any>} */ const out = {};
  for (const row of hall.rows) {
    let x = row.x;
    const north = row.side === "north";
    const y0 = north ? hall.depth - hall.bayDepth : 0, y1 = north ? hall.depth : hall.bayDepth;
    for (const b of row.bays) {
      out[b.n] = { n: b.n, x0: x, x1: x + b.width, y0, y1, cx: x + b.width / 2, cy: north ? hall.depth - hall.bayDepth / 2 : hall.bayDepth / 2, north, width: b.width };
      x += b.width;
    }
  }
  return out;
}

/**
 * The drive from outside the gate to the bay: straight along the aisle, one slow turn, nose first into the bay.
 * Points every ~25 cm, with their running distance. @param {Hall} hall @param {number} n @param {number} [startX]
 */
export function route(hall, n, startX = -5.5) {
  const b = bayRects(hall)[n];
  if (!b) return { points: [], lengths: [] };
  const aisle = hall.depth / 2, s = b.north ? 1 : -1;
  const reach = Math.max(1.2, hall.depth / 2 - hall.bayDepth - 0.2);
  /** @type {number[][]} */ const P = [];
  const turnFrom = b.cx - 4.2;
  for (let x = startX; x <= turnFrom; x += 0.25) P.push([x, aisle]);
  const a = [turnFrom, aisle], c1 = [b.cx - 1.6, aisle], c2 = [b.cx, aisle + s * 1.4], e = [b.cx, aisle + s * (reach + 0.8)];
  for (let i = 1; i <= 60; i++) {
    const t = i / 60, u = 1 - t;
    P.push([0, 1].map((k) => u * u * u * a[k] + 3 * u * u * t * c1[k] + 3 * u * t * t * c2[k] + t * t * t * e[k]));
  }
  for (let y = e[1] + s * 0.2; s * (b.cy - y) > 0.01; y += s * 0.2) P.push([b.cx, y]);
  P.push([b.cx, b.cy]);
  const L = [0];
  for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  return { points: P.map((p) => p.map((v) => Math.round(v * 1000) / 1000)), lengths: L };
}

/** The point and heading at a distance along a route. @param {{ points: number[][], lengths: number[] }} r @param {number} d */
export function along(r, d) {
  const { points: P, lengths: L } = r;
  let i = L.findIndex((v) => v >= d);
  if (i <= 0) i = d <= 0 ? 1 : L.length - 1;
  while (i > 1 && L[i] - L[i - 1] < 1e-9) i--; // a heading needs a segment with length
  const t = Math.min(1, Math.max(0, (d - L[i - 1]) / (L[i] - L[i - 1] || 1))), a = P[i - 1], b = P[i];
  return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, dx: b[0] - a[0], dy: b[1] - a[1] };
}

/** A camera's coverage on the floor, as a fan of points. @param {{ x: number, y: number, facing: number }} c @param {number} [r] @param {number} [half] */
export function cone(c, r = 7.2, half = 0.62) {
  const a = (c.facing * Math.PI) / 180, pts = [[c.x, c.y]];
  for (let i = 0; i <= 16; i++) { const t = a - half + (2 * half * i) / 16; pts.push([c.x + r * Math.cos(t), c.y + r * Math.sin(t)]); }
  return pts.map((p) => p.map((v) => Math.round(v * 100) / 100));
}

/** "22:00" → "10pm", "07:30" → "7.30am" @param {string} hhmm */
export function clockWords(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const ap = h < 12 ? "am" : "pm", h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? `.${String(m).padStart(2, "0")}` : ""}${ap}`;
}

/** @param {{ plugInBy: string, readyBy: string }} c */
export const chargedBy = (c) => `Plug in by ${clockWords(c.plugInBy)}, charged by ${clockWords(c.readyBy)}.`;

/** The hall's chargers in words: "Six bays with chargers: five at 7 kW, bay 14 at 22 kW." @param {Hall} hall */
export function chargerWords(hall) {
  const ch = allBays(hall).filter((b) => b.charger);
  if (!ch.length) return "";
  const by = /** @type {Record<number, number[]>} */ ({});
  for (const b of ch) (by[/** @type {number} */ (b.charger)] ??= []).push(b.n);
  const NUM = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
  const word = (/** @type {number} */ n) => NUM[n] ?? String(n);
  const parts = Object.entries(by).sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([kw, ns]) => (ns.length === 1 ? `bay\u00a0${ns[0]} at ${kw}\u00a0kW` : `${word(ns.length)} at ${kw}\u00a0kW`));
  const head = `${word(ch.length).replace(/^./, (c) => c.toUpperCase())} ${ch.length === 1 ? "bay" : "bays"} with ${ch.length === 1 ? "a charger" : "chargers"}`;
  return parts.length === 1 && ch.length === 1 ? `${head}: ${parts[0]}.` : `${head}: ${parts.join(", ")}.`;
}

/* ------------------------------------------------------------------ the drawn plan (Signature standard) */

const esc = (/** @type {string} */ s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);

/**
 * The hall as an architect's plan, in metres (1 unit = 1 m; y down from the north wall), drawn at build time. Bays
 * carry data-bay so the browser can light the ones that fit; chargers and cameras are groups the layers show.
 * Colours come from CSS classes only (the look's tokens), never written here.
 * @param {Hall} hall @param {{ cameras?: { x: number, y: number, facing: number }[] }} [opt]
 */
export function planSvg(hall, opt = {}) {
  const W = hall.width, H = hall.depth, T = 0.3, m = 1.6;
  const Y = (/** @type {number} */ y) => +(H - y).toFixed(3);
  const r = bayRects(hall), bays = allBays(hall);
  const out = [`<svg class="gp-svg" viewBox="${-m - T} ${-m} ${W + 2 * m + 2 * T} ${H + 2 * m + 0.6}" role="img" aria-labelledby="gp-title"><title id="gp-title">${esc(hall.name)}, drawn to scale: ${bays.length} bays in two rows, the gate on the left</title>`];
  // walls with the gate opening on the west wall
  const g0 = Y(hall.gate.y + hall.gate.width / 2), g1 = Y(hall.gate.y - hall.gate.width / 2);
  out.push(`<g class="gp-wall"><rect x="${-T}" y="${-T}" width="${W + 2 * T}" height="${T}"/><rect x="${-T}" y="${H}" width="${W + 2 * T}" height="${T}"/><rect x="${W}" y="${-T}" width="${T}" height="${H + 2 * T}"/><rect x="${-T}" y="${-T}" width="${T}" height="${g0 + T}"/><rect x="${-T}" y="${g1}" width="${T}" height="${H - g1 + T}"/></g>`);
  out.push(`<text class="gp-gate" x="${-T - 0.25}" y="${((g0 + g1) / 2 + 0.15).toFixed(2)}" text-anchor="end">gate</text>`);
  for (const c of hall.columns ?? []) out.push(`<rect class="gp-col" x="${c[0] - 0.22}" y="${Y(c[1]) - 0.22}" width=".44" height=".44"/>`);
  for (const b of bays) {
    const q = r[b.n], y = Y(q.y1);
    out.push(`<g class="gp-bay${b.free ? " is-free" : ""}" data-bay="${b.n}"><rect class="gp-cell" x="${q.x0}" y="${y}" width="${b.width}" height="${hall.bayDepth}"/>`
      + `<rect class="gp-car" x="${(q.cx - 0.9).toFixed(2)}" y="${(Y(q.cy) - 2.3).toFixed(2)}" width="1.8" height="4.6" rx=".5"/>`
      + `<text class="gp-n" x="${q.cx}" y="${(q.north ? y + hall.bayDepth + 0.75 : y - 0.35).toFixed(2)}" text-anchor="middle">${b.n}</text></g>`);
    if (b.charger) {
      const cy = q.north ? Y(hall.depth) + 0.35 : Y(0) - 0.35;
      out.push(`<g class="gp-ch" data-charger="${b.n}"><circle cx="${(q.x1 - 0.4).toFixed(2)}" cy="${cy.toFixed(2)}" r=".16"/><text x="${(q.x1 - 0.65).toFixed(2)}" y="${(cy + 0.14).toFixed(2)}" text-anchor="end">${b.charger} kW</text></g>`);
    }
  }
  for (const [i, c] of (opt.cameras ?? []).entries()) {
    const pts = cone(c).map(([x, y]) => `${x},${Y(y)}`).join(" ");
    out.push(`<g class="gp-cam" data-camera="${i + 1}"><polygon points="${pts}"/><circle cx="${c.x}" cy="${Y(c.y)}" r=".2"/></g>`);
  }
  // scale bar: 5 m
  out.push(`<g class="gp-scale"><rect x="${W - 5}" y="${H + 0.9}" width="5" height=".09"/><text x="${W - 5}" y="${H + 1.55}">0</text><text x="${W}" y="${H + 1.55}" text-anchor="end">5 m</text></g>`);
  out.push("</svg>");
  return out.join("");
}

/* ------------------------------------------------------------------ calendar files (nothing stored) */

/** "2026-11-23" + 3 days @param {string} ymd @param {number} n */
export function addDays(ymd, n) {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** "Monday 23 November" @param {string} ymd */
export function dayWords(ymd) {
  return new Date(`${ymd}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}

/** @param {string} s */
const icsText = (s) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

/**
 * An all-day .ics file. @param {string} shop @param {{ date: string, title: string, note?: string }[]} events
 * @param {string} stamp "20261117T090000Z" (passed in, so the same input always makes the same file)
 */
export function icsFile(shop, events, stamp) {
  const slug = shop.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Sitefloor//${icsText(shop)}//EN`, "CALSCALE:GREGORIAN"];
  events.forEach((e, i) => {
    const d = e.date.replace(/-/g, ""), next = addDays(e.date, 1).replace(/-/g, "");
    lines.push("BEGIN:VEVENT", `UID:${d}-${i}-${slug}@sitefloor`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${next}`, `SUMMARY:${icsText(e.title)}`);
    if (e.note) lines.push(`DESCRIPTION:${icsText(e.note)}`);
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

/**
 * Moving in (PARK-12): the client's own steps, each a number of days from the start date (negative = before).
 * @param {string} start @param {{ day: number, title: string, note?: string }[]} steps
 */
export const moveInEvents = (start, steps) => steps.map((s) => ({ date: addDays(start, s.day), title: s.title, ...(s.note ? { note: s.note } : {}) })).sort((a, b) => a.date.localeCompare(b.date));

/**
 * Laying up (PARK-13): a care visit every `every` days while the car is away, and the day it comes back.
 * @param {string} from @param {string} to @param {{ every: number, visit: string, back: string }} cfg
 */
export function layingUpEvents(from, to, cfg) {
  if (!(from < to)) return [];
  /** @type {{ date: string, title: string }[]} */ const out = [];
  for (let d = addDays(from, cfg.every); d < to && out.length < 24; d = addDays(d, cfg.every)) out.push({ date: d, title: cfg.visit });
  out.push({ date: to, title: cfg.back });
  return out;
}

/** The business enquiry (PARK-14) as one WhatsApp message. @param {string} shop @param {{ company?: string, vehicles?: string, when?: string, invoice?: boolean, note?: string }} f */
export function fleetMessage(shop, f) {
  const bits = [`Hello ${shop}, a business enquiry${f.company ? ` from ${f.company}` : ""}.`];
  if (f.vehicles) bits.push(`Vehicles: ${f.vehicles}.`);
  if (f.when) bits.push(`Access: ${f.when}.`);
  if (f.invoice) bits.push("We’d like a monthly invoice.");
  if (f.note) bits.push(f.note.trim());
  return bits.join(" ");
}

/** "Your car this month" (PARK-18): the message asking for a car's card. @param {string} shop @param {number|string} bay */
export const careCardMessage = (shop, bay) => `Hello ${shop}, could you send this month’s check for the car in bay ${bay}?`;

/**
 * The first let bay expected back (from the sheet's free_from) that fits the car, with its date in words, or null.
 * @param {Hall} hall @param {Car} car @param {{ n: number, from: number }[]} soon @param {string} timeZone
 */
export function nextFit(hall, car, soon, timeZone) {
  const s = soon.find((x) => { const b = allBays(hall).find((y) => y.n === x.n); return !!b && fits(car, b, hall.bayDepth); });
  return s ? { n: s.n, on: dateWords(s.from, timeZone) } : null;
}

/** "14 December" @param {number} ms @param {string} timeZone */
export const dateWords = (ms, timeZone) => new Date(ms).toLocaleDateString("en-GB", { timeZone, day: "numeric", month: "long" });

/** "Coming free: bay 12 from 14 December and bay 5 from 2 January." or "". @param {{ n: number, from: number }[]} soon @param {string} timeZone */
export function soonLine(soon, timeZone) {
  if (!soon.length) return "";
  const parts = soon.slice(0, 3).map((s) => `bay ${s.n} from ${dateWords(s.from, timeZone)}`);
  return `Coming free: ${parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}` : parts[0]}.`;
}
