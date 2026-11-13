# Protection planner (PPF)

| | |
|---|---|
| Feature id | `protection-planner` |
| Plan | signature (or an add-on) |
| Config | `protection`: `{ "panels": [{ "id": "bonnet", "name": "Bonnet", "job": "ppf-bonnet" }], "packs": [{ "name": "Full front", "job": "ppf-full-front", "panels": ["bumper", "bonnet", …] }], "start": ["bonnet"]? }`; `jobs`, `vehicles`; `sections.protection` |
| Files | `protection-planner.njk`, `protection-planner.css`, `protection-planner.js`; panel shapes traced on the kit's photos in `src/kits/car/lib/bodies.js` (`PANEL_SHAPES`); pricing `planProtection` in `src/kits/car/lib/pricing.js` |

Panel ids the photos are traced for: `bumper`, `lights`, `bonnet`, `wings`, `mirrors`, `doors`, `sills`, `roof`, `quarters` (rear wings), `rear` (boot and rear bumper). Only the panels the studio lists are shown.

## How it works
The visitor taps panels on a real car photographed from above or from the side (or ticks them in the list, which is
the accessible control), or starts from one of the studio's packs (e.g. full front, or the whole car).
The price is the cheapest mix of the studio's own panel prices and packs for that vehicle size; a pack is used
whenever it costs less, even if it covers more than was picked, and the saving is shown. Times are the studio's own.

## When something is missing or fails
Without JavaScript the photo shows and the list is inactive; every price is on the Prices page.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
