# Menu page

| | |
|---|---|
| Feature id | `nail-menu` |
| Plan | plus and above |
| Config | `menuPage` (`kicker`, `title`, `intro?`, `policies?`: `{ title, text }`) |

## How it works
The menu page: the menu by the hour, then "Before you book" (removal, lateness, chips) in the salon's words. The look can move gel or BIAB, build your set, the infill reminder and reviews here.

## When something is missing or fails
Static HTML.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
