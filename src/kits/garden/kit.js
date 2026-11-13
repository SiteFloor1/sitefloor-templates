// @ts-check
/**
 * The garden kit (garden designers and landscapers): everything the shared build needs to know about it, in one file.
 * src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so adding or changing this kit never
 * edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 */
import { checkGarden } from "./config.js";

const D = "src/kits/garden/features";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- garden designers and landscapers (trade/landscaping) ---
  { id: "the-year", dir: `${D}/the-year`, minPlan: "starter", kits: ["garden"], requires: ["year"], js: true,
    summary: "The year in twelve plants from the studio's own gardens, as tall photographs side by side; the visitor's month stands open with its name across it, and any other opens with a tap or the arrow keys." },
  { id: "garden-calendar", section: "month", dir: `${D}/garden-calendar`, minPlan: "starter", kits: ["garden"], requires: ["calendar"], js: true,
    summary: "The studio's month: what it is designing, building, planting and caring for now, following the month chosen above, and the next design and build start, hidden by itself once it is out of date." },
  { id: "what-we-do", section: "whatWeDo", dir: `${D}/what-we-do`, minPlan: "starter", kits: ["garden"], requires: ["whatWeDo"], js: false,
    summary: "Design, build and care in a line each, so a visitor knows straight away which the studio does, each to its own page when it has one." },
  { id: "gardens", section: "gardens", dir: `${D}/gardens`, minPlan: "starter", kits: ["garden"], requires: ["gardens"], js: true,
    summary: "The studio's gardens by kind (courtyards, roof terraces, family and country gardens), each with where it is, its size and which way it faces." },
  "before-after",
  { id: "calendar-page", dir: `${D}/calendar-page`, minPlan: "plus", kits: ["garden"], requires: ["calendar", "calendarPage"], needs: ["garden-calendar"], page: "calendar", js: true,
    summary: "The garden calendar: the studio's whole year month by month, and \"ready by\": pick the month you want the garden finished and see the day to get in touch, worked back from the studio's own weeks, sent on WhatsApp." },
  { id: "planting-palette", dir: `${D}/planting-palette`, minPlan: "plus", kits: ["garden"], requires: ["palette"], page: "planting", js: true,
    summary: "The planting palette: the plants the studio uses, each with the months it looks its best, the light it wants and how much care it needs, found by month and by sun or shade." },
  { id: "design-process", dir: `${D}/design-process`, minPlan: "plus", kits: ["garden"], requires: ["process"], page: "design-process", js: false,
    summary: "How a design runs: each stage, what you receive at it, the studio's typical weeks, and where you can stop and take the drawings to your own builder." },
  { id: "garden-pages", dir: `${D}/garden-pages`, minPlan: "plus", kits: ["garden"], requires: ["gardens", "gardenPages"], needs: ["gardens"], page: "gardens", morePages: ["garden"], collection: true, js: true,
    summary: "Every garden on one page by kind, and a page for each: the brief, the garden, the plants and materials in it (a collection, counted as one page)." },
  { id: "design-build-care", dir: `${D}/design-build-care`, minPlan: "plus", kits: ["garden"], requires: ["whatWeDo", "servicePages"], needs: ["what-we-do"], page: "service", collection: true, js: false,
    summary: "A page each for design, build and care, in the studio's words, with the facts a client asks first (counted as one page)." },
  { id: "materials", dir: `${D}/materials`, minPlan: "plus", kits: ["garden"], requires: ["materials"], page: "materials", js: true,
    summary: "The sample table: the stone, brick, gravel, timber and steel the studio builds with, as photographs on one board; touch one and it becomes the garden it was laid in, and ask for samples on WhatsApp." },
  { id: "garden-journal", dir: `${D}/garden-journal`, minPlan: "plus", kits: ["garden"], requires: ["journal"], page: "journal", morePages: ["article"], js: false,
    summary: "The journal: the studio's own dated articles (what to plant each season, designing a small garden, caring for a new lawn), each on its own page with its sources." },
  { id: "through-the-year", section: "throughYear", dir: `${D}/through-the-year`, minPlan: "signature", kits: ["garden"], requires: ["throughYear", "gardens"], optional: ["palette"], js: true,
    summary: "A garden through the year: one of the studio's gardens photographed from the same spot month after month; a month scale under it moves between them (tap or arrow keys), and names what is at its best from the planting palette." },
  { id: "sun-study", dir: `${D}/sun-study`, minPlan: "signature", kits: ["garden"], requires: ["sun"], optional: ["palette"], page: "where-the-sun-falls", js: true,
    summary: "Where the sun falls: the visitor's garden size, which way it faces and the house and fence heights; the plan shows hours of sun across the garden on the 21st of any month and the shadows at any hour, in plan or in 3D, with a plain answer and the plants from the palette for the spot they tap." },
  { id: "maintenance-plans", dir: `${D}/maintenance-plans`, minPlan: "signature", kits: ["garden"], requires: ["maintenance"], page: "maintenance", js: true,
    summary: "Maintenance plans laid on the year: which months each plan visits and what the studio does in each, the studio's own price if it publishes one, and \"Ask about this plan\" on WhatsApp with the garden's size and postcode." },
  { id: "style-pages", dir: `${D}/style-pages`, minPlan: "signature", kits: ["garden"], requires: ["gardens", "stylePages"], needs: ["gardens"], page: "style", collection: true, js: false,
    summary: "A page for each kind of garden the studio makes (roof terraces, courtyards, country estates), with its gardens (counted as one page)." },
  { id: "permission-guide", dir: `${D}/permission-guide`, minPlan: "signature", kits: ["garden"], requires: ["planning"], page: "permission", js: false,
    summary: "Do I need permission? Fences, decking, garden rooms and front gardens in plain words from GOV.UK, with the day it was checked, the sources and \"a guide, not a decision\"." },
];

/** Shared features only some trades offer, that this one does. */
export const uses = ["before-after"];
/**
 * Features offered on client sites only, so no demo shows them: through-the-year needs one real garden photographed from
 * the same spot all year; before/after needs the client's own pair of one place.
 */
export const clientOnly = ["through-the-year", "before-after"];
/** Shared features this trade doesn't offer. */
export const refuses = ["seasonal", "work", "photo-band", "page-links", "gallery", "vouchers"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkGarden;

/** Top-level site.json keys the kit's pages read that no feature lists. */
export const settings = [];

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** @param {any} site */
export function pageData(site) {
  const on = (/** @type {string} */ id) => site.features.includes(id);
  const n = site.calendar?.nextStart;
  return {
    month: on("garden-calendar") ? { nextStart: n ? { updated: n.updated, staleAfterDays: n.staleAfterDays ?? 45 } : null } : null,
    startBy: on("calendar-page") && site.calendarPage.startBy ? site.calendarPage.startBy : null,
    materials: on("materials") ? { message: site.materials.message } : null,
    maintenance: on("maintenance-plans") ? { message: site.maintenance.message, plans: site.maintenance.plans.map((/** @type {any} */ p) => ({ id: p.id, name: p.name })) } : null,
    sun: on("sun-study") ? {
      lat: site.sun.lat, lng: site.sun.lng, tz: site.hours.timezone, message: site.sun.message, garden: site.sun.garden,
      plants: on("planting-palette") || site.palette ? (site.palette?.items ?? []).map((/** @type {any} */ p) => ({ id: p.id, name: p.name, light: p.light, months: p.months })) : [],
    } : null,
  };
}
