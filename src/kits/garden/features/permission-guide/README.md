# Do I need permission?

| | |
|---|---|
| Feature id | `permission-guide` (page `permission.html`) |
| Plan | signature |
| Config | `planning`: `kicker`, `title`, `intro`, `nation` (`"england"`), `checked` (YYYY-MM-DD, the day the sources were read), `rows` (`{ q, a }`, at least two), `sources` (`{ label, url }`, government pages only: gov.uk, legislation.gov.uk or the Planning Portal), optional `note` |
| Files | `permission-guide.njk`, `.css` |

## How it works
The questions clients ask about fences, decking, garden rooms and paving the front garden, answered in plain words
from GOV.UK's householder permitted development guidance. The page always shows that it covers England only, the day
it was checked, its sources and "a guide, not a decision", and says when the rules differ (listed buildings, flats,
conservation areas, Article 4 areas). Validation refuses a source that isn't a government page.

## Notes
Re-check the sources at least once a year and update `checked`. Wales, Scotland and Northern Ireland have their own
rules: a studio there needs its own nation's rows and sources (not offered yet).
