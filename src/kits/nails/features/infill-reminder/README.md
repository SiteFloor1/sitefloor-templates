# Infill reminder

| | |
|---|---|
| Feature id | `infill-reminder` |
| Plan | plus and above |
| Config | `infill` (`weeks`, `defaultWeeks`, `text`); `sections.infill` |

## How it works
The day of your set in, the gap you want (the salon's choices), and your infill's day in UK order with a calendar file.

## When something is missing or fails
Without JavaScript the salon's line shows. A day already passed gets no calendar file.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
