# The maintenance page

| | |
|---|---|
| Feature id | `maintenance-page` (page `maintenance`) |
| Config | `maintenancePage`: `{ kicker?, title, intro, photo?, body? }` (body: up to 8 paragraphs, the studio's words) |
| Files | `maintenance-page.njk` (the page's body), `maintenance-page.css`; the page template `src/kits/detailing/pages/maintenance.njk` |

Shows the maintenance plans and reminders, each only when its feature is on, then the home sections the look moves here with `onPages`
(`HOSTABLE` in `src/kits/detailing/home.js`). The opening is `src/kits/detailing/partials/page-head.njk`.
