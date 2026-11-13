// @ts-check
/**
 * The construction kit (builders: extensions, basements, full renovations, new builds, listed buildings): everything the
 * shared build needs to know about it, in one file. src/features/registry.js finds this file by itself (every
 * src/kits/<kit>/kit.js), so adding or changing this kit never edits a shared file. What each export is for:
 * docs/ARCHITECTURE.md, "A kit registers itself".
 */
import { checkConstruction } from "./config.js";
import { startState, depthRange } from "./lib/extension.js";

const D = "src/kits/construction/features";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // Starter: the home page that answers the first questions.
  { id: "visualiser", dir: `${D}/visualiser`, minPlan: "starter", kits: ["construction"], requires: ["visualiser", "hero"], js: true,
    summary: "The extension visualiser on the first screen: a real photograph of a finished extension; one tap loads a 3D house (terrace, semi or detached) with a rear extension the visitor can deepen, give a roof light or an all-glass roof, and see before and after, with its size and new floor area worked out. Drag to turn it." },
  { id: "build-stages", dir: `${D}/build-stages`, minPlan: "starter", kits: ["construction"], requires: ["stages"], js: true,
    summary: "How a build runs: the builder's own stages beside a finished room above the ground line and the work below it; with their stage lengths, \"if we started in…\" gives the handover months." },
  { id: "projects", dir: `${D}/projects`, minPlan: "starter", kits: ["construction"], requires: ["projects"], js: false,
    summary: "Recently handed over: finished projects by place and scope, photographed large." },
  { id: "build-types", dir: `${D}/build-types`, minPlan: "starter", kits: ["construction"], requires: ["buildTypes"], js: false,
    summary: "What we build: extensions, basements, renovations, new builds and listed buildings, each with a photograph and one line." },
  { id: "credentials", dir: `${D}/credentials`, minPlan: "starter", kits: ["construction"], requires: ["credentials"], js: false,
    summary: "Accreditations and insurance, from the builder's own certificates only: memberships with their numbers and the public register to check them, insurance covers and limits, the guarantee, and when it was last checked." },
  { id: "brief", dir: `${D}/brief`, minPlan: "starter", kits: ["construction"], requires: ["brief"], js: true,
    summary: "Start a project: what, the postcode district (never the address), when and, if the builder lists them, a budget band, sent as one WhatsApp message." },
  // Plus: the pages a client reads before calling.
  { id: "jobs-page", dir: `${D}/jobs-page`, minPlan: "plus", kits: ["construction"], requires: ["projects"], needs: ["projects"], page: "projects", morePages: ["project"], js: false,
    summary: "Projects: every finished project, and a page for each (place, scope, how long it took, the photographs and, with the client's written consent, a before photo)." },
  { id: "projects-map", dir: `${D}/projects-map`, minPlan: "plus", kits: ["construction"], requires: ["projects", "projectsMap"], needs: ["jobs-page"], js: true,
    summary: "The projects map: each project's postcode district (never an address), listed first; the OpenStreetMap map loads only when the visitor asks for it." },
  { id: "services-page", dir: `${D}/services-page`, minPlan: "plus", kits: ["construction"], requires: ["buildTypes"], needs: ["build-types"], page: "services", js: false,
    summary: "Services: each kind of work with what it includes, in the builder's words." },
  { id: "how-we-build", dir: `${D}/how-we-build`, minPlan: "plus", kits: ["construction"], requires: ["howWeBuild", "stages"], needs: ["build-stages"], page: "how-we-build", js: false,
    summary: "How we build: each stage in full with the builder's own lengths, then the contract, payments, the defects period and living at home during the work, in their words." },
  { id: "start-page", dir: `${D}/start-page`, minPlan: "plus", kits: ["construction"], requires: ["brief"], needs: ["brief"], page: "start", js: false,
    summary: "A page for starting a project, so the home page stays short: the brief, and what happens after it is sent." },
  { id: "spec-library", dir: `${D}/spec-library`, minPlan: "plus", kits: ["construction"], requires: ["spec"], page: "specification", js: true,
    summary: "The specification library: the stone, timber, brick, plaster, glazing and ironmongery the builder works with, photographed close, with where each is used; a quick filter by kind." },
  { id: "sample-box", dir: `${D}/sample-box`, minPlan: "plus", kits: ["construction"], requires: ["sampleBox", "spec"], needs: ["spec-library"], js: true,
    summary: "A box of samples: tick up to six of the builder's finishes, give the postcode district, and send the list on WhatsApp." },
  { id: "costs-page", dir: `${D}/costs-page`, minPlan: "plus", kits: ["construction"], requires: ["costs"], page: "costs", js: false,
    summary: "What it costs, honestly: how the builder prices, what decides the price, what is usually paid to others and VAT; the builder's own rates as a table only if they publish them. No typical figures." },
  { id: "planning-page", dir: `${D}/planning-page`, minPlan: "plus", kits: ["construction"], requires: ["planningPage"], page: "planning", js: false,
    summary: "Planning and party walls: permission, permitted development for extensions and lofts, the lawful development certificate, party wall notices and building regulations, for England, each with its GOV.UK pages and the date checked." },
  { id: "survey-page", dir: `${D}/survey-page`, minPlan: "plus", kits: ["construction"], requires: ["surveyPage"], page: "survey", js: true,
    summary: "What's worth checking: pick the house's age and see what is worth looking at before planning work on it (lead pipes, asbestos, wall ties, earlier sign-offs), each fact with its official source; general guidance, then \"ask us to look at your house\" on WhatsApp." },
  { id: "reviews-page", dir: `${D}/reviews-page`, minPlan: "plus", kits: ["construction"], requires: ["reviewsPage", "reviews"], needs: ["reviews"], page: "reviews", js: false,
    summary: "Reviews: the builder's own Google reviews with a photograph, and a link to all of them." },
  // Signature: the showpieces.
  { id: "planning-guide", dir: `${D}/planning-guide`, minPlan: "signature", kits: ["construction"], requires: ["planningGuide"], needs: ["visualiser-page"], js: true,
    summary: "The planning guide on the 3D model: as the depth changes, where the rear extension sits against GOV.UK's permitted-development limits for that kind of house, drawn on the model's garden, with the source, the date checked and \"a guide, not a decision\"." },
  { id: "light-study", dir: `${D}/light-study`, minPlan: "signature", kits: ["construction"], requires: ["lightStudy"], needs: ["visualiser-page"], js: true,
    summary: "The light study on the 3D model: pick a month, a time and the way the garden faces; the sun moves to its real position for the postcode district and one sentence says whether it reaches the new room's glass." },
  { id: "loft-page", dir: `${D}/loft-page`, minPlan: "signature", kits: ["construction"], requires: ["loftPage"], needs: ["visualiser"], page: "loft", js: true,
    summary: "Your loft in 3D: a rear dormer, a hip-to-gable or both on the same model house, the volume they add worked out on the model, and where it sits against GOV.UK's permitted-development allowance (40 m³ for a terrace, 50 m³ otherwise), with what's already been added, the source, the date checked and \"a guide, not a decision\"." },
  { id: "neighbours-page", dir: `${D}/neighbours-page`, minPlan: "signature", kits: ["construction"], requires: ["neighbours"], page: "neighbours", freePage: true, unlisted: true, js: true,
    summary: "For our neighbours: a page per live site (the link on the builder's letter), by postcode district only: when the builder works, how to reach them, and what's happening this week (noisy work, deliveries) from the builder's sheet. Old or missing news says to call." },
  { id: "living-page", dir: `${D}/living-page`, minPlan: "signature", kits: ["construction"], requires: ["livingPage", "stages"], needs: ["build-stages"], page: "living", js: true,
    summary: "Living through a build: pick a start date and see each stage's dates from the builder's own lengths, what home is like in each and the noisy part, with the stage starts as a calendar file; then the builder's tips." },
  { id: "site-progress", dir: `${D}/site-progress`, minPlan: "signature", kits: ["construction"], requires: ["siteProgress", "stages"], needs: ["build-stages"], page: "your-build", freePage: true, unlisted: true, js: true,
    summary: "Your house, this week: a client types the code the builder gave them and sees the stage, this week's work, a photograph and what happens next, from the builder's sheet (no names or addresses in it). Old or unknown codes say to call." },
  { id: "build-3d", dir: `${D}/build-3d`, minPlan: "signature", kits: ["construction"], requires: ["build3d", "stages"], needs: ["how-we-build"], js: true,
    summary: "The build in 3D, stage by stage: the same house from survey to handover, the builder's own stage lengths beside it. A photograph first; the model loads on tap." },
  { id: "visualiser-page", dir: `${D}/visualiser-page`, minPlan: "signature", kits: ["construction"], requires: ["visualiserPage", "visualiser"], needs: ["visualiser"], page: "extension", js: true,
    summary: "The extension visualiser as its own page: the 3D house large, a price range worked out only from the builder's own rates (none until they give them), and the design sent on WhatsApp." },
  { id: "service-pages", dir: `${D}/service-pages`, minPlan: "signature", kits: ["construction"], requires: ["buildTypes"], needs: ["services-page"], page: "service", js: false,
    summary: "A page for each kind of work (extensions, basements, renovations, new builds, listed buildings, joinery), with its projects (a collection, counted as one page)." },
  { id: "credentials-page", dir: `${D}/credentials-page`, minPlan: "signature", kits: ["construction"], requires: ["credentials"], needs: ["credentials"], page: "accreditations", js: false,
    summary: "Warranties and insurance as a page: each warranty, membership, cover and guarantee in full, with the public register to check it." },
  { id: "crew-page", dir: `${D}/crew-page`, minPlan: "signature", kits: ["construction"], requires: ["crew"], page: "team", js: false,
    summary: "The team: the people a client will meet, by name and role, in their own words." },
  { id: "build-journal", dir: `${D}/build-journal`, minPlan: "signature", kits: ["construction"], requires: ["journal"], page: "journal", morePages: ["article"], js: false,
    summary: "The journal: the builder's own dated articles (planning an extension, living through a renovation, choosing materials); planning and building-regulation facts only from gov.uk, each with the date it was checked." },
];

/** Shared features this trade never offers: projects replace the gallery and work pages; the team is the kit's own. */
export const refuses = ["gallery", "work", "photo-band", "team", "vouchers"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkConstruction;

/** Config the construction kit's scripts need, only for the features that are on. @param {any} site */
export function pageData(site) {
  const on = (/** @type {string} */ id) => site.features.includes(id);
  const v = site.visualiser;
  return {
    build: {
      visualiser: on("visualiser") ? {
        start: startState(v), depth: depthRange(v.depth), message: v.message,
        // A price only with the builder's own rates, and only where the visualiser page offers it.
        rates: on("visualiser-page") && v.rates ? v.rates : null,
      } : null,
      stages: on("build-3d") ? site.stages.items.map((/** @type {any} */ s) => ({ id: s.id, name: s.name, model: s.model, weeks: s.weeks ?? null })) : null,
      progress: on("site-progress") ? {
        source: site.siteProgress.source, csvUrl: site.siteProgress.csvUrl, staleAfterDays: site.siteProgress.staleAfterDays,
        stages: site.stages.items.map((/** @type {any} */ s) => s.id), example: site.mode === "demo" ? site.siteProgress.example : undefined,
      } : null,
      brief: on("brief") ? { opening: site.brief.opening } : null,
      // The builder's stage lengths, for "if we started in…" and the living-through-a-build planner (only when all have one).
      programme: site.stages?.items?.every((/** @type {any} */ s) => Array.isArray(s.weeks)) ? site.stages.items.map((/** @type {any} */ s) => ({ id: s.id, name: s.name, weeks: s.weeks })) : null,
      lightStudy: on("light-study") ? { places: site.lightStudy.places, facing: site.lightStudy.facing ?? "S" } : null,
      sampleBox: on("sample-box") ? { max: site.sampleBox.max, message: site.sampleBox.message } : null,
      neighbours: on("neighbours-page") ? { source: site.neighbours.source, csvUrl: site.neighbours.csvUrl, staleAfterDays: site.neighbours.staleAfterDays } : null,
      survey: on("survey-page") ? { message: site.surveyPage.message ?? "" } : null,
    },
  };
}

/**
 * Values the kit's templates read before the first paint. model3dKb: the 3D house's chunk (three.js and the model),
 * gzipped, as printed on the button; tests/unit/build.test.js fails if the built chunk drifts from it.
 */
export const MODEL_3D_KB = 130;
/** @param {any} _site */
export function buildData(_site) { return { model3dKb: MODEL_3D_KB }; }

/**
 * Live data: simulated on a demo (src/demo), the client's published Google Sheet otherwise.
 * @type {import("../../features/registry.js").Provider[]}
 */
export const providers = [
  {
    key: "siteProgress",
    on: (site, enabled) => enabled.has("site-progress"),
    simulated: (site) => site.siteProgress?.source === "simulated",
    demo: { from: "src/demo/progress-provider.js", name: "simulatedProgress" },
    live: { from: "src/kits/construction/features/site-progress/sheet-provider.js", name: "sheetProgress" },
  },
  {
    key: "neighbours",
    on: (site, enabled) => enabled.has("neighbours-page"),
    simulated: (site) => site.neighbours?.source === "simulated",
    demo: { from: "src/demo/neighbours-provider.js", name: "simulatedNeighbours" },
    live: { from: "src/kits/construction/features/neighbours-page/sheet-provider.js", name: "sheetNeighbours" },
  },
];

/**
 * What this kit adds to the Content-Security-Policy (src/core/lib/seo.js): the builder's sheet and its Drive photos
 * for "your house, this week", and OpenStreetMap's tiles for the projects map (loaded only when asked for).
 * @param {any} site @returns {import("../../features/registry.js").KitCsp}
 */
export function csp(site) {
  const sheet = site.features?.includes("site-progress") && site.siteProgress?.source === "sheet";
  const neighbours = site.features?.includes("neighbours-page") && site.neighbours?.source === "sheet";
  return {
    sheets: sheet || neighbours,
    img: [
      ...(sheet ? ["https://drive.google.com", "https://*.googleusercontent.com"] : []),
      ...(site.features?.includes("projects-map") ? ["https://tile.openstreetmap.org"] : []),
    ],
  };
}
