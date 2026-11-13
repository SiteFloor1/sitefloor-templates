// @ts-check
/**
 * The smile kit (teeth whitening and aesthetic dental studios): everything the shared build needs to know about it,
 * in one file. src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so adding or changing
 * this kit never edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 * The UK rules every page keeps: src/kits/smile/lib/gdc.js.
 */
import { checkSmile } from "./config.js";

const K = "src/kits/smile/features";
/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- teeth whitening and aesthetic dentistry (trade/teeth) ---
  { id: "smile-treatments", section: "treatments", dir: `${K}/smile-treatments`, minPlan: "starter", kits: ["smile"], requires: ["treatments", "clinicians"], js: false,
    summary: "Treatments and prices: each treatment in one line with its \"from\" price and who carries it out, every clinician's GDC number linked to the register." },
  { id: "smile-clinicians", section: "clinicians", dir: `${K}/smile-clinicians`, minPlan: "starter", kits: ["smile"], requires: ["clinicians"], js: false,
    summary: "Who treats you: each clinician's name, registered role, qualification and the country it was gained in, and GDC number linked to the register, as the GDC asks." },
  { id: "smile-before-book", section: "beforeBook", dir: `${K}/smile-before-book`, minPlan: "starter", kits: ["smile"], requires: ["consultation"], js: false,
    summary: "Before you book: the consultation's length, fee and what to bring, in the studio's words, with one Book link." },
  { id: "smile-patient-info", dir: `${K}/smile-patient-info`, minPlan: "starter", kits: ["smile"], requires: ["patientInfo", "clinicians"], page: "patient-information", freePage: true, js: false,
    summary: "Patient information and complaints: the studio's own complaints procedure, then the Dental Complaints Service and the GDC, whether it is NHS or private, who may whiten teeth, the under-18 rule and the sources, dated (free and required on every plan)." },
  { id: "smile-chooser", section: "chooser", dir: `${K}/smile-chooser`, minPlan: "plus", kits: ["smile"], requires: ["chooser", "clinicians"], js: true,
    summary: "Tell me what you'd change: the dentist's own line, then tap what you'd like (whiter for a wedding, a chipped tooth, just prices) and the message to the studio writes itself, sent on WhatsApp." },
  { id: "smile-treatments-page", dir: `${K}/smile-treatments-page`, minPlan: "plus", kits: ["smile"], requires: ["treatments", "clinicians"], needs: ["smile-treatments"], page: "treatments", js: false,
    summary: "The treatments page: every treatment with its price, visits, who carries it out and their GDC number." },
  { id: "smile-whitening-page", dir: `${K}/smile-whitening-page`, minPlan: "plus", kits: ["smile"], requires: ["whiteningPage", "treatments", "clinicians"], page: "whitening", js: false,
    summary: "The whitening page: who may whiten teeth in the UK (the GDC's rule, linked and dated), the studio's ways of whitening in the clinician's words, sensitivity, crowns and fillings, and the under-18 rule." },
  { id: "smile-consultation-page", dir: `${K}/smile-consultation-page`, minPlan: "plus", kits: ["smile"], requires: ["consultation"], page: "consultation", js: false,
    summary: "The consultation page: what happens, how long, the fee and what to bring." },
  { id: "smile-journey", dir: `${K}/smile-journey`, minPlan: "plus", kits: ["smile"], requires: ["journeyPage", "treatments"], page: "journey", js: true,
    summary: "Your treatment, visit by visit: choose a treatment and see each visit, how long it takes and the weeks between, from the studio's own timings; give the first date and every visit is dated and goes to the calendar." },
  { id: "smile-aftercare", dir: `${K}/smile-aftercare`, minPlan: "plus", kits: ["smile"], requires: ["aftercare"], page: "aftercare", js: true,
    summary: "Aftercare: the clinician's own instructions and who to call, and reminders (a top-up, a hygiene visit) added to the patient's calendar from the day of treatment." },
  { id: "smile-clinicians-page", dir: `${K}/smile-clinicians-page`, minPlan: "plus", kits: ["smile"], requires: ["clinicians"], needs: ["smile-clinicians"], page: "clinicians", js: false,
    summary: "The clinicians page: each clinician with a portrait, a note in their words, qualification, country and GDC number." },
  { id: "smile-gallery", dir: `${K}/smile-gallery`, minPlan: "signature", kits: ["smile"], requires: ["smiles", "treatments", "clinicians"], page: "smiles", js: false,
    summary: "The smile gallery: the studio's own patients, close and large, each with the treatment and the clinician, published only with consent the studio has recorded and never retouched; a before only of the same person." },
  { id: "smile-wedding", section: "wedding", dir: `${K}/smile-wedding`, minPlan: "signature", kits: ["smile"], requires: ["wedding"], page: "wedding", js: true,
    summary: "When's the big day: one date in, the dates to book out (consultation, whitening, check-in, final polish), worked back from the studio's own timings, added to the calendar or sent to the studio." },
  { id: "smile-treatment-pages", dir: `${K}/smile-treatment-pages`, minPlan: "signature", kits: ["smile"], requires: ["treatments"], needs: ["smile-treatments-page"], page: "treatment", collection: true, js: false,
    summary: "A page for each treatment: what it is in the clinician's words, its visits, price and who carries it out (a collection, counted as one page)." },
  { id: "smile-journal", dir: `${K}/smile-journal`, minPlan: "signature", kits: ["smile"], requires: ["journal", "clinicians"], page: "journal", morePages: ["article"], js: false,
    summary: "The journal: the dentist's own pieces (what whitening can and can't do, keeping the result), each dated and signed with their GDC number." },
  { id: "smile-studio", dir: `${K}/smile-studio`, minPlan: "signature", kits: ["smile"], requires: ["studio"], page: "studio", js: false,
    summary: "The studio, room by room: photographs of the rooms, one line each." },
  { id: "smile-arrival", dir: `${K}/smile-arrival`, minPlan: "signature", kits: ["smile"], requires: ["arrival"], needs: ["smile-studio"], js: true,
    summary: "Arriving: choose your appointment time and the way from the door to the chair re-times itself, on the studio page." },
];

/** Shared features this trade never offers: staff without GDC numbers; photo galleries, reviews and photo bands that
 * could show treatment results without recorded consent; free-form pages and vouchers that escape the claims check. */
export const refuses = ["team", "gallery", "reviews", "work", "photo-band", "custom-pages", "vouchers"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkSmile;

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** @param {any} site */
export function pageData(site) {
  const on = (/** @type {string} */ id) => site.features.includes(id);
  return {
    chooser: on("smile-chooser") ? { options: site.chooser.options } : null,
    journey: on("smile-journey") ? site.treatments.items.map((/** @type {any} */ t) => ({ id: t.id, visits: t.visits })) : null,
    reminders: on("smile-aftercare") ? site.aftercare.reminders ?? [] : null,
    wedding: on("smile-wedding") ? { steps: site.wedding.steps, message: site.wedding.message } : null,
    arrival: on("smile-arrival") ? { steps: site.arrival.steps } : null,
    name: site.business.name,
    place: [site.business.name, site.location.streetAddress, site.location.locality, site.location.postcode].filter(Boolean).join(", "),
  };
}
