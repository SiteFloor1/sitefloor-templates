# The studio's month

| | |
|---|---|
| Feature id | `garden-calendar` |
| Plan | starter and above |
| Config | `calendar.months`: twelve entries, January first: `headline` (`*word*` in italics), optional `intro`, and any of `design`, `build`, `planting`, `care` (a sentence each), optional `photo`. Optional `calendar.nextStart`: `design` and/or `build` (a month in words), `updated` (YYYY-MM-DD, the day it was checked), `staleAfterDays` (7–120; required on client sites) |
| Files | `garden-calendar.njk`, `.css`, `.js` |

## How it works
Shows what the studio is doing in the month that is open in the year above (`the-year` shares it), or the visitor's
month on its own. All twelve months are in the page, so it works without JavaScript (the build month shows).

The next design and build start is the studio's own line, kept fresh by hand. It shows only while `updated` is within
`staleAfterDays` of today, checked when the site is built and again in the visitor's browser; out of date, it hides
itself rather than show an old month as current.
