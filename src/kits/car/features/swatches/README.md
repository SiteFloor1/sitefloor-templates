# Wrap swatch library

| | |
|---|---|
| Feature id | `swatches` |
| Plan | starter and above (the lower tier's easy showpiece) |
| Config | `wrap.colours` (`id`, `name`, `hex`), `wrap.finishes` (`id`: gloss / satin / matte / chrome, `name`, `note?` in the studio's own words); `sections.finish` |
| Files | `swatches.njk`, `swatches.css`, `swatches.js` |

## How it works
Like choosing a material sample: a large sample on one side, the studio's colours as small samples on the other.
Picking a finish changes how light sits on every sample; picking a colour opens it large. With the Showroom on
the site, "See it on the car" puts the same colour and finish on the 3D car.

Each sample is a flat chip like a page of a film maker's swatch book: the studio's colour with the light each
finish gives it (a sharp highlight for gloss, a soft one for satin, none for matte, mirror bands for chrome),
drawn in CSS (`.sw-tile` in `src/kits/car/kit.css`), so any client colour works with no pictures to download.

It shows how light sits on each finish, not an exact colour match: the section says so and invites people to
see the real swatches.

## When something is missing or fails
Without JavaScript every colour shows in the first finish, with a list of the finishes. An unknown finish id is
refused by the config check; the CSS would fall back to gloss.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
