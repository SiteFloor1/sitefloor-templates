# Shade on hand

| | |
|---|---|
| Feature id | `shade-on-hand` |
| Plan | signature and above |
| Config | each `hero.hands[].mask` (a grayscale PNG the same size as the photo, white on the nails) |

## How it works
Any house shade laid into the nails of the hero photo, on hands in different skin tones (the hand buttons). Each nail pixel takes the shade at the brightness the photo had there and the gloss stays white (`lib/shade.js`), so it reads as the same photo. The script is shade-hand's; this feature switches the masks on. Masks are drawn by hand per photo; see `sitefloor-internal/docs/design/verrall-photos/build.py`.

## When something is missing or fails
A photo or mask that won't load leaves the photographed shade. The demo's plan switcher hides the hands and the extra swatches below Signature.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
