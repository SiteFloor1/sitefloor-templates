// @ts-check
/**
 * The wear kit (clothing brands): everything the shared build needs to know about it, in one file.
 * src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so adding or changing this kit never
 * edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 */
import { checkWear } from "./config.js";

/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  // --- wear (trade/menswear) ---
  // Clothing brands sold online with a showroom or pop-ups (running, outerwear, essentials). Starter: the drop line,
  // the pieces with their stock, the detail stills and the club's runs; Plus: the shop, fit, club and drops pages;
  // Signature: the lookbook, a page per piece, the live size run, what to wear today, the kit card, route cards and the drop-day line.
  { id: "drop-line", dir: "src/kits/wear/features/drop-line", minPlan: "starter", kits: ["wear"], requires: ["drop"], js: true,
    summary: "The next drop in one quiet line under the hero (\"Drop 04 · Saturday 10:00 · 3 days\"), counted on the brand's own clock, with \"Remind me\" on the brand's Google Form." },
  { id: "pieces", section: "pieces", dir: "src/kits/wear/features/pieces", minPlan: "starter", kits: ["wear"], requires: ["pieces", "stock", "shop"], js: true,
    summary: "The pieces, large and worn: a carousel with the price and what's left in each size from the brand's sheet (sold out, a few left, opens Saturday); sold-out pieces ask to be told when they're back. Stock goes quiet when the sheet is old." },
  { id: "details", section: "details", dir: "src/kits/wear/features/details", minPlan: "starter", kits: ["wear"], requires: ["details"], js: false,
    summary: "In detail: the brand's close-up photographs (zips, seams, cuffs, rain on the cloth) very large, one short line each." },
  { id: "club-runs", section: "club", dir: "src/kits/wear/features/club-runs", minPlan: "starter", kits: ["wear"], requires: ["club"], js: false,
    summary: "Run club on the home page: a photograph of the club and the week's runs, each with \"I'm in\" on WhatsApp." },
  { id: "shop-page", dir: "src/kits/wear/features/shop-page", minPlan: "plus", kits: ["wear"], requires: ["pieces", "stock", "shop", "shellsPage"], needs: ["pieces"], page: "shells", js: true,
    summary: "The shop page: one piece per row, its photographs large, the price, and what's left in every size from the sheet; Buy opens the brand's own shop." },
  { id: "fit-room", dir: "src/kits/wear/features/fit-room", minPlan: "plus", kits: ["wear"], requires: ["pieces", "fitPage"], optional: ["sizeGuide"], page: "fit", js: true,
    summary: "Fit and fabric page: pick a piece and a size to see its flat measurements and how it sits, a size from your chest using only the brand's own table, and the fabric and care in the brand's words." },
  { id: "club-page", dir: "src/kits/wear/features/club-page", minPlan: "plus", kits: ["wear"], requires: ["club", "clubPage"], needs: ["club-runs"], page: "club", js: true,
    summary: "Run club page: every weekly run with its next date, where to meet and what to expect, \"I'm in\" on WhatsApp and the run in your calendar (.ics, times in UTC)." },
  { id: "drops-page", dir: "src/kits/wear/features/drops-page", minPlan: "plus", kits: ["wear"], requires: ["drop", "pieces", "dropsPage"], needs: ["drop-line", "pieces"], page: "drops", js: true,
    summary: "Drops page: the next drop and its pieces, the reminder and restock lists (the brand's Google Forms), and past drops as an archive of their campaign photographs." },
  { id: "lookbook", dir: "src/kits/wear/features/lookbook", minPlan: "signature", kits: ["wear"], requires: ["lookbook", "pieces", "lookbookPage"], page: "lookbook", js: true,
    summary: "The lookbook: the season's campaign set as a printed book, spread by spread, with a contact sheet to jump between looks; tap a look to see each piece worn in it, its price and what's left." },
  { id: "piece-pages", dir: "src/kits/wear/features/piece-pages", minPlan: "signature", kits: ["wear"], requires: ["pieces", "stock", "shop"], needs: ["pieces"], page: "piece", js: true,
    summary: "A page for every piece: all its photographs, the price, what's left in each size, the fit table and how it sits, the fabric and care, and the looks it appears in." },
  { id: "size-run", section: "sizeRun", dir: "src/kits/wear/features/size-run", minPlan: "signature", kits: ["wear"], requires: ["pieces", "stock", "drop"], needs: ["pieces"], js: true,
    summary: "The size run: every size of every piece in the drop, emptying as the brand updates its sheet; the picture people screenshot on drop day. Hidden when the sheet is old." },
  { id: "wear-today", section: "today", dir: "src/kits/wear/features/wear-today", minPlan: "signature", kits: ["wear"], requires: ["weather", "pieces"], js: true,
    summary: "What to wear today: the brand's city right now from the Open-Meteo forecast (the brand's own paid plan; a demo shows an example), in one sentence, answered with the brand's own pieces for rain, wind, cold or a mild day." },
  { id: "kit-card", dir: "src/kits/wear/features/kit-card", minPlan: "signature", kits: ["wear"], requires: ["weather", "pieces"], needs: ["wear-today"], js: true,
    summary: "Kit card: today's weather and the kit for it drawn as a 9:16 picture with the brand's mark, saved to the phone for stories." },
  { id: "route-cards", dir: "src/kits/wear/features/route-cards", minPlan: "signature", kits: ["wear"], requires: ["club"], needs: ["club-page"], js: true,
    summary: "Route cards: each club route drawn from the club's own GPX points with its real distance and climb, saved as a picture to share." },
  { id: "drop-queue", dir: "src/kits/wear/features/drop-queue", minPlan: "signature", kits: ["wear"], requires: ["dropQueue", "drop"], needs: ["drop-line"], js: true,
    summary: "Drop-day line at the showroom: the number being served now from the staff's sheet, and how far away your ticket is; only on drop day and only while the sheet is fresh." },
];

/** Checks this kit's settings in site.json (runs for every site; it returns early for other kits). */
export const check = checkWear;

/**
 * What this kit adds to the site's Content-Security-Policy (src/core/lib/seo.js): `sheets` when it reads a published
 * Google Sheet, and any other sources.
 * @param {any} site @returns {import("../../features/registry.js").KitCsp}
 */
export function csp(site) {
  // Stock and the drop-day line from the brand's sheets; what to wear today from Open-Meteo's free forecast.
  const on = (/** @type {string} */ id) => site.features?.includes(id);
  const stock = site.stock?.source === "sheet" && ["pieces", "shop-page", "size-run", "piece-pages", "drops-page", "lookbook"].some(on);
  const line = site.dropQueue?.source === "sheet" && on("drop-queue");
  return { sheets: stock || line, connect: on("wear-today") && site.mode !== "demo" ? ["https://customer-api.open-meteo.com"] : [] }; // a demo calls nothing
}
