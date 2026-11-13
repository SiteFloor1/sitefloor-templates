# Design, build and care pages

| | |
|---|---|
| Feature id | `design-build-care` (one page per item; a collection, counted as one page) |
| Plan | plus and above; needs `services` |
| Config | `servicePages.items`: `service` (a `whatWeDo.items` id), `slug`, `kicker`, `title`, `intro`, `description` (one sentence for search, up to 160 characters), `photo`, `body` (paragraphs separated by a blank line), optional `points` (`{ label, value }`, e.g. "Areas" / "London and Surrey") |
| Files | `design-build-care.njk` (one page: `sp` is its item), `.css`; the page template is `pages/service.njk` |

## How it works
A page each for design, build and care in the studio's own words, with the facts clients ask first (what's included,
areas, how it's charged). Each links on to the related page when that feature is on: design to the design process,
build to materials, care to maintenance plans.
