// @ts-check
/**
 * The detailing kit (paint correction, ceramic coating, paint protection film, interiors): everything the shared build
 * needs to know about it, in one file. src/features/registry.js finds this file by itself, so adding or changing this
 * kit never edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 */
import { checkDetailing } from "./config.js";

const D = "src/kits/detailing/features";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  { id: "packages", section: "packages", dir: `${D}/packages`, minPlan: "starter", kits: ["detailing"], requires: ["sizes", "packages"], js: true,
    summary: "Packages by the size of your car: pick a size and every package shows its \"from\" price and how many days the car stays, from the studio's own prices." },
  { id: "availability", section: "availability", dir: `${D}/availability`, minPlan: "starter", kits: ["detailing"], requires: ["availability", "packages"], needs: ["packages"], js: true,
    summary: "The next start for each package: the first run of free working days long enough for the job, from the studio's diary sheet, and one tap to ask for it on WhatsApp. A stale or unreadable sheet shows no date rather than a wrong one." },
  { id: "first-wash", section: "firstWash", dir: `${D}/first-wash`, minPlan: "starter", kits: ["detailing"], requires: ["care"], js: true,
    summary: "The first wash and care after handover: pick the day you collect and the studio's own care steps go into your phone's calendar, each at 9am on its day." },
  { id: "due-check", section: "dueCheck", dir: `${D}/due-check`, minPlan: "starter", kits: ["detailing"], requires: ["dueCheck"], js: true,
    summary: "Is my car due? Pick what was last done and when: the studio's own interval gives the day it's due, how long until (or how overdue), a reminder for the calendar and a WhatsApp to book it." },
  "before-after",
  { id: "coating-explained", section: "explained", dir: `${D}/coating-explained`, minPlan: "plus", kits: ["detailing"], requires: ["explained"], js: false,
    summary: "Ceramic coating and paint protection film explained side by side: what each does and what it doesn't, in the studio's words, beside a photograph of water on coated paint." },
  { id: "package-builder", section: "builder", dir: `${D}/package-builder`, minPlan: "plus", kits: ["detailing"], requires: ["sizes", "packages", "addOns", "builder"], needs: ["packages"], js: true,
    summary: "Build your package: your car's size, one package and any extras add up to a \"from\" price and days with the studio, sent on WhatsApp. Extras the studio hasn't priced for that size are marked to quote, never guessed." },
  { id: "collection", section: "collection", dir: `${D}/collection`, minPlan: "plus", kits: ["detailing"], requires: ["collection"], js: true,
    summary: "Collection and delivery: type a postcode and pick a day; the studio's sheet says whether it collects from that district on that day, and the charge if it gives one. Stale or unreadable means \"ask us\", never a wrong yes." },
  { id: "maintenance", section: "maintenance", dir: `${D}/maintenance`, minPlan: "plus", kits: ["detailing"], requires: ["maintenance"], js: true,
    summary: "Maintenance plans: the studio's wash plans with a monthly plan joined through its own Stripe Payment Link, and the visits in your calendar as one repeating entry; booking stays a WhatsApp message." },
  { id: "car-progress", section: "progress", dir: `${D}/car-progress`, minPlan: "signature", kits: ["detailing"], requires: ["progress"], page: "your-car", js: true,
    summary: "Your car, in the bay: type the code from your booking text and see which stage it has reached, the studio's latest note and photo, and the handover, from the studio's sheet. No names or registrations in the sheet; an unknown code or stale sheet shows nothing." },
  { id: "paint-request", section: "paintRequest", dir: `${D}/paint-request`, minPlan: "signature", kits: ["detailing"], requires: ["paintRequest"], js: true,
    summary: "Send us your paint: the car, its colour, what bothers you and how it's kept, sent on WhatsApp with a list of the photos to send next, so the studio can say what the paint needs before you come in." },
  { id: "correction-3d", section: "correction3d", dir: `${D}/correction-3d`, minPlan: "signature", kits: ["detailing"], requires: ["correction"], js: true,
    summary: "Paint correction on a 3D car: a photograph first, then on tap your size of car (SUV, saloon or hatch) under the studio's strip light, swirled on one side of a tape line and corrected on the other; drag the light along it. Labelled as an illustration." },
  { id: "protection-3d", section: "protection3d", dir: `${D}/protection-3d`, minPlan: "signature", kits: ["detailing"], requires: ["protection", "filmPrices"], js: true,
    summary: "The film-coverage builder: your size of car in 3D (SUV, saloon or hatch) and a film package (front end, full front, track pack, full body); the covered panels light up, the price and days come from the studio's own price sheet, and the choice goes to the studio on WhatsApp." },
  { id: "inspection-light", dir: `${D}/inspection-light`, minPlan: "signature", kits: ["detailing"], requires: ["inspection"], js: true,
    summary: "The inspection light, as the hero: drag a strip light across the studio's own matched pair (one panel, the same light and framing, before and after) and the corrected paint shows under it. Only with a real pair." },
  { id: "paint-chart", dir: `${D}/paint-chart`, minPlan: "signature", kits: ["detailing"], requires: ["paintChart"], js: false,
    summary: "Your colour on the 3D car: the studio's paint chart (names, colours and finishes from its sheet) as swatches under each 3D stage; the car repaints in the chosen one, labelled approximate on screen." },
  { id: "lease-return", dir: `${D}/lease-return`, minPlan: "signature", kits: ["detailing"], requires: ["leaseReturn", "leasePrices"], page: "lease-return", js: true,
    summary: "The lease-return check: what an end-of-lease inspection usually looks at, from the BVRLA Fair Wear & Tear Standard for Cars (date checked, linked); tick what your car has and the studio's own prices add up, with \"Ask us\" for anything it hasn't priced, sent on WhatsApp." },
  { id: "wheels-page", dir: `${D}/wheels-page`, minPlan: "plus", kits: ["detailing"], requires: ["wheelsPage"], page: "wheels-and-calipers", js: false,
    summary: "Wheels and calipers: what the studio does, how it goes, its \"from\" prices by car size and a question on WhatsApp." },
  { id: "interior-page", dir: `${D}/interior-page`, minPlan: "plus", kits: ["detailing"], requires: ["interiorPage"], page: "interior", js: false,
    summary: "Interior detailing: what's included, how it goes, \"from\" prices by car size and a question on WhatsApp." },
  { id: "new-car-page", dir: `${D}/new-car-page`, minPlan: "plus", kits: ["detailing"], requires: ["newCarPage"], page: "new-car-protection", js: false,
    summary: "New-car protection: collected from the dealer or delivered to the studio, prepared and protected before the first mile; what's included and \"from\" prices." },
  { id: "selling-page", dir: `${D}/selling-page`, minPlan: "plus", kits: ["detailing"], requires: ["sellingPage"], page: "selling-your-car", js: false,
    summary: "Selling your car? A sale preparation: what buyers look at, what the studio does before the photographs, and \"from\" prices." },
  { id: "packages-page", dir: `${D}/packages-page`, minPlan: "plus", kits: ["detailing"], requires: ["packagesPage"], needs: ["packages"], page: "packages", js: false,
    summary: "A page for the packages and the builder, so the home page stays short." },
  { id: "coating-page", dir: `${D}/coating-page`, minPlan: "plus", kits: ["detailing"], requires: ["coatingPage", "explained"], page: "ceramic-coating", js: false,
    summary: "Ceramic coating: what it does and doesn't, in the studio's words, and the packages that include it." },
  { id: "film-page", dir: `${D}/film-page`, minPlan: "plus", kits: ["detailing"], requires: ["filmPage", "explained"], page: "paint-protection-film", js: false,
    summary: "Paint protection film: what it stops and what it doesn't, the coverages, and the packages that include it." },
  { id: "book-page", dir: `${D}/book-page`, minPlan: "plus", kits: ["detailing"], requires: ["bookPage"], page: "book", js: false,
    summary: "Book: the next start for each package, the builder and the paint request on one page." },
  { id: "correction-page", dir: `${D}/correction-page`, minPlan: "signature", kits: ["detailing"], requires: ["correctionPage", "correction"], page: "paint-correction", js: false,
    summary: "Paint correction: what each step does, in the studio's words, and the correction on a 3D car." },
  { id: "maintenance-page", dir: `${D}/maintenance-page`, minPlan: "signature", kits: ["detailing"], requires: ["maintenancePage"], needs: ["maintenance"], page: "maintenance", js: false,
    summary: "Maintenance plans: each of the studio's plans and the reminders in your calendar." },
  { id: "aftercare-page", dir: `${D}/aftercare-page`, minPlan: "signature", kits: ["detailing"], requires: ["aftercarePage", "care"], needs: ["first-wash"], page: "aftercare", js: false,
    summary: "Aftercare: the studio's care steps from handover, and the first wash in your calendar." },
  { id: "results-page", dir: `${D}/results-page`, minPlan: "signature", kits: ["detailing"], requires: ["resultsPage"], needs: ["before-after"], page: "before-and-after", js: false,
    summary: "Before and after: the studio's own pairs, each of one car, full width." },
  { id: "care-journal", dir: `${D}/care-journal`, minPlan: "signature", kits: ["detailing"], requires: ["journal"], page: "journal", morePages: ["article"], js: false,
    summary: "The journal: the studio's own pieces (washing a coated car, film or coating, winter care), each its own page; counts as one page." },
];

/** Shared features only some trades offer. */
export const uses = ["before-after"];

/** Features offered on client sites only (they need the client's own material), so no demo shows them. */
export const clientOnly = ["inspection-light"];
/** The studio page (a general page) introduces the people, so the shared team page isn't offered. */
export const refuses = ["team"];

/** The 3D cars (SUV, saloon, hatch) the 3D features draw, from src/core/assets/cars (shared), copied to img/cars/. */
export const sharedAssets = ["cars"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkDetailing;

/** Config the detailing scripts need, only what the enabled features use. @param {any} site */
export function pageData(site) {
  const on = (/** @type {string[]} */ ...ids) => ids.some((id) => site.features.includes(id));
  const slim = (/** @type {any} */ x) => ({ id: x.id, name: x.name, days: x.days, prices: x.prices });
  return {
    detailing: {
      sizes: site.sizes ?? [],
      packages: (site.packages?.items ?? []).map(slim),
      extras: on("package-builder") ? (site.addOns ?? []).map(slim) : [],
      builder: on("package-builder") ? site.builder.message : null,
      diary: on("availability") ? { source: site.availability.source, csvUrl: site.availability.csvUrl, staleAfterHours: site.availability.staleAfterHours, workdays: site.availability.workdays, message: site.availability.message } : null,
      care: on("first-wash") ? site.care.steps : null,
      maintenance: on("maintenance") ? { message: site.maintenance.message, plans: site.maintenance.plans, count: site.maintenance.count ?? 12 } : null,
      progress: on("car-progress") ? { source: site.progress.source, csvUrl: site.progress.csvUrl, staleAfterHours: site.progress.staleAfterHours, stages: site.progress.stages, example: site.progress.example ?? null } : null,
      paint: on("paint-request") ? { message: site.paintRequest.message, photos: site.paintRequest.photos } : null,
      film: on("protection-3d") ? { message: site.protection.message, packages: site.protection.coverages.map((/** @type {any} */ c) => c.id), bodies: { suv: "SUV", saloon: "Saloon", hatch: "Hatch" }, source: site.filmPrices.source, csvUrl: site.filmPrices.csvUrl } : null,
      due: on("due-check") ? site.dueCheck : null,
      paintChart: on("paint-chart") ? { source: site.paintChart.source, csvUrl: site.paintChart.csvUrl } : null,
      lease: on("lease-return") ? { message: site.leaseReturn.message, source: site.leasePrices.source, csvUrl: site.leasePrices.csvUrl } : null,
      collection: on("collection") ? { source: site.collection.source, csvUrl: site.collection.csvUrl, staleAfterHours: site.collection.staleAfterHours, message: site.collection.message } : null,
      place: [site.business.name, site.location.streetAddress, site.location.locality, site.location.postcode].filter(Boolean).join(", "),
    },
  };
}

/**
 * Live data: simulated on a demo (src/demo), the studio's published Google Sheet otherwise.
 * @type {import("../../features/registry.js").Provider[]}
 */
export const providers = [
  {
    key: "detailDiary",
    on: (site, enabled) => enabled.has("availability") && !!site.availability,
    simulated: (site) => site.availability.source === "simulated",
    demo: { from: "src/demo/detail-diary-provider.js", name: "simulatedDiary" },
    live: { from: "src/kits/detailing/features/availability/sheet-provider.js", name: "sheetDiary" },
  },
  {
    key: "carProgress",
    on: (site, enabled) => enabled.has("car-progress") && !!site.progress,
    simulated: (site) => site.progress.source === "simulated",
    demo: { from: "src/demo/car-progress-provider.js", name: "simulatedProgress" },
    live: { from: "src/kits/detailing/features/car-progress/sheet-provider.js", name: "sheetProgress" },
  },
  {
    key: "filmPrices",
    on: (site, enabled) => enabled.has("protection-3d") && !!site.filmPrices,
    simulated: (site) => site.filmPrices.source === "simulated",
    demo: { from: "src/demo/film-prices-provider.js", name: "simulatedFilmPrices" },
    live: { from: "src/kits/detailing/features/protection-3d/sheet-provider.js", name: "sheetFilmPrices" },
  },
  {
    key: "collectionDays",
    on: (site, enabled) => enabled.has("collection") && !!site.collection,
    simulated: (site) => site.collection.source === "simulated",
    demo: { from: "src/demo/collection-provider.js", name: "simulatedCollection" },
    live: { from: "src/kits/detailing/features/collection/sheet-provider.js", name: "sheetCollection" },
  },
  {
    key: "paintChart",
    on: (site, enabled) => enabled.has("paint-chart") && !!site.paintChart,
    simulated: (site) => site.paintChart.source === "simulated",
    demo: { from: "src/demo/paint-chart-provider.js", name: "simulatedPaintChart" },
    live: { from: "src/kits/detailing/features/paint-chart/sheet-provider.js", name: "sheetPaintChart" },
  },
  {
    key: "leasePrices",
    on: (site, enabled) => enabled.has("lease-return") && !!site.leasePrices,
    simulated: (site) => site.leasePrices.source === "simulated",
    demo: { from: "src/demo/lease-prices-provider.js", name: "simulatedLeasePrices" },
    live: { from: "src/kits/detailing/features/lease-return/sheet-provider.js", name: "sheetLeasePrices" },
  },
];

/**
 * What this kit adds to the site's Content-Security-Policy: the studio's sheet, its progress photos from Google Drive,
 * and, with a 3D feature on, what the 3D car needs (its textures as blob: images, its mesh decoder as WebAssembly).
 * @param {any} site @returns {import("../../features/registry.js").KitCsp}
 */
export function csp(site) {
  const on = (/** @type {string} */ id) => site.features?.includes(id);
  const progress = on("car-progress") && site.progress?.source === "sheet";
  const sheet = (/** @type {string} */ id, /** @type {any} */ cfg) => on(id) && cfg?.source === "sheet";
  const threeD = on("correction-3d") || on("protection-3d");
  return {
    sheets: sheet("availability", site.availability) || progress || sheet("protection-3d", site.filmPrices) || sheet("collection", site.collection) || sheet("paint-chart", site.paintChart) || sheet("lease-return", site.leasePrices),
    img: [...(progress ? ["https://*.googleusercontent.com"] : []), ...(threeD ? ["blob:"] : [])],
    connect: threeD ? ["blob:"] : [],
    script: threeD ? ["'wasm-unsafe-eval'"] : [],
  };
}
