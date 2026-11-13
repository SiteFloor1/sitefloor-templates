# The aftercare page

| | |
|---|---|
| Feature id | `aftercare-page` (page `aftercare`) |
| Config | `aftercarePage`: `{ kicker?, title, intro, photo?, body? }` (body: up to 8 paragraphs, the studio's words) |
| Files | `aftercare-page.njk` (the page's body), `aftercare-page.css`; the page template `src/kits/detailing/pages/aftercare.njk` |

Shows the first wash and care, each only when its feature is on, then the home sections the look moves here with `onPages`
(`HOSTABLE` in `src/kits/detailing/home.js`). The opening is `src/kits/detailing/partials/page-head.njk`.
