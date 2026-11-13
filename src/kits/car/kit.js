// @ts-check
/**
 * The car kit (car studios (detailing, PPF, tint, wraps)): everything the shared build needs to know about it, in one file.
 * src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so adding or changing this kit never
 * edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 */
import { checkCar } from "./config.js";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  { id: "swatches", section: "finish", dir: "src/kits/car/features/swatches", minPlan: "starter", kits: ["car"], requires: ["wrap"], js: true,
    summary: "Wrap swatch library: every one of the studio's wrap colours as a sample panel in gloss, satin, matte or chrome (rendered from the studio's 3D lighting), picked like a material sample." },
  { id: "quote", section: "quote", dir: "src/kits/car/features/quote", minPlan: "starter", kits: ["car"], requires: ["quote", "vehicles"], js: true,
    summary: "WhatsApp quote: vehicle, make and model, the work wanted and a preferred week, sent as one message. A plain WhatsApp link without JavaScript." },
  { id: "aftercare-card", section: "aftercareCard", dir: "src/kits/car/features/aftercare-card", minPlan: "starter", kits: ["car"], requires: ["aftercare"], js: true,
    summary: "Aftercare reminder card: pick the work and the day it was fitted; every aftercare step goes into the customer's calendar (.ics, times in UTC)." },
  { id: "model-finder", section: "finder", dir: "src/kits/car/features/model-finder", minPlan: "plus", kits: ["car"], requires: ["models", "gallery", "jobs", "vehicles"], needs: ["gallery"], js: true,
    summary: "Have you done my car?: pick a make and model to see the studio's own tagged jobs on that car and its \"from\" prices for that size of vehicle." },
  { id: "next-bay", section: "bay", dir: "src/kits/car/features/next-bay", minPlan: "plus", kits: ["car"], requires: ["bay"], js: true,
    summary: "Next free bay: the next drop-off day from a sheet the studio updates (old dates are never shown), a deposit through the studio's own Stripe Payment Link, and can-I-wait lounge info." },
  { id: "aftercare", dir: "src/kits/car/features/aftercare", minPlan: "plus", kits: ["car"], requires: ["aftercare", "aftercarePage"], needs: ["aftercare-card"], page: "aftercare", js: true,
    summary: "Aftercare page: a timeline for each kind of work (day one to month six), each with reminders for the customer's calendar." },
  { id: "ppf-page", dir: "src/kits/car/features/ppf-page", minPlan: "plus", kits: ["car"], requires: ["protection", "ppfPage", "jobs", "vehicles"], page: "ppf", js: false,
    summary: "Paint protection film page: the studio's film types as rendered samples, its packs and single parts (headlights, rear lights, grille) with \"from\" prices, close-ups of its work, good-to-know points and PPF questions." },
  { id: "tint-page", dir: "src/kits/car/features/tint-page", minPlan: "plus", kits: ["car"], requires: ["tint", "tintPage", "jobs", "vehicles"], page: "window-tint", js: false,
    summary: "Window tint page: every shade on a real window photo, the law for each window from gov.uk, how the studio fits it, its films, prices for every size of car and its tint questions." },
  { id: "showroom", section: "showroom", dir: "src/kits/car/features/showroom", minPlan: "signature", kits: ["car"], requires: ["vehicles", "jobs", "tint", "wrap", "showroom"], js: true,
    summary: "The Showroom: a real hatch, saloon, SUV or van in the studio, recoloured live; Wrap (colour and finish), Tint (each window, zoomed to the glass) and Wheels (zoomed to the wheel), with a live price and time from the studio's prices, a UK legality check and Send this build on WhatsApp." },
  { id: "driver-view", section: "driverView", dir: "src/kits/car/features/driver-view", minPlan: "signature", kits: ["car"], requires: ["tint"], js: true,
    summary: "Driver's seat view: real photos from inside a car with each of the studio's shades on the glass, by day and at night, with the UK rule for that window." },
  { id: "protection-planner", section: "protection", dir: "src/kits/car/features/protection-planner", minPlan: "signature", kits: ["car"], requires: ["protection", "vehicles", "jobs"], js: true,
    summary: "Protection planner: tap the panels to cover with PPF on a real car, from above or the side, or start from a pack up to the whole car; price and time from the studio's own prices, with its packs used when they cost less." },
  { id: "chip-test", section: "chip", dir: "src/kits/car/features/chip-test", minPlan: "signature", kits: ["car"], requires: ["protection", "jobs", "chipTest"], js: true,
    summary: "Stone chip test: the front of a car, half bare paint and half under film; tap to throw a stone or \"Drive the motorway\" for a shower of them. The paint chips, the film takes it; then the studio's price to protect the front." },
  { id: "job-tracker", dir: "src/kits/car/features/job-tracker", minPlan: "signature", kits: ["car"], requires: ["jobTracker"], page: "your-car", unlisted: true, js: true,
    summary: "Your car, live: a private page where a customer types the code from the studio's message (or opens its link) and sees their car's stage, the last update, the studio's note and photo, and the stages to come, from the studio's Google Sheet. No names, plates or phone numbers." },
];

/** Shared features only some trades offer: this one does. */
export const uses = ["price-list", "price-page", "before-after"];

/** The concept car for the Showroom lives in src/core/assets/cars (shared), copied to img/cars/. */
export const sharedAssets = ["cars"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkCar;

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** Config the car studio scripts need, only what the enabled features use. @param {any} site */
export function pageData(site) {
  const on = (/** @type {string[]} */ ...ids) => ids.some((id) => site.features.includes(id));
  return {
    vehicles: on("showroom", "quote", "model-finder", "protection-planner") ? site.vehicles : null,
    jobs: on("showroom", "model-finder", "protection-planner") ? site.jobs : null,
    tint: on("showroom", "driver-view") ? site.tint : null,
    wrap: on("showroom") ? site.wrap : null,
    showroom: on("showroom") ? site.showroom : null,
    protection: on("protection-planner") ? site.protection : null,
    quote: on("quote") ? site.quote : null,
    aftercare: on("aftercare-card", "aftercare") ? site.aftercare : null,
    bay: on("next-bay") ? { source: site.bay.source, csvUrl: site.bay.csvUrl, staleAfterHours: site.bay.staleAfterHours } : null,
    models: on("model-finder") ? site.models : null,
    jobTracker: on("job-tracker") ? { source: site.jobTracker.source, csvUrl: site.jobTracker.csvUrl, staleAfterHours: site.jobTracker.staleAfterHours, stages: site.jobTracker.stages, example: site.mode === "demo" ? site.jobTracker.example : undefined } : null,
    place: [site.business.name, site.location.streetAddress, site.location.locality, site.location.postcode].filter(Boolean).join(", "),
  };
}

/**
 * Live data: simulated on a demo (src/demo), the client's published Google Sheet otherwise.
 * @type {import("../../features/registry.js").Provider[]}
 */
export const providers = [
  {
    key: "bay",
    on: (site, enabled) => enabled.has("next-bay"),
    simulated: (site) => site.bay?.source === "simulated",
    demo: { from: "src/demo/bay-provider.js", name: "simulatedBay" },
    live: { from: "src/kits/car/features/next-bay/sheet-provider.js", name: "sheetBay" },
  },
  {
    key: "tracker",
    on: (site, enabled) => enabled.has("job-tracker"),
    simulated: (site) => site.jobTracker?.source === "simulated",
    demo: { from: "src/demo/tracker-provider.js", name: "simulatedTracker" },
    live: { from: "src/kits/car/features/job-tracker/sheet-provider.js", name: "sheetTracker" },
  },
];

/**
 * What this kit adds to the site's Content-Security-Policy (src/core/lib/seo.js): `sheets` when it reads a published
 * Google Sheet, and any other sources.
 * @param {any} site @returns {import("../../features/registry.js").KitCsp}
 */
export function csp(site) {
  const on = (/** @type {string} */ id) => site.features?.includes(id);
  // Your car, live: the studio's sheet, and its photos from Google Drive (served from googleusercontent.com).
  const tracker = on("job-tracker") && site.jobTracker?.source === "sheet";
  // The 3D Showroom: the model's textures are unpacked to blob: images (read with fetch) and its mesh decoder is WebAssembly.
  const showroom = on("showroom");
  return {
    sheets: site.bay?.source === "sheet" || tracker,
    img: [...(tracker ? ["https://*.googleusercontent.com"] : []), ...(showroom ? ["blob:"] : [])],
    connect: showroom ? ["blob:"] : [],
    script: showroom ? ["'wasm-unsafe-eval'"] : [],
  };
}
