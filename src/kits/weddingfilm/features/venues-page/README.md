# Venues we've filmed (Signature)

| | |
|---|---|
| Feature id | `venues-page` (page `venues`; the same `venues` list feeds the films' venue chips) |
| Plan | signature |
| Config | `venues`: `kicker`, `title`, `intro`; `items`, each `{ id, name, area, lat, lon, tz?, text?, drone?, photo? }` (`drone` = the venue's own rule, in its words); `drone` (the UK rules in the studio's words) with `sources` (`{ label, url, checked }`, required when `drone` is given) |
| Files | `venues-page.njk`, `venues-page.css`; sources list `src/kits/weddingfilm/partials/sources.njk` |

Each venue the studio has filmed: its photograph, where it is, golden hour and sunset there at midsummer and in late
September (calculated for the venue's own coordinates, the next of each date after the build), its drone rule, and
the films made there. Venues are named only with the venue's agreement. The UK drone rules close the page, every one
with its source and the month it was checked.
