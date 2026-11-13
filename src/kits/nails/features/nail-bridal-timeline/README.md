# Bridal timeline

| | |
|---|---|
| Feature id | `nail-bridal-timeline` |
| Plan | signature and above |
| Config | `bridal.steps`; `sections.bridalTimeline` |

## How it works
One wedding date in (UK order), each step's day out, and every day still ahead in one calendar file of all-day events. The trial request carries the date.

## When something is missing or fails
Days already passed are marked and a line says so; without JavaScript the steps show in words.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
