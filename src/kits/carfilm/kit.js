// @ts-check
/**
 * The carfilm kit (car videographers and photographers, for owners and dealers): everything the shared build needs to
 * know about it, in one file. src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so
 * adding or changing this kit never edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit
 * registers itself". Feature codes (CVID-n) and pages: docs/VISION.md.
 */
import { checkCarFilm } from "./config.js";

const D = "src/kits/carfilm/features";
const K = ["carfilm"];

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  { id: "carfilm-viewfinder", dir: `${D}/carfilm-viewfinder`, minPlan: "starter", kits: K, requires: ["hero"], js: true,
    summary: "The hero: the studio's own film seen through a camera monitor (frame lines, corner marks, thirds, a centre mark), muted, with the clip's real timecode and a pause. The still shows first; the film starts once the page has loaded, never with reduced motion or Save-Data." },
  { id: "carfilm-tonight", dir: `${D}/carfilm-tonight`, minPlan: "starter", kits: K, requires: ["roads"], needs: ["carfilm-viewfinder"], js: true,
    summary: "Tonight's light (CVID-8): the monitor's readout gives golden hour, sunset and blue hour on the studio's road, calculated for today, or tomorrow once the light has gone. Choose another of the studio's roads." },
  { id: "carfilm-reel", section: "reel", dir: `${D}/carfilm-reel`, minPlan: "starter", kits: K, requires: ["reel"], js: true,
    summary: "The showreel on the home page (CVID-1): each film as a still with its runtime and what it is; tap to play it in place." },
  { id: "carfilm-packages", section: "packages", dir: `${D}/carfilm-packages`, minPlan: "starter", kits: K, requires: ["packages"], js: false,
    summary: "Packages (CVID-1): what each includes and one all-in price (travel, edit, music and VAT inside it), in the studio's figures; no price means \"ask for a quote\"." },
  { id: "carfilm-locations", section: "locations", dir: `${D}/carfilm-locations`, minPlan: "plus", kits: K, requires: ["roads"], js: true,
    summary: "Location guide (CVID-4): the studio's roads, each with tonight's golden hour and sunset, calculated; tap one to see it in the readout." },
  { id: "carfilm-showreel", dir: `${D}/carfilm-showreel`, minPlan: "plus", kits: K, requires: ["reel"], needs: ["carfilm-reel"], page: "showreel", js: false,
    summary: "The showreel page: every film large, its runtime, the kind of shot and the car." },
  { id: "carfilm-packages-page", dir: `${D}/carfilm-packages-page`, minPlan: "plus", kits: K, requires: ["packages"], needs: ["carfilm-packages"], page: "packages", js: false,
    summary: "The packages page: the packages for owners and for dealers, the listing set and when each arrives." },
  { id: "carfilm-listing", dir: `${D}/carfilm-listing`, minPlan: "plus", kits: K, requires: ["listingSet", "formats"], needs: ["carfilm-packages-page"], js: false,
    summary: "The listing shot set (CVID-10): the studio's standard photographs for a car on sale, in order, with the size they arrive in." },
  { id: "carfilm-turnaround", dir: `${D}/carfilm-turnaround`, minPlan: "plus", kits: K, requires: ["turnaround", "packages"], needs: ["carfilm-packages-page"], js: true,
    summary: "Turnaround dates (CVID-9): choose a shoot date and see the day the photographs and the film arrive for each package, in the studio's working days, skipping UK bank holidays. Labelled an estimate." },
  { id: "carfilm-portfolio", dir: `${D}/carfilm-portfolio`, minPlan: "plus", kits: K, requires: ["portfolio"], page: "portfolio", js: true,
    summary: "Portfolio by car (CVID-3): the work large, filtered by the studio's own groups (makes on a client site, kinds of car on the demo)." },
  { id: "carfilm-book", dir: `${D}/carfilm-book`, minPlan: "plus", kits: K, requires: ["book"], page: "book", js: false,
    summary: "Book a shoot: how booking works in three steps, then the message to the studio." },
  { id: "carfilm-shotlist", dir: `${D}/carfilm-shotlist`, minPlan: "plus", kits: K, requires: ["shotList"], needs: ["carfilm-book"], js: true,
    summary: "Shot list builder (CVID-2): tap the shots that matter on the car; the list goes to the studio on WhatsApp." },
  { id: "carfilm-formats", dir: `${D}/carfilm-formats`, minPlan: "signature", kits: K, requires: ["formats"], needs: ["carfilm-viewfinder"], js: true,
    summary: "Delivery formats (CVID-7): the viewfinder's format switch snaps the frame to each shape the studio delivers (cinema, 16:9, vertical, listing), drag to reframe; the Deliveries page lists every size and where it goes." },
  { id: "carfilm-planner", dir: `${D}/carfilm-planner`, minPlan: "signature", kits: K, requires: ["planner", "roads"], page: "golden-hour", js: true,
    summary: "Golden-hour planner (CVID-5): any of the studio's roads and any date give golden hour, sunset and blue hour, calculated, with the day's light drawn to scale; held on WhatsApp." },
  { id: "carfilm-share", dir: `${D}/carfilm-share`, minPlan: "signature", kits: K, requires: [], needs: ["carfilm-planner"], js: true,
    summary: "Share card (CVID-12): the planned road, date and golden hour on one picture with the studio's frame, to share or save." },
  { id: "carfilm-guides", dir: `${D}/carfilm-guides`, minPlan: "signature", kits: K, requires: ["guides"], page: "dealers",
    morePages: ["owners", "rolling-shots", "locations", "social-media-packs", "behind-the-shoot", "questions", "deliveries"], js: false,
    summary: "The guide pages: dealers and brands, private owners, rolling shots, locations (tonight's light on every road), social media packs, behind the shoot, every question, and deliveries (every format and size)." },
];

// Not for a car studio: no vouchers, seasonal banners, parallax bands, a feed page or link cards.
export const refuses = ["vouchers", "seasonal", "photo-band", "page-links", "work", "gallery", "reviews", "team", "custom-pages"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkCarFilm;

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** @param {any} site */
export function pageData(site) {
  const on = (/** @type {string[]} */ ...ids) => ids.some((id) => site.features.includes(id));
  const roads = on("carfilm-tonight", "carfilm-locations", "carfilm-planner")
    ? site.roads.items.map((/** @type {any} */ r) => ({ id: r.id, name: r.name, lat: r.lat, lon: r.lon })) : null;
  return {
    carfilm: {
      fps: site.hero.film?.fps ?? 25,
      roads,
      road: site.roads?.default ?? null,
      formats: on("carfilm-formats") ? site.formats.items.filter((/** @type {any} */ f) => f.viewfinder).map((/** @type {any} */ f) => ({ id: f.id, ratio: f.ratio })) : null,
      shots: on("carfilm-shotlist") ? site.shotList.message : null,
      planner: on("carfilm-planner") ? site.planner.message : null,
      turnaround: on("carfilm-turnaround") ? { workdays: site.turnaround.workdays, postcode: site.location.postcode, packages: site.packages.items.map((/** @type {any} */ p) => ({ id: p.id, photosDays: p.photosDays ?? null, filmDays: p.filmDays ?? null })) } : null,
    },
  };
}

/** Nothing beyond the site itself: the forecast (switched off for now) will come from the shared weather function. @param {any} _site @returns {import("../../features/registry.js").KitCsp} */
export function csp(_site) {
  return { sheets: false, connect: [] }; // the forecast will come from the site's own /weather, never api.met.no
}
