# The paint correction page

| | |
|---|---|
| Feature id | `correction-page` (page `paint-correction`) |
| Config | `correctionPage`: `{ kicker?, title, intro, photo?, body? }` (body: up to 8 paragraphs, the studio's words) |
| Files | `correction-page.njk` (the page's body), `correction-page.css`; the page template `src/kits/detailing/pages/paint-correction.njk` |

Shows correction on the 3D car, and before and after, each only when its feature is on, then the home sections the look moves here with `onPages`
(`HOSTABLE` in `src/kits/detailing/home.js`). The opening is `src/kits/detailing/partials/page-head.njk`.
