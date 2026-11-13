# The journal

| | |
|---|---|
| Feature id | `care-journal` (pages `journal` and `journal-<slug>`) |
| Plan | signature; the whole journal counts as one page |
| Config | `journal`: `kicker?`, `title`, `intro`, `items`: `[{ slug, title, date, line, photo, body (paragraphs) }]` |
| Files | `care-journal.njk` (the index), `article.njk` (one piece), `care-journal.css`; pages `src/kits/detailing/pages/journal.njk`, `article.njk` |

## How it works
The newest piece large with its photograph, the rest as a ruled list with their dates; each piece is its own page at
reading width. Every word is the studio's own (or, on the demo, written for the demo and labelled so).
