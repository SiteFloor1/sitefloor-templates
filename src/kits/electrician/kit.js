// @ts-check
/**
 * The electrician kit (electricians, lighting designers, smart-home installers): everything the shared build needs to
 * know about it, in one file. src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so
 * adding or changing this kit never edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit
 * registers itself".
 */
import { checkElectrician } from "./config.js";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- electrician (trade/electrician) ---
  // Premium electricians, lighting designers and smart-home installers. Starter: what's included, the emergency line,
  // the registers, rooms they've lit and the fault guide; Plus: why each light is there, projects, the EV check, the
  // room designer, the dimmer, how a project runs and "Before you call"; Signature: the scene keypad, the estimate,
  // the house in 3D, the charger on your driveway in 3D and certificates by code.
  { id: "circuits", section: "circuits", dir: "src/kits/electrician/features/circuits", minPlan: "starter", kits: ["electrician"], requires: ["circuits"], js: false,
    summary: "Services as the chart inside a fuse board's door: numbered circuits that open (native, without JavaScript) to what each service includes, in the client's words." },
  { id: "call-out", dir: "src/kits/electrician/features/call-out", minPlan: "starter", kits: ["electrician"], requires: ["callOut"], js: false,
    summary: "The emergency line at the top of every page: one sentence, when they come out, and the number to call (a tel: link)." },
  { id: "registers", dir: "src/kits/electrician/features/registers", minPlan: "starter", kits: ["electrician"], requires: ["registers"], needs: ["circuits"], js: false,
    summary: "Accreditations the client holds (NICEIC, NAPIT…), each linked to its own entry on the scheme's public register; set beside the services." },
  { id: "lit-rooms", section: "litRooms", dir: "src/kits/electrician/features/lit-rooms", minPlan: "starter", kits: ["electrician"], requires: ["rooms"], js: false,
    summary: "Rooms, lit: the client's own photographs of finished rooms at night (kitchen, living room, cinema, bathroom), each with its scene and what was done." },
  { id: "fault-guide", section: "fault", dir: "src/kits/electrician/features/fault-guide", minPlan: "starter", kits: ["electrician"], requires: ["faultGuide"], js: true,
    summary: "Something's wrong? Pick what happened and see what to tell the electrician, one safety line (never a repair instruction), and send it on WhatsApp." },
  { id: "light-reasons", section: "lights", dir: "src/kits/electrician/features/light-reasons", minPlan: "plus", kits: ["electrician"], requires: ["fittings"], js: true,
    summary: "Every light has a reason: the lights numbered on a photograph of a finished room; tap a number for the fitting, why it's there, its scene, colour and control." },
  { id: "projects-page", dir: "src/kits/electrician/features/projects-page", minPlan: "plus", kits: ["electrician"], requires: ["projects", "projectsPage"], page: "projects", js: true,
    summary: "Projects page: finished jobs filtered by kind of work (rewire, lighting, smart home, chargers…), each with its area and what was done." },
  { id: "ev-check", dir: "src/kits/electrician/features/ev-check", minPlan: "plus", kits: ["electrician"], requires: ["ev", "evPage"], page: "ev-charging", js: true,
    summary: "EV charger page: will one go in easily? Parking, cable run, main fuse and big loads give a standard install at the client's price, or why it needs a survey; gov.uk grant link, never an amount." },
  { id: "room-designer", dir: "src/kits/electrician/features/room-designer", minPlan: "plus", kits: ["electrician"], requires: ["designer", "lightingPage"], page: "lighting", js: true,
    summary: "Lighting page: choose a room, its size and the layers of light; the fittings and the quote come from the client's own prices, sent on WhatsApp." },
  { id: "dimmer", section: "dimmer", dir: "src/kits/electrician/features/dimmer", minPlan: "plus", kits: ["electrician"], requires: ["dimmer"], js: true,
    summary: "The dimmer: the client's own photographs of one finished room from one spot, from low to full, under a fader. Real photographs, never simulated light." },
  { id: "project-steps", section: "steps", dir: "src/kits/electrician/features/project-steps", minPlan: "plus", kits: ["electrician"], requires: ["steps"], js: false,
    summary: "How your project runs: the client's stages from first visit to certificates, with when each happens." },
  { id: "before-you-call", section: "beforeCall", dir: "src/kits/electrician/features/before-you-call", minPlan: "plus", kits: ["electrician"], requires: ["beforeYouCall"], js: true,
    summary: "Before you call: the home's age, the rooms and what's wanted, with a photo of the fuse board, sent as one tidy WhatsApp message so the first visit can be a quote." },
  { id: "project-page", dir: "src/kits/electrician/features/project-page", minPlan: "plus", kits: ["electrician"], requires: ["yourProjectPage"], page: "your-project", js: false,
    summary: "Your project page: how a project runs, Before you call and (on Signature) the whole-house estimate, kept off the home page." },
  { id: "scene-keypad", dir: "src/kits/electrician/features/scene-keypad", minPlan: "signature", kits: ["electrician"], requires: ["hero"], js: true,
    summary: "The scene keypad in the hero: Evening, Cinema and Away swap the hero to the client's photographs of the same home in each light, with a line saying what the scene does." },
  { id: "estimate", section: "estimate", dir: "src/kits/electrician/features/estimate", minPlan: "signature", kits: ["electrician"], requires: ["estimate"], js: true,
    summary: "Whole-house estimate: the kind of home, bedrooms and work wanted give a range from the client's own bands (never a single price), sent on WhatsApp." },
  { id: "house-3d", dir: "src/kits/electrician/features/house-3d", minPlan: "signature", kits: ["electrician"], requires: ["house3d"], js: true,
    summary: "The house in 3D, full width on the home page (a still first, loads on tap): a house at blue hour lights up room by room; a keypad (Evening, Cinema, Away, Goodnight), the colour of the light, tap a room to light it, and a quote for the lit fittings from the client's prices." },
  { id: "ev-3d", dir: "src/kits/electrician/features/ev-3d", minPlan: "signature", kits: ["electrician"], requires: ["ev"], needs: ["ev-check"], js: true,
    summary: "The charger on your driveway in 3D (loads on tap): slide the charger along the wall and see the cable run to the car's port and the price from the client's own figures." },
  { id: "certificates", dir: "src/kits/electrician/features/certificates", minPlan: "signature", kits: ["electrician"], requires: ["certificates"], page: "your-home", unlisted: true, js: true,
    summary: "Your home's certificates, by code: what was certified and when, the next inspection date and a calendar reminder, from the client's Google Sheet. No names or addresses." },
];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkElectrician;

/** Top-level site.json keys no feature lists: the name as two lines in the header and footer (checked in config.js). */
export const settings = ["mark"];

// What this kit's browser scripts read from the page (clientData). Photos travel in the HTML.
/** What the electrician's scripts need, only for the features that are on. Photos travel in the HTML. @param {any} site */
export function pageData(site) {
  const on = (/** @type {string[]} */ ...ids) => ids.some((id) => site.features.includes(id));
  return {
    faultGuide: on("fault-guide") ? { message: site.faultGuide.message, cases: site.faultGuide.cases } : null,
    fittings: on("light-reasons") ? site.fittings.items.map((/** @type {any} */ f) => ({ name: f.name, why: f.why, scene: f.scene, colour: f.colour, control: f.control })) : null,
    ev: on("ev-check", "ev-3d") ? { message: site.ev.message, standard: site.ev.standard, perMetre: site.ev.perMetre, maxMetres: site.ev.maxMetres, minFuse: site.ev.minFuse, leadMetres: site.ev.leadMetres ?? null } : null,
    designer: on("room-designer") ? site.designer : null,
    beforeYouCall: on("before-you-call") ? { message: site.beforeYouCall.message } : null,
    estimate: on("estimate") ? site.estimate : null,
    house3d: on("house-3d") ? site.house3d : null,
    certificates: on("certificates") ? { source: site.certificates.source, csvUrl: site.certificates.csvUrl, intervalYears: site.certificates.intervalYears, weeksBefore: site.certificates.weeksBefore, kinds: site.certificates.kinds ?? {}, example: site.mode === "demo" ? site.certificates.example : undefined } : null,
    place: [site.business.name, site.location.streetAddress, site.location.locality, site.location.postcode].filter(Boolean).join(", "),
    url: site.url,
  };
}

/**
 * Live data: simulated on a demo (src/demo), the client's published Google Sheet otherwise.
 * @type {import("../../features/registry.js").Provider[]}
 */
export const providers = [
  {
    key: "certificates",
    local: "certProvider",
    on: (site, enabled) => enabled.has("certificates"),
    simulated: (site) => site.certificates?.source === "simulated",
    demo: { from: "src/demo/cert-provider.js", name: "simulatedCerts" },
    live: { from: "src/kits/electrician/features/certificates/sheet-provider.js", name: "sheetCerts" },
  },
];

/**
 * What this kit adds to the site's Content-Security-Policy (src/core/lib/seo.js).
 * @param {any} site @returns {import("../../features/registry.js").KitCsp}
 */
export function csp(site) {
  const on = (/** @type {string} */ id) => site.features?.includes(id);
  // The charger on your driveway in 3D: the car's textures are unpacked to blob: images and its mesh decoder is WebAssembly.
  const ev3d = on("ev-3d");
  return {
    sheets: on("certificates") && site.certificates?.source === "sheet", // certificates by code
    img: ev3d ? ["blob:"] : [],
    connect: ev3d ? ["blob:"] : [],
    script: ev3d ? ["'wasm-unsafe-eval'"] : [],
  };
}
