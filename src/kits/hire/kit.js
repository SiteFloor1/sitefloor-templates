// @ts-check
/**
 * The hire kit (car hire): everything the shared build needs to know about it, in one file.
 * src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so adding or changing this kit never
 * edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 */
import { checkHire } from "./config.js";
import { regionFromPostcode } from "../../core/lib/bank-holidays.js";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- hire (trade/car-hire) ---
  { id: "fleet", section: "fleet", dir: "src/kits/hire/features/fleet", minPlan: "starter", kits: ["hire"], requires: ["fleet", "hire"], js: true,
    summary: "The fleet on the home page: a quiet rail of the client's classes with counts, the leading class (one large car and two beside it, each with its from price and rules) and a strip hinting at the rest of the range; \"free this weekend?\" from the client's Sheet, saying \"ask us\" when the Sheet is old or unreadable." },
  { id: "handover", section: "handover", dir: "src/kits/hire/features/handover", minPlan: "starter", kits: ["hire"], requires: ["hire", "fleet"], js: true,
    summary: "The handover: the car at your door at night and the key passed over, with how delivery, collection and the deposit work in the client's words." },
  { id: "postcode", section: "postcode", dir: "src/kits/hire/features/postcode", minPlan: "starter", kits: ["hire"], requires: ["hire"], js: true,
    summary: "Delivery postcode checker: in the client's delivery zones or not, and the fee for that zone; collection details otherwise." },
  { id: "hire-request", section: "request", dir: "src/kits/hire/features/hire-request", minPlan: "starter", kits: ["hire"], requires: ["fleet", "hire"], js: true,
    summary: "A request on WhatsApp with the car and dates written in: a request, never a booking." },
  { id: "bring-list", section: "bring", dir: "src/kits/hire/features/bring-list", minPlan: "starter", kits: ["hire"], requires: ["hire"], js: true,
    summary: "What to bring on the day, from the client, with a checklist to save to the phone." },
  { id: "fleet-page", dir: "src/kits/hire/features/fleet-page", minPlan: "plus", kits: ["hire"], requires: ["fleet", "hire", "fleetPage"], page: "fleet", morePages: ["fleet-class", "car"], collection: true, js: true,
    summary: "The fleet as one page of the plan however many cars: every car with filters (class, seats, power, budget, available on your dates), search by make and model and sort by price; a page per class with its own night photograph; a page per car with its gallery, spec, rules, calendar and request." },
  { id: "hire-quote", dir: "src/kits/hire/features/hire-quote", minPlan: "plus", kits: ["hire"], requires: ["fleet", "hire"], needs: ["fleet-page", "date-range"], js: true,
    summary: "On each car's page: the dates on the calendar (days taken on the client's Sheet) and the quote with every part shown, from the client's own rates, delivery or meet-and-greet, extras and extra miles; the deposit listed apart; the request on WhatsApp with a reference that matches the deposit." },
  { id: "meet-greet", dir: "src/kits/hire/features/meet-greet", minPlan: "plus", kits: ["hire"], requires: ["hire"], needs: ["hire-quote"], js: false,
    summary: "Airport meet-and-greet: the client's named airports and their fees, chosen in the quote with pick-up and return times." },
  { id: "driver-check", dir: "src/kits/hire/features/driver-check", minPlan: "plus", kits: ["hire"], requires: ["fleet"], needs: ["fleet-page"], js: true,
    summary: "On each car's page: \"you can request this car if…\" from three answers against the client's rules for it. It reads the rules back; it never approves anyone." },
  { id: "driver-form", dir: "src/kits/hire/features/driver-form", minPlan: "plus", kits: ["hire"], requires: ["hire"], js: false,
    summary: "Driver details in advance through the client's own Google Form (licence, age, DVLA check code), with the check code rule from gov.uk; in the questions and on every car page. The site never stores, checks or decides." },
  { id: "tuned-class", dir: "src/kits/hire/features/tuned-class", minPlan: "plus", kits: ["hire"], requires: ["fleet"], js: false,
    summary: "A tuned class: each car with the client's stated power, modifications, extra driver rules and insurance note." },
  { id: "compare", dir: "src/kits/hire/features/compare", minPlan: "plus", kits: ["hire"], requires: ["fleet"], needs: ["fleet-page"], js: true,
    summary: "Compare two cars side by side: the client's figures and rules, line by line." },
  { id: "first-ten", dir: "src/kits/hire/features/first-ten", minPlan: "plus", kits: ["hire"], requires: ["fleet"], needs: ["fleet-page"], js: false,
    summary: "The first ten minutes: the client's notes on that car's controls and fuel, on its page." },
  { id: "chauffeur-page", dir: "src/kits/hire/features/chauffeur-page", minPlan: "plus", kits: ["hire"], requires: ["fleet", "hire", "chauffeurPage"], page: "chauffeur", js: true,
    summary: "Chauffeur: hourly, airport transfers, weddings and events; the chauffeur cars with the client's hourly rate and minimum hours; a quote request on WhatsApp (pick-up, drop-off, date and time, hours, passengers, car)." },
  { id: "events-page", dir: "src/kits/hire/features/events-page", minPlan: "plus", kits: ["hire"], requires: ["fleet", "hire", "eventsPage"], page: "weddings", js: false,
    summary: "Weddings and events: ribbons, chauffeur, the cars that suit and the client's prices, with a request on WhatsApp." },
  { id: "longterm-page", dir: "src/kits/hire/features/longterm-page", minPlan: "plus", kits: ["hire"], requires: ["fleet", "hire", "longTermPage"], page: "long-term", js: true,
    summary: "Long-term and corporate: the client's monthly rates per car and an account request on WhatsApp." },
  { id: "deposit-status", dir: "src/kits/hire/features/deposit-status", minPlan: "plus", kits: ["hire"], requires: ["hire", "depositPage"], page: "deposit", unlisted: true, js: true,
    summary: "Where's my deposit: held, car checked or returned with the date, from the client's Sheet by reference only (never a name). An unlisted page reached by the link the business sends; free on the page count." },
  { id: "fleet-calendar", dir: "src/kits/hire/features/fleet-calendar", minPlan: "plus", kits: ["hire"], requires: ["fleet", "hire"], needs: ["fleet-page"], js: true,
    summary: "The fleet calendar: a fortnight at a time, a row per car and a column per day, free or taken from the client's Sheet (closed days from the client's hours); a free day opens that car's dates. Shows nothing as free when the Sheet can't be read." },
  { id: "handover-check", dir: "src/kits/hire/features/handover-check", minPlan: "signature", kits: ["hire"], requires: ["fleet", "hire", "checkPage"], page: "handover-check", unlisted: true, js: true,
    summary: "The handover checklist: at collection and again at return, each panel marked or nothing seen, the fuel or charge and the mileage, dated; what changed in plain words; kept on the customer's phone and sent on WhatsApp or saved as a file. Records what was seen; never judges damage or decides a deposit. Unlisted, free on the page count." },
  { id: "delivered-tonight", dir: "src/kits/hire/features/delivered-tonight", minPlan: "signature", kits: ["hire"], requires: ["fleet", "hire"], needs: ["handover", "hire-quote"], js: true,
    summary: "Delivered tonight: choose the car, the dates and your postcode, and that car arrives at a door at night in a real photograph; beneath it the delivery window, the key passed over and the total assemble, every part shown; request and deposit from there. After sending, the same scene is the confirmation: request sent, not booked." },
  { id: "journey-planner", dir: "src/kits/hire/features/journey-planner", minPlan: "signature", kits: ["hire"], requires: ["fleet", "hire"], needs: ["chauffeur-page"], js: true,
    summary: "The chauffeur journey planner: pick-up, stops and drop-off, each with the customer's own time; the hours and quote from the client's hourly rate and minimum; a shareable itinerary card for a wedding party; the request on WhatsApp." },
  { id: "spec-dial", dir: "src/kits/hire/features/spec-dial", minPlan: "signature", kits: ["hire"], requires: ["fleet"], needs: ["fleet-page"], js: true,
    summary: "The spec dial: one precise control for seats, power, budget and free on my dates that filters the whole fleet live, the matching cars lining up in one row of night photographs. Plain filters without JavaScript." },
  { id: "before-page", dir: "src/kits/hire/features/before-page", minPlan: "signature", kits: ["hire"], requires: ["hire", "beforePage"], needs: ["driver-form", "bring-list"], page: "before-your-hire", js: false,
    summary: "Before your hire as a full page: what to bring, the driver details form, the check code rule, how the deposit works and the handover." },
  { id: "hire-film", dir: "src/kits/hire/features/hire-film", minPlan: "signature", kits: ["hire"], requires: ["hire"], js: true,
    summary: "The hero as a muted film loop of the client's own car: still picture first, Pause, nothing under reduced motion or data saver." },
];

/** Shared features only some trades offer: this one does. */
export const uses = ["date-range", "pay-link"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkHire;

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** Config the car hire scripts need, only what the enabled features use. Cars' prices travel in the HTML. @param {any} site */
export function pageData(site) {
  const on = (/** @type {string[]} */ ...ids) => ids.some((id) => site.features.includes(id));
  const h = site.hire;
  const live = (/** @type {any} */ s) => ({ source: s.source, csvUrl: s.csvUrl, staleAfterHours: s.staleAfterHours });
  return {
    hire: {
      availability: live(h.availability),
      cars: h.availability.source === "simulated" ? site.fleet.cars.map((/** @type {any} */ c) => c.id) : undefined,
      deposits: on("deposit-status") ? { ...live(h.deposits), example: site.mode === "demo" ? h.deposits.example : undefined } : null,
      rates: on("hire-quote", "delivered-tonight") ? h.rates : null,
      extras: on("hire-quote", "delivered-tonight") ? h.extras : null,
      zones: on("postcode", "hire-quote", "delivered-tonight") ? h.delivery.zones : null,
      collect: h.delivery.collect,
      airports: on("meet-greet") ? h.airports : null,
      chauffeur: on("chauffeur-page") ? { stepMinutes: h.chauffeur.stepMinutes, message: h.chauffeur.message } : null,
      bring: on("bring-list") ? h.bring : null,
      check: on("handover-check") ? h.check : null,
      region: site.location.region ?? regionFromPostcode(site.location.postcode ?? ""),
    },
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
    key: "fleet",
    on: (site, _enabled) => site.kit === "hire" && !!site.hire?.availability,
    simulated: (site) => site.hire.availability.source === "simulated",
    demo: { from: "src/demo/fleet-provider.js", name: "simulatedFleet" },
    live: { from: "src/kits/hire/features/fleet/sheet-provider.js", name: "sheetFleet" },
  },
];

/**
 * What this kit adds to the site's Content-Security-Policy (src/core/lib/seo.js): `sheets` when it reads a published
 * Google Sheet, and any other sources.
 * @param {any} site @returns {import("../../features/registry.js").KitCsp}
 */
export function csp(site) {
  // Availability (which days each car is taken) and deposit status, from the client's sheet.
  return { sheets: site.hire?.availability?.source === "sheet" || site.hire?.deposits?.source === "sheet" };
}
