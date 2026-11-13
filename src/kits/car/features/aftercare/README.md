# Aftercare page

| | |
|---|---|
| Feature id | `aftercare` |
| Plan | plus and above |
| Config | `aftercare.services` (shared with `aftercare-card`), `aftercarePage` (`kicker`, `title`, `intro?`) |
| Files | `aftercare.njk`, `aftercare.css`, `aftercare.js`; page template `src/kits/car/pages/aftercare.njk`; reminders from `../aftercare-card/reminders.js` |

## How it works
One block per kind of work (tint, wrap, PPF, ceramic…), its steps grouped into stages (on the day, first week,
first month, six months), all in the studio's own words. Each block has a fitting date and a button that saves
calendar reminders for its steps (9am studio time, written in UTC). Nothing is sent anywhere.

## When something is missing or fails
Without JavaScript the timelines show in full without dates or the calendar button.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
