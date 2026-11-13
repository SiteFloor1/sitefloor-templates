# Aftercare reminder card

| | |
|---|---|
| Feature id | `aftercare-card` |
| Plan | starter and above |
| Config | `aftercare.services`: `[{ id, name, steps: [{ day, title, body }] }]`, the studio's own steps (`day` 0 is the fitting day); `sections.aftercareCard` |
| Files | `aftercare-card.njk`, `aftercare-card.css`, `aftercare-card.js`, `reminders.js` (shared with the `aftercare` page) |

## How it works
The customer picks the work they had done and the day it was fitted. Each step shows its date, and one button
saves a calendar file with a reminder at 9am (studio time) on every step's day after the fitting. Calendar times
are written in UTC, which every calendar app reads the same way. The file is made in the browser; nothing is sent
to the studio or to Sitefloor.

## When something is missing or fails
Without JavaScript every service's steps are listed (no dates, no calendar button).

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
