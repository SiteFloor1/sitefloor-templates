# Window tint page

| | |
|---|---|
| Feature id | `tint-page` |
| Plan | plus and above (or an add-on) |
| Config | `tint` (shades and the tint jobs), `jobs`, `vehicles`, `tintPage`: `{ kicker, title, intro?, message, steps?: [{ title, body }], films?: [{ name, about, best? }], filmsNote? }`, questions with `topic: "Tint"` |
| Files | `tint-page.njk`, `tint-page.css`; page template `src/kits/car/pages/window-tint.njk` |

## What's on it
- **Every shade:** the same real side-window photo with each of the studio's films laid over the glass, marked
  "rear windows" and "front side windows" or "not on the front" from the gov.uk rule.
- **The law:** a car photo with the front and rear side windows marked, and the rules for each window from gov.uk
  (`src/kits/car/lib/legality.js`), with the date they were checked and a link.
- **How we fit it** and **our films**: the studio's own words. No heat-rejection or "cooler" figures unless the studio
  gives the film maker's spec sheet.
- **Prices:** every tint job for every vehicle size, with times, from `jobs`.
- **Questions** tagged `Tint`, and a link to the Showroom (if on) and WhatsApp.

## When something is missing or fails
Static HTML, no JavaScript. Sections without config (steps, films, tint questions) are left out.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
