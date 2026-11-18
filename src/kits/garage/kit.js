// @ts-check
/**
 * The garage kit (car parking, garages and car storage): everything the shared build needs to know about it, in one
 * file. src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so adding or changing this
 * kit never edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 */
import { checkGarage } from "./config.js";
import { CARS, allBays, bayRects, chargedBy } from "./lib/garage.js";

const K = "src/kits/garage/features";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- garage (trade/garage) ---
  // Car parking, garages and secure car storage, let by the month. Starter: spaces free and prices, the security and
  // access facts, how cars are kept, and moving in to the calendar; Plus: charging and security on the hall's bays,
  // the insurer's letter, arriving at night, laying up and the business enquiry; Signature: the drawn plan with pick
  // your car, and your car this month. The aerial hall (a render of the client's own hall) is a Bespoke add-on.
  { id: "garage-spaces", section: "spaces", dir: `${K}/garage-spaces`, minPlan: "starter", kits: ["garage"], requires: ["hall"], js: false,
    summary: "Spaces free and prices (PARK-1): each free bay with its size, charger and monthly price, and the sizes and prices of the bays that are let, from the client's own list." },
  { id: "garage-access", section: "access", dir: `${K}/garage-access`, minPlan: "starter", kits: ["garage"], requires: ["access"], js: false,
    summary: "Security and access facts (PARK-2): gate, hours, lighting, covered or open, only as the client states them." },
  { id: "garage-kept", section: "kept", dir: `${K}/garage-kept`, minPlan: "starter", kits: ["garage"], requires: ["kept"], js: false,
    summary: "How cars are kept: covers, checks, washing, each with the client's own photograph and one line." },
  { id: "garage-move-in", section: "moveIn", dir: `${K}/garage-move-in`, minPlan: "starter", kits: ["garage"], requires: ["moveIn"], js: true,
    summary: "Moving in to your calendar (PARK-12): pick a start date; the client's steps (fob collection, tell your insurer, first payment, the last day to give notice) become a calendar file made in the browser." },
  { id: "garage-charging", section: "charging", dir: `${K}/garage-charging`, minPlan: "plus", kits: ["garage"], requires: ["hall", "charging"], js: false,
    summary: "Charging (PARK-15): which bays have chargers and their speed, and when a car plugged in is charged by, from the client's sheet; on the plan and the aerial hall, the charger bays glow." },
  { id: "garage-security", section: "security", dir: `${K}/garage-security`, minPlan: "plus", kits: ["garage"], requires: ["security"], optional: ["hall"], js: false,
    summary: "Security (PARK-16): cameras, fob hours, gate and alarm, only what the client confirms, and how footage is kept (never a live feed); on the plan and the aerial hall, the cameras' coverage shows on the floor." },
  { id: "garage-insurer", dir: `${K}/garage-insurer`, minPlan: "plus", kits: ["garage"], requires: ["insurerLetter"], needs: ["garage-security"], js: false,
    summary: "The letter for your insurer (PARK-17): the client's own PDF describing the site's security, to download. Client-only: it is the client's document." },
  { id: "garage-night", dir: `${K}/garage-night`, minPlan: "plus", kits: ["garage"], requires: ["night"], page: "arrive-at-night", js: true,
    summary: "Arrive at night (PARK-11): gate to bay, step by step, with the client's photographs; with the aerial hall, the same view after dark and the route to the visitor's bay lit." },
  { id: "garage-laying-up", dir: `${K}/garage-laying-up`, minPlan: "plus", kits: ["garage"], requires: ["layingUp"], page: "laying-up", js: true,
    summary: "Laying up (PARK-13): away from and to; the care visits while the car is stored and the day it comes back as a calendar file, with GOV.UK links for SORN and tax." },
  { id: "garage-fleet", dir: `${K}/garage-fleet`, minPlan: "plus", kits: ["garage"], requires: ["companies"], page: "business", js: true,
    summary: "Business and fleet (PARK-14): how many vehicles, which hours, monthly invoice; sent as one WhatsApp enquiry." },
  { id: "garage-pick", section: "pick", dir: `${K}/garage-pick`, minPlan: "signature", kits: ["garage"], requires: ["hall"], optional: ["security", "charging"], js: true,
    summary: "Pick your car, see your bays (PARK-10): the hall drawn to scale from the client's measurements; choose a car and the free bays it fits light up, with the room either side; reserve on WhatsApp. Charging and cameras are layers on the plan." },
  { id: "garage-care-card", section: "careCard", dir: `${K}/garage-care-card`, minPlan: "signature", kits: ["garage"], requires: ["careCard"], js: false,
    summary: "Your car this month (PARK-18): the card the client sends on WhatsApp after each check of a stored car (battery, tyres, cover, started and moved), and the link to ask for it." },
  { id: "garage-aerial", dir: `${K}/garage-aerial`, minPlan: "signature", kits: ["garage"], requires: ["aerial", "hall"], needs: ["garage-pick"], js: true,
    summary: "The hall from above (PARK-9, a Bespoke add-on): a render of the client's own hall from its plan as the hero; pick a car and a car that size drives in through the gate to the bay that fits; charging and cameras as layers." },
];

/** Shared features only some trades offer: none for now. */
export const uses = [];
// The hall and its cars are the pictures: no staff page, no photo galleries or bands beside the hall, and no gift
// vouchers (a bay is let by the month, not given).
export const refuses = ["team", "gallery", "work", "photo-band", "vouchers"];
// The insurer's letter is the client's own document; reviews only ever come from the client's own Google reviews.
export const clientOnly = ["garage-insurer", "reviews"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkGarage;

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** @param {any} site */
export function pageData(site) {
  const on = (/** @type {string} */ id) => site.features.includes(id);
  const h = site.hall;
  const hall = h && (on("garage-pick") || on("garage-aerial") || on("garage-night"))
    ? { name: h.name, width: h.width, depth: h.depth, bayDepth: h.bayDepth, gate: h.gate, rows: h.rows }
    : null;
  const a = site.aerial;
  return {
    hall,
    rects: hall ? bayRects(h) : null,
    cars: hall ? CARS : null,
    cameras: on("garage-security") && site.security?.cameras ? site.security.cameras : [],
    chargers: on("garage-charging") && h ? allBays(h).filter((b) => b.charger).map((b) => ({ n: b.n, kw: b.charger })) : [],
    aerial: on("garage-aerial") ? { frame: a.frame, phoneFrame: a.phoneFrame, cars: a.cars } : null,
    chargedBy: on("garage-charging") && site.charging ? chargedBy(site.charging) : "",
    securityNote: on("garage-security") && site.security ? [site.security.recorded, ...site.security.facts].join(" ") : "",
    moveIn: on("garage-move-in") ? site.moveIn.steps : null,
    layingUp: on("garage-laying-up") ? { every: site.layingUp.every, visit: site.layingUp.visit, back: site.layingUp.back } : null,
    name: site.business.name,
  };
}
