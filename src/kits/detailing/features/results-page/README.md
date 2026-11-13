# The before and after page

| | |
|---|---|
| Feature id | `results-page` (page `before-and-after`) |
| Config | `resultsPage`: `{ kicker?, title, intro, photo?, body? }` (body: up to 8 paragraphs, the studio's words) |
| Files | `results-page.njk` (the page's body), `results-page.css`; the page template `src/kits/detailing/pages/before-and-after.njk` |

Shows the studio's before-and-after pairs, each only when its feature is on, then the home sections the look moves here with `onPages`
(`HOSTABLE` in `src/kits/detailing/home.js`). The opening is `src/kits/detailing/partials/page-head.njk`.
