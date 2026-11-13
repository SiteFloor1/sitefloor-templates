# How dark is dark (tint visualiser)

| | |
|---|---|
| Feature id | `driver-view` |
| Plan | signature (or an add-on) |
| Config | `tint.shades` (`id`, `name`, `light`: light through the glass as the studio fits it, `sheen?` for chameleon films), `vehicles` (which side photos to offer) and `tint.jobs` (which windows it tints); `sections.driverView` |
| Files | `driver-view.njk`, `driver-view.css`, `driver-view.js`; rules in `src/kits/car/lib/legality.js` |

## How it works
Like a film maker's simulator: a car of each size the studio lists (hatch, saloon, SUV, van), rendered side-on from the same
3D cars as the Showroom, with only its glass darkened through masks rendered from the same models. The front side
windows and the rear windows each take their own shade, so a customer sees, say, 70% on the front and 20% behind.
Under it, the view from the driver's seat through each window (front side, rear, windscreen), by day or at night,
real photos with the film laid over the glass only (traced in `src/kits/car/lib/bodies.js`). Each shade's darkness
comes from its own light figure (shown at 85% strength, because an eye adjusts); chameleon films add their colour
cast. Shades below the UK rule for a window are striped and the note under the rows says so for every window:
front side windows at least 70% and windscreen at least 75% (cars first used from 1 April 1985), no rule for rear
windows. Only the pictures shown first load with the page; another vehicle or the night photos load when picked.
A supercar has no side photo (the 3D Showroom covers it).

## When something is missing or fails
Without JavaScript the saloon shows with its starting shades and the day photos, and the rules are listed underneath.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
