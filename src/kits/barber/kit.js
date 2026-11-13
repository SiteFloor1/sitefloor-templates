// @ts-check
/**
 * The barber kit (barbers): everything the shared build needs to know about it, in one file.
 * src/features/registry.js finds this file by itself (every src/kits/<kit>/kit.js), so adding or changing this kit never
 * edits a shared file. What each export is for: docs/ARCHITECTURE.md, "A kit registers itself".
 */


/** The kit's own features, in the order their CSS and scripts load. @type {(import("../../features/registry.js").Feature|string)[]} */
export const features = [
  { id: "chair-board", section: "chairs", dir: "src/kits/barber/features/chair-board", minPlan: "signature", kits: ["barber"], requires: ["staff", "chairBoard"], js: true,
    summary: "Optional walk-in board: who is free now. Barbers update it from a Google Form; each card shows its last update; stale or missing data is never shown." },
  { id: "build-your-cut", section: "cut", dir: "src/kits/barber/features/build-your-cut", minPlan: "signature", kits: ["barber"], requires: ["services", "extras", "staff"], js: true,
    summary: "Cut builder with live price, time and a side-profile diagram; books through the shop's booking channel." },
  { id: "style-guide", dir: "src/kits/barber/features/style-guide", minPlan: "signature", kits: ["barber"], requires: ["styleGuide"], page: "style-guide", js: true,
    summary: "Article page: face-shape picker, six fades, clipper grades, how to ask." },
];

/** Shared features only some trades offer: this one does. */
export const uses = ["price-list", "price-page", "walk-in-queue", "fit-a-cut", "loyalty", "memberships", "before-after"];

/**
 * Live data: simulated on a demo (src/demo), the client's published Google Sheet otherwise.
 * @type {import("../../features/registry.js").Provider[]}
 */
export const providers = [
  {
    key: "chairBoard",
    local: "chairProvider", // the name it had before kits registered themselves; keeps the bundles byte-identical
    on: (site, enabled) => enabled.has("chair-board"),
    simulated: (site) => site.chairBoard?.source === "simulated",
    demo: { from: "src/demo/chair-provider.js", name: "simulatedProvider" },
    live: { from: "src/kits/barber/features/chair-board/sheet-provider.js", name: "sheetProvider" },
  },
];

/**
 * What this kit adds to the site's Content-Security-Policy (src/core/lib/seo.js): `sheets` when it reads a published
 * Google Sheet, and any other sources.
 * @param {any} site @returns {import("../../features/registry.js").KitCsp}
 */
export function csp(site) {
  return { sheets: site.chairBoard?.source === "sheet" }; // the chair board
}
