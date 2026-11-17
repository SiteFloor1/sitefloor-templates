// @ts-check
/**
 * The tourism kit (independent tour operators): everything the shared build needs to know about it, in one file.
 * src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so adding or changing this kit
 * never edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 */
import { checkTourism } from "./config.js";
import { COUNTRIES } from "./lib/countries.js";
import { drawMap, routeShares } from "./lib/tourism.js";

const K = "src/kits/tourism/features";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- tourism (trade/tourism) ---
  // Small tailor-made tour operators who sell journeys by phone, WhatsApp and email. Starter: the journeys with an
  // enquiry each, the ATOL number as the operator gives it, and the local time and gap to London. Plus: the logbook
  // (each journey day by day with its route drawn on the country), the year drawn (which journeys fit), when to go,
  // daylight, the shortlist and who's been there. Signature: the journey of the month, the trip builder, typical
  // weather, the travel-ready checklist and the private trip page by code.
  { id: "tourism-journeys", section: "journeys", dir: `${K}/tourism-journeys`, minPlan: "starter", kits: ["tourism"], requires: ["journeys"], js: false,
    summary: "The journeys (TOUR-1): each with its photograph, where, nights, best months and the operator's own 'from' price, and an enquiry on WhatsApp that names the journey." },
  { id: "tourism-atol", section: "atol", dir: `${K}/tourism-atol`, minPlan: "starter", kits: ["tourism"], requires: ["atol"], js: false,
    summary: "The ATOL number (TOUR-2), exactly as the operator's certificate gives it, on the home page and in the footer of every page, with the operator's own words and a link to their booking terms." },
  { id: "tourism-local-time", dir: `${K}/tourism-local-time`, minPlan: "starter", kits: ["tourism"], requires: ["journeys"], js: true,
    summary: "Local time and the gap to London for the place on show (\"Local time 22:08 · 3 hours behind London\"), from the browser's own time-zone data, kept current." },
  { id: "tourism-logbook", dir: `${K}/tourism-logbook`, minPlan: "plus", kits: ["tourism"], requires: ["journeys"], page: "journey", collection: true, js: true,
    summary: "The logbook (TOUR-5): a page per journey, day by day, with the country drawn from Natural Earth and the route drawing itself to the stop you choose; the home page opens on one journey the same way. The journeys count as one page." },
  { id: "tourism-finder", section: "finder", dir: `${K}/tourism-finder`, minPlan: "plus", kits: ["tourism"], requires: ["journeys"], js: true,
    summary: "The year, drawn (TOUR-3): every journey as a row of twelve months, a solid line when the operator would go; pick a month, who's going and roughly how long, and the journeys that fit come to the top. Says so when nothing fits." },
  { id: "tourism-when", dir: `${K}/tourism-when`, minPlan: "plus", kits: ["tourism"], requires: ["when"], page: "when-to-go", js: false,
    summary: "When to go (TOUR-4): the operator's places by month, the months they'd choose underlined; with typical weather on, each month's typical high from the named source." },
  { id: "tourism-daylight", dir: `${K}/tourism-daylight`, minPlan: "plus", kits: ["tourism"], requires: ["journeys"], needs: ["tourism-logbook"], js: true,
    summary: "Daylight on each journey page: sunrise, sunset and hours of light at every stop for the month you pick, worked out astronomically in the browser." },
  { id: "tourism-shortlist", dir: `${K}/tourism-shortlist`, minPlan: "plus", kits: ["tourism"], requires: ["journeys"], needs: ["tourism-journeys"], js: true,
    summary: "The shortlist: keep journeys as you read, then send the list on WhatsApp in one message. Kept only in this browser." },
  { id: "tourism-experts", dir: `${K}/tourism-experts`, minPlan: "plus", kits: ["tourism"], requires: ["experts"], page: "experts", js: false,
    summary: "Who's been there: the operator's travel experts, each with the places they've travelled in their own words, and the places listed with who has been." },
  { id: "tourism-month", dir: `${K}/tourism-month`, minPlan: "signature", kits: ["tourism"], requires: ["journeys"], needs: ["tourism-logbook"], js: true,
    summary: "The journey of the month: the home page opens on the operator's pick for this month, with four journeys beneath as a quiet index; choose one and the logbook, the photograph and the map change in place." },
  { id: "tourism-builder", dir: `${K}/tourism-builder`, minPlan: "signature", kits: ["tourism"], requires: ["builder"], page: "plan", js: true,
    summary: "The trip builder (TOUR-6): the operator's regions with the nights they suggest; add regions and nights, the month and who's going, and send it as one WhatsApp message. No prices unless the operator quotes." },
  { id: "tourism-weather", dir: `${K}/tourism-weather`, minPlan: "signature", kits: ["tourism"], requires: ["climate"], needs: ["tourism-when"], js: false,
    summary: "Typical weather (TOUR-7): each month's typical high on When to go and on journey pages, always \"typical\" and always naming its source and period; never a forecast." },
  { id: "tourism-checklist", dir: `${K}/tourism-checklist`, minPlan: "signature", kits: ["tourism"], requires: ["ready"], page: "ready", js: true,
    summary: "Ready to travel (TOUR-8): the operator's own list to tick before you go (kept in this browser), and each country's gov.uk foreign travel advice linked, never retold." },
  { id: "tourism-trip", dir: `${K}/tourism-trip`, minPlan: "signature", kits: ["tourism"], requires: ["trip", "journeys"], needs: ["tourism-logbook"], page: "your-trip", unlisted: true, js: true,
    summary: "Your trip, by code: the code the operator sends opens the journey, the start date, the days to go and the checklist. From the operator's published sheet, which holds only a code, a journey, a start date, how many are travelling and when it was updated; nothing personal." },
];

// A journey sells on its own photographs and words; nothing here needs a photo feed, a team grid or a voucher.
export const refuses = ["gallery", "work", "team", "photo-band", "page-links", "seasonal", "vouchers"];
// Reviews only ever come from the operator's own Google reviews.
export const clientOnly = ["reviews"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkTourism;

/**
 * A journey's drawn map: its country's outline and the route through its stops (with any places it passes through),
 * and how far along the route each stop sits, so the line can draw itself to the stop chosen.
 * @param {any} j
 */
export function journeyMap(j) {
  /** @type {{ name: string, lat: number, lon: number, stop?: number }[]} */ const pts = [];
  j.stops.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    for (const v of (j.via ?? []).filter((/** @type {any} */ v) => v.before === i)) pts.push({ name: v.name, lat: v.lat, lon: v.lon });
    const last = pts[pts.length - 1];
    if (last && last.lat === s.lat && last.lon === s.lon) { last.stop ??= i; return; } // two stops in one place
    pts.push({ name: s.place, lat: s.lat, lon: s.lon, stop: i });
  });
  const m = drawMap(COUNTRIES[j.country], pts);
  const shares = routeShares(m.pts);
  const at = j.stops.map((/** @type {any} */ s) => {
    const k = pts.findIndex((p) => p.lat === s.lat && p.lon === s.lon);
    return { share: shares[k] ?? 0, point: k };
  });
  // Labels: stops first, then places passed through. Each tries the right of its dot, then the left; one that would
  // still sit on another label or dot stays unlabelled (its dot stays). Sizes are estimated in map units for a 13px
  // label at the size this map is usually drawn (tall maps fill a column's height, wide ones its width).
  const u = m.tall ? 1.4 : 3.6, ch = 7 * u, lh = 18 * u, gap = 12 * u;
  const order = [...m.pts.keys()].sort((a, b) => Number(pts[b].stop !== undefined) - Number(pts[a].stop !== undefined) || a - b);
  /** @type {number[][]} */ const boxes = m.pts.map((p) => [p.xy[0] - 6 * u, p.xy[1] - 6 * u, p.xy[0] + 6 * u, p.xy[1] + 6 * u]);
  /** @type {(""|"right"|"left")[]} */ const side = m.pts.map(() => "");
  const hits = (/** @type {number[]} */ b, /** @type {number} */ self) => boxes.some((o, k) => k !== self && b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]);
  for (const k of order) {
    const [x, y] = m.pts[k].xy, w = m.pts[k].name.length * ch;
    const right = [x + gap, y - lh / 2, x + gap + w, y + lh / 2], left = [x - gap - w, y - lh / 2, x - gap, y + lh / 2];
    const pick = !hits(right, k) && right[2] <= m.width * 1.35 ? right : !hits(left, k) && left[0] >= -m.width * 0.35 ? left : null;
    if (pick) { side[k] = pick === right ? "right" : "left"; boxes.push(pick); }
  }
  const points = m.pts.map((p, k) => ({ name: p.name, x: m.width ? Math.round((p.xy[0] / m.width) * 1000) / 10 : 50, y: m.height ? Math.round((p.xy[1] / m.height) * 1000) / 10 : 50,
    major: pts[k].stop !== undefined, label: side[k] !== "", left: side[k] === "left" }));
  return { land: m.land, route: m.route, width: m.width, height: m.height, tall: m.tall, at, points };
}

/** Which journey a month opens on: the operator's pick, else the hero's journey, else the first. @param {any} site @param {number} month 1–12 */
export function journeyFor(site, month) {
  const items = site.journeys?.items ?? [];
  const pick = site.journeys?.monthly?.[String(month)];
  return { id: pick ?? site.hero?.journey ?? items[0]?.id, ofMonth: Boolean(pick) };
}

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** @param {any} site */
export function pageData(site) {
  const on = (/** @type {string} */ id) => site.features.includes(id);
  const items = site.journeys?.items ?? [];
  const t = site.trip;
  return {
    tourism: {
      name: site.business.name,
      journeys: items.map((/** @type {any} */ j) => ({ id: j.id, name: j.name, nights: j.nights, go: j.go, who: j.who })),
      monthly: on("tourism-month") ? site.journeys.monthly : null,
      fallback: site.hero?.journey ?? items[0]?.id ?? null,
      trip: on("tourism-trip") ? { source: t.source, csvUrl: t.csvUrl, staleAfterDays: t.staleAfterDays ?? 14, example: site.mode === "demo" ? t.example : undefined } : null,
    },
  };
}

/**
 * Live data: the private trip page reads a simulated trip on a demo (src/demo), the operator's published sheet otherwise.
 * @type {import("../../features/registry.js").Provider[]}
 */
export const providers = [
  {
    key: "trip",
    on: (site, enabled) => enabled.has("tourism-trip"),
    simulated: (site) => site.trip?.source === "simulated",
    demo: { from: "src/demo/trip-provider.js", name: "simulatedTrip" },
    live: { from: "src/kits/tourism/features/tourism-trip/sheet-provider.js", name: "sheetTrip" },
  },
];

/** What this kit adds to the site's Content-Security-Policy. @param {any} site @returns {import("../../features/registry.js").KitCsp} */
export function csp(site) {
  return { sheets: site.features?.includes("tourism-trip") && site.trip?.source === "sheet" };
}
