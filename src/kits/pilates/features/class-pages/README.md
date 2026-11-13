# Class pages

| | |
|---|---|
| Feature id | `class-pages` |
| Plan | signature (needs `timetable`) |
| Config | each `classTypes.items[]` also gets `who` (one line), `expect` (two or more lines on what happens), `photo` |
| Files | `class-page.njk` (the page body), `class-pages.njk` (no home section), `.js`, `.css`; pages `src/kits/pilates/pages/class.njk` (`class-<id>.html`) |

## How it works
A page per class: its photograph, who it's for, what happens, its next five times from the visitor's own clock (with
places and the waitlist when those are on), who teaches it (from the timetable, linked to their page with
`teacher-pages`) and the exercises it uses (with `method-library`). The class list on the home or classes page links
to each. Counts as one page however many classes there are.
