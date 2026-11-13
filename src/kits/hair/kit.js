// @ts-check
/**
 * The hair kit (hair salons): everything the shared build needs to know about it, in one file.
 * src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so adding or changing this kit never
 * edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 */
import { checkHair } from "./config.js";

const D = "src/kits/hair/features";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- hair salon (trade/hair) ---
  { id: "length-price", section: "prices", dir: `${D}/length-price`, minPlan: "starter", kits: ["hair"], requires: ["menu"], js: true,
    summary: "Price by length and stylist level: tap where your hair falls on the salon's own photograph, choose the service and the level, and the price and the time follow; the WhatsApp message says the same. Every figure is the salon's own grid." },
  { id: "my-usual", dir: `${D}/my-usual`, minPlan: "plus", kits: ["hair"], requires: [], needs: ["length-price"], js: false,
    summary: "My usual: a returning client keeps their service, level and length on their own phone; next time the price opens on it and one tap sends the rebooking message. Nothing leaves the phone." },
  { id: "stylists", section: "stylists", dir: `${D}/stylists`, minPlan: "starter", kits: ["hair"], requires: ["stylists", "menu"], js: true,
    summary: "The stylists: each one's work as a photograph, their level and what they do best, and their next free day from the salon's published sheet (hidden when the sheet is old)." },
  { id: "skin-test", section: "skinTest", dir: `${D}/skin-test`, minPlan: "starter", kits: ["hair"], requires: ["skinTest"], js: true,
    summary: "The skin test before colour: who needs one, when to walk in, and from the colour date the last day for the test by the salon's own rule, to the calendar." },
  { id: "textures", section: "textures", dir: `${D}/textures`, minPlan: "plus", kits: ["hair"], requires: ["textures", "menu", "stylists"], needs: ["stylists"], js: true,
    summary: "Every texture side by side: straight, waves, curls, coils, braids as tall photographs; choose one and it opens to who cuts it, the price and the time, and what to arrive with." },
  { id: "colour-year", section: "colourYear", dir: `${D}/colour-year`, minPlan: "plus", kits: ["hair"], requires: ["upkeep"], js: true,
    summary: "The colour year: your colour and the date it was done mark the next visits on the coming twelve months, from the salon's own weeks between visits, then to the calendar." },
  { id: "hair-services", dir: `${D}/hair-services`, minPlan: "plus", kits: ["hair"], requires: ["menu", "servicesPage"], needs: ["length-price"], page: "services", js: false,
    summary: "Services and prices: every service in the salon's groups, priced by length and stylist level as a grid, with times and the skin-test note on colour." },
  { id: "colour-page", dir: `${D}/colour-page`, minPlan: "plus", kits: ["hair"], requires: ["menu", "colourPage"], page: "colour", js: false,
    summary: "Colour: the colour services and prices, how a first colour runs (consultation, skin test, the appointment) and the colourists." },
  { id: "stylists-page", dir: `${D}/stylists-page`, minPlan: "plus", kits: ["hair"], requires: ["stylists", "stylistsPage"], needs: ["stylists"], page: "stylists", js: false,
    summary: "The stylists, one by one: the levels explained in a line each, then each stylist's work, what they do, their prices from and their next free day." },
  { id: "look-book", dir: `${D}/look-book`, minPlan: "plus", kits: ["hair"], requires: ["looks", "stylists", "menu"], page: "look-book", js: true,
    summary: "The look book: the salon's own work by cut, colour and texture; each look names its stylist and opens to its price from, and \"Ask for this look\" on WhatsApp." },
  { id: "group-pages", dir: `${D}/group-pages`, minPlan: "plus", kits: ["hair"], requires: ["menu", "groupPages"], page: "group", js: false,
    summary: "A page for each kind of service the salon chooses (cuts and styling, treatments, extensions, men's grooming): its photograph and words, the prices by length and level, and who does it (a collection, counted as one page)." },
  { id: "textured-page", dir: `${D}/textured-page`, minPlan: "plus", kits: ["hair"], requires: ["textures", "texturedPage", "menu"], needs: ["textures"], page: "curly-and-textured", js: false,
    summary: "Curly and textured hair: each texture with who cuts it and how to arrive, and the curl services with their prices." },
  { id: "colour-consult", dir: `${D}/colour-consult`, minPlan: "plus", kits: ["hair"], requires: ["consultation"], page: "colour-consultation", js: true,
    summary: "The colour consultation on WhatsApp: the colour in mind, when it was last coloured and what's on it now, sent as one message that asks for two photos (the hair now, and a colour loved)." },
  { id: "upkeep-page", dir: `${D}/upkeep-page`, minPlan: "plus", kits: ["hair"], requires: ["upkeep", "upkeepPage"], needs: ["colour-year"], page: "colour-upkeep", js: false,
    summary: "Colour upkeep: each colour with how often it comes back and how to look after it between visits, and the colour year planner." },
  { id: "product-shelf", dir: `${D}/product-shelf`, minPlan: "plus", kits: ["hair"], requires: ["products"], page: "products", js: false,
    summary: "Products we use: what's at the basin and on the shelf, each with what it's for and its price, and \"Put one by for me\" on WhatsApp." },
  { id: "hair-journal", dir: `${D}/hair-journal`, minPlan: "plus", kits: ["hair"], requires: ["journal"], page: "journal", morePages: ["article"], js: false,
    summary: "The journal: the salon's own dated articles (balayage or highlights, caring for colour, growing out a cut), each on its own page with its sources." },
  { id: "stylist-match", section: "match", dir: `${D}/stylist-match`, minPlan: "signature", kits: ["hair"], requires: ["stylists", "match"], needs: ["stylists-page"], js: true,
    summary: "Stylist match: three answers (what we're doing, the hair, the first free chair or the most experience) lead to the one stylist whose work fits, shown with their work, level and next free day, and a WhatsApp message to book them." },
  { id: "consent-pairs", section: "pairs", dir: `${D}/consent-pairs`, minPlan: "signature", kits: ["hair"], requires: ["pairs", "stylists"], clientOnly: true, js: true,
    summary: "Before and after, with consent only: each pair is one client in one session, compared with a slider, naming the stylist and the date the client agreed in writing." },
  { id: "chairs-today", section: "chairs", dir: `${D}/chairs-today`, minPlan: "signature", kits: ["hair"], requires: ["chairs", "stylists", "menu"], needs: ["stylists"], js: true,
    summary: "Chairs free today: the blow-dry and walk-in slots the salon puts on its sheet through the day, soonest first, with the stylist, the price from and \"Ask for 14:30\" on WhatsApp. Fails closed: an old row, a slot already started or outside today's hours shows nothing." },
  { id: "blowdry-pass", section: "pass", dir: `${D}/blowdry-pass`, minPlan: "plus", kits: ["hair"], requires: ["pass", "menu"], js: false,
    summary: "The blow-dry pass: a pack of visits for one price (five blow-dries, say), bought on the salon's own Stripe Payment Link; the salon keeps count." },
  { id: "hair-vouchers", dir: `${D}/hair-vouchers`, minPlan: "plus", kits: ["hair"], requires: ["voucherPage"], needs: ["vouchers"], page: "gift-vouchers", js: false,
    summary: "Gift vouchers on their own page, so the home page stays short: the page head, then the shared voucher section." },
  { id: "wedding-hair", dir: `${D}/wedding-hair`, minPlan: "signature", kits: ["hair"], requires: ["wedding"], page: "bridal-and-occasion", js: true,
    summary: "The wedding hair planner: from the wedding date, the consultation, trial, colour and final trim on the salon's own timings, past steps marked, to the calendar in one file and to the salon on WhatsApp." },
];

/** Shared features this trade doesn't offer: the stylists replace the team page; looks replace the work page. */
export const refuses = ["seasonal", "work", "photo-band", "page-links", "team"];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkHair;

// What this kit's browser scripts read from the page (clientData), only for the features that are on.
/** @param {any} site */
export function pageData(site) {
  const on = (/** @type {string} */ id) => site.features.includes(id);
  const m = site.menu, st = site.stylists;
  return {
    menu: on("length-price") ? {
      message: m.message, lengths: m.lengths.map((/** @type {any} */ l) => ({ id: l.id, name: l.name })), levels: m.levels.map((/** @type {any} */ l) => ({ id: l.id, name: l.name })),
      services: m.services.filter((/** @type {any} */ s) => (m.hero ?? []).includes(s.id)).map((/** @type {any} */ s) => ({ id: s.id, name: s.name, prices: s.prices, minutes: s.minutes, skinTest: Boolean(s.skinTest) })),
      skinHours: site.skinTest?.hoursBefore ?? null,
    } : null,
    stylists: on("stylists") ? {
      message: st.message, source: st.freeDays?.source ?? "none", csvUrl: st.freeDays?.csvUrl, staleAfterDays: st.freeDays?.staleAfterDays ?? 2,
      items: st.items.map((/** @type {any} */ s) => ({ id: s.id, name: s.name, level: s.level, does: s.does, textures: s.textures ?? null })),
      levels: m.levels.map((/** @type {any} */ l) => l.id), hours: site.hours,
    } : null,
    skinTest: on("skin-test") ? { hoursBefore: site.skinTest.hoursBefore, message: site.skinTest.message } : null,
    upkeep: on("colour-year") ? { message: site.upkeep.message, items: site.upkeep.items.map((/** @type {any} */ u) => ({ id: u.id, name: u.name, weeks: u.weeks })) } : null,
    textures: on("textures") ? { message: m.message } : null,
    consultation: on("colour-consult") ? { message: site.consultation.message } : null,
    chairs: on("chairs-today") ? {
      message: site.chairs.message, csvUrl: site.chairs.source === "sheet" ? site.chairs.csvUrl : undefined,
      services: site.chairs.services.map((/** @type {any} */ c) => {
        const s = m.services.find((/** @type {any} */ x) => x.id === c.service);
        /** @type {Record<string, number>} */ const from = {};
        for (const l of m.levels) { const p = s?.prices?.[l.id]; const all = Array.isArray(p) ? p : p === undefined ? [] : [p]; if (all.length) from[l.id] = Math.min(...all); }
        return { id: c.id, name: c.name, from };
      }),
    } : null,
    wedding: on("wedding-hair") ? { message: site.wedding.message, steps: site.wedding.steps } : null,
    place: [site.business.name, site.location.streetAddress, site.location.locality, site.location.postcode].filter(Boolean).join(", "),
  };
}

/**
 * Live data: simulated on a demo (src/demo), the salon's published Google Sheet otherwise.
 * @type {import("../../features/registry.js").Provider[]}
 */
export const providers = [
  {
    key: "freeDays",
    on: (site, enabled) => enabled.has("stylists") && site.stylists?.freeDays !== undefined,
    simulated: (site) => site.stylists?.freeDays?.source === "simulated",
    demo: { from: "src/demo/free-days-provider.js", name: "simulatedFreeDays" },
    live: { from: "src/kits/hair/features/stylists/sheet-provider.js", name: "sheetFreeDays" },
  },
  {
    key: "chairs",
    on: (site, enabled) => enabled.has("chairs-today"),
    simulated: (site) => site.chairs?.source === "simulated",
    demo: { from: "src/demo/chairs-provider.js", name: "simulatedChairs" },
    live: { from: "src/kits/hair/features/chairs-today/sheet-provider.js", name: "sheetChairs" },
  },
];

/** What this kit adds to the site's Content-Security-Policy. @param {any} site @returns {import("../../features/registry.js").KitCsp} */
export function csp(site) {
  const f = site.features ?? [];
  return { sheets: (f.includes("stylists") && site.stylists?.freeDays?.source === "sheet") || (f.includes("chairs-today") && site.chairs?.source === "sheet") };
}
