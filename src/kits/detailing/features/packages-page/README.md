# The packages page

| | |
|---|---|
| Feature id | `packages-page` (page `packages`) |
| Config | `packagesPage`: `{ kicker?, title, intro, photo?, body? }` (body: up to 8 paragraphs, the studio's words) |
| Files | `packages-page.njk` (the page's body), `packages-page.css`; the page template `src/kits/detailing/pages/packages.njk` |

Shows the packages and the builder, each only when its feature is on, then the home sections the look moves here with `onPages`
(`HOSTABLE` in `src/kits/detailing/home.js`). The opening is `src/kits/detailing/partials/page-head.njk`.
