# Visit (hours + address)

| | |
|---|---|
| Feature id | `visit` |
| Plan | starter and above |
| Config | `hours`, `location` (address, `area`, `directionsUrl?`), `sections.visit` |
| Files | `visit.njk`, `visit.css` |

## How it works
Hours table rendered at build time from `hours.weekly`; holiday exceptions in the next 60 days listed under it. In the browser, core.js marks today's row and fills the live open/closed line.

## When something is missing or fails
Without JavaScript the full table and address still show; only the live line says "Opening hours".

## Notes
No map is drawn or embedded: a drawn map would put the pin in the same place for every business, and a Google Maps embed adds cookies and third-party scripts. The address panel sets the postcode large and "Open in Google Maps" uses `directionsUrl`, or a Google Maps search for the address if none is given.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
