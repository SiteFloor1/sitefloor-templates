# The paint protection film page

| | |
|---|---|
| Feature id | `film-page` (page `paint-protection-film`) |
| Config | `filmPage`: `{ kicker?, title, intro, photo?, body? }` (body: up to 8 paragraphs, the studio's words) |
| Files | `film-page.njk` (the page's body), `film-page.css`; the page template `src/kits/detailing/pages/paint-protection-film.njk` |

Shows the coverages on the 3D car, and coating and film explained, each only when its feature is on, then the home sections the look moves here with `onPages`
(`HOSTABLE` in `src/kits/detailing/home.js`). The opening is `src/kits/detailing/partials/page-head.njk`.
