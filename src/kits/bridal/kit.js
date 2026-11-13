// @ts-check
/**
 * The bridal kit (bridal salons): everything the shared build needs to know about it, in one file.
 * src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so adding or changing this kit never
 * edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 */
import { checkBridal } from "./config.js";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- bridal salon (trade/bridal) ---
  { id: "appointment", section: "appointment", dir: "src/kits/bridal/features/appointment", minPlan: "starter", kits: ["bridal"], requires: ["appointment"], js: true,
    summary: "The salon and the first appointment: a photograph of the room, the appointment as a card (length, guests, fee, what to bring, in the salon's words), and one Request button that opens a quiet sheet: the wedding date, how many are coming, when suits and the designers to have ready, sent on WhatsApp." },
  { id: "designers", section: "designers", dir: "src/kits/bridal/features/designers", minPlan: "starter", kits: ["bridal"], requires: ["designers"], js: false,
    summary: "The designers the salon stocks, what each is known for and its price band, from the salon's own figures." },
  { id: "gowns-page", dir: "src/kits/bridal/features/gowns-page", minPlan: "plus", kits: ["bridal"], requires: ["gowns", "gownsPage", "designers"], page: "gowns", js: true,
    summary: "The gowns page: every gown, found by silhouette, neckline, sleeve and designer; \"Ask to try\" sends that gown on WhatsApp. On the home page, two or three gowns each fill the screen as an editorial photograph with name, house and price as a credit." },
  { id: "trunk-shows", section: "trunkShows", dir: "src/kits/bridal/features/trunk-shows", minPlan: "plus", kits: ["bridal"], requires: ["trunkShows"], js: true,
    summary: "Trunk shows and sample sales with their dates; ones that have finished drop off by themselves; a waiting list by the salon's own Google Form." },
  { id: "fittings-page", dir: "src/kits/bridal/features/fittings-page", minPlan: "plus", kits: ["bridal"], requires: ["fittingsPage"], page: "fittings", js: false,
    summary: "Fittings, alterations and veils: how many fittings and when, what alterations include, and each veil length, in the salon's words." },
  { id: "gown-diary", section: "diary", dir: "src/kits/bridal/features/gown-diary", minPlan: "signature", kits: ["bridal"], requires: ["diary"], js: true,
    summary: "The gown diary: one wedding date in, the year out, led by the last day to order, then the gown arriving, every fitting and collection, from the salon's own timings, in UK date order; added to the bride's calendar in one file." },
  { id: "gown-mirror", dir: "src/kits/bridal/features/gown-mirror", minPlan: "signature", kits: ["bridal"], requires: ["gowns"], needs: ["gowns-page"], js: true,
    summary: "The mirror: open a gown and see it from every side the salon photographed (front, back, detail) in three panes, as in the fitting room." },
  { id: "shortlist", dir: "src/kits/bridal/features/shortlist", minPlan: "signature", kits: ["bridal"], requires: ["gowns", "shortlist"], needs: ["gowns-page"], js: true,
    summary: "The shortlist: keep gowns while browsing, send the list on WhatsApp so they're on the rail when the bride arrives, and share a link that opens the same list for her mother or friends (the list lives in the link; nothing is stored)." },
  { id: "brides-page", dir: "src/kits/bridal/features/brides-page", minPlan: "plus", kits: ["bridal"], requires: ["bridesPage"], page: "brides", js: false,
    summary: "A page for what brides say (the reviews, set as quotes) and the salon's latest photographs, kept off the home page so it stays quiet." },
  { id: "gift-page", dir: "src/kits/bridal/features/gift-page", minPlan: "plus", kits: ["bridal"], requires: ["giftPage"], page: "vouchers", js: false,
    summary: "The gift page: gift vouchers and the ways in to the gowns and fittings, on a page of their own." },
];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkBridal;

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** Config the bridal scripts need, only what the enabled features use. Gown photos travel in the HTML. @param {any} site */
export function pageData(site) {
  const on = (/** @type {string[]} */ ...ids) => ids.some((id) => site.features.includes(id));
  const houseName = (/** @type {string} */ id) => site.designers?.items.find((/** @type {any} */ h) => h.id === id)?.name ?? "";
  return {
    appointment: on("appointment") ? { message: site.appointment.message, maxGuests: site.appointment.maxGuests, times: site.appointment.times ?? [] } : null,
    houses: on("appointment", "gowns-page") && site.designers ? site.designers.items.map((/** @type {any} */ h) => ({ id: h.id, name: h.name })) : null,
    diary: on("gown-diary") ? { orderStep: site.diary.orderStep, steps: site.diary.steps, late: site.diary.late } : null,
    gowns: on("gowns-page") ? { message: site.gowns.message, items: site.gowns.items.map((/** @type {any} */ g) => ({ id: g.id, name: g.name, house: g.house, houseName: houseName(g.house), silhouette: g.silhouette, neckline: g.neckline, sleeve: g.sleeve })) } : null,
    shortlist: on("shortlist") ? { message: site.shortlist.message } : null,
    place: [site.business.name, site.location.streetAddress, site.location.locality, site.location.postcode].filter(Boolean).join(", "),
    url: site.url,
  };
}
