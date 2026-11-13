# The ceramic coating page

| | |
|---|---|
| Feature id | `coating-page` (page `ceramic-coating`) |
| Config | `coatingPage`: `{ kicker?, title, intro, photo?, body? }` (body: up to 8 paragraphs, the studio's words) |
| Files | `coating-page.njk` (the page's body), `coating-page.css`; the page template `src/kits/detailing/pages/ceramic-coating.njk` |

Shows coating and film explained, and the packages, each only when its feature is on, then the home sections the look moves here with `onPages`
(`HOSTABLE` in `src/kits/detailing/home.js`). The opening is `src/kits/detailing/partials/page-head.njk`.
