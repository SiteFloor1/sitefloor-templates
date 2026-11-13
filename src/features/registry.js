// @ts-check
/**
 * Every feature the kit can put on a page. The build, the config validator,
 * the demo plan-switcher and the docs all read from this one list.
 *
 *   id        folder name; CSS/JS/template files are named after it
 *   dir       where it lives (generic features vs trade-specific kit features)
 *   minPlan   cheapest plan that includes it
 *   kits      trades it can be used with ("*" = any)
 *   requires  site.json keys that must be present when the feature is on
 *   optional  top-level site.json keys the feature may read but does not need (allowed, never required)
 *   page      the feature is a whole page (template src/kits/<kit>/pages/<page>.njk)
 *   js        ships a browser module exporting init()
 */
import { readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** @typedef {"starter"|"plus"|"signature"} Plan */
/**
 * @typedef {object} Feature
 * @property {string} id
 * @property {string} dir
 * @property {Plan} minPlan
 * @property {string[]} kits
 * @property {string[]} [notKits] with kits ["*"]: trades that never offer it (a solicitor sells no gift vouchers)
 * @property {string[]} requires
 * @property {string[]} [optional] top-level keys the feature may read but does not need
 * @property {string} [page]
 * @property {string[]} [morePages] other pages the feature brings (built only when it is on)
 * @property {boolean} [collection] its page is a generated collection (a fleet with a page per
 *   vehicle, a page per piece or per gown): however many items, the collection counts as ONE page towards the plan's limit
 * @property {string} [section] key in site.sections holding this feature's heading copy
 * @property {string[]} [needs] other features that must be on too
 * @property {boolean} [freePage] a page every plan gets, not counted towards the plan's page limit
 * @property {boolean} [unlisted] a private page (reached by a link the studio sends): kept out of the sitemap and search,
 *   with any pages of its collection, named "<page>-<id>";
 *   and free like Plan your visit: an unlisted utility page doesn't count towards the plan's page limit
 * @property {boolean} [clientOnly] needs the client's own material (e.g. a matched photo pair), so no demo shows it;
 *   the kit's client test fixture covers it (npm run rules)
 * @property {boolean} js
 * @property {string} summary
 */

export const PLANS = /** @type {const} */ (["starter", "plus", "signature"]);

/**
 * Most pages a plan includes, counting the home page. Don't count: privacy, 404, Plan your visit (`freePage`), unlisted
 * utility pages (`unlisted`) and the extra pages of a generated collection (`collection`: a fleet, its group pages and
 * every vehicle page are one page). Add-on pages are extra.
 */
export const PAGE_LIMITS = { starter: 1, plus: 5, signature: Infinity };

/** @param {Plan} plan */
export const planRank = (plan) => PLANS.indexOf(plan) + 1;

/** @type {Feature[]} */
/**
 * Features every trade can share. A kit's own features live in src/kits/<kit>/kit.js and are added below.
 * `kits: []` means opt-in: only trades whose kit.js lists it under `uses` offer it.
 * @type {Feature[]}
 */
const SHARED = [
  { id: "price-list", section: "prices", dir: "src/features/price-list", minPlan: "starter", kits: [], requires: ["priceList"], js: false,
    summary: "Grouped price list with descriptions, rendered at build time." },
  { id: "visit", section: "visit", dir: "src/features/visit", minPlan: "starter", kits: ["*"], requires: ["location", "hours"], js: false,
    summary: "Opening hours table with today highlighted, address card and directions link." },
  { id: "gallery", section: "gallery", dir: "src/features/gallery", minPlan: "starter", kits: ["*"], requires: ["gallery"], js: true,
    summary: "Latest photos on the home page, from the shop's Instagram (via Behold) or photos stored with the site." },
  { id: "questions", section: "questions", dir: "src/features/questions", minPlan: "starter", kits: ["*"], requires: ["questions"], js: false,
    summary: "Before you come in: the questions customers ask before a first visit, answered on the home page." },
  { id: "plan-visit", dir: "src/features/plan-visit", minPlan: "starter", kits: ["*"], requires: ["visitInfo", "questions"], needs: ["questions", "visit"], page: "visit", freePage: true, js: true,
    summary: "Plan your visit (free on every plan): live arrival board, journeys with directions, leave-by helper, live parking, access, hours and every question." },
  { id: "price-page", dir: "src/features/price-page", minPlan: "plus", kits: [], requires: ["priceList", "pricesPage"], needs: ["price-list"], page: "prices", js: false,
    summary: "Prices page: the full menu with how long each service takes." },
  { id: "seasonal", dir: "src/features/seasonal", minPlan: "starter", kits: ["*"], requires: ["seasons"], js: true,
    summary: "Dated seasonal banners (Christmas, Eid, half-term…) that switch on and off by themselves and tint the look." },
  { id: "work", dir: "src/features/work", minPlan: "plus", kits: ["*"], requires: ["gallery", "work"], needs: ["gallery"], page: "work", js: false,
    summary: "Our work page: the whole photo feed with filters by hashtag, endless scrolling and an enlarged view with booking." },
  { id: "reviews", section: "reviews", dir: "src/features/reviews", minPlan: "starter", kits: ["*"], requires: ["reviews"], js: false,
    summary: "Customer reviews copied from Google, with source and date." },
  { id: "photo-band", dir: "src/features/photo-band", minPlan: "plus", kits: ["*"], requires: ["photoBand"], js: true,
    summary: "Full-width photo with a caption and gentle parallax." },
  { id: "page-links", dir: "src/features/page-links", minPlan: "plus", kits: ["*"], requires: ["pageLinks"], js: false,
    summary: "Two large photo cards linking to inner pages." },
  { id: "team", dir: "src/features/team", minPlan: "plus", kits: ["*"], requires: ["staff", "team"], page: "team", js: true,
    summary: "Team page: one profile per staff member with a booking button." },
  { id: "custom-pages", dir: "src/features/custom-pages", minPlan: "plus", kits: ["*"], requires: ["pages"], page: "custom", js: false,
    summary: "General pages any business can have (About us, Services, Gift vouchers…), built from text, photo, list and booking blocks. Each counts as one page." },
  { id: "walk-in-queue", section: "queue", dir: "src/features/walk-in-queue", minPlan: "signature", kits: [], requires: ["queue", "hours"], js: true,
    summary: "Walk-in queue: people waiting now and the estimated wait (live from a sheet the shop updates; old numbers are never shown), plus the usual busyness by hour with the quietest time left today." },
  { id: "fit-a-cut", section: "fitCut", dir: "src/features/fit-a-cut", minPlan: "signature", kits: [], requires: ["queue", "services"], needs: ["walk-in-queue"], js: true,
    summary: "Will I make it?: done-by time, cut and where they're coming from give a yes/no with a walk-wait-cut-walk timeline and leave-by time, from the live queue; if not, the best time left today with a calendar reminder." },
  { id: "loyalty", section: "loyalty", dir: "src/features/loyalty", minPlan: "starter", kits: [], requires: ["loyalty"], js: true,
    summary: "Loyalty stamp card with the shop's rules and a 'how often do you come in?' slider that works out the free cuts (or coffees) a year from the shop's own prices." },
  { id: "memberships", section: "memberships", dir: "src/features/memberships", minPlan: "plus", kits: [], requires: ["memberships", "services"], js: true,
    summary: "Monthly membership plans with a savings calculator against paying each time, from the shop's own prices; join by WhatsApp." },
  { id: "before-after", section: "beforeAfter", dir: "src/features/before-after", minPlan: "plus", kits: [], requires: ["beforeAfter"], js: true,
    summary: "Before/after photo slider (drag, tap or arrow keys); side by side without JavaScript." },
  { id: "vouchers", section: "vouchers", dir: "src/features/vouchers", minPlan: "plus", kits: ["*"], requires: ["vouchers"], js: true,
    summary: "Gift vouchers: pick an amount, add names and a message, see the voucher, and order it by WhatsApp with every detail filled in." },
  { id: "date-range", dir: "src/features/date-range", minPlan: "starter", kits: [], requires: [], js: true,
    summary: "Choose your dates: a start and an end (or one date) on a month calendar, with the business's own times; closed days, bank holidays, notice and days taken on its Sheet are shown and checked on its UK clock. Plain date inputs without JavaScript." },
  { id: "pay-link", section: "payLinks", dir: "src/features/pay-link", minPlan: "plus", kits: [], requires: ["payLinks"], js: true,
    summary: "Pay online through the business's own Stripe Payment Links: deposits or full payments, each with its amount and what it's for; no checkout or fee of ours. Demo links say so instead of leaving the site." },
];

/**
 * @typedef {object} Provider live data for a feature: simulated on a demo, the client's own sheet otherwise
 * @property {string} key the name core.js boots it under (ctx.providers[key])
 * @property {string} [local] its variable name in the generated entry file, when not `<key>Provider`
 * @property {(site: any, enabled: Set<string>) => boolean} on whether this site needs it
 * @property {(site: any) => boolean} simulated whether this site uses the demo's simulated data
 * @property {{ from: string, name: string }} demo module (from the repo root) and export for the simulation
 * @property {{ from: string, name: string }} live module and export for the client's sheet
 */
/**
 * @typedef {object} Kit what src/kits/<kit>/kit.js exports
 * @property {string} id the kit's folder name
 * @property {(Feature|string)[]} features its own features in load order; a string places a shared feature among them
 * @property {string[]} [uses] opt-in shared features (`kits: []`) this trade offers
 * @property {string[]} [refuses] shared features this trade never offers
 * @property {string[]} [clientOnly] shared features this trade offers only on client sites (it needs the client's own
 *   material, e.g. a real before/after pair), so its demos needn't show them; the client fixture covers them
 * @property {(site: any, err: (path: string, msg: string) => void, fileExists?: (rel: string) => boolean) => void} [check] its site.json checks
 * @property {(site: any) => Record<string, unknown>} [pageData] what its browser scripts read from the page
 * @property {(site: any) => Record<string, unknown>} [buildData] values its templates read from `build`
 * @property {Provider[]} [providers] live data sources
 * @property {string[]} [settings] top-level site.json keys this trade's sites may carry that no feature lists (checked in
 *   its config.js); with its features' `requires` and `optional`, the only trade keys config.js accepts
 * @property {string[]} [sharedAssets] folders in src/core/assets this trade's sites draw from (e.g. "cars"), copied to img/<name>/
 * @property {(site: any) => KitCsp} [csp] what it adds to the site's Content-Security-Policy (src/core/lib/seo.js)
 * @property {{ find: (site: any, id: string) => unknown, hint: string }} [savingsItem] what a savings example
 *   (loyalty card) compares against when the trade sells something other than services, e.g. a dish
 */
/**
 * @typedef {object} KitCsp
 * @property {boolean} [sheets] the site reads a published Google Sheet (adds docs.google.com and googleusercontent.com once)
 * @property {string[]} [connect] @property {string[]} [img] @property {string[]} [script] @property {string[]} [frame]
 */

/**
 * Every kit, found by itself: each src/kits/<kit>/kit.js, sorted by folder name so builds are stable.
 * Nothing here names a kit (`npm run rules` checks), so a new trade never edits this file.
 * @type {Kit[]}
 */
export const KITS = await loadKits();

async function loadKits() {
  const dir = fileURLToPath(new URL("../kits/", import.meta.url));
  const ids = readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory() && existsSync(path.join(dir, e.name, "kit.js"))).map((e) => e.name).sort();
  /** @type {Kit[]} */
  const kits = [];
  for (const id of ids) kits.push({ id, .../** @type {Omit<Kit, "id">} */ (await import(pathToFileURL(path.join(dir, id, "kit.js")).href)) });
  return kits;
}

// Opt-in and refused shared features take each kit's name (kits are sorted, so the lists come out sorted).
for (const k of KITS) {
  for (const id of k.uses ?? []) SHARED.find((f) => f.id === id)?.kits.push(k.id);
  for (const id of k.refuses ?? []) { const f = SHARED.find((x) => x.id === id); if (f) f.notKits = [...(f.notKits ?? []), k.id]; }
}

/** Every feature: the shared ones, then each kit's own. @type {Feature[]} */
export const FEATURES = [...SHARED, ...KITS.flatMap((k) => k.features.filter((f) => typeof f !== "string"))];

/**
 * The features a site of this kit can load, in the order their CSS and scripts are bundled: the shared ones, then
 * the kit's own, with any shared feature the kit names in its list moved to that place.
 * @param {string} kit
 * @returns {Feature[]}
 */
export function featuresFor(kit) {
  const own = KITS.find((k) => k.id === kit)?.features ?? [];
  const placed = new Set(own.filter((f) => typeof f === "string"));
  return [...SHARED.filter((f) => !placed.has(f.id)), ...own.map((f) => (typeof f === "string" ? /** @type {Feature} */ (getFeature(f)) : f))];
}

/** Whether a trade can use a feature. @param {Feature} f @param {string} kit */
export const forKit = (f, kit) => f.kits.includes(kit) || (f.kits.includes("*") && !(f.notKits ?? []).includes(kit));

/** @param {string} id */
export function getFeature(id) {
  return FEATURES.find((f) => f.id === id);
}
